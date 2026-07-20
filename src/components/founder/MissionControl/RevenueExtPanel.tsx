import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Receipt } from "lucide-react";
import { fmt, money, type MCData } from "./utils";

type Slice = MCData["revenue_ext"] | undefined;

export const RevenueExtPanel = memo(function RevenueExtPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Revenue OS · Wallet · Credits · Subscriptions · Payments
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Wallets" value={fmt(data?.wallets.total)} />
        <StatCard label="Ledger 30d" value={fmt(data?.wallets.ledger_30d)} />
        <StatCard label="Credit grants 30d" value={fmt(data?.credits.grants_30d)} />
        <StatCard label="Credit consumes 30d" value={fmt(data?.credits.consumes_30d)} />
        <StatCard label="Subs active" value={fmt(data?.subscriptions.active)} />
        <StatCard label="Subs trial" value={fmt(data?.subscriptions.trial)} />
        <StatCard label="Subs paused" value={fmt(data?.subscriptions.paused)} />
        <StatCard label="Subs cancelled" value={fmt(data?.subscriptions.cancelled)} />
        <StatCard label="Payments ✓ 30d" value={fmt(data?.payments.succeeded_30d)} />
        <StatCard label="Payments ✗ 30d" value={fmt(data?.payments.failed_30d)} />
        <StatCard label="Pending founder approval" value={fmt(data?.payments.pending_founder_approval)} />
        <StatCard
          label="Daily-free policy"
          value={
            data
              ? `${data.daily_free_credit_policy.per_day}/day · ${data.daily_free_credit_policy.deduction_order.join(" → ")}`
              : "—"
          }
        />
      </div>
      <Hairline className="my-4" />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium text-soft-gray">Recent subscription changes</div>
          <ul className="divide-y divide-white/5">
            {(data?.subscriptions.recent ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate font-mono">{s.id.slice(0, 8)}</span>
                <Chip>{s.status}</Chip>
                <span className="text-xs text-soft-gray">seats {s.seats}</span>
              </li>
            ))}
            {!data?.subscriptions.recent.length && (
              <li className="py-2 text-xs text-soft-gray">No recent subscription changes.</li>
            )}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-soft-gray">Recent payments</div>
          <ul className="divide-y divide-white/5">
            {(data?.payments.recent ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate font-mono">{p.id.slice(0, 8)}</span>
                <Chip>{p.status}</Chip>
                <span className="text-xs text-soft-gray">{money(p.amount_cents, p.currency)}</span>
              </li>
            ))}
            {!data?.payments.recent.length && (
              <li className="py-2 text-xs text-soft-gray">No recent payments.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
