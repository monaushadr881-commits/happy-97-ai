import { describe, it, expect } from "vitest";
import {
  classifyQuery, pickDomains, extractTimeWindow, rankResults, mergeDomainResults,
  suggestFor, shouldSearchOcr, planVoiceSearch, resolveForBrain, analyticsSnapshot,
  SEARCH_DOMAINS, type SearchCandidate,
} from "@/lib/happy-r120/search-intelligence";

describe("R120 Search Intelligence", () => {
  it("covers 17 universal domains", () => {
    expect(SEARCH_DOMAINS.length).toBe(17);
  });

  it("classifies query modes", () => {
    expect(classifyQuery("invoices")).toBe("keyword");
    expect(classifyQuery("open latest deck")).toBe("semantic");
    expect(classifyQuery("what is the roadmap?")).toBe("natural");
    expect(classifyQuery("show invoices from last month for acme")).toBe("hybrid");
  });

  it("picks domains from intent", () => {
    expect(pickDomains("show invoices from last month")).toEqual(expect.arrayContaining(["analytics", "files"]));
    expect(pickDomains("find AI agents related to CRM")).toEqual(expect.arrayContaining(["agents"]));
    expect(pickDomains("open latest investor presentation")).toEqual(expect.arrayContaining(["files"]));
    expect(pickDomains("hello world").length).toBeGreaterThan(0); // default sweep
  });

  it("extracts time windows", () => {
    expect(extractTimeWindow("show invoices from last month")?.label).toBe("month");
    expect(extractTimeWindow("what happened today")?.label).toBe("today");
    expect(extractTimeWindow("random query")).toBeUndefined();
  });

  it("ranks with permission, workspace, recency, pinned", () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const cands: SearchCandidate[] = [
      { id: "a", domain: "files", title: "A", score: 0.5, permission: "workspace", workspaceId: "w1", updatedAt: now.toISOString() },
      { id: "b", domain: "files", title: "B", score: 0.5, permission: "denied" },
      { id: "c", domain: "files", title: "C", score: 0.5, permission: "own", pinned: true },
    ];
    const out = rankResults(cands, { now, workspaceId: "w1" });
    expect(out.find((r) => r.id === "b")).toBeUndefined();
    expect(out[0].id).toBe("c"); // pinned + own wins
  });

  it("merges multi-domain results", () => {
    const merged = mergeDomainResults({
      files: [{ id: "f1", domain: "files", title: "F", score: 0.6 }],
      chats: [{ id: "c1", domain: "chats", title: "C", score: 0.9 }],
    });
    expect(merged[0].id).toBe("c1");
  });

  it("produces instant suggestions", () => {
    const s = suggestFor({ q: "inv", recents: ["invoices Q3"], memoryTopics: ["invoice pipeline"] });
    expect(s.some((x) => x.kind === "recent")).toBe(true);
    expect(s.some((x) => x.kind === "ai")).toBe(true);
  });

  it("routes OCR only when files in scope and query hints scan", () => {
    expect(shouldSearchOcr("find receipt scan", ["files"])).toBe(true);
    expect(shouldSearchOcr("find receipt scan", ["chats"])).toBe(false);
    expect(shouldSearchOcr("hello", ["files"])).toBe(false);
  });

  it("plans voice search + brain resolver", () => {
    const v = planVoiceSearch("show invoices from last month");
    expect(v.digitalHumanExplain).toBe(true);
    expect(v.domains.length).toBeGreaterThan(0);

    const b = resolveForBrain("open latest investor presentation", { workspaceId: "w1" });
    expect(b.mode).not.toBe("keyword");
    expect(b.workspaceId).toBe("w1");
  });

  it("emits analytics snapshot", () => {
    const snap = analyticsSnapshot([
      { q: "invoices", domains: ["files"], latencyMs: 120, resultCount: 3, clicked: true, at: "" },
      { q: "invoices", domains: ["files"], latencyMs: 200, resultCount: 0, at: "" },
    ]);
    expect(snap.total).toBe(2);
    expect(snap.success).toBe(1);
    expect(snap.failure).toBe(1);
    expect(snap.avgLatency).toBe(160);
    expect(snap.topQueries[0].key).toBe("invoices");
  });
});
