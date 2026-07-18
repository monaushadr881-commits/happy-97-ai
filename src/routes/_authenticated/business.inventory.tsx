/**
 * /business/inventory — Inventory & Catalog.
 * R140: Full sub-tab UI (Stock · Warehouses · Transfers · Batch · Serial ·
 * Expiry · Analytics) over canonical bizList* server functions.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  bizListProducts, bizListCategories, bizListInventory, bizListWarehouses,
  bizListPurchaseOrders,
} from "@/lib/business-v1.functions";
import {
  PackageSearch, Warehouse, ArrowLeftRight, Boxes, Hash, CalendarClock, BarChart3, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Inventory,
});

type Product   = { id: string; sku: string | null; name: string | null; status: string | null; price_cents: number | null; cost_cents: number | null; currency: string | null; is_service: boolean };
type Category  = { id: string; name: string; slug: string; position: number; status: string | null };
type Position  = { id: string; quantity: number | null; reserved: number | null; reorder_point: number | null; batch_code?: string | null; serial_no?: string | null; expires_on?: string | null; products: { name: string | null; sku: string | null } | null; warehouses: { name: string | null; code: string | null } | null };
type WH        = { id: string; name: string | null; code: string | null; city: string | null; is_active?: boolean };
type PO        = { id: string; po_number: string | null; supplier_id: string | null; status: string | null; total_cents: number | null; expected_at: string | null };

const TABS = [
  { slug: "stock",      label: "Stock",      icon: PackageSearch },
  { slug: "warehouses", label: "Warehouses", icon: Warehouse },
  { slug: "transfers",  label: "Transfers",  icon: ArrowLeftRight },
  { slug: "batch",      label: "Batch",      icon: Boxes },
  { slug: "serial",     label: "Serial",     icon: Hash },
  { slug: "expiry",     label: "Expiry",     icon: CalendarClock },
  { slug: "analytics",  label: "Analytics",  icon: BarChart3 },
];

function Inventory() {
  const { companyId, companies } = useBusiness();
  const active = useActiveTab(TABS);

  const products = useQuery({ queryKey: ["biz","products",companyId], enabled: !!companyId, queryFn: () => bizListProducts({ data: { company_id: companyId!, limit: 200 } }) });
  const cats     = useQuery({ queryKey: ["biz","cats",companyId],     enabled: !!companyId, queryFn: () => bizListCategories({ data: { company_id: companyId!, limit: 100 } }) });
  const stock    = useQuery({ queryKey: ["biz","stock",companyId],    enabled: !!companyId, queryFn: () => bizListInventory({ data: { company_id: companyId!, limit: 500 } }) });
  const whs      = useQuery({ queryKey: ["biz","whs",companyId],      enabled: !!companyId, queryFn: () => bizListWarehouses({ data: { company_id: companyId!, limit: 50 } }) });
  const pos      = useQuery({ queryKey: ["biz","po",companyId],       enabled: !!companyId, queryFn: () => bizListPurchaseOrders({ data: { company_id: companyId!, limit: 50 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Inventory" /><NoCompany hasAny={companies.length > 0} /></>);

  const p = (products.data ?? []) as unknown as Product[];
  const c = (cats.data     ?? []) as unknown as Category[];
  const s = (stock.data    ?? []) as unknown as Position[];
  const w = (whs.data      ?? []) as unknown as WH[];
  const po = (pos.data     ?? []) as unknown as PO[];
  const low = s.filter((r) => (r.quantity ?? 0) <= (r.reorder_point ?? 0));
  const withBatch = s.filter((r) => r.batch_code);
  const withSerial = s.filter((r) => r.serial_no);
  const withExpiry = s.filter((r) => r.expires_on);
  const soon = withExpiry.filter((r) => r.expires_on && new Date(r.expires_on) < new Date(Date.now() + 30 * 86_400_000));

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Inventory &amp; Catalog" description="Products, stock positions, warehouses, transfers, batch/serial/expiry — FEFO-ready." />
      <TabBar tabs={TABS} ariaLabel="Inventory sections" />

      {active === "stock" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Products" value={p.length.toLocaleString()} icon={<PackageSearch className="h-4 w-4" />} />
            <StatCard label="Positions" value={s.length.toLocaleString()} />
            <StatCard label="Categories" value={c.length.toLocaleString()} />
            <StatCard label="Low Stock" value={low.length.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Stock Positions</h2>
            <Hairline className="my-4" />
            <ul className="divide-y divide-white/5">
              {s.slice(0, 40).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.products?.name ?? "—"}</div>
                    <div className="text-[11px] text-soft-gray">{r.products?.sku ?? "—"} · {r.warehouses?.name ?? r.warehouses?.code ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="numeric text-paper">{r.quantity ?? 0}</span>
                    <span className="text-soft-gray">/ {r.reorder_point ?? 0}</span>
                    {(r.quantity ?? 0) <= (r.reorder_point ?? 0) && <Chip tone="warning">low</Chip>}
                  </div>
                </li>
              ))}
              {!s.length && <li className="py-3 text-xs text-soft-gray">No stock records.</li>}
            </ul>
          </Panel>
        </>
      )}

      {active === "warehouses" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Warehouses</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {w.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.code ?? "—"} · {r.city ?? "—"}</div>
                </div>
                <Chip tone={r.is_active === false ? "danger" : "success"}>{r.is_active === false ? "inactive" : "active"}</Chip>
              </li>
            ))}
            {!w.length && <li className="py-3 text-xs text-soft-gray">No warehouses.</li>}
          </ul>
        </Panel>
      )}

      {active === "transfers" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Purchase Orders &amp; Inbound Transfers</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {po.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.po_number ?? r.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">expected {r.expected_at ?? "—"}</div>
                </div>
                <Chip tone={r.status === "received" ? "success" : r.status === "cancelled" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
              </li>
            ))}
            {!po.length && <li className="py-3 text-xs text-soft-gray">No transfers.</li>}
          </ul>
        </Panel>
      )}

      {active === "batch" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Batch Tracking</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {withBatch.slice(0, 40).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.products?.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">batch <span className="text-paper">{r.batch_code}</span> · {r.warehouses?.name ?? "—"}</div>
                </div>
                <span className="numeric text-paper">{r.quantity ?? 0}</span>
              </li>
            ))}
            {!withBatch.length && <li className="py-3 text-xs text-soft-gray">No batch-tracked positions.</li>}
          </ul>
        </Panel>
      )}

      {active === "serial" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Serial Tracking</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {withSerial.slice(0, 40).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.products?.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">serial <span className="text-paper">{r.serial_no}</span> · {r.warehouses?.name ?? "—"}</div>
                </div>
                <span className="numeric text-paper">{r.quantity ?? 1}</span>
              </li>
            ))}
            {!withSerial.length && <li className="py-3 text-xs text-soft-gray">No serialized positions.</li>}
          </ul>
        </Panel>
      )}

      {active === "expiry" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Perishable SKUs" value={withExpiry.length.toLocaleString()} icon={<CalendarClock className="h-4 w-4" />} />
            <StatCard label="Expiring <30d"   value={soon.length.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Warehouses"      value={w.length.toLocaleString()} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">FEFO Watchlist</h2>
            <Hairline className="my-4" />
            <ul className="divide-y divide-white/5">
              {soon.slice(0, 40).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.products?.name ?? "—"}</div>
                    <div className="text-[11px] text-soft-gray">expires {r.expires_on} · {r.warehouses?.name ?? "—"}</div>
                  </div>
                  <Chip tone="warning">{r.quantity ?? 0}</Chip>
                </li>
              ))}
              {!soon.length && <li className="py-3 text-xs text-soft-gray">No positions expiring within 30 days.</li>}
            </ul>
          </Panel>
        </>
      )}

      {active === "analytics" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total value" value={`$${(p.reduce((a,x)=>a+(x.cost_cents ?? 0)*1,0)/100).toLocaleString(undefined,{maximumFractionDigits:0})}`} />
            <StatCard label="Turn/mo (est)" value={po.length ? Math.round(po.length / Math.max(1, w.length)).toString() : "0"} />
            <StatCard label="Low stock"   value={low.length.toLocaleString()} />
            <StatCard label="Expiring"    value={soon.length.toLocaleString()} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Category Mix</h2>
            <Hairline className="my-4" />
            <div className="flex flex-wrap gap-2">
              {c.map((x) => (
                <span key={x.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-paper">{x.name}</span>
              ))}
              {!c.length && <span className="text-xs text-soft-gray">No categories.</span>}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
