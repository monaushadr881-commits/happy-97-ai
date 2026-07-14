/**
 * HAPPY X — Server-side repositories (Enterprise Foundation)
 *
 * Thin, typed wrappers over the authenticated Supabase client (RLS as the
 * caller). Import from server functions only — this module uses the
 * SupabaseClient type from the auth-middleware context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  AuditLog, Brand, Company, Employee, Json, Permission, Role, RoleAssignment,
  ScopeType, Setting, Workspace, WorkspaceMembership,
} from "./types";

type Sb = SupabaseClient<Database>;

// ---------- Companies -----------------------------------------------------
export const companiesRepo = (sb: Sb) => ({
  async list(): Promise<Company[]> {
    const { data, error } = await sb.from("companies").select("*").order("display_name");
    if (error) throw error;
    return (data ?? []) as unknown as Company[];
  },
  async byId(id: string): Promise<Company | null> {
    const { data, error } = await sb.from("companies").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as unknown as Company) ?? null;
  },
  async create(input: Partial<Company> & { slug: string; legal_name: string; display_name: string }): Promise<Company> {
    const { data, error } = await sb.from("companies").insert(input as never).select("*").single();
    if (error) throw error;
    return data as unknown as Company;
  },
  async update(id: string, patch: Partial<Company>): Promise<Company> {
    const { data, error } = await sb.from("companies").update(patch as never).eq("id", id).select("*").single();
    if (error) throw error;
    return data as unknown as Company;
  },
});

// ---------- Brands --------------------------------------------------------
export const brandsRepo = (sb: Sb) => ({
  async listByCompany(companyId: string): Promise<Brand[]> {
    const { data, error } = await sb.from("brands").select("*").eq("company_id", companyId).order("name");
    if (error) throw error;
    return (data ?? []) as unknown as Brand[];
  },
  async create(input: Partial<Brand> & { company_id: string; slug: string; name: string }): Promise<Brand> {
    const { data, error } = await sb.from("brands").insert(input as never).select("*").single();
    if (error) throw error;
    return data as unknown as Brand;
  },
});

// ---------- Workspaces ----------------------------------------------------
export const workspacesRepo = (sb: Sb) => ({
  async listByCompany(companyId: string): Promise<Workspace[]> {
    const { data, error } = await sb.from("workspaces").select("*").eq("company_id", companyId).order("name");
    if (error) throw error;
    return (data ?? []) as unknown as Workspace[];
  },
  async myWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await sb
      .from("workspace_memberships")
      .select("workspaces:workspace_id(*)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    return ((data ?? []) as unknown as { workspaces: Workspace }[])
      .map((r) => r.workspaces)
      .filter(Boolean);
  },
  async create(input: Partial<Workspace> & { company_id: string; slug: string; name: string }): Promise<Workspace> {
    const { data, error } = await sb.from("workspaces").insert(input as never).select("*").single();
    if (error) throw error;
    return data as unknown as Workspace;
  },
});

// ---------- Employees -----------------------------------------------------
export const employeesRepo = (sb: Sb) => ({
  async listByCompany(companyId: string): Promise<Employee[]> {
    const { data, error } = await sb.from("employees").select("*").eq("company_id", companyId);
    if (error) throw error;
    return (data ?? []) as unknown as Employee[];
  },
});

// ---------- RBAC ----------------------------------------------------------
export const rbacRepo = (sb: Sb) => ({
  async permissions(): Promise<Permission[]> {
    const { data, error } = await sb.from("permissions").select("*").order("category");
    if (error) throw error;
    return (data ?? []) as unknown as Permission[];
  },
  async systemRoles(): Promise<Role[]> {
    const { data, error } = await sb.from("roles").select("*").is("company_id", null).order("name");
    if (error) throw error;
    return (data ?? []) as unknown as Role[];
  },
  async myAssignments(userId: string): Promise<RoleAssignment[]> {
    const { data, error } = await sb.from("role_assignments").select("*").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as unknown as RoleAssignment[];
  },
  async assignRole(input: {
    user_id: string; role_id: string; scope_type: ScopeType; scope_id?: string | null;
  }): Promise<RoleAssignment> {
    const { data, error } = await sb.from("role_assignments")
      .insert({ ...input, scope_id: input.scope_id ?? null } as never)
      .select("*").single();
    if (error) throw error;
    return data as unknown as RoleAssignment;
  },
});

// ---------- Workspace memberships -----------------------------------------
export const membershipsRepo = (sb: Sb) => ({
  async listByWorkspace(workspaceId: string): Promise<WorkspaceMembership[]> {
    const { data, error } = await sb.from("workspace_memberships").select("*").eq("workspace_id", workspaceId);
    if (error) throw error;
    return (data ?? []) as unknown as WorkspaceMembership[];
  },
  async add(input: { workspace_id: string; user_id: string; role_id?: string | null }): Promise<WorkspaceMembership> {
    const { data, error } = await sb.from("workspace_memberships")
      .insert({ ...input, role_id: input.role_id ?? null } as never)
      .select("*").single();
    if (error) throw error;
    return data as unknown as WorkspaceMembership;
  },
});

// ---------- Settings ------------------------------------------------------
export const settingsRepo = (sb: Sb) => ({
  async list(scope: ScopeType, scopeId: string | null): Promise<Setting[]> {
    let q = sb.from("settings").select("*").eq("scope_type", scope);
    q = scopeId == null ? q.is("scope_id", null) : q.eq("scope_id", scopeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as Setting[];
  },
  async upsert(input: { scope_type: ScopeType; scope_id: string | null; key: string; value: unknown }): Promise<Setting> {
    const { data, error } = await sb.from("settings")
      .upsert(input as never, { onConflict: "scope_type,scope_id,key" })
      .select("*").single();
    if (error) throw error;
    return data as unknown as Setting;
  },
  async effective(key: string, ctx: {
    company_id?: string; brand_id?: string; workspace_id?: string; department_id?: string; user_id?: string;
  }) {
    const { data, error } = await sb.rpc("get_effective_setting", {
      _key: key,
      _company_id: ctx.company_id ?? null,
      _brand_id: ctx.brand_id ?? null,
      _workspace_id: ctx.workspace_id ?? null,
      _department_id: ctx.department_id ?? null,
      _user_id: ctx.user_id ?? null,
    } as never);
    if (error) throw error;
    return data as Json | null;
  },
});

// ---------- Audit + Activity ---------------------------------------------
export const auditRepo = (sb: Sb) => ({
  async recent(companyId: string | null, limit = 100): Promise<AuditLog[]> {
    let q = sb.from("audit_logs").select("*").order("occurred_at", { ascending: false }).limit(limit);
    if (companyId) q = q.eq("company_id", companyId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as AuditLog[];
  },
  async write(input: {
    category: string; action: string;
    entity_type?: string; entity_id?: string; company_id?: string;
    before?: unknown; after?: unknown; severity?: "info" | "notice" | "warning" | "critical";
    metadata?: Record<string, unknown>;
  }) {
    const { data, error } = await sb.rpc("write_audit", {
      _category: input.category,
      _action: input.action,
      _entity_type: input.entity_type ?? null,
      _entity_id: input.entity_id ?? null,
      _company_id: input.company_id ?? null,
      _before: (input.before as never) ?? null,
      _after: (input.after as never) ?? null,
      _severity: input.severity ?? "info",
      _metadata: (input.metadata as never) ?? {},
    } as never);
    if (error) throw error;
    return data as unknown as string;
  },
});

// ---------- Permission checks --------------------------------------------
export const authzRepo = (sb: Sb) => ({
  async hasPermission(userId: string, code: string, scope: ScopeType = "platform", scopeId: string | null = null): Promise<boolean> {
    const { data, error } = await sb.rpc("user_has_permission", {
      _user_id: userId, _permission_code: code, _scope_type: scope, _scope_id: scopeId,
    } as never);
    if (error) throw error;
    return Boolean(data);
  },
  async isCompanyAdmin(userId: string, companyId: string): Promise<boolean> {
    const { data, error } = await sb.rpc("is_company_admin", { _user_id: userId, _company_id: companyId } as never);
    if (error) throw error;
    return Boolean(data);
  },
  async isPlatformFounder(userId: string): Promise<boolean> {
    const { data, error } = await sb.rpc("is_platform_founder", { _user_id: userId } as never);
    if (error) throw error;
    return Boolean(data);
  },
});
