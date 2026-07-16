/**
 * R88 — Phrase de-repetition.
 *
 * Small helper that strips or rewrites conversational openers HAPPY
 * has used too recently, so replies within one session don't fall
 * into the "As I mentioned earlier, …" / "Certainly! …" trap. Pure
 * logic — no DOM, no storage.
 */

const REPETITIVE_OPENERS = [
  /^certainly!?[,\s-]+/i,
  /^sure(?:ly|,)?\s+thing[,\s-]+/i,
  /^of course[,\s-]+/i,
  /^as (?:i|we) (?:mentioned|noted|said) (?:earlier|before|previously)[,\s-]+/i,
  /^to (?:reiterate|recap)[,\s-]+/i,
  /^i (?:hope|understand) (?:this|that)[^,.]{0,40}[,\s-]+/i,
  /^great question!?[,\s-]+/i,
  /^happy to help!?[,\s-]+/i,
];

const ROBOTIC_PHRASES: Array<[RegExp, string]> = [
  [/\bas an ai (?:language )?model\b[^.]*\.?/gi, ""],
  [/\bi (?:am|'m) unable to\b/gi, "I can't"],
  [/\bplease note that\b/gi, ""],
  [/\bin conclusion\b/gi, "So"],
  [/\bit is important to (?:note|remember) that\b/gi, ""],
];

/**
 * Rewrite a candidate reply so it doesn't repeat the previous opener
 * and drops obviously robotic phrasing. Never mutates input.
 */
export function humanize(reply: string, recentOpeners: string[] = []): string {
  let out = reply.trim();
  for (const re of REPETITIVE_OPENERS) out = out.replace(re, "");
  for (const [re, sub] of ROBOTIC_PHRASES) out = out.replace(re, sub);
  out = out.replace(/\s{2,}/g, " ").replace(/^[,\s-]+/, "");

  const firstSentence = (out.match(/^[^.!?]*[.!?]/) ?? [""])[0].trim().toLowerCase();
  if (firstSentence && recentOpeners.some((o) => o.trim().toLowerCase() === firstSentence)) {
    // drop the repeated opener; return the rest.
    out = out.slice(firstSentence.length).trimStart();
  }
  return out || reply.trim();
}

/** Track the last N openers HAPPY used this session. */
export function rollOpeners(recent: string[], reply: string, limit = 5): string[] {
  const first = (reply.match(/^[^.!?]*[.!?]/) ?? [""])[0].trim();
  if (!first) return recent;
  return [first, ...recent.filter((o) => o !== first)].slice(0, limit);
}
