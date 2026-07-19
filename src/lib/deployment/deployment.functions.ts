/**
 * R14 — Deployment Server Functions
 *
 * All functions are auth-gated. Ownership is enforced at the RLS layer AND
 * re-checked in-code. Ops admins can view/manage every deployment.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  addDomain,
  attemptDomainVerification,
  cancelDeployment,
  createDeployment,
  deploymentOverview,
  getDeployment,
  listDeployments,
  listDeploymentEvents,
  listDomains,
  PLANNED_TARGETS,
  REAL_TARGETS,
  removeDomain,
  rollbackDeployment,
  runDeployment,
  type DeploymentEnv,
  type DeploymentTarget,
  type JsonObject,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };

const ENVS: DeploymentEnv[] = ["development", "preview", "staging", "production"];
const TARGETS: DeploymentTarget[] = [
  "web", "pwa", "static_export", "cloudflare", "netlify", "vercel", "custom",
];

async function assertProjectOwner(ctx: Ctx, projectId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("creator_projects")
    .select("user_id").eq("id", projectId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("project_not_found");
  if ((data as { user_id: string }).user_id !== ctx.userId) {
    const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
    if (!ops) throw new Error("Forbidden: not project owner");
  }
}

async function assertDeploymentAccess(ctx: Ctx, deploymentId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("project_deployments")
    .select("user_id").eq("id", deploymentId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("deployment_not_found");
  if ((data as { user_id: string }).user_id !== ctx.userId) {
    const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
    if (!ops) throw new Error("Forbidden: not deployment owner");
  }
}

async function assertOpsAdmin(ctx: Ctx) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

/* -------------------------------------------------------------------- */
/* Deployments                                                           */
/* -------------------------------------------------------------------- */

export const listProjectDeployments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listDeployments(supabaseAdmin, { projectId: data.projectId, limit: data.limit });
  });

export const getProjectDeployment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deploymentId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDeploymentAccess(context as Ctx, data.deploymentId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getDeployment(supabaseAdmin, data.deploymentId);
  });

export const getDeploymentLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deploymentId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertDeploymentAccess(context as Ctx, data.deploymentId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listDeploymentEvents(supabaseAdmin, data.deploymentId, data.limit);
  });

export const createProjectDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    projectId: string;
    environment: DeploymentEnv;
    target: DeploymentTarget;
    version?: string;
    releaseNotes?: string;
    buildProfile?: JsonObject;
    autoRun?: boolean;
  }) => {
    if (!ENVS.includes(d.environment)) throw new Error("invalid_environment");
    if (!TARGETS.includes(d.target)) throw new Error("invalid_target");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `deploy ${data.projectId} → ${data.environment}/${data.target}`, source: "api", module: "deployment.create" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const deployment = await createDeployment(supabaseAdmin, {
      projectId: data.projectId,
      userId: (context as Ctx).userId,
      environment: data.environment,
      target: data.target,
      version: data.version,
      releaseNotes: data.releaseNotes,
      buildProfile: data.buildProfile,
    });
    if (data.autoRun !== false) {
      const executed = await runDeployment(supabaseAdmin, deployment.id);
      return executed ?? deployment;
    }
    return deployment;
  });

export const retryProjectDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deploymentId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDeploymentAccess(context as Ctx, data.deploymentId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `deploy.retry ${data.deploymentId}`, source: "api", module: "deployment.retry" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const prev = await getDeployment(supabaseAdmin, data.deploymentId);
    if (!prev) throw new Error("deployment_not_found");
    const created = await createDeployment(supabaseAdmin, {
      projectId: prev.projectId,
      userId: (context as Ctx).userId,
      environment: prev.environment,
      target: prev.target,
      version: prev.version,
      releaseNotes: `Retry of ${prev.id}`,
      buildProfile: prev.buildProfile,
    });
    return (await runDeployment(supabaseAdmin, created.id)) ?? created;
  });

export const cancelProjectDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deploymentId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDeploymentAccess(context as Ctx, data.deploymentId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `deploy.cancel ${data.deploymentId}`, source: "api", module: "deployment.cancel" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return cancelDeployment(supabaseAdmin, data.deploymentId);
  });

export const rollbackProjectDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetDeploymentId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDeploymentAccess(context as Ctx, data.targetDeploymentId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `deploy.rollback ${data.targetDeploymentId}`, source: "api", module: "deployment.rollback" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return rollbackDeployment(supabaseAdmin, {
      targetDeploymentId: data.targetDeploymentId,
      actorId: (context as Ctx).userId,
    });
  });

/* -------------------------------------------------------------------- */
/* Domains                                                               */
/* -------------------------------------------------------------------- */

export const listProjectDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listDomains(supabaseAdmin, data.projectId);
  });

export const addProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; hostname: string; isPrimary?: boolean }) => {
    if (!d?.hostname?.trim()) throw new Error("hostname_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `domain.add ${data.hostname}`, source: "api", module: "deployment.domain.add" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return addDomain(supabaseAdmin, {
      projectId: data.projectId,
      userId: (context as Ctx).userId,
      hostname: data.hostname,
      isPrimary: data.isPrimary,
    });
  });

export const removeProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string; projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `domain.remove ${data.domainId}`, source: "api", module: "deployment.domain.remove" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return removeDomain(supabaseAdmin, data.domainId);
  });

export const verifyProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string; projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `domain.verify ${data.domainId}`, source: "api", module: "deployment.domain.verify" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return attemptDomainVerification(supabaseAdmin, data.domainId);
  });

/* -------------------------------------------------------------------- */
/* Founder overview                                                      */
/* -------------------------------------------------------------------- */

export const getDeploymentOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const overview = await deploymentOverview(supabaseAdmin);
    return {
      ...overview,
      supportedTargets: REAL_TARGETS,
      plannedTargets: PLANNED_TARGETS,
    };
  });
