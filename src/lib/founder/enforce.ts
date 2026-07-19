/**
 * R183 — HAPPY Runtime Integration™: Enforcement Primitive
 *
 * This is NOT a new governance module. It is the wiring that gives the
 * existing R158 Approval Gateway teeth. It:
 *   1. Runs the canonical R115.b Brain (`runBrain`) before any mutation.
 *   2. Collects the existing Executive Board (R171–R180) responsibility
 *      snapshot for audit context.
 *   3. Classifies the change through the existing R158 tier logic.
 *   4. Requires a matching `public.approvals` row (status='approved') for
 *      any tier whose R158 requirements demand Founder approval — which is
 *      every tier (minor/standard/high_risk/critical).
 *   5. Writes exactly ONE canonical audit_logs row via `write_audit`
 *      containing brain summary, board snapshot, tier, and approval id.
 *
 * All plumbing goes through canonical owners. No new table, API, runtime,
 * or V2. Import into any `createServerFn` handler that mutates data.
 *
 * Locks: R91 · R111 · R145 · R158 · R159 · R171–R180.
 */

import { classifyChange, requirementsFor, type ApprovalTier, type ChangeDescriptor } from "./approval-gateway";
import { runBrain, type RunBrainInput } from "@/lib/brain/engine";

// Executive Board — pull each canonical module's RESPONSIBILITIES constant
// as its "opinion signal". The modules are pure governance today; this is
// how their outputs actually reach the audit trail during a real mutation.
import { RESPONSIBILITIES as CTO } from "./ai-cto";
import { RESPONSIBILITIES as COO } from "./ai-coo";
import { RESPONSIBILITIES as CFO } from "./ai-cfo";
import { RESPONSIBILITIES as CPO } from "./ai-cpo";
import { RESPONSIBILITIES as CGO } from "./ai-cgo";
import { RESPONSIBILITIES as RESEARCH } from "./ai-research-director";
import { RESPONSIBILITIES as RELEASE } from "./ai-release-director";
import { RESPONSIBILITIES as INNOVATION } from "./ai-innovation-director";
import { RESPONSIBILITIES as STRATEGY } from "./ai-strategy-director";
import { RESPONSIBILITIES as CREATIVE } from "./ai-creative-director";

export const EXECUTIVE_BOARD = {
  cto: CTO, coo: COO, cfo: CFO, cpo: CPO, cgo: CGO,
  research: RESEARCH, release: RELEASE, innovation: INNOVATION,
  strategy: STRATEGY, creative: CREATIVE,
} as const;

export type EnforceContext = {
  supabase: {
    from: (t: string) => any;
    rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  };
  userId: string;
};

export type EnforceParams = {
  action: string;                    // e.g. "release.store_submit"
  entityType: string;                // matches approvals.entity_type
  entityId?: string;                 // matches approvals.entity_id (uuid)
  companyId: string;                 // matches approvals.company_id
  descriptor: ChangeDescriptor;      // fed to R158 classifyChange
  brain?: RunBrainInput;             // optional; when omitted a synthetic ChatInput is built
  // Escape hatch for read-only pre-flight in previews. Never true in prod paths.
  dryRun?: boolean;
};

export type EnforceResult = {
  tier: ApprovalTier;
  approvalId: string;
  boardSnapshot: typeof EXECUTIVE_BOARD;
  brainRan: boolean;
  auditWritten: boolean;
};

/** Thrown when no matching approved `approvals` row is found for the mutation. */
export class ApprovalRequiredError extends Error {
  code = "APPROVAL_REQUIRED";
  status = 403;
  constructor(
    public action: string,
    public entityType: string,
    public tier: ApprovalTier,
    public entityId?: string,
  ) {
    super(
      `Founder approval required for "${action}" (${entityType}${entityId ? `#${entityId}` : ""}) at tier=${tier}. ` +
      `Create an approvals row with entity_type='${entityType}', entity_id='${entityId ?? "<id>"}', status='approved' before invoking this mutation.`,
    );
    this.name = "ApprovalRequiredError";
  }
}

/** Pure — testable without a database. */
export function classifyAndBoard(descriptor: ChangeDescriptor) {
  const tier = classifyChange(descriptor);
  const requirements = requirementsFor(tier);
  return { tier, requirements, boardSnapshot: EXECUTIVE_BOARD };
}

