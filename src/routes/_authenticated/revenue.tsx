/**
 * /revenue — HAPPY Revenue OS (canonical Revenue surface).
 * R140: Full sub-tab UI (Overview · Credits · Subscriptions · Wallet · Billing ·
 * Invoices · Usage · Analytics) over canonical revenueService (revOverview,
 * revTimeseries, revListInvoices, revListPayments) — no duplicate Revenue runtime.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Container, PageHeader, Panel, Chip, Hairline, StatCard,
} from "@/design-system/primitives";
import { TabBar, useActiveTab } from "@/components/business/TabBar";
import {
  revOverview, revTimeseries, revListInvoices, revListPayments,
} from "@/lib/revenue-v1.functions";
import {
  DollarSign, Coins, Repeat, Wallet, Receipt, FileText, GaugeCircle, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/revenue")({
  head: () => ({ meta: [{ title: "Revenue OS — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Revenue,
});

type Overview = { mrrCents?: number; arrCents?: number; activeSubscriptions?: number; walletCents?: number; creditsBalance?: number; churnPct?: number; ltvCents?: number };
type Invoice = { id: string; number?: string | null; total_cents?: number | null; currency?: string | null; status?: string | null; issued_at?: string | null; due_at?: string | null; created_at?: string | null };
type Payment = { id: string; amount_cents?: number | null; currency?: string | null; status?: string | null; method?: string | null; created_at?: string | null };
type Point   = { day?: string; date?: string; cents?: number; amount_cents?: number };

const TABS = [
  { slug: "overview",      label: "Overview",      icon: DollarSign },
  { slug: "credits",       label: "Credits",       icon: Coins },
  { slug: "subscriptions", label: "Subscriptions", icon: Repeat },
  { slug: "wallet",        label: "Wallet",        icon: Wallet },
  { slug: "billing",       label: "Billing",       icon: Receipt },
  { slug: "invoices",      label: "Invoices",      icon: FileText },
  { slug: "usage",         label: "Usage",         icon: GaugeCircle },
  { slug: "analytics",     label: "Analytics",     icon: BarChart3 },
];

function money(cents: number | null | undefined) {
  return `$${(((cents ?? 0)) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Revenue() {
  const active = useActiveTab(TABS);

  const overview = useQuery({ queryKey: ["rev","overview"],     queryFn: () => revOverview(),                          refetchInterval: 60_000 });
  const series   = useQuery({ queryKey: ["rev","ts",30],        queryFn: () => revTimeseries({ data: { days: 30 } }),  refetchInterval: 60_000 });
  const invoices = useQuery({ queryKey: ["rev","invs"],         queryFn: () => revListInvoices({ data: { limit: 200 } }) });
  const payments = useQuery({ queryKey: ["rev","pays"],         queryFn: () => revListPayments({ data: { limit: 200 } }) });

  const ov = (overview.data ?? {}) as unknown as Overview;
  const iv = (invoices.data ?? []) as unknown as Invoice[];
  const py = (payments.data ?? []) as unknown as Payment[];
  const pts = (series.data ?? []) as unknown as Point[];

  const invoiced = iv.reduce((s, r) => s + (r.total_cents ?? 0), 0);
  const collected = py.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const outstanding = Math.max(0, invoiced - collected);

  const max = Math.max(1, ...pts.map((p) => Number(p.cents ?? p.amount_cents ?? 0)));

  return (
    <Container className="py-6 md:py-10">
      <PageHeader
        eyebrow="Sovereign · Live"
        title="Revenue OS"
        description="Credits, subscriptions, wallet, billing, invoices, usage and revenue analytics — one unified surface."
      />
      <TabBar tabs={TABS} ariaLabel="Revenue sections" />

      {active === "overview" && (
        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="MRR"           value={money(ov.mrrCents)}  icon={<DollarSign className="h-4 w-4" />} />
          <StatCard label="ARR"           value={money(ov.arrCents)}  icon={<DollarSign className="h-4 w-4" />} />
          <StatCard label="Active subs"   value={(ov.activeSubscriptions ?? 0).toLocaleString()} icon={<Repeat className="h-4 w-4" />} />
          <StatCard label="Wallet"        value={money(ov.walletCents)} icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Credits bal"   value={(ov.creditsBalance ?? 0).toLocaleString()} icon={<Coins className="h-4 w-4" />} />
          <StatCard label="Invoiced"      value={money(invoiced)} icon={<FileText className="h-4 w-4" />} />
          <StatCard label="Collected"     value={money(collected)} icon={<Receipt className="h-4 w-4" />} />
          <StatCard label="Outstanding"   value={money(outstanding)} />
        </section>
      )}

      {active === "credits" && (
        <>
          <section className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Credits Balance" value={(ov.creditsBalance ?? 0).toLocaleString()} icon={<Coins className="h-4 w-4" />} />
            <StatCard label="Wallet"          value={money(ov.walletCents)} />
            <StatCard label="MRR"             value={money(ov.mrrCents)} />
          </section>
          <Panel className="mt-6 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Credits Ledger</h2>
            <Hairline className="my-4" />
            <p className="text-xs text-soft-gray">Grants, spends, expiries and refunds route through the canonical Credits Engine (R128). Detailed rows appear as ledger provider connects.</p>
          </Panel>
        </>
      )}

      {active === "subscriptions" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Subscriptions</h2>
          <Hairline className="my-4" />
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Active"  value={(ov.activeSubscriptions ?? 0).toLocaleString()} icon={<Repeat className="h-4 w-4" />} />
            <StatCard label="MRR"     value={money(ov.mrrCents)} />
            <StatCard label="ARR"     value={money(ov.arrCents)} />
            <StatCard label="Churn"   value={`${((ov.churnPct ?? 0) * 100).toFixed(1)}%`} />
          </section>
          <p className="mt-4 text-xs text-soft-gray">Per-subscription rows arrive once the subscription provider (Stripe / Paddle) connects (currently BLOCKED on external credentials).</p>
        </Panel>
      )}

      {active === "wallet" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Wallet</h2>
          <Hairline className="my-4" />
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-soft-gray">Balance</span>
            <span className="numeric text-3xl text-paper">{money(ov.walletCents)}</span>
          </div>
          <p className="mt-4 text-xs text-soft-gray">Top-ups, refunds and payout events surface here from the canonical Payments router.</p>
        </Panel>
      )}

      {active === "billing" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel className="p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Payments</h2>
            <Hairline className="my-4" />
            <ul className="divide-y divide-white/5">
              {py.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.method ?? "payment"}</div>
                    <div className="text-[11px] text-soft-gray">{r.created_at ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="numeric text-paper">{money(r.amount_cents)}</span>
                    <Chip tone={r.status === "settled" || r.status === "succeeded" ? "success" : r.status === "failed" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                  </div>
                </li>
              ))}
              {!py.length && <li className="py-3 text-xs text-soft-gray">No payments yet.</li>}
            </ul>
          </Panel>
          <Panel className="p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent Invoices</h2>
            <Hairline className="my-4" />
            <ul className="divide-y divide-white/5">
              {iv.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">{r.number ?? r.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-soft-gray">due {r.due_at ?? "—"}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="numeric text-paper">{money(r.total_cents)}</span>
                    <Chip tone={r.status === "paid" ? "success" : r.status === "overdue" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                  </div>
                </li>
              ))}
              {!iv.length && <li className="py-3 text-xs text-soft-gray">No invoices.</li>}
            </ul>
          </Panel>
        </div>
      )}

      {active === "invoices" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">All Invoices</h2>
          <Hairline className="my-4" />
          <ul className="divide-y divide-white/5">
            {iv.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{r.number ?? r.id.slice(0, 8)}</div>
                  <div className="text-[11px] text-soft-gray">issued {r.issued_at ?? r.created_at ?? "—"} · due {r.due_at ?? "—"}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="numeric text-paper">{money(r.total_cents)}</span>
                  <Chip tone={r.status === "paid" ? "success" : r.status === "overdue" ? "danger" : "info"}>{r.status ?? "—"}</Chip>
                </div>
              </li>
            ))}
            {!iv.length && <li className="py-3 text-xs text-soft-gray">No invoices.</li>}
          </ul>
        </Panel>
      )}

      {active === "usage" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Usage &amp; Metering</h2>
          <Hairline className="my-4" />
          <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Credits balance"  value={(ov.creditsBalance ?? 0).toLocaleString()} />
            <StatCard label="Active subs"      value={(ov.activeSubscriptions ?? 0).toLocaleString()} />
            <StatCard label="LTV (avg)"        value={money(ov.ltvCents)} />
          </section>
          <p className="mt-4 text-xs text-soft-gray">Per-meter (AI tokens, storage, egress) rows populate from the canonical usage aggregator.</p>
        </Panel>
      )}

      {active === "analytics" && (
        <Panel className="mt-6 p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Revenue — Last 30 days</h2>
          <Hairline className="my-4" />
          {pts.length === 0 ? (
            <p className="text-xs text-soft-gray">No timeseries data yet.</p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {pts.map((p, i) => {
                const v = Number(p.cents ?? p.amount_cents ?? 0);
                const h = Math.max(2, Math.round((v / max) * 100));
                return (
                  <div key={i} className="flex-1 rounded-t bg-gold/70" style={{ height: `${h}%` }} title={`${p.day ?? p.date ?? ""}: ${money(v)}`} />
                );
              })}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="MRR"          value={money(ov.mrrCents)} />
            <StatCard label="ARR"          value={money(ov.arrCents)} />
            <StatCard label="Churn"        value={`${((ov.churnPct ?? 0) * 100).toFixed(1)}%`} />
            <StatCard label="LTV (avg)"    value={money(ov.ltvCents)} />
          </div>
        </Panel>
      )}
    </Container>
  );
}
