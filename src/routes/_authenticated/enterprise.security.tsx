/** /enterprise/security — Company-scoped audit log & permission events. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { apiRecentAudit } from "@/lib/api-v1.functions";
import { Shield, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/security")({
  head: () => ({ meta: [{ title: "Security — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: EntSecurity,
});

function EntSecurity() {
  const { companyId, companies } = useEnterprise();
  const audit = useQuery({
    queryKey: ["ent", "audit-full", companyId],
    enabled: !!companyId,
    queryFn: () => apiRecentAudit({ data: { limit: 100, company_id: companyId! } }),
  });

  if (!companyId) return (<><PageHeader eyebrow="Security" title="Security" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const rows = (Array.isArray(audit.data) ? audit.data : []) as Array<{ id: string; action?: string; entity_type?: string | null; actor_id?: string | null; created_at?: string; severity?: string | null; category?: string | null }>;
  const critical = rows.filter((r) => r.severity === "critical" || r.severity === "alert").length;
  const admin = rows.filter((r) => r.category === "admin").length;

  return (
    <>
      <PageHeader eyebrow="Security" title="Security & Audit" description="Role changes, permission events, API access and device sessions — one immutable timeline." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Events · 100" value={rows.length.toLocaleString()} icon={<Shield className="h-4 w-4" />} />
        <StatCard label="Critical" value={critical.toLocaleString()} icon={<ShieldAlert className="h-4 w-4" />} trend={critical ? "down" : "flat"} />
        <StatCard label="Admin Changes" value={admin.toLocaleString()} icon={<Shield className="h-4 w-4" />} />
        <StatCard label="Distinct Actors" value={new Set(rows.map((r) => r.actor_id)).size.toLocaleString()} icon={<Shield className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Audit Timeline</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">
                  <span className="text-gold">{r.action}</span>
                  {r.entity_type ? <span className="text-soft-gray"> · {r.entity_type}</span> : null}
                </div>
                <div className="text-[11px] text-soft-gray">{r.actor_id ?? "system"} · {r.category ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.severity && <Chip tone={r.severity === "critical" || r.severity === "alert" ? "danger" : r.severity === "warning" ? "warning" : "info"}>{r.severity}</Chip>}
                <time className="numeric text-[11px] text-soft-gray">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</time>
              </div>
            </li>
          ))}
          {!rows.length && <li className="py-2 text-xs text-soft-gray">No events.</li>}
        </ul>
      </Panel>
    </>
  );
}
