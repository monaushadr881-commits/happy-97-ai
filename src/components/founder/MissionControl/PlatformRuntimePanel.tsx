import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Server } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["platform_runtime"] | undefined;

export const PlatformRuntimePanel = memo(function PlatformRuntimePanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Universal File Runtime · UFS · Import · Export · Sync · Command
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Files" value={fmt(data?.files_total)} />
        <StatCard label="Understood" value={fmt(data?.understandings_total)} />
        <StatCard label="Imports · 24h" value={fmt(data?.imports_24h)} />
        <StatCard label="Exports · 24h" value={fmt(data?.exports_24h)} />
        <StatCard label="Syncs · 24h" value={fmt(data?.syncs_24h)} />
        <StatCard label="Commands · 24h" value={fmt(data?.commands_24h)} />
        <StatCard label="Jobs Pending" value={fmt(data?.jobs.pending)} />
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
      </div>
      <Hairline className="my-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
            Runtime Coverage
          </div>
          <ul className="space-y-2">
            {(data?.coverage ?? []).map((c) => (
              <li
                key={c.capability}
                className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2"
              >
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
          <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
            Recent Activity
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent ?? []).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-paper">{r.name}</span>
                  <span className="text-[11px] text-soft-gray">{r.kind}</span>
                </div>
                <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
              </li>
            ))}
            {!data?.recent.length && (
              <li className="py-2 text-xs text-soft-gray">No UFS activity yet.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
