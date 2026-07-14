/** /digital-human/sessions — HAPPY conversation history. */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { dhListSessions, dhDeleteSession } from "@/lib/digital-human-v1.functions";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/digital-human/sessions")({
  head: () => ({ meta: [{ title: "Sessions — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Sessions,
});

type Session = { id: string; mode: string; surface: string; title: string | null; updated_at: string };

function Sessions() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["dh", "sessions"], queryFn: () => dhListSessions() });
  const del = useMutation({
    mutationFn: (id: string) => dhDeleteSession({ data: { session_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh", "sessions"] }),
  });

  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="HAPPY Sessions"
        description="All your recent conversations with HAPPY. Delete any session to remove its memory." />
      <Panel className="p-5">
        <ul className="divide-y divide-white/5">
          {((q.data ?? []) as Session[]).map((s) => (
            <li key={s.id} className="py-3 flex items-center gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Chip tone="gold">{s.mode}</Chip>
                  <Chip tone="neutral">{s.surface}</Chip>
                </div>
                <div className="mt-1 text-sm text-paper truncate">{s.title ?? "Untitled"}</div>
                <div className="text-[10px] text-soft-gray">{new Date(s.updated_at).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => del.mutate(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {!(q.data ?? []).length && (
            <li className="py-8 text-center text-sm text-soft-gray">No sessions yet.</li>
          )}
        </ul>
        <Hairline className="mt-4" />
        <p className="mt-3 text-[11px] text-soft-gray">
          HAPPY stores conversations only when memory is enabled in Settings. Deleting a session removes it permanently.
        </p>
      </Panel>
    </>
  );
}
