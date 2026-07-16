import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel } from "@/design-system/primitives";
import { generateDocsPlan } from "@/lib/uabr/documentation-engine.functions";

export const Route = createFileRoute("/_authenticated/uabr/documentation")({ component: Page });

function Page() {
  const fn = useServerFn(generateDocsPlan);
  const [name, setName] = useState("MyProject");
  const mut = useMutation({ mutationFn: (project_name: string) => fn({ data: { project_name } }) });
  return (
    <UabrShell title="AI Documentation Engine" description="Complete developer + user documentation set.">
      <Panel className="p-6 space-y-3">
        <input className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={!name || mut.isPending} onClick={() => mut.mutate(name)}>{mut.isPending ? "Planning…" : "Plan Docs"}</button>
      </Panel>
      {mut.data && (
        <Panel className="p-4">
          <ul className="text-xs text-soft-gray space-y-1">{mut.data.files.map((f) => <li key={f.path}><span className="text-paper">{f.path}</span> — {f.purpose}</li>)}</ul>
        </Panel>
      )}
    </UabrShell>
  );
}
