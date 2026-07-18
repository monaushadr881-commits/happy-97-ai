import { describe, it, expect } from "vitest";
import {
  classify, autoTag, prioritize, summarize,
  dedupeCandidates, detectConflicts,
  confidenceScore, assertMemoryPermission,
  recallPlan, groupTimeline, analyticsSnapshot,
  influenceDigitalHuman, seedFromBrainTurn, toCategory,
} from "@/lib/memory/intelligence";

describe("R116 — Memory Intelligence (pure helpers)", () => {
  it("classify routes finance keywords to kind=finance with confidential sensitivity", () => {
    const r = classify({ text: "P&L for Q3 with GST returns", hint: { company_id: "c1" } });
    expect(r.kind).toBe("finance");
    expect(r.scope).toBe("company");
    expect(r.sensitivity).toBe("confidential");
    expect(r.tags).toContain("finance");
    expect(r.importance).toBeGreaterThanOrEqual(2);
    expect(r.summary.length).toBeGreaterThan(0);
  });

  it("classify falls back to personal + ai_inferred for unmatched text", () => {
    const r = classify({ text: "just a thought" });
    expect(r.scope).toBe("personal");
    expect(r.confidence).toBe("ai_inferred");
  });

  it("prioritize boosts founder + critical keywords", () => {
    expect(prioritize("critical outage blocker", "founder", true)).toBe(5);
    expect(prioritize("hi", "personal", false)).toBe(1);
  });

  it("summarize returns first sentence, capped", () => {
    const s = summarize("First sentence. Second one.", 240);
    expect(s).toBe("First sentence.");
    expect(summarize("x".repeat(300), 50)).toHaveLength(50);
  });

  it("autoTag extracts hashtags, capitalized entities, and hint markers", () => {
    const tags = autoTag("Meeting with Acme about #q4-planning", { founder_mode: true });
    expect(tags).toContain("founder");
    expect(tags).toContain("q4-planning");
    expect(tags).toContain("acme");
  });

  it("dedupeCandidates finds near-duplicate rows", () => {
    const rows: any[] = [
      { id: "1", title: "Invoice for Acme", body: "Amount 5000", kind: "finance", scope: "company" },
      { id: "2", title: "Totally different topic", body: "unrelated", kind: "personal", scope: "personal" },
    ];
    const dupes = dedupeCandidates({ title: "Invoice for Acme", body: "Amount 5000" }, rows, 0.5);
    expect(dupes.map((d: any) => d.id)).toContain("1");
    expect(dupes.map((d: any) => d.id)).not.toContain("2");
  });

  it("detectConflicts flags divergent statements on the same entity", () => {
    const rows: any[] = [
      { id: "a", title: "Deal closed won", body: "signed contract", entity_type: "deal", entity_id: "d1" },
      { id: "b", title: "Prospect lost interest",   body: "silent for weeks", entity_type: "deal", entity_id: "d1" },
    ];
    const c = detectConflicts(rows);
    expect(c.length).toBeGreaterThan(0);
    expect(c[0].entity).toBe("deal:d1");
  });

  it("confidenceScore maps state → level", () => {
    expect(confidenceScore({ id: "x", archived: true } as any).level).toBe("archived");
    expect(confidenceScore({ id: "x", expires_at: "2000-01-01" } as any).level).toBe("expired");
    expect(confidenceScore({ id: "x", metadata: { source: "user" } } as any).level).toBe("user_confirmed");
    expect(confidenceScore({ id: "x", importance: 5, pinned: true } as any).score).toBeGreaterThan(0.7);
  });

  it("assertMemoryPermission blocks founder-forget and cross-scope writes", () => {
    expect(() => assertMemoryPermission({ userId: "u", isCompanyMember: true, isWorkspaceMember: false }, "write",
      { scope: "workspace", kind: "workspace" })).toThrow(/workspace/);
    expect(() => assertMemoryPermission({ userId: "u", isFounder: true }, "forget",
      { scope: "personal", kind: "founder" })).toThrow(/founder knowledge/);
    // Founder writing founder-scope OK
    expect(() => assertMemoryPermission({ userId: "u", isFounder: true }, "write",
      { scope: "personal", kind: "founder" })).not.toThrow();
  });

  it("recallPlan picks scopes and kinds contextually", () => {
    const p = recallPlan({ workspace_id: "w", company_id: "c", founder_mode: true });
    expect(p.scopes).toEqual(expect.arrayContaining(["personal", "workspace", "company"]));
    expect(p.kinds).toEqual(expect.arrayContaining(["founder", "project", "conversation"]));
  });

  it("groupTimeline groups events by day desc", () => {
    const g = groupTimeline([
      { occurred_at: "2026-07-18T10:00:00Z", event_type: "x", summary: "a" },
      { occurred_at: "2026-07-18T12:00:00Z", event_type: "x", summary: "b" },
      { occurred_at: "2026-07-17T09:00:00Z", event_type: "x", summary: "c" },
    ]);
    expect(g[0].day).toBe("2026-07-18");
    expect(g[0].count).toBe(2);
    expect(g[1].day).toBe("2026-07-17");
  });

  it("analyticsSnapshot computes accuracy + duplicate rate", () => {
    const rows: any[] = [
      { id: "1", title: "Same thing", body: "same body", created_at: "2026-07-15T00:00:00Z" },
      { id: "2", title: "Same thing", body: "same body", created_at: "2026-07-16T00:00:00Z" },
      { id: "3", title: "Unique",    body: "unique",    created_at: "2026-07-17T00:00:00Z" },
    ];
    const a = analyticsSnapshot(rows, [
      { event_type: "memory.hit", metadata: { latency_ms: 40 } },
      { event_type: "memory.hit", metadata: { latency_ms: 60 } },
      { event_type: "memory.miss" },
    ]);
    expect(a.total).toBe(3);
    expect(a.recall_accuracy).toBeCloseTo(2 / 3, 2);
    expect(a.duplicate_rate).toBeGreaterThan(0);
    expect(a.avg_latency_ms).toBe(50);
  });

  it("influenceDigitalHuman produces empty suggestions when no rows (no fabrication)", () => {
    const dh = influenceDigitalHuman([], "guest");
    expect(dh.suggestions).toEqual([]);
    expect(dh.roadmapSeed).toEqual([]);
    expect(dh.gestureHint).toBe("wave");
  });

  it("influenceDigitalHuman biases emotion by content", () => {
    const rows: any[] = [
      { id: "1", kind: "conversation", scope: "personal", title: "urgent outage on API" as string, importance: 5 },
      { id: "2", kind: "project", scope: "workspace", title: "Roadmap Q4", pinned: true, importance: 4 },
    ];
    const dh = influenceDigitalHuman(rows, "founder");
    expect(dh.emotion).toBe("concerned");
    expect(dh.roadmapSeed).toContain("Roadmap Q4");
  });

  it("seedFromBrainTurn produces a valid MemoryStoreInput seed", () => {
    const seed = seedFromBrainTurn({
      text: "Summarize revenue", reply: "Revenue is up 12%",
      company_id: "c", workspace_id: null, founder_mode: true,
      session_id: "s1", agents: ["revenue-analyst"],
    });
    expect(seed.kind).toBe("conversation");
    expect(seed.tags).toContain("brain");
    expect(seed.sensitivity).toBe("confidential");
    expect(seed.metadata?.session_id).toBe("s1");
  });

  it("toCategory covers all Phase 3 buckets", () => {
    expect(toCategory({ kind: "founder", scope: "personal", archived: false, expires_at: null, tags: [] })).toBe("founder");
    expect(toCategory({ kind: "personal", scope: "personal", archived: true, expires_at: null, tags: [] })).toBe("archived");
    expect(toCategory({ kind: "ai", scope: "personal", archived: false, expires_at: null, tags: ["learning"] })).toBe("learning");
    expect(toCategory({ kind: "conversation", scope: "personal", archived: false, expires_at: null, tags: [] })).toBe("conversation");
    expect(toCategory({ kind: "workspace", scope: "workspace", archived: false, expires_at: null, tags: [] })).toBe("workspace");
    expect(toCategory({ kind: "personal", scope: "personal", archived: false, expires_at: "2000-01-01", tags: [] })).toBe("temporary");
  });
});
