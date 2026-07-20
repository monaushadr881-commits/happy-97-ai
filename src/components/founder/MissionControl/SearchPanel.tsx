import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["search"] | undefined;

export const SearchPanel = memo(function SearchPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Universal Search · Coverage
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Total indexed" value={fmt(data?.total_indexed)} />
        <StatCard label="Sources" value={fmt(data?.indexed_sources.length)} />
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
        <StatCard label="Queries 24h" value={fmt(data?.queries_24h)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft-gray">
            Indexed Sources
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.indexed_sources ?? []).map((r) => (
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
            {(data?.recent_queries ?? []).slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{r.q || "—"}</div>
                  <div className="text-[11px] text-soft-gray">{r.results_total} results</div>
                </div>
                <span className="text-[11px] text-soft-gray">{ago(r.occurred_at)}</span>
              </li>
            ))}
            {!data?.recent_queries.length && (
              <li className="py-2 text-xs text-soft-gray">No audited searches yet.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
