import { memo } from "react";
import { Panel, Hairline, StatCard } from "@/design-system/primitives";
import { BookOpen, Server } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

export const KnowledgeHealthPanel = memo(function KnowledgeHealthPanel({
  knowledge,
  health,
}: {
  knowledge: MCData["knowledge"] | undefined;
  health: MCData["health"] | undefined;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Knowledge Updates
          </h3>
        </div>
        <Hairline className="my-4" />
        <ul className="divide-y divide-white/5">
          {(knowledge ?? []).map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0 truncate text-paper">{k.title}</div>
              <time className="numeric text-[11px] text-soft-gray">{ago(k.updated_at)}</time>
            </li>
          ))}
          {!knowledge?.length && (
            <li className="py-2 text-xs text-soft-gray">No knowledge documents yet.</li>
          )}
        </ul>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
            Runtime Health (24h)
          </h3>
        </div>
        <Hairline className="my-4" />
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Probes" value={fmt(health?.total)} />
          <StatCard label="Healthy" value={fmt(health?.healthy)} />
          <StatCard label="Degraded" value={fmt(health?.degraded)} />
          <StatCard label="Down" value={fmt(health?.down)} />
        </div>
        <p className="mt-4 text-[11px] text-soft-gray">
          Build & Typecheck gates are enforced by R183 Migration Guardrails before every
          runtime batch merges.
        </p>
      </Panel>
    </div>
  );
});
