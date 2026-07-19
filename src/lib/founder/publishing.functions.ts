/**
 * R183 Batch G — Canonical Founder Publishing Runtime
 *
 * SINGLE canonical server-function surface that turns a Founder-approved
 * publishing request into a versioned bundle of store submission
 * materials (metadata, release notes, privacy policy, data safety,
 * review notes, screenshots manifest, assets manifest, plus a publishing
 * manifest + checklist).
 *
 * MATERIALS ONLY — this runtime never submits, uploads, publishes or
 * deploys anything to Google Play, Apple App Store, or any external
 * provider. Native store submission remains BLOCKED external work per
 * the Core Vision Lock.
 *
 * Flow (mirrors R183 Batch C — document runtime):
 *   Founder action
 *     → withBrain (capability: founder.publishing.package)
 *     → runBrain / impact analysis (target, versions, asset count)
 *     → requestFounderApproval (R158 → public.approvals)
 *     → Founder decides via decideFounderApproval
 *     → writeCanonicalAudit (request)
 *     → Finalise → INSERT publishing assets into public.creator_assets
 *     → writeCanonicalAudit (finalise)
 *     → Mission Control reads via creator_assets + audit_logs
 *
 * Canonical owners REUSED (no new runtime, no new tables):
 *   Brain guard      → src/lib/founder/with-brain.ts
 *   Approval         → src/lib/founder/approval.functions.ts → public.approvals
 *   Audit            → src/lib/founder/audit.ts             → public.write_audit
 *   Asset store      → public.creator_assets  (Creator OS)
 *   Publishing spec  → src/lib/founder/publishing-catalog.ts
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "./audit";
import { withBrain } from "./with-brain";
import { adoptToCanonicalPipeline } from "./pipeline";
import {
  PUBLISHING_ASSET_KINDS,
  PUBLISHING_CATALOG,
  isStoreTarget,
  isPublishingAssetKind,
  type PublishingAssetKind,
  type StoreTarget,
} from "./publishing-catalog";

const CAPABILITY = "founder.publishing.package" as const;
const APPROVAL_ENTITY = "founder_publishing_package" as const;
const ASSET_SOURCE = "founder.publishing.finalize" as const;

// ---------- Request ----------

export interface PublishingContent {
  metadata?: {
    title?: string;
    short_description?: string;
    full_description?: string;
    keywords?: string[];
    categories?: string[];
    contact_email?: string;
    contact_website?: string;
  };
  release_notes?: string;
  privacy_policy?: string;
  data_safety?: Record<string, unknown>;
  review_notes?: string;
  screenshots?: Array<{ device: string; caption?: string; ref?: string }>;
  assets?: Array<{ kind: string; ref?: string; description?: string }>;
}

interface RequestInput {
  company_id: string;
  store: StoreTarget;
  app_name: string;
  version: string;
  kinds: PublishingAssetKind[];
  content: PublishingContent;
  reason?: string;
}

function validateRequest(input: unknown): RequestInput {
  const v = input as Partial<RequestInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.company_id || typeof v.company_id !== "string")
    throw new Error("company_id_required");
  if (!isStoreTarget(v.store)) throw new Error("store_invalid");
  if (!v.app_name || typeof v.app_name !== "string")
    throw new Error("app_name_required");
  if (!v.version || typeof v.version !== "string")
    throw new Error("version_required");
  const kindsIn = Array.isArray(v.kinds) && v.kinds.length > 0
    ? v.kinds
    : (PUBLISHING_ASSET_KINDS as readonly PublishingAssetKind[]);
  const kinds: PublishingAssetKind[] = [];
  for (const k of kindsIn) {
    if (!isPublishingAssetKind(k)) throw new Error(`kind_invalid:${String(k)}`);
    if (!kinds.includes(k)) kinds.push(k);
  }
  if (!v.content || typeof v.content !== "object")
    throw new Error("content_required");
  return {
    company_id: v.company_id,
    store: v.store,
    app_name: v.app_name,
    version: v.version,
    kinds,
    content: v.content as PublishingContent,
    reason: typeof v.reason === "string" ? v.reason : undefined,
  };
}

/** Impact analysis — pure. Brain step. */
function analyseImpact(input: RequestInput) {
  const missing: PublishingAssetKind[] = [];
  for (const k of input.kinds) {
    const has =
      (k === "metadata" && !!input.content.metadata) ||
      (k === "release_notes" && !!input.content.release_notes) ||
      (k === "privacy_policy" && !!input.content.privacy_policy) ||
      (k === "data_safety" && !!input.content.data_safety) ||
      (k === "review_notes" && !!input.content.review_notes) ||
      (k === "screenshots" && Array.isArray(input.content.screenshots)) ||
      (k === "assets" && Array.isArray(input.content.assets));
    if (!has) missing.push(k);
  }
  const total_assets = input.kinds.length + 2; // + manifest + checklist
  return {
    store: input.store,
    version: input.version,
    total_assets,
    missing_inputs: missing,
    risk: missing.length > 0 ? "elevated" : "standard",
  };
}

