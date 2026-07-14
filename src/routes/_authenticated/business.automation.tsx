/** /business/automation — Workflows, approvals, business rules. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useBusiness } from "@/components/business/BusinessContext";
import { NoCompany } from "@/components/business/NoCompany";
import { bizListWorkflows, bizWorkflowRuns } from "@/lib/business-v1.functions";
import { Workflow, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/automation")({
  head: () => ({ meta: [{ title: "Automation — Business OS" }, { name: "robots", content: "noindex" }] }),
  component: Automation,
});

type WF = { id: string; name: string; trigger: string | null; is_active: boolean; updated_at: string };
type Run = { id: string; workflow_id: string; status: string | null; started_at: string | null; completed_at: string | null; error: string | null };

function Automation() {
  const { companyId, companies } = useBusiness();
  const wf = useQuery({ queryKey: ["biz", "wf", companyId], enabled: !!companyId, queryFn: () => bizListWorkflows({ data: { company_id: companyId!, limit: 100 } }) });
  const runs = useQuery({ queryKey: ["biz", "runs", companyId], enabled: !!companyId, queryFn: () => bizWorkflowRuns({ data: { company_id: companyId!, limit: 50 } }) });

  if (!companyId) return (<><PageHeader eyebrow="Business OS" title="Automation" /><NoCompany hasAny={companies.length > 0} /></>);
  const w = (wf.data ?? []) as WF[];
  const r = (runs.data ?? []) as Run[];
  const failed = r.filter((x) => x.status === "failed").length;

  return (
    <>
      <PageHeader eyebrow="Business OS" title="Automation & Workflows" description="Approvals, business rules, notifications, scheduled jobs — powered by the shared workflow engine." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Workflows" value={w.length.toLocaleString()} icon={<Workflow className="h-4 w-4" />} />
        <StatCard label="Active" value={w.filter((x) => x.is_active).length.toLocaleString()} icon={<Workflow className="h-4 w-4" />} />
        <StatCard label="Recent Runs" value={r.length.toLocaleString()} icon={<PlayCircle className="h-4 w-4" />} />
        <StatCard label="Failed" value={failed.toLocaleString()} icon={<PlayCircle className="h-4 w-4" />} />
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Workflows</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {w.slice(0, 12).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.name}</div>
                  <div className="text-[11px] text-soft-gray">Trigger: {x.trigger ?? "manual"}</div>
                </div>
                <Chip tone={x.is_active ? "success" : "info"}>{x.is_active ? "on" : "off"}</Chip>
              </li>
            ))}
            {!w.length && <li className="py-2 text-xs text-soft-gray">No workflows yet.</li>}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Runs</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {r.slice(0, 12).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{x.workflow_id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{x.started_at ? new Date(x.started_at).toLocaleString() : "—"}</div>
                </div>
                <Chip tone={x.status === "succeeded" ? "success" : x.status === "failed" ? "danger" : "info"}>{x.status ?? "—"}</Chip>
              </li>
            ))}
            {!r.length && <li className="py-2 text-xs text-soft-gray">No runs.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
