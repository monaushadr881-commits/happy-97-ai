/** /digital-human — Conversation with HAPPY (modes as capabilities). */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar, type AvatarExpression } from "@/components/digital-human/HappyAvatar";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { dhSpeak, DH_MODES, type DhMode } from "@/lib/digital-human-v1.functions";
import { Send, StopCircle, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/digital-human/")({
  head: () => ({ meta: [{ title: "HAPPY — Digital Human" }, { name: "robots", content: "noindex" }] }),
  component: DhConversation,
});

const MODE_LABEL: Record<DhMode, string> = {
  assistant: "Assistant", teacher: "Teacher", professor: "Professor", mentor: "Mentor", tutor: "Tutor",
  business: "Business", coach: "Coach", coding: "Coding", language: "Language", culture: "Culture",
  research: "Research", creator: "Creator", enterprise: "Enterprise", founder: "Founder",
  presentation: "Presentation", public_speaker: "Public Speaker", interview: "Interview", support: "Support",
};

type Turn = { role: "user" | "assistant" | "system"; content: string; at: string };

function DhConversation() {
  const { prefs, updatePrefs, activity, setActivity, expression, setExpression } = useDigitalHuman();
  const { speak, stop } = useHappySpeech();
  const [mode, setMode] = useState<DhMode>("assistant");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);

  const speakMut = useMutation({
    mutationFn: () => dhSpeak({ data: { mode, surface: "conversation", session_id: sessionId, message } }),
    onMutate: () => { setExpression("thinking"); setActivity("listening"); },
    onSuccess: async (res) => {
      setSessionId(res.session_id);
      setTranscript(res.transcript as Turn[]);
      setMessage("");
      setExpression(res.expression as AvatarExpression);
      if (!prefs.mute_audio) {
        setActivity("speaking");
        await speak(res.answer, {
          voice: prefs.voice,
          speed: prefs.speed,
          onEnd: () => { setActivity("idle"); setExpression("neutral"); },
        });
      } else {
        setActivity("idle");
      }
    },
    onError: (e: Error) => { toast.error(e.message); setActivity("idle"); setExpression("neutral"); },
  });

  const handleStop = () => { stop(); setActivity("idle"); setExpression("neutral"); };

  return (
    <>
      <PageHeader
        eyebrow="Digital Human OS"
        title="HAPPY"
        description="One digital human, many capabilities. HAPPY speaks, listens and adapts — every mode is a facet of the same identity."
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Panel className="p-6 flex flex-col items-center">
            <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={220} />
            <div className="mt-4 flex items-center gap-2">
              <Chip tone="gold">HAPPY · {MODE_LABEL[mode]}</Chip>
              <Chip tone={activity === "speaking" ? "success" : "neutral"}>{activity}</Chip>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => updatePrefs({ mute_audio: !prefs.mute_audio })}>
                {prefs.mute_audio ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                {prefs.mute_audio ? "Muted" : "Voice on"}
              </Button>
              {activity === "speaking" && (
                <Button size="sm" variant="outline" onClick={handleStop}>
                  <StopCircle className="h-4 w-4 mr-1" /> Stop
                </Button>
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-soft-gray mb-2">HAPPY Modes</div>
            <div className="flex flex-wrap gap-1.5">
              {DH_MODES.map((k) => (
                <button key={k} type="button" onClick={() => setMode(k)}
                  className={`rounded px-2 py-1 text-[10px] uppercase tracking-[0.14em] border ${
                    mode === k ? "bg-gold/15 border-gold/40 text-gold" : "border-white/10 text-soft-gray hover:text-paper"
                  }`}
                >{MODE_LABEL[k]}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-soft-gray">
              Modes are capabilities of HAPPY, not different characters.
            </p>
          </Panel>
        </div>

        <Panel className={`p-5 flex flex-col ${prefs.high_contrast ? "ring-1 ring-gold/40" : ""}`}>
          <div className={`flex-1 min-h-[22rem] space-y-3 overflow-y-auto pr-1 ${prefs.large_text ? "text-base" : "text-sm"}`}>
            {transcript.length === 0 && (
              <div className="text-xs text-soft-gray">
                Speak to HAPPY. Voice is streamed; captions appear here.
              </div>
            )}
            {transcript.map((t, i) => (
              <div key={i} className={t.role === "user" ? "text-right" : ""}>
                <div className={`inline-block max-w-full rounded-md px-3 py-2 ${
                  t.role === "user" ? "bg-gold/10 text-paper" : "bg-white/[0.03] text-paper"
                }`}>
                  {t.role === "assistant"
                    ? (prefs.captions ? <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{t.content}</ReactMarkdown></div> : <span className="text-soft-gray italic">(captions off)</span>)
                    : <span>{t.content}</span>}
                </div>
              </div>
            ))}
          </div>
          <Hairline className="my-4" />
          <div className="flex gap-2">
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something to HAPPY…"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && message.trim()) { e.preventDefault(); speakMut.mutate(); } }}
            />
            <Button onClick={() => message.trim() && speakMut.mutate()} disabled={speakMut.isPending || !message.trim()}>
              <Send className="h-4 w-4 mr-1" /> {speakMut.isPending ? "Thinking…" : "Send"}
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
