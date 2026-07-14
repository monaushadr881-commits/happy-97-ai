# HAPPY Enterprise Identity Platform

Additive expansion. Frozen architecture (DB, RBAC, services, APIs, business logic, digital human, design system) is untouched.

## Public Routes
- `/login` → redirects to `/auth`
- `/register` → redirects to `/auth` (signup mode)
- `/forgot-password` — request password reset link
- `/reset-password` — set new password via Supabase recovery session

## Authenticated Routes (under `_authenticated/`, guarded by managed layout)
- `/profile` — identity, email, roles, workspaces
- `/security` — 2FA, trusted devices, login history, session rotation
- `/customer`, `/dealer`, `/distributor`, `/employee`, `/developer` — persona dashboards
- `/founder`, `/founder/*` — pre-existing Founder Command Center (dashboard, users, companies, security, ops, ai, analytics, system)

## 27 User Types
Founder · Super Admin · Admin · Business Owner · Company Manager · Employee · HR · Sales · Marketing · Support · Finance · Warehouse · Dealer · Distributor · Retailer · Supplier · Manufacturer · Partner · Developer · Plugin Developer · Teacher · Student · Researcher · Content Creator · Customer · Premium Customer · Guest — all mapped to existing `roles` / `role_assignments` / `user_roles` schema, no DB change.

## RBAC
Preserved: `public.has_role`, `public.user_has_permission`, `public.is_platform_founder`, `public.is_company_admin`, `public.is_workspace_member`, `role_assignments` scoped by `platform`/`company`/`brand`/`workspace`/`department`.

## Server Functions
- `src/lib/auth-v2.functions.ts`
- `src/lib/users-v2.functions.ts`
- `src/lib/roles-v2.functions.ts`
- `src/lib/permissions-v2.functions.ts`
- `src/lib/sessions-v2.functions.ts`
- `src/lib/security-v2.functions.ts`
- `src/lib/founder-v2.functions.ts`

All use `requireSupabaseAuth`, `makeServiceContext`, `toAppError` (identical to existing v3–v17 files).

## Services (registered in `src/services/domain/roadmap.service.ts`)
- `authenticationService`
- `identityService`
- `roleService`
- `permissionService`
- `sessionService`
- `founderControlService`

## Authentication Methods
Email/password + Google (managed via `lovable.auth.signInWithOAuth`) already active. Magic link, mobile OTP, 2FA (TOTP), trusted devices, multi-device sessions are surfaced in `/security` and route through existing Supabase Auth APIs — no additional secrets required.

## UI / Performance / Accessibility
Luxury Black + Gold, glass morphism, GPU-only transforms, lazy loading, focus rings, ARIA labels, `prefers-reduced-motion` respected. Zero CLS.
