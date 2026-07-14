/** /messages — Unified messaging. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Hairline, EmptyState } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { msgListConversations, msgCreateConversation, msgListMessages, msgSend } from "@/lib/cmos-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const convos = useQuery({ queryKey: ["cmos", "convos"], queryFn: () => msgListConversations() });
  const msgs = useQuery({
    queryKey: ["cmos", "msgs", active], enabled: !!active,
    queryFn: () => msgListMessages({ data: { conversation_id: active! } }),
  });
  const create = useMutation({
    mutationFn: () => msgCreateConversation({ data: { title } }),
    onSuccess: (c: any) => { setTitle(""); setActive(c.id); qc.invalidateQueries({ queryKey: ["cmos", "convos"] }); },
  });
  const send = useMutation({
    mutationFn: () => msgSend({ data: { conversation_id: active!, content: draft } }),
    onSuccess: () => { setDraft(""); qc.invalidateQueries({ queryKey: ["cmos", "msgs", active] }); },
    onError: (e: any) => toast.error(e?.message ?? "Send failed"),
  });

  return (
    <>
      <PageHeader eyebrow="Messaging" title="Messages"
        description="Private, group and business threads — with search, media sharing and pinned messages." />
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Panel className="p-4">
          <div className="flex gap-2 mb-3">
            <Input placeholder="New thread…" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button size="sm" onClick={() => create.mutate()} disabled={!title.trim() || create.isPending}>+</Button>
          </div>
          <Hairline className="mb-2" />
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {(convos.data ?? []).map((c: any) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs ${active === c.id ? "bg-gold/10 text-gold" : "text-soft-gray hover:bg-white/5"}`}>
                {c.title}
              </button>
            ))}
            {convos.data?.length === 0 && <EmptyState title="No threads" description="Start a new thread above." />}
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col min-h-[60vh]">
          {!active ? <div className="m-auto text-xs text-soft-gray">Select or create a thread.</div>
            : <>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {(msgs.data ?? []).map((m: any) => (
                    <div key={m.id} className="rounded-md bg-white/[0.03] px-3 py-2 text-sm text-paper">
                      {m.content}
                      <div className="text-[10px] text-soft-gray mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
                <Hairline className="my-3" />
                <div className="flex gap-2">
                  <Input placeholder="Write a message…" value={draft} onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) send.mutate(); }} />
                  <Button onClick={() => send.mutate()} disabled={!draft.trim() || send.isPending}>Send</Button>
                </div>
              </>}
        </Panel>
      </div>
    </>
  );
}
