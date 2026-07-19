/**
 * R183 Phase B — Universal HAPPY Brain™ gate tests.
 *
 * Verifies `withBrain()` fulfills the invariants of the R183 mission:
 *   1. Runs the canonical Brain (or lite fallback) BEFORE the caller proceeds.
 *   2. Never throws for AI-entry callers — always returns a result.
 *   3. Writes exactly one canonical `write_audit` row per invocation when a
 *      supabase client is available (best-effort otherwise).
 *   4. Falls back to `intent.classify` when no company scope is provided,
 *      so the "Understand" stage remains universal across every AI entry.
 *   5. Exposes clarification requests so callers can short-circuit safely.
 *   6. Attaches the full canonical Executive Board snapshot for audit.
 */
import { describe, it, expect, vi } from "vitest";
import { withBrain, EXECUTIVE_BOARD } from "@/lib/founder/enforce";

function stubSupabase() {
  const auditCalls: unknown[] = [];
  const sb = {
    from: () => ({ insert: () => Promise.resolve({ error: null }) }),
    rpc: vi.fn(async (_name: string, args: unknown) => {
      auditCalls.push(args);
      return { data: null, error: null };
    }),
  };
  return { sb, auditCalls };
}

describe("R183 Phase B — withBrain()", () => {
  it("runs lite classifier when no company scope is provided", async () => {
    const { sb, auditCalls } = stubSupabase();
    const res = await withBrain(
      { userId: "u_1", supabase: sb as never, companyId: null },
      { input: "help me publish", source: "chat", module: "happy-chat" },
    );
    expect(res.brainRan).toBe(false);
    expect(res.intent).toBeTruthy();
    expect(res.auditWritten).toBe(true);
    expect(auditCalls.length).toBe(1);
    expect((auditCalls[0] as any)._category).toBe("r183_brain_gate");
    expect((auditCalls[0] as any)._action).toBe("ai_entry.chat");
  });

  it("attaches the full Executive Board snapshot", async () => {
    const { sb } = stubSupabase();
    const res = await withBrain(
      { userId: "u_1", supabase: sb as never, companyId: null },
      { input: "hello", source: "voice", module: "dh-tts" },
    );
    expect(Object.keys(res.boardSnapshot).sort()).toEqual(Object.keys(EXECUTIVE_BOARD).sort());
  });

  it("does not throw when supabase is absent (public-entry path)", async () => {
    const res = await withBrain(
      { userId: null, supabase: undefined, companyId: null },
      { input: "what can you do", source: "chat", module: "public" },
    );
    expect(res.auditWritten).toBe(false);
    expect(res.brainRan).toBe(false);
    expect(res.intent).toBeTruthy();
  });

  it("swallows audit failures (best-effort)", async () => {
    const sb = {
      from: () => ({ insert: () => Promise.resolve({ error: null }) }),
      rpc: vi.fn(async () => { throw new Error("audit down"); }),
    };
    const res = await withBrain(
      { userId: "u_1", supabase: sb as never, companyId: null },
      { input: "x", source: "api", module: "test" },
    );
    expect(res.auditWritten).toBe(false);
    expect(res.intent).toBeTruthy();
  });

  it("returns clarify=false by default for non-ambiguous input", async () => {
    const { sb } = stubSupabase();
    const res = await withBrain(
      { userId: "u_1", supabase: sb as never, companyId: null },
      { input: "list my apps", source: "chat" },
    );
    expect(res.clarify).toBe(false);
    expect(res.clarification).toBeNull();
  });
});
