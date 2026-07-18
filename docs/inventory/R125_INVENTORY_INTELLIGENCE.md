# R125 — HAPPY Inventory & Warehouse Intelligence™

**Founder Lock:** R91 · R111 · R113. No Inventory V2. No duplicate runtime, DB, or API.

## Canonical Owners (reused, not duplicated)

| Domain | Canonical Owner |
|---|---|
| ERP inventory RPCs | `src/lib/erp/engine.ts` + `src/lib/erp/erp.functions.ts` |
| Warehouse runtime | `src/lib/warehouse-v10.functions.ts` |
| Manufacturing | `src/lib/manufacturing-v10.functions.ts` |
| Business inventory surface | `src/lib/business-v1.functions.ts` |
| ERP intelligence (peer layer) | `src/lib/happy-r123/erp-intelligence.ts` |
| Brain / Memory / Workspace / Search / Files / DH | R115–R120 canonical owners |

## Extension Layer

`src/lib/happy-r125/inventory-intelligence.ts` — pure helpers, no state, no I/O:

- **Phase 2 Types** — `MovementKind`, `LocationKind`, `TrackingMode`, `AbcClass`, `MovementVelocity`, `WarehouseMode`, `InventoryRole`, `InventoryCap`, `StockLine`, `Location`, `PickTask`.
- **Phase 3 Inventory** — `availableQty`, `projectedOnHand`, `safetyStock` (z·σ·√L), `reorderPoint`, `eoq`, `needsReorder`, `abcClassify` (Pareto 80/15/5), `velocity`, `deadStock` (>180d idle).
- **Phase 4 Warehouse** — `optimizePickPath` (zone→bin), `packingPlan` (first-fit box packing), `crossDockCandidate`, `suggestPutawayBin` (velocity zone bias).
- **Phase 5 Tracking** — `expiryBucket` (expired/critical/warning/ok), `fefoOrder`, `traceabilityChain` (upstream/downstream batch).
- **Phase 6 AI** — `forecastDemand` (SMA), `suggestReorder` (write_off / urgent / reorder / hold), `expiryAlerts`, `warehouseScore` (fill·accuracy·on-time·inventory).
- **Phase 7 Brain** — `resolveForBrain(prompt)` → 9 inventory domains (stock, warehouse, picking, receiving, expiry, traceability, reorder, transfer, cycle_count).
- **Phase 8 DH** — `pickDhInventoryMode` → warehouse / inventory / factory / manager / presentation.
- **Phase 9 Analytics** — `inventoryTurns`, `stockHealth`, `inventoryAccuracy`, `inventorySnapshot`.
- **Permissions** — `inventoryCan(role, cap)` — 7 roles × 9 caps.

## Gap Report

| Area | Status |
|---|---|
| Stock levels / availability | Runtime present in ERP + business; **added availability, projected on-hand, ROP, safety stock, EOQ**. |
| Batch / serial / lot / expiry | Schema present; **added FEFO ordering, expiry buckets, traceability chain**. |
| Warehouse zones / bins / picking / packing / dispatch | `warehouse-v10` runtime; **added pick-path optimizer, packing plan, cross-dock, putaway suggestion**. |
| ABC / fast / slow / dead stock | **New — this module.** |
| Demand prediction / reorder suggestions | Extends R123 forecast with reorder decisioning. |
| Expiry alerts / warehouse optimization score | **New.** |
| Brain / DH integration | **New resolvers.** |
| Analytics: turns, health, accuracy, snapshot | **New.** |

## Duplicate Detection

- `warehouse-v10` and `manufacturing-v10` are the canonical runtimes; **no `-v{N+1}` created**.
- Zero new tables, RPCs, routes. All persistence remains in existing owners.

## Files Changed

- **Added:** `src/lib/happy-r125/inventory-intelligence.ts`
- **Added:** `tests/unit/happy-r125.test.ts`
- **Added:** `docs/inventory/R125_INVENTORY_INTELLIGENCE.md`

## Architecture / DB / API / Security / Performance Impact

- **Architecture:** Extension only; canonical owners unchanged.
- **Database:** Zero migrations. Reuses `inventory_items`, `inventory_lots`, `inventory_transactions`, `warehouses`, `warehouse_bins`, `stock_transfers`.
- **API:** Zero new RPCs.
- **Security:** Pure helpers; RLS remains source of truth. Role×cap matrix is UI-side guidance.
- **Performance:** All helpers O(n) except `abcClassify` which is O(n log n) via sort. No I/O.

## Tests

`tests/unit/happy-r125.test.ts` — 12 blocks covering every phase.

## Known Limitations

- SMA-only forecasting; seasonal/Holt-Winters left for a later revision.
- EOQ assumes constant demand and holding cost; multi-tier discount pricing is caller's responsibility.
- Cross-dock detector is single-inbound/single-outbound; multi-source aggregation stays in the warehouse runtime.

## Remaining Work

R126 continues once Founder acknowledges Inventory lock.
