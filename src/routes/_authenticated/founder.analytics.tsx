/**
 * /founder/analytics — Executive Analytics.
 * Trend charts over the metrics store via opsMetricsRange, plus platform snapshot.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, StatCard } from "@/design-system/primitives";
import { opsMetricsRange } from "@/lib/ops-v1.functions";
import { apiPlatformOverview } from "@/lib/api-v1.functions";
import { TrendingUp, LineChart as LineIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderAnalytics,
});

const METRICS = [
  { key: "users.signup", label: "Signups" },
  { key: "ai.requests", label: "AI Requests" },
  { key: "revenue.orders", label: "Orders" },
  { key: "api.calls", label: "API Calls" },
] as const;

function FounderAnalytics() {
  const overview = useQuery({ queryKey: ["founder", "overview-analytics"], queryFn: () => apiPlatformOverview() });
  const ov = (overview.data ?? {}) as Record<string, number | undefined>;

  return (
    <>
      <PageHeader eyebrow="Insight" title="Executive Analytics" description="Growth, revenue, AI usage and platform performance — a single ledger of truth." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Users" value={(ov.users ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Companies" value={(ov.companies ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="AI Sessions" value={(ov.ai_sessions ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Conversations" value={(ov.conversations ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {METRICS.map((m) => <MetricPanel key={m.key} metric={m.key} label={m.label} />)}
      </div>
    </>
  );
}

function MetricPanel({ metric, label }: { metric: string; label: string }) {
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  const q = useQuery({
    queryKey: ["metric-range", metric],
    queryFn: () => opsMetricsRange({ data: { metric, from, to, bucket: "day" } }),
  });
  const rows = (Array.isArray(q.data) ? q.data : []) as Array<{ bucket: string; value: number }>;
  const max = rows.reduce((a, r) => Math.max(a, r.value), 1);

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LineIcon className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{label}</h3>
        </div>
        <span className="text-[11px] text-soft-gray">7-day</span>
      </div>
      <Hairline className="my-4" />
      {rows.length ? (
        <div className="flex items-end gap-1.5 h-32">
          {rows.map((r) => (
            <div
              key={r.bucket}
              className="flex-1 rounded-t bg-gradient-to-t from-gold/20 to-gold"
              style={{ height: `${Math.max(4, (r.value / max) * 100)}%` }}
              title={`${new Date(r.bucket).toLocaleDateString()} · ${r.value}`}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-soft-gray">No datapoints yet. Emit <code className="text-gold">{metric}</code> via opsMetricsEmit.</p>
      )}
    </Panel>
  );
}
