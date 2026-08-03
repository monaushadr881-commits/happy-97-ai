/**
 * HAPPY Autonomous Mission System — server-only resolution helpers.
 *
 * Reads ONLY the canonical audit log (`public.audit_logs`). Creates no
 * table, no queue, no runtime.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MISSION_AUDIT_CATEGORY,
  toMissionRecord,
  type AuditRowLike,
  type MissionRecord,
} from "./mission-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

const SELECT = "id, action, occurred_at, metadata";

async function rowsFor(sb: SB, limit: number): Promise<AuditRowLike[]> {
  const { data, error } = await sb
    .from("audit_logs")
    .select(SELECT)
    .eq("category", MISSION_AUDIT_CATEGORY)
    .order("occurred_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`mission_read_failed: ${error.message}`);
  return (data ?? []) as AuditRowLike[];
}

function missionIdOf(row: AuditRowLike): string | null {
  const m = (row.metadata ?? {}) as Record<string, unknown>;
  return typeof m['mission_id'] === "string" ? m['mission_id'] : null;
}

/** All missions, newest first, folded from start rows + their events. */
export async function readMissions(sb: SB, limit: number): Promise<MissionRecord[]> {
  const rows = await rowsFor(sb, Math.min(500, limit * 20));
  const starts = rows.filter((r) => r.action === "start");
  const byMission = new Map<string, AuditRowLike[]>();
  for (const r of rows) {
    const id = missionIdOf(r);
    if (!id || r.action === "start") continue;
    const list = byMission.get(id) ?? [];
    list.push(r);
    byMission.set(id, list);
  }
  return starts
    .map((s) => toMissionRecord(s, byMission.get(s.id) ?? []))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export async function readMission(sb: SB, id: string): Promise<MissionRecord | null> {
  const { data: start, error } = await sb
    .from("audit_logs")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`mission_read_failed: ${error.message}`);
  if (!start) return null;

  const { data: events } = await sb
    .from("audit_logs")
    .select(SELECT)
    .eq("category", MISSION_AUDIT_CATEGORY)
    .order("occurred_at", { ascending: true })
    .limit(500);

  const own = ((events ?? []) as AuditRowLike[]).filter(
    (r) => r.action !== "start" && missionIdOf(r) === id,
  );
  return toMissionRecord(start as AuditRowLike, own);
}
