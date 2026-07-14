/** /business — Cockpit (KPI overview across every Business OS module). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, Panel, Hairline } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizCockpit, bizAdvisor } from "@/lib/business-v1.functions";
import { Users, ShoppingCart, Receipt, Wallet, PackageSearch, Truck, Warehouse, UserCog, Workflow, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/")({
  head: () => ({ meta: [{ title: "Cockpit — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Cockpit,
});

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function Cockpit() {
  const { companyId, companies } = useBusiness();
  const cockpit = useQuery({ queryKey: ["biz", "cockpit", companyId], enabled: !!companyId, queryFn: () => bizCockpit({ data: { company_id: companyId! } }) });
  const advisor = useQuery({ queryKey: ["biz", "advisor", companyId], enabled: !!companyId, queryFn: () => bizAdvisor({ data: { company_id: companyId! } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Cockpit" /><NoCompany hasAny={companies.length > 0} /></>);
  const k = cockpit.data;
  const a = advisor.data;

  return (
    <>
      <PageHeader
        eyebrow="Business OS"
        title="Executive Cockpit"
        description="One AI-native cockpit for CRM, ERP, HRMS, Manufacturing, Inventory, Finance and Automation. Real signals — no placeholder data."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Customers" value={(k?.customers ?? 0).toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Leads" value={(k?.leads ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Deals" value={(k?.deals ?? 0).toLocaleString()} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Sales Orders" value={(k?.orders ?? 0).toLocaleString()} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Invoices" value={(k?.invoices ?? 0).toLocaleString()} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Receivable" value={money(k?.receivable_cents ?? 0)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Collected" value={money(k?.paid_cents ?? 0)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Products" value={(k?.products ?? 0).toLocaleString()} icon={<PackageSearch className="h-4 w-4" />} />
        <StatCard label="Suppliers" value={(k?.suppliers ?? 0).toLocaleString()} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Warehouses" value={(k?.warehouses ?? 0).toLocaleString()} icon={<Warehouse className="h-4 w-4" />} />
        <StatCard label="Employees" value={(k?.employees ?? 0).toLocaleString()} icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Workflows" value={(k?.workflows ?? 0).toLocaleString()} icon={<Workflow className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">AI Advisor Signals</h2>
          <Hairline className="my-4" />
          <ul className="space-y-2">
            {(a?.insights ?? []).map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className={
                  s.level === "risk" ? "text-red-400" :
                  s.level === "warn" ? "text-amber-400" : "text-emerald-400"
                }>●</span>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{s.module}</span>
                  <div className="text-paper">{s.message}</div>
                </div>
              </li>
            ))}
            {!a?.insights?.length && <li className="text-xs text-soft-gray">Loading signals…</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Low-Stock Watchlist</h2>
          <Hairline className="my-4" />
          {(a?.low_stock_top ?? []).length ? (
            <ul className="divide-y divide-white/5">
              {a!.low_stock_top.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.name}</div>
                    <div className="text-[11px] text-soft-gray">{r.sku}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="numeric text-paper">{r.quantity} / {r.reorder_point}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-soft-gray">No low-stock alerts.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
