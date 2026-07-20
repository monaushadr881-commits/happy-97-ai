import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Rocket } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["publishing"] | undefined;

export const PublishingPanel = memo(function PublishingPanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Publishing Runtime
        </h3>
      </div>
      <Hairline className="my-4" />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Packages" value={fmt(data?.total_packages)} />
        <StatCard label="Assets" value={fmt(data?.total_assets)} />
        <StatCard label="Pending" value={fmt(data?.pending_approvals)} />
        <StatCard label="Stores" value={fmt(data?.by_store ? Object.keys(data.by_store).length : 0)} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {data?.by_store &&
          Object.entries(data.by_store).map(([s, n]) => (
            <Chip key={s} tone="gold">
              {s.replace("_", " ")}: {n}
            </Chip>
          ))}
      </div>
      <ul className="divide-y divide-white/5">
        {(data?.recent ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-paper">{p.name}</div>
              <div className="text-[11px] text-soft-gray">
                {p.store} · {p.app_name} v{p.app_version} · pkg v{p.package_version} ·{" "}
                {ago(p.created_at)}
              </div>
            </div>
            <Chip tone="neutral">{p.asset_kind}</Chip>
          </li>
        ))}
        {!data?.recent.length && (
          <li className="py-2 text-xs text-soft-gray">
            No publishing packages generated yet. Materials only — external submission is
            BLOCKED.
          </li>
        )}
      </ul>
    </Panel>
  );
});
