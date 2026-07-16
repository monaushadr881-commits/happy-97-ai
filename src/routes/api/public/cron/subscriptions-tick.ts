/**
 * HAPPY — Subscription Lifecycle Tick (R9)
 *
 * URL: POST /api/public/cron/subscriptions-tick
 *
 * Advances time-driven transitions:
 *   - trial      whose trial_ends_at <= now                 → payment_failed (past_due, grace)
 *   - past_due   older than GRACE_DAYS since trial_ends_at
 *                or current_period_end                       → expire
 *   - active     with cancel_at <= now                       → cancel
 *   - active     with current_period_end < now and
 *                auto_renew = false                          → expire
 *
 * Everything routes through the lifecycle engine so state, events, audit,
 * and notifications stay consistent with webhook-driven transitions.
 */
import { createFileRoute } from "@tanstack/react-router";
import { transitionSubscription } from "@/lib/subscriptions/lifecycle";
import { assertCronAuth } from "@/lib/security/cron-auth";

const GRACE_DAYS = 7;
const BATCH = 100;

interface Row {
  id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  auto_renew: boolean;
}

async function tick(): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();
  const graceCutoff = new Date(Date.now() - GRACE_DAYS * 86_400_000).toISOString();

  const results: Array<{ id: string; action: string; ok: boolean; reason?: string }> = [];

  async function run(action: "payment_failed" | "expire" | "cancel", row: Row) {
    const r = await transitionSubscription(supabaseAdmin, {
      subscriptionId: row.id, action, actorId: null,
      metadata: { source: "cron_tick", at: nowIso },
    });
    results.push({ id: row.id, action, ok: r.ok, reason: r.reason });
  }

  // 1) trials that ended → past_due (grace)
  const { data: trials } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, trial_ends_at, current_period_end, cancel_at, auto_renew")
    .eq("status", "trial").lte("trial_ends_at", nowIso).limit(BATCH) as unknown as { data: Row[] | null };
  for (const r of trials ?? []) await run("payment_failed", r);

  // 2) past_due beyond grace → expire
  const { data: overdue } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, trial_ends_at, current_period_end, cancel_at, auto_renew")
    .eq("status", "past_due").lte("updated_at", graceCutoff).limit(BATCH) as unknown as { data: Row[] | null };
  for (const r of overdue ?? []) await run("expire", r);

  // 3) active with cancel_at hit → cancel
  const { data: dueCancel } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, trial_ends_at, current_period_end, cancel_at, auto_renew")
    .in("status", ["active", "trial", "past_due"])
    .not("cancel_at", "is", null).lte("cancel_at", nowIso).limit(BATCH) as unknown as { data: Row[] | null };
  for (const r of dueCancel ?? []) await run("cancel", r);

  // 4) active whose period ended and auto_renew off → expire
  const { data: nonRenew } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, trial_ends_at, current_period_end, cancel_at, auto_renew")
    .eq("status", "active").eq("auto_renew", false)
    .not("current_period_end", "is", null).lte("current_period_end", nowIso)
    .limit(BATCH) as unknown as { data: Row[] | null };
  for (const r of nonRenew ?? []) await run("expire", r);

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/cron/subscriptions-tick")({
  server: {
    handlers: {
      GET: async ({ request }) => assertCronAuth(request) ?? tick(),
      POST: async ({ request }) => assertCronAuth(request) ?? tick(),
    },
  },
});
