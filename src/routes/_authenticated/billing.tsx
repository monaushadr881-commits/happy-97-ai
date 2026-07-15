/**
 * /billing — Revenue Cloud (real data only).
 *
 * Reads invoices / payments / revenue KPIs from the revenue service.
 * Unmodeled surfaces (subscriptions, wallet, credits) render as
 * "Not Available Yet" with an explicit reason; no fake values.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  PageHeader, Panel, StatCard, Chip, Hairline,
} from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import {
  revOverview, revTimeseries, revListInvoices, revListPayments,
} from "@/lib/revenue-v1.functions";
import {
  finListPlans, finListSubscriptions, finSubscriptionOverview,
  finListWallets, finEnsureUserWallet, finWalletLedger,
  finCreditBalance, finCreditLedger,
} from "@/lib/financial-v1.functions";
import {
  Receipt, RefreshCw, CreditCard, Wallet, Repeat, Undo2, TrendingUp, AlertTriangle,
  Sparkles, Coins,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [
    { title: "Revenue Cloud — Billing" },
    { name: "description", content: "Invoices, payments, and revenue analytics." },
    { name: "robots", content: "noindex" },
  ] }),
  component: RevenueCloud,
});

const NA = "Not Available Yet";

function fmtMoney(cents: number | null | undefined, currency = "USD"): string {
  if (cents === null || cents === undefined) return NA;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 })
      .format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
function fmtCount(v: number | null | undefined): string {
  if (v === null || v === undefined) return NA;
  return v.toLocaleString();
}
function fmtDate(v?: string | null): string {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString(); } catch { return v; }
}
function statusTone(s: string): "success" | "warning" | "danger" | "neutral" {
  if (s === "paid" || s === "succeeded") return "success";
  if (s === "sent" || s === "pending") return "warning";
  if (s === "overdue" || s === "failed" || s === "refunded") return "danger";
  return "neutral";
}

function LoadingRow({ label }: { label: string }) {
  return <div role="status" aria-live="polite" className="text-xs text-soft-gray">Loading {label}…</div>;
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

type Overview = Awaited<ReturnType<typeof revOverview>>;
type Invoice = Awaited<ReturnType<typeof revListInvoices>>[number];
type Payment = Awaited<ReturnType<typeof revListPayments>>[number];

function Sparkline({ points }: { points: { date: string; cents: number }[] }) {
  if (!points.length) return <p className="text-xs text-soft-gray">No revenue in this window.</p>;
  const max = Math.max(1, ...points.map(p => p.cents));
  const w = 320, h = 60, step = points.length > 1 ? w / (points.length - 1) : w;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (p.cents / max) * h).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-16 w-full text-gold" role="img" aria-label="Revenue over time">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RevenueCloud() {
  const [tab, setTab] = useState<"invoices" | "payments" | "subs" | "wallet">("invoices");

  const overview = useQuery<Overview>({ queryKey: ["rev", "overview"], queryFn: () => revOverview(), refetchInterval: 60_000 });
  const series = useQuery({ queryKey: ["rev", "series", 30], queryFn: () => revTimeseries({ data: { days: 30 } }) });
  const invoices = useQuery<Invoice[]>({ queryKey: ["rev", "invoices"], queryFn: () => revListInvoices({ data: { limit: 50 } }) });
  const payments = useQuery<Payment[]>({ queryKey: ["rev", "payments"], queryFn: () => revListPayments({ data: { limit: 50 } }) });

  const ov = overview.data;
  const cur = ov?.currency ?? "USD";

  return (
    <>
      <PageHeader
        eyebrow="Revenue Cloud · Live"
        title="Billing & Revenue"
        description="Invoices, payments, MRR and refunds — sourced from your ledger, not placeholders."
        actions={
          <Button size="sm" variant="outline" onClick={() => { overview.refetch(); invoices.refetch(); payments.refetch(); series.refetch(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Refresh
          </Button>
        }
      />

      {/* KPI grid ------------------------------------------------------- */}
      <section aria-label="Revenue key metrics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="MRR (30d)" value={fmtMoney(ov?.mrrCents ?? null, cur)} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="ARR (est.)" value={fmtMoney(ov?.arrCents ?? null, cur)} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Payments (30d)" value={fmtMoney(ov?.payments30dCents ?? null, cur)} icon={<CreditCard className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Refunds (30d)" value={fmtMoney(ov?.refunds30dCents ?? null, cur)} icon={<Undo2 className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Invoices" value={fmtCount(ov?.invoicesTotal ?? null)} icon={<Receipt className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Open Invoices" value={fmtCount(ov?.invoicesOpen ?? null)} icon={<Receipt className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Overdue" value={fmtCount(ov?.invoicesOverdue ?? null)} icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />} />
        <StatCard label="Revenue (365d)" value={fmtMoney(ov?.revenue365dCents ?? null, cur)} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} />
      </section>

      {overview.isError && <div className="mt-3"><ErrorRow label="revenue overview" error={overview.error} onRetry={() => overview.refetch()} /></div>}

      <Panel className="mt-4 p-5">
        <PanelHeader icon={<TrendingUp className="h-4 w-4 text-gold" aria-hidden="true" />} title="Revenue — last 30 days" />
        <Hairline className="my-4" />
        {series.isLoading && <LoadingRow label="revenue timeseries" />}
        {series.isError && <ErrorRow label="revenue timeseries" error={series.error} onRetry={() => series.refetch()} />}
        {!series.isLoading && !series.isError && <Sparkline points={(series.data ?? []) as { date: string; cents: number }[]} />}
      </Panel>

      {/* Tabs ---------------------------------------------------------- */}
      <div role="tablist" aria-label="Revenue sections" className="mt-6 flex flex-wrap gap-2 border-b border-white/5">
        {([
          ["invoices", "Invoices"],
          ["payments", "Transactions"],
          ["subs", "Subscriptions"],
          ["wallet", "Wallet & Credits"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`rev-panel-${id}`}
            id={`rev-tab-${id}`}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-xs uppercase tracking-[0.18em] ${tab === id ? "text-gold border-b-2 border-gold" : "text-soft-gray hover:text-paper"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        <Panel role="tabpanel" id="rev-panel-invoices" aria-labelledby="rev-tab-invoices" className="mt-4 p-5">
          <PanelHeader
            icon={<Receipt className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Invoices"
            right={<Button size="sm" variant="ghost" onClick={() => invoices.refetch()} aria-label="Refresh invoices"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /></Button>}
          />
          <Hairline className="my-4" />
          {invoices.isLoading && <LoadingRow label="invoices" />}
          {invoices.isError && <ErrorRow label="invoices" error={invoices.error} onRetry={() => invoices.refetch()} />}
          {!invoices.isLoading && !invoices.isError && (
            (invoices.data ?? []).length === 0
              ? <p className="text-xs text-soft-gray">No invoices yet. Create one to see it here.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Invoices</caption>
                    <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-soft-gray">
                      <tr>
                        <th scope="col" className="py-2">Number</th>
                        <th scope="col">Status</th>
                        <th scope="col">Issued</th>
                        <th scope="col">Due</th>
                        <th scope="col" className="text-right">Total</th>
                        <th scope="col" className="text-right">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(invoices.data ?? []).map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2 numeric text-paper">{inv.number}</td>
                          <td><Chip tone={statusTone(inv.status)}>{inv.status}</Chip></td>
                          <td className="numeric text-soft-gray">{fmtDate(inv.issued_at)}</td>
                          <td className="numeric text-soft-gray">{fmtDate(inv.due_at)}</td>
                          <td className="numeric text-right text-paper">{fmtMoney(inv.total_cents, inv.currency ?? cur)}</td>
                          <td className="numeric text-right text-paper">{fmtMoney(inv.amount_paid_cents, inv.currency ?? cur)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
        </Panel>
      )}

      {tab === "payments" && (
        <Panel role="tabpanel" id="rev-panel-payments" aria-labelledby="rev-tab-payments" className="mt-4 p-5">
          <PanelHeader
            icon={<CreditCard className="h-4 w-4 text-gold" aria-hidden="true" />}
            title="Transactions"
            right={<Button size="sm" variant="ghost" onClick={() => payments.refetch()} aria-label="Refresh payments"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /></Button>}
          />
          <Hairline className="my-4" />
          {payments.isLoading && <LoadingRow label="payments" />}
          {payments.isError && <ErrorRow label="payments" error={payments.error} onRetry={() => payments.refetch()} />}
          {!payments.isLoading && !payments.isError && (
            (payments.data ?? []).length === 0
              ? <p className="text-xs text-soft-gray">No transactions recorded yet.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Payments</caption>
                    <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-soft-gray">
                      <tr>
                        <th scope="col" className="py-2">Provider</th>
                        <th scope="col">Reference</th>
                        <th scope="col">Status</th>
                        <th scope="col">Received</th>
                        <th scope="col" className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(payments.data ?? []).map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 text-paper">{p.provider ?? "—"}</td>
                          <td className="numeric text-soft-gray">{p.provider_ref ?? "—"}</td>
                          <td><Chip tone={statusTone(p.status)}>{p.status}</Chip></td>
                          <td className="numeric text-soft-gray">{fmtDate(p.received_at)}</td>
                          <td className="numeric text-right text-paper">{fmtMoney(p.amount_cents, p.currency ?? cur)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
        </Panel>
      )}

      {tab === "subs" && (
        <Panel role="tabpanel" id="rev-panel-subs" aria-labelledby="rev-tab-subs" className="mt-4 p-5">
          <PanelHeader icon={<Repeat className="h-4 w-4 text-gold" aria-hidden="true" />} title="Subscriptions" />
          <Hairline className="my-4" />
          <p className="text-sm text-paper">{NA}</p>
          <p className="mt-2 text-xs text-soft-gray">
            A subscriptions / plans model is not present in the database. Add
            <code className="mx-1 text-gold">subscriptions</code> and
            <code className="mx-1 text-gold">plans</code> tables via a migration
            to enable this surface. Renewals, trials, and proration will land here
            once plans exist.
          </p>
        </Panel>
      )}

      {tab === "wallet" && (
        <Panel role="tabpanel" id="rev-panel-wallet" aria-labelledby="rev-tab-wallet" className="mt-4 p-5">
          <PanelHeader icon={<Wallet className="h-4 w-4 text-gold" aria-hidden="true" />} title="Wallet & Credits" />
          <Hairline className="my-4" />
          <p className="text-sm text-paper">{NA}</p>
          <p className="mt-2 text-xs text-soft-gray">
            No wallet or credit ledger table exists yet. Add
            <code className="mx-1 text-gold">wallets</code> +
            <code className="mx-1 text-gold">wallet_transactions</code> (or reuse
            <code className="mx-1 text-gold">ledger_entries</code>) to power balance,
            top-ups, and credit consumption.
          </p>
        </Panel>
      )}
    </>
  );
}
