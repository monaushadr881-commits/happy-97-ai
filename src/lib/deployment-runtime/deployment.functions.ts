/**
 * R61 — Universal Deployment Runtime server functions.
 * All admin-gated via has_role('admin'). Never invokes native toolchains.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdapter } from "./adapters";
import type { BuildChannel, PlatformCode } from "./contracts";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await (context.supabase as any).rpc("has_role", {
    _user_id: context.userId, _role: "admin",
  });
  if (error) throw new Error(`role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listPlatforms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("deploy_platform_registry")
      .select("*")
      .order("category", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCompatibilityMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("deploy_platform_registry")
      .select("platform_code, display_name, adapter, category, readiness_state, required_dependencies, enabled");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => {
      const adapter = getAdapter(row.platform_code as PlatformCode);
      const plan = adapter.plan();
      return {
        ...row,
        can_execute_here: plan.can_execute_here,
        adapter_blocked_reason: plan.blocked_reason ?? null,
        steps: plan.steps,
      };
    });
  });

export const startBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    platform_code: z.string().min(1),
    channel: z.enum(["production", "staging", "testing", "development"]),
    version: z.string().min(1).max(64),
    git_sha: z.string().max(64).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "startBuild", source: "api", module: "deploy.runtime.startBuild" });
    await assertAdmin(context);
    const adapter = getAdapter(data.platform_code as PlatformCode);

    const validation = await adapter.validate();
    const plan = adapter.plan();

    // Insert build row
    const { data: buildRow, error: insErr } = await (context.supabase as any)
      .from("deploy_builds")
      .insert({
        platform_code: data.platform_code,
        channel: data.channel,
        version: data.version,
        git_sha: data.git_sha ?? null,
        status: "running",
        started_by: context.userId,
        metadata: JSON.parse(JSON.stringify({ plan, validation })) as any,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    // Execute (honest — native adapters return blocked)
    const result = await adapter.execute({
      channel: data.channel as BuildChannel,
      version: data.version,
    });

    // Persist artifacts
    if (result.artifacts.length) {
      const rows = result.artifacts.map((a) => ({
        build_id: buildRow.id as string,
        kind: a.kind,
        filename: a.filename,
        size_bytes: a.size_bytes,
        sha256: a.sha256 ?? null,
        storage_url: a.storage_url ?? null,
        signed: !!a.signed,
        signing_identity: a.signing_identity ?? null,
        metadata: JSON.parse(JSON.stringify(a.metadata ?? {})) as any,
      }));
      const { error: artErr } = await (context.supabase as any).from("deploy_artifacts").insert(rows as any);
      if (artErr) throw new Error(artErr.message);
    }


    // Finalize build row
    const { error: updErr } = await (context.supabase as any)
      .from("deploy_builds")
      .update({
        status: result.status,
        blocked_reason: result.blocked_reason ?? null,
        logs_url: result.logs_url ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", buildRow.id);
    if (updErr) throw new Error(updErr.message);

    return { build_id: buildRow.id as string, status: result.status, artifacts: result.artifacts };
  });

export const getBuild = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: build, error } = await (context.supabase as any)
      .from("deploy_builds").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: artifacts } = await (context.supabase as any)
      .from("deploy_artifacts").select("*").eq("build_id", data.id);
    return { build, artifacts: artifacts ?? [] };
  });

export const listBuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    platform_code: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = (context.supabase as any)
      .from("deploy_builds").select("*")
      .order("started_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.platform_code) q = q.eq("platform_code", data.platform_code);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? []);

export const getStoreReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("deploy_store_readiness").select("*").order("store", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? []);

export const refreshStoreReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "refreshStoreReadiness", source: "api", module: "deploy.runtime.refreshStoreReadiness" });
    await assertAdmin(context);
    // Honest check: look for known env vars per store.
    const checks = [
      { store: "google_play",     required: ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_UPLOAD_KEYSTORE"] },
      { store: "app_store",       required: ["APP_STORE_CONNECT_API_KEY", "APPLE_TEAM_ID"] },
      { store: "microsoft_store", required: ["MICROSOFT_PARTNER_CENTER_TOKEN", "WINDOWS_CODESIGN_CERT"] },
      { store: "web",             required: [] },
    ];
    const now = new Date().toISOString();
    for (const c of checks) {
      const missing = c.required.filter((k) => !process.env[k]);
      const status = missing.length ? "blocked" : (c.store === "web" ? "ready" : "ready");
      await (context.supabase as any).from("deploy_store_readiness").update({
        status,
        missing_dependencies: missing,
        last_checked_at: now,
      }).eq("store", c.store);
    }
    const { data } = await (context.supabase as any)
      .from("deploy_store_readiness").select("*").order("store", { ascending: true });
    return data ?? [];
  });
