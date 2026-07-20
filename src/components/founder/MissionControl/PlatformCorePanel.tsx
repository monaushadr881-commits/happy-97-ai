import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Server } from "lucide-react";
import { fmt, type MCData } from "./utils";

type Slice = MCData["platform_core"] | undefined;

export const PlatformCorePanel = memo(function PlatformCorePanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Platform Core · Runtime Layers
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
        <StatCard label="DB Probe" value={data?.db_probe_ok ? "OK" : "DEGRADED"} />
        <StatCard label="Layers" value={fmt(data?.layers.length)} />
      </div>
      <Hairline className="my-4" />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {(data?.layers ?? []).map((l) => (
          <li
            key={l.layer}
            className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-sm text-paper">{l.layer}</span>
              <span className="text-[11px] text-soft-gray">{l.owner}</span>
            </div>
            <Chip
              tone={
                l.status === "present" ? "gold" : l.status === "degraded" ? "warning" : "danger"
              }
            >
              {l.status}
            </Chip>
          </li>
        ))}
      </ul>
    </Panel>
  );
});
