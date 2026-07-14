/** /enterprise/workflows — Workflow builder inventory & background jobs. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { useEnterprise } from "@/components/enterprise/EnterpriseContext";
import { NoCompanySelected } from "@/components/enterprise/NoCompanySelected";
import { entListWorkflows } from "@/lib/enterprise-v1.functions";
import { opsQueueStats } from "@/lib/ops-v1.functions";
import { Workflow, ListChecks, AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enterprise/workflows")({
  head: () => ({ meta: [{ title: "Workflows — Enterprise" }, { name: "robots", content: "noindex" }] }),
  component: Workflows,
});

function Workflows() {
  const { companyId, companies } = useEnterprise();
  const workflows = useQuery({ queryKey: ["ent", "workflows", companyId], enabled: !!companyId, queryFn: () => entListWorkflows({ data: { company_id: companyId! } }) });
  const queue = useQuery({ queryKey: ["ent", "queue", companyId], enabled: !!companyId, queryFn: () => opsQueueStats(), refetchInterval: 15_000 });

  if (!companyId) return (<><PageHeader eyebrow="Automation" title="Workflows" /><NoCompanySelected hasAny={companies.length > 0} /></>);

  const rows = (workflows.data ?? []) as Array<{ id: string; name: string; description?: string; status?: string; category?: string; created_at?: string }>;
  const q = (queue.data ?? {}) as { pending?: number; running?: number; failed?: number; done?: number };

  return (
    <>
      <PageHeader eyebrow="Automation" title="Workflow Engine" description="Approvals, automations, scheduled jobs and background tasks — the company's automation fabric." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Workflows" value={rows.length.toLocaleString()} icon={<Workflow className="h-4 w-4" />} />
        <StatCard label="Queue Pending" value={(q.pending ?? 0).toLocaleString()} icon={<ListChecks className="h-4 w-4" />} />
        <StatCard label="Running" value={(q.running ?? 0).toLocaleString()} icon={<ListChecks className="h-4 w-4" />} />
        <StatCard label="Failed" value={(q.failed ?? 0).toLocaleString()} icon={<AlertOctagon className="h-4 w-4" />} trend={q.failed ? "down" : "flat"} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Workflows</h2>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {rows.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">{w.name}</div>
                <div className="truncate text-[11px] text-soft-gray">{w.description ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                {w.category && <Chip>{w.category}</Chip>}
                <Chip tone={w.status === "active" ? "success" : "neutral"}>{w.status ?? "—"}</Chip>
              </div>
            </li>
          ))}
          {!rows.length && <li className="py-2 text-xs text-soft-gray">No workflows configured.</li>}
        </ul>
      </Panel>
    </>
  );
}
