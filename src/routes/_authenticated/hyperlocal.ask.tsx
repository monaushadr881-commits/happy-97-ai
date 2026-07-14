/** /hyperlocal/ask — AI hyperlocal assistant. */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hlAskHappy } from "@/lib/hyperlocal-v1.functions";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hyperlocal/ask")({
  head: () => ({ meta: [{ title: "Ask HAPPY — Hyperlocal — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: Ask,
});

function Ask() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const ask = useMutation({
    mutationFn: () => hlAskHappy({ data: { question: q, city: city || undefined, pincode: pincode || undefined } }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Ask HAPPY"
        title="Hyperlocal AI assistant"
        description="HAPPY answers using only nearby signal and cites items as [1], [2] (businesses) or [E1], [E2] (events). Recommendations are transparent — never endorsements."
      />

      <Panel className="p-4 mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_160px_140px_auto]" onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask.mutate(); }}>
          <Input placeholder="e.g. Best verified electrician near me open now?" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          <Button type="submit" disabled={ask.isPending} className="gap-2"><Sparkles className="h-4 w-4" /> Ask</Button>
        </form>
      </Panel>

      {ask.data && (
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-3">HAPPY says</div>
          <Hairline className="mb-4" />
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{ask.data.answer}</div>

          {(ask.data.businesses?.length || ask.data.events?.length) ? (
            <>
              <Hairline className="my-6" />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Cited businesses</div>
                  {ask.data.businesses?.map((b, i) => (
                    <div key={i} className="text-xs text-paper mb-1">
                      <span className="text-gold">[{i + 1}]</span> {b.name} — {b.category} {b.verified ? <Chip tone="gold" className="ml-1">Verified</Chip> : null}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">Cited events</div>
                  {ask.data.events?.map((e, i) => (
                    <div key={i} className="text-xs text-paper mb-1">
                      <span className="text-gold">[E{i + 1}]</span> {e.title} · {e.city ?? ""}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </Panel>
      )}
    </>
  );
}
