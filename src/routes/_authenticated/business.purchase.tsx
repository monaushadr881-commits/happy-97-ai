/** /business/purchase — Suppliers, Purchase Orders, Vendor Bills. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListSuppliers, bizListPurchaseOrders } from "@/lib/business-v1.functions";
import { Truck, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/purchase")({
  head: () => ({ meta: [{ title: "Purchase — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Purchase,
});

type Supplier = { id: string; name: string | null; code: string | null; email: string | null; status: string | null };
type PO = { id: string; number: string | null; status: string | null; total_cents: number | null; currency: string | null; ordered_at: string | null; received_at: string | null };

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Purchase() {
  const { companyId, companies } = useBusiness();
  const sup = useQuery({ queryKey: ["biz", "sup", companyId], enabled: !!companyId, queryFn: () => bizListSuppliers({ data: { company_id: companyId!, limit: 100 } }) });
  const po = useQuery({ queryKey: ["biz", "po", companyId], enabled: !!companyId, queryFn: () => bizListPurchaseOrders({ data: { company_id: companyId!, limit: 100 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Purchase" /><NoCompany hasAny={companies.length > 0} /></>);
  const s = (sup.data ?? []) as Supplier[];
  const p = (po.data ?? []) as PO[];
  const spend = p.reduce((a, r) => a + (r.total_cents ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Purchase & Vendor Management" description="Purchase requests, orders, goods receipt and supplier analytics." />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Suppliers" value={s.length.toLocaleString()} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Purchase Orders" value={p.length.toLocaleString()} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Total Spend" value={money(spend)} icon={<ClipboardList className="h-4 w-4" />} />
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Suppliers</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {s.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.email ?? r.code ?? "—"}</div>
                </div>
                <Chip tone={r.status === "active" ? "success" : "info"}>{r.status ?? "—"}</Chip>
              </li>
            ))}
            {!s.length && <li className="py-2 text-xs text-soft-gray">No suppliers.</li>}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Purchase Orders</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {p.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.number ?? r.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{r.ordered_at ? new Date(r.ordered_at).toLocaleDateString() : "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{money(r.total_cents ?? 0)}</span>
                  <Chip tone={r.status === "received" ? "success" : r.status === "cancelled" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!p.length && <li className="py-2 text-xs text-soft-gray">No purchase orders.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
