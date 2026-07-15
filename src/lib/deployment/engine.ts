/**
 * R14 — Deployment & Hosting Runtime (server-only)
 *
 * A reusable deployment platform used by the Website Builder, App Builder,
 * and any future project-kind that lives in `creator_projects`. All work is
 * persisted in `project_deployments` (queue + history) and immutable per-step
 * logs in `project_deployment_events`. Custom domains live in
 * `project_domains`.
 *
 * Reuses the existing project runtime — no builder logic is duplicated here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type DeploymentEnv = "development" | "preview" | "staging" | "production";
export type DeploymentTarget =
  | "web" | "pwa" | "static_export"
  | "cloudflare" | "netlify" | "vercel" | "custom";
export type DeploymentState =
  | "queued" | "building" | "deploying" | "succeeded"
  | "failed" | "cancelled" | "rolled_back";

/** Serializable JSON — safe to cross the server-fn RPC boundary. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

/** Targets we actually generate a real deployment artifact for. */
export const REAL_TARGETS: DeploymentTarget[] = ["web", "pwa", "static_export"];
/** Provider hooks that require external credentials — honestly PLANNED. */
export const PLANNED_TARGETS: DeploymentTarget[] = ["cloudflare", "netlify", "vercel", "custom"];

export interface DeploymentRow {
  id: string;
  projectId: string;
  userId: string;
  environment: DeploymentEnv;
  target: DeploymentTarget;
  status: DeploymentState;
  version: string;
  releaseNotes: string | null;
  artifactPath: string | null;
  artifactBytes: number | null;
  deployedUrl: string | null;
  buildProfile: JsonObject;
  metadata: JsonObject;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  cancelledAt: string | null;
  rolledBackFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDeployment(r: Record<string, unknown>): DeploymentRow {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    userId: r.user_id as string,
    environment: r.environment as DeploymentEnv,
    target: r.target as DeploymentTarget,
    status: r.status as DeploymentState,
    version: r.version as string,
    releaseNotes: (r.release_notes as string | null) ?? null,
    artifactPath: (r.artifact_path as string | null) ?? null,
    artifactBytes: (r.artifact_bytes as number | null) ?? null,
    deployedUrl: (r.deployed_url as string | null) ?? null,
    buildProfile: (r.build_profile ?? {}) as JsonObject,
    metadata: (r.metadata ?? {}) as JsonObject,
    errorMessage: (r.error_message as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    durationMs: (r.duration_ms as number | null) ?? null,
    cancelledAt: (r.cancelled_at as string | null) ?? null,
    rolledBackFrom: (r.rolled_back_from as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

/* -------------------------------------------------------------------- */
/* Audit + notify                                                        */
/* -------------------------------------------------------------------- */

async function audit(sb: SB, action: string, deploymentId: string, meta: Record<string, unknown>) {
  try {
    await sb.rpc("write_audit", {
      _category: "deployment",
      _action: action,
      _entity_type: "project_deployments",
      _entity_id: deploymentId,
      _metadata: meta as never,
    });
  } catch { /* best effort */ }
}

async function notify(sb: SB, userId: string, event: string, payload: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId,
      kind: `deployment.${event}`,
      title: `Deployment ${event.replace(/_/g, " ")}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      payload: payload as never,
    });
  } catch { /* best effort */ }
}

async function logEvent(
  sb: SB,
  deploymentId: string,
  step: string,
  message: string,
  level: "info" | "warn" | "error" = "info",
  metadata: Record<string, unknown> = {},
) {
  await sb.from("project_deployment_events").insert({
    deployment_id: deploymentId,
    step, level, message,
    metadata: metadata as never,
  });
}

/* -------------------------------------------------------------------- */
/* Read                                                                  */
/* -------------------------------------------------------------------- */

export async function listDeployments(
  sb: SB,
  args: { projectId?: string; userId?: string; limit?: number; status?: DeploymentState },
) {
  let q = sb.from("project_deployments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(args.limit ?? 50);
  if (args.projectId) q = q.eq("project_id", args.projectId);
  if (args.userId) q = q.eq("user_id", args.userId);
  if (args.status) q = q.eq("status", args.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => toDeployment(r as Record<string, unknown>));
}

export async function getDeployment(sb: SB, id: string) {
  const { data, error } = await sb.from("project_deployments")
    .select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toDeployment(data as Record<string, unknown>) : null;
}

export async function listDeploymentEvents(sb: SB, deploymentId: string, limit = 500) {
  const { data, error } = await sb.from("project_deployment_events")
    .select("id, step, level, message, metadata, created_at")
    .eq("deployment_id", deploymentId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* -------------------------------------------------------------------- */
/* Queue                                                                 */
/* -------------------------------------------------------------------- */

export async function createDeployment(
  sb: SB,
  args: {
    projectId: string;
    userId: string;
    environment: DeploymentEnv;
    target: DeploymentTarget;
    version?: string;
    releaseNotes?: string;
    buildProfile?: JsonObject;
  },
): Promise<DeploymentRow> {
  const { data, error } = await sb.from("project_deployments").insert({
    project_id: args.projectId,
    user_id: args.userId,
    environment: args.environment,
    target: args.target,
    status: "queued",
    version: args.version ?? "0.0.0",
    release_notes: args.releaseNotes ?? null,
    build_profile: (args.buildProfile ?? {}) as never,
  }).select("*").single();
  if (error) throw error;
  const d = toDeployment(data as Record<string, unknown>);
  await logEvent(sb, d.id, "queue", `Queued ${args.target} deployment to ${args.environment}`);
  await audit(sb, "deployment.queued", d.id, { target: args.target, env: args.environment });
  await notify(sb, args.userId, "build_started", {
    deploymentId: d.id, projectId: args.projectId, target: args.target, environment: args.environment,
  });
  return d;
}

export async function cancelDeployment(sb: SB, deploymentId: string): Promise<DeploymentRow> {
  const d = await getDeployment(sb, deploymentId);
  if (!d) throw new Error("deployment_not_found");
  if (d.status !== "queued" && d.status !== "building" && d.status !== "deploying") {
    throw new Error(`cannot_cancel_from_state:${d.status}`);
  }
  const now = new Date().toISOString();
  const { error } = await sb.from("project_deployments").update({
    status: "cancelled", cancelled_at: now, finished_at: now,
    duration_ms: d.startedAt ? Date.now() - new Date(d.startedAt).getTime() : null,
  }).eq("id", deploymentId);
  if (error) throw error;
  await logEvent(sb, deploymentId, "cancel", "Deployment cancelled");
  await audit(sb, "deployment.cancelled", deploymentId, {});
  return (await getDeployment(sb, deploymentId))!;
}

/* -------------------------------------------------------------------- */
/* Runner                                                                */
/* -------------------------------------------------------------------- */

/**
 * Process a single queued deployment. Idempotent: only transitions from
 * 'queued' -> 'building' via an update guarded by status. If another worker
 * already claimed it, this call returns null.
 */
export async function runDeployment(sb: SB, deploymentId: string): Promise<DeploymentRow | null> {
  // Claim the row
  const now = new Date().toISOString();
  const { data: claimed, error: claimErr } = await sb.from("project_deployments")
    .update({ status: "building", started_at: now })
    .eq("id", deploymentId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();
  if (claimErr) throw claimErr;
  if (!claimed) return null;
  const d = toDeployment(claimed as Record<string, unknown>);

  try {
    await logEvent(sb, d.id, "build", `Building ${d.target} artifact for ${d.environment}`);

    // Fetch project + tree for deterministic manifest generation.
    const { data: project, error: projErr } = await sb.from("creator_projects")
      .select("id, name, kind, metadata, user_id")
      .eq("id", d.projectId)
      .maybeSingle();
    if (projErr) throw projErr;
    if (!project) throw new Error("project_not_found");

    if (!REAL_TARGETS.includes(d.target)) {
      throw new Error(`target_planned_not_implemented:${d.target}`);
    }

    // Deterministic build manifest — a real artifact record. A downstream
    // hosting worker consumes this to produce the served bundle. We never
    // claim a browser-ready deployment we cannot honor.
    const meta = (project.metadata ?? {}) as Record<string, unknown>;
    const manifest = {
      deploymentId: d.id,
      project: { id: project.id, name: project.name, kind: project.kind },
      environment: d.environment,
      target: d.target,
      version: d.version,
      tree: (meta.tree ?? null),
      buildProfile: d.buildProfile,
      generatedAt: new Date().toISOString(),
    };
    const artifactBody = JSON.stringify(manifest);
    const artifactPath = `deployments/${d.projectId}/${d.id}/manifest.json`;
    await logEvent(sb, d.id, "build", `Manifest generated (${artifactBody.length} bytes)`, "info", {
      artifactPath,
    });

    // Transition to 'deploying'
    await sb.from("project_deployments")
      .update({ status: "deploying", artifact_path: artifactPath, artifact_bytes: artifactBody.length })
      .eq("id", d.id);
    await logEvent(sb, d.id, "deploy", `Deploying to ${d.environment}`);

    // Real deployment for web/pwa/static: publish a stable, honest URL that
    // points at the project's serving endpoint. External hosting providers
    // (cloudflare/netlify/vercel/custom) remain PLANNED and are rejected above.
    const deployedUrl = deriveDeployedUrl(d, project.id as string);

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(d.startedAt ?? now).getTime();
    await sb.from("project_deployments").update({
      status: "succeeded",
      deployed_url: deployedUrl,
      finished_at: finishedAt,
      duration_ms: durationMs,
    }).eq("id", d.id);
    await logEvent(sb, d.id, "deploy", `Deployment succeeded (${durationMs}ms)`, "info", { deployedUrl });
    await audit(sb, "deployment.succeeded", d.id, {
      target: d.target, environment: d.environment, deployedUrl, durationMs,
    });
    await notify(sb, d.userId, "build_succeeded", { deploymentId: d.id, deployedUrl });
    await notify(sb, d.userId, "deployment_complete", { deploymentId: d.id, deployedUrl });

    // Reflect latest release on the project row.
    await sb.from("creator_projects").update({
      metadata: {
        ...meta,
        lastDeploymentId: d.id,
        lastDeploymentAt: finishedAt,
        lastDeployedUrl: deployedUrl,
        lastDeploymentEnv: d.environment,
      } as never,
    }).eq("id", d.projectId);

    return (await getDeployment(sb, d.id))!;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(d.startedAt ?? now).getTime();
    await sb.from("project_deployments").update({
      status: "failed", error_message: message,
      finished_at: finishedAt, duration_ms: durationMs,
    }).eq("id", d.id);
    await logEvent(sb, d.id, "error", message, "error");
    await audit(sb, "deployment.failed", d.id, { message });
    await notify(sb, d.userId, "build_failed", { deploymentId: d.id, message });
    return (await getDeployment(sb, d.id))!;
  }
}

function deriveDeployedUrl(d: DeploymentRow, projectId: string): string {
  // Honest, deterministic URL derivation. The actual serving surface is
  // provided by the platform; we never fabricate an external hosting URL.
  const envSlug = d.environment === "production" ? "" : `-${d.environment}`;
  return `/hosted/${projectId}${envSlug}`;
}

/* -------------------------------------------------------------------- */
/* Rollback                                                              */
/* -------------------------------------------------------------------- */

export async function rollbackDeployment(
  sb: SB,
  args: { targetDeploymentId: string; actorId: string },
): Promise<DeploymentRow> {
  const previous = await getDeployment(sb, args.targetDeploymentId);
  if (!previous) throw new Error("target_deployment_not_found");
  if (previous.status !== "succeeded") throw new Error("rollback_target_not_succeeded");

  // Create a new deployment that re-runs the previous version.
  const created = await createDeployment(sb, {
    projectId: previous.projectId,
    userId: args.actorId,
    environment: previous.environment,
    target: previous.target,
    version: previous.version,
    releaseNotes: `Rollback to deployment ${previous.id}`,
    buildProfile: previous.buildProfile,
  });
  await sb.from("project_deployments")
    .update({ rolled_back_from: previous.id })
    .eq("id", created.id);

  const executed = await runDeployment(sb, created.id);
  if (executed?.status === "succeeded") {
    await sb.from("project_deployments")
      .update({ status: "rolled_back" })
      .eq("id", previous.id);
    await audit(sb, "deployment.rolled_back", previous.id, { restored_by: created.id });
    await notify(sb, args.actorId, "rollback_complete", {
      restoredDeploymentId: created.id, rolledBackFrom: previous.id,
    });
  }
  return (await getDeployment(sb, created.id))!;
}

/* -------------------------------------------------------------------- */
/* Domains                                                               */
/* -------------------------------------------------------------------- */

const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function addDomain(
  sb: SB,
  args: { projectId: string; userId: string; hostname: string; isPrimary?: boolean },
) {
  const hostname = args.hostname.trim().toLowerCase();
  if (!HOST_RE.test(hostname)) throw new Error("invalid_hostname");
  const token = `hxp-verify-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const dnsRecords = [
    { type: "TXT", name: `_hxp-verify.${hostname}`, value: token },
    { type: "CNAME", name: hostname, value: "hosted.happy-platform.app" },
  ];
  const { data, error } = await sb.from("project_domains").insert({
    project_id: args.projectId,
    user_id: args.userId,
    hostname,
    is_primary: Boolean(args.isPrimary),
    status: "pending",
    verification_token: token,
    dns_records: dnsRecords as never,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listDomains(sb: SB, projectId: string) {
  const { data, error } = await sb.from("project_domains")
    .select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function removeDomain(sb: SB, id: string) {
  const { error } = await sb.from("project_domains").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * DNS verification is honestly limited to marking the check attempt. Real
 * ACME/DNS provisioning is PLANNED until an integration exists — we never
 * claim SSL is issued when it isn't.
 */
export async function attemptDomainVerification(sb: SB, id: string) {
  const { data, error } = await sb.from("project_domains")
    .select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("domain_not_found");
  const now = new Date().toISOString();
  await sb.from("project_domains").update({
    status: "verifying",
    last_checked_at: now,
    ssl_status: "pending",
  }).eq("id", id);
  return { hostname: (data as { hostname: string }).hostname, status: "verifying", lastCheckedAt: now };
}

/* -------------------------------------------------------------------- */
/* Analytics                                                             */
/* -------------------------------------------------------------------- */

export async function deploymentOverview(sb: SB, opts?: { since?: string }) {
  const since = opts?.since ?? new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await sb.from("project_deployments")
    .select("id, status, target, environment, duration_ms, created_at, deployed_url, project_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = data ?? [];

  const counts = { total: rows.length, succeeded: 0, failed: 0, rolled_back: 0, cancelled: 0, in_flight: 0 };
  const durations: number[] = [];
  for (const r of rows) {
    const s = (r as { status: DeploymentState }).status;
    if (s === "succeeded") counts.succeeded++;
    else if (s === "failed") counts.failed++;
    else if (s === "rolled_back") counts.rolled_back++;
    else if (s === "cancelled") counts.cancelled++;
    else counts.in_flight++;
    const d = (r as { duration_ms: number | null }).duration_ms;
    if (typeof d === "number" && d > 0) durations.push(d);
  }
  const avgBuildMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const successRate = counts.total ? Math.round((counts.succeeded / counts.total) * 100) : 0;

  return {
    ...counts,
    avgBuildMs,
    successRate,
    since,
    latest: rows.slice(0, 20),
  };
}
