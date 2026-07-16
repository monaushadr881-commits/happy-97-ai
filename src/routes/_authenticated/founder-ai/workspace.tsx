import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listWorkspace, createWorkspaceItem, updateWorkspaceItem, deleteWorkspaceItem } from "@/lib/faios/founder-workspace.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/workspace")({ component: Page });

function Page() {
  const list = useServerFn(listWorkspace);
  const create = useServerFn(createWorkspaceItem);
  const update = useServerFn(updateWorkspaceItem);
  const del = useServerFn(deleteWorkspaceItem);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("note");
  const items = useQuery({ queryKey: ["faios", "workspace"], queryFn: () => list({ data: {} }) });
  const createM = useMutation({ mutationFn: () => create({ data: { kind, title } }), onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["faios", "workspace"] }); } });
  const pinM = useMutation({ mutationFn: (v: { id: string; pinned: boolean }) => update({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["faios", "workspace"] }) });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["faios", "workspace"] }) });

  return (
    <FaiosShell title="Founder Workspace" description="Notes, tasks, pins, ideas.">
      <div className="space-y-6">
        <Panel className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) createM.mutate(); }} className="flex gap-2 flex-wrap">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 text-sm text-paper">
              <option value="note">Note</option><option value="task">Task</option><option value="idea">Idea</option><option value="brief">Brief</option>
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a workspace item…"
              className="flex-1 min-w-64 rounded bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-paper" />
            <button className="px-4 py-1.5 rounded bg-gold/20 border border-gold/40 text-gold text-sm">Add</button>
          </form>
        </Panel>
        <Panel className="p-6">
          {items.data?.items?.length ? (
            <ul className="text-xs space-y-2">
              {items.data.items.map((it: any) => (
                <li key={it.id} className="flex items-center justify-between gap-3 border-t border-white/5 pt-2">
                  <div className="flex items-center gap-2">
                    <Chip tone="info">{it.kind}</Chip>
                    <span className="text-paper text-sm">{it.title}</span>
                    {it.pinned && <Chip tone="warning">pinned</Chip>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => pinM.mutate({ id: it.id, pinned: !it.pinned })} className="px-2 py-0.5 rounded border border-white/10 text-soft-gray">{it.pinned ? "Unpin" : "Pin"}</button>
                    <button onClick={() => delM.mutate(it.id)} className="px-2 py-0.5 rounded border border-red-500/40 text-red-300">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Empty workspace" description="Add your first note or task." />}
        </Panel>
      </div>
    </FaiosShell>
  );
}
