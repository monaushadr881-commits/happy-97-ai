import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Receipt, Palette } from "lucide-react";
import { fmt, money, ago, statusTone, type MCData } from "./utils";

export const RevenueCreatorPanel = memo(function RevenueCreatorPanel({
  revenue,
  creator,
}: {
  revenue: MCData["revenue"] | undefined;
  creator: MCData["creator"] | undefined;
}) {
  return (
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
          <StatCard label="Invoices 30d" value={fmt(revenue?.invoices_30d)} />
          <StatCard label="Outstanding" value={revenue ? money(revenue.outstanding_cents) : "—"} />
          <StatCard label="Collected" value={revenue ? money(revenue.paid_cents) : "—"} />
        </div>
        <ul className="divide-y divide-white/5">
          {(revenue?.recent ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate text-paper">
                  <span className="text-gold">{r.number}</span>
                </div>
                <div className="text-[11px] text-soft-gray">{ago(r.issued_at)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="numeric text-xs text-soft-gray">
                  {money(r.total_cents, r.currency)}
                </span>
                <Chip tone={statusTone(r.status)}>{r.status}</Chip>
              </div>
            </li>
          ))}
          {!revenue?.recent.length && (
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
          {creator?.by_kind &&
            Object.entries(creator.by_kind).map(([k, n]) => (
              <Chip key={k} tone="gold">
                {k}: {n}
              </Chip>
            ))}
          {!creator?.total && (
            <span className="text-xs text-soft-gray">No generated assets yet.</span>
          )}
        </div>
        <ul className="divide-y divide-white/5">
          {(creator?.recent ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
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
  );
});
