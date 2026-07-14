/** /business/warehouse — Warehouses, zones, picking, packing (registry). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListWarehouses, bizListInventory } from "@/lib/business-v1.functions";
import { Warehouse as WHIcon, Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/warehouse")({
  head: () => ({ meta: [{ title: "Warehouse — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Warehouses,
});

type WH = { id: string; code: string | null; name: string | null; address: string | null; status: string | null };
type Pos = { warehouse_id: string; quantity: number | null };

function Warehouses() {
  const { companyId, companies } = useBusiness();
  const wh = useQuery({ queryKey: ["biz", "wh", companyId], enabled: !!companyId, queryFn: () => bizListWarehouses({ data: { company_id: companyId!, limit: 100 } }) });
  const stock = useQuery({ queryKey: ["biz", "stock-wh", companyId], enabled: !!companyId, queryFn: () => bizListInventory({ data: { company_id: companyId!, limit: 500 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Warehouse" /><NoCompany hasAny={companies.length > 0} /></>);
  const w = (wh.data ?? []) as unknown as WH[];
  const s = (stock.data ?? []) as unknown as Pos[];
  const totalUnits = s.reduce((a, p) => a + (p.quantity ?? 0), 0);
  const byWh: Record<string, number> = {};
  for (const p of s) byWh[p.warehouse_id] = (byWh[p.warehouse_id] ?? 0) + (p.quantity ?? 0);

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Warehouse Management" description="Warehouses, zones, bins, picking, packing, shipping, receiving and transfers." />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Warehouses" value={w.length.toLocaleString()} icon={<WHIcon className="h-4 w-4" />} />
        <StatCard label="Stock Positions" value={s.length.toLocaleString()} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon={<Boxes className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Warehouses</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {w.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="text-paper">{r.name ?? "—"}</div>
                <div className="text-[11px] text-soft-gray">{r.code ?? "—"} · {r.address ?? "no address"}</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="numeric text-paper">{(byWh[r.id] ?? 0).toLocaleString()} units</span>
                <Chip tone={r.status === "active" ? "success" : "info"}>{r.status ?? "—"}</Chip>
              </div>
            </li>
          ))}
          {!w.length && <li className="py-2 text-xs text-soft-gray">No warehouses.</li>}
        </ul>
      </Panel>
    </>
  );
}
