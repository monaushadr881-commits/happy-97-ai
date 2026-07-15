/**
 * R15 — Domain & SSL server functions (auth-gated).
 *
 * Ownership is enforced at RLS and re-checked here. Ops admins can view
 * and manage every domain for founder oversight.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  addDomain, listDomains, getDomain, removeDomain, setPrimaryDomain,
  suspendDomain, updateRedirectRules, verifyDomain, checkDns,
  requestSsl, renewSsl, listCertificates, listEvents, domainOverview,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };

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

async function assertDomainAccess(ctx: Ctx, domainId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("project_domains")
    .select("user_id").eq("id", domainId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("domain_not_found");
  if ((data as { user_id: string }).user_id !== ctx.userId) {
    const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
    if (!ops) throw new Error("Forbidden: not domain owner");
  }
}

async function assertOpsAdmin(ctx: Ctx) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

/* ------------------------------ CRUD -------------------------------- */

export const addProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; hostname: string; isPrimary?: boolean }) => {
    if (!d?.hostname?.trim()) throw new Error("hostname_required");
    if (!d?.projectId) throw new Error("projectId_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return addDomain(supabaseAdmin, {
      projectId: data.projectId,
      userId: (context as Ctx).userId,
      hostname: data.hostname,
      isPrimary: data.isPrimary,
    });
  });

export const listProjectDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertProjectOwner(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listDomains(supabaseAdmin, data.projectId);
  });

export const getProjectDomain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getDomain(supabaseAdmin, data.domainId);
  });

export const removeProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return removeDomain(supabaseAdmin, data.domainId, (context as Ctx).userId);
  });

export const setProjectDomainPrimary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return setPrimaryDomain(supabaseAdmin, data.domainId, (context as Ctx).userId);
  });

export const setProjectDomainRedirects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string; rules: Array<{ from: string; to: string; code: 301 | 302 }> }) => {
    if (!Array.isArray(d?.rules)) throw new Error("rules_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return updateRedirectRules(supabaseAdmin, data.domainId, data.rules);
  });

export const suspendProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string; reason: string }) => {
    if (!d?.reason?.trim()) throw new Error("reason_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertOpsAdmin(context as Ctx); // suspension is a founder action
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return suspendDomain(supabaseAdmin, data.domainId, data.reason, (context as Ctx).userId);
  });

/* ------------------------------ verification ------------------------ */

export const verifyProjectDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return verifyDomain(supabaseAdmin, data.domainId, (context as Ctx).userId);
  });

export const checkProjectDomainDns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return checkDns(supabaseAdmin, data.domainId);
  });

/* ------------------------------ SSL --------------------------------- */

export const requestProjectDomainSsl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return requestSsl(supabaseAdmin, data.domainId, (context as Ctx).userId);
  });

export const renewProjectDomainSsl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return renewSsl(supabaseAdmin, data.domainId, (context as Ctx).userId);
  });

export const listProjectDomainCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listCertificates(supabaseAdmin, data.domainId);
  });

export const listProjectDomainEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { domainId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertDomainAccess(context as Ctx, data.domainId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listEvents(supabaseAdmin, data.domainId, data.limit);
  });

/* ------------------------------ founder overview -------------------- */

export const getDomainOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return domainOverview(supabaseAdmin);
  });
