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
  Rocket,
  Users,
  Workflow,
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

      {/* Publishing Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Publishing Runtime
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Packages" value={fmt(d?.publishing.total_packages)} />
          <StatCard label="Assets" value={fmt(d?.publishing.total_assets)} />
          <StatCard label="Pending" value={fmt(d?.publishing.pending_approvals)} />
          <StatCard
            label="Stores"
            value={fmt(
              d?.publishing.by_store
                ? Object.keys(d.publishing.by_store).length
                : 0,
            )}
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {d?.publishing.by_store &&
            Object.entries(d.publishing.by_store).map(([s, n]) => (
              <Chip key={s} tone="gold">
                {s.replace("_", " ")}: {n}
              </Chip>
            ))}
        </div>
        <ul className="divide-y divide-white/5">
          {(d?.publishing.recent ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate text-paper">{p.name}</div>
                <div className="text-[11px] text-soft-gray">
                  {p.store} · {p.app_name} v{p.app_version} · pkg v
                  {p.package_version} · {ago(p.created_at)}
                </div>
              </div>
              <Chip tone="neutral">{p.asset_kind}</Chip>
            </li>
          ))}
          {!d?.publishing.recent.length && (
            <li className="py-2 text-xs text-soft-gray">
              No publishing packages generated yet. Materials only — external
              submission is BLOCKED.
            </li>
          )}
        </ul>
      </Panel>

      {/* Executive Board (R171–R180) */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Executive Board · Live Council
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatCard label="Reviews" value={fmt(d?.executive.total_reviews)} />
          <StatCard label="Pending" value={fmt(d?.executive.pending)} />
          <StatCard label="Approved" value={fmt(d?.executive.approved)} />
          <StatCard label="Rejected" value={fmt(d?.executive.rejected)} />
          <StatCard
            label="Open Conflicts"
            value={fmt(d?.executive.conflicts_open)}
          />
        </div>

        {d?.executive.top_risks.length ? (
          <div className="mb-3">
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Top Council Risks
            </div>
            <div className="flex flex-wrap gap-2">
              {d.executive.top_risks.map((r) => (
                <Chip key={r.risk} tone="warning">
                  {r.risk} · {r.count}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {d?.executive.member_tally &&
        Object.keys(d.executive.member_tally).length > 0 ? (
          <div className="mb-3">
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Member Recommendations (cumulative)
            </div>
            <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
              {Object.entries(d.executive.member_tally).map(([id, t]) => (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-sm border border-white/5 px-2 py-1 text-xs"
                >
                  <span className="truncate text-paper">{id}</span>
                  <span className="flex gap-2 text-soft-gray">
                    <Chip tone="success">go {t.go}</Chip>
                    <Chip tone="warning">hold {t.hold}</Chip>
                    <Chip tone="danger">no_go {t.no_go}</Chip>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="divide-y divide-white/5">
          {(d?.executive.recent ?? []).map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate text-paper">{r.title}</div>
                <div className="text-[11px] text-soft-gray">
                  unified: {r.unified} · conflicts: {r.conflicts} ·{" "}
                  {ago(r.created_at)}
                </div>
              </div>
              <Chip tone={statusTone(r.status)}>{r.status}</Chip>
            </li>
          ))}
          {!d?.executive.recent.length && (
            <li className="py-2 text-xs text-soft-gray">
              No Executive Board reviews yet. Call{" "}
              <code className="text-paper">requestExecutiveReview</code> to
              engage the council.
            </li>
          )}
        </ul>
      </Panel>

      {/* Founder Creator Runtime (Batch I) */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Founder Creator Runtime
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatCard label="Requests" value={fmt(d?.founder_creator.total_requests)} />
          <StatCard label="Pending" value={fmt(d?.founder_creator.pending)} />
          <StatCard label="Approved" value={fmt(d?.founder_creator.approved)} />
          <StatCard label="Rejected" value={fmt(d?.founder_creator.rejected)} />
          <StatCard label="Assets" value={fmt(d?.founder_creator.total_assets)} />
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {d?.founder_creator.by_kind &&
            Object.entries(d.founder_creator.by_kind).map(([k, n]) => (
              <Chip key={k} tone="gold">
                {k}: {n}
              </Chip>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Recent Requests
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.founder_creator.recent_requests ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.title}</div>
                    <div className="text-[11px] text-soft-gray">
                      {r.kind} · {ago(r.created_at)}
                    </div>
                  </div>
                  <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                </li>
              ))}
              {!d?.founder_creator.recent_requests.length && (
                <li className="py-2 text-xs text-soft-gray">
                  No Founder-initiated Creator requests yet.
                </li>
              )}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Latest Versions
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.founder_creator.recent_assets ?? []).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-paper">{a.name}</div>
                    <div className="text-[11px] text-soft-gray">
                      {a.kind} · v{a.asset_version} ·{" "}
                      {a.model ?? "unknown model"} · {ago(a.created_at)}
                    </div>
                  </div>
                  <Chip tone="neutral">final</Chip>
                </li>
              ))}
              {!d?.founder_creator.recent_assets.length && (
                <li className="py-2 text-xs text-soft-gray">
                  No finalized Founder Creator assets yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Batch J — Revenue OS Completion */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Revenue OS · Wallet · Credits · Subscriptions · Payments
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Wallets" value={fmt(d?.revenue_ext.wallets.total)} />
          <StatCard label="Ledger 30d" value={fmt(d?.revenue_ext.wallets.ledger_30d)} />
          <StatCard label="Credit grants 30d" value={fmt(d?.revenue_ext.credits.grants_30d)} />
          <StatCard label="Credit consumes 30d" value={fmt(d?.revenue_ext.credits.consumes_30d)} />
          <StatCard label="Subs active" value={fmt(d?.revenue_ext.subscriptions.active)} />
          <StatCard label="Subs trial" value={fmt(d?.revenue_ext.subscriptions.trial)} />
          <StatCard label="Subs paused" value={fmt(d?.revenue_ext.subscriptions.paused)} />
          <StatCard label="Subs cancelled" value={fmt(d?.revenue_ext.subscriptions.cancelled)} />
          <StatCard label="Payments ✓ 30d" value={fmt(d?.revenue_ext.payments.succeeded_30d)} />
          <StatCard label="Payments ✗ 30d" value={fmt(d?.revenue_ext.payments.failed_30d)} />
          <StatCard label="Pending founder approval" value={fmt(d?.revenue_ext.payments.pending_founder_approval)} />
          <StatCard
            label="Daily-free policy"
            value={
              d
                ? `${d.revenue_ext.daily_free_credit_policy.per_day}/day · ${d.revenue_ext.daily_free_credit_policy.deduction_order.join(" → ")}`
                : "—"
            }
          />
        </div>
        <Hairline className="my-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-medium text-soft-gray">Recent subscription changes</div>
            <ul className="divide-y divide-white/5">
              {(d?.revenue_ext.subscriptions.recent ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate font-mono">{s.id.slice(0, 8)}</span>
                  <Chip>{s.status}</Chip>
                  <span className="text-xs text-soft-gray">seats {s.seats}</span>
                </li>
              ))}
              {!d?.revenue_ext.subscriptions.recent.length && (
                <li className="py-2 text-xs text-soft-gray">No recent subscription changes.</li>
              )}
            </ul>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-soft-gray">Recent payments</div>
            <ul className="divide-y divide-white/5">
              {(d?.revenue_ext.payments.recent ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate font-mono">{p.id.slice(0, 8)}</span>
                  <Chip>{p.status}</Chip>
                  <span className="text-xs text-soft-gray">{money(p.amount_cents, p.currency)}</span>
                </li>
              ))}
              {!d?.revenue_ext.payments.recent.length && (
                <li className="py-2 text-xs text-soft-gray">No recent payments.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      {/* R188 Batch A — Automation Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Automation Runtime · Workflows
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <StatCard label="Workflows" value={fmt(d?.automation.workflows_total)} />
          <StatCard label="Active" value={fmt(d?.automation.workflows_active)} />
          <StatCard label="Inactive" value={fmt(d?.automation.workflows_inactive)} />
          <StatCard label="Pending approval" value={fmt(d?.automation.pending_approvals)} />
          <StatCard label="Runs 24h" value={fmt(d?.automation.runs_24h)} />
          <StatCard label="Failed 24h" value={fmt(d?.automation.runs_failed_24h)} />
        </div>
        <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
          Recent Runs
        </div>
        <ul className="divide-y divide-white/5">
          {(d?.automation.recent_runs ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-mono text-paper">{r.workflow_id.slice(0, 8)}</div>
                <div className="text-[11px] text-soft-gray">
                  {ago(r.started_at ?? r.completed_at)}
                  {r.error ? ` · ${r.error.slice(0, 60)}` : ""}
                </div>
              </div>
              <Chip tone={statusTone(r.status)}>{r.status}</Chip>
            </li>
          ))}
          {!d?.automation.recent_runs.length && (
            <li className="py-2 text-xs text-soft-gray">No workflow runs in the last window.</li>
          )}
        </ul>
      </Panel>

      {/* R188 Batch B — Workspace Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Workspace · Founder Attached Items
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Workspaces" value={fmt(d?.workspace.total)} />
          <StatCard label="Active" value={fmt(d?.workspace.active)} />
          <StatCard label="Recent items" value={fmt(d?.workspace.items_total)} />
          <StatCard label="Attach 7d" value={fmt(d?.workspace.attach_events_7d)} />
        </div>
        <ul className="divide-y divide-white/5">
          {(d?.workspace.items_recent ?? []).slice(0, 8).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">{r.name}</div>
                <div className="truncate text-[11px] text-soft-gray">
                  {r.kind} · v{r.workspace_link_version} · ws {r.workspace_id.slice(0, 8)}
                </div>
              </div>
              <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
            </li>
          ))}
          {!d?.workspace.items_recent.length && (
            <li className="py-2 text-xs text-soft-gray">No workspace-linked assets yet.</li>
          )}
        </ul>
      </Panel>

      {/* R188 Batch B — Knowledge Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Knowledge · Articles &amp; References
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatCard label="Articles" value={fmt(d?.knowledge_ext.articles_total)} />
          <StatCard label="Public" value={fmt(d?.knowledge_ext.articles_public)} />
          <StatCard label="Drafts" value={fmt(d?.knowledge_ext.articles_drafts)} />
          <StatCard label="References" value={fmt(d?.knowledge_ext.references_total)} />
          <StatCard label="Publish pending" value={fmt(d?.knowledge_ext.pending_publish_approvals)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Recent Updates
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.knowledge_ext.recent_updates ?? []).slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.title}</div>
                    <div className="text-[11px] text-soft-gray">
                      {r.is_public ? "public" : "company"} · v{r.version}
                    </div>
                  </div>
                  <span className="text-[11px] text-soft-gray">{ago(r.updated_at)}</span>
                </li>
              ))}
              {!d?.knowledge_ext.recent_updates.length && (
                <li className="py-2 text-xs text-soft-gray">No articles yet.</li>
              )}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Recent References
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.knowledge_ext.recent_references ?? []).slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.label}</div>
                    <div className="truncate text-[11px] text-soft-gray">
                      {r.url ?? "—"} · article {r.article_id.slice(0, 8)}
                    </div>
                  </div>
                  <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
                </li>
              ))}
              {!d?.knowledge_ext.recent_references.length && (
                <li className="py-2 text-xs text-soft-gray">No references yet.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      {/* R188 Batch C — Universal Search Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Universal Search · Coverage
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Total indexed" value={fmt(d?.search.total_indexed)} />
          <StatCard label="Sources" value={fmt(d?.search.indexed_sources.length)} />
          <StatCard label="Coverage" value={`${d?.search.coverage_pct ?? 0}%`} />
          <StatCard label="Queries 24h" value={fmt(d?.search.queries_24h)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Indexed Sources
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.search.indexed_sources ?? []).map((r) => (
                <li key={r.source} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-paper">{r.source}</span>
                  <span className="text-[11px] text-soft-gray">{fmt(r.rows)} rows</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Recent Searches
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.search.recent_queries ?? []).slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.q || "—"}</div>
                    <div className="text-[11px] text-soft-gray">{r.results_total} results</div>
                  </div>
                  <span className="text-[11px] text-soft-gray">{ago(r.occurred_at)}</span>
                </li>
              ))}
              {!d?.search.recent_queries.length && (
                <li className="py-2 text-xs text-soft-gray">No audited searches yet.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      {/* R188 Batch D — Security Runtime */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Security Runtime · Coverage
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Coverage" value={`${d?.security.coverage_pct ?? 0}%`} />
          <StatCard label="Open alerts" value={fmt(d?.security.alerts.open)} />
          <StatCard label="Failed logins 24h" value={fmt(d?.security.logins_24h.failed)} />
          <StatCard label="Critical audit 24h" value={fmt(d?.security.audit_24h.critical)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Policy Layers
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.security.coverage ?? []).map((l) => (
                <li key={l.layer} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-paper">{l.layer}</span>
                  <span
                    className={
                      l.status === "healthy"
                        ? "text-[11px] uppercase tracking-[0.12em] text-emerald-300"
                        : l.status === "degraded"
                        ? "text-[11px] uppercase tracking-[0.12em] text-amber-300"
                        : "text-[11px] uppercase tracking-[0.12em] text-soft-gray"
                    }
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Recent Security Alerts
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.security.alerts.recent ?? []).slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.alert_type}</div>
                    <div className="truncate text-[11px] text-soft-gray">{r.message}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-gold">{r.severity}</div>
                    <div className="text-[11px] text-soft-gray">{ago(r.created_at)}</div>
                  </div>
                </li>
              ))}
              {!d?.security.alerts.recent.length && (
                <li className="py-2 text-xs text-soft-gray">No security alerts recorded.</li>
              )}
            </ul>
          </div>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Successful logins 24h" value={fmt(d?.security.logins_24h.success)} />
          <StatCard label="Approvals enforcing" value={fmt(d?.security.approvals_enforcing)} />
          <StatCard label="RBAC RPC" value={d?.security.rbac.rpc_ok ? "OK" : "FAIL"} />
          <StatCard label="Audit warn 24h" value={fmt(d?.security.audit_24h.warning)} />
        </div>
      </Panel>

      {/* R188 Batch E — Business OS Runtime Rollout */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Business OS · Runtime Coverage
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <StatCard label="Coverage" value={`${d?.business.coverage_pct ?? 0}%`} />
          <StatCard label="Pending approvals" value={fmt(d?.business.pending_approvals)} />
          <StatCard label="Audit 24h" value={fmt(d?.business.audit_24h)} />
          <StatCard label="Customers" value={fmt(d?.business.kpis.customers)} />
          <StatCard label="Leads" value={fmt(d?.business.kpis.leads)} />
          <StatCard label="Deals" value={fmt(d?.business.kpis.deals)} />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
          <StatCard label="Sales orders" value={fmt(d?.business.kpis.sales_orders)} />
          <StatCard label="Purchase orders" value={fmt(d?.business.kpis.purchase_orders)} />
          <StatCard label="Suppliers" value={fmt(d?.business.kpis.suppliers)} />
          <StatCard label="Employees" value={fmt(d?.business.kpis.employees)} />
          <StatCard label="Support tickets" value={fmt(d?.business.kpis.support_tickets)} />
          <StatCard label="Meetings" value={fmt(d?.business.kpis.meetings)} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Module Coverage
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.business.coverage ?? []).map((c) => (
                <li key={c.module} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-paper">{c.module}</span>
                  <span
                    className={
                      c.status === "wired"
                        ? "text-[11px] uppercase tracking-[0.12em] text-emerald-300"
                        : "text-[11px] uppercase tracking-[0.12em] text-soft-gray"
                    }
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Pending / Recent Approvals
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.business.recent_approvals ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.title}</div>
                    <div className="truncate text-[11px] text-soft-gray">{r.entity_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-gold">{r.status}</div>
                    <div className="text-[11px] text-soft-gray">{ago(r.created_at)}</div>
                  </div>
                </li>
              ))}
              {!d?.business.recent_approvals.length && (
                <li className="py-2 text-xs text-soft-gray">No business approvals yet.</li>
              )}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
              Business Audit Timeline
            </div>
            <ul className="divide-y divide-white/5">
              {(d?.business.recent_audit ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-paper">{r.category}</div>
                    <div className="truncate text-[11px] text-soft-gray">{r.action} · {r.entity_type ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-gold">{r.severity ?? "info"}</div>
                    <div className="text-[11px] text-soft-gray">{ago(r.occurred_at)}</div>
                  </div>
                </li>
              ))}
              {!d?.business.recent_audit.length && (
                <li className="py-2 text-xs text-soft-gray">No business events recorded in the last 24h.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Platform Core · Runtime Layers
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Coverage" value={`${d?.platform_core.coverage_pct ?? 0}%`} />
          <StatCard label="DB Probe" value={d?.platform_core.db_probe_ok ? "OK" : "DEGRADED"} />
          <StatCard label="Layers" value={fmt(d?.platform_core.layers.length)} />
        </div>
        <Hairline className="my-4" />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(d?.platform_core.layers ?? []).map((l) => (
            <li key={l.layer} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm text-paper">{l.layer}</span>
                <span className="text-[11px] text-soft-gray">{l.owner}</span>
              </div>
              <Chip tone={l.status === "present" ? "gold" : l.status === "degraded" ? "warning" : "danger"}>
                {l.status}
              </Chip>
            </li>
          ))}
        </ul>
      </Panel>

      {/* R189 Phase 2 — Universal File System / Import / Export / Sync / Command Mode */}
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Universal File Runtime · UFS · Import · Export · Sync · Command
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Files"          value={fmt(d?.platform_runtime.files_total)} />
          <StatCard label="Understood"     value={fmt(d?.platform_runtime.understandings_total)} />
          <StatCard label="Imports · 24h"  value={fmt(d?.platform_runtime.imports_24h)} />
          <StatCard label="Exports · 24h"  value={fmt(d?.platform_runtime.exports_24h)} />
          <StatCard label="Syncs · 24h"    value={fmt(d?.platform_runtime.syncs_24h)} />
          <StatCard label="Commands · 24h" value={fmt(d?.platform_runtime.commands_24h)} />
          <StatCard label="Jobs Pending"   value={fmt(d?.platform_runtime.jobs.pending)} />
          <StatCard label="Coverage"       value={`${d?.platform_runtime.coverage_pct ?? 0}%`} />
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">Runtime Coverage</div>
            <ul className="space-y-2">
              {(d?.platform_runtime.coverage ?? []).map((c) => (
                <li key={c.capability} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-paper">{c.capability}</span>
                    <span className="text-[11px] text-soft-gray">{c.owner}</span>
                  </div>
                  <Chip tone={c.status === "wired" ? "gold" : "neutral"}>{c.status}</Chip>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">Recent Activity</div>
            <ul className="divide-y divide-white/5">
              {(d?.platform_runtime.recent ?? []).map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-paper">{r.name}</span>
                    <span className="text-[11px] text-soft-gray">{r.kind}</span>
                  </div>
                  <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
                </li>
              ))}
              {!d?.platform_runtime.recent.length && (
                <li className="py-2 text-xs text-soft-gray">No UFS activity yet.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      {/* R189 Batch 2 — Universal Runtime pipeline */}
      <Panel className="p-5 lg:col-span-3">
        <div className="mb-4 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Universal Runtime · Canonical Execution Pipeline
          </h3>
          <Chip tone={d?.universal_runtime.pipeline_ok ? "gold" : "warning"}>
            {d?.universal_runtime.pipeline_ok ? "healthy" : "attention"}
          </Chip>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard label="Coverage"      value={`${d?.universal_runtime.coverage_pct ?? 0}%`} />
          <StatCard label="Executions·24h" value={fmt(d?.universal_runtime.executions_24h)} />
          <StatCard label="Running Now"   value={fmt(d?.universal_runtime.running_now)} />
          <StatCard label="Failures·24h"  value={fmt(d?.universal_runtime.failures_24h)} />
          <StatCard label="Queue Pending" value={fmt(d?.universal_runtime.queue_pending)} />
          <StatCard label="Queue Failed"  value={fmt(d?.universal_runtime.queue_failed)} />
        </div>
        <Hairline className="my-4" />
        <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
          Pipeline Stages ({d?.universal_runtime.stages.length ?? 0})
        </div>
        <ol className="grid gap-2 md:grid-cols-2">
          {(d?.universal_runtime.stages ?? []).map((s, i) => (
            <li key={s.stage} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 text-[11px] tabular-nums text-soft-gray">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col">
                  <span className="text-sm text-paper">{s.stage}</span>
                  <span className="text-[11px] text-soft-gray">{s.owner}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tabular-nums text-soft-gray">{fmt(s.count_24h)} · 24h</span>
                <Chip tone={s.status === "wired" ? "gold" : s.status === "degraded" ? "warning" : "neutral"}>
                  {s.status}
                </Chip>
              </div>
            </li>
          ))}
        </ol>
        <Hairline className="my-4" />
        <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
          Execution Adoption · Domains ({d?.universal_runtime.adoption.by_domain.length ?? 0})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <StatCard label="Handlers Adopted" value={fmt(d?.universal_runtime.adoption.handlers_adopted)} />
          <StatCard label="Adoptions · 24h"  value={fmt(d?.universal_runtime.adoption.adopted_24h)} />
          <StatCard label="Domains"          value={fmt(d?.universal_runtime.adoption.by_domain.length)} />
          <StatCard label="Executions · 24h" value={fmt(d?.universal_runtime.executions_24h)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-soft-gray mb-2">By Domain</div>
            <ul className="space-y-1.5">
              {(d?.universal_runtime.adoption.by_domain ?? []).map((b) => (
                <li key={b.domain} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-1.5">
                  <span className="text-xs text-paper">{b.domain}</span>
                  <Chip tone="gold">{fmt(b.count_24h)}</Chip>
                </li>
              ))}
              {!d?.universal_runtime.adoption.by_domain.length && (
                <li className="text-xs text-soft-gray">No adopted handlers yet.</li>
              )}
            </ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-soft-gray mb-2">Recent Adoptions</div>
            <ul className="divide-y divide-white/5">
              {(d?.universal_runtime.adoption.recent ?? []).map((r) => (
                <li key={r.id} className="py-1.5 flex items-center justify-between">
                  <span className="text-xs text-paper truncate">{r.capability}</span>
                  <span className="text-[10px] text-soft-gray">{ago(r.occurred_at)}</span>
                </li>
              ))}
              {!d?.universal_runtime.adoption.recent.length && (
                <li className="py-1.5 text-xs text-soft-gray">No recent adoptions.</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>




      {(["mfg", "health", "agri"] as const).map((v) => {
        const label = v === "mfg" ? "Manufacturing" : v === "health" ? "Healthcare" : "Agriculture";
        const b = d?.verticals?.[v];
        return (
          <Panel key={v} className="p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-porcelain">
                  {label} · Vertical Runtime
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Chip tone="gold">{b?.total ?? 0} records</Chip>
                <Chip tone={b?.critical_24h ? "warning" : "neutral"}>
                  {b?.critical_24h ?? 0} critical/24h
                </Chip>
                <Chip tone={b?.pending_approvals ? "warning" : "neutral"}>
                  {b?.pending_approvals ?? 0} pending approvals
                </Chip>
              </div>
            </div>
            <Hairline />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-soft-gray">
                  Modules ({b?.by_module.length ?? 0}/10)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {b?.by_module.map((m) => (
                    <div key={m.module} className="flex items-center justify-between rounded-md border border-porcelain/10 px-2.5 py-1.5">
                      <span className="text-xs text-porcelain/90">{m.module}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-soft-gray">{m.total}</span>
                        <Chip tone="gold">{m.status}</Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-soft-gray">
                  Recent Activity
                </div>
                <ul className="divide-y divide-porcelain/10">
                  {b?.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs text-porcelain">{r.name}</div>
                        <div className="text-[10px] text-soft-gray">{r.kind}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.severity && r.severity !== "info" && (
                          <Chip tone={r.severity === "critical" ? "warning" : "neutral"}>{r.severity}</Chip>
                        )}
                        <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
                      </div>
                    </li>
                  ))}
                  {!b?.recent.length && (
                    <li className="py-2 text-xs text-soft-gray">No {label.toLowerCase()} activity yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>
        );
      })}

    </section>
  );
}




