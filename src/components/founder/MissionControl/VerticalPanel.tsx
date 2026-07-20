import { memo } from "react";
import { Panel, Chip, Hairline } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { ago, type MCData } from "./utils";

type VerticalKey = "mfg" | "health" | "agri";
type Slice = NonNullable<MCData["verticals"]>[VerticalKey] | undefined;

const LABEL: Record<VerticalKey, string> = {
  mfg: "Manufacturing",
  health: "Healthcare",
  agri: "Agriculture",
};

export const VerticalPanel = memo(function VerticalPanel({
  vertical,
  data,
}: {
  vertical: VerticalKey;
  data: Slice;
}) {
  const label = LABEL[vertical];
  return (
    <Panel className="p-5 lg:col-span-3">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-porcelain">
            {label} · Vertical Runtime
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="gold">{data?.total ?? 0} records</Chip>
          <Chip tone={data?.critical_24h ? "warning" : "neutral"}>
            {data?.critical_24h ?? 0} critical/24h
          </Chip>
          <Chip tone={data?.pending_approvals ? "warning" : "neutral"}>
            {data?.pending_approvals ?? 0} pending approvals
          </Chip>
        </div>
      </div>
      <Hairline />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-soft-gray">
            Modules ({data?.by_module.length ?? 0}/10)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {data?.by_module.map((m) => (
              <div
                key={m.module}
                className="flex items-center justify-between rounded-md border border-porcelain/10 px-2.5 py-1.5"
              >
                <span className="text-xs text-porcelain/90">{m.module}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-soft-gray">{m.total}</span>
                  <Chip tone="gold">{m.status}</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-soft-gray">
            Recent Activity
          </div>
          <ul className="divide-y divide-porcelain/10">
            {data?.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs text-porcelain">{r.name}</div>
                  <div className="text-[10px] text-soft-gray">{r.kind}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.severity && r.severity !== "info" && (
                    <Chip tone={r.severity === "critical" ? "warning" : "neutral"}>
                      {r.severity}
                    </Chip>
                  )}
                  <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
                </div>
              </li>
            ))}
            {!data?.recent.length && (
              <li className="py-2 text-xs text-soft-gray">
                No {label.toLowerCase()} activity yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
