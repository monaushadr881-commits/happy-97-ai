/** Intent Router — pure keyword-based classifier. */
export type IntentKind =
  | "greeting" | "question" | "task" | "business" | "education" | "knowledge"
  | "research" | "creator" | "support" | "founder" | "automation"
  | "presentation" | "whiteboard" | "multi-capability";

const MAP: Array<[IntentKind, RegExp]> = [
  ["greeting", /\b(hi|hello|hey|namaste|good\s(morning|evening))\b/i],
  ["presentation", /\b(slide|deck|presentation|pitch)\b/i],
  ["whiteboard", /\b(whiteboard|draw|diagram|sketch)\b/i],
  ["research", /\b(research|source|cite|paper|study)\b/i],
  ["education", /\b(learn|teach|lesson|quiz|explain|tutor)\b/i],
  ["knowledge", /\b(knowledge|wiki|note|summary|summarize)\b/i],
  ["creator", /\b(video|caption|thumbnail|reel|post|content)\b/i],
  ["business", /\b(crm|erp|hrms|invoice|customer|sales|revenue)\b/i],
  ["founder", /\b(founder|okr|kpi|board|investor|strategy)\b/i],
  ["automation", /\b(automat|workflow|schedule|trigger|cron)\b/i],
  ["support", /\b(help|support|issue|bug|broken)\b/i],
  ["task", /\b(do|create|build|make|generate|send|update|delete)\b/i],
];

export const intentRouter = {
  detect(text: string): IntentKind {
    const t = (text || "").trim();
    if (!t) return "question";
    const hits = MAP.filter(([, r]) => r.test(t)).map(([k]) => k);
    if (hits.length >= 2) return "multi-capability";
    return hits[0] ?? "question";
  },
};
