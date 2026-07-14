/** /education/tutor — HAPPY AI Teacher (modes + variants). */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { aiTutorAsk, aiTutorSessions } from "@/lib/education-v1.functions";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/tutor")({
  head: () => ({ meta: [{ title: "AI Teacher — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Tutor,
});

const MODES = [
  ["teacher", "Teacher"], ["professor", "Professor"], ["mentor", "Mentor"], ["tutor", "Tutor"],
  ["coach", "Career Coach"], ["coding", "Coding Mentor"], ["language", "Language Trainer"],
  ["business", "Business Coach"], ["culture", "Culture Guide"],
] as const;

const VARIANTS = [
  ["explain", "Explain"], ["simpler", "Explain simpler"], ["advanced", "Go advanced"],
  ["practice", "Practice questions"], ["flashcards", "Flashcards"], ["summary", "Summary"],
] as const;

type Mode = typeof MODES[number][0];
type Variant = typeof VARIANTS[number][0];
type Turn = { role: "user" | "assistant" | "system"; content: string; at: string };
type Session = { id: string; mode: string; topic: string | null; updated_at: string };

function Tutor() {
  const [mode, setMode] = useState<Mode>("teacher");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<Variant>("explain");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const qc = useQueryClient();

  const sessions = useQuery({ queryKey: ["edu", "tutor-sessions"], queryFn: () => aiTutorSessions() });

  const ask = useMutation({
    mutationFn: () => aiTutorAsk({ data: { mode, topic: topic || undefined, session_id: sessionId, message, variant } }),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setTranscript(data.transcript as Turn[]);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["edu", "tutor-sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Education OS"
        title="HAPPY AI Teacher"
        description="One AI, nine teaching modes. Ask anything — HAPPY teaches until mastered."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Panel className="p-5 flex flex-col">
          <div className="flex flex-wrap gap-2">
            {MODES.map(([k, label]) => (
              <button key={k} type="button" onClick={() => setMode(k)}
                className={`rounded-md px-3 py-1 text-[11px] uppercase tracking-[0.15em] border ${mode === k ? "bg-gold/15 border-gold/40 text-gold" : "border-white/10 text-soft-gray hover:text-paper"}`}>
                {label}
              </button>
            ))}
          </div>
          <input
            value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Optional topic (e.g. Photosynthesis, React Server Components, Ottoman history)"
            className="mt-3 h-9 w-full rounded-md bg-white/[0.03] border border-white/10 px-3 text-sm text-paper placeholder:text-soft-gray"
          />

          <Hairline className="my-4" />

          <div className="flex-1 min-h-[16rem] space-y-3 overflow-y-auto pr-1">
            {transcript.length === 0 && (
              <div className="text-xs text-soft-gray">
                <Sparkles className="inline h-3.5 w-3.5 text-gold mr-1" />
                Start by asking a question. HAPPY will teach in <span className="text-paper">{mode}</span> mode.
              </div>
            )}
            {transcript.map((t, i) => (
              <div key={i} className={t.role === "user" ? "text-right" : ""}>
                <div className={`inline-block max-w-full rounded-md px-3 py-2 text-sm ${
                  t.role === "user" ? "bg-gold/10 text-paper" : "bg-white/[0.03] text-paper"
                }`}>
                  {t.role === "assistant"
                    ? <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{t.content}</ReactMarkdown></div>
                    : <span>{t.content}</span>}
                </div>
              </div>
            ))}
          </div>

          <Hairline className="my-4" />
          <div className="flex flex-wrap gap-1 mb-2">
            {VARIANTS.map(([k, label]) => (
              <button key={k} type="button" onClick={() => setVariant(k)}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-[0.15em] border ${variant === k ? "bg-white/10 border-white/20 text-paper" : "border-white/5 text-soft-gray"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you want HAPPY to teach you?" />
            <Button onClick={() => message.trim() && ask.mutate()} disabled={ask.isPending || !message.trim()}>
              <Send className="h-4 w-4 mr-1" /> {ask.isPending ? "Teaching…" : "Ask"}
            </Button>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent sessions</h2>
          <Hairline className="my-4" />
          <ul className="space-y-2">
            {((sessions.data ?? []) as unknown as Session[]).map((s) => (
              <li key={s.id} className="rounded-md border border-white/5 bg-white/[0.02] p-2 text-xs">
                <div className="flex items-center justify-between">
                  <Chip tone="info">{s.mode}</Chip>
                  <span className="text-[10px] text-soft-gray">{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 text-paper line-clamp-2">{s.topic ?? "Untitled session"}</div>
              </li>
            ))}
            {!(sessions.data ?? []).length && <li className="text-xs text-soft-gray">No previous sessions.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
