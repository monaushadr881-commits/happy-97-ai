# R140 — Business OS UI Completion™

Pure UI extension over canonical Business OS (`bizList*`, `entList*`, `apiPlatformOverview`, `apiRecentAudit`, `revOverview`, `revTimeseries`, `revListInvoices`, `revListPayments`). No V2 dashboards, no V2 runtimes, no duplicate services.

## Routes Completed
| Route | Screens (URL-tab) | Canonical owner |
|---|---|---|
| `/business/crm` | Overview · Leads · Customers (Timeline) · Deals · Pipeline · Tasks · Activities · Communications | `bizListCustomers` · `bizListLeads` · `bizListDeals` · `bizListWorkflows` · `bizWorkflowRuns` |
| `/business/hr` | Employees · Attendance · Leave · Payroll · Learning · Performance · Organization | `bizListEmployees` · `entListDepartments` · `entListOffices` · `entListCourses` |
| `/business/inventory` | Stock · Warehouses · Transfers · Batch · Serial · Expiry · Analytics | `bizListProducts` · `bizListCategories` · `bizListInventory` · `bizListWarehouses` · `bizListPurchaseOrders` |
| `/business/finance` | Overview · Accounts · Ledger · Invoices · Payments · Expenses · Taxes · Reports | `bizListAccounts` · `bizListLedger` · `bizListInvoices` · `bizListPayments` · `bizListExpenses` · `bizListTaxRates` |
| `/revenue` (new) | Overview · Credits · Subscriptions · Wallet · Billing · Invoices · Usage · Analytics | `revOverview` · `revTimeseries` · `revListInvoices` · `revListPayments` |
| `/enterprise-control` (new) | Organizations · RBAC · Policies · Audit · Compliance · Monitoring · Security | `apiListCompanies` · `apiRecentAudit` · `apiPlatformOverview` · `entListEmployees` · `entListDepartments` |

ERP: Finance/Accounting complete above; Procurement/Manufacturing/Warehouse continue to live at existing canonical routes (`business.purchase`, `business.manufacturing`, `business.warehouse`) and are surfaced via the Business OS nav — no duplication introduced.

## Components Added
- `src/components/business/TabBar.tsx` — URL-driven (`?tab=<slug>`) sub-tab primitive: `TabBar`, `useActiveTab`, `useSetTab`. Deep-linkable, preserves siblings, single owner.

Everything else are edits to existing canonical route files — no new component owners, no new services.

## Canonical Owners (verified, no duplication)
- CRM: `businessService` / `bizList*` (R122)
- ERP finance: `businessService` / `bizList*` (R123)
- HRMS: `businessService.employees` + `enterpriseService.departments/offices/courses` (R124)
- Inventory: `businessService` (R125)
- Revenue: `revenueService` (R128) — `/revenue` composes existing overview/timeseries/invoices/payments only.
- Enterprise: `apiPlatformOverview` + `apiRecentAudit` + `enterpriseService` (R129), RBAC matrix rendered from the canonical R129 6×13 policy definition, security policies mirror R106 hardening.

## Architecture Impact
None on runtime, DB or services. One new UI primitive (`TabBar`) and two new leaf routes (`/revenue`, `/enterprise-control`). All other completions are edits inside existing canonical route files. No V2. No new migrations. No new server functions.

## UI Coverage %
Screens explicitly listed in R140 mission: **42 / 42 shipped**.
- CRM 8/8, HRMS 7/7, Inventory 7/7, Finance 8/8, Revenue 8/8, Enterprise 7/7.

## Tests
- `tests/unit/happy-r140.test.ts` — 6 tests, verifies every mission-required screen slug is present and the active-tab resolver behaves correctly.
- Full suite: **654 / 654 passing** (was 648, +6 R140).
- `bunx tsgo --noEmit`: clean.

## Documentation
- `docs/business-os/R140_UI_COMPLETION.md` (this file).

## Evidence
- `bunx tsgo --noEmit` → 0 errors.
- `bunx vitest run` → 56 files, 654 tests green.
- All screens deep-link via `?tab=<slug>` and preserve other search params.

## Remaining UI Gaps (external / non-repo)
- Live per-message Communications feed (blocked on Email/SMS/WhatsApp provider credentials).
- Live subscription and payment rows (blocked on Stripe / Paddle credentials — R101 external adapters exist).
- Attendance kiosk / mobile check-ins (blocked on native app publish).
- Learning course completion & performance review streams (surface exists; deeper reporting depends on future course-analytics tables).
- SOC 2 / ISO 27001 posture markers surfaced as "in-progress" pending external audit sign-off.
