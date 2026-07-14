/** /education/flashcards — SM-2 review + create. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, StatCard, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { eduListFlashcards, eduSaveFlashcard, eduReviewFlashcard } from "@/lib/education-v1.functions";
import { Layers, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Flashcards,
});

type Card = { id: string; deck: string | null; front: string; back: string; ease: number; interval_days: number; reps: number; next_review_at: string };

function Flashcards() {
  const [reveal, setReveal] = useState(false);
  const [idx, setIdx] = useState(0);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [deck, setDeck] = useState("");
  const qc = useQueryClient();

  const due = useQuery({ queryKey: ["edu", "cards", "due"], queryFn: () => eduListFlashcards({ data: { due_only: true, limit: 200 } }) });
  const all = useQuery({ queryKey: ["edu", "cards", "all"], queryFn: () => eduListFlashcards({ data: {} }) });

  const create = useMutation({
    mutationFn: () => eduSaveFlashcard({ data: { front, back, deck: deck || undefined } }),
    onSuccess: () => { setFront(""); setBack(""); toast.success("Card added");
      qc.invalidateQueries({ queryKey: ["edu", "cards", "due"] });
      qc.invalidateQueries({ queryKey: ["edu", "cards", "all"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (q: number) => eduReviewFlashcard({ data: { id: cards[idx]!.id, quality: q } }),
    onSuccess: () => {
      setReveal(false);
      setIdx((i) => i + 1);
      qc.invalidateQueries({ queryKey: ["edu", "cards", "due"] });
      qc.invalidateQueries({ queryKey: ["edu", "dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cards = ((due.data ?? []) as unknown as Card[]);
  const total = ((all.data ?? []) as unknown as Card[]).length;
  const current = cards[idx];

  return (
    <>
      <PageHeader eyebrow="Education OS" title="Flashcards" description="Spaced repetition (SM-2) powered by HAPPY. Learn once, remember forever." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Due now" value={cards.length.toLocaleString()} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Total cards" value={total.toLocaleString()} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Reviewed today" value={idx.toLocaleString()} icon={<RotateCcw className="h-4 w-4" />} />
        <StatCard label="Session" value={current ? `${idx + 1} / ${cards.length}` : "—"} icon={<Layers className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel className="p-6 min-h-[16rem] flex flex-col">
          {current ? (
            <>
              <div className="flex items-center gap-2">
                <Chip tone="info">{current.deck ?? "default"}</Chip>
                <span className="text-[11px] text-soft-gray">ease {current.ease.toFixed(2)} · int {current.interval_days}d</span>
              </div>
              <Hairline className="my-4" />
              <div className="flex-1 grid place-items-center text-center px-3">
                <div className="text-lg text-paper">{current.front}</div>
              </div>
              {reveal && (
                <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-paper whitespace-pre-wrap">
                  {current.back}
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {!reveal
                  ? <Button onClick={() => setReveal(true)}>Show answer</Button>
                  : ["Again 0", "Hard 2", "Good 3", "Easy 4", "Perfect 5"].map((label, i) => {
                      const quality = [0, 2, 3, 4, 5][i]!;
                      return <Button key={label} variant={quality >= 3 ? "default" : "ghost"} onClick={() => review.mutate(quality)}>{label}</Button>;
                    })}
              </div>
            </>
          ) : (
            <div className="grid place-items-center flex-1 text-sm text-soft-gray">
              {cards.length === 0 && total === 0 ? "No cards yet — create one on the right." : "All caught up. Great work — come back tomorrow."}
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">New card</h2>
          <Hairline className="my-4" />
          <Input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="Deck (optional)" />
          <Textarea rows={2} className="mt-2" value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front (question / prompt)" />
          <Textarea rows={4} className="mt-2" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back (answer / explanation)" />
          <Button className="mt-3 w-full" onClick={() => create.mutate()} disabled={!front.trim() || !back.trim() || create.isPending}>
            {create.isPending ? "Adding…" : "Add card"}
          </Button>
        </Panel>
      </div>
    </>
  );
}
