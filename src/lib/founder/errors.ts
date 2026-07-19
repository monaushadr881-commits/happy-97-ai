/**
 * R183 Phase A — Canonical Founder Errors
 *
 * Single canonical error type used by every Founder-gated capability.
 * Extending code MUST throw this exact class (not a string, not a
 * generic Error) so downstream handlers can reliably discriminate.
 */

export type ApprovalRequiredReason =
  | "not_founder"
  | "founder_approval_not_granted"
  | "capability_disabled"
  | "unknown";

export class ApprovalRequiredError extends Error {
  readonly name = "ApprovalRequiredError" as const;
  readonly code = "FOUNDER_APPROVAL_REQUIRED" as const;
  readonly capability: string;
  readonly reason: ApprovalRequiredReason;

  constructor(capability: string, reason: ApprovalRequiredReason = "unknown") {
    super(`Founder approval required for capability: ${capability} (${reason})`);
    this.capability = capability;
    this.reason = reason;
    // Restore prototype chain for `instanceof` under ES5 down-level targets.
    Object.setPrototypeOf(this, ApprovalRequiredError.prototype);
  }
}

export function isApprovalRequiredError(
  value: unknown,
): value is ApprovalRequiredError {
  return value instanceof ApprovalRequiredError;
}
