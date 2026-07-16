/**
 * R83 — HAPPY Human Interaction Intelligence: voice intent (pure logic).
 *
 * No external voice provider. No streaming speech engine. All logic here
 * is deterministic and unit-tested; the browser SpeechRecognition binding
 * lives in `voice-listener.ts` and is opt-in from HappyDesk.
 */

export type VoiceIntentKind =
  | "greeting"
  | "help"
  | "explain"
  | "navigate"
  | "cancel"
  | "resume"
  | "language-switch"
  | "unknown";

export interface VoiceIntent {
  kind: VoiceIntentKind;
  wake: boolean;
  cleaned: string;
  languageCode?: string;
  target?: string;
}

const WAKE_PATTERNS = [
  /^\s*(hi|hello|hey|ok)\s+happy[\s,.!?:-]*/i,
  /^\s*happy[\s,.!?:-]+/i,
];

const CANCEL_WORDS = /\b(stop|cancel|never\s*mind|forget it|shush|quiet)\b/i;
const RESUME_WORDS = /\b(resume|continue|go on|keep going|where were we)\b/i;
const HELP_WORDS = /\b(help|assist|guide|walk me through|how do i)\b/i;
const EXPLAIN_WORDS = /\b(explain|what('| i)s this|tell me about|describe)\b/i;
const NAV_WORDS = /\b(open|go to|show|take me to|navigate to)\s+([a-z0-9/_ -]{2,})/i;
const GREET_WORDS = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i;
const LANG_WORDS = /\b(switch to|speak|change to)\s+(english|spanish|french|german|italian|portuguese|arabic|hindi|chinese|japanese|korean)\b/i;

const LANG_MAP: Record<string, string> = {
  english: "en", spanish: "es", french: "fr", german: "de", italian: "it",
  portuguese: "pt", arabic: "ar", hindi: "hi", chinese: "zh", japanese: "ja", korean: "ko",
};

export function stripWake(raw: string): { wake: boolean; cleaned: string } {
  const text = (raw || "").trim();
  for (const p of WAKE_PATTERNS) {
    const m = text.match(p);
    if (m) return { wake: true, cleaned: text.slice(m[0].length).trim() };
  }
  return { wake: false, cleaned: text };
}

export function classifyIntent(raw: string): VoiceIntent {
  const { wake, cleaned } = stripWake(raw);
  const body = cleaned || (wake ? "" : raw.trim());

  if (!body) {
    return { kind: wake ? "greeting" : "unknown", wake, cleaned: body };
  }
  if (CANCEL_WORDS.test(body)) return { kind: "cancel", wake, cleaned: body };
  if (RESUME_WORDS.test(body)) return { kind: "resume", wake, cleaned: body };
  const lang = body.match(LANG_WORDS);
  if (lang) {
    return { kind: "language-switch", wake, cleaned: body, languageCode: LANG_MAP[lang[2].toLowerCase()] };
  }
  const nav = body.match(NAV_WORDS);
  if (nav) return { kind: "navigate", wake, cleaned: body, target: nav[2].trim() };
  if (EXPLAIN_WORDS.test(body)) return { kind: "explain", wake, cleaned: body };
  if (HELP_WORDS.test(body)) return { kind: "help", wake, cleaned: body };
  if (GREET_WORDS.test(body)) return { kind: "greeting", wake, cleaned: body };
  return { kind: "unknown", wake, cleaned: body };
}

/** Silence-gap policy: how long a lull counts as "user finished speaking". */
export function isNaturalSilence(msSinceLastToken: number): boolean {
  return msSinceLastToken >= 1200;
}

/** Should HAPPY interrupt himself when the user starts speaking again? */
export function shouldInterrupt(speakingMs: number, userStartedAt: number, now: number): boolean {
  if (userStartedAt <= 0) return false;
  return now - userStartedAt < 400 && speakingMs > 300;
}
