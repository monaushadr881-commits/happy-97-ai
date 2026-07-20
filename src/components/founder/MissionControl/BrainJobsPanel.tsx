import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Brain, ListChecks } from "lucide-react";
import { fmt, ago, statusTone, type MCData } from "./utils";

export const BrainJobsPanel = memo(function BrainJobsPanel({
  brain,
  jobs,
}: {
  brain: MCData["brain"] | undefined;
  jobs: MCData["jobs"] | undefined;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Brain Runtime
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <StatCard label="Active Sessions" value={fmt(brain?.active)} />
          <StatCard label="Completed 24h" value={fmt(brain?.completed_24h)} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">
          Recent Tool Calls
        </div>
        <ul className="mt-2 divide-y divide-white/5">
          {(brain?.recent_tool_calls ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">
                  <span className="text-gold">{t.tool}</span>
                  <span className="text-soft-gray"> · {t.runtime}</span>
                </div>
                <div className="text-[11px] text-soft-gray">
                  {ago(t.created_at)}
                  {t.duration_ms != null ? ` · ${t.duration_ms}ms` : ""}
                </div>
              </div>
              <Chip tone={statusTone(t.status)}>{t.status}</Chip>
            </li>
          ))}
          {!brain?.recent_tool_calls.length && (
            <li className="py-2 text-xs text-soft-gray">
              No Brain executions recorded yet.
            </li>
          )}
        </ul>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Background Jobs
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Queued" value={fmt(jobs?.pending)} />
          <StatCard label="Running" value={fmt(jobs?.running)} />
          <StatCard label="Failed" value={fmt(jobs?.failed)} />
          <StatCard label="Done" value={fmt(jobs?.done)} />
        </div>
      </Panel>
    </div>
  );
});
