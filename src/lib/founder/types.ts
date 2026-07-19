/**
 * R183 Phase A — Canonical Founder Interfaces
 *
 * These interfaces are the ONLY shapes downstream phases (B/C/D) may
 * import when integrating with the Founder enforcement primitive or
 * the Brain wrapper. Do not fork these types elsewhere; extend here.
 */

import type { ApprovalRequiredReason } from "./errors";

/** Stable capability identifier, e.g. "revenue.payouts.execute". */
export type FounderCapability = string;

export interface FounderApprovalRequest {
  readonly capability: FounderCapability;
  /** Optional structured payload the Brain may reason over later. */
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface FounderApprovalContext {
  readonly isFounder: boolean;
  /**
   * Whether an explicit approval token / signed decision was granted
   * for THIS request. Callers are responsible for verifying the token
   * before setting this to true.
   */
  readonly approvalGranted?: boolean;
  /** Correlation id for audit logs (optional, no-op in Phase A). */
  readonly correlationId?: string;
}

export interface FounderApprovalDecision {
  readonly allowed: boolean;
  readonly capability: FounderCapability;
  readonly reason?: ApprovalRequiredReason;
}

/**
 * Canonical Brain wrapper contract. Concrete Brain implementations
 * live outside Phase A; this interface pins the shape so downstream
 * phases can consume it without version drift.
 */
export interface BrainRequest<TInput = unknown> {
  readonly capability: FounderCapability;
  readonly input: TInput;
  readonly context: FounderApprovalContext;
}

export interface BrainResult<TOutput = unknown> {
  readonly capability: FounderCapability;
  readonly output: TOutput;
  readonly durationMs: number;
}

export type BrainHandler<TInput, TOutput> = (
  input: TInput,
  context: FounderApprovalContext,
) => Promise<TOutput> | TOutput;
