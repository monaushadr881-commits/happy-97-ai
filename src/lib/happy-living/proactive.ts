/**
 * R75 — Meaningful-signal gate. Never spam.
 * Fires at most one proactive line per (session, signal).
 */
export type ProactiveSignal =
  | "deployment-completed"
  | "project-ready"
  | "task-pending"
  | "opportunity-found"
  | "performance-improved";

export type ProactiveInput = {
  signal: ProactiveSignal;
  alreadyDelivered: ProactiveSignal[];
  userIdleMs: number;
  conversing: boolean;
};

export function shouldSpeak(inp: ProactiveInput): boolean {
  if (inp.conversing) return false;
  if (inp.alreadyDelivered.includes(inp.signal)) return false;
  return inp.userIdleMs > 3_000;
}

const LINES: Record<ProactiveSignal, string> = {
  "deployment-completed": "Deployment finished — want to review the release?",
  "project-ready": "Your project is ready. Shall I walk you through it?",
  "task-pending": "One task is still pending — want me to open it?",
  "opportunity-found": "I spotted a new opportunity worth a look.",
  "performance-improved": "Performance improved on the latest build.",
};

export function proactiveLine(sig: ProactiveSignal): string {
  return LINES[sig];
}
