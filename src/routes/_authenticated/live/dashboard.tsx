import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel, StatCard, Chip, EmptyState } from "@/design-system/primitives";
import { getPresenceDashboard } from "@/lib/happy-presence/presence-dashboard.functions";

export const Route = createFileRoute("/_authenticated/live/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const fn = useServerFn(getPresenceDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["hpe", "dashboard"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
  });
  return (
    <LiveShell title="Live Presence Dashboard" description="Realtime view of HAPPY across users, sessions, languages, and briefings.">
      {isLoading && <Panel className="p-6 text-soft-gray text-sm">Loading…</Panel>}
      {error && <Panel className="p-6 text-red-400 text-sm">{(error as Error).message}</Panel>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Online Now" value={String(data.online_count)} />
            <StatCard label="Recent Briefs" value={String(data.recent_briefs.length)} />
            <StatCard label="Proactive (recent)" value={String(data.recent_proactive.length)} />
            <StatCard label="Languages Tracked" value={String(data.languages.length)} />
          </div>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Presence by State</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.by_state).length === 0 && <EmptyState title="No active sessions" description="Waiting for heartbeats." />}
              {Object.entries(data.by_state).map(([k, v]) => (
                <Chip key={k} tone="info">{k}: {String(v)}</Chip>
              ))}
            </div>
          </Panel>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Recent Sessions</h3>
            <table className="w-full text-xs">
              <thead className="text-soft-gray text-left"><tr><th className="py-1">User</th><th>State</th><th>Last Heartbeat</th></tr></thead>
              <tbody>
                {data.recent_sessions.map((s: any) => (
                  <tr key={`${s.user_id}-${s.last_heartbeat}`} className="border-t border-white/5">
                    <td className="py-1 text-paper">{String(s.user_id).slice(0, 8)}…</td>
                    <td><Chip tone={s.state === "offline" ? "warning" : "success"}>{s.state}</Chip></td>
                    <td className="text-soft-gray">{new Date(s.last_heartbeat).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}
    </LiveShell>
  );
}
