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
  "I understand.",
  "That's a good question.",
  "Let's work through it.",
  "Here's what I recommend.",
  "I can help with that.",
  "Got it.",
  "Let me think through this with you.",
  "Sure — here's how I'd approach it.",
];

/** Pick an acknowledgement only ~35% of the time, avoiding repeats. */
export function maybeAcknowledgement(lastUsed?: string): string | null {
  if (Math.random() > 0.35) return null;
  const pool = ACKS.filter((a) => a !== lastUsed);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Timing constants — feel human, never sluggish. */
export const PACING = {
  listenBeatMs: 350,        // small listening pause before HAPPY reacts
  thinkMinMs: 650,          // minimum thinking time
  thinkPerCharMs: 4,        // scales gently with answer length
  thinkMaxMs: 2200,         // cap the wait
  sentencePauseMs: 220,     // pause between sentence groups
  paragraphPauseMs: 460,    // pause between paragraphs
};

/** Compute a human thinking pause based on the answer's length. */
export function thinkingDurationFor(answer: string): number {
  const base = PACING.thinkMinMs + Math.min(PACING.thinkMaxMs, answer.length * PACING.thinkPerCharMs);
  // jitter ±15% so it never feels metronomic
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
