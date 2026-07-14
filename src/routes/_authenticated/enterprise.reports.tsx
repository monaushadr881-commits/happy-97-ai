/** /enterprise/reports — Executive, revenue and operations reports for the company. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Hairline } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entCompanyOverview, entListInvoices, entListOrders } from "@/lib/enterprise-v1.functions";
import { LineChart as LineIcon, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/reports")({
  head: () => ({ meta: [{ title: "Reports — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Reports,
});

function Reports() {
  const { companyId, companies } = useEnterprise();
  const overview = useQuery({ queryKey: ["ent", "rep-ov", companyId], enabled: !!companyId, queryFn: () => entCompanyOverview({ data: { company_id: companyId! } }) });
  const orders = useQuery({ queryKey: ["ent", "rep-orders", companyId], enabled: !!companyId, queryFn: () => entListOrders({ data: { company_id: companyId!, limit: 200 } }) });
  const invoices = useQuery({ queryKey: ["ent", "rep-inv", companyId], enabled: !!companyId, queryFn: () => entListInvoices({ data: { company_id: companyId!, limit: 200 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Reports" title="Reports" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const oRows = (orders.data ?? []) as Array<{ total_cents?: number; created_at?: string }>;
  const iRows = (invoices.data ?? []) as Array<{ total_cents?: number; status?: string }>;
  const revenue = oRows.reduce((a, o) => a + (o.total_cents ?? 0), 0);
  const paid = iRows.filter((i) => i.status === "paid").reduce((a, i) => a + (i.total_cents ?? 0), 0);
  const o = (overview.data ?? {}) as Record<string, number>;

  // 14-day order counts.
  const days: string[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10);
  });
  const byDay = new Map<string, number>();
  for (const r of oRows) {
    if (!r.created_at) continue;
    const k = r.created_at.slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const series = days.map((k) => ({ k, v: byDay.get(k) ?? 0 }));
  const max = series.reduce((a, r) => Math.max(a, r.v), 1);

  return (
    <>
      <PageHeader eyebrow="Reports" title="Executive Reports" description="Revenue, growth and department reports — one truth per company." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Order Revenue" value={`$${(revenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Collected" value={`$${(paid / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Customers" value={(o.customers ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Employees" value={(o.employees ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <div className="flex items-center gap-2"><LineIcon className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Orders · 14-day</h2>
        </div>
        <Hairline className="my-4" />
        <div className="flex items-end gap-1.5 h-40">
          {series.map((s) => (
            <div key={s.k} className="flex-1 rounded-t bg-gradient-to-t from-gold/20 to-gold" style={{ height: `${Math.max(3, (s.v / max) * 100)}%` }} title={`${s.k} · ${s.v}`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-soft-gray"><span>{series[0]?.k}</span><span>{series[series.length - 1]?.k}</span></div>
      </Panel>
    </>
  );
}
