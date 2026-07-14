/** /education/notes — personal study notes CRUD. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { eduListNotes, eduSaveNote, eduDeleteNote } from "@/lib/education-v1.functions";
import { StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/notes")({
  head: () => ({ meta: [{ title: "Notes — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Notes,
});

type Note = { id: string; title: string | null; body: string; tags: string[] | null; updated_at: string };

function Notes() {
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const notes = useQuery({ queryKey: ["edu", "notes"], queryFn: () => eduListNotes({ data: { limit: 200 } }) });

  const save = useMutation({
    mutationFn: () => eduSaveNote({ data: { id: selected?.id, title: title || undefined, body } }),
    onSuccess: () => {
      toast.success("Note saved");
      setSelected(null); setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["edu", "notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => eduDeleteNote({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["edu", "notes"] }); },
  });

  const open = (n: Note) => { setSelected(n); setTitle(n.title ?? ""); setBody(n.body ?? ""); };
  const list = ((notes.data ?? []) as unknown as Note[]);

  return (
    <>
      <PageHeader eyebrow="Education OS" title="Notes" description="Personal study notes, searchable and taggable." />
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Panel className="p-4 max-h-[36rem] overflow-y-auto">
          <ul className="space-y-1">
            {list.map((n) => (
              <li key={n.id}>
                <button onClick={() => open(n)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm ${selected?.id === n.id ? "bg-white/10 text-paper" : "text-soft-gray hover:bg-white/5 hover:text-paper"}`}>
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-3.5 w-3.5" /> {n.title ?? "Untitled"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-soft-gray">{new Date(n.updated_at).toLocaleDateString()}</div>
                </button>
              </li>
            ))}
            {!list.length && <li className="text-xs text-soft-gray p-2">No notes yet.</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{selected ? "Edit note" : "New note"}</h2>
            {selected && (
              <Button size="sm" variant="ghost" onClick={() => del.mutate(selected.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
          <Hairline className="my-4" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea rows={14} className="mt-3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your notes (Markdown supported)…" />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => save.mutate()} disabled={!body.trim() || save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            <Button variant="ghost" onClick={() => { setSelected(null); setTitle(""); setBody(""); }}>New</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
