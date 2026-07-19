/**
 * R183 Batch F — Founder Mission Control panels.
 * Extension of the canonical Founder Dashboard. Reads live data via
 * `founderMissionControl` (single aggregator over canonical tables).
 */
import { useQuery } from "@tanstack/react-query";
import {
  Panel,
  Chip,
  Hairline,
  StatCard,
} from "@/design-system/primitives";
import {
  ShieldCheck,
  Gavel,
  Brain,
  ListChecks,
  Receipt,
  Palette,
  BookOpen,
  Server,
} from "lucide-react";
import { founderMissionControl } from "@/lib/founder/mission-control.functions";

function fmt(n: number | null | undefined) {
  return typeof n === "number" ? n.toLocaleString() : "—";
}
function money(cents: number, ccy = "INR") {
  const n = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${ccy} ${n.toFixed(0)}`;
  }
}
function ago(iso?: string | null) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function statusTone(
  s: string,
): "success" | "warning" | "danger" | "info" | "gold" | "neutral" {
  switch (s) {
    case "approved":
    case "succeeded":
    case "healthy":
    case "paid":
    case "completed":
    case "active":
      return "success";
    case "pending":
    case "queued":
    case "running":
    case "issued":
    case "degraded":
      return "warning";
    case "rejected":
    case "failed":
    case "down":
    case "unhealthy":
    case "overdue":
      return "danger";
    case "cancelled":
    case "draft":
      return "neutral";
    default:
      return "info";
  }
}

export function MissionControl() {
  const q = useQuery({
    queryKey: ["founder", "mission-control"],
    queryFn: () => founderMissionControl(),
    refetchInterval: 20_000,
  });
  const d = q.data;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Mission Control</div>
          <h2 className="mt-1 text-lg font-medium tracking-tight text-paper">
            Live Runtime
          </h2>
        </div>
        <Chip tone={q.isFetching ? "gold" : "neutral"}>
          {q.isFetching ? "syncing" : "live"}
        </Chip>
      </div>

      {/* Approvals */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Founder Approvals
            </h3>
          </div>
          <Hairline className="my-4" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Pending" value={fmt(d?.approvals.pending)} />
            <StatCard label="Approved" value={fmt(d?.approvals.approved)} />
            <StatCard label="Rejected" value={fmt(d?.approvals.rejected)} />
            <StatCard label="Cancelled" value={fmt(d?.approvals.cancelled)} />
          </div>
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Recent Approval Requests
            </h3>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {(d?.approvals.recent ?? []).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate text-paper">{a.title}</div>
                  <div className="text-[11px] text-soft-gray">
                    {a.entity_type} · {ago(a.created_at)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.amount_cents != null && (
                    <span className="numeric text-xs text-soft-gray">
                      {money(a.amount_cents, a.currency ?? "INR")}
                    </span>
                  )}
                  <Chip tone={statusTone(a.status)}>{a.status}</Chip>
                </div>
              </li>
            ))}
            {!d?.approvals.recent.length && (
              <li className="py-2 text-xs text-soft-gray">
                No approval requests yet.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      {/* Brain + Jobs */}
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
            <StatCard label="Active Sessions" value={fmt(d?.brain.active)} />
            <StatCard label="Completed 24h" value={fmt(d?.brain.completed_24h)} />
          </div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-soft-gray">
            Recent Tool Calls
          </div>
          <ul className="mt-2 divide-y divide-white/5">
            {(d?.brain.recent_tool_calls ?? []).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
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
            {!d?.brain.recent_tool_calls.length && (
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
            <StatCard label="Queued" value={fmt(d?.jobs.pending)} />
            <StatCard label="Running" value={fmt(d?.jobs.running)} />
            <StatCard label="Failed" value={fmt(d?.jobs.failed)} />
            <StatCard label="Done" value={fmt(d?.jobs.done)} />
          </div>
        </Panel>
      </div>

      {/* Revenue + Creator/Publishing */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Revenue OS
            </h3>
          </div>
          <Hairline className="my-4" />
          <div className="mb-3 grid grid-cols-3 gap-2">
            <StatCard label="Invoices 30d" value={fmt(d?.revenue.invoices_30d)} />
            <StatCard
              label="Outstanding"
              value={d ? money(d.revenue.outstanding_cents) : "—"}
            />
            <StatCard
              label="Collected"
              value={d ? money(d.revenue.paid_cents) : "—"}
            />
          </div>
          <ul className="divide-y divide-white/5">
            {(d?.revenue.recent ?? []).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate text-paper">
                    <span className="text-gold">{r.number}</span>
                  </div>
                  <div className="text-[11px] text-soft-gray">
                    {ago(r.issued_at)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="numeric text-xs text-soft-gray">
                    {money(r.total_cents, r.currency)}
                  </span>
                  <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                </div>
              </li>
            ))}
            {!d?.revenue.recent.length && (
              <li className="py-2 text-xs text-soft-gray">No invoices yet.</li>
            )}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Creator & Publishing
            </h3>
          </div>
          <Hairline className="my-4" />
          <div className="mb-3 flex flex-wrap gap-2">
            {d?.creator.by_kind &&
              Object.entries(d.creator.by_kind).map(([k, n]) => (
                <Chip key={k} tone="gold">
                  {k}: {n}
                </Chip>
              ))}
            {!d?.creator.total && (
              <span className="text-xs text-soft-gray">
                No generated assets yet.
              </span>
            )}
          </div>
          <ul className="divide-y divide-white/5">
            {(d?.creator.recent ?? []).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate text-paper">{c.name}</div>
                  <div className="text-[11px] text-soft-gray">
                    {c.kind} · {ago(c.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Knowledge + Runtime Health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Knowledge Updates
            </h3>
          </div>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {(d?.knowledge ?? []).map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0 truncate text-paper">{k.title}</div>
                <time className="numeric text-[11px] text-soft-gray">
                  {ago(k.updated_at)}
                </time>
              </li>
            ))}
            {!d?.knowledge.length && (
              <li className="py-2 text-xs text-soft-gray">
                No knowledge documents yet.
              </li>
            )}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
              Runtime Health (24h)
            </h3>
          </div>
          <Hairline className="my-4" />
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Probes" value={fmt(d?.health.total)} />
            <StatCard label="Healthy" value={fmt(d?.health.healthy)} />
            <StatCard label="Degraded" value={fmt(d?.health.degraded)} />
            <StatCard label="Down" value={fmt(d?.health.down)} />
          </div>
          <p className="mt-4 text-[11px] text-soft-gray">
            Build & Typecheck gates are enforced by R183 Migration Guardrails
            before every runtime batch merges.
          </p>
        </Panel>
      </div>
    </section>
  );
}
