/**
 * R189 Batch 3 — Universal Execution Adoption
 *
 * Canonical helper that adopts an existing mutation handler onto the
 * Universal Runtime pipeline defined in Batch 2:
 *
 *   Founder → withBrain → runBrain → Universal Search → Knowledge →
 *   Workspace → Permission → Impact → Executive → Approval → Audit →
 *   Execution → Mission Control
 *
 * This module does NOT introduce a new runtime, queue, service, table,
 * or API. It composes ONLY existing canonical owners:
 *
 *   - public.brain_sessions   → runBrain / execution ledger
 *   - writeCanonicalAudit()   → public.audit_logs
 *   - requestFounderApproval  → R158 · public.approvals (already used by
 *                               each adopted handler; not re-invoked here)
 *
 * Handlers call `adoptToCanonicalPipeline(sb, opts)` at entry to open the
 * brain session + emit the canonical adoption audit. Their existing
 * approval/impact/audit code paths are preserved unchanged.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { writeCanonicalAudit } from "@/lib/founder/audit";

type SB = SupabaseClient<Database>;

export interface AdoptOptions {
  readonly domain:
    | "business"
    | "revenue"
    | "creator"
    | "publishing"
    | "workspace"
    | "knowledge"
    | "automation"
    | "enterprise"
    | "education"
    | "communication"
    | "marketplace"
    | "manufacturing"
    | "healthcare"
    | "agriculture"
    | "cloud"
    | "commerce"
    | "partner"
    | "ai"
    | "ufs"
    | "infinity"
    | "digital-human"
    | "memory"
    | "experience"
    | "universe"
    | "identity"
    | "founder";
  readonly module: string;
  readonly capability: string;
  readonly user_id: string | null;
  readonly company_id: string;
  readonly source?: string;
  readonly summary?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface AdoptResult {
  readonly session_id: string;
}

/**
 * Open a brain session + emit an adoption audit record for this handler
 * invocation. Failures are swallowed so that observability never blocks
 * production writes — the underlying handler continues to enforce its own
 * canonical validation, impact, approval, and audit path.
 */
export async function adoptToCanonicalPipeline(
  sb: SB,
  opts: AdoptOptions,
): Promise<AdoptResult> {
  const capability = `${opts.domain}.${opts.module}.${opts.capability}`;
  try {
    const { data: session } = await sb
      .from("brain_sessions")
      .insert({
        company_id: opts.company_id,
        user_id: opts.user_id,
        source: opts.source ?? "canonical.pipeline.v1",
        input: opts.summary ?? capability,
        status: "active",
        founder_mode: false,
        context: {
          pipeline: "canonical.v1",
          domain: opts.domain,
          module: opts.module,
          capability: opts.capability,
          ...(opts.metadata ?? {}),
        } as never,
      })
      .select("id")
      .single();
    const session_id = session?.id ?? crypto.randomUUID();
    await writeCanonicalAudit(sb, {
      category: `pipeline.${opts.domain}`,
      action: "adopt",
      entity_type: opts.module,
      entity_id: session_id,
      company_id: opts.company_id,
      severity: "info",
      metadata: {
        pipeline: "canonical.v1",
        capability,
        brain_session_id: session_id,
        source: opts.source ?? "handler",
        summary: opts.summary ?? null,
      },
    });
    return { session_id };
  } catch {
    return { session_id: crypto.randomUUID() };
  }
}
