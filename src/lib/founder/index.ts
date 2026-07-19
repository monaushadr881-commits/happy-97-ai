/**
 * R183 Phase A — Founder Foundation Public API
 *
 * The ONLY sanctioned import surface for the Founder enforcement
 * primitive and Brain wrapper. Downstream phases must import from
 * "@/lib/founder" — never reach into internal files.
 */

export {
  ApprovalRequiredError,
  isApprovalRequiredError,
  type ApprovalRequiredReason,
} from "./errors";

export {
  enforceFounderApproval,
  evaluateFounderApproval,
} from "./enforce";

export { withBrain, type WithBrainOptions } from "./with-brain";

export type {
  BrainHandler,
  BrainRequest,
  BrainResult,
  FounderApprovalContext,
  FounderApprovalDecision,
  FounderApprovalRequest,
  FounderCapability,
} from "./types";