/**
 * Step 1 — Founder submits a publishing package request. Runs Brain
 * (impact analysis) then creates an R158 approval row via
 * public.approvals. The full request payload is stored in
 * approval.metadata for the finalise step to materialise once
 * decideFounderApproval marks it 'approved'.
 */
export const requestPublishingPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateRequest)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const brain = withBrain<RequestInput, ReturnType<typeof analyseImpact>>({
      capability: CAPABILITY,
      handler: (input) => analyseImpact(input),
    });
    const brainResult = await brain({
      capability: CAPABILITY,
      input: data,
      context: { isFounder: true, approvalGranted: true },
    });

    const { data: row, error } = await supabase
      .from("approvals")
      .insert({
        company_id: data.company_id,
        entity_type: APPROVAL_ENTITY,
        entity_id: crypto.randomUUID(),
        title: `${data.app_name} · ${data.store} · v${data.version}`,
        reason: data.reason ?? null,
        requested_by: userId,
        status: "pending",
        metadata: {
          capability: CAPABILITY,
          store: data.store,
          app_name: data.app_name,
          version: data.version,
          kinds: data.kinds,
          content: data.content,
          impact: brainResult.output,
          brain_duration_ms: brainResult.durationMs,
        } as never,
      })
      .select("id, status, entity_id")
      .single();
    if (error) throw new Error(`approval_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.publishing",
      action: "request",
      entity_type: APPROVAL_ENTITY,
      entity_id: row.entity_id as string,
      company_id: data.company_id,
      after: { approval_id: row.id, impact: brainResult.output },
      severity: "notice",
      metadata: {
        capability: CAPABILITY,
        store: data.store,
        version: data.version,
        app_name: data.app_name,
      },
    });

    return {
      approval_id: row.id as string,
      package_id: row.entity_id as string,
      status: row.status as string,
      impact: brainResult.output,
    };
  });

// ---------- Finalise ----------

interface FinaliseInput {
  approval_id: string;
}

function validateFinalise(input: unknown): FinaliseInput {
  const v = input as Partial<FinaliseInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.approval_id || typeof v.approval_id !== "string")
    throw new Error("approval_id_required");
  return { approval_id: v.approval_id };
}

interface RenderedAsset {
  kind: PublishingAssetKind | "manifest" | "checklist";
  name: string;
  mime: string;
  ext: string;
  body: string;
}

function renderAssets(params: {
  app_name: string;
  store: StoreTarget;
  version: string;
  kinds: PublishingAssetKind[];
  content: PublishingContent;
}): RenderedAsset[] {
  const { app_name, store, version, kinds, content } = params;
  const label = store === "google_play" ? "Google Play" : "Apple App Store";
  const stem = `${app_name}-${store}-v${version}`;
  const rendered: RenderedAsset[] = [];

  const asJson = (name: string, kind: RenderedAsset["kind"], obj: unknown) => ({
    kind,
    name: `${stem}-${name}.json`,
    mime: "application/json",
    ext: "json",
    body: JSON.stringify(obj, null, 2),
  });
  const asMd = (name: string, kind: RenderedAsset["kind"], md: string) => ({
    kind,
    name: `${stem}-${name}.md`,
    mime: "text/markdown",
    ext: "md",
    body: md,
  });

  for (const k of kinds) {
    switch (k) {
      case "metadata": {
        const m = content.metadata ?? {};
        rendered.push(
          asJson("metadata", "metadata", {
            store,
            app_name,
            version,
            title: m.title ?? app_name,
            short_description: m.short_description ?? "",
            full_description: m.full_description ?? "",
            keywords: m.keywords ?? [],
            categories: m.categories ?? [],
            contact: {
              email: m.contact_email ?? "",
              website: m.contact_website ?? "",
            },
          }),
        );
        break;
      }
      case "release_notes":
        rendered.push(
          asMd(
            "release-notes",
            "release_notes",
            `# ${label} — ${app_name} v${version}\n\n${
              content.release_notes ?? "_(no notes supplied)_"
            }\n`,
          ),
        );
        break;
      case "privacy_policy":
        rendered.push(
          asMd(
            "privacy-policy",
            "privacy_policy",
            `# ${app_name} — Privacy Policy\n\n_Store target: ${label}_\n\n${
              content.privacy_policy ?? "_(privacy policy body required)_"
            }\n`,
          ),
        );
        break;
      case "data_safety":
        rendered.push(
          asJson("data-safety", "data_safety", {
            store,
            app_name,
            version,
            disclosures: content.data_safety ?? {},
          }),
        );
        break;
      case "review_notes":
        rendered.push(
          asMd(
            "review-notes",
            "review_notes",
            `# ${label} — Reviewer Notes (${app_name} v${version})\n\n` +
              `> Credentials are NEVER included. Provide demo accounts through the store console only.\n\n${
                content.review_notes ?? "_(reviewer notes required)_"
              }\n`,
          ),
        );
        break;
      case "screenshots":
        rendered.push(
          asJson("screenshots", "screenshots", {
            store,
            app_name,
            version,
            screenshots: content.screenshots ?? [],
          }),
        );
        break;
      case "assets":
        rendered.push(
          asJson("assets", "assets", {
            store,
            app_name,
            version,
            assets: content.assets ?? [],
          }),
        );
        break;
    }
  }

  // Publishing manifest — links every generated asset for the store.
  rendered.push(
    asJson("manifest", "manifest", {
      store,
      app_name,
      version,
      generated_at: new Date().toISOString(),
      kinds,
      items: rendered.map((r) => ({ kind: r.kind, name: r.name })),
      submission: {
        transmitted: false,
        note: "Materials only. External submission is BLOCKED per Core Vision Lock.",
      },
    }),
  );

  // Publishing checklist — Founder-facing verification list.
  const catalog = PUBLISHING_CATALOG[store];
  const lines = [
    `# ${label} — Publishing Checklist`,
    ``,
    `App: ${app_name}`,
    `Version: ${version}`,
    ``,
    ...kinds.map((k) => `- [ ] ${catalog[k]?.title ?? k}`),
    ``,
    `- [ ] Founder final review`,
    `- [ ] Store credentials handled outside this runtime`,
    `- [ ] Upload performed manually in store console`,
    ``,
    `_Generated by Founder Publishing Runtime — materials only, never submitted._`,
  ];
  rendered.push(asMd("checklist", "checklist", lines.join("\n")));

  return rendered;
}

