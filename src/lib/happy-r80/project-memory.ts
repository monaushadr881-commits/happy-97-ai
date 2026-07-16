/**
 * R80 — Project Memory (pure logic).
 * In-memory selection/ranking helpers over lists provided by the caller.
 * Persistence is delegated to existing memory-v* modules; this file only
 * decides *what* Happy should recall next.
 */

export type ProjectRef = {
  id: string;
  name: string;
  lastOpenedAt: number; // epoch ms
  pinned?: boolean;
  pendingTasks?: number;
  pendingReviews?: number;
  pendingDeployments?: number;
};

export type MemoryRecallInput = {
  projects: ProjectRef[];
  nowMs: number;
  limit?: number;
};

export function recentProjects(inp: MemoryRecallInput): ProjectRef[] {
  const limit = inp.limit ?? 5;
  return [...inp.projects]
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.lastOpenedAt - a.lastOpenedAt)
    .slice(0, limit);
}

export function pendingWork(projects: ProjectRef[]): ProjectRef[] {
  return projects.filter((p) => (p.pendingTasks ?? 0) + (p.pendingReviews ?? 0) + (p.pendingDeployments ?? 0) > 0);
}

export function resumeSuggestion(inp: MemoryRecallInput): { project: ProjectRef; reason: string } | null {
  const pending = pendingWork(inp.projects);
  const pool = pending.length ? pending : inp.projects;
  const [top] = [...pool].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  if (!top) return null;
  const reason =
    (top.pendingDeployments ?? 0) > 0 ? "pending deployment"
    : (top.pendingReviews ?? 0) > 0 ? "pending review"
    : (top.pendingTasks ?? 0) > 0 ? "open tasks"
    : "most recent";
  return { project: top, reason };
}
