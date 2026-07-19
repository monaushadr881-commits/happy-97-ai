/**
 * R183 Phase A — Canonical Brain Wrapper
 *
 * `withBrain` is the ONLY sanctioned way to wrap a capability so that
 * its execution is (a) gated by `enforceFounderApproval` and (b) shaped
 * as a `BrainResult`. Downstream phases will build Business OS, Revenue
 * OS, Creator, Website, Deployment, and Publishing capabilities on top
 * of this primitive — but Phase A does NOT wire any of them.
 *
 * Foundation only. No I/O. No logging. No side effects other than
 * invoking the caller-supplied handler and throwing
 * `ApprovalRequiredError` when the request is not authorized.
 */

import { enforceFounderApproval } from "./enforce";
import type {
  BrainHandler,
  BrainRequest,
  BrainResult,
  FounderCapability,
} from "./types";

export interface WithBrainOptions<TInput, TOutput> {
  readonly capability: FounderCapability;
  readonly handler: BrainHandler<TInput, TOutput>;
}

export function withBrain<TInput, TOutput>(
  options: WithBrainOptions<TInput, TOutput>,
): (request: BrainRequest<TInput>) => Promise<BrainResult<TOutput>> {
  const { capability, handler } = options;
  return async (request) => {
    if (request.capability !== capability) {
      // Guard against capability spoofing at the boundary.
      throw new Error(
        `Brain capability mismatch: wrapper=${capability} request=${request.capability}`,
      );
    }
    enforceFounderApproval(
      { capability, payload: undefined },
      request.context,
    );
    const start = Date.now();
    const output = await handler(request.input, request.context);
    return {
      capability,
      output,
      durationMs: Date.now() - start,
    };
  };
}