/**
 * Step 2 — After Founder has decided the approval (approved via
 * decideFounderApproval), finalise: render every publishing asset and
 * insert one canonical creator_assets row per file. Version-only
 * semantics: each finalise appends a fresh package version.
 */
export const finalizePublishingPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateFinalise)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: appr, error: readErr } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", data.approval_id)
      .single();
    if (readErr || !appr) throw new Error("approval_not_found");
    if (appr.entity_type !== APPROVAL_ENTITY)
      throw new Error("approval_entity_mismatch");
    if (appr.status !== "approved") throw new Error("approval_not_approved");

    const meta = (appr.metadata ?? {}) as Record<string, unknown>;
    const store = meta.store as StoreTarget | undefined;
    const app_name = meta.app_name as string | undefined;
    const version = meta.version as string | undefined;
    const kinds = meta.kinds as PublishingAssetKind[] | undefined;
    const content = (meta.content ?? {}) as PublishingContent;
    if (!store || !isStoreTarget(store)) throw new Error("store_invalid");
    if (!app_name) throw new Error("app_name_missing");
    if (!version) throw new Error("version_missing");
    if (!Array.isArray(kinds) || kinds.length === 0)
      throw new Error("kinds_missing");

    const packageId = appr.entity_id as string;

    // Determine next package version (per approval package id).
    const { data: prior } = await supabase
      .from("creator_assets")
      .select("id, metadata")
      .contains("metadata", { package_id: packageId } as never);
    const priorRows = Array.isArray(prior) ? prior : [];
    const priorVersions = new Set<number>();
    for (const row of priorRows) {
      const m = (row.metadata ?? {}) as Record<string, unknown>;
      if (typeof m.package_version === "number") priorVersions.add(m.package_version);
    }
    const nextVersion = priorVersions.size + 1;

    const rendered = renderAssets({ app_name, store, version, kinds, content });

    const rows = rendered.map((r) => ({
      user_id: userId,
      name: r.name,
      kind: "publishing",
      mime_type: r.mime,
      data_url: `data:${r.mime};base64,${
        typeof btoa === "function"
          ? btoa(unescape(encodeURIComponent(r.body)))
          : Buffer.from(r.body, "utf-8").toString("base64")
      }`,
      size_bytes: new TextEncoder().encode(r.body).length,
      tags: ["founder", "publishing", `store:${store}`, r.kind, `v${version}`],
      metadata: {
        source: ASSET_SOURCE,
        package_id: packageId,
        approval_id: appr.id,
        store,
        app_name,
        app_version: version,
        package_version: nextVersion,
        asset_kind: r.kind,
        status: "final",
        finalized_at: new Date().toISOString(),
        company_id: appr.company_id,
      } as never,
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("creator_assets")
      .insert(rows)
      .select("id, name, size_bytes, metadata");
    if (insErr) throw new Error(`asset_insert_failed: ${insErr.message}`);

    const totalBytes = (inserted ?? []).reduce(
      (s, r) => s + ((r.size_bytes as number | null) ?? 0),
      0,
    );

    await writeCanonicalAudit(supabase, {
      category: "founder.publishing",
      action: "finalize",
      entity_type: "publishing_package",
      entity_id: packageId,
      company_id: (appr.company_id as string) ?? undefined,
      after: {
        approval_id: appr.id,
        package_id: packageId,
        package_version: nextVersion,
        asset_count: inserted?.length ?? 0,
        total_bytes: totalBytes,
      },
      severity: "notice",
      metadata: {
        capability: CAPABILITY,
        store,
        app_name,
        app_version: version,
      },
    });

    return {
      package_id: packageId,
      package_version: nextVersion,
      store,
      app_name,
      app_version: version,
      asset_count: inserted?.length ?? 0,
      total_bytes: totalBytes,
      assets: (inserted ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        size_bytes: (r.size_bytes as number | null) ?? 0,
      })),
    };
  });
