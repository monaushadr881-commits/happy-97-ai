/**
 * HAPPY Command Engine — server-only resolution helpers.
 *
 * Extends `src/lib/founder/audit.ts` + `src/lib/founder/pipeline.ts` —
 * no duplication. Reads only existing canonical tables; creates none.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { COMMAND_AUDIT_CATEGORY, toCommandRecord, type CommandRecord } from "./command-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

/** Best-effort company resolution — mirrors the canonical builder entry. */
export async function resolveCompanyId(sb: SB, userId: string): Promise<string | null> {
  try {
    const { data } = await sb
      .from("employees")
      .select("company_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (data?.company_id) return data.company_id as string;
  } catch {
    /* ignore */
  }
  try {
    const { data } = await sb
      .from("companies")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id as string;
  } catch {
    /* ignore */
  }
  return null;
}

/** Command history, rebuilt from the canonical audit log. */
export async function readCommands(sb: SB, limit: number): Promise<CommandRecord[]> {
  const { data, error } = await sb
    .from("audit_logs")
    .select("id, action, occurred_at, metadata")
    .eq("category", COMMAND_AUDIT_CATEGORY)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`command_history_failed: ${error.message}`);
  return (data ?? []).map((r) =>
    toCommandRecord(r as { id: string; action: string; occurred_at: string; metadata: unknown }),
  );
}

export async function readCommand(sb: SB, id: string): Promise<CommandRecord | null> {
  const { data, error } = await sb
    .from("audit_logs")
    .select("id, action, occurred_at, metadata")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`command_read_failed: ${error.message}`);
  if (!data) return null;
  return toCommandRecord(data as { id: string; action: string; occurred_at: string; metadata: unknown });
}

export interface CommandCenterOverview {
  readonly companies: number;
  readonly workspaces: number;
  readonly commands: number;
  readonly approvalsPending: number;
  readonly jobsQueued: number;
  readonly at: string;
}

async function countOf(sb: SB, table: string, apply?: (q: never) => unknown): Promise<number> {
  try {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (apply) q = apply(q as never) as typeof q;
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Unified counts across existing canonical tables. Never throws. */
export async function readOverview(sb: SB): Promise<CommandCenterOverview> {
  const [companies, workspaces, commands, approvalsPending, jobsQueued] = await Promise.all([
    countOf(sb, "companies"),
    countOf(sb, "workspaces"),
    countOf(sb, "audit_logs", (q) =>
      (q as unknown as { eq: (a: string, b: string) => unknown }).eq("category", COMMAND_AUDIT_CATEGORY),
    ),
    countOf(sb, "approvals", (q) =>
      (q as unknown as { eq: (a: string, b: string) => unknown }).eq("status", "pending"),
    ),
    countOf(sb, "job_queue", (q) =>
      (q as unknown as { eq: (a: string, b: string) => unknown }).eq("status", "queued"),
    ),
  ]);
  return {
    companies,
    workspaces,
    commands,
    approvalsPending,
    jobsQueued,
    at: new Date().toISOString(),
  };
}
