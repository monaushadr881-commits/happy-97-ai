import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["business"] | undefined;

export const BusinessPanel = memo(function BusinessPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Business OS · Runtime Coverage
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
        <StatCard label="Pending approvals" value={fmt(data?.pending_approvals)} />
        <StatCard label="Audit 24h" value={fmt(data?.audit_24h)} />
        <StatCard label="Customers" value={fmt(data?.kpis.customers)} />
        <StatCard label="Leads" value={fmt(data?.kpis.leads)} />
        <StatCard label="Deals" value={fmt(data?.kpis.deals)} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        <StatCard label="Sales orders" value={fmt(data?.kpis.sales_orders)} />
        <StatCard label="Purchase orders" value={fmt(data?.kpis.purchase_orders)} />
        <StatCard label="Suppliers" value={fmt(data?.kpis.suppliers)} />
        <StatCard label="Employees" value={fmt(data?.kpis.employees)} />
        <StatCard label="Support tickets" value={fmt(data?.kpis.support_tickets)} />
        <StatCard label="Meetings" value={fmt(data?.kpis.meetings)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Module Coverage
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.coverage ?? []).map((c) => (
              <li key={c.module} className="flex items-center justify-between py-2 text-sm">
                <span className="text-paper">{c.module}</span>
                <span
                  className={
                    c.status === "wired"
                      ? "text-[11px] uppercase tracking-[0.12em] text-emerald-300"
                      : "text-[11px] uppercase tracking-[0.12em] text-soft-gray"
                  }
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Pending / Recent Approvals
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent_approvals ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.title}</div>
                  <div className="truncate text-[11px] text-soft-gray">{r.entity_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-gold">{r.status}</div>
                  <div className="text-[11px] text-soft-gray">{ago(r.created_at)}</div>
                </div>
              </li>
            ))}
            {!data?.recent_approvals.length && (
              <li className="py-2 text-xs text-soft-gray">No business approvals yet.</li>
            )}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Business Audit Timeline
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent_audit ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.category}</div>
                  <div className="truncate text-[11px] text-soft-gray">
                    {r.action} · {r.entity_type ?? "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-gold">
                    {r.severity ?? "info"}
                  </div>
                  <div className="text-[11px] text-soft-gray">{ago(r.occurred_at)}</div>
                </div>
              </li>
            ))}
            {!data?.recent_audit.length && (
              <li className="py-2 text-xs text-soft-gray">
                No business events recorded in the last 24h.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
