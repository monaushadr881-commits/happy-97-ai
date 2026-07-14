# Phase 7 — Enterprise Control Center

The company-scoped operating system for every company using HAPPY X.
Distinct from `/founder` (platform authority); every read/write is
RLS-isolated to the selected company via `is_company_member` /
`is_company_admin` on the server.

## Architecture

```
Founder → Company → Brand → Business Unit → Department → Workspace → Team → Users
                                        └── Offices
```

UI selects a company (`EnterpriseProvider`) and every child query passes
`company_id` to the server. RLS enforces membership; no client-side
filtering can leak cross-company data.

## Route Tree

```
/enterprise (layout — company selector + sub-nav)
├── /                overview  · KPI grid, activity feed
├── /structure       brands · departments · offices
├── /people          employees directory
├── /customers       CRM directory & LTV
├── /content         knowledge · courses · media · announcements
├── /business        orders · invoices · revenue / receivable
├── /ai              company AI usage + conversations
├── /workflows       workflow inventory + queue stats
├── /comms           announcements + my notifications
├── /reports         14-day order trend + KPIs
└── /security        audit timeline + severity split
```

## Widget & KPI Inventory

Overview: Employees, Customers, Orders, Invoices, Workflows, Brands,
Workspaces, Departments, Offices, Announcements.
Business: Order revenue, Receivable, order/invoice tables with status
chips. Reports: Collected, Customers, Employees + 14-day CSS bar chart.
AI: Requests, Tokens, Cost, Conversations. Workflows: Queue Pending,
Running, Failed. Security: Events, Critical, Admin changes, Actors.

Primitives reused from the design system only: `PageHeader`, `Panel`,
`StatCard`, `Chip`, `Hairline`, `EmptyState`, `Input`, `Button`,
`Select`. Zero raw colors introduced.

## API Inventory (v1)

New in `src/lib/enterprise-v1.functions.ts`:
`entCompanyOverview`, `entListEmployees`, `entListCustomers`,
`entListOrders`, `entListInvoices`, `entListDepartments`,
`entListOffices`, `entListWorkflows`, `entListAnnouncements`,
`entListKnowledge`, `entListCourses`, `entListMedia`.

Reused from `api-v1`: `apiListCompanies`, `apiListBrands`,
`apiListConversations`, `apiMyNotifications`, `apiMarkNotificationRead`,
`apiRecentAudit`. From `ops-v1`: `opsAiUsage`, `opsQueueStats`.

## Role & Permission Matrix

| Surface        | Read                                 | Write                              |
|----------------|--------------------------------------|------------------------------------|
| Selector list  | founder + company members            | —                                  |
| Overview / KPI | `is_company_member(auth.uid(), cid)` | —                                  |
| People         | company member                       | company admin (future)             |
| Customers      | company member                       | company admin (future)             |
| Content        | company member                       | approval workflow (future)         |
| Business       | company member                       | finance role                       |
| AI             | company member                       | company admin                      |
| Workflows      | company member                       | company admin                      |
| Comms          | company member                       | company admin                      |
| Reports        | company member                       | —                                  |
| Security       | company admin (RLS on audit)         | —                                  |

Enforcement lives in RLS (existing helpers) and the service/repository
layer; the UI merely reflects state.

## Security

- Entire subtree gated by `_authenticated` layout.
- Every enterprise server function uses `requireSupabaseAuth` — request
  runs as the signed-in user, RLS applies as that user.
- `company_id` validated as UUID via Zod on every call; PostgREST
  filters are additive to RLS, never a replacement.
- No service-role client. No client-side company filtering. No secrets
  in bundle. Notifications marked-read via server function (audit
  trail intact).

## Performance

- Tabs code-split via TanStack automatic split.
- Overview refetches every 30 s; queue every 15 s; the rest stale until
  the tab is revisited.
- CSS-only bar charts on Reports — no chart lib on the hot path.
- Company list cached once and shared across every enterprise page via
  React Query.

## Accessibility

- Radix `Select` for company switcher (full keyboard support).
- Chips carry both tone and text, never colour alone.
- Table-like grids use text landmarks; focus rings from
  `--ring: var(--gold)`.
- Empty states have icon + title + description.

## Testing

Manual smoke path:
1. Sign in, open `/enterprise`. Selector auto-picks last-used company.
2. Switch company → overview KPIs, structure, people all re-fetch and
   only show rows for the newly selected company.
3. Comms → mark a notification read (toast + list refresh).
4. Security → verify audit rows are scoped to the company.
5. Attempt to spoof `company_id` in devtools for a company the user is
   not a member of → RLS returns zero rows, UI shows empty states.

## Governance (permanent)

- No `/enterprise/*` page may query Supabase directly.
- No enterprise page may add ad-hoc styling; only design-system
  primitives and existing tokens.
- Every new company-scoped surface must add its list/mutation to
  `enterprise-v1.functions.ts` (or an api-v1 service) and consume it
  through TanStack Query — never a direct fetch.
