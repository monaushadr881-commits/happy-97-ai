/** /business/inventory — Products, Categories, Stock positions, Low-stock alerts. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListProducts, bizListCategories, bizListInventory } from "@/lib/business-v1.functions";
import { PackageSearch, Layers, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Inventory,
});

type Product = { id: string; sku: string | null; name: string | null; status: string | null; price_cents: number | null; cost_cents: number | null; currency: string | null; is_service: boolean };
type Category = { id: string; name: string; slug: string; position: number; status: string | null };
type Position = { id: string; quantity: number | null; reserved: number | null; reorder_point: number | null; products: { name: string | null; sku: string | null } | null; warehouses: { name: string | null; code: string | null } | null };

function Inventory() {
  const { companyId, companies } = useBusiness();
  const products = useQuery({ queryKey: ["biz", "products", companyId], enabled: !!companyId, queryFn: () => bizListProducts({ data: { company_id: companyId!, limit: 100 } }) });
  const cats = useQuery({ queryKey: ["biz", "cats", companyId], enabled: !!companyId, queryFn: () => bizListCategories({ data: { company_id: companyId!, limit: 100 } }) });
  const stock = useQuery({ queryKey: ["biz", "stock", companyId], enabled: !!companyId, queryFn: () => bizListInventory({ data: { company_id: companyId!, limit: 200 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Inventory" /><NoCompany hasAny={companies.length > 0} /></>);
  const p = (products.data ?? []) as unknown as Product[];
  const c = (cats.data ?? []) as unknown as Category[];
  const s = (stock.data ?? []) as unknown as Position[];
  const low = s.filter((r) => (r.quantity ?? 0) <= (r.reorder_point ?? 0));

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Inventory & Catalog" description="Products, variants, SKU tracking, stock positions and low-stock alerts." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Products" value={p.length.toLocaleString()} icon={<PackageSearch className="h-4 w-4" />} />
        <StatCard label="Categories" value={c.length.toLocaleString()} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Stock Positions" value={s.length.toLocaleString()} icon={<PackageSearch className="h-4 w-4" />} />
        <StatCard label="Low Stock" value={low.length.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Products</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {p.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.sku ?? r.id.slice(0, 8)} {r.is_service ? "· service" : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">${((r.price_cents ?? 0) / 100).toFixed(2)}</span>
                  <Chip tone={r.status === "active" ? "success" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!p.length && <li className="py-2 text-xs text-soft-gray">No products.</li>}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Stock Positions</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {s.slice(0, 12).map((r) => (
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
            {!s.length && <li className="py-2 text-xs text-soft-gray">No stock records.</li>}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Categories</h2>
        <Hairline className="my-4" />
        <div className="flex flex-wrap gap-2">
          {c.map((x) => (
            <span key={x.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-paper">
              {x.name}
            </span>
          ))}
          {!c.length && <span className="text-xs text-soft-gray">No categories.</span>}
        </div>
      </Panel>
    </>
  );
}
