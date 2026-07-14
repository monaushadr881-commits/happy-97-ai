/**
 * /founder/ops — Operations Command Center.
 * Health · Incidents · Deployments · Queue. Everything consumed via ops-v1.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, StatCard, Chip, Hairline } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import {
  opsHealthAll, opsListIncidents, opsListDeployments, opsQueueStats, opsQueueFailed, opsQueueRetry, opsDeploymentAnalytics,
} from "@/lib/ops-v1.functions";
import { Activity, Rocket, ListChecks, AlertOctagon, RefreshCcw } from "lucide-react";
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

  const retry = useMutation({
    mutationFn: (id: string) => opsQueueRetry({ data: { id } }),
    onSuccess: () => { toast.success("Job re-queued"); qc.invalidateQueries({ queryKey: ["ops", "queue-failed"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = (queue.data ?? {}) as { pending?: number; running?: number; failed?: number; done?: number };
  const d = (dstats.data ?? {}) as { total?: number; success_rate?: number };
  const healthList = Array.isArray(health.data) ? health.data : [];

  return (
    <>
      <PageHeader eyebrow="Reliability" title="Operations" description="Live health, incidents, deployments and background workers." />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Healthy Probes" value={`${healthList.filter((h: { status?: string }) => h.status === "healthy").length}/${healthList.length}`} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Deployments" value={(d.total ?? 0).toLocaleString()} icon={<Rocket className="h-4 w-4" />} delta={d.success_rate != null ? `${Math.round((d.success_rate ?? 0) * 100)}% success` : undefined} trend="up" />
        <StatCard label="Queue Pending" value={(q.pending ?? 0).toLocaleString()} icon={<ListChecks className="h-4 w-4" />} />
        <StatCard label="Queue Failed" value={(q.failed ?? 0).toLocaleString()} icon={<AlertOctagon className="h-4 w-4" />} trend={q.failed ? "down" : "flat"} />
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
