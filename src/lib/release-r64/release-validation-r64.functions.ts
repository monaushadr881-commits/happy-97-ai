/** R64.3 — Release validation & automation checks. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";
import { runAllChecks, readinessScore, generateReleaseNotes, generateChangelog, rollbackRecommendation } from "./automation";
import { storeReadiness } from "./store-monitors";
import type { StoreCode } from "./contracts";

export const validateRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "validateRelease", source: "api", module: "release.validation.validateRelease" });
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const [rel, arts, signing, submissions, priorList] = await Promise.all([
      sb.from("release_records").select("*").eq("id", data.release_id).single(),
      sb.from("release_artifact_registry").select("kind,sha256,storage_url,validation_status").eq("release_id", data.release_id),
      sb.from("release_signing_profiles").select("id").limit(1),
      sb.from("release_store_submissions").select("store").eq("release_id", data.release_id),
      sb.from("release_records").select("version,created_at").order("created_at", { ascending: false }).limit(2),
    ]);
    if (rel.error) throw new Error(rel.error.message);
    const stores = ((submissions.data ?? []) as any[]).map((s) => s.store as StoreCode);
    const readiness = stores.map((s) => storeReadiness(s));
    const prior = ((priorList.data ?? []) as any[]).find((r) => r.version !== rel.data.version)?.version ?? null;

    const checks = runAllChecks({
      version: rel.data.version,
      channel: rel.data.channel,
      release_notes: rel.data.release_notes,
      artifacts: (arts.data ?? []) as any[],
      signing_profile_present: (signing.data ?? []).length > 0,
      stores_targeted: stores,
      store_readiness: readiness as any,
      prior_version: prior,
    });
    const score = readinessScore(checks);

    // Persist checks
    for (const c of checks) {
      await sb.from("release_automation_checks").insert({
        release_id: data.release_id, check_kind: c.kind, status: c.status,
        detail: { detail: c.detail, hint: c.hint }, actor_id: context.userId,
      });
    }
    await writeAudit(context, { category: "release", action: "validated", entity_type: "release_records", entity_id: data.release_id, metadata: { score } });
    return { checks, score, store_readiness: readiness };
  });

export const listChecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("release_automation_checks").select("*").eq("release_id", data.release_id).order("checked_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { checks: rows ?? [] };
  });

export const buildReleaseNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ version: z.string(), changes: z.array(z.string()).min(1), channel: z.string().optional() }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "buildReleaseNotes", source: "api", module: "release.validation.buildReleaseNotes" });
    await assertOpsAdminR64(context);
    return { notes: generateReleaseNotes(data) };
  });

export const buildChangelog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ entries: z.array(z.object({ version: z.string(), date: z.string(), changes: z.array(z.string()) })) }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "buildChangelog", source: "api", module: "release.validation.buildChangelog" });
    await assertOpsAdminR64(context);
    return { changelog: generateChangelog(data.entries) };
  });

export const rollbackAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "rollbackAdvice", source: "api", module: "release.validation.rollbackAdvice" });
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: rows } = await sb.from("release_store_metrics").select("crash_free_rate,anr_rate,rating_avg").eq("release_id", data.release_id).order("snapshot_at", { ascending: false }).limit(1);
    const m = (rows ?? [])[0] ?? {};
    return rollbackRecommendation(m);
  });
