/**
 * /founder — Executive Overview.
 * Live KPI grid + platform health + recent activity feed.
 * Consumes: apiPlatformOverview, apiRecentAudit, opsHealthAll, opsDeploymentAnalytics, opsQueueStats.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  Panel,
  StatCard,
  Chip,
  Kbd,
  Hairline,
} from "@/design-system/primitives";
import {
  apiPlatformOverview,
  apiRecentAudit,
  apiListCompanies,
} from "@/lib/api-v1.functions";
import {
  opsHealthAll,
  opsDeploymentAnalytics,
  opsQueueStats,
  opsSecuritySummary,
} from "@/lib/ops-v1.functions";
import {
  Building2,
  Users,
  Sparkles,
  Activity,
  ShieldCheck,
  Rocket,
  ListChecks,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/")({
  head: () => ({ meta: [{ title: "Overview — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderOverview,
});

function FounderOverview() {
  const overview = useQuery({ queryKey: ["founder", "overview"], queryFn: () => apiPlatformOverview(), refetchInterval: 30_000 });
  const companies = useQuery({ queryKey: ["founder", "companies-count"], queryFn: () => apiListCompanies() });
  const health = useQuery({ queryKey: ["founder", "health"], queryFn: () => opsHealthAll(), refetchInterval: 20_000 });
  const deploys = useQuery({ queryKey: ["founder", "deploys"], queryFn: () => opsDeploymentAnalytics() });
  const queue = useQuery({ queryKey: ["founder", "queue"], queryFn: () => opsQueueStats(), refetchInterval: 15_000 });
  const security = useQuery({ queryKey: ["founder", "security"], queryFn: () => opsSecuritySummary() });
  const audit = useQuery({ queryKey: ["founder", "audit"], queryFn: () => apiRecentAudit({ data: { limit: 12 } }) });

  const ov = (overview.data ?? {}) as Record<string, number | undefined>;
  const num = (v: unknown) => (typeof v === "number" ? v.toLocaleString() : "—");

  const healthList = Array.isArray(health.data) ? health.data : [];
  const healthy = healthList.filter((h: { status?: string }) => h.status === "healthy").length;
  const totalProbes = healthList.length;

  return (
    <>
      <PageHeader
        eyebrow="Sovereign · Live"
        title="Executive Overview"
        description="Every company, every AI system, every deployment — one command surface."
        actions={
          <div className="flex items-center gap-2 text-xs text-soft-gray">
            Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to command
          </div>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Companies" value={num(companies.data?.length)} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Users" value={num(ov.users)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Workspaces" value={num(ov.workspaces)} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Brands" value={num(ov.brands)} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="AI Sessions" value={num(ov.ai_sessions)} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Conversations" value={num(ov.conversations)} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Deployments" value={num((deploys.data as { total?: number } | undefined)?.total)} icon={<Rocket className="h-4 w-4" />} />
        <StatCard label="Queue Backlog" value={num((queue.data as { pending?: number } | undefined)?.pending)} icon={<ListChecks className="h-4 w-4" />} />
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Health */}
        <Panel className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gold" />
              <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Platform Health</h2>
            </div>
            <Chip tone={totalProbes && healthy === totalProbes ? "success" : totalProbes ? "warning" : "neutral"}>
              {totalProbes ? `${healthy}/${totalProbes} healthy` : "no probes"}
            </Chip>
          </div>
          <Hairline className="my-4" />
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {healthList.map((h: { id?: string; probe?: string; status?: string; latency_ms?: number | null }) => (
              <li key={h.id ?? h.probe} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="min-w-0">
                  <div className="truncate text-xs uppercase tracking-[0.15em] text-soft-gray">{h.probe}</div>
                  <div className="numeric mt-1 text-sm text-paper">
                    {h.latency_ms != null ? `${h.latency_ms} ms` : "—"}
                  </div>
                </div>
                <Chip
                  tone={
                    h.status === "healthy" ? "success" :
                    h.status === "degraded" ? "warning" :
                    h.status === "down" ? "danger" : "neutral"
                  }
                >
                  {h.status ?? "unknown"}
                </Chip>
              </li>
            ))}
            {!healthList.length && (
              <li className="col-span-full text-xs text-soft-gray">No health probes recorded yet.</li>
            )}
          </ul>
        </Panel>

        {/* Security snapshot */}
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Security</h2>
          </div>
          <Hairline className="my-4" />
          <dl className="space-y-3 text-sm">
            {Object.entries((security.data ?? {}) as Record<string, unknown>).slice(0, 6).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-xs uppercase tracking-[0.15em] text-soft-gray">{k.replaceAll("_", " ")}</dt>
                <dd className="numeric text-paper">{typeof v === "number" ? v.toLocaleString() : String(v ?? "—")}</dd>
              </div>
            ))}
            {!security.data && <p className="text-xs text-soft-gray">No signals.</p>}
          </dl>
          <Link
            to="/founder/security"
            className="mt-5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-gold hover:text-gold-bright"
          >
            Open security console →
          </Link>
        </Panel>
      </div>

      {/* Activity */}
      <Panel className="mt-4 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Activity</h2>
        </div>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {(Array.isArray(audit.data) ? audit.data : []).map((a: { id: string; action?: string; entity_type?: string | null; created_at?: string; actor_id?: string | null }) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">
                  <span className="text-gold">{a.action ?? "event"}</span>
                  {a.entity_type ? <span className="text-soft-gray"> · {a.entity_type}</span> : null}
                </div>
                <div className="text-[11px] text-soft-gray">{a.actor_id ?? "system"}</div>
              </div>
              <time className="numeric text-[11px] text-soft-gray">
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
              </time>
            </li>
          ))}
          {!audit.data && <li className="py-2 text-xs text-soft-gray">No recent activity.</li>}
        </ul>
      </Panel>
    </>
  );
}
