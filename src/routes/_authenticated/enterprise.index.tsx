/**
 * /enterprise — Overview.
 * Live KPI grid for the selected company + a company-scoped activity feed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Hairline, Chip } from "@/design-system/primitives";
import { entCompanyOverview } from "@/lib/enterprise-v1.functions";
import { apiRecentAudit } from "@/lib/api-v1.functions";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import {
  Users, UserCircle2, ShoppingCart, Receipt, Layers, Building2, Workflow,
  Megaphone, Boxes, Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/")({
  head: () => ({ meta: [{ title: "Overview — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: EnterpriseOverview,
});

function EnterpriseOverview() {
  const { companyId, current, companies } = useEnterprise();

  const overview = useQuery({
    queryKey: ["ent", "overview", companyId],
    enabled: !!companyId,
    queryFn: () => entCompanyOverview({ data: { company_id: companyId! } }),
    refetchInterval: 30_000,
  });

  const audit = useQuery({
    queryKey: ["ent", "audit", companyId],
    enabled: !!companyId,
    queryFn: () => apiRecentAudit({ data: { limit: 15, company_id: companyId! } }),
  });

  if (!companyId) {
    return (
      <>
        <PageHeader eyebrow="Enterprise · Live" title="Control Center" description="Operate every layer of a company from one command surface." />
        <NoCompanySelected hasAny={companies.length > 0} />
      </>
    );
  }

  const o = (overview.data ?? {}) as Record<string, number>;
  const num = (n: number | undefined) => (typeof n === "number" ? n.toLocaleString() : "—");
  const name = current?.display_name ?? current?.legal_name ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Enterprise · Live"
        title={name || "Control Center"}
        description="Every dashboard, every module, every user — scoped to this company by RLS."
        actions={<Chip tone="gold">Company</Chip>}
      />

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Employees" value={num(o.employees)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Customers" value={num(o.customers)} icon={<UserCircle2 className="h-4 w-4" />} />
        <StatCard label="Orders" value={num(o.orders)} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Invoices" value={num(o.invoices)} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Workflows" value={num(o.workflows)} icon={<Workflow className="h-4 w-4" />} />
        <StatCard label="Brands" value={num(o.brands)} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Workspaces" value={num(o.workspaces)} icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Departments" value={num(o.departments)} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Offices" value={num(o.offices)} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Announcements" value={num(o.announcements)} icon={<Megaphone className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Activity</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {(Array.isArray(audit.data) ? audit.data : []).map((a: { id: string; action?: string; entity_type?: string | null; created_at?: string; actor_id?: string | null }) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper"><span className="text-gold">{a.action}</span>{a.entity_type ? <span className="text-soft-gray"> · {a.entity_type}</span> : null}</div>
                <div className="text-[11px] text-soft-gray">{a.actor_id ?? "system"}</div>
              </div>
              <time className="numeric text-[11px] text-soft-gray">{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</time>
            </li>
          ))}
          {!Array.isArray(audit.data) || !audit.data.length ? (
            <li className="py-3 text-xs text-soft-gray">No activity recorded.</li>
          ) : null}
        </ul>
      </Panel>
    </>
  );
}
