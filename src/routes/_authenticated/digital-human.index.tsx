/** /digital-human — Real-Time Human Conversation Engine (RT-HCE). */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar, type AvatarExpression } from "@/components/digital-human/HappyAvatar";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { useVoiceInput } from "@/components/digital-human/useVoiceInput";
import {
  chunkForSpeech, classifyIntent, estimateSpeechMs, expressionFor,
  maybeAcknowledgement, maybeBackchannel, PACING, pausable,
  thinkingDurationFor, timingProfileFor, type ConvoState,
} from "@/components/digital-human/conversation-engine";
import { dhSpeak, DH_MODES, type DhMode } from "@/lib/digital-human-v1.functions";
import {
  Mic, MicOff, Send, StopCircle, Volume2, VolumeX, RotateCcw, Captions, CaptionsOff,
} from "lucide-react";
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

const STATE_LABEL: Record<ConvoState, string> = {
  idle: "Ready", listening: "Listening", thinking: "Thinking",
  speaking: "Speaking", paused: "Paused", interrupted: "Interrupted", finished: "Finished",
};

function DhConversation() {
  const { prefs, updatePrefs, activity, setActivity, expression, setExpression } = useDigitalHuman();
  const { speak, stop } = useHappySpeech();
  const [mode, setMode] = useState<DhMode>("assistant");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [convoState, setConvoState] = useState<ConvoState>("idle");
  const [activeChunk, setActiveChunk] = useState<{ turn: number; index: number } | null>(null);
  const [handsFree, setHandsFree] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(prefs.speed ?? 1);
  const [interimHeard, setInterimHeard] = useState<string>("");
  const lastAckRef = useRef<string | undefined>(undefined);
  const turnAbortRef = useRef<AbortController | null>(null);
  const lastAnswerRef = useRef<string>("");

  const cancelTurn = () => {
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    stop();
  };

  const onUserInterrupt = () => {
    if (convoState !== "speaking" && convoState !== "thinking") return;
    cancelTurn();
    setConvoState("interrupted");
    setActivity("listening"); setExpression("listen");
    setActiveChunk(null);
  };

  const voice = useVoiceInput({
    lang: (prefs.language ?? "en") + "-US",
    onSpeechStart: () => { if (convoState === "speaking" || convoState === "thinking") onUserInterrupt(); },
    onTranscript: (text, isFinal) => {
      if (isFinal) { setMessage((m) => (m ? `${m} ${text}` : text)); setInterimHeard(""); }
      else setInterimHeard(text);
    },
  });

  useEffect(() => () => cancelTurn(), []); // cleanup on unmount

  // Sync voice input to hands-free toggle.
  useEffect(() => {
    if (handsFree) { voice.start().catch((e: Error) => { toast.error(e.message); setHandsFree(false); }); }
    else { voice.stop(); setInterimHeard(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree]);

  // Push-to-talk: hold Space (outside textarea) to enable mic momentarily.
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isTypingTarget(e.target)) return;
      e.preventDefault();
      if (!handsFree) voice.start().catch(() => {});
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTypingTarget(e.target)) return;
      if (!handsFree) voice.stop();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [handsFree, voice]);

  const speakChunks = async (text: string, abort: AbortController, turnIdx: number) => {
    if (prefs.mute_audio) return;
    setActivity("speaking");
    setConvoState("speaking");
    const chunks = chunkForSpeech(text);
    for (let i = 0; i < chunks.length; i++) {
      if (abort.signal.aborted) return;
      const chunk = chunks[i];
      if (chunk === "\n\n") { await pausable(PACING.paragraphPauseMs, abort.signal); continue; }
      setActiveChunk({ turn: turnIdx, index: i });
      await speak(chunk, { voice: prefs.voice, speed: voiceSpeed });
      // Fallback estimate keeps caption progress even if speak resolves early.
      await pausable(Math.min(120, estimateSpeechMs(chunk, voiceSpeed) * 0.05), abort.signal);
      await pausable(PACING.sentencePauseMs, abort.signal);
    }
  };

  const runTurn = async (userMessage: string) => {
    const abort = new AbortController();
    turnAbortRef.current = abort;
    setConvoState("listening"); setActivity("listening"); setExpression("listen");
    await pausable(PACING.listenBeatMs, abort.signal);
    if (abort.signal.aborted) return;

    setConvoState("thinking"); setExpression("thinking");
    let res;
    try {
      res = await dhSpeak({ data: { mode, surface: "conversation", session_id: sessionId, message: userMessage } });
    } catch (e) {
      toast.error((e as Error).message);
      setConvoState("idle"); setActivity("idle"); setExpression("neutral");
      return;
    }
    if (abort.signal.aborted) return;
    setSessionId(res.session_id);
    await pausable(thinkingDurationFor(res.answer), abort.signal);
    if (abort.signal.aborted) return;

    const ack = maybeAcknowledgement(lastAckRef.current);
    if (ack) lastAckRef.current = ack;
    const framed = ack ? `${ack} ${res.answer}` : res.answer;
    lastAnswerRef.current = framed;
    const now = new Date().toISOString();
    let turnIdx = 0;
    setTranscript((t) => { turnIdx = t.length; return [...t, { role: "assistant", content: framed, at: now }]; });
    setExpression((res.expression as AvatarExpression) ?? "explain");
    await speakChunks(framed, abort, turnIdx);
    if (!abort.signal.aborted) {
      setActiveChunk(null);
      setActivity("idle"); setExpression("neutral");
      setConvoState("finished");
      setTimeout(() => setConvoState((s) => (s === "finished" ? "idle" : s)), 1400);
    }
  };

  const speakMut = useMutation({
    mutationFn: async () => {
      const text = message.trim();
      if (!text) return;
      const now = new Date().toISOString();
      setTranscript((t) => [...t, { role: "user", content: text, at: now }]);
      setMessage("");
      await runTurn(text);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConvoState("idle"); setActivity("idle"); setExpression("neutral");
    },
  });

  const handleStop = () => {
    cancelTurn();
    setConvoState("paused");
    setActivity("idle"); setExpression("neutral"); setActiveChunk(null);
  };

  const handleReplay = async () => {
    const last = lastAnswerRef.current;
    if (!last || prefs.mute_audio) return;
    const abort = new AbortController();
    turnAbortRef.current = abort;
    const lastAssistantIdx = (() => {
      for (let i = transcript.length - 1; i >= 0; i--) if (transcript[i].role === "assistant") return i;
      return -1;
    })();
    await speakChunks(last, abort, lastAssistantIdx);
    if (!abort.signal.aborted) {
      setActiveChunk(null); setActivity("idle"); setExpression("neutral"); setConvoState("idle");
    }
  };

  const onUserInput = (val: string) => {
    if (val.length > message.length && (convoState === "speaking" || convoState === "thinking")) {
      onUserInterrupt();
    }
    setMessage(val);
  };

  const stateChipTone = useMemo(() => {
    switch (convoState) {
      case "speaking": return "success";
      case "listening": return "gold";
      case "thinking": return "gold";
      case "interrupted": return "warning";
      case "paused": return "warning";
      default: return "neutral";
    }
  }, [convoState]) as "success" | "gold" | "warning" | "neutral";

  const activeAssistantContent = activeChunk
    ? (transcript[activeChunk.turn]?.content ?? "")
    : "";
  const activeChunks = activeAssistantContent ? chunkForSpeech(activeAssistantContent) : [];

  return (
    <>
      <PageHeader
        eyebrow="Digital Human OS"
        title="HAPPY"
        description="Real-time human conversation. HAPPY listens, thinks and speaks — with natural pacing, live captions and instant interruption."
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Panel className="p-6 flex flex-col items-center">
            <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={220} />
            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
              <Chip tone="gold">HAPPY · {MODE_LABEL[mode]}</Chip>
              <Chip tone={stateChipTone}>{STATE_LABEL[convoState]}</Chip>
            </div>
            {handsFree && (
              <div className="mt-2 text-[11px] text-gold tracking-[0.14em] uppercase" aria-live="polite">
                Hands-free · mic on
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 w-full">
              <Button size="sm" variant={handsFree ? "default" : "outline"} onClick={() => setHandsFree((v) => !v)}
                disabled={!voice.supported.vad} aria-label={handsFree ? "Turn off hands-free mic" : "Turn on hands-free mic"}>
                {handsFree ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                {handsFree ? "Hands-free" : "Mic off"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => updatePrefs({ mute_audio: !prefs.mute_audio })}
                aria-label={prefs.mute_audio ? "Unmute HAPPY" : "Mute HAPPY"}>
                {prefs.mute_audio ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                {prefs.mute_audio ? "Muted" : "Voice"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => updatePrefs({ captions: !prefs.captions })}
                aria-label={prefs.captions ? "Hide captions" : "Show captions"}>
                {prefs.captions ? <Captions className="h-4 w-4 mr-1" /> : <CaptionsOff className="h-4 w-4 mr-1" />}
                Captions
              </Button>
              <Button size="sm" variant="outline" onClick={handleReplay}
                disabled={!lastAnswerRef.current || convoState === "speaking" || prefs.mute_audio}
                aria-label="Replay last response">
                <RotateCcw className="h-4 w-4 mr-1" /> Replay
              </Button>
              {(convoState === "speaking" || convoState === "thinking" || convoState === "listening") && (
                <Button size="sm" variant="outline" onClick={handleStop} className="col-span-2" aria-label="Interrupt HAPPY">
                  <StopCircle className="h-4 w-4 mr-1" /> Interrupt
                </Button>
              )}
            </div>
            <div className="mt-4 w-full">
              <label htmlFor="dh-speed" className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">
                Voice speed · {voiceSpeed.toFixed(2)}×
              </label>
              <input id="dh-speed" type="range" min={0.75} max={1.5} step={0.05}
                value={voiceSpeed} onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                className="w-full mt-1 accent-gold" />
            </div>
            <p className="mt-3 text-[10px] text-soft-gray text-center">
              Hold <kbd className="rounded border border-white/10 px-1">Space</kbd> for push-to-talk.
            </p>
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
          <div className={`flex-1 min-h-[22rem] space-y-3 overflow-y-auto pr-1 ${prefs.large_text ? "text-base" : "text-sm"}`}
            aria-live="polite" aria-relevant="additions text">
            {transcript.length === 0 && (
              <div className="text-xs text-soft-gray">
                Speak to HAPPY. Turn on hands-free or hold Space to talk. Captions appear here live.
              </div>
            )}
            {transcript.map((t, i) => {
              const isActive = activeChunk?.turn === i;
              const activeIdx = isActive ? activeChunk!.index : -1;
              return (
                <div key={i} className={t.role === "user" ? "text-right" : ""}>
                  <div className={`inline-block max-w-full rounded-md px-3 py-2 ${
                    t.role === "user" ? "bg-gold/10 text-paper" : "bg-white/[0.03] text-paper"
                  }`}>
                    {t.role === "assistant"
                      ? (prefs.captions
                          ? (isActive
                              ? <CaptionRender text={t.content} activeChunkIdx={activeIdx} />
                              : <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{t.content}</ReactMarkdown></div>)
                          : <span className="text-soft-gray italic">(captions off)</span>)
                      : <span>{t.content}</span>}
                  </div>
                </div>
              );
            })}
            {interimHeard && (
              <div className="text-right">
                <div className="inline-block max-w-full rounded-md px-3 py-2 bg-white/[0.02] text-soft-gray italic border border-dashed border-white/10">
                  {interimHeard}…
                </div>
              </div>
            )}
            {convoState === "thinking" && (
              <div className="text-[11px] text-soft-gray italic">HAPPY is thinking…</div>
            )}
          </div>
          <Hairline className="my-4" />
          <div className="flex gap-2 items-end">
            <Textarea rows={2} value={message} onChange={(e) => onUserInput(e.target.value)}
              placeholder="Type or speak to HAPPY…"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && message.trim()) { e.preventDefault(); speakMut.mutate(); } }}
            />
            <Button onClick={() => message.trim() && speakMut.mutate()} disabled={speakMut.isPending || !message.trim()}
              aria-label="Send message">
              <Send className="h-4 w-4 mr-1" /> {speakMut.isPending ? "…" : "Send"}
            </Button>
          </div>
          {activeChunks.length > 0 && (
            <p className="mt-2 text-[10px] text-soft-gray text-right">
              Segment {Math.min(activeChunk!.index + 1, activeChunks.length)} / {activeChunks.length}
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}

/** Render an assistant message with the currently-spoken chunk highlighted. */
function CaptionRender({ text, activeChunkIdx }: { text: string; activeChunkIdx: number }) {
  const chunks = useMemo(() => chunkForSpeech(text), [text]);
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {chunks.map((c, i) => {
        if (c === "\n\n") return <div key={i} className="h-2" />;
        const spoken = i < activeChunkIdx;
        const active = i === activeChunkIdx;
        return (
          <span key={i} className={
            active ? "bg-gold/15 text-paper rounded px-0.5"
              : spoken ? "text-paper"
              : "text-soft-gray/80"
          }>
            {c}{" "}
          </span>
        );
      })}
    </div>
  );
}
