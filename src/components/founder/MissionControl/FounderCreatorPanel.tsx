import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Palette } from "lucide-react";
import { fmt, ago, statusTone, type MCData } from "./utils";

type Slice = MCData["founder_creator"] | undefined;

export const FounderCreatorPanel = memo(function FounderCreatorPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Founder Creator Runtime
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Requests" value={fmt(data?.total_requests)} />
        <StatCard label="Pending" value={fmt(data?.pending)} />
        <StatCard label="Approved" value={fmt(data?.approved)} />
        <StatCard label="Rejected" value={fmt(data?.rejected)} />
        <StatCard label="Assets" value={fmt(data?.total_assets)} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {data?.by_kind &&
          Object.entries(data.by_kind).map(([k, n]) => (
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
            {(data?.recent_requests ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.title}</div>
                  <div className="text-[11px] text-soft-gray">
                    {r.kind} · {ago(r.created_at)}
                  </div>
                </div>
                <Chip tone={statusTone(r.status)}>{r.status}</Chip>
              </li>
            ))}
            {!data?.recent_requests.length && (
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
            {(data?.recent_assets ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{a.name}</div>
                  <div className="text-[11px] text-soft-gray">
                    {a.kind} · v{a.asset_version} · {a.model ?? "unknown model"} ·{" "}
                    {ago(a.created_at)}
                  </div>
                </div>
                <Chip tone="neutral">final</Chip>
              </li>
            ))}
            {!data?.recent_assets.length && (
              <li className="py-2 text-xs text-soft-gray">
                No finalized Founder Creator assets yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
