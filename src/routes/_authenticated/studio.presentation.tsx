/** /studio/presentation — Presentation Studio. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { creatorGenerateSlides, creatorListAssets } from "@/lib/creator-v1.functions";
import { Presentation as PresentIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/studio/presentation")({
  head: () => ({ meta: [{ title: "Presentation Studio — Creator OS" }, { name: "robots", content: "noindex" }] }),
  component: PresentationStudio,
});

type Slide = { title: string; bullets: string[]; narration: string };

function PresentationStudio() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [outline, setOutline] = useState("");
  const [count, setCount] = useState(10);

  const recent = useQuery({
    queryKey: ["creator", "assets", "slide_deck"],
    queryFn: () => creatorListAssets({ data: { kind: "slide_deck", limit: 12 } }),
  });

  const gen = useMutation({
    mutationFn: () => creatorGenerateSlides({ data: { title, audience: audience || undefined, outline, slide_count: count } }),
    onSuccess: () => { toast.success("Deck generated"); qc.invalidateQueries({ queryKey: ["creator"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Presentation Studio" title="AI-authored slide decks"
        description="Describe your talk. HAPPY writes slides with titles, bullets and narration ready to present." />

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel className="p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-soft-gray mb-2">New deck</div>
          <Hairline className="mb-3" />
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input className="mt-2" placeholder="Audience (optional)" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <Textarea className="mt-2" rows={6} placeholder="Outline: what should be covered?" value={outline} onChange={(e) => setOutline(e.target.value)} />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-soft-gray">Slides</span>
            <Input type="number" min={3} max={30} value={count} onChange={(e) => setCount(Number(e.target.value) || 10)} className="w-20" />
          </div>
          <Button className="mt-3 w-full" onClick={() => title.trim() && outline.trim() && gen.mutate()}
            disabled={!title.trim() || !outline.trim() || gen.isPending}>
            <PresentIcon className="h-4 w-4 mr-1" /> {gen.isPending ? "Composing…" : "Generate deck"}
          </Button>
        </Panel>

        <div className="space-y-4">
          {(recent.data ?? []).map((a) => {
            const slides = ((a.metadata as any)?.slides ?? []) as Slide[];
            return (
              <Panel key={a.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-paper font-medium">{a.name}</div>
                  <Chip tone="gold">{slides.length} slides</Chip>
                </div>
                <Hairline className="mb-3" />
                <div className="grid gap-2 md:grid-cols-2">
                  {slides.slice(0, 6).map((s, i) => (
                    <div key={i} className="rounded border border-white/5 bg-white/[0.02] p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">Slide {i + 1}</div>
                      <div className="text-sm text-paper mt-1">{s.title}</div>
                      <ul className="text-[11px] text-soft-gray mt-2 list-disc pl-4 space-y-0.5">
                        {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                {slides.length > 6 && (
                  <div className="text-[11px] text-soft-gray mt-2">+ {slides.length - 6} more slides</div>
                )}
              </Panel>
            );
          })}
          {(recent.data ?? []).length === 0 && (
            <Panel className="p-6 text-center text-xs text-soft-gray">No decks yet.</Panel>
          )}
        </div>
      </div>
    </>
  );
}
