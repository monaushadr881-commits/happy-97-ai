/** /business/crm — Customers, Leads, Deals (pipeline). */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListCustomers, bizListLeads, bizListDeals } from "@/lib/business-v1.functions";
import { Users, UserPlus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/crm")({
  head: () => ({ meta: [{ title: "CRM — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: CRM,
});

type Customer = { id: string; name: string | null; email: string | null; code: string | null; status: string | null; created_at: string };
type Lead = { id: string; name: string | null; email: string | null; stage: string | null; status: string | null; score: number | null; source: string | null; created_at: string };
type Deal = { id: string; title: string | null; stage: string | null; amount_cents: number | null; currency: string | null; probability: number | null; expected_close_at: string | null };

const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

function CRM() {
  const { companyId, companies } = useBusiness();
  const customers = useQuery({ queryKey: ["biz", "customers", companyId], enabled: !!companyId, queryFn: () => bizListCustomers({ data: { company_id: companyId!, limit: 100 } }) });
  const leads = useQuery({ queryKey: ["biz", "leads", companyId], enabled: !!companyId, queryFn: () => bizListLeads({ data: { company_id: companyId!, limit: 100 } }) });
  const deals = useQuery({ queryKey: ["biz", "deals", companyId], enabled: !!companyId, queryFn: () => bizListDeals({ data: { company_id: companyId!, limit: 200 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="CRM" /><NoCompany hasAny={companies.length > 0} /></>);

  const c = (customers.data ?? []) as unknown as Customer[];
  const l = (leads.data ?? []) as unknown as Lead[];
  const d = (deals.data ?? []) as unknown as Deal[];
  const pipelineByStage: Record<string, { count: number; total: number }> = {};
  for (const x of d) {
    const st = (x.stage ?? "new").toLowerCase();
    (pipelineByStage[st] ??= { count: 0, total: 0 });
    pipelineByStage[st].count += 1;
    pipelineByStage[st].total += x.amount_cents ?? 0;
  }

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Customer Relationship Management" description="Contacts, leads, deals — a unified customer timeline." />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Customers" value={c.length.toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Open Leads" value={l.filter((x) => x.status !== "won" && x.status !== "lost").length.toLocaleString()} icon={<UserPlus className="h-4 w-4" />} />
        <StatCard label="Open Deals" value={d.length.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Deal Pipeline</h2>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {stages.map((st) => {
            const v = pipelineByStage[st] ?? { count: 0, total: 0 };
            return (
              <div key={st} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{st}</div>
                <div className="mt-1 text-lg text-paper numeric">{v.count}</div>
                <div className="text-[11px] text-soft-gray">${(v.total / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Customers</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {c.slice(0, 12).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{x.email ?? x.code ?? x.id.slice(0, 8)}</div>
                </div>
                <Chip tone={x.status === "active" ? "success" : "info"}>{x.status ?? "—"}</Chip>
              </li>
            ))}
            {!c.length && <li className="py-2 text-xs text-soft-gray">No customers.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Latest Leads</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {l.slice(0, 12).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{x.source ?? "direct"} · score {x.score ?? 0}</div>
                </div>
                <Chip tone={x.status === "won" ? "success" : x.status === "lost" ? "danger" : "info"}>{x.stage ?? x.status ?? "—"}</Chip>
              </li>
            ))}
            {!l.length && <li className="py-2 text-xs text-soft-gray">No leads.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
