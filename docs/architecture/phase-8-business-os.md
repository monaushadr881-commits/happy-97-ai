# Phase 8 — HAPPY Business Operating System (Business OS)

Unified, AI-native operating system for every company on HAPPY X — CRM, ERP,
HRMS, Sales, Purchase, Inventory, Warehouse, Manufacturing, Finance,
Projects, Automation and Executive Analytics. Built on the Phase 4 database,
Phase 5 service layer, Phase 5.6 operations and Phase 7 enterprise foundation.

## Architecture

```
UI (/business/*)
   ↓ (typed RPC)
business-v1.functions.ts    (server functions — requireSupabaseAuth)
   ↓
Service Core (validation · errors · guard · logger)  +  RLS
   ↓
Postgres tables (customers · leads · deals · products · inventory_items ·
                 sales_orders · purchase_orders · invoices · payments ·
                 expenses · employees · chart_of_accounts · ledger_entries ·
                 warehouses · suppliers · tax_rates · workflows · workflow_runs)
```

Rules:
- UI never queries the database. Every read/write goes through
  `src/lib/business-v1.functions.ts` (or existing `api-v1` / `enterprise-v1`).
- Every server function is authenticated and Zod-validated.
- Row Level Security enforces company isolation
  (`is_company_member`, `is_company_admin`); no cross-tenant leakage possible.
- Design tokens come exclusively from `src/design-system` — no ad-hoc colors.

## Navigation Tree

```
/business                     Cockpit (executive KPIs + AI signals)
/business/crm                 Customers · Leads · Deal pipeline by stage
/business/sales               Orders · Invoices · Payments · Revenue
/business/purchase            Suppliers · Purchase Orders · Vendor bills
/business/inventory           Products · Categories · Stock positions
/business/warehouse           Warehouses · units per warehouse
/business/manufacturing       BOMs · Production · Quality · Machines (registry)
/business/hr                  Employee directory · status · departments
/business/finance             CoA · Ledger · Expenses · GST/VAT
/business/projects            Projects · Tasks · Meetings · Documents (registry)
/business/automation          Workflows · runs · failure surfacing
/business/ai                  AI Business Advisor (deterministic signals)
/business/analytics           30-day financial trend series
/business/search              Universal business search
```

## Module Inventory

| Domain | Route | Data source (business-v1 functions) |
| --- | --- | --- |
| Cockpit | `/business` | `bizCockpit`, `bizAdvisor` |
| CRM | `/business/crm` | `bizListCustomers`, `bizListLeads`, `bizListDeals` |
| Sales | `/business/sales` | `bizListSalesOrders`, `bizListInvoices`, `bizListPayments` |
| Purchase | `/business/purchase` | `bizListSuppliers`, `bizListPurchaseOrders` |
| Inventory | `/business/inventory` | `bizListProducts`, `bizListCategories`, `bizListInventory` |
| Warehouse | `/business/warehouse` | `bizListWarehouses`, `bizListInventory` |
| Manufacturing | `/business/manufacturing` | Foundation modules (shared inventory) |
| HRMS | `/business/hr` | `bizListEmployees` |
| Finance | `/business/finance` | `bizListAccounts`, `bizListLedger`, `bizListExpenses`, `bizListTaxRates` |
| Automation | `/business/automation` | `bizListWorkflows`, `bizWorkflowRuns` |
| AI Advisor | `/business/ai` | `bizAdvisor` |
| Analytics | `/business/analytics` | `bizAnalyticsSeries` |
| Search | `/business/search` | `bizUniversalSearch` |

## API Inventory (`src/lib/business-v1.functions.ts`)

Cockpit / Advisor / Analytics / Search:
- `bizCockpit(company_id)` — cross-module counts + receivable/collected totals
- `bizAdvisor(company_id)` — low-stock, overdue receivables, weighted pipeline, insights
- `bizAnalyticsSeries(company_id, days?)` — daily orders/invoiced/collected/expenses
- `bizUniversalSearch(company_id, q, limit?)` — customers/products/invoices/orders/suppliers/employees

CRM:
- `bizListCustomers`, `bizListLeads`, `bizListDeals`

Sales / Finance:
- `bizListSalesOrders`, `bizListInvoices`, `bizListPayments`
- `bizListAccounts`, `bizListLedger`, `bizListExpenses`, `bizListTaxRates`

Purchase / Inventory / Warehouse / HR:
- `bizListSuppliers`, `bizListPurchaseOrders`
- `bizListProducts`, `bizListCategories`, `bizListInventory`
- `bizListWarehouses`
- `bizListEmployees`

Automation:
- `bizListWorkflows`, `bizWorkflowRuns`

## Workflow / Automation

Business OS reuses the shared `workflows` + `workflow_runs` tables (Phase 4).
Workflow triggers include: approval chains (purchase, expense, invoice),
scheduled tasks and rule-based automations. UI surfaces workflow status and
recent run outcomes; execution runs in the platform ops layer.

## AI Business Advisor

The Advisor endpoint (`bizAdvisor`) derives deterministic signals directly from
live operational data — no external calls, always available, zero cost:
- **Inventory Advisor**: on-hand vs reorder-point → restock list
- **Finance Advisor**: overdue invoices → receivable risk
- **Sales Advisor**: weighted deal pipeline (`amount × probability`)
- **Growth signals**: contextual insight strings by module

Future modules can layer Lovable AI Gateway calls on top for narrative
commentary; the deterministic signals stay authoritative.

## Security Report

- All endpoints use `requireSupabaseAuth` middleware.
- All inputs validated by Zod (UUIDs, bounded limits, safe LIKE escaping).
- RLS (`is_company_member`, `is_company_admin`) enforces per-company scoping.
- No service-role usage in this layer.
- Search queries escape `%` and `_` in user input before ILIKE.
- No PII leaks to the browser beyond the caller's own company scope.

## Performance Report

- Every list endpoint enforces a max `limit` (200–500).
- Cockpit uses parallel `head: true` counts (no row payloads).
- TanStack Query caches per-company for instant tab switching.
- Analytics bucket-aggregates in memory (30-day window).
- Advisor caps inventory scan at 1 000 rows.
- CSS-only bar charts — zero chart-library payload.

## Testing Report

- Every route renders a `NoCompany` fallback when no company selected.
- Empty-state copy on every list.
- Type-safe RPCs — argument shape enforced by Zod at runtime.
- Chip tones map to statuses consistently across modules.

## Documentation Summary

- Architecture, navigation, API and workflow inventories captured here.
- Governance rule: **every future Business OS module must consume only
  `business-v1` (or existing `api-v1` / `enterprise-v1`) — no direct database
  access, no duplicate business logic, no bypassing RLS.**
- Design tokens: `src/design-system/*` only.
- Server functions live in `src/lib/business-v1.functions.ts`.
