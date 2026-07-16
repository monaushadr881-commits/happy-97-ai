import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateBackendPlan } from "@/lib/uabr/backend-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/backend")({ component: Page });

function Page() {
  const fn = useServerFn(generateBackendPlan);
  const [csv, setCsv] = useState("Orders, Customers, Menu");
  const mut = useMutation({ mutationFn: (modules: string[]) => fn({ data: { modules } }) });
  const modules = csv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <UabrShell title="AI Backend Engine" description="REST + realtime + jobs + webhooks, all admin-gated.">
      <Panel className="p-6 space-y-3">
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={modules.length === 0 || mut.isPending} onClick={() => mut.mutate(modules)}>{mut.isPending ? "Planning…" : "Plan Backend"}</button>
      </Panel>
      {mut.data && (
        <div className="space-y-4">
          <Panel className="p-4">
            <h4 className="text-sm text-paper mb-2">Endpoints</h4>
            <ul className="text-xs text-soft-gray space-y-1">{mut.data.endpoints.map((e) => <li key={`${e.method}${e.path}`}><span className="text-paper">{e.method}</span> {e.path} — {e.purpose} <Chip tone="neutral">{e.auth}</Chip></li>)}</ul>
          </Panel>
          <Panel className="p-4">
            <h4 className="text-sm text-paper mb-2">Realtime</h4>
            <div className="flex flex-wrap gap-2">{mut.data.realtime_channels.map((c) => <Chip key={c} tone="info">{c}</Chip>)}</div>
          </Panel>
          <Panel className="p-4 text-xs text-soft-gray grid md:grid-cols-3 gap-3">
            <div><p className="text-paper">Jobs</p><ul className="list-disc pl-4">{mut.data.jobs.map((j) => <li key={j}>{j}</li>)}</ul></div>
            <div><p className="text-paper">Webhooks</p><ul className="list-disc pl-4">{mut.data.webhooks.map((w) => <li key={w}>{w}</li>)}</ul></div>
            <div><p className="text-paper">Rate limits</p><ul className="list-disc pl-4">{mut.data.rate_limits.map((r) => <li key={r}>{r}</li>)}</ul></div>
          </Panel>
        </div>
      )}
    </UabrShell>
  );
}
