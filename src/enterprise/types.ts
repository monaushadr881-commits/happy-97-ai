/**
 * HAPPY X — Enterprise Foundation types
 *
 * Domain-facing types that mirror the Phase 2 schema. Kept independent from
 * the auto-generated Supabase types so components import from a stable API
 * even if the generator output shifts.
 */

export type ScopeType = "platform" | "company" | "brand" | "workspace" | "department" | "team";
export type EntityStatus = "active" | "inactive" | "archived" | "suspended";
export type MembershipStatus = "invited" | "active" | "suspended" | "removed";
export type AuditSeverity = "info" | "notice" | "warning" | "critical";

export type SystemRoleCode =
  | "super_founder" | "founder" | "board" | "super_admin"
  | "company_admin" | "department_admin" | "manager" | "employee"
  | "teacher" | "scholar" | "student"
  | "dealer" | "distributor" | "franchise"
  | "customer" | "guest" | "developer";

export type PermissionCode =
  | "platform.manage" | "companies.manage" | "companies.view"
  | "brands.manage" | "workspaces.manage" | "workspaces.view"
  | "departments.manage" | "employees.manage" | "users.invite" | "roles.manage"
  | "billing.manage" | "billing.view" | "audit.view" | "settings.manage"
  | "ai.configure" | "ai.use" | "studio.use"
  | "marketplace.sell" | "marketplace.buy"
  | "community.post" | "community.moderate"
  | "knowledge.contribute" | "knowledge.approve";

export interface Company {
  id: string;
  slug: string;
  legal_name: string;
  display_name: string;
  tagline: string | null;
  logo_url: string | null;
  website: string | null;
  country: string | null;
  timezone: string;
  status: EntityStatus;
  owner_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  company_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  status: EntityStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  company_id: string;
  brand_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  business_unit_id: string | null;
  parent_id: string | null;
  name: string;
  code: string | null;
  status: EntityStatus;
}

export interface Team {
  id: string;
  company_id: string;
  department_id: string | null;
  name: string;
  status: EntityStatus;
}

export interface Employee {
  id: string;
  company_id: string;
  user_id: string;
  employee_code: string | null;
  title: string | null;
  department_id: string | null;
  team_id: string | null;
  office_id: string | null;
  manager_id: string | null;
  hired_on: string | null;
  status: EntityStatus;
}

export interface Role {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  scope_type: ScopeType;
}

export interface Permission {
  id: string;
  code: PermissionCode | string;
  category: string;
  description: string;
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  scope_type: ScopeType;
  scope_id: string | null;
  granted_at: string;
  expires_at: string | null;
}

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string | null;
  status: MembershipStatus;
  joined_at: string;
}

export interface Setting<T = unknown> {
  id: string;
  scope_type: ScopeType;
  scope_id: string | null;
  key: string;
  value: T;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  company_id: string | null;
  category: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  severity: AuditSeverity;
  metadata: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  company_id: string | null;
  workspace_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  source: string;
  metadata: Record<string, unknown>;
}
