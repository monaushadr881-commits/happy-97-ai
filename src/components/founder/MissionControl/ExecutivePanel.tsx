import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Users } from "lucide-react";
import { fmt, ago, statusTone, type MCData } from "./utils";

type Slice = MCData["executive"] | undefined;

export const ExecutivePanel = memo(function ExecutivePanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Executive Board · Live Council
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Reviews" value={fmt(data?.total_reviews)} />
        <StatCard label="Pending" value={fmt(data?.pending)} />
        <StatCard label="Approved" value={fmt(data?.approved)} />
        <StatCard label="Rejected" value={fmt(data?.rejected)} />
        <StatCard label="Open Conflicts" value={fmt(data?.conflicts_open)} />
      </div>

      {data?.top_risks.length ? (
        <div className="mb-3">
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Top Council Risks
          </div>
          <div className="flex flex-wrap gap-2">
            {data.top_risks.map((r) => (
              <Chip key={r.risk} tone="warning">
                {r.risk} · {r.count}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {data?.member_tally && Object.keys(data.member_tally).length > 0 ? (
        <div className="mb-3">
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Member Recommendations (cumulative)
          </div>
          <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {Object.entries(data.member_tally).map(([id, t]) => (
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
        {(data?.recent ?? []).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-paper">{r.title}</div>
              <div className="text-[11px] text-soft-gray">
                unified: {r.unified} · conflicts: {r.conflicts} · {ago(r.created_at)}
              </div>
            </div>
            <Chip tone={statusTone(r.status)}>{r.status}</Chip>
          </li>
        ))}
        {!data?.recent.length && (
          <li className="py-2 text-xs text-soft-gray">
            No Executive Board reviews yet. Call{" "}
            <code className="text-paper">requestExecutiveReview</code> to engage the council.
          </li>
        )}
      </ul>
    </Panel>
  );
});
