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

      {tab === "subs" && <SubscriptionsPanel currency={cur} />}
      {tab === "wallet" && <WalletCreditsPanel currency={cur} />}
    </>
  );
}

// ============================================================================
// Subscriptions Panel
// ============================================================================
function SubscriptionsPanel({ currency }: { currency: string }) {
  const subs = useQuery({ queryKey: ["fin", "subs"], queryFn: () => finListSubscriptions({ data: { limit: 100 } }) });
  const ov = useQuery({ queryKey: ["fin", "subsOv"], queryFn: () => finSubscriptionOverview() });
  const plans = useQuery({ queryKey: ["fin", "plans"], queryFn: () => finListPlans() });

  return (
    <Panel role="tabpanel" id="rev-panel-subs" aria-labelledby="rev-tab-subs" className="mt-4 p-5">
      <PanelHeader
        icon={<Repeat className="h-4 w-4 text-gold" aria-hidden="true" />}
        title="Subscriptions"
        right={<Button size="sm" variant="ghost" onClick={() => { subs.refetch(); ov.refetch(); plans.refetch(); }} aria-label="Refresh subscriptions"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /></Button>}
      />
      <Hairline className="my-4" />

      <section aria-label="Subscription metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={fmtCount(ov.data?.total ?? null)} />
        <StatCard label="Active" value={fmtCount(ov.data?.active ?? null)} />
        <StatCard label="Trials" value={fmtCount(ov.data?.trial ?? null)} />
        <StatCard label="Renewals (30d)" value={fmtCount(ov.data?.renewalsUpcoming30d ?? null)} />
      </section>

      <div className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-soft-gray mb-2">Plans catalog</h3>
        {plans.isLoading && <LoadingRow label="plans" />}
        {plans.isError && <ErrorRow label="plans" error={plans.error} onRetry={() => plans.refetch()} />}
        {!plans.isLoading && !plans.isError && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(plans.data ?? []).map((p) => (
              <div key={p.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                <div className="text-xs uppercase tracking-[0.15em] text-soft-gray">{p.tier}</div>
                <div className="mt-1 text-sm text-paper">{p.name}</div>
                <div className="mt-2 numeric text-paper">{fmtMoney(p.price_cents, p.currency)}<span className="text-soft-gray text-xs"> / {p.billing_interval}</span></div>
                <div className="text-xs text-soft-gray mt-1">{p.credits_included.toLocaleString()} credits · {p.seats_included} seats</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-soft-gray mb-2">Your subscriptions</h3>
        {subs.isLoading && <LoadingRow label="subscriptions" />}
        {subs.isError && <ErrorRow label="subscriptions" error={subs.error} onRetry={() => subs.refetch()} />}
        {!subs.isLoading && !subs.isError && (
          (subs.data ?? []).length === 0
            ? <p className="text-xs text-soft-gray">No subscriptions yet. Provision one against a company to see it here.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Subscriptions</caption>
                  <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-soft-gray">
                    <tr>
                      <th scope="col" className="py-2">Plan</th>
                      <th scope="col">Status</th>
                      <th scope="col">Period Start</th>
                      <th scope="col">Period End</th>
                      <th scope="col">Renew</th>
                      <th scope="col" className="text-right">Seats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(subs.data ?? []).map((s: Record<string, unknown>) => {
                      const plan = s.plan as { name?: string; tier?: string } | null;
                      return (
                        <tr key={s.id as string}>
                          <td className="py-2 text-paper">{plan?.name ?? "—"} <span className="text-soft-gray text-xs">({plan?.tier ?? "?"})</span></td>
                          <td><Chip tone={s.status === "active" ? "success" : s.status === "trial" ? "warning" : s.status === "cancelled" || s.status === "expired" ? "danger" : "neutral"}>{String(s.status)}</Chip></td>
                          <td className="numeric text-soft-gray">{fmtDate(s.current_period_start as string)}</td>
                          <td className="numeric text-soft-gray">{fmtDate(s.current_period_end as string | null)}</td>
                          <td className="text-soft-gray text-xs">{s.auto_renew ? "auto" : "manual"}</td>
                          <td className="numeric text-right text-paper">{String(s.seats ?? "—")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
        )}
        <p className="mt-3 text-[11px] text-soft-gray">
          <Sparkles className="inline h-3 w-3 mr-1" aria-hidden="true" />
          Payment provider integration (Stripe / Razorpay / Paddle / Cashfree / PayPal) is abstracted but not wired — mark
          subscriptions manually or provision via admin tools until a provider is connected. {currency}
        </p>
      </div>
    </Panel>
  );
}

// ============================================================================
// Wallet + Credits Panel
// ============================================================================
function WalletCreditsPanel({ currency }: { currency: string }) {
  const wallets = useQuery({ queryKey: ["fin", "wallets"], queryFn: () => finListWallets() });
  const mine = useQuery({ queryKey: ["fin", "myWallet"], queryFn: () => finEnsureUserWallet({ data: { currency } }) });
  const walletId = (mine.data as { id?: string } | undefined)?.id;
  const ledger = useQuery({
    queryKey: ["fin", "walletLedger", walletId],
    queryFn: () => finWalletLedger({ data: { wallet_id: walletId! } }),
    enabled: !!walletId,
  });
  const creditBal = useQuery({ queryKey: ["fin", "creditBal"], queryFn: () => finCreditBalance({ data: {} }) });
  const creditLog = useQuery({ queryKey: ["fin", "creditLog"], queryFn: () => finCreditLedger({ data: { limit: 100 } }) });

  return (
    <Panel role="tabpanel" id="rev-panel-wallet" aria-labelledby="rev-tab-wallet" className="mt-4 p-5">
      <PanelHeader
        icon={<Wallet className="h-4 w-4 text-gold" aria-hidden="true" />}
        title="Wallet & Credits"
        right={<Button size="sm" variant="ghost" onClick={() => { wallets.refetch(); ledger.refetch(); creditBal.refetch(); creditLog.refetch(); }} aria-label="Refresh wallet"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /></Button>}
      />
      <Hairline className="my-4" />

      <section aria-label="Wallet metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Your wallet"
          value={fmtMoney(
            (wallets.data ?? []).find((w: Record<string, unknown>) => w.wallet_id === walletId)?.balance_cents ?? 0,
            currency,
          )}
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Wallets visible"
          value={fmtCount(wallets.data?.length ?? null)}
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Your credits"
          value={fmtCount((creditBal.data as { balance?: number } | undefined)?.balance ?? 0)}
          icon={<Coins className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Credit entries"
          value={fmtCount((creditBal.data as { entry_count?: number } | undefined)?.entry_count ?? 0)}
          icon={<Coins className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <div className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-soft-gray mb-2">Wallet ledger (last 200)</h3>
        {(!walletId || ledger.isLoading) && <LoadingRow label="wallet ledger" />}
        {ledger.isError && <ErrorRow label="wallet ledger" error={ledger.error} onRetry={() => ledger.refetch()} />}
        {walletId && !ledger.isLoading && !ledger.isError && (
          (ledger.data ?? []).length === 0
            ? <p className="text-xs text-soft-gray">No wallet activity yet. Post a purchase, reward, or adjustment to see it here.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Wallet ledger</caption>
                  <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-soft-gray">
                    <tr>
                      <th scope="col" className="py-2">When</th>
                      <th scope="col">Type</th>
                      <th scope="col">Direction</th>
                      <th scope="col">Description</th>
                      <th scope="col" className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(ledger.data ?? []).map((e: Record<string, unknown>) => (
                      <tr key={e.id as string}>
                        <td className="py-2 numeric text-soft-gray">{fmtDate(e.created_at as string)}</td>
                        <td className="text-paper">{String(e.entry_type)}</td>
                        <td><Chip tone={e.direction === "credit" ? "success" : "warning"}>{String(e.direction)}</Chip></td>
                        <td className="text-soft-gray truncate max-w-[24rem]">{String(e.description ?? "—")}</td>
                        <td className="numeric text-right text-paper">{fmtMoney(Number(e.amount_cents), String(e.currency ?? currency))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-soft-gray mb-2">Credit ledger (last 100)</h3>
        {creditLog.isLoading && <LoadingRow label="credit ledger" />}
        {creditLog.isError && <ErrorRow label="credit ledger" error={creditLog.error} onRetry={() => creditLog.refetch()} />}
        {!creditLog.isLoading && !creditLog.isError && (
          (creditLog.data ?? []).length === 0
            ? <p className="text-xs text-soft-gray">No credit movements yet. Grants, consumption, and referrals will appear here.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Credit ledger</caption>
                  <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-soft-gray">
                    <tr>
                      <th scope="col" className="py-2">When</th>
                      <th scope="col">Type</th>
                      <th scope="col">Direction</th>
                      <th scope="col">Description</th>
                      <th scope="col" className="text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(creditLog.data ?? []).map((e: Record<string, unknown>) => (
                      <tr key={e.id as string}>
                        <td className="py-2 numeric text-soft-gray">{fmtDate(e.created_at as string)}</td>
                        <td className="text-paper">{String(e.entry_type)}</td>
                        <td><Chip tone={e.direction === "credit" ? "success" : "warning"}>{String(e.direction)}</Chip></td>
                        <td className="text-soft-gray truncate max-w-[24rem]">{String(e.description ?? "—")}</td>
                        <td className="numeric text-right text-paper">{Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>

      <p className="mt-4 text-[11px] text-soft-gray">
        Wallet balance and credit balance are always derived from the immutable ledger via
        <code className="mx-1 text-gold">v_wallet_balances</code> /
        <code className="mx-1 text-gold">v_credit_balances</code> — never stored directly. Every movement is auditable.
      </p>
    </Panel>
  );
}

