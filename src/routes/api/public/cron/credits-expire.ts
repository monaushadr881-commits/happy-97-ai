/**
 * R11 — Credits Expiry Sweep (cron)
 *
 * URL: POST /api/public/cron/credits-expire
 * Auth: Supabase anon apikey header (matches schedule-jobs pattern).
 *
 * Wire from pg_cron with:
 *   SELECT cron.schedule('happy-credits-expire','[*]/15 * * * *',$$
 *     SELECT net.http_post(
 *       url:='https://<host>/api/public/cron/credits-expire',
 *       headers:='{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
 *       body:='{}'::jsonb);
 *   $$);
 */
import { createFileRoute } from "@tanstack/react-router";
import { expireDueGrants } from "@/lib/credits/engine";
import { assertCronAuth } from "@/lib/security/cron-auth";

async function run(): Promise<Response> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out = await expireDueGrants(supabaseAdmin);
    return new Response(JSON.stringify({ ok: true, ...out }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/cron/credits-expire")({
  server: {
    handlers: {
      GET: async ({ request }) => assertCronAuth(request) ?? run(),
      POST: async ({ request }) => assertCronAuth(request) ?? run(),
    },
  },
});
