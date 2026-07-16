import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listMemory, upsertMemory, deleteMemory } from "@/lib/faios/founder-memory.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/memory")({ component: Page });

function Page() {
  const list = useServerFn(listMemory);
  const upsert = useServerFn(upsertMemory);
  const del = useServerFn(deleteMemory);
  const qc = useQueryClient();
  const [scope, setScope] = useState("preferences");
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  const mem = useQuery({ queryKey: ["faios", "memory"], queryFn: () => list({ data: {} }) });
  const upM = useMutation({
    mutationFn: () => upsert({ data: { scope, key, value: { text: val } } }),
    onSuccess: () => { setKey(""); setVal(""); qc.invalidateQueries({ queryKey: ["faios", "memory"] }); },
  });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["faios", "memory"] }) });

  return (
    <FaiosShell title="Founder Memory" description="What HAPPY remembers about you and the ecosystem.">
      <div className="space-y-6">
        <Panel className="p-6 space-y-2">
          <div className="flex flex-wrap gap-2">
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 text-sm text-paper">
              {["preferences", "coding_style", "design_language", "business_rules", "decisions", "roadmap"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="key" className="rounded bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-paper" />
            <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="value" className="flex-1 min-w-48 rounded bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-paper" />
            <button onClick={() => key && val && upM.mutate()} className="px-4 py-1.5 rounded bg-gold/20 border border-gold/40 text-gold text-sm">Save</button>
          </div>
        </Panel>
        <Panel className="p-6">
          {mem.data?.memory?.length ? (
            <ul className="text-xs space-y-2">
              {mem.data.memory.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between gap-3 border-t border-white/5 pt-2">
                  <div className="flex items-center gap-2">
                    <Chip tone="info">{m.scope}</Chip>
                    <span className="text-paper text-sm">{m.key}</span>
                    <span className="text-soft-gray">{JSON.stringify(m.value).slice(0, 120)}</span>
                  </div>
                  <button onClick={() => delM.mutate(m.id)} className="px-2 py-0.5 rounded border border-red-500/40 text-red-300">Forget</button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No memory yet" description="Save a preference to teach HAPPY." />}
        </Panel>
      </div>
    </FaiosShell>
  );
}
