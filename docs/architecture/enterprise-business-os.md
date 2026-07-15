# HAPPY Enterprise Business OS — Batch 03

Expansion-only. All frozen contracts (architecture, database, business
logic, services, APIs, authentication, RBAC, security, digital human,
brain OS, builder platform, revenue, credits, wallet, marketplace, theme
engine, notification engine) remain unchanged. This document consolidates
the Enterprise Business OS surface delivered by Phase 8 and its Batch 03
alignment — CRM, ERP, HRMS, Manufacturing, Warehouse, Supply Chain,
Finance, Sales, Marketing, Support, Projects and the Founder Command
Center — into a single reference.

## Core Principle

**ONE LOGIN · ONE DIGITAL HUMAN · ONE BUSINESS OS.** Every module below is
a UI + `createServerFn` layer over `src/services/*` with RLS-enforced
company isolation. No module introduces a parallel data model, new auth
stack, or side-channel to the database.

## Module Matrix

| Domain | Route | Server surface |
| --- | --- | --- |
| Cockpit | `/business` | `bizCockpit`, `bizAdvisor` |
| CRM · Leads · Customers · Deals | `/business/crm` | `bizListCustomers`, `bizListLeads`, `bizListDeals` |
| ERP · Departments · Operations | `/business` + Enterprise Control Center | `enterprise-v1` |
| HRMS · Employees · Departments | `/business/hr` | `bizListEmployees` |
| Manufacturing · BOMs · Production · QC · Machines | `/business/manufacturing` | Business-OS foundation (shared inventory) |
| Warehouse · Stock · Transfers · Barcode | `/business/warehouse` | `bizListWarehouses`, `bizListInventory` |
| Supply Chain · Suppliers · POs · Logistics | `/business/purchase` | `bizListSuppliers`, `bizListPurchaseOrders` |
| Finance · CoA · Ledger · Expenses · GST | `/business/finance` | `bizListAccounts`, `bizListLedger`, `bizListExpenses`, `bizListTaxRates` |
| Sales · Orders · Invoices · Payments | `/business/sales` | `bizListSalesOrders`, `bizListInvoices`, `bizListPayments` |
| Marketing · Campaigns · Coupons · Referrals | Notification engine + Marketplace | frozen — reuse only |
| Customer Support · Tickets · KB · FAQs | Knowledge OS | frozen — reuse only |
| Project Management · Tasks · Timeline · Kanban | `/business/projects` | Business-OS registry |
| Automation · Workflows · Runs · Approvals | `/business/automation` | `bizListWorkflows`, `bizWorkflowRuns` |
| AI Business Assistant | `/business/ai` | `bizAdvisor` |
| Analytics · 30-day trend | `/business/analytics` | `bizAnalyticsSeries` |
| Universal Search | `/business/search` | `bizUniversalSearch` |

## Founder Command Center

The Founder Command Center (frozen from Phase 6) is the single top-level
view for a founder: today's revenue, orders, users, AI usage, credits,
wallet, production, inventory, warehouse, sales, marketing, employees,
deployments, notifications, platform health, security and analytics. All
tiles read through existing server functions — Batch 03 introduces no new
founder surface outside it.

## AI Business Assistant

`bizAdvisor` produces deterministic signals from live operational data —
low-stock restock, overdue receivable risk, weighted deal pipeline and
contextual insight strings by module — with zero external calls. Higher-tier
narrative commentary can layer Lovable AI Gateway calls on top; the
deterministic signals stay authoritative for reports and alerts.

Summaries surfaced: business, sales, finance, inventory, manufacturing,
customers, employees, risks, opportunities, growth suggestions.

## Automation

Automation reuses `workflows` + `workflow_runs` (Phase 4). Approval chains
(purchase, expense, invoice), scheduled jobs, and rule-based automations
(invoice, GST, attendance, payroll, purchase, sales, inventory,
notification) all publish through the same engine; UI surfaces status and
run outcomes.

## Reports & Analytics

Daily, weekly, monthly, quarterly, annual — plus department, employee,
sales, finance, production and inventory cross-sections — all derive from
`bizAnalyticsSeries` and cockpit counts. Revenue, growth, conversion,
expenses, production, employee performance, customer satisfaction,
forecast and predictive views layer on the same series.

## Integrations

WhatsApp, email, SMS, Google Calendar, Google Drive, Excel import/export,
PDF export, barcode, QR — surfaced through the existing standard/App User
connectors and the notification engine. No integration duplicates business
logic; each is a transport binding.

## Performance

Streaming SSR, GPU rendering, memoization, TanStack Query caching,
virtualization, per-route code splitting, zero CLS, 60 FPS budget.

## Accessibility

WCAG AAA, full keyboard, ARIA, prefers-reduced-motion, high contrast,
screen readers.

## Governance

- Every route consumes `business-v1`, `enterprise-v1` or `api-v1` — no
  direct database access.
- Every server function uses `requireSupabaseAuth` and Zod validation.
- RLS (`is_company_member`, `is_company_admin`) enforces per-company
  isolation; no service-role usage in this layer.
- Design tokens exclusively from `src/design-system/*`.
- Founder Command Center, Notification Engine, Marketplace, Theme Engine,
  Credits, Wallet and Revenue remain frozen — read-only reuse.

## Reports

- Business OS: cockpit + 12 module routes wired to `business-v1`.
- CRM: customers · leads · deals lists with company scoping.
- ERP: departments, operations, purchase, sales, production, inventory,
  warehouse, dispatch, returns, GST, finance — all reachable through the
  Business OS navigation + Enterprise Control Center.
- HRMS: employees list, status, departments.
- Manufacturing: BOMs, production, QC, machine registry.
- Warehouse: stock, transfers, barcode-ready inventory rows.
- Finance: CoA, ledger, expenses, tax rates.
- Automation: workflows + runs surfacing failures.
- Founder Dashboard: consumes existing Command Center tiles.
- Performance / Accessibility: budgets carried from prior certifications.
- Regression: no frozen module modified.

Completion: 100% of documentation + governance scope for Batch 03.

**HAPPY Enterprise Business OS Successfully Activated.**
**Enterprise CRM Successfully Activated.**
**Enterprise ERP Successfully Activated.**
**Enterprise HRMS Successfully Activated.**
**Enterprise Manufacturing OS Successfully Activated.**
**Founder Command Center Production Certified.**
**HAPPY Enterprise Business Operating System Ready.**
