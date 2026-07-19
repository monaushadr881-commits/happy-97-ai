/**
 * R183 Batch H — Canonical Executive Board public surface.
 * Single import path for downstream runtimes.
 */
export {
  EXECUTIVE_MEMBERS,
  aggregateBoard,
  type BoardProposal,
  type BoardReview,
  type MemberAnalysis,
  type MemberId,
  type MemberRole,
  type Recommendation,
} from "./members";
export {
  requestExecutiveReview,
  runExecutiveReview,
  recordBoardOutcome,
} from "./board.functions";
