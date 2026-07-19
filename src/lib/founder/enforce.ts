/**
 * R183 Phase A — Canonical Founder Enforcement Primitive
 *
 * Single source of truth for Founder-gated actions across HAPPY X.
 * Any capability that must not run without explicit Founder approval
 * MUST route its authorization check through `enforceFounderApproval`.
 *
 * This module is FOUNDATION ONLY. Do NOT wire it into Business OS,
 * Revenue OS, Creator, Website, Deployment, or Publishing yet — that
 * belongs to later R183 phases. Keep this file pure: no I/O, no DB,
 * no network, no side effects beyond throwing the canonical error.
 */

import { ApprovalRequiredError } from "./errors";
import type {
  FounderApprovalContext,
  FounderApprovalDecision,
  FounderApprovalRequest,
} from "./types";

/**
 * Pure decision function. Deterministic. No side effects.
 * Returns a structured decision — never throws.
 */
export function evaluateFounderApproval(
  request: FounderApprovalRequest,
  context: FounderApprovalContext,
): FounderApprovalDecision {
  if (context.isFounder && context.approvalGranted === true) {
    return { allowed: true, capability: request.capability };
  }
  return {
    allowed: false,
    capability: request.capability,
    reason: context.isFounder
      ? "founder_approval_not_granted"
      : "not_founder",
  };
}

/**
 * Guard variant. Throws `ApprovalRequiredError` when the decision is
 * `allowed: false`. Use this at the top of any Founder-gated handler
 * once wiring begins in later phases.
 */
export function enforceFounderApproval(
  request: FounderApprovalRequest,
  context: FounderApprovalContext,
): void {
  const decision = evaluateFounderApproval(request, context);
  if (!decision.allowed) {
    throw new ApprovalRequiredError(request.capability, decision.reason);
  }
}
