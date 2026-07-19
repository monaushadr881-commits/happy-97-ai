/**
 * R183 Phase A — Enforcement primitive unit tests.
 *
 * Verifies that `requireApproval` really does:
 *   1. classify the change through R158,
 *   2. call `runBrain()` (or fail-fast on critical when Brain throws),
 *   3. reject when no matching approved `approvals` row exists,
 *   4. accept when one does and write exactly one canonical audit line.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Brain BEFORE importing enforce.ts so the module picks up the mock.
vi.mock("@/lib/brain/engine", () => ({
  runBrain: vi.fn(async () => ({
    understand: { intent: "release", confidence: 0.9 },
    reasoningMode: "standard",
    analytics: { clarification_requested: false, steps_executed: 3 },
  })),
}));

import { runBrain } from "@/lib/brain/engine";
import { requireApproval, ApprovalRequiredError, classifyAndBoard, EXECUTIVE_BOARD } from "@/lib/founder/enforce";

function makeSb(opts: { approved?: boolean; rpcThrows?: boolean } = {}) {
  const rpc = vi.fn(async () => (opts.rpcThrows ? { data: null, error: new Error("rpc down") } : { data: null, error: null }));
  const rows = opts.approved ? [{ id: "00000000-0000-0000-0000-000000000abc", status: "approved" }] : [];
  const query: any = {
    _rows: rows,
    select: vi.fn(function (this: any) { return this; }),
    eq: vi.fn(function (this: any) { return this; }),
    order: vi.fn(function (this: any) { return this; }),
    limit: vi.fn(function (this: any) { return this; }),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  };
  const from = vi.fn(() => query);
  return { from, rpc } as any;
}

const baseParams = {
  action: "release.store_submit",
  entityType: "release_store_submissions",
  entityId: "11111111-1111-1111-1111-111111111111",
  companyId: "22222222-2222-2222-2222-222222222222",
  descriptor: { kind: "deploy" as const, affectsProduction: true, securityImpact: "medium" as const },
};

beforeEach(() => vi.clearAllMocks());

describe("R183 enforce — classifyAndBoard", () => {
  it("returns tier, requirements, and executive board snapshot", () => {
    const r = classifyAndBoard({ kind: "deploy", affectsProduction: true, securityImpact: "high" });
    expect(r.tier).toBe("high_risk");
    expect(r.requirements.requiresFounderApproval).toBe(true);
    expect(Object.keys(r.boardSnapshot)).toEqual(Object.keys(EXECUTIVE_BOARD));
  });
});

describe("R183 enforce — requireApproval", () => {
  it("throws ApprovalRequiredError when no approved row exists", async () => {
    const sb = makeSb({ approved: false });
    await expect(
      requireApproval({ supabase: sb, userId: "u1" }, baseParams),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
    expect(runBrain).toHaveBeenCalledTimes(1); // Brain runs even when approval will fail
  });

  it("accepts when approved row exists and writes one canonical audit line", async () => {
    const sb = makeSb({ approved: true });
    const res = await requireApproval({ supabase: sb, userId: "u1" }, baseParams);
    expect(res.tier).toBeDefined();
    expect(res.approvalId).toBe("00000000-0000-0000-0000-000000000abc");
    expect(res.brainRan).toBe(true);
    expect(res.auditWritten).toBe(true);
    expect(sb.rpc).toHaveBeenCalledTimes(1);
    expect(sb.rpc).toHaveBeenCalledWith("write_audit", expect.objectContaining({
      _category: "r183_runtime",
      _action: "release.store_submit",
      _company_id: baseParams.companyId,
    }));
  });

  it("fail-open on non-critical when Brain throws but still enforces approval", async () => {
    (runBrain as any).mockImplementationOnce(async () => { throw new Error("brain down"); });
    const sb = makeSb({ approved: true });
    const res = await requireApproval({ supabase: sb, userId: "u1" }, baseParams);
    expect(res.brainRan).toBe(false);
    expect(res.approvalId).toBeDefined();
  });

  it("fail-closed on critical tier when Brain throws", async () => {
    (runBrain as any).mockImplementationOnce(async () => { throw new Error("brain down"); });
    const sb = makeSb({ approved: true });
    await expect(
      requireApproval({ supabase: sb, userId: "u1" }, {
        ...baseParams,
        descriptor: { kind: "deploy", isCritical: true },
      }),
    ).rejects.toThrow(/Brain execution failed on critical/);
  });

  it("dryRun path skips approval lookup but still audits attempt", async () => {
    const sb = makeSb({ approved: false });
    const res = await requireApproval({ supabase: sb, userId: "u1" }, { ...baseParams, dryRun: true });
    expect(res.approvalId).toBe("dry-run");
    expect(sb.rpc).toHaveBeenCalledWith("write_audit", expect.objectContaining({
      _action: "release.store_submit.dryrun",
    }));
  });
});
