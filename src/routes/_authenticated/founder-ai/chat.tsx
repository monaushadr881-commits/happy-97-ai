import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { submitFounderCommand, approveFounderCommand, executeFounderCommand, listFounderCommands } from "@/lib/faios/founder-command.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/chat")({ component: Page });

function Page() {
  const submit = useServerFn(submitFounderCommand);
  const approve = useServerFn(approveFounderCommand);
  const execute = useServerFn(executeFounderCommand);
  const list = useServerFn(listFounderCommands);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const commands = useQuery({ queryKey: ["faios", "commands"], queryFn: () => list({ data: { limit: 50 } }), refetchInterval: 5_000 });

  const submitM = useMutation({
    mutationFn: () => submit({ data: { raw_text: text, mode: "approval" } }),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["faios"] }); },
  });
  const approveM = useMutation({
    mutationFn: (v: { id: string; decision: "approve" | "reject" }) => approve({ data: { command_id: v.id, decision: v.decision } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faios"] }),
  });
  const executeM = useMutation({
    mutationFn: (id: string) => execute({ data: { command_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faios"] }),
  });

  return (
    <FaiosShell title="Founder Chat" description="Talk to HAPPY. HAPPY plans. You approve.">
      <div className="space-y-6">
        <Panel className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) submitM.mutate(); }} className="space-y-3">
            <label htmlFor="cmd" className="text-xs text-soft-gray">Say something to HAPPY</label>
            <textarea id="cmd" value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder="e.g. HAPPY improve UI"
              className="w-full rounded-md bg-black/30 border border-white/10 p-3 text-paper text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-soft-gray">HAPPY will draft a plan. Nothing runs without your approval.</p>
              <button type="submit" disabled={submitM.isPending || !text.trim()}
                className="px-4 py-1.5 rounded-md bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold text-sm disabled:opacity-40">
                {submitM.isPending ? "Sending…" : "Send"}
              </button>
            </div>
            {submitM.error && <p className="text-red-400 text-xs">{(submitM.error as Error).message}</p>}
          </form>
        </Panel>
        <Panel className="p-6">
          <h3 className="text-sm font-semibold text-paper mb-3">Conversation</h3>
          {commands.data?.commands?.length ? (
            <ul className="space-y-3">
              {commands.data.commands.map((c: any) => (
                <li key={c.id} className="border-t border-white/5 pt-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <p className="text-paper text-sm">{c.raw_text}</p>
                    <Chip tone={c.status === "succeeded" ? "success" : c.status === "blocked" ? "warning" : "info"}>{c.status}</Chip>
                  </div>
                  <p className="text-soft-gray">{c.plan?.summary}</p>
                  {c.plan?.blocked && <p className="text-amber-400">Blocked: {c.plan.blocked_reason}</p>}
                  {c.status === "awaiting_approval" && (
                    <div className="flex gap-2">
                      <button onClick={() => approveM.mutate({ id: c.id, decision: "approve" })} className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">Approve</button>
                      <button onClick={() => approveM.mutate({ id: c.id, decision: "reject" })} className="px-3 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300">Reject</button>
                    </div>
                  )}
                  {c.status === "approved" && (
                    <button onClick={() => executeM.mutate(c.id)} className="px-3 py-1 rounded bg-gold/20 border border-gold/40 text-gold">Execute</button>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-soft-gray">No commands yet.</p>}
        </Panel>
      </div>
    </FaiosShell>
  );
}
