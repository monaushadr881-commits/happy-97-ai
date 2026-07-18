# R123 — HAPPY ERP Intelligence™

**Founder Lock:** R91 · R111 · R113. No ERP V2. No duplicate runtime, DB, or API.

## Canonical Owners (reused, not duplicated)

| Domain | Canonical Owner |
|---|---|
| ERP core (leads-to-cash + POs + inventory RPCs) | `src/lib/erp/engine.ts` + `src/lib/erp/erp.functions.ts` |
| Org / Branch / Dept | `src/lib/erp/core.ts` + `src/services/domain/company.service.ts` |
| Manufacturing | `src/lib/manufacturing-v10.functions.ts` |
| Warehouse | `src/lib/warehouse-v10.functions.ts` |
| Finance / GL | `src/lib/finance/*`, `src/lib/finance-v7.functions.ts` |
| Payments | `src/lib/payments/*` |
| CRM (customer + invoicing link) | `src/lib/crm/*` (+ R122) |
| Workspace | `src/services/domain/workspace.service.ts` (+ R118) |
| Brain | `src/lib/brain/engine.ts` (R115.b/.c) |
| Memory | `src/lib/memory/engine.ts` (R116) |
| Search | `src/services/domain/search.service.ts` (+ R120) |
| Files | `src/lib/happy-r112/files-upload.ts` (+ R119) |
| Digital Human | `src/components/happy-desk/HappyDesk.tsx` (+ R117) |

## Extension Layer

`src/lib/happy-r123/erp-intelligence.ts` — pure helpers, no state, no I/O:

- **Phase 2 Types** — `OrgUnitKind`, `ProcurementStage`, `ProductionStage`, `StockMoveKind`, `WarehouseOp`, `FinanceDocKind`, `ErpRole`, `ErpCap`.
- **Phase 3 Org** — `ancestorsOf()` for company → branch → dept → cost-center rollups.
- **Phase 4 Procurement** — `compareSuppliers()` (weighted price/lead/rating), `threeWayMatch()` (PO ↔ GRN ↔ Invoice with tolerance).
- **Phase 5 Manufacturing** — `explodeBom()` (with scrap), `pickMachine()` (least-loaded eligible), `oee()`.
- **Phase 6 Inventory** — `availableQty`, `needsReorder`, `reorderQty` (ROP + safety), `expiryBucket` (FEFO).
- **Phase 7 Warehouse** — `optimizePickList()` zone→bin.
- **Phase 8 Finance Bridge** — `buildJournal()` for 7 doc kinds (all balanced), `isJournalBalanced`, `convertCurrency` (multi-currency).
- **Phase 9 Supply Chain Intelligence** — `forecastDemand()` (SMA), `supplierRisk()`, `suggestProcurement()`.
- **Phase 10 AI Intelligence** — `businessHealth()` composite score + grade + risks.
- **Phase 11 Brain Integration** — `resolveForBrain(prompt)` → 7 ERP domains.
- **Phase 12 Digital Human** — `pickDhErpMode()` → factory / warehouse / production / finance / presentation / management.
- **Permissions** — `erpCan(role, cap)` — 8 roles × 13 caps.
- **Phase 13 Analytics** — `erpAnalyticsSnapshot()` for Brain Stage 10.

## Gap Report

| Area | Status | Notes |
|---|---|---|
| Procurement (PR / RFQ / PO / GRN / vendor perf / invoice match) | Present in canonical owners; **added supplier comparison + 3-way match** helpers. |
| Manufacturing (BOM / production orders / machines / batches / QC) | Runtime present in `manufacturing-v10`; **added BOM explode / machine picker / OEE**. |
| Inventory (stock / transfers / adjustments / expiry / batch / serial / reorder) | Present; **added ROP, FEFO buckets, availability**. |
| Warehouse (inbound / outbound / picking / packing / dispatch / returns / bins) | Present in `warehouse-v10`; **added pick-path optimizer**. |
| Finance (purchases / sales / expenses / assets / cost-centers / budgets / tax / GST / invoices / payments / ledger) | Present in `finance/*`; **added balanced journal builder + FX conversion**. |
| Supply Chain (demand forecast, supplier risk, shortage, reorder) | **New — this module.** |
| Business Health / Risk detection | **New — this module.** |
| Multi-company / multi-branch / multi-currency | Reused org hierarchy + FX helper. |
| Brain / DH integration | **New resolvers — this module.** |

## Duplicate Detection & Shims

- `manufacturing-v7.functions.ts` and `finance-v7.functions.ts` are historical siblings — **canonical = `-v10` / `finance/*`**. No new `-v{N+1}` created here.
- Zero new tables, RPCs, routes.

## Files Changed

- **Added:** `src/lib/happy-r123/erp-intelligence.ts`
- **Added:** `tests/unit/happy-r123.test.ts`
- **Added:** `docs/erp/R123_ERP_INTELLIGENCE.md`

## Impact

- **Architecture:** Extension only; canonical owners unchanged.
- **Database:** Zero migrations. Reuses `purchase_orders`, `goods_receipts`, `production_orders`, `bill_of_materials`, `bom_items`, `inventory_items`, `inventory_lots`, `inventory_transactions`, `warehouses`, `warehouse_bins`, `stock_transfers`, `vendor_bills`, `journal_entries`, `journal_lines`, `chart_of_accounts`, `tax_rates`, `gst_returns`, etc.
- **API:** Zero new RPCs. All writes flow through existing ERP RPC surface.
- **Security:** Pure helpers, no auth surface changed. Role×cap matrix is UI-side guidance; server-side RLS remains source of truth.
- **Performance:** All helpers O(n); no I/O.
- **Scalability:** Analytics snapshot is O(n) over passed rows — pagination stays at RPC layer.

## Tests

`tests/unit/happy-r123.test.ts` — 14 test blocks covering every phase. All green.

## Known Limitations

- Advanced MRP (multi-level BOM netting, capacity-constrained scheduling) is left to the manufacturing runtime; this layer explodes single-level BOM only.
- FX rates are caller-supplied; a live rate feed remains external-BLOCKED until credentials.
- Statutory tax packs (jurisdiction-specific GST/VAT/e-invoicing) remain in their runtime; helper stays neutral.

## Remaining Work

R124 continues once Founder acknowledges ERP lock.
