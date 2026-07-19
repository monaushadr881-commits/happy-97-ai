/**
 * R183 Batch A — Canonical Audit Writer (thin re-export)
 *
 * SINGLE canonical import surface for writing audit entries.
 *
 * DO NOT create a new audit engine, table, or trigger. This helper
 * delegates to the existing canonical owner:
 *   auditRepo(sb).write()  →  RPC public.write_audit  →  public.audit_logs
 *
 * All future R183 wiring (Brain, R158 approval, mutations across
 * Business / Revenue / Creator / Knowledge / Publishing runtimes)
 * MUST call `writeCanonicalAudit` from this module.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { auditRepo } from "@/enterprise/repositories.server";

export type CanonicalAuditSeverity =
  | "info"
  | "notice"
  | "warning"
  | "critical";

export interface CanonicalAuditEntry {
  category: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  company_id?: string;
  before?: unknown;
  after?: unknown;
  severity?: CanonicalAuditSeverity;
  metadata?: Record<string, unknown>;
}

/**
 * Write ONE canonical audit entry. Returns the generated audit_logs.id.
 *
 * The `sb` client must be an authenticated Supabase client
 * (from `requireSupabaseAuth` context or `supabaseAdmin` for verified
 * webhooks / privileged jobs). The underlying `write_audit` RPC uses
 * SECURITY DEFINER and captures `auth.uid()` as the actor.
 */
export async function writeCanonicalAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
  entry: CanonicalAuditEntry,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return auditRepo(sb as any).write(entry);
}
