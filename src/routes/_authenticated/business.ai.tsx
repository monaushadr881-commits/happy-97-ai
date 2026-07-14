/** /business/ai — AI Business Advisor (deterministic signals from real data). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizAdvisor } from "@/lib/business-v1.functions";
import { Sparkles, AlertTriangle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/ai")({
  head: () => ({ meta: [{ title: "AI Advisor — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Advisor,
});

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Advisor() {
  const { companyId, companies } = useBusiness();
  const q = useQuery({ queryKey: ["biz", "advisor-pg", companyId], enabled: !!companyId, queryFn: () => bizAdvisor({ data: { company_id: companyId! } }) });
  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="AI Advisor" /><NoCompany hasAny={companies.length > 0} /></>);
  const a = q.data;

  return (
    <>
      <PageHeader eyebrow="Business OS" title="AI Business Advisor" description="Sales, inventory, purchase, finance, manufacturing, marketing advisors — derived from live operational data." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Inventory Positions" value={(a?.inventory_positions ?? 0).toLocaleString()} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Low Stock" value={(a?.low_stock ?? 0).toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Overdue Receivables" value={money(a?.overdue_receivables_cents ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Weighted Pipeline" value={money(a?.pipeline_weighted_cents ?? 0)} icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Advisor Insights</h2>
        <Hairline className="my-4" />
        <ul className="space-y-3">
          {(a?.insights ?? []).map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <Chip tone={s.level === "risk" ? "danger" : s.level === "warn" ? "warning" : "info"}>{s.module}</Chip>
              <span className="text-paper">{s.message}</span>
            </li>
          ))}
          {!a?.insights?.length && <li className="text-xs text-soft-gray">Loading…</li>}
        </ul>
      </Panel>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Restock Priorities</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {(a?.low_stock_top ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="text-paper">{r.name}</div>
                <div className="text-[11px] text-soft-gray">{r.sku}</div>
              </div>
              <div className="text-xs numeric text-paper">{r.quantity} / {r.reorder_point}</div>
            </li>
          ))}
          {!a?.low_stock_top?.length && <li className="py-2 text-xs text-soft-gray">No restock priorities.</li>}
        </ul>
      </Panel>
    </>
  );
}