/**
 * Look up an approved `public.approvals` row for the mutation. RLS scopes
 * to company members; policy tightening in R181 stops requesters from
 * self-approving so a returned row here truly reflects Founder consent.
 */
async function findApprovedRow(
  sb: EnforceContext["supabase"],
  p: Pick<EnforceParams, "entityType" | "entityId" | "companyId" | "action">,
): Promise<{ id: string } | null> {
  let q = sb.from("approvals")
    .select("id, status")
    .eq("company_id", p.companyId)
    .eq("entity_type", p.entityType)
    .eq("status", "approved")
    .order("decided_at", { ascending: false })
    .limit(1);
  if (p.entityId) q = q.eq("entity_id", p.entityId);
  const { data, error } = await q;
  if (error) throw new Error(`approvals lookup failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? { id: row.id } : null;
}

async function writeCanonicalAudit(
  sb: EnforceContext["supabase"],
  p: {
    action: string; entityType: string; entityId?: string; companyId: string;
    metadata: Record<string, unknown>;
  },
): Promise<boolean> {
  try {
    await sb.rpc("write_audit", {
      _category: "r183_runtime",
      _action: p.action,
      _entity_type: p.entityType,
      _entity_id: p.entityId ?? null,
      _company_id: p.companyId,
      _before: null,
      _after: null,
      _severity: "info",
      _metadata: p.metadata,
    });
    return true;
  } catch {
    return false; // audit is best-effort; enforcement already succeeded
  }
}

/**
 * The one function every mutation handler should call before touching data.
 * Throws `ApprovalRequiredError` when Founder approval is absent.
 */
export async function requireApproval(
  context: EnforceContext,
  params: EnforceParams,
): Promise<EnforceResult> {
  const { tier, requirements, boardSnapshot } = classifyAndBoard(params.descriptor);

  // 1. Brain first — canonical R115.b entrypoint. Never bypass.
  let brainRan = false;
  let brainSummary: Record<string, unknown> = {};
  try {
    const brainInput: RunBrainInput = params.brain ?? {
      company_id: params.companyId,
      input: `${params.action} ${params.entityType}${params.entityId ? " " + params.entityId : ""}`,
      source: "automation",
      module: params.entityType,
    };
    const res: any = await runBrain(context.supabase as any, context.userId, brainInput);
    brainRan = true;
    brainSummary = {
      intent: res?.understand?.intent ?? null,
      confidence: res?.understand?.confidence ?? null,
      reasoning_mode: res?.reasoningMode ?? null,
      clarification_requested: res?.analytics?.clarification_requested ?? false,
      steps_executed: res?.analytics?.steps_executed ?? 0,
    };
  } catch (e: any) {
    brainSummary = { error: String(e?.message ?? e) };
    // For critical tiers, Brain failure blocks — no silent bypass.
    if (tier === "critical") throw new Error(`Brain execution failed on critical mutation: ${brainSummary.error}`);
  }

  // 2. Approval lookup. Every tier's R158 requirements demand Founder approval.
  if (params.dryRun !== true && requirements.requiresFounderApproval) {
    const approved = await findApprovedRow(context.supabase, params);
    if (!approved) throw new ApprovalRequiredError(params.action, params.entityType, tier, params.entityId);

    // 3. One canonical audit line.
    const auditWritten = await writeCanonicalAudit(context.supabase, {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      companyId: params.companyId,
      metadata: {
        approval_id: approved.id,
        tier,
        requirements,
        brain: brainSummary,
        executive_board: Object.fromEntries(
          Object.entries(boardSnapshot).map(([k, v]) => [k, v.length]),
        ),
        actor_id: context.userId,
      },
    });

    return { tier, approvalId: approved.id, boardSnapshot, brainRan, auditWritten };
  }

  // dryRun path — still audit the attempt.
  const auditWritten = await writeCanonicalAudit(context.supabase, {
    action: `${params.action}.dryrun`,
    entityType: params.entityType,
    entityId: params.entityId,
    companyId: params.companyId,
    metadata: { tier, brain: brainSummary, actor_id: context.userId },
  });
  return { tier, approvalId: "dry-run", boardSnapshot, brainRan, auditWritten };
}
