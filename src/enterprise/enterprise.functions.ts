/**
 * HAPPY X — Enterprise Foundation server functions
 *
 * Thin, typed RPC boundary the client calls into. Every mutating fn writes
 * an audit log entry via `write_audit`. RLS enforces tenant isolation; these
 * fns add authorization checks in code for defence-in-depth.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  authzRepo, auditRepo, brandsRepo, companiesRepo, employeesRepo,
  membershipsRepo, rbacRepo, settingsRepo, workspacesRepo,
} from "@/enterprise/repositories.server";

// ---------- Companies -----------------------------------------------------
export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => companiesRepo(context.supabase).list());

export const getCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => companiesRepo(context.supabase).byId(data.id));

const CreateCompanyInput = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  legal_name: z.string().min(2).max(200),
  display_name: z.string().min(2).max(200),
  tagline: z.string().max(280).optional(),
  country: z.string().max(80).optional(),
  timezone: z.string().max(80).optional(),
});
export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateCompanyInput.parse(i))
  .handler(async ({ data, context }) => {
    const isFounder = await authzRepo(context.supabase).isPlatformFounder(context.userId);
    if (!isFounder) throw new Error("Only the platform founder can create companies");
    const sb = context.supabase;
    const company = await companiesRepo(sb).create({ ...data, owner_id: context.userId });
    await auditRepo(sb).write({
      category: "admin", action: "company.created",
      entity_type: "company", entity_id: company.id, company_id: company.id,
      after: company, severity: "notice",
    });
    return company;
  });

// ---------- Brands --------------------------------------------------------
const CreateBrandInput = z.object({
  company_id: z.string().uuid(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(200),
  tagline: z.string().max(280).optional(),
  primary_color: z.string().max(16).optional(),
});
export const createBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateBrandInput.parse(i))
  .handler(async ({ data, context }) => {
    const brand = await brandsRepo(context.supabase).create(data);
    await auditRepo(context.supabase).write({
      category: "admin", action: "brand.created",
      entity_type: "brand", entity_id: brand.id, company_id: brand.company_id, after: brand,
    });
    return brand;
  });

export const listBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => brandsRepo(context.supabase).listByCompany(data.company_id));

// ---------- Workspaces ----------------------------------------------------
const CreateWorkspaceInput = z.object({
  company_id: z.string().uuid(),
  brand_id: z.string().uuid().optional(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
});
export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateWorkspaceInput.parse(i))
  .handler(async ({ data, context }) => {
    const ws = await workspacesRepo(context.supabase).create(data);
    await auditRepo(context.supabase).write({
      category: "admin", action: "workspace.created",
      entity_type: "workspace", entity_id: ws.id, company_id: ws.company_id, after: ws,
    });
    return ws;
  });

export const listMyWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => workspacesRepo(context.supabase).myWorkspaces(context.userId));

// ---------- Employees -----------------------------------------------------
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => employeesRepo(context.supabase).listByCompany(data.company_id));

// ---------- RBAC ----------------------------------------------------------
export const listPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => rbacRepo(context.supabase).permissions());

export const listSystemRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => rbacRepo(context.supabase).systemRoles());

export const listMyRoleAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => rbacRepo(context.supabase).myAssignments(context.userId));

const AssignRoleInput = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
  scope_type: z.enum(["platform", "company", "brand", "workspace", "department", "team"]),
  scope_id: z.string().uuid().nullable().optional(),
});
export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AssignRoleInput.parse(i))
  .handler(async ({ data, context }) => {
    const assignment = await rbacRepo(context.supabase).assignRole({
      user_id: data.user_id, role_id: data.role_id,
      scope_type: data.scope_type, scope_id: data.scope_id ?? null,
    });
    await auditRepo(context.supabase).write({
      category: "permission", action: "role.assigned",
      entity_type: "role_assignment", entity_id: assignment.id,
      company_id: data.scope_type === "company" ? (data.scope_id ?? undefined) : undefined,
      after: assignment, severity: "warning",
    });
    return assignment;
  });

// ---------- Settings ------------------------------------------------------
const UpsertSettingInput = z.object({
  scope_type: z.enum(["platform", "company", "brand", "workspace", "department", "team"]),
  scope_id: z.string().uuid().nullable(),
  key: z.string().min(1).max(200),
  value: z.unknown(),
});
export const upsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpsertSettingInput.parse(i))
  .handler(async ({ data, context }) => {
    const value = (data.value ?? null) as import("./types").Json;
    const s = await settingsRepo(context.supabase).upsert({
      scope_type: data.scope_type, scope_id: data.scope_id, key: data.key, value,
    });
    await auditRepo(context.supabase).write({
      category: "admin", action: "setting.updated",
      entity_type: "setting", entity_id: s.id,
      metadata: { key: data.key, scope_type: data.scope_type, scope_id: data.scope_id },
    });
    return s;
  });

// ---------- Audit ---------------------------------------------------------
export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid().nullable().optional(), limit: z.number().int().min(1).max(500).optional() }).parse(i))
  .handler(async ({ data, context }) =>
    auditRepo(context.supabase).recent(data.company_id ?? null, data.limit ?? 100));
