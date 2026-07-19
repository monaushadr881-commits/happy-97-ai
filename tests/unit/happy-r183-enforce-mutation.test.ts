/**
 * R183 Phase C — enforceMutation() centralized wrapper tests.
 *
 * Ensures the wrapper:
 *   1. Runs `withBrain()` BEFORE the mutation body executes.
 *   2. Passes the Brain result through to the handler.
 *   3. Records a canonical `r183_brain_gate` audit line via `write_audit`.
 *   4. Never suppresses the handler's return value.
 *   5. Skips approval gate when `requireApprovalTier` is false or no company.
 */
import { describe, it, expect, vi } from "vitest";
import { enforceMutation } from "@/lib/founder/enforce";

function stubSupabase() {
  const audit: unknown[] = [];
  const sb = {
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
    rpc: vi.fn(async (_name: string, args: unknown) => {
      audit.push(args);
      return { data: null, error: null };
    }),
  };
  return { sb, audit };
}

describe("R183 Phase C — enforceMutation()", () => {
  it("runs Brain BEFORE the mutation body", async () => {
    const { sb } = stubSupabase();
    const order: string[] = [];
    const wrapped = enforceMutation(
      { action: "delete", entityType: "test_row", module: "test" },
      async ({ brain }) => {
        order.push("body");
        expect(brain).toBeDefined();
        expect(brain.intent).toBeTruthy();
        return { ok: true };
      },
    );
    const rpcOrig = sb.rpc;
    sb.rpc = vi.fn(async (n: string, a: unknown) => {
      order.push("brain-audit");
      return rpcOrig(n, a);
    }) as never;
    const res = await wrapped({
      data: { id: "x" },
      context: { userId: "u", supabase: sb as never, companyId: null },
    });
    expect(res).toEqual({ ok: true });
    expect(order).toEqual(["brain-audit", "body"]);
  });

  it("writes exactly one r183_brain_gate audit line per invocation", async () => {
    const { sb, audit } = stubSupabase();
    const wrapped = enforceMutation(
      { action: "publish", entityType: "app" },
      async () => "done",
    );
    await wrapped({
      data: {},
      context: { userId: "u", supabase: sb as never, companyId: null },
    });
    expect(audit.length).toBe(1);
    expect((audit[0] as any)._category).toBe("r183_brain_gate");
  });

  it("does not require an approval row when requireApprovalTier is false", async () => {
    const { sb } = stubSupabase();
    const wrapped = enforceMutation(
      { action: "update", entityType: "app" },
      async () => 42,
    );
    await expect(
      wrapped({
        data: {},
        context: { userId: "u", supabase: sb as never, companyId: null },
      }),
    ).resolves.toBe(42);
  });

  it("skips approval gate when no company scope, even if requireApprovalTier=true", async () => {
    const { sb } = stubSupabase();
    const wrapped = enforceMutation(
      { action: "publish", entityType: "app", requireApprovalTier: true },
      async () => "ok",
    );
    await expect(
      wrapped({
        data: {},
        context: { userId: "u", supabase: sb as never, companyId: null },
      }),
    ).resolves.toBe("ok");
  });

  it("propagates the handler's return value verbatim", async () => {
    const { sb } = stubSupabase();
    const payload = { list: [1, 2, 3], meta: { ok: true } };
    const wrapped = enforceMutation(
      { action: "list", entityType: "thing" },
      async () => payload,
    );
    const res = await wrapped({
      data: {},
      context: { userId: "u", supabase: sb as never, companyId: null },
    });
    expect(res).toBe(payload);
  });
});
