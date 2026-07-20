import { memo } from "react";
import { Panel, Chip, Hairline, StatCard } from "@/design-system/primitives";
import { Workflow } from "lucide-react";
import { fmt, ago, type MCData } from "./utils";

type Slice = MCData["universal_runtime"] | undefined;

export const UniversalRuntimePanel = memo(function UniversalRuntimePanel({ data }: { data: Slice }) {
  return (
    <Panel className="p-5 lg:col-span-3">
      <div className="mb-4 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">
          Universal Runtime · Canonical Execution Pipeline
        </h3>
        <Chip tone={data?.pipeline_ok ? "gold" : "warning"}>
          {data?.pipeline_ok ? "healthy" : "attention"}
        </Chip>
      </div>
      <Hairline className="my-4" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Coverage" value={`${data?.coverage_pct ?? 0}%`} />
        <StatCard label="Executions·24h" value={fmt(data?.executions_24h)} />
        <StatCard label="Running Now" value={fmt(data?.running_now)} />
        <StatCard label="Failures·24h" value={fmt(data?.failures_24h)} />
        <StatCard label="Queue Pending" value={fmt(data?.queue_pending)} />
        <StatCard label="Queue Failed" value={fmt(data?.queue_failed)} />
      </div>
      <Hairline className="my-4" />
      <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
        Pipeline Stages ({data?.stages.length ?? 0})
      </div>
      <ol className="grid gap-2 md:grid-cols-2">
        {(data?.stages ?? []).map((s, i) => (
          <li
            key={s.stage}
            className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-[11px] tabular-nums text-soft-gray">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-paper">{s.stage}</span>
                <span className="text-[11px] text-soft-gray">{s.owner}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] tabular-nums text-soft-gray">
                {fmt(s.count_24h)} · 24h
              </span>
              <Chip
                tone={s.status === "wired" ? "gold" : s.status === "degraded" ? "warning" : "neutral"}
              >
                {s.status}
              </Chip>
            </div>
          </li>
        ))}
      </ol>
      <Hairline className="my-4" />
      <div className="text-xs uppercase tracking-[0.14em] text-soft-gray mb-2">
        Execution Adoption · Domains ({data?.adoption.by_domain.length ?? 0})
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <StatCard label="Handlers Adopted" value={fmt(data?.adoption.handlers_adopted)} />
        <StatCard label="Adoptions · 24h" value={fmt(data?.adoption.adopted_24h)} />
        <StatCard label="Domains" value={fmt(data?.adoption.by_domain.length)} />
        <StatCard label="Executions · 24h" value={fmt(data?.executions_24h)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-soft-gray mb-2">By Domain</div>
          <ul className="space-y-1.5">
            {(data?.adoption.by_domain ?? []).map((b) => (
              <li
                key={b.domain}
                className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-1.5"
              >
                <span className="text-xs text-paper">{b.domain}</span>
                <Chip tone="gold">{fmt(b.count_24h)}</Chip>
              </li>
            ))}
            {!data?.adoption.by_domain.length && (
              <li className="text-xs text-soft-gray">No adopted handlers yet.</li>
            )}
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-soft-gray mb-2">
            Recent Adoptions
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.adoption.recent ?? []).map((r) => (
              <li key={r.id} className="py-1.5 flex items-center justify-between">
                <span className="text-xs text-paper truncate">{r.capability}</span>
                <span className="text-[10px] text-soft-gray">{ago(r.occurred_at)}</span>
              </li>
            ))}
            {!data?.adoption.recent.length && (
              <li className="py-1.5 text-xs text-soft-gray">No recent adoptions.</li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
});
