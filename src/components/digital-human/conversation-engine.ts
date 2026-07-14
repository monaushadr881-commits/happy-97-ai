/**
 * HAPPY Conversational Behavior Engine (frontend-only).
 *
 * Adds human pacing to HAPPY's replies: a short listening beat, a thinking
 * beat, then paced speaking. Chunks answers into sentence groups so voice
 * playback breathes at punctuation instead of dumping the whole answer.
 * Provides varied acknowledgement openers and turn-taking helpers.
 *
 * No backend / API changes. Pure client behavior layer.
 */

/** Varied opener acknowledgements — never used on every reply. */
const ACKS = [
  "I understand.", "That's a good question.", "Let's work through it.",
  "Here's what I recommend.", "I can help with that.", "Got it.",
  "Let me think through this with you.", "Sure — here's how I'd approach it.",
  "Great — let's unpack that.", "Absolutely.", "Fair point.", "Makes sense.",
  "Okay, here's my take.", "Interesting — let me build on that.",
  "Happy to walk you through it.", "Good — here's the shape of it.",
  "Let me lay it out.", "Right, here's the picture.", "Noted — here's where I'd start.",
  "Let's break it down.", "Consider this angle.", "Here's the essence.",
];

/** Track recent openers to avoid repeats across turns. */
const recentAcks: string[] = [];
export function maybeAcknowledgement(_lastUsed?: string): string | null {
  if (Math.random() > 0.35) return null;
  const pool = ACKS.filter((a) => !recentAcks.includes(a));
  const pick = (pool.length ? pool : ACKS)[Math.floor(Math.random() * (pool.length || ACKS.length))];
  recentAcks.push(pick);
  if (recentAcks.length > 6) recentAcks.shift();
  return pick;
}

/** Short listener backchannels HAPPY may murmur before answering. */
const BACKCHANNELS = ["Hmm.", "I see.", "Right.", "Understood.", "Okay.", "Mm-hm.", "Alright.", "Noted.", "Got it."];
const recentBack: string[] = [];
export function maybeBackchannel(_lastUsed?: string): string | null {
  if (Math.random() > 0.25) return null;
  const pool = BACKCHANNELS.filter((b) => !recentBack.includes(b));
  const pick = (pool.length ? pool : BACKCHANNELS)[Math.floor(Math.random() * (pool.length || BACKCHANNELS.length))];
  recentBack.push(pick);
  if (recentBack.length > 4) recentBack.shift();
  return pick;
}

/** Coarse intent classification from the user's message. */
export type Intent =
  | "greeting" | "farewell" | "short" | "math" | "code" | "creative"
  | "teaching" | "warning" | "congrats" | "complex" | "general";

export function classifyIntent(text: string): Intent {
  const t = text.trim().toLowerCase();
  if (!t) return "general";
  if (/^(hi|hey|hello|good (morning|evening|afternoon)|namaste)\b/.test(t)) return "greeting";
  if (/\b(bye|goodbye|see you|talk later)\b/.test(t)) return "farewell";
  if (/[0-9]|\bcalculate|\bsolve|\bequation|\bderivative|\bintegral|\bmatrix|\bprobability\b/.test(t)) return "math";
  if (/\bcode|function|typescript|python|bug|error|stack trace|regex|api\b/.test(t)) return "code";
  if (/\bwrite|draft|poem|story|essay|caption|slogan|tagline\b/.test(t)) return "creative";
  if (/\bexplain|teach|what is|how does|why does|walk me through\b/.test(t)) return "teaching";
  if (/\brisk|warning|careful|danger|urgent|critical\b/.test(t)) return "warning";
  if (/\bthank|congrats|great job|well done|amazing|awesome\b/.test(t)) return "congrats";
  if (t.length > 220 || t.split(/\s+/).length > 40) return "complex";
  if (t.length < 20) return "short";
  return "general";
}

/** Timing constants — feel human, never sluggish. */
export const PACING = {
  listenBeatMs: 350,        // small listening pause before HAPPY reacts
  thinkMinMs: 650,          // minimum thinking time
  thinkPerCharMs: 4,        // scales gently with answer length
  thinkMaxMs: 2200,         // cap the wait
  sentencePauseMs: 220,     // pause between sentence groups
  paragraphPauseMs: 460,    // pause between paragraphs
  commaPauseMs: 90,         // reserved — used by chunker for future micro-pauses
};

