/**
 * R63 — Release & Store Automation server functions.
 * All admin-gated. No secret material stored. Never fabricates store submission.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bumpSemver, parseSemver, formatSemver, compareSemver, type BumpKind } from "./semver";
import { ALL_STORES, getStoreAdapter } from "./store-adapters";
import type { ChangelogCategory, ReleaseChannel, StoreCode } from "./contracts";

async function assertOpsAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId, _role: "admin",
  });
  if (error) throw new Error(`role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}

/* ----- Version ops ----- */
export const bumpVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      current: z.string().min(1),
      kind: z.enum(["major", "minor", "patch", "hotfix", "rc"]),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    const next = bumpSemver(data.current, data.kind as BumpKind);
    return { current: formatSemver(parseSemver(data.current)), next };
  });

/* ----- Release CRUD ----- */
export const createRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      version: z.string().min(1).max(64),
      channel: z.enum(["rc", "beta", "stable", "lts", "hotfix"]),
      release_notes: z.string().max(20000).optional(),
      compatibility: z.record(z.string(), z.any()).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    parseSemver(data.version); // validate
    const { data: row, error } = await (context.supabase as any)
      .from("release_records")
      .insert({
        version: data.version,
        channel: data.channel,
        released_by: context.userId,
        release_notes: data.release_notes ?? null,
        compatibility: data.compatibility ?? {},
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listReleases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("release_records")
      .select("id, version, channel, status, released_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).sort((a: any, b: any) => compareSemver(b.version, a.version));
  });

/* ----- Changelog ----- */
export const addChangelogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid(),
      category: z.enum(["feature", "fix", "security", "breaking", "known_issue", "deprecated", "performance"]),
      summary: z.string().min(1).max(500),
      detail: z.string().max(10000).optional(),
      reference_url: z.string().url().max(2000).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    const { data: row, error } = await (context.supabase as any)
      .from("release_changelog_entries")
      .insert({
        release_id: data.release_id,
        category: data.category as ChangelogCategory,
        summary: data.summary,
        detail: data.detail ?? null,
        reference_url: data.reference_url ?? null,
        authored_by: context.userId,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateReleaseNotesMarkdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    const [rel, entries] = await Promise.all([
      (context.supabase as any).from("release_records").select("*").eq("id", data.release_id).single(),
      (context.supabase as any).from("release_changelog_entries").select("*")
        .eq("release_id", data.release_id).order("created_at", { ascending: true }),
    ]);
    if (rel.error) throw new Error(rel.error.message);
    if (entries.error) throw new Error(entries.error.message);
    const buckets: Record<string, any[]> = {};
    for (const e of entries.data ?? []) (buckets[e.category] ||= []).push(e);
    const order: ChangelogCategory[] = ["breaking", "security", "feature", "performance", "fix", "deprecated", "known_issue"];
    const labels: Record<ChangelogCategory, string> = {
      feature: "Features", fix: "Fixes", security: "Security", breaking: "Breaking Changes",
      known_issue: "Known Issues", deprecated: "Deprecated", performance: "Performance",
    };
    let md = `# Release ${rel.data.version} (${rel.data.channel})\n\n`;
    if (rel.data.release_notes) md += `${rel.data.release_notes}\n\n`;
    for (const cat of order) {
      const items = buckets[cat];
      if (!items?.length) continue;
      md += `## ${labels[cat]}\n\n`;
      for (const it of items) {
        md += `- ${it.summary}`;
        if (it.reference_url) md += ` ([ref](${it.reference_url}))`;
        md += "\n";
        if (it.detail) md += `  \n  ${it.detail}\n`;
      }
      md += "\n";
    }
    return { markdown: md, entry_count: entries.data?.length ?? 0 };
  });

/* ----- Store validation & submission ----- */
export const validateReleaseForStores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid(),
      stores: z.array(z.string()).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    const { data: rel, error } = await (context.supabase as any)
      .from("release_records").select("*").eq("id", data.release_id).single();
    if (error) throw new Error(error.message);
    const stores = (data.stores?.length ? data.stores : ALL_STORES) as StoreCode[];
    const results = [];
    for (const s of stores) {
      const adapter = getStoreAdapter(s);
      const report = await adapter.validate({ version: rel.version, channel: rel.channel as ReleaseChannel });
      const plan = adapter.submissionPlan();
      const status = report.ok && plan.can_submit_here ? "ready" : "blocked";
      const { error: upErr } = await (context.supabase as any)
        .from("release_store_submissions")
        .upsert({
          release_id: data.release_id,
          store: s,
          status,
          validation_report: report as any,
          missing_requirements: report.missing_requirements as any,
        }, { onConflict: "release_id,store" });
      if (upErr) throw new Error(upErr.message);
      results.push({ store: s, status, report, plan });
    }
    return { release_id: data.release_id, results };
  });

export const listStoreSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    const { data: rows, error } = await (context.supabase as any)
      .from("release_store_submissions").select("*")
      .eq("release_id", data.release_id).order("store");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ----- Rollback ----- */
export const initiateRollback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      from_release_id: z.string().uuid(),
      to_release_id: z.string().uuid(),
      reason: z.string().min(1).max(2000),
      severity: z.enum(["standard", "emergency"]).default("standard"),
      stores_affected: z.array(z.string()).default([]),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdmin(context);
    if (data.from_release_id === data.to_release_id) {
      throw new Error("from_release_id and to_release_id must differ");
    }
    const { data: row, error } = await (context.supabase as any)
      .from("release_rollbacks")
      .insert({
        from_release_id: data.from_release_id,
        to_release_id: data.to_release_id,
        reason: data.reason,
        severity: data.severity,
        stores_affected: data.stores_affected,
        initiated_by: context.userId,
        status: "initiated",
      })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ----- Signing profile registry (metadata only, NO key material) ----- */
export const listSigningProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("release_signing_profiles").select("*").order("platform_code");
    if (error) throw new Error(error.message);
    return (data ?? []).map((p: any) => ({
      ...p,
      env_present: p.env_var_name ? !!process.env[p.env_var_name] : false,
    }));
  });

/* ----- Analytics ----- */
export const getReleaseAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context);
    const [releases, subs, rollbacks] = await Promise.all([
      (context.supabase as any).from("release_records").select("id, status, created_at"),
      (context.supabase as any).from("release_store_submissions").select("status, store"),
      (context.supabase as any).from("release_rollbacks").select("id, severity, created_at"),
    ]);
    const relRows = releases.data ?? [];
    const subRows = subs.data ?? [];
    const rlbRows = rollbacks.data ?? [];
    const byStatus = (rows: any[], key: string) =>
      rows.reduce((acc: Record<string, number>, r) => { acc[r[key]] = (acc[r[key]] ?? 0) + 1; return acc; }, {});
    return {
      total_releases: relRows.length,
      releases_by_status: byStatus(relRows, "status"),
      submissions_by_status: byStatus(subRows, "status"),
      submissions_by_store: byStatus(subRows, "store"),
      total_rollbacks: rlbRows.length,
      emergency_rollbacks: rlbRows.filter((r: any) => r.severity === "emergency").length,
    };
  });
