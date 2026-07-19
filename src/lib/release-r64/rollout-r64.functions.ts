/** R64.6 — Rollout state machine. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";
import { canRolloutTransition, nextRolloutStep, validateRolloutPercent } from "./rollout";
import { STORE_CODES } from "./contracts";
import { requireApproval } from "@/lib/founder/enforce";

// R183 — high-risk destructive rollout transitions must be Founder-approved.
const R183_DESTRUCTIVE = new Set(["rolled_back", "cancelled"]);


export const listRollouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    let q = sb.from("release_rollouts").select("*").order("updated_at", { ascending: false }).limit(200);
    if (data.release_id) q = q.eq("release_id", data.release_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rollouts: rows ?? [] };
  });

export const createRollout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid(),
      store: z.enum(STORE_CODES as [string, ...string[]]),
      target_percent: z.number().int().min(0).max(100).default(100),
      country_scope: z.array(z.string()).optional(),
      company_id: z.string().uuid(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    if (!validateRolloutPercent(data.target_percent)) throw new Error("target_percent must be 0/1/5/10/20/50/100");
    // R183 — creating a production rollout is a deploy-tier change.
    const enforcement = await requireApproval(context as any, {
      action: "release.rollout_create",
      entityType: "release_rollouts",
      entityId: data.release_id,
      companyId: data.company_id,
      descriptor: { kind: "deploy", action: "rollout_create", affectsProduction: true, securityImpact: "medium" },
      brain: {
        company_id: data.company_id,
        input: `create ${data.target_percent}% rollout on ${data.store} for release ${data.release_id}`,
        source: "automation",
        module: "release",
      },
    });
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("release_rollouts").insert({
      release_id: data.release_id,
      store: data.store,
      target_percent: data.target_percent,
      state: "planned",
      country_scope: data.country_scope ?? [],
      updated_by: context.userId,
    }).select().single();
    if (error) throw new Error(error.message);
    await sb.from("release_rollout_events").insert({
      rollout_id: row.id, to_state: "planned", to_percent: 0, actor_id: context.userId,
      reason: `approval:${enforcement.approvalId}`,
    });
    await writeAudit(context, { category: "release", action: "rollout_created", entity_id: row.id, metadata: { approval_id: enforcement.approvalId, tier: enforcement.tier } });
    return { rollout: row, enforcement: { tier: enforcement.tier, approval_id: enforcement.approvalId } };
  });

export const advanceRollout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ rollout_id: z.string().uuid() }).parse(raw))

  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: cur, error } = await sb.from("release_rollouts").select("*").eq("id", data.rollout_id).single();
    if (error) throw new Error(error.message);
    if (cur.state !== "active" && cur.state !== "planned") throw new Error(`rollout is ${cur.state}, cannot advance`);
    const next = nextRolloutStep(cur.current_percent ?? 0, cur.target_percent ?? 100);
    if (next === null) return { done: true, current_percent: cur.current_percent };
    const newState = next >= (cur.target_percent ?? 100) ? "completed" : "active";
    await sb.from("release_rollouts").update({ current_percent: next, state: newState, updated_by: context.userId }).eq("id", data.rollout_id);
    await sb.from("release_rollout_events").insert({
      rollout_id: data.rollout_id, from_state: cur.state, to_state: newState,
      from_percent: cur.current_percent, to_percent: next, actor_id: context.userId,
    });
    return { done: newState === "completed", current_percent: next, state: newState };
  });

export const transitionRollout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      rollout_id: z.string().uuid(),
      to: z.enum(["active", "paused", "cancelled", "rolled_back", "completed"]),
      reason: z.string().max(500).optional(),
      company_id: z.string().uuid().optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: cur, error } = await sb.from("release_rollouts").select("*").eq("id", data.rollout_id).single();
    if (error) throw new Error(error.message);
    if (!canRolloutTransition(cur.state, data.to)) throw new Error(`invalid rollout transition ${cur.state} → ${data.to}`);
    // R183 — destructive transitions (rollback / cancel) require Founder approval.
    let approvalMeta: { approval_id: string; tier: string } | null = null;
    if (R183_DESTRUCTIVE.has(data.to)) {
      if (!data.company_id) throw new Error("company_id is required for destructive rollout transitions (R183)");
      const enforcement = await requireApproval(context as any, {
        action: `release.rollout_${data.to}`,
        entityType: "release_rollouts",
        entityId: data.rollout_id,
        companyId: data.company_id,
        descriptor: { kind: "deploy", action: `rollout_${data.to}`, affectsProduction: true, securityImpact: "high" },
        brain: {
          company_id: data.company_id,
          input: `${data.to} rollout ${data.rollout_id}${data.reason ? ": " + data.reason : ""}`,
          source: "automation",
          module: "release",
        },
      });
      approvalMeta = { approval_id: enforcement.approvalId, tier: enforcement.tier };
    }
    await sb.from("release_rollouts").update({ state: data.to, updated_by: context.userId }).eq("id", data.rollout_id);
    await sb.from("release_rollout_events").insert({
      rollout_id: data.rollout_id, from_state: cur.state, to_state: data.to,
      from_percent: cur.current_percent, to_percent: data.to === "rolled_back" ? 0 : cur.current_percent,
      reason: data.reason ?? null, actor_id: context.userId,
    });
    await writeAudit(context, { category: "release", action: `rollout_${data.to}`, entity_id: data.rollout_id, metadata: approvalMeta });
    return { ok: true, enforcement: approvalMeta };
  });




export const listRolloutEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ rollout_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("release_rollout_events").select("*").eq("rollout_id", data.rollout_id).order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });
