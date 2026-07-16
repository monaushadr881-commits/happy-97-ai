import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateDatabasePlan } from "@/lib/uabr/database-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/database")({ component: Page });

function Page() {
  const fn = useServerFn(generateDatabasePlan);
  const [csv, setCsv] = useState("orders, customers, products");
  const mut = useMutation({ mutationFn: (tables: string[]) => fn({ data: { tables } }) });
  const tables = csv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <UabrShell title="AI Database Engine" description="Tables, RLS, RBAC, indexes, buckets.">
      <Panel className="p-6 space-y-3">
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="orders, customers, products" />
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={tables.length === 0 || mut.isPending} onClick={() => mut.mutate(tables)}>{mut.isPending ? "Planning…" : "Plan Schema"}</button>
      </Panel>
      {mut.data && (
        <div className="space-y-4">
          {mut.data.tables.map((t) => (
            <Panel key={t.name} className="p-4">
              <div className="flex items-center gap-2 mb-2"><span className="text-paper text-sm font-semibold">{t.name}</span><Chip tone="info">{t.columns.length} cols</Chip></div>
              <ul className="text-xs text-soft-gray grid md:grid-cols-2 gap-1">{t.columns.map((c) => <li key={c.name}><span className="text-paper">{c.name}</span> — {c.type}</li>)}</ul>
              <div className="mt-2"><p className="text-xs text-paper mb-1">RLS</p><ul className="text-xs text-soft-gray list-disc pl-4 space-y-0.5">{t.rls.map((r) => <li key={r}>{r}</li>)}</ul></div>
            </Panel>
          ))}
          <Panel className="p-4 text-xs text-soft-gray">
            <p className="text-paper mb-1">Indexes</p>
            <ul className="list-disc pl-4">{mut.data.indexes.map((i) => <li key={i}>{i}</li>)}</ul>
          </Panel>
        </div>
      )}
    </UabrShell>
  );
}
