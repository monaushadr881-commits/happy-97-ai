import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, StatCard, Chip, EmptyState } from "@/design-system/primitives";
import { getReleaseDashboard } from "@/lib/release-r64/release-dashboard-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const fn = useServerFn(getReleaseDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["r64", "dashboard"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
  });

  return (
    <ReleasePageShell title="Founder Release Center" description="Live view of releases, artifacts, pipeline, rollouts, and store status.">
      {isLoading && <Panel className="p-6 text-soft-gray text-sm">Loading dashboard…</Panel>}
      {error && <Panel className="p-6 text-red-400 text-sm">{(error as Error).message}</Panel>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Current Release" value={data.widgets.current_release?.version ?? "—"} />
            <StatCard label="Latest Stable" value={data.widgets.latest_stable?.version ?? "—"} />
            <StatCard label="Drafts" value={String(data.widgets.drafts_count)} />
            <StatCard label="Publishing Queue" value={String(data.widgets.publishing_queue_count)} />
            <StatCard label="Artifacts (recent)" value={String(data.widgets.artifacts_count)} />
            <StatCard label="Builds Running" value={String(data.widgets.builds_by_status?.running ?? 0)} />
            <StatCard label="Builds Blocked" value={String(data.widgets.builds_by_status?.blocked ?? 0)} />
            <StatCard label="Rollouts Active" value={String(data.widgets.rollout_states?.active ?? 0)} />
          </div>

          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Store Status</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {data.stores.map((s) => (
                <div key={s.store} className="flex items-center justify-between border border-white/5 rounded-md px-3 py-2">
                  <div>
                    <div className="text-sm text-paper">{s.store}</div>
                    {s.blocked_reason && <div className="text-xs text-soft-gray">{s.blocked_reason}</div>}
                  </div>
                  <Chip tone={s.status === "ok" ? "success" : "warning"}>{s.status}</Chip>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="text-sm font-semibold text-paper mb-3">Recent Builds</h3>
            {data.pipeline.recent_builds.length === 0 ? (
              <EmptyState title="No builds yet" description="Queue a build from the Builds tab." />
            ) : (
              <table className="w-full text-xs">
                <thead className="text-soft-gray text-left">
                  <tr><th className="py-1">Platform</th><th>Status</th><th>Kind</th><th>Queued</th><th>Duration</th></tr>
                </thead>
                <tbody>
                  {data.pipeline.recent_builds.slice(0, 10).map((b: any) => (
                    <tr key={b.id} className="border-t border-white/5">
                      <td className="py-1 text-paper">{b.platform_code}</td>
                      <td><Chip tone={b.status === "succeeded" ? "success" : b.status === "failed" ? "danger" : "warning"}>{b.status}</Chip></td>
                      <td>{b.build_kind ?? "—"}</td>
                      <td className="text-soft-gray">{new Date(b.queued_at).toLocaleString()}</td>
                      <td className="text-soft-gray">{b.duration_ms ? `${Math.round(b.duration_ms / 1000)}s` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}
    </ReleasePageShell>
  );
}
