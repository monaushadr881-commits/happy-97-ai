/** /knowledge/ask — HAPPY knowledge assistant (RAG-lite). */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { kbAskHappy } from "@/lib/knowledge-v1.functions";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/knowledge/ask")({
  head: () => ({ meta: [{ title: "Ask HAPPY — Knowledge OS" }, { name: "robots", content: "noindex" }] }),
  component: AskPage,
});

function AskPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"public" | "company">("public");
  const ask = useMutation({
    mutationFn: () => kbAskHappy({ data: { question: q, scope } }),
    onError: (e: any) => toast.error(e?.message ?? "Ask failed"),
  });
  return (
    <>
      <PageHeader eyebrow="Ask HAPPY" title="Knowledge Assistant"
        description="HAPPY answers with cited sources and clearly separates facts, traditions, interpretations and opinions." />
      <Panel className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-gold" />
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray">Question</div>
        </div>
        <Hairline className="mb-3" />
        <Textarea value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about science, business, religion, culture, law, medicine (educational), history…"
          className="min-h-24 mb-3" />
        <div className="flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-soft-gray">Scope</div>
          <button onClick={() => setScope("public")}
            className={`text-xs px-2 py-1 rounded ${scope === "public" ? "bg-gold/10 text-gold" : "text-soft-gray"}`}>Public</button>
          <button onClick={() => setScope("company")}
            className={`text-xs px-2 py-1 rounded ${scope === "company" ? "bg-gold/10 text-gold" : "text-soft-gray"}`}>My company</button>
          <div className="ml-auto">
            <Button onClick={() => ask.mutate()} disabled={!q.trim() || ask.isPending}>
              {ask.isPending ? "Thinking…" : "Ask HAPPY"}
            </Button>
          </div>
        </div>
      </Panel>

      {ask.data && (
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">Answer</div>
          <Hairline className="mb-3" />
          <div className="prose prose-invert max-w-none text-sm text-paper whitespace-pre-wrap">{ask.data.answer}</div>
          {ask.data.sources.length > 0 && (
            <>
              <Hairline className="my-4" />
              <div className="text-[10px] uppercase tracking-widest text-soft-gray mb-2">Sources</div>
              <ol className="text-xs text-soft-gray space-y-1 list-decimal ml-4">
                {ask.data.sources.map((s: any) => (
                  <li key={s.id}>
                    <span className="text-paper">{s.title}</span>{" "}
                    <Chip>{s.is_public ? "public" : "company"}</Chip>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Panel>
      )}
    </>
  );
}
