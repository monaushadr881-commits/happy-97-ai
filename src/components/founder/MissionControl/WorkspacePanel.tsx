import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["workspace"] | undefined;

export const WorkspacePanel = memo(function WorkspacePanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Workspace · Founder Attached Items
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Workspaces" value={fmt(data?.total)} />
        <StatCard label="Active" value={fmt(data?.active)} />
        <StatCard label="Recent items" value={fmt(data?.items_total)} />
        <StatCard label="Attach 7d" value={fmt(data?.attach_events_7d)} />
      </div>
      <ul className="divide-y divide-white/5">
        {(data?.items_recent ?? []).slice(0, 8).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-paper">{r.name}</div>
              <div className="truncate text-[11px] text-soft-gray">
                {r.kind} · v{r.workspace_link_version} · ws {r.workspace_id.slice(0, 8)}
              </div>
            </div>
            <span className="text-[11px] text-soft-gray">{ago(r.created_at)}</span>
          </li>
        ))}
        {!data?.items_recent.length && (
          <li className="py-2 text-xs text-soft-gray">No workspace-linked assets yet.</li>
        )}
      </ul>
    </Panel>
  );
});
