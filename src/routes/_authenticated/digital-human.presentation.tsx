/** /digital-human/presentation — HAPPY generates and presents slide decks. */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar } from "@/components/digital-human/HappyAvatar";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { dhGeneratePresentation, dhListPresentations, dhDeletePresentation } from "@/lib/digital-human-v1.functions";
import { Presentation, ChevronLeft, ChevronRight, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/digital-human/presentation")({
  head: () => ({ meta: [{ title: "Presentation — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Presentations,
});

type Slide = { title: string; bullets: string[]; narration: string };
type Deck = { id: string; title: string; audience: string | null; status: string; updated_at: string; slides: Slide[] };

function Presentations() {
  const { prefs, activity, setActivity, expression, setExpression, setPosture } = useDigitalHuman();
  const { speak, stop } = useHappySpeech();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [outline, setOutline] = useState("");
  const [current, setCurrent] = useState<Deck | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  const decks = useQuery({ queryKey: ["dh", "presentations"], queryFn: () => dhListPresentations() });

  const gen = useMutation({
    mutationFn: () => dhGeneratePresentation({ data: { title, audience: audience || undefined, outline } }),
    onSuccess: (deck) => {
      qc.invalidateQueries({ queryKey: ["dh", "presentations"] });
      setCurrent(deck as unknown as Deck); setSlideIdx(0);
      setTitle(""); setAudience(""); setOutline("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => dhDeletePresentation({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dh", "presentations"] }),
  });

  const slide = current?.slides?.[slideIdx];
  // Presentation posture: straighter, calmer, longer holds. Reset on unmount.
  useEffect(() => {
    setPosture("presentation");
    setExpression("smile");
    return () => { stop(); setPosture("normal"); setExpression("neutral"); setActivity("idle"); };
  }, [setPosture, setExpression, setActivity, stop]);

  const present = async () => {
    if (!slide) return;
    setExpression("explain"); setActivity("speaking");
    await speak(slide.narration, {
      voice: prefs.voice,
      speed: Math.min(1.5, (prefs.speed ?? 1) * 1.05), // executive delivery
      onEnd: () => { setActivity("idle"); setExpression("smile"); },
    });
  };


  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="HAPPY Presentations"
        description="Generate a deck from an outline, then let HAPPY narrate every slide." />
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray mb-2">New deck</div>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2" />
            <Input placeholder="Audience (optional)" value={audience} onChange={(e) => setAudience(e.target.value)} className="mb-2" />
            <Textarea rows={4} placeholder="Outline: key points HAPPY should cover" value={outline} onChange={(e) => setOutline(e.target.value)} />
            <Button className="mt-2 w-full" onClick={() => title && outline && gen.mutate()} disabled={gen.isPending || !title || !outline}>
              <Presentation className="h-4 w-4 mr-1" /> {gen.isPending ? "Generating…" : "Generate deck"}
            </Button>
          </Panel>
          <Panel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray mb-2">Saved decks</div>
            <ul className="space-y-2">
              {((decks.data ?? []) as Deck[]).map((d) => (
                <li key={d.id} className="rounded-md border border-white/5 bg-white/[0.02] p-2 text-xs flex items-center gap-2">
                  <button onClick={() => { setCurrent(d); setSlideIdx(0); }} className="flex-1 text-left">
                    <div className="text-paper truncate">{d.title}</div>
                    <div className="text-[10px] text-soft-gray">{d.slides?.length ?? 0} slides</div>
                  </button>
                  <button onClick={() => del.mutate(d.id)} className="text-soft-gray hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {!(decks.data ?? []).length && <li className="text-xs text-soft-gray">No decks yet.</li>}
            </ul>
          </Panel>
        </div>
        <Panel className="p-6">
          {!current || !slide ? (
            <div className="min-h-[24rem] grid place-items-center text-sm text-soft-gray">
              Select or generate a deck to begin.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Chip tone="gold">HAPPY · Presenter</Chip>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-soft-gray">{current.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-soft-gray tabular-nums">{slideIdx + 1} / {current.slides.length}</span>
                  <Button size="sm" variant="outline" onClick={() => setSlideIdx((i) => Math.min(current.slides.length - 1, i + 1))} disabled={slideIdx >= current.slides.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={present} disabled={activity === "speaking"}>
                    <Play className="h-4 w-4 mr-1" /> Present slide
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[10rem_1fr] items-start">
                <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={160} posture="presentation" />
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 min-h-[16rem]">
                  <h2 className="text-2xl font-medium text-paper">{slide.title}</h2>
                  <Hairline className="my-4" />
                  <ul className="space-y-2 text-sm text-paper list-disc pl-5">
                    {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  {prefs.captions && (
                    <>
                      <Hairline className="my-4" />
                      <p className="text-xs text-soft-gray italic">Narration: {slide.narration}</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
