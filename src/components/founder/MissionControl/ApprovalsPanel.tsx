import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Gavel, ShieldCheck } from "lucide-react";
import { fmt, money, ago, statusTone, type MCData } from "./utils";

type Slice = MCData["approvals"] | undefined;

export const ApprovalsPanel = memo(function ApprovalsPanel({ data }: { data: Slice }) {
  return (
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
          <StatCard label="Pending" value={fmt(data?.pending)} />
          <StatCard label="Approved" value={fmt(data?.approved)} />
          <StatCard label="Rejected" value={fmt(data?.rejected)} />
          <StatCard label="Cancelled" value={fmt(data?.cancelled)} />
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
          {(data?.recent ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
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
          {!data?.recent.length && (
            <li className="py-2 text-xs text-soft-gray">No approval requests yet.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
});
