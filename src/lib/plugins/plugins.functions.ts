/**
 * R36 Plugin Framework — server functions (RPCs).
 *
 * All lifecycle operations run under the authenticated user's Supabase client;
 * RLS enforces platform-ops vs. company-admin boundaries. No service_role is
 * used here.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  PluginManifestSchema,
  computeChecksum,
  compareSemver,
  emitPluginEvent,
  evaluateGrant,
  validateManifest,
  type PluginManifest,
} from "./engine";

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const listPlugins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; category?: string; search?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("plugins")
      .select("id, slug, name, description, publisher, category, status, verified, latest_version_id, tags, icon_url, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("category", data.category);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { plugins: rows ?? [] };
  });

export const getPlugin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: plugin, error } = await context.supabase
      .from("plugins")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!plugin) return { plugin: null, versions: [], grants: [] };
    const { data: versions } = await context.supabase
      .from("plugin_versions")
      .select("*")
      .eq("plugin_id", plugin.id)
      .order("created_at", { ascending: false });
    const { data: grants } = await context.supabase
      .from("plugin_grants")
      .select("*")
      .in("plugin_version_id", (versions ?? []).map((v) => v.id));
    return { plugin, versions: versions ?? [], grants: grants ?? [] };
  });

// ─── Publish (ops-only via RLS) ──────────────────────────────────────────────

export const publishPluginVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { manifest: unknown }) => d)
  .handler(async ({ data, context }) => {
    const manifest: PluginManifest = validateManifest(data.manifest);
    const checksum = await computeChecksum(manifest);

    // upsert plugin row
    const { data: existing } = await context.supabase
      .from("plugins")
      .select("id")
      .eq("slug", manifest.slug)
      .maybeSingle();

    let pluginId = existing?.id as string | undefined;
    if (!pluginId) {
      const { data: created, error } = await context.supabase
        .from("plugins")
        .insert({
          slug: manifest.slug,
          name: manifest.name,
          description: manifest.description ?? null,
          publisher: manifest.publisher,
          publisher_url: manifest.publisher_url ?? null,
          category: manifest.category,
          homepage_url: manifest.homepage_url ?? null,
          icon_url: manifest.icon_url ?? null,
          tags: manifest.tags,
          status: "draft",
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      pluginId = created.id;
    }

    // insert version
    const { data: version, error: verr } = await context.supabase
      .from("plugin_versions")
      .insert({
        plugin_id: pluginId,
        version: manifest.version,
        manifest: manifest as any,
        entry_point: manifest.entry_point ?? null,
        runtime: manifest.runtime,
        checksum,
        changelog: manifest.changelog ?? null,
        min_platform_version: manifest.min_platform_version ?? null,
        published_at: new Date().toISOString(),
        published_by: context.userId,
      })
      .select("*")
      .single();
    if (verr) throw verr;

    // insert grants
    if (manifest.permissions.length > 0) {
      await context.supabase.from("plugin_grants").insert(
        manifest.permissions.map((p) => ({
          plugin_version_id: version.id,
          permission_code: p.code,
          reason: p.reason ?? null,
          optional: p.optional,
        })),
      );
    }

    // update latest pointer (highest semver among non-deprecated)
    const { data: allVersions } = await context.supabase
      .from("plugin_versions")
      .select("id, version, deprecated")
      .eq("plugin_id", pluginId);
    const active = (allVersions ?? []).filter((v) => !v.deprecated);
    active.sort((a, b) => compareSemver(a.version, b.version));
    const latest = active[active.length - 1];

    await context.supabase
      .from("plugins")
      .update({ latest_version_id: latest?.id ?? version.id, status: "published" })
      .eq("id", pluginId);

    await emitPluginEvent(context.supabase, {
      plugin_id: pluginId,
      plugin_version_id: version.id,
      event_type: "installed",
      severity: "info",
      actor_id: context.userId,
      message: `Plugin version ${manifest.version} published`,
      metadata: { checksum },
    });

    return { plugin_id: pluginId, version };
  });

// ─── Install lifecycle ───────────────────────────────────────────────────────

const InstallInput = z.object({
  company_id: z.string().uuid(),
  plugin_id: z.string().uuid(),
  version_id: z.string().uuid().optional(),
  granted_permissions: z.array(z.string()).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const installPlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InstallInput>) => InstallInput.parse(d))
  .handler(async ({ data, context }) => {
    // Resolve version
    let versionId = data.version_id;
    if (!versionId) {
      const { data: plugin } = await context.supabase
        .from("plugins")
        .select("latest_version_id")
        .eq("id", data.plugin_id)
        .single();
      versionId = plugin?.latest_version_id ?? undefined;
    }
    if (!versionId) throw new Error("no_available_version");

    // Validate grant coverage
    const { data: requested } = await context.supabase
      .from("plugin_grants")
      .select("permission_code, optional")
      .eq("plugin_version_id", versionId);
    const evalResult = evaluateGrant(
      (requested ?? []).map((r) => ({ code: r.permission_code, optional: r.optional })),
      data.granted_permissions,
    );
    if (!evalResult.ok) {
      throw new Error(`missing_required_permissions: ${evalResult.missing_required.join(",")}`);
    }

    const { data: install, error } = await context.supabase
      .from("plugin_installations")
      .upsert(
        {
          company_id: data.company_id,
          plugin_id: data.plugin_id,
          plugin_version_id: versionId,
          status: "installed",
          enabled: true,
          config: data.config as any,
          granted_permissions: data.granted_permissions,
          installed_by: context.userId,
        },
        { onConflict: "company_id,plugin_id" },
      )
      .select("*")
      .single();
    if (error) throw error;

    await emitPluginEvent(context.supabase, {
      installation_id: install.id,
      company_id: install.company_id,
      plugin_id: install.plugin_id,
      plugin_version_id: install.plugin_version_id,
      event_type: "installed",
      actor_id: context.userId,
      message: "Plugin installed",
      metadata: { granted: data.granted_permissions },
    });

    return { installation: install };
  });

const InstallIdInput = z.object({ installation_id: z.string().uuid() });

export const enablePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InstallIdInput>) => InstallIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: install, error } = await context.supabase
      .from("plugin_installations")
      .update({ enabled: true, status: "installed" })
      .eq("id", data.installation_id)
      .select("*")
      .single();
    if (error) throw error;
    await emitPluginEvent(context.supabase, {
      installation_id: install.id,
      company_id: install.company_id,
      plugin_id: install.plugin_id,
      plugin_version_id: install.plugin_version_id,
      event_type: "enabled",
      actor_id: context.userId,
    });
    return { installation: install };
  });

export const disablePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InstallIdInput>) => InstallIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: install, error } = await context.supabase
      .from("plugin_installations")
      .update({ enabled: false, status: "disabled" })
      .eq("id", data.installation_id)
      .select("*")
      .single();
    if (error) throw error;
    await emitPluginEvent(context.supabase, {
      installation_id: install.id,
      company_id: install.company_id,
      plugin_id: install.plugin_id,
      plugin_version_id: install.plugin_version_id,
      event_type: "disabled",
      actor_id: context.userId,
    });
    return { installation: install };
  });

const UpgradeInput = z.object({
  installation_id: z.string().uuid(),
  target_version_id: z.string().uuid(),
  granted_permissions: z.array(z.string()).default([]),
});

export const upgradePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpgradeInput>) => UpgradeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: current, error: cerr } = await context.supabase
      .from("plugin_installations")
      .select("*")
      .eq("id", data.installation_id)
      .single();
    if (cerr) throw cerr;

    const { data: requested } = await context.supabase
      .from("plugin_grants")
      .select("permission_code, optional")
      .eq("plugin_version_id", data.target_version_id);
    const evalResult = evaluateGrant(
      (requested ?? []).map((r) => ({ code: r.permission_code, optional: r.optional })),
      data.granted_permissions,
    );
    if (!evalResult.ok) {
      throw new Error(`missing_required_permissions: ${evalResult.missing_required.join(",")}`);
    }

    const { data: upgraded, error } = await context.supabase
      .from("plugin_installations")
      .update({
        previous_version_id: current.plugin_version_id,
        plugin_version_id: data.target_version_id,
        granted_permissions: data.granted_permissions,
        status: "installed",
        enabled: true,
      })
      .eq("id", data.installation_id)
      .select("*")
      .single();
    if (error) throw error;

    await emitPluginEvent(context.supabase, {
      installation_id: upgraded.id,
      company_id: upgraded.company_id,
      plugin_id: upgraded.plugin_id,
      plugin_version_id: upgraded.plugin_version_id,
      event_type: "upgraded",
      actor_id: context.userId,
      metadata: { from: current.plugin_version_id, to: data.target_version_id },
    });
    return { installation: upgraded };
  });

export const rollbackPlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InstallIdInput>) => InstallIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: install, error: ierr } = await context.supabase
      .from("plugin_installations")
      .select("*")
      .eq("id", data.installation_id)
      .single();
    if (ierr) throw ierr;
    if (!install.previous_version_id) throw new Error("no_previous_version");

    const { data: rolled, error } = await context.supabase
      .from("plugin_installations")
      .update({
        plugin_version_id: install.previous_version_id,
        previous_version_id: install.plugin_version_id,
      })
      .eq("id", data.installation_id)
      .select("*")
      .single();
    if (error) throw error;

    await emitPluginEvent(context.supabase, {
      installation_id: rolled.id,
      company_id: rolled.company_id,
      plugin_id: rolled.plugin_id,
      plugin_version_id: rolled.plugin_version_id,
      event_type: "rolled_back",
      severity: "warn",
      actor_id: context.userId,
      metadata: { restored_to: install.previous_version_id },
    });
    return { installation: rolled };
  });

export const uninstallPlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InstallIdInput>) => InstallIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: install } = await context.supabase
      .from("plugin_installations")
      .select("*")
      .eq("id", data.installation_id)
      .single();
    const { error } = await context.supabase
      .from("plugin_installations")
      .update({ status: "uninstalled", enabled: false })
      .eq("id", data.installation_id);
    if (error) throw error;
    if (install) {
      await emitPluginEvent(context.supabase, {
        installation_id: install.id,
        company_id: install.company_id,
        plugin_id: install.plugin_id,
        plugin_version_id: install.plugin_version_id,
        event_type: "uninstalled",
        severity: "warn",
        actor_id: context.userId,
      });
    }
    return { ok: true };
  });

// ─── Company view ────────────────────────────────────────────────────────────

export const listCompanyInstallations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => z.object({ company_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("plugin_installations")
      .select("*, plugin:plugins(slug, name, publisher), version:plugin_versions!plugin_installations_plugin_version_id_fkey(version, runtime)")
      .eq("company_id", data.company_id)
      .neq("status", "uninstalled")
      .order("installed_at", { ascending: false });
    if (error) throw error;
    return { installations: rows ?? [] };
  });

// ─── Analytics ───────────────────────────────────────────────────────────────

const AnalyticsIngestInput = z.object({
  installation_id: z.string().uuid(),
  company_id: z.string().uuid(),
  plugin_id: z.string().uuid(),
  invocations: z.number().int().min(0),
  errors: z.number().int().min(0),
  avg_latency_ms: z.number().int().min(0),
  p95_latency_ms: z.number().int().min(0),
  unique_users: z.number().int().min(0).default(0),
});

export const recordPluginAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AnalyticsIngestInput>) => AnalyticsIngestInput.parse(d))
  .handler(async ({ data, context }) => {
    const day = new Date().toISOString().slice(0, 10);
    const { error } = await context.supabase.from("plugin_analytics_daily").upsert(
      {
        installation_id: data.installation_id,
        company_id: data.company_id,
        plugin_id: data.plugin_id,
        day,
        invocations: data.invocations,
        errors: data.errors,
        avg_latency_ms: data.avg_latency_ms,
        p95_latency_ms: data.p95_latency_ms,
        unique_users: data.unique_users,
      },
      { onConflict: "installation_id,day" },
    );
    if (error) throw error;
    return { ok: true, day };
  });

// ─── Founder overview ────────────────────────────────────────────────────────

export const pluginOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: plugins }, { data: installs }, { data: events }, { data: analytics }] =
      await Promise.all([
        context.supabase.from("plugins").select("id, status, verified"),
        context.supabase.from("plugin_installations").select("id, status, enabled"),
        context.supabase
          .from("plugin_events")
          .select("event_type, severity, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        context.supabase
          .from("plugin_analytics_daily")
          .select("invocations, errors, avg_latency_ms")
          .gte("day", new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)),
      ]);

    const totals = {
      plugins_total: plugins?.length ?? 0,
      plugins_published: (plugins ?? []).filter((p) => p.status === "published").length,
      plugins_verified: (plugins ?? []).filter((p) => p.verified).length,
      installs_total: installs?.length ?? 0,
      installs_active: (installs ?? []).filter((i) => i.enabled && i.status === "installed").length,
      installs_disabled: (installs ?? []).filter((i) => !i.enabled || i.status === "disabled").length,
      events_last_100: events?.length ?? 0,
      errors_last_100: (events ?? []).filter((e) => e.severity === "error" || e.severity === "critical").length,
    };

    const analyticsAgg = (analytics ?? []).reduce(
      (acc, r) => {
        acc.invocations += r.invocations ?? 0;
        acc.errors += r.errors ?? 0;
        acc.latency_sum += r.avg_latency_ms ?? 0;
        acc.n += 1;
        return acc;
      },
      { invocations: 0, errors: 0, latency_sum: 0, n: 0 },
    );

    return {
      fact: {
        ...totals,
        last_7d_invocations: analyticsAgg.invocations,
        last_7d_errors: analyticsAgg.errors,
        last_7d_avg_latency_ms: analyticsAgg.n ? Math.round(analyticsAgg.latency_sum / analyticsAgg.n) : 0,
        error_rate_pct:
          analyticsAgg.invocations > 0
            ? Math.round((analyticsAgg.errors / analyticsAgg.invocations) * 10000) / 100
            : 0,
      },
      recommendation: {
        note:
          totals.errors_last_100 > 0
            ? "Investigate recent plugin errors."
            : "Plugin runtime healthy across last 100 events.",
      },
    };
  });
