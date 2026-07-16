import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateTestPlan } from "@/lib/uabr/test-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/tests")({ component: Page });

function Page() {
  const fn = useServerFn(generateTestPlan);
  const [csv, setCsv] = useState("Menu, Orders, Tables");
  const mut = useMutation({ mutationFn: (modules: string[]) => fn({ data: { modules } }) });
  const modules = csv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <UabrShell title="AI Test Engine" description="Unit, integration, e2e, perf, a11y, security suites.">
      <Panel className="p-6 space-y-3">
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={modules.length === 0 || mut.isPending} onClick={() => mut.mutate(modules)}>{mut.isPending ? "Planning…" : "Plan Tests"}</button>
      </Panel>
      {mut.data && (
        <Panel className="p-4">
          <ul className="text-sm text-soft-gray space-y-2">{mut.data.suites.map((s) => (
            <li key={s.name} className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="text-paper">{s.name}</span><Chip tone="info">{s.kind}</Chip><span className="text-xs">{s.count} tests</span>
            </li>))}</ul>
        </Panel>
      )}
    </UabrShell>
  );
}
