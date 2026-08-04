/**
 * HAPPY Agent Workforce — server-only resolution / permission helpers.
 *
 * Reads ONLY existing canonical surfaces: `public.audit_logs` and the
 * existing SECURITY DEFINER membership RPCs. Creates no table, no runtime.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { WORKFORCE_AUDIT_CATEGORY } from "./workforce-core";
import type { WorkforceRisk } from "./tool-registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

/** Reuses the existing canonical membership RPC — no new auth system. */
export async function requireCompanyMember(sb: SB, userId: string, companyId: string): Promise<boolean> {
  try {
    const { data, error } = await sb.rpc("is_company_member", {
      _user_id: userId,
      _company_id: companyId,
    } as never);
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function requireCompanyAdmin(sb: SB, userId: string, companyId: string): Promise<boolean> {
  try {
    const { data, error } = await sb.rpc("is_company_admin", {
      _user_id: userId,
      _company_id: companyId,
    } as never);
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export interface WorkforceExecution {
  readonly id: string;
  readonly action: string;
  readonly agent: string;
  readonly task: string;
  readonly skill: string | null;
  readonly tool: string | null;
  readonly risk: WorkforceRisk;
  readonly approvalId: string | null;
  readonly occurredAt: string;
}

interface Row {
  id: string;
  action: string;
  entity_type: string | null;
  occurred_at: string;
  metadata: unknown;
}

function toExecution(row: Row): WorkforceExecution {
  const m = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    action: row.action,
    agent: (row.entity_type ?? "happy.workforce").replace("happy.workforce.", ""),
    task: typeof m['task'] === "string" ? m['task'] : "",
    skill: typeof m['skill'] === "string" ? m['skill'] : null,
    tool: typeof m['tool'] === "string" ? m['tool'] : null,
    risk: (typeof m['risk'] === "string" ? m['risk'] : "low") as WorkforceRisk,
    approvalId: typeof m['approval_id'] === "string" ? m['approval_id'] : null,
    occurredAt: row.occurred_at,
  };
}

export async function readWorkforceExecutions(sb: SB, limit: number): Promise<WorkforceExecution[]> {
  const { data, error } = await sb
    .from("audit_logs")
    .select("id, action, entity_type, occurred_at, metadata")
    .eq("category", WORKFORCE_AUDIT_CATEGORY)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`workforce_history_failed: ${error.message}`);
  return (data ?? []).map((r) => toExecution(r as Row));
}
