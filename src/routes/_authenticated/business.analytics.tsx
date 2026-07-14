/** /business/analytics — Executive analytics across sales, invoices, expenses. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizAnalyticsSeries } from "@/lib/business-v1.functions";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Analytics,
});

type Row = { date: string; orders: number; invoiced: number; collected: number; expenses: number };
function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[80px_1fr_100px] items-center gap-3 text-xs">
      <span className="text-soft-gray">{label}</span>
      <div className="h-2 rounded bg-white/5 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="numeric text-paper text-right">{money(value)}</span>
    </div>
  );
}

function Analytics() {
  const { companyId, companies } = useBusiness();
  const q = useQuery({ queryKey: ["biz", "series", companyId], enabled: !!companyId, queryFn: () => bizAnalyticsSeries({ data: { company_id: companyId!, days: 30 } }) });
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Analytics" /><NoCompany hasAny={companies.length > 0} /></>);
  const rows = (q.data ?? []) as Row[];
  const totals = rows.reduce((a, r) => ({
    orders: a.orders + r.orders, invoiced: a.invoiced + r.invoiced,
    collected: a.collected + r.collected, expenses: a.expenses + r.expenses,
  }), { orders: 0, invoiced: 0, collected: 0, expenses: 0 });
  const max = Math.max(1, ...rows.map((r) => Math.max(r.orders, r.invoiced, r.collected, r.expenses)));

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Executive Analytics" description="30-day trend of orders, invoicing, collections and expenses — company-wide." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Orders (30d)" value={money(totals.orders)} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Invoiced (30d)" value={money(totals.invoiced)} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Collected (30d)" value={money(totals.collected)} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Expenses (30d)" value={money(totals.expenses)} icon={<BarChart3 className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Daily Financial Series</h2>
        <Hairline className="my-4" />
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.date} className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{r.date}</div>
              <Bar label="Orders" value={r.orders} max={max} tone="bg-gold" />
              <Bar label="Invoiced" value={r.invoiced} max={max} tone="bg-emerald-500/70" />
              <Bar label="Collected" value={r.collected} max={max} tone="bg-blue-500/70" />
              <Bar label="Expenses" value={r.expenses} max={max} tone="bg-red-500/70" />
            </div>
          ))}
          {!rows.length && <p className="text-xs text-soft-gray">No transactions in this window.</p>}
        </div>
      </Panel>
    </>
  );
}
