import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, StatCard, Chip, EmptyState } from "@/design-system/primitives";
import { getFounderAIDashboard, getFounderMorningBrief } from "@/lib/faios/founder-ai.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/dashboard")({ component: Page });

function Page() {
  const fn = useServerFn(getFounderAIDashboard);
  const briefFn = useServerFn(getFounderMorningBrief);
  const { data, isLoading, error } = useQuery({ queryKey: ["faios", "dashboard"], queryFn: () => fn(), refetchInterval: 20_000 });
  const brief = useQuery({ queryKey: ["faios", "brief"], queryFn: () => briefFn() });
  return (
    <FaiosShell title="Founder AI Dashboard" description="HAPPY listens, plans, and waits for your approval.">
      {isLoading && <Panel className="p-6 text-soft-gray text-sm">Loading…</Panel>}
      {error && <Panel className="p-6 text-red-400 text-sm">{(error as Error).message}</Panel>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Commands (recent)" value={String(data.widgets.commands_total)} />
            <StatCard label="Pending Approvals" value={String(data.widgets.pending_approvals)} />
            <StatCard label="Blocked" value={String(data.widgets.blocked)} />
            <StatCard label="Workspace Pinned" value={String(data.widgets.workspace_pinned)} />
          </div>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Morning Brief</h3>
            {brief.data ? (
              <div className="space-y-2 text-sm text-soft-gray">
                <p className="text-paper">{brief.data.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(brief.data.commands_by_status).map(([k, v]) => (
                    <Chip key={k} tone="info">{k}: {String(v)}</Chip>
                  ))}
                </div>
                <ul className="list-disc pl-5">
                  {brief.data.suggestions.map((s: string) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            ) : <p className="text-xs text-soft-gray">Preparing…</p>}
          </Panel>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Recent Commands</h3>
            {data.recent_commands.length === 0 ? <EmptyState title="No commands yet" description="Try: HAPPY improve UI" /> : (
              <ul className="text-xs space-y-2">
                {data.recent_commands.map((c: any) => (
                  <li key={c.id} className="flex items-start justify-between gap-4 border-t border-white/5 pt-2">
                    <div><p className="text-paper">{c.raw_text}</p><p className="text-soft-gray">{c.intent} · {c.category}</p></div>
                    <Chip tone={c.status === "succeeded" ? "success" : c.status === "blocked" ? "warning" : "info"}>{c.status}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </FaiosShell>
  );
}
