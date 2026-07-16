/** R64.2 — Build pipeline. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";
import { canTransition, toolchainAvailability, priorityFor } from "./pipeline";

export const listBuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid().optional(), status: z.string().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    let q = sb.from("build_pipeline_runs").select("*").order("queued_at", { ascending: false }).limit(200);
    if (data.release_id) q = q.eq("release_id", data.release_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { builds: rows ?? [] };
  });

export const queueBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid().optional(),
      platform_code: z.string().min(1),
      build_kind: z.enum(["incremental", "clean", "nightly", "manual", "scheduled"]).default("manual"),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const tc = toolchainAvailability(data.platform_code);
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("build_pipeline_runs").insert({
      release_id: data.release_id ?? null,
      platform_code: data.platform_code,
      status: tc.available ? "queued" : "blocked",
      priority: priorityFor(data.build_kind as any),
      build_kind: data.build_kind,
      blocked_reason: tc.available ? null : `Toolchain unavailable: ${tc.missing.join(", ")}`,
      requested_by: context.userId,
      metadata: { toolchain_missing: tc.missing },
    }).select().single();
    if (error) throw new Error(error.message);
    await sb.from("build_pipeline_events").insert({
      run_id: row.id,
      event_type: tc.available ? "queued" : "blocked",
      message: tc.available ? "queued for build" : `blocked: ${tc.missing.join(", ")}`,
      actor_id: context.userId,
    });
    await writeAudit(context, { category: "release", action: "build_queued", entity_type: "build_pipeline_runs", entity_id: row.id });
    return { build: row, toolchain: tc };
  });

export const transitionBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      run_id: z.string().uuid(),
      to: z.enum(["queued", "running", "succeeded", "failed", "cancelled", "blocked"]),
      note: z.string().max(2000).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: cur, error: e1 } = await sb.from("build_pipeline_runs").select("*").eq("id", data.run_id).single();
    if (e1) throw new Error(e1.message);
    if (!canTransition(cur.status, data.to)) {
      throw new Error(`invalid transition ${cur.status} → ${data.to}`);
    }
    const patch: any = { status: data.to };
    if (data.to === "running") patch.started_at = new Date().toISOString();
    if (["succeeded", "failed", "cancelled"].includes(data.to)) {
      patch.finished_at = new Date().toISOString();
      if (cur.started_at) patch.duration_ms = Date.now() - new Date(cur.started_at).getTime();
    }
    const { error: e2 } = await sb.from("build_pipeline_runs").update(patch).eq("id", data.run_id);
    if (e2) throw new Error(e2.message);
    await sb.from("build_pipeline_events").insert({
      run_id: data.run_id, event_type: `transition.${data.to}`, message: data.note ?? null, actor_id: context.userId,
    });
    return { ok: true };
  });

export const listBuildEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ run_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("build_pipeline_events").select("*").eq("run_id", data.run_id).order("created_at").limit(500);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });
