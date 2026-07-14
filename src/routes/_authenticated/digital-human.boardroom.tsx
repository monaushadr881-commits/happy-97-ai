/** /digital-human/boardroom — HAPPY as Business Consultant. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar } from "@/components/digital-human/HappyAvatar";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { dhSpeak, type DhMode } from "@/lib/digital-human-v1.functions";
import { Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/digital-human/boardroom")({
  head: () => ({ meta: [{ title: "Boardroom — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: Boardroom,
});

const ROLES: Array<[DhMode, string]> = [
  ["business", "Consultant"], ["founder", "Founder Assistant"],
  ["enterprise", "Enterprise Assistant"], ["research", "Research"],
];

function Boardroom() {
  const { prefs, expression, activity, setActivity, setExpression } = useDigitalHuman();
  const { speak } = useHappySpeech();
  const [role, setRole] = useState<DhMode>("business");
  const [prompt, setPrompt] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const ask = useMutation({
    mutationFn: () => dhSpeak({ data: { mode: role, surface: "boardroom", session_id: sessionId, message: prompt } }),
    onMutate: () => { setActivity("listening"); setExpression("thinking"); },
    onSuccess: async (r) => {
      setSessionId(r.session_id); setAnswer(r.answer); setExpression("explain");
      if (!prefs.mute_audio) {
        setActivity("speaking");
        await speak(r.answer, { voice: prefs.voice, speed: prefs.speed, onEnd: () => setActivity("idle") });
      } else setActivity("idle");
    },
    onError: (e: Error) => { toast.error(e.message); setActivity("idle"); },
  });

  return (
    <>
      <PageHeader eyebrow="Digital Human OS" title="HAPPY Boardroom"
        description="Executive briefings, strategy, and analytics narration — always HAPPY, always aligned to your business context." />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Panel className="p-5 flex flex-col items-center">
          <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={200} />
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {ROLES.map(([k, l]) => (
              <button key={k} onClick={() => setRole(k)} type="button"
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-[0.14em] border ${role === k ? "bg-gold/15 border-gold/40 text-gold" : "border-white/10 text-soft-gray hover:text-paper"}`}>
                {l}
              </button>
            ))}
          </div>
          <Chip tone="gold" className="mt-3">HAPPY · {ROLES.find(([k]) => k === role)?.[1]}</Chip>
        </Panel>
        <Panel className="p-4">
          <div className="flex gap-2">
            <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste a KPI, meeting agenda, or ask for a strategy read-out…" />
            <Button onClick={() => prompt.trim() && ask.mutate()} disabled={ask.isPending || !prompt.trim()}>
              <Send className="h-4 w-4 mr-1" /> {ask.isPending ? "Analyzing…" : "Brief me"}
            </Button>
          </div>
          {answer && prefs.captions && (
            <>
              <Hairline className="my-3" />
              <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{answer}</ReactMarkdown></div>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
