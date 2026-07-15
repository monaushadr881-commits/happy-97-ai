/**
 * /founder — Executive Overview (Founder Command Center).
 *
 * Live KPI grid + platform health + queue + security snapshot + recent activity.
 *
 * Data honesty rules:
 *   - Counters that come back null render as "Not Available Yet" (not fake 0).
 *   - Health list maps the real ops HealthReport shape ({ service, status: "ok"|... }).
 *   - Every panel handles loading / error / empty and exposes a Retry button.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import {
  PageHeader, Panel, StatCard, Chip, Kbd, Hairline,
} from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import {
  apiPlatformOverview, apiRecentAudit, apiListCompanies,
} from "@/lib/api-v1.functions";
import {
  opsHealthAll, opsDeploymentAnalytics, opsQueueStats, opsSecuritySummary,
} from "@/lib/ops-v1.functions";
import { revOverview } from "@/lib/revenue-v1.functions";
import {
  Building2, Users, Sparkles, Activity, ShieldCheck, Rocket,
  ListChecks, AlertTriangle, MessageSquare, Bell, RefreshCw,
  TrendingUp, CreditCard, Receipt, Wallet,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/")({
  head: () => ({ meta: [{ title: "Overview — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderOverview,
});

const NA = "Not Available Yet";

function fmtCount(v: number | null | undefined): string {
  if (v === null || v === undefined) return NA;
  return typeof v === "number" ? v.toLocaleString() : String(v);
}

// -- Ops HealthReport shape (from src/ops/health.service.ts) -----------------
type HealthReport = {
  service: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs: number;
  message?: string;
};

function healthToneOf(s: HealthReport["status"]) {
  return s === "ok" ? "success"
    : s === "degraded" ? "warning"
    : s === "down" ? "danger"
    : "neutral";
}

function PanelHeader({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="text-xs text-soft-gray">
      Loading {label}…
    </div>
  );
}

function ErrorRow({ label, error, onRetry }: { label: string; error: unknown; onRetry: () => void }) {
  const msg = error instanceof Error ? error.message : "Request failed.";
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">
      <span className="min-w-0 truncate">Couldn’t load {label}: {msg}</span>
      <Button size="sm" variant="outline" onClick={onRetry} aria-label={`Retry loading ${label}`}>
        <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" /> Retry
      </Button>
    </div>
  );
}

function FounderOverview() {
  const overview = useQuery({ queryKey: ["founder", "overview"], queryFn: () => apiPlatformOverview(), refetchInterval: 30_000 });
  const companies = useQuery({ queryKey: ["founder", "companies-count"], queryFn: () => apiListCompanies() });
  const health = useQuery({ queryKey: ["founder", "health"], queryFn: () => opsHealthAll(), refetchInterval: 20_000 });
  const deploys = useQuery({ queryKey: ["founder", "deploys"], queryFn: () => opsDeploymentAnalytics() });
  const queue = useQuery({ queryKey: ["founder", "queue"], queryFn: () => opsQueueStats(), refetchInterval: 15_000 });
  const security = useQuery({ queryKey: ["founder", "security"], queryFn: () => opsSecuritySummary() });
  const audit = useQuery({ queryKey: ["founder", "audit"], queryFn: () => apiRecentAudit({ data: { limit: 12 } }) });
  const revenue = useQuery({ queryKey: ["founder", "revenue"], queryFn: () => revOverview(), refetchInterval: 60_000 });

  const rv = revenue.data;
  const rvCur = rv?.currency ?? "USD";
  const fmtMoney = (cents: number | null | undefined) => {
    if (cents === null || cents === undefined) return NA;
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: rvCur, maximumFractionDigits: 0 }).format(cents / 100); }
    catch { return `${(cents / 100).toFixed(2)} ${rvCur}`; }
  };

  const ov = (overview.data ?? {}) as {
    companies?: number | null; workspaces?: number | null; brands?: number | null; users?: number | null;
    ai_sessions?: number | null; conversations?: number | null;
    deployments?: number | null; notifications?: number | null;
  };
  const companiesCount = Array.isArray(companies.data) ? companies.data.length : null;

  const healthList = (Array.isArray(health.data) ? health.data : []) as HealthReport[];
  const healthy = healthList.filter((h) => h.status === "ok").length;
  const totalProbes = healthList.length;

  const queueData = (queue.data ?? {}) as Record<string, number | undefined>;
  const queueBacklog = typeof queueData.queued === "number" ? queueData.queued : null;
  const queueFailed = typeof queueData.failed === "number" ? queueData.failed : 0;

  const deploysTotal = (deploys.data as { total?: number } | undefined)?.total ?? null;

  const auditRows = useMemo(
    () => (Array.isArray(audit.data) ? audit.data : []) as Array<{
      id: string; action?: string; entity_type?: string | null; created_at?: string; actor_id?: string | null;
    }>,
    [audit.data],
  );

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

      {/* KPI GRID -------------------------------------------------------- */}
      <section aria-label="Platform key metrics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Companies" value={fmtCount(companiesCount ?? ov.companies)} icon={<Building2 className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Users" value={fmtCount(ov.users)} icon={<Users className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Workspaces" value={fmtCount(ov.workspaces)} icon={<Building2 className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Brands" value={fmtCount(ov.brands)} icon={<Building2 className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="AI Sessions" value={fmtCount(ov.ai_sessions)} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Conversations" value={fmtCount(ov.conversations)} icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Deployments" value={fmtCount(deploysTotal)} icon={<Rocket className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Queue Backlog" value={fmtCount(queueBacklog)} icon={<ListChecks className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Notifications" value={fmtCount(ov.notifications)} icon={<Bell className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="MRR (30d)" value={fmtMoney(rv?.mrrCents)} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="ARR (est.)" value={fmtMoney(rv?.arrCents)} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Payments (30d)" value={fmtMoney(rv?.payments30dCents)} icon={<CreditCard className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Refunds (30d)" value={fmtMoney(rv?.refunds30dCents)} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Open Invoices" value={fmtCount(rv?.invoicesOpen ?? null)} icon={<Receipt className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Overdue" value={fmtCount(rv?.invoicesOverdue ?? null)} icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Wallet Balance" value={fmtMoney(rv?.walletBalanceCents)} icon={<Wallet className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Credits" value={fmtCount(rv?.creditsBalance)} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
      </section>

      {overview.isError && (
        <div className="mt-3">
          <ErrorRow label="platform overview" error={overview.error} onRetry={() => overview.refetch()} />
        </div>
      )}
      {revenue.isError && (
        <div className="mt-3">
          <ErrorRow label="revenue overview" error={revenue.error} onRetry={() => revenue.refetch()} />
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* HEALTH ------------------------------------------------------- */}
        <Panel className="p-5 lg:col-span-2">
          <PanelHeader
            icon={<Activity className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Platform Health"
            right={
              <div className="flex items-center gap-2">
                <Chip tone={totalProbes && healthy === totalProbes ? "success" : totalProbes ? "warning" : "neutral"}>
                  {totalProbes ? `${healthy}/${totalProbes} healthy` : "no probes"}
                </Chip>
                <Button size="sm" variant="ghost" onClick={() => health.refetch()} aria-label="Refresh health probes">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            }
          />
          <Hairline className="my-4" />
          {health.isLoading && <LoadingRow label="health probes" />}
          {health.isError && <ErrorRow label="health probes" error={health.error} onRetry={() => health.refetch()} />}
          {!health.isLoading && !health.isError && (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {healthList.map((h) => (
                <li key={h.service} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs uppercase tracking-[0.15em] text-soft-gray">{h.service}</div>
                    <div className="numeric mt-1 text-sm text-paper">
                      {h.latencyMs >= 0 ? `${h.latencyMs} ms` : "—"}
                    </div>
                  </div>
                  <Chip tone={healthToneOf(h.status)}>{h.status}</Chip>
                </li>
              ))}
              {!healthList.length && (
                <li className="col-span-full text-xs text-soft-gray">No health probes recorded yet.</li>
              )}
            </ul>
          )}
        </Panel>

        {/* SECURITY ----------------------------------------------------- */}
        <Panel className="p-5">
          <PanelHeader
            icon={<ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Security"
            right={
              <Button size="sm" variant="ghost" onClick={() => security.refetch()} aria-label="Refresh security summary">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          />
          <Hairline className="my-4" />
          {security.isLoading && <LoadingRow label="security summary" />}
          {security.isError && <ErrorRow label="security summary" error={security.error} onRetry={() => security.refetch()} />}
          {!security.isLoading && !security.isError && (() => {
            const entries = Object.entries((security.data ?? {}) as Record<string, unknown>).slice(0, 6);
            if (!entries.length) return <p className="text-xs text-soft-gray">No signals recorded yet.</p>;
            return (
              <dl className="space-y-3 text-sm">
                {entries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-xs uppercase tracking-[0.15em] text-soft-gray">{k.replaceAll("_", " ")}</dt>
                    <dd className="numeric text-paper">{typeof v === "number" ? v.toLocaleString() : String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}
          <Link
            to="/founder/security"
            className="mt-5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-gold hover:text-gold-bright"
          >
            Open security console →
          </Link>
        </Panel>
      </div>

      {/* QUEUE + DEPLOYS split ---------------------------------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <PanelHeader
            icon={<ListChecks className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Job Queue"
            right={
              <Button size="sm" variant="ghost" onClick={() => queue.refetch()} aria-label="Refresh queue stats">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          />
          <Hairline className="my-4" />
          {queue.isLoading && <LoadingRow label="queue stats" />}
          {queue.isError && <ErrorRow label="queue stats" error={queue.error} onRetry={() => queue.refetch()} />}
          {!queue.isLoading && !queue.isError && (
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {(["queued", "running", "succeeded", "failed", "cancelled"] as const).map((k) => (
                <div key={k} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <dt className="text-[10px] uppercase tracking-[0.18em] text-soft-gray">{k}</dt>
                  <dd className={`numeric mt-1 text-lg ${k === "failed" && queueFailed > 0 ? "text-red-300" : "text-paper"}`}>
                    {fmtCount(queueData[k] ?? null)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            icon={<Rocket className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Deployments"
            right={
              <Button size="sm" variant="ghost" onClick={() => deploys.refetch()} aria-label="Refresh deployment stats">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            }
          />
          <Hairline className="my-4" />
          {deploys.isLoading && <LoadingRow label="deployment stats" />}
          {deploys.isError && <ErrorRow label="deployment stats" error={deploys.error} onRetry={() => deploys.refetch()} />}
          {!deploys.isLoading && !deploys.isError && (() => {
            const d = (deploys.data ?? {}) as { total?: number; succeeded?: number; failed?: number; rolledBack?: number; inProgress?: number };
            if (!d.total) return <p className="text-xs text-soft-gray">No deployments recorded yet.</p>;
            return (
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {([
                  ["Total", d.total],
                  ["Succeeded", d.succeeded ?? 0],
                  ["Failed", d.failed ?? 0],
                  ["In progress", d.inProgress ?? 0],
                ] as const).map(([label, v]) => (
                  <div key={label} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-soft-gray">{label}</dt>
                    <dd className="numeric mt-1 text-lg text-paper">{v.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}
        </Panel>
      </div>

      {/* ACTIVITY ------------------------------------------------------- */}
      <Panel className="mt-4 p-5">
        <PanelHeader
          icon={<AlertTriangle className="h-4 w-4 text-gold" aria-hidden="true" />}
          title="Recent Activity"
          right={
            <Button size="sm" variant="ghost" onClick={() => audit.refetch()} aria-label="Refresh audit log">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />
        <Hairline className="my-4" />
        {audit.isLoading && <LoadingRow label="audit log" />}
        {audit.isError && <ErrorRow label="audit log" error={audit.error} onRetry={() => audit.refetch()} />}
        {!audit.isLoading && !audit.isError && (
          <ul className="divide-y divide-white/5">
            {auditRows.map((a) => (
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
            {!auditRows.length && (
              <li className="py-4 text-xs text-soft-gray">No recent activity recorded.</li>
            )}
          </ul>
        )}
      </Panel>
    </>
  );
}
