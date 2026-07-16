import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReleasePageShell } from "./-shell";
import { Panel, StatCard } from "@/design-system/primitives";
import { getPipelineAnalytics, getReleaseAnalytics, getDailyMetrics } from "@/lib/release-r64/release-analytics-r64.functions";

export const Route = createFileRoute("/_authenticated/releases/analytics")({
  component: () => {
    const pipeFn = useServerFn(getPipelineAnalytics);
    const relFn = useServerFn(getReleaseAnalytics);
    const dayFn = useServerFn(getDailyMetrics);
    const pipe = useQuery({ queryKey: ["r64", "pipe-analytics"], queryFn: () => pipeFn({ data: {} }) });
    const rel = useQuery({ queryKey: ["r64", "rel-analytics"], queryFn: () => relFn({ data: {} }) });
    const days = useQuery({ queryKey: ["r64", "daily-metrics"], queryFn: () => dayFn() });
    return (
      <ReleasePageShell title="Release Analytics" description="Success rate, deploy time, failure rate, rollback rate, adoption, store analytics.">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Builds (30d)" value={String(pipe.data?.builds_total ?? "—")} />
            <StatCard label="Success rate" value={pipe.data ? `${Math.round(pipe.data.success_rate * 100)}%` : "—"} />
            <StatCard label="Failure rate" value={pipe.data ? `${Math.round(pipe.data.failure_rate * 100)}%` : "—"} />
            <StatCard label="Blocked rate" value={pipe.data ? `${Math.round(pipe.data.blocked_rate * 100)}%` : "—"} />
            <StatCard label="Avg build" value={pipe.data?.avg_duration_ms ? `${Math.round(pipe.data.avg_duration_ms / 1000)}s` : "—"} />
            <StatCard label="Releases (90d)" value={String(rel.data?.releases_total ?? "—")} />
            <StatCard label="Published" value={String(rel.data?.releases_published ?? "—")} />
            <StatCard label="Rollbacks" value={String(rel.data?.rollback_count ?? "—")} />
          </div>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold mb-3">Store Totals</h3>
            <pre className="text-[11px] text-soft-gray overflow-auto">{JSON.stringify(rel.data?.store_totals ?? {}, null, 2)}</pre>
          </Panel>
          <Panel className="p-6">
            <h3 className="text-sm font-semibold mb-3">Daily Pipeline (last 60 days)</h3>
            <div className="text-xs text-soft-gray">{days.data?.days.length ?? 0} snapshots</div>
          </Panel>
        </div>
      </ReleasePageShell>
    );
  },
});
