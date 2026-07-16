import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateFrontendPlan } from "@/lib/uabr/frontend-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/frontend")({ component: Page });

function Page() {
  const fn = useServerFn(generateFrontendPlan);
  const [csv, setCsv] = useState("Menu, Orders, Tables");
  const mut = useMutation({ mutationFn: (modules: string[]) => fn({ data: { modules, include_admin: true, include_founder: true } }) });
  const modules = csv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <UabrShell title="AI Frontend Engine" description="Layouts, pages, components, hooks, forms, charts.">
      <Panel className="p-6 space-y-3">
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={modules.length === 0 || mut.isPending} onClick={() => mut.mutate(modules)}>{mut.isPending ? "Planning…" : "Plan Frontend"}</button>
      </Panel>
      {mut.data && (
        <div className="space-y-4">
          <Panel className="p-4">
            <h4 className="text-sm text-paper mb-2">Pages</h4>
            <ul className="text-xs text-soft-gray space-y-1">{mut.data.pages.map((p) => <li key={p.path}><span className="text-paper">{p.path}</span> <Chip tone="neutral">{p.kind}</Chip> — {p.sections.join(", ")}</li>)}</ul>
          </Panel>
          <Panel className="p-4 grid md:grid-cols-2 gap-3 text-xs text-soft-gray">
            <div><p className="text-paper">Components</p><div className="flex flex-wrap gap-1 mt-1">{mut.data.components.map((c) => <Chip key={c} tone="neutral">{c}</Chip>)}</div></div>
            <div><p className="text-paper">Hooks</p><div className="flex flex-wrap gap-1 mt-1">{mut.data.hooks.map((h) => <Chip key={h} tone="neutral">{h}</Chip>)}</div></div>
            <div><p className="text-paper">Forms</p><div className="flex flex-wrap gap-1 mt-1">{mut.data.forms.map((f) => <Chip key={f} tone="neutral">{f}</Chip>)}</div></div>
            <div><p className="text-paper">Charts</p><div className="flex flex-wrap gap-1 mt-1">{mut.data.charts.map((c) => <Chip key={c} tone="neutral">{c}</Chip>)}</div></div>
          </Panel>
        </div>
      )}
    </UabrShell>
  );
}
