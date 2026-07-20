import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, statusTone, type MCData } from "./utils";

type Slice = MCData["automation"] | undefined;

export const AutomationPanel = memo(function AutomationPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Automation Runtime · Workflows
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
        <StatCard label="Workflows" value={fmt(data?.workflows_total)} />
        <StatCard label="Active" value={fmt(data?.workflows_active)} />
        <StatCard label="Inactive" value={fmt(data?.workflows_inactive)} />
        <StatCard label="Pending approval" value={fmt(data?.pending_approvals)} />
        <StatCard label="Runs 24h" value={fmt(data?.runs_24h)} />
        <StatCard label="Failed 24h" value={fmt(data?.runs_failed_24h)} />
      </div>
      <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
        Recent Runs
      </div>
      <ul className="divide-y divide-white/5">
        {(data?.recent_runs ?? []).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-mono text-paper">{r.workflow_id.slice(0, 8)}</div>
              <div className="text-[11px] text-soft-gray">
                {ago(r.started_at ?? r.completed_at)}
                {r.error ? ` · ${r.error.slice(0, 60)}` : ""}
              </div>
            </div>
            <Chip tone={statusTone(r.status)}>{r.status}</Chip>
          </li>
        ))}
        {!data?.recent_runs.length && (
          <li className="py-2 text-xs text-soft-gray">No workflow runs in the last window.</li>
        )}
      </ul>
    </Panel>
  );
});
