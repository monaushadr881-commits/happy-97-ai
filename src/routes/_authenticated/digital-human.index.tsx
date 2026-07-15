/** /digital-human — Real-Time Human Conversation Engine (RT-HCE). */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HappyAvatar, type AvatarExpression } from "@/components/digital-human/HappyAvatar";
import { useDigitalHuman } from "@/components/digital-human/DigitalHumanContext";
import { useHappySpeech } from "@/components/digital-human/useHappySpeech";
import { useSpeechSignal, useMicSignal } from "@/components/digital-human/audio-bus";
import { useVoiceInput } from "@/components/digital-human/useVoiceInput";
import {
  chunkForSpeech, classifyIntent, estimateSpeechMs, expressionFor,
  maybeAcknowledgement, maybeBackchannel, PACING, pausable,
  timingProfileFor, voiceProfileFor, type ConvoState,
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
type ChunkTiming = { startedAt: number; durationMs: number };

const STATE_LABEL: Record<ConvoState, string> = {
  idle: "Ready", listening: "Listening", thinking: "Thinking",
  speaking: "Speaking", paused: "Paused", interrupted: "Interrupted", finished: "Finished",
};

function DhConversation() {
  const { prefs, updatePrefs, activity, setActivity, expression, setExpression } = useDigitalHuman();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { speak, stop } = useHappySpeech();
  const speechSig = useSpeechSignal();
  const [mode, setMode] = useState<DhMode>("assistant");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [convoState, setConvoState] = useState<ConvoState>("idle");
  const [activeChunk, setActiveChunk] = useState<{ turn: number; index: number } | null>(null);
  const [chunkTiming, setChunkTiming] = useState<ChunkTiming | null>(null);
  const [handsFree, setHandsFree] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(prefs.speed ?? 1);
  const [interimHeard, setInterimHeard] = useState<string>("");
  const lastAckRef = useRef<string | undefined>(undefined);
  const lastBackchannelRef = useRef<string | undefined>(undefined);
  const turnAbortRef = useRef<AbortController | null>(null);
  const lastAnswerRef = useRef<string>("");
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const profile = useMemo(() => voiceProfileFor(mode), [mode]);
  const effectiveSpeed = useMemo(
    () => Math.max(0.5, Math.min(1.5, voiceSpeed * profile.speed)),
    [voiceSpeed, profile.speed],
  );

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
    setActiveChunk(null); setChunkTiming(null);
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

  // Greeting engine — first visit of the session only. Eye contact +
  // smile + a short spoken greeting. Skipped when muted or reduced-motion.
  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    if (prefs.mute_audio || prefs.reduced_motion) return;
    const t = setTimeout(() => {
      setExpression("smile"); setActivity("speaking"); setConvoState("speaking");
      speak("Hi, I'm HAPPY.", { voice: prefs.voice, speed: effectiveSpeed })
        .catch(() => {})
        .finally(() => {
          setActivity("idle"); setExpression("neutral"); setConvoState("idle");
        });
    }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (handsFree) { voice.start().catch((e: Error) => { toast.error(e.message); setHandsFree(false); }); }
    else { voice.stop(); setInterimHeard(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree]);

  // Push-to-talk: hold Space outside typing targets.
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

  // Auto-scroll transcript to the active caption line.
  useEffect(() => {
    if (!activeChunk) return;
    const el = transcriptRef.current;
    if (!el) return;
    // Smooth scroll to bottom-most active bubble.
    el.scrollTo({ top: el.scrollHeight, behavior: prefs.reduced_motion ? "auto" : "smooth" });
  }, [activeChunk, prefs.reduced_motion]);

  const speakChunks = async (text: string, abort: AbortController, turnIdx: number) => {
    if (prefs.mute_audio) return;
    setActivity("speaking");
    setConvoState("speaking");
    const chunks = chunkForSpeech(text);
    const pausePerSentence = Math.round(PACING.sentencePauseMs * profile.sentencePauseScale);
    for (let i = 0; i < chunks.length; i++) {
      if (abort.signal.aborted) return;
      const chunk = chunks[i];
      if (chunk === "\n\n") {
        await pausable(Math.round(PACING.paragraphPauseMs * profile.sentencePauseScale), abort.signal);
        continue;
      }
      const durationMs = estimateSpeechMs(chunk, effectiveSpeed);
      setActiveChunk({ turn: turnIdx, index: i });
      setChunkTiming({ startedAt: performance.now(), durationMs });
      await speak(chunk, { voice: prefs.voice, speed: effectiveSpeed });
      await pausable(Math.min(120, durationMs * 0.05), abort.signal);
      await pausable(pausePerSentence, abort.signal);
    }
  };

  const runTurn = async (userMessage: string) => {
    const abort = new AbortController();
    turnAbortRef.current = abort;
    const intent = classifyIntent(userMessage);
    const preSmile = intent === "greeting" || intent === "congrats" || intent === "farewell";

    setConvoState("listening"); setActivity("listening");
    setExpression(preSmile ? "smile" : "listen");
    const { listenMs } = timingProfileFor(intent, userMessage);
    await pausable(listenMs, abort.signal);
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

    // Apply HAPPY tool client-actions (navigate, invalidate, toast).
    type ClientAction =
      | { type: "navigate"; to: string; label?: string }
      | { type: "invalidate"; keys: string[]; label?: string }
      | { type: "toast"; kind: "success" | "info" | "warning" | "error"; message: string };
    const actions = ((res as { client_actions?: ClientAction[] }).client_actions ?? []);
    for (const act of actions) {
      if (act.type === "invalidate") {
        for (const k of act.keys) qc.invalidateQueries({ queryKey: [k] });
      } else if (act.type === "toast") {
        toast[act.kind === "error" ? "error" : act.kind === "warning" ? "warning" : act.kind === "success" ? "success" : "info"](act.message);
      }
    }
    // Navigate after speaking begins — schedule at end so it doesn't cut speech mid-sentence.
    const navAction = actions.find((a): a is Extract<ClientAction, { type: "navigate" }> => a.type === "navigate");

    const { thinkMs } = timingProfileFor(intent, res.answer);

    const back = !prefs.mute_audio && intent !== "greeting" && intent !== "short"
      ? maybeBackchannel(lastBackchannelRef.current) : null;
    if (back) {
      lastBackchannelRef.current = back;
      speak(back, { voice: prefs.voice, speed: effectiveSpeed }).catch(() => {});
    }
    await pausable(thinkMs, abort.signal);
    if (abort.signal.aborted) return;

    // Voice-profile ack cadence — identity constant, delivery adapts.
    const ack = Math.random() < profile.ackChance ? maybeAcknowledgement(lastAckRef.current) : null;
    if (ack) lastAckRef.current = ack;
    const framed = ack ? `${ack} ${res.answer}` : res.answer;
    lastAnswerRef.current = framed;
    const now = new Date().toISOString();
    let turnIdx = 0;
    setTranscript((t) => { turnIdx = t.length; return [...t, { role: "assistant", content: framed, at: now }]; });
    setExpression(expressionFor(intent, (res.expression as AvatarExpression) ?? profile.expression));
    await speakChunks(framed, abort, turnIdx);
    if (!abort.signal.aborted) {
      setActiveChunk(null); setChunkTiming(null);
      setActivity("idle"); setExpression("neutral");
      setConvoState("finished");
      setTimeout(() => setConvoState((s) => (s === "finished" ? "idle" : s)), 1400);
      if (navAction) {
        // Give speech ~200ms of settle time so the final word isn't clipped by route change.
        setTimeout(() => { navigate({ to: navAction.to }); }, 250);
      }
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
    setActivity("idle"); setExpression("neutral");
    setActiveChunk(null); setChunkTiming(null);
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
      setActiveChunk(null); setChunkTiming(null); setActivity("idle"); setExpression("neutral"); setConvoState("idle");
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

  return (
    <>
      <PageHeader
        eyebrow="Digital Human OS"
        title="HAPPY"
        description="Real-time human conversation. HAPPY listens, thinks and speaks — with natural pacing, word-level captions and instant interruption."
      />

      {/* Screen-reader status announcer for conversation state transitions. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        HAPPY is {STATE_LABEL[convoState].toLowerCase()}.
      </div>


      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Panel className="p-6 flex flex-col items-center">
            <HappyAvatar expression={expression} activity={activity} reducedMotion={prefs.reduced_motion} size={220} amplitude={speechSig.rms} centroid={speechSig.centroid} />
            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
              <Chip tone="gold">HAPPY · {MODE_LABEL[mode]}</Chip>
              <Chip tone={stateChipTone}>{STATE_LABEL[convoState]}</Chip>
              <Chip>{profile.label} delivery</Chip>
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
                Voice speed · {voiceSpeed.toFixed(2)}× · effective {effectiveSpeed.toFixed(2)}×
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
                  aria-pressed={mode === k}
                  className={`rounded px-2 py-1 text-[10px] uppercase tracking-[0.14em] border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    mode === k ? "bg-gold/15 border-gold/40 text-gold" : "border-white/10 text-soft-gray hover:text-paper hover:border-white/25"
                  }`}
                >{MODE_LABEL[k]}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-soft-gray">
              Modes are capabilities of HAPPY, not different characters. Delivery auto-adapts; identity stays constant.
            </p>
          </Panel>
        </div>

        <Panel className={`p-5 flex flex-col ${prefs.high_contrast ? "ring-1 ring-gold/40" : ""}`}>
          <div ref={transcriptRef}
            className={`flex-1 min-h-[22rem] space-y-3 overflow-y-auto pr-1 scroll-smooth ${prefs.large_text ? "text-base" : "text-sm"}`}
            aria-live="polite" aria-relevant="additions text">
            {transcript.length === 0 && (
              <div className="text-xs text-soft-gray">
                Speak to HAPPY. Turn on hands-free or hold Space to talk. Captions appear word-by-word.
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
                              ? <CaptionRender text={t.content} activeChunkIdx={activeIdx} timing={chunkTiming} reducedMotion={prefs.reduced_motion} />
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
          <LiveWaveform state={convoState} reducedMotion={prefs.reduced_motion} />
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
          {activeChunk && (
            <p className="mt-2 text-[10px] text-soft-gray text-right" aria-live="off">
              Speaking segment {activeChunk.index + 1}
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}

/**
 * Word-by-word caption. Highlights the current word based on the chunk's
 * total estimated duration, progressing on a single RAF loop. Auto-centers
 * the active word within the caption bubble. No layout shift, GPU-only.
 */
const CaptionRender = memo(function CaptionRender({
  text, activeChunkIdx, timing, reducedMotion,
}: {
  text: string;
  activeChunkIdx: number;
  timing: ChunkTiming | null;
  reducedMotion?: boolean;
}) {
  const chunks = useMemo(() => chunkForSpeech(text), [text]);
  // Split the active chunk into word tokens (with trailing whitespace preserved).
  const activeTokens = useMemo(() => {
    const c = chunks[activeChunkIdx];
    if (!c || c === "\n\n") return [] as string[];
    return c.match(/\S+\s*/g) ?? [c];
  }, [chunks, activeChunkIdx]);
  const [wordIdx, setWordIdx] = useState(0);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setWordIdx(0);
    if (!timing || !activeTokens.length) return;
    if (reducedMotion) { setWordIdx(activeTokens.length); return; }
    let raf = 0;
    const perWord = timing.durationMs / activeTokens.length;
    const tick = () => {
      const elapsed = performance.now() - timing.startedAt;
      const idx = Math.min(activeTokens.length, Math.floor(elapsed / perWord));
      setWordIdx((prev) => (idx > prev ? idx : prev));
      if (idx < activeTokens.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timing, activeTokens.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    activeWordRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [wordIdx, reducedMotion]);

  return (
    <div className="prose prose-invert prose-sm max-w-none" lang="auto">
      {chunks.map((c, i) => {
        if (c === "\n\n") return <div key={i} className="h-2" />;
        const spoken = i < activeChunkIdx;
        const active = i === activeChunkIdx;
        if (active) {
          return (
            <span key={i} className="rounded">
              {activeTokens.map((tok, j) => {
                const wSpoken = j < wordIdx;
                const wActive = j === wordIdx;
                return (
                  <span
                    key={j}
                    ref={wActive ? activeWordRef : undefined}
                    className={
                      wActive
                        ? "bg-gold/25 text-paper rounded px-0.5 transition-colors duration-150"
                        : wSpoken
                        ? "text-paper transition-colors duration-150"
                        : "text-soft-gray/70 transition-colors duration-150"
                    }
                  >
                    {tok}
                  </span>
                );
              })}
            </span>
          );
        }
        return (
          <span key={i} className={spoken ? "text-paper" : "text-soft-gray/80"}>{c}{" "}</span>
        );
      })}
    </div>
  );
});

/** Live waveform — real audio signal from useHappySpeech's analyser while
 *  speaking. Falls back to a gentle idle shimmer when not speaking. */
function LiveWaveform({ state, reducedMotion }: { state: ConvoState; reducedMotion?: boolean }) {
  const bars = 42;
  const speech = useSpeechSignal();
  const mic = useMicSignal();
  const speaking = state === "speaking";
  const listening = state === "listening";
  const thinking = state === "thinking";
  const active = speaking || listening || thinking;

  // During speaking → TTS analyser. During listening → mic analyser.
  // During thinking → gentle idle shimmer. No fake data.
  const liveAmp = speaking ? speech.rms : listening ? mic.rms : 0;
  const ampRef = useRef(liveAmp);
  ampRef.current = liveAmp;
  const rafRef = useRef<number | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reducedMotion || !active) return;
    const loop = () => {
      setTick((t) => (t + 1) & 0xffff);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [reducedMotion, active]);

  return (
    <div className="mt-3 flex items-end justify-center gap-[3px] h-8" aria-hidden data-tick={tick}>
      {Array.from({ length: bars }).map((_, i) => {
        // Stable per-bar phase — different bars react slightly differently.
        const phase = ((i * 7) % 11) / 11;
        let h: number;
        if (speaking) {
          const wobble = 0.6 + 0.4 * Math.sin((tick / 6) + phase * Math.PI * 2);
          h = 18 + Math.min(1, ampRef.current) * 78 * wobble;
        } else if (listening) {
          // Real mic RMS. Falls to a low idle shimmer when the user is silent.
          const amp = Math.min(1, ampRef.current);
          const shimmer = 0.5 + 0.5 * Math.sin((tick / 12) + phase * Math.PI * 2);
          h = 14 + amp * 70 * (0.6 + 0.4 * shimmer) + (1 - amp) * 12 * shimmer;
        } else if (thinking) {
          h = 18 + 18 * (0.5 + 0.5 * Math.sin((tick / 20) + phase * Math.PI * 2));
        } else {
          h = 10;
        }
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-gold-deep to-gold"
            style={{
              height: `${Math.max(6, Math.min(100, h))}%`,
              opacity: active ? 0.85 : 0.3,
              transition: "height 40ms linear",
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
}