/** Intent-shaped pacing multipliers for realistic response timing. */
export function timingProfileFor(intent: Intent, answer: string) {
  const base = PACING.thinkMinMs + Math.min(PACING.thinkMaxMs, answer.length * PACING.thinkPerCharMs);
  const mult: Record<Intent, number> = {
    greeting: 0.35, farewell: 0.4, short: 0.55, general: 1,
    teaching: 1.15, code: 1.25, math: 1.35, creative: 1.4,
    warning: 0.9, congrats: 0.6, complex: 1.5,
  };
  const jitter = 0.85 + Math.random() * 0.3;
  const thinkMs = Math.round(base * mult[intent] * jitter);
  const listenMs = intent === "greeting" || intent === "short" ? 220 : PACING.listenBeatMs;
  return { listenMs, thinkMs };
}

/** Intent → default facial expression while HAPPY speaks. */
import type { AvatarExpression } from "./HappyAvatar";
export function expressionFor(intent: Intent, fallback: AvatarExpression = "explain"): AvatarExpression {
  switch (intent) {
    case "greeting": return "smile";
    case "congrats": return "celebrate";
    case "warning":  return "concern";
    case "teaching": return "explain";
    case "creative": return "smile";
    case "farewell": return "smile";
    default: return fallback;
  }
}

/** Compute a human thinking pause based on the answer's length. */
export function thinkingDurationFor(answer: string): number {
  const base = PACING.thinkMinMs + Math.min(PACING.thinkMaxMs, answer.length * PACING.thinkPerCharMs);
  return Math.round(base * (0.85 + Math.random() * 0.3));
}


/**
 * Split an answer into speakable chunks. Prefers sentence boundaries and
 * groups 1–2 short sentences together so playback is calm but not choppy.
 */
export function chunkForSpeech(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  for (const p of paragraphs) {
    const sentences = p.match(/[^.!?]+[.!?]+(?:["')\]]+)?|\S+$/g) ?? [p];
    let buf = "";
    for (const raw of sentences) {
      const s = raw.trim();
      if (!s) continue;
      const merged = buf ? `${buf} ${s}` : s;
      if (merged.length < 140 && buf) buf = merged;
      else { if (buf) chunks.push(buf); buf = s; }
    }
    if (buf) chunks.push(buf);
    chunks.push("\n\n"); // paragraph break marker
  }
  return chunks.filter((c) => c.trim().length > 0 || c === "\n\n");
}

/** Await helper that resolves early if the caller aborts. */
export function pausable(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

/** Estimate speech duration for a chunk of text (ms). ~160 wpm baseline. */
export function estimateSpeechMs(text: string, speed = 1): number {
  const words = (text.match(/\S+/g) ?? []).length;
  const base = (words / 160) * 60_000; // 160 wpm
  return Math.max(400, base / Math.max(0.5, speed));
}

/** Streaming conversational states surfaced to the UI. */
export type ConvoState =
  | "idle" | "listening" | "thinking" | "speaking" | "paused" | "interrupted" | "finished";

/** Context-aware voice delivery profile — identity stays HAPPY, delivery adapts. */
export type VoiceProfile = {
  speed: number;                 // playback multiplier
  sentencePauseScale: number;    // scales PACING.sentencePauseMs
  ackChance: number;             // 0..1 — cadence of openers
  expression: AvatarExpression;  // default while speaking
  label: string;
};

/** Map every HAPPY mode to a delivery profile. Identity remains HAPPY. */
export function voiceProfileFor(mode: string): VoiceProfile {
  switch (mode) {
    case "business":
    case "enterprise":
    case "founder":
    case "interview":
      return { speed: 1.02, sentencePauseScale: 1.15, ackChance: 0.25, expression: "explain", label: "Executive" };
    case "teacher":
    case "professor":
    case "tutor":
    case "language":
      return { speed: 0.94, sentencePauseScale: 1.35, ackChance: 0.45, expression: "explain", label: "Patient" };
    case "research":
      return { speed: 0.98, sentencePauseScale: 1.25, ackChance: 0.2, expression: "thinking", label: "Analytical" };
    case "creator":
    case "presentation":
    case "public_speaker":
      return { speed: 1.08, sentencePauseScale: 0.9, ackChance: 0.35, expression: "smile", label: "Energetic" };
    case "support":
    case "coach":
    case "mentor":
      return { speed: 0.98, sentencePauseScale: 1.2, ackChance: 0.5, expression: "smile", label: "Calm" };
    case "coding":
      return { speed: 1, sentencePauseScale: 1.1, ackChance: 0.2, expression: "explain", label: "Precise" };
    default:
      return { speed: 1, sentencePauseScale: 1, ackChance: 0.35, expression: "explain", label: "Balanced" };
  }
}
