/**
 * /business/crm — Customer Relationship Management.
 * R140: Full sub-tab UI (Overview · Leads · Customers · Deals · Pipeline · Tasks
 * · Activities · Communications) over canonical bizList* server functions.
 * No new services, no duplicate CRM runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  bizListCustomers, bizListLeads, bizListDeals, bizListWorkflows, bizWorkflowRuns,
} from "@/lib/business-v1.functions";
import {
  Users, UserPlus, TrendingUp, GaugeCircle, ListChecks, Activity, MessageSquare,
  LayoutDashboard, Contact,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/crm")({
  head: () => ({ meta: [{ title: "CRM — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: CRM,
});

type Customer = { id: string; name: string | null; email: string | null; code: string | null; status: string | null; created_at: string };
type Lead     = { id: string; name: string | null; email: string | null; stage: string | null; status: string | null; score: number | null; source: string | null; created_at: string };
type Deal     = { id: string; title: string | null; stage: string | null; amount_cents: number | null; currency: string | null; probability: number | null; expected_close_at: string | null };
type Workflow = { id: string; name: string | null; kind: string | null; status: string | null };
type WfRun    = { id: string; workflow_id: string; status: string | null; started_at: string | null };

const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

const TABS = [
  { slug: "overview",       label: "Overview",       icon: LayoutDashboard },
  { slug: "leads",          label: "Leads",          icon: UserPlus },
  { slug: "customers",      label: "Customers",      icon: Contact },
  { slug: "deals",          label: "Deals",          icon: TrendingUp },
  { slug: "pipeline",       label: "Pipeline",       icon: GaugeCircle },
  { slug: "tasks",          label: "Tasks",          icon: ListChecks },
  { slug: "activities",     label: "Activities",     icon: Activity },
  { slug: "communications", label: "Communications", icon: MessageSquare },
];

function money(cents: number) { return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function CRM() {
  const { companyId, companies } = useBusiness();
  const active = useActiveTab(TABS);

  const customers = useQuery({ queryKey: ["biz","customers",companyId], enabled: !!companyId, queryFn: () => bizListCustomers({ data: { company_id: companyId!, limit: 200 } }) });
  const leads     = useQuery({ queryKey: ["biz","leads",companyId],     enabled: !!companyId, queryFn: () => bizListLeads({ data: { company_id: companyId!, limit: 200 } }) });
  const deals     = useQuery({ queryKey: ["biz","deals",companyId],     enabled: !!companyId, queryFn: () => bizListDeals({ data: { company_id: companyId!, limit: 200 } }) });
  const workflows = useQuery({ queryKey: ["biz","wf","crm",companyId],  enabled: !!companyId, queryFn: () => bizListWorkflows({ data: { company_id: companyId!, limit: 50 } }) });
  const runs      = useQuery({ queryKey: ["biz","wfr","crm",companyId], enabled: !!companyId, queryFn: () => bizWorkflowRuns({ data: { company_id: companyId!, limit: 50 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="CRM" /><NoCompany hasAny={companies.length > 0} /></>);

  const c = (customers.data ?? []) as unknown as Customer[];
  const l = (leads.data     ?? []) as unknown as Lead[];
  const d = (deals.data     ?? []) as unknown as Deal[];
  const w = (workflows.data ?? []) as unknown as Workflow[];
  const r = (runs.data      ?? []) as unknown as WfRun[];

  const pipeline: Record<string, { count: number; total: number }> = {};
  for (const x of d) {
    const st = (x.stage ?? "new").toLowerCase();
    (pipeline[st] ??= { count: 0, total: 0 });
    pipeline[st].count += 1;
    pipeline[st].total += x.amount_cents ?? 0;
  }
  const openLeads = l.filter((x) => x.status !== "won" && x.status !== "lost");

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Customer Relationship Management" description="Contacts, leads, deals, pipeline, tasks and communications — a unified customer timeline." />
      <TabBar tabs={TABS} ariaLabel="CRM sections" />

      {active === "overview" && (
        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Customers"    value={c.length.toLocaleString()} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Open Leads"   value={openLeads.length.toLocaleString()} icon={<UserPlus className="h-4 w-4" />} />
          <StatCard label="Open Deals"   value={d.length.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Pipeline Value" value={money(d.reduce((s,x)=>s+(x.amount_cents??0),0))} icon={<GaugeCircle className="h-4 w-4" />} />
        </section>
      )}

      {active === "leads" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Lead Management</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {l.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{x.email ?? "—"} · {x.source ?? "direct"} · score {x.score ?? 0}</div>
                </div>
                <Chip tone={x.status === "won" ? "success" : x.status === "lost" ? "danger" : "info"}>{x.stage ?? x.status ?? "—"}</Chip>
              </li>
            ))}
            {!l.length && <li className="py-3 text-xs text-soft-gray">No leads yet.</li>}
          </ul>
        </Panel>
      )}

      {active === "customers" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Customer Timeline</h2>
          <Hairline className="my-4" />
          <ul className="space-y-3">
            {c.map((x) => (
              <li key={x.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-paper">{x.name ?? "—"}</div>
                  <Chip tone={x.status === "active" ? "success" : "info"}>{x.status ?? "—"}</Chip>
                </div>
                <div className="mt-1 text-[11px] text-soft-gray">
                  {x.email ?? x.code ?? x.id.slice(0, 8)} · onboarded {new Date(x.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
            {!c.length && <li className="text-xs text-soft-gray">No customers.</li>}
          </ul>
        </Panel>
      )}

      {active === "deals" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Deals</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {d.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.title ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">
                    prob {Math.round((x.probability ?? 0) * 100)}% · close {x.expected_close_at ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="numeric text-paper">{money(x.amount_cents ?? 0)}</span>
                  <Chip tone={x.stage === "won" ? "success" : x.stage === "lost" ? "danger" : "info"}>{x.stage ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!d.length && <li className="py-3 text-xs text-soft-gray">No deals.</li>}
          </ul>
        </Panel>
      )}

      {active === "pipeline" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Pipeline Kanban</h2>
          <Hairline className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {STAGES.map((st) => {
              const v = pipeline[st] ?? { count: 0, total: 0 };
              return (
                <div key={st} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">{st}</div>
                  <div className="mt-1 text-lg text-paper numeric">{v.count}</div>
                  <div className="text-[11px] text-soft-gray">{money(v.total)}</div>
                  <ul className="mt-2 space-y-1">
                    {d.filter((x) => (x.stage ?? "new") === st).slice(0, 4).map((x) => (
                      <li key={x.id} className="truncate rounded bg-white/[0.03] px-2 py-1 text-[11px] text-paper">
                        {x.title ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {active === "tasks" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Tasks &amp; Follow-ups</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {openLeads.slice(0, 20).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">Follow up: {x.name ?? "lead"}</div>
                  <div className="text-[11px] text-soft-gray">stage {x.stage ?? "new"} · score {x.score ?? 0}</div>
                </div>
                <Chip tone={(x.score ?? 0) >= 70 ? "warning" : "info"}>{(x.score ?? 0) >= 70 ? "high priority" : "queued"}</Chip>
              </li>
            ))}
            {!openLeads.length && <li className="py-3 text-xs text-soft-gray">No open tasks.</li>}
          </ul>
        </Panel>
      )}

      {active === "activities" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Activity Log</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {r.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{w.find((y) => y.id === x.workflow_id)?.name ?? "Workflow run"}</div>
                  <div className="text-[11px] text-soft-gray">{x.started_at ?? "—"}</div>
                </div>
                <Chip tone={x.status === "succeeded" ? "success" : x.status === "failed" ? "danger" : "info"}>{x.status ?? "—"}</Chip>
              </li>
            ))}
            {!r.length && <li className="py-3 text-xs text-soft-gray">No recent activity.</li>}
          </ul>
        </Panel>
      )}

      {active === "communications" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Communications</h2>
          <Hairline className="my-4" />
          <p className="text-xs text-soft-gray">
            Outbound email, SMS, WhatsApp and voice touchpoints route through the canonical Communication Hub (R127).
            Recent messages per customer surface here as the messaging providers connect.
          </p>
          <ul className="mt-4 divide-y divide-white/5">
            {c.slice(0, 10).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.name ?? "—"}</div>
                  <div className="text-[11px] text-soft-gray">{x.email ?? "no email on file"}</div>
                </div>
                <Chip tone="neutral">no messages</Chip>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
