/**
 * /founder/ops — Operations Command Center.
 * Composite executive dashboard: Health · Metrics · AI Usage · Security
 * · Queue · Incidents · Deployments · Database. All via ops-v1.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Chip, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import {
  opsHealthAll, opsListIncidents, opsListDeployments, opsQueueStats, opsQueueFailed, opsQueueRetry,
  opsDeploymentAnalytics, opsAiUsage, opsSecuritySummary, opsDbSchemaCounts,
} from "@/lib/ops-v1.functions";
import {
  Activity, Rocket, ListChecks, AlertOctagon, RefreshCcw, Shield, Sparkles, Database, Mic, Gauge,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/founder/ops")({
  head: () => ({ meta: [{ title: "Operations — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderOps,
});

function FounderOps() {
  const qc = useQueryClient();
  const health = useQuery({ queryKey: ["ops", "health"], queryFn: () => opsHealthAll(), refetchInterval: 20_000 });
  const incidents = useQuery({ queryKey: ["ops", "incidents"], queryFn: () => opsListIncidents({ data: {} }) });
  const deploys = useQuery({ queryKey: ["ops", "deploys"], queryFn: () => opsListDeployments({ data: {} }) });
  const dstats = useQuery({ queryKey: ["ops", "deploy-analytics"], queryFn: () => opsDeploymentAnalytics() });
  const queue = useQuery({ queryKey: ["ops", "queue-stats"], queryFn: () => opsQueueStats(), refetchInterval: 15_000 });
  const failed = useQuery({ queryKey: ["ops", "queue-failed"], queryFn: () => opsQueueFailed() });
  const ai = useQuery({ queryKey: ["ops", "ai-usage"], queryFn: () => opsAiUsage({ data: {} }), refetchInterval: 60_000 });
  const security = useQuery({ queryKey: ["ops", "security"], queryFn: () => opsSecuritySummary(), refetchInterval: 60_000 });
  const db = useQuery({ queryKey: ["ops", "db-counts"], queryFn: () => opsDbSchemaCounts() });

  const retry = useMutation({
    mutationFn: (id: string) => opsQueueRetry({ data: { id } }),
    onSuccess: () => { toast.success("Job re-queued"); qc.invalidateQueries({ queryKey: ["ops", "queue-failed"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = (queue.data ?? {}) as { pending?: number; running?: number; failed?: number; done?: number };
  const d = (dstats.data ?? {}) as { total?: number; success_rate?: number };
  const healthList = Array.isArray(health.data) ? health.data : [];
  const aiUsage = (ai.data ?? {}) as {
    total_tokens?: number; total_calls?: number; avg_latency_ms?: number;
    voice_seconds?: number; voice_calls?: number; error_rate?: number;
  };
  const sec = (security.data ?? {}) as {
    open_findings?: number; critical?: number; recent_events?: number; last_audit?: string;
  };
  const dbCounts = (db.data ?? {}) as { tables?: number; functions?: number; policies?: number };
  const healthy = healthList.filter((h: { status?: string }) => h.status === "healthy").length;
  const healthPct = healthList.length ? Math.round((healthy / healthList.length) * 100) : 100;

  return (
    <>
      <PageHeader
        eyebrow="Reliability"
        title="Operations Command Center"
        description="One executive dashboard: system health, AI & voice usage, deployments, incidents, queue, security, database. Live."
      />

      {/* Top row — headline KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="System Health" value={`${healthPct}%`} icon={<Activity className="h-4 w-4" />}
          delta={`${healthy}/${healthList.length} probes healthy`}
          trend={healthPct >= 95 ? "up" : healthPct >= 80 ? "flat" : "down"} />
        <StatCard label="Deployments" value={(d.total ?? 0).toLocaleString()} icon={<Rocket className="h-4 w-4" />}
          delta={d.success_rate != null ? `${Math.round((d.success_rate ?? 0) * 100)}% success` : undefined} trend="up" />
        <StatCard label="Queue Pending" value={(q.pending ?? 0).toLocaleString()} icon={<ListChecks className="h-4 w-4" />}
          delta={q.running != null ? `${q.running} running` : undefined} />
        <StatCard label="Queue Failed" value={(q.failed ?? 0).toLocaleString()} icon={<AlertOctagon className="h-4 w-4" />}
          trend={q.failed ? "down" : "flat"} />
      </section>

      {/* AI + Voice + Latency + Security row */}
      <section className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="AI Tokens (24h)" value={(aiUsage.total_tokens ?? 0).toLocaleString()}
          icon={<Sparkles className="h-4 w-4" />}
          delta={aiUsage.total_calls != null ? `${aiUsage.total_calls.toLocaleString()} calls` : undefined} />
        <StatCard label="Voice (24h)" value={aiUsage.voice_seconds != null ? `${Math.round((aiUsage.voice_seconds ?? 0) / 60)}m` : "—"}
          icon={<Mic className="h-4 w-4" />}
          delta={aiUsage.voice_calls != null ? `${aiUsage.voice_calls} sessions` : undefined} />
        <StatCard label="Avg Latency" value={aiUsage.avg_latency_ms != null ? `${Math.round(aiUsage.avg_latency_ms)} ms` : "—"}
          icon={<Gauge className="h-4 w-4" />}
          trend={(aiUsage.avg_latency_ms ?? 0) < 400 ? "up" : (aiUsage.avg_latency_ms ?? 0) < 900 ? "flat" : "down"} />
        <StatCard label="Security" value={(sec.open_findings ?? 0).toLocaleString()}
          icon={<Shield className="h-4 w-4" />}
          delta={sec.critical != null ? `${sec.critical} critical` : undefined}
          trend={sec.critical ? "down" : "up"} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Open Incidents</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((incidents.data ?? []) as Array<{ id: string; title: string; severity?: string; status?: string; created_at?: string }>).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{i.title}</div>
                  <div className="text-[11px] text-soft-gray">{i.created_at ? new Date(i.created_at).toLocaleString() : ""}</div>
                </div>
                <div className="flex gap-2">
                  <Chip tone={i.severity === "critical" ? "danger" : i.severity === "high" ? "warning" : "info"}>{i.severity ?? "—"}</Chip>
                  <Chip>{i.status ?? "open"}</Chip>
                </div>
              </li>
            ))}
            {!(incidents.data as unknown[] | undefined)?.length && <li className="py-3 text-xs text-soft-gray">All clear.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Deployments</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {((deploys.data ?? []) as Array<{ id: string; version?: string; environment?: string; status?: string; strategy?: string; created_at?: string }>).slice(0, 8).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{d.version ?? d.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">{d.environment} · {d.strategy}</div>
                </div>
                <Chip tone={d.status === "succeeded" ? "success" : d.status === "failed" ? "danger" : "info"}>{d.status ?? "—"}</Chip>
              </li>
            ))}
            {!(deploys.data as unknown[] | undefined)?.length && <li className="py-3 text-xs text-soft-gray">No deployments recorded.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Health Probes</h2>
            <Chip tone={healthPct >= 95 ? "success" : healthPct >= 80 ? "warning" : "danger"}>{healthPct}%</Chip>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5 max-h-64 overflow-y-auto pr-1">
            {healthList.slice(0, 12).map((h: { name?: string; status?: string; latency_ms?: number }, i: number) => (
              <li key={i} className="flex items-center justify-between py-1.5 text-xs">
                <span className="truncate text-paper">{h.name ?? `probe-${i}`}</span>
                <span className="flex items-center gap-2">
                  {h.latency_ms != null && <span className="text-soft-gray numeric">{Math.round(h.latency_ms)} ms</span>}
                  <Chip tone={h.status === "healthy" ? "success" : h.status === "degraded" ? "warning" : "danger"}>{h.status ?? "unknown"}</Chip>
                </span>
              </li>
            ))}
            {!healthList.length && <li className="py-3 text-xs text-soft-gray">No probes reporting.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Security Events</h2>
          <Hairline className="my-4" />
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between"><span className="text-soft-gray">Open findings</span><span className="text-paper numeric">{sec.open_findings ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">Critical</span><span className={"numeric " + (sec.critical ? "text-danger" : "text-paper")}>{sec.critical ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">Recent events</span><span className="text-paper numeric">{sec.recent_events ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">Last audit</span><span className="text-paper text-[11px]">{sec.last_audit ? new Date(sec.last_audit).toLocaleString() : "—"}</span></li>
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper flex items-center gap-2"><Database className="h-4 w-4 text-gold/80" /> Database</h2>
          <Hairline className="my-4" />
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between"><span className="text-soft-gray">Tables</span><span className="text-paper numeric">{dbCounts.tables ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">Functions</span><span className="text-paper numeric">{dbCounts.functions ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">RLS policies</span><span className="text-paper numeric">{dbCounts.policies ?? "—"}</span></li>
            <li className="flex justify-between"><span className="text-soft-gray">AI error rate</span><span className={"numeric " + ((aiUsage.error_rate ?? 0) > 0.02 ? "text-danger" : "text-paper")}>
              {aiUsage.error_rate != null ? `${(aiUsage.error_rate * 100).toFixed(2)}%` : "—"}
            </span></li>
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Failed Jobs</h2>
          <Chip tone="warning">{(failed.data as unknown[] | undefined)?.length ?? 0}</Chip>
        </div>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {((failed.data ?? []) as Array<{ id: string; type?: string; last_error?: string | null; attempts?: number }>).slice(0, 12).map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">{j.type ?? "job"}</div>
                <div className="truncate text-[11px] text-soft-gray">{j.last_error ?? "—"} · attempts {j.attempts ?? 0}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => retry.mutate(j.id)} className="border-white/10 text-paper hover:bg-white/5">
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </li>
          ))}
          {!(failed.data as unknown[] | undefined)?.length && <li className="py-3 text-xs text-soft-gray">No failed jobs.</li>}
        </ul>
      </Panel>
    </>
  );
}
