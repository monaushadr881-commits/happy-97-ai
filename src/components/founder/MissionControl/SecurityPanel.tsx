import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["security"] | undefined;

export const SecurityPanel = memo(function SecurityPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Security Runtime · Coverage
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
        <StatCard label="Open alerts" value={fmt(data?.alerts.open)} />
        <StatCard label="Failed logins 24h" value={fmt(data?.logins_24h.failed)} />
        <StatCard label="Critical audit 24h" value={fmt(data?.audit_24h.critical)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Policy Layers
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.coverage ?? []).map((l) => (
              <li key={l.layer} className="flex items-center justify-between py-2 text-sm">
                <span className="text-paper">{l.layer}</span>
                <span
                  className={
                    l.status === "healthy"
                      ? "text-[11px] uppercase tracking-[0.12em] text-emerald-300"
                      : l.status === "degraded"
                      ? "text-[11px] uppercase tracking-[0.12em] text-amber-300"
                      : "text-[11px] uppercase tracking-[0.12em] text-soft-gray"
                  }
                >
                  {l.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Recent Security Alerts
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.alerts.recent ?? []).slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.alert_type}</div>
                  <div className="truncate text-[11px] text-soft-gray">{r.message}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-gold">{r.severity}</div>
                  <div className="text-[11px] text-soft-gray">{ago(r.created_at)}</div>
                </div>
              </li>
            ))}
            {!data?.alerts.recent.length && (
              <li className="py-2 text-xs text-soft-gray">No security alerts recorded.</li>
            )}
          </ul>
        </div>
      </div>
      <Hairline className="my-4" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Successful logins 24h" value={fmt(data?.logins_24h.success)} />
        <StatCard label="Approvals enforcing" value={fmt(data?.approvals_enforcing)} />
        <StatCard label="RBAC RPC" value={data?.rbac.rpc_ok ? "OK" : "FAIL"} />
        <StatCard label="Audit warn 24h" value={fmt(data?.audit_24h.warning)} />
      </div>
    </Panel>
  );
});
