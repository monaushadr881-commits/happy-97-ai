# HAPPY X — Enterprise Foundation (Phase 2)

Production multi-tenant architecture for HAPPY X. Everything below is
delivered as database schema (`supabase/migrations/*`), server functions
(`src/enterprise/enterprise.functions.ts`), a typed repository layer
(`src/enterprise/repositories.server.ts`), and domain types
(`src/enterprise/types.ts`).

## 1. Tenancy Model

```
platform
└── company            (tenant root; owner_id, status, timezone, metadata)
    ├── brands         (unique per company: (company_id, slug))
    ├── business_units
    │   └── departments      (hierarchical via parent_id)
    │       └── teams
    ├── offices        (office | branch | warehouse | franchise)
    ├── workspaces     (tenant scope container; optional brand)
    │   └── workspace_memberships (user ↔ workspace + role)
    └── employees      (user ↔ company employment; manager tree)
```

**Isolation guarantee.** Every non-platform row carries `company_id`. RLS
policies use security-definer predicates so a caller can only see or mutate
rows in companies they belong to, unless they hold a platform role
(`super_founder`, `founder`, `board`, `super_admin`).

## 2. RBAC

- `permissions` — 23-entry catalog (`platform.manage`, `companies.manage`,
  `billing.view`, `ai.configure`, `studio.use`, `marketplace.sell`, …).
- `roles` — system roles (`company_id = NULL`, `is_system = true`) plus
  per-company custom roles. Codes cover all requested titles: Super
  Founder, Founder, Board, Super Admin, Company Admin, Department Admin,
  Manager, Employee, Teacher, Scholar, Student, Dealer, Distributor,
  Franchise, Customer, Guest, Developer.
- `role_permissions` — many-to-many mapping; company admins may edit
  mappings only for their own custom roles.
- `role_assignments` — a user gets a role at a specific
  `scope_type` (`platform | company | brand | workspace | department |
  team`) and `scope_id`. Supports expiry via `expires_at`.

Never hardcode business logic to a role — always call
`user_has_permission(user, code, scope_type, scope_id)`.

## 3. Hierarchical Settings

`settings(scope_type, scope_id, key, value jsonb)` with a unique constraint
on `(scope_type, scope_id, key)`. Resolve with:

```sql
select public.get_effective_setting(
  _key := 'ai.default_model',
  _company_id := :company, _brand_id := :brand,
  _workspace_id := :workspace, _department_id := :dept, _user_id := :user
);
```

Precedence: **user → department → workspace → brand → company → platform**.
The first match wins.

## 4. Audit & Compliance

- `audit_logs` is append-only. Triggers block `UPDATE`/`DELETE`. Writes
  must go through `write_audit(...)`, a `SECURITY DEFINER` helper that
  stamps `actor_id = auth.uid()`.
- Reads gated by RLS: platform founder sees everything; company admin
  sees their company; a user sees their own actions.
- `activity_events` powers the tenant timeline (posts, deployments,
  automations) with the same tenant-scoped read policy.

## 5. Security Helpers (SECURITY DEFINER, `search_path = public`)

| Function | Purpose |
| --- | --- |
| `is_platform_founder(user)` | True for super_founder / founder / board / super_admin. |
| `is_company_member(user, company)` | Employee, has a company-scoped role, or platform founder. |
| `is_company_admin(user, company)` | Company admin / super admin / founder. |
| `is_workspace_member(user, workspace)` | Active membership or company admin. |
| `user_has_permission(user, code, scope, scope_id)` | Full permission check. |
| `get_effective_setting(...)` | Hierarchical setting resolver. |
| `write_audit(category, action, ...)` | Immutable audit writer. |

`EXECUTE` is revoked from `PUBLIC` and `anon`; only `authenticated` and
`service_role` can call them (RLS still uses them internally regardless).

## 6. Server Function Surface

`src/enterprise/enterprise.functions.ts` exports:

- `listCompanies`, `getCompany`, `createCompany`
- `listBrands`, `createBrand`
- `createWorkspace`, `listMyWorkspaces`
- `listEmployees`
- `listPermissions`, `listSystemRoles`, `listMyRoleAssignments`, `assignRole`
- `upsertSetting`
- `listAuditLogs`

Every mutating fn is authenticated (`requireSupabaseAuth`), validated with
Zod, and writes an `audit_logs` entry via `write_audit`.

## 7. Founder Cross-Tenant Visibility

`is_platform_founder(user)` is OR'd into every `SELECT` policy so founders
can see all data without needing per-tenant memberships — but the same
predicate is required in `INSERT`/`UPDATE`/`DELETE` policies, so a
compromised non-founder account cannot escalate.

## 8. Scale Notes

- Every foreign key is indexed.
- `audit_logs` and `activity_events` are indexed on `(company_id,
  occurred_at DESC)` for tenant timelines.
- No cross-tenant JOIN is required for any hot path; predicates short-
  circuit on `company_id` before scanning.
- Roles/permissions live in-database — feature gates can be added without
  code changes.
- Enum + jsonb metadata provides schema flexibility without giving up
  type safety.

## 9. What's Next (Phase 3)

The enterprise foundation is now in place. Phase 3 builds the shared
Executive AI Luxury design system on top of these primitives: reusable
buttons, cards, inputs, tables, charts, dialogs, forms, sidebar,
command palette, notifications, loaders, skeletons, and motion tokens.
