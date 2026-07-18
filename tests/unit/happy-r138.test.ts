import { describe, it, expect } from "vitest";
import {
  planHybridSearch, planVectorSearch, fuseRanks,
  resolveSemantic, resolveKnowledge, resolveMemory, resolveWorkspace,
  resolveConversation, resolveFiles, resolveEntities, resolveRelationships,
  resolveContext, resolveForBrain, isSingleOwner, R138_RESOLVERS,
} from "@/lib/happy-r138/semantic-knowledge";

describe("R138 Semantic Knowledge Intelligence", () => {
  it("plans hybrid search with keyword-only by default", () => {
    const p = planHybridSearch("invoices from last month");
    expect(p.keyword.enabled).toBe(true);
    expect(p.vector.enabled).toBe(false);
    expect(p.fuse.keywordWeight).toBe(1);
    expect(p.time?.label).toBe("month");
  });

  it("enables vector when ctx.enableVector and mode non-keyword", () => {
    const p = planHybridSearch("what is the roadmap?", { enableVector: true });
    expect(p.vector.enabled).toBe(true);
    expect(p.fuse.vectorWeight).toBeGreaterThan(0);
  });

  it("planVectorSearch returns architecture-ready plan (not live)", () => {
    const v = planVectorSearch("memory", { workspaceId: "w1" });
    expect(v?.ready).toBe(false);
    expect(v?.table).toBe("memory_items");
    expect(v?.filter.workspace_id).toBe("w1");
    expect(planVectorSearch("agents")).toBeNull();
  });

  it("fuseRanks merges via RRF", () => {
    const a = [{ id: "x" }, { id: "y" }];
    const b = [{ id: "y" }, { id: "z" }];
    const out = fuseRanks(a, b);
    expect(out[0].id).toBe("y");
    expect(out.length).toBe(3);
  });

  it("exposes all resolvers", () => {
    expect(R138_RESOLVERS.length).toBe(7);
    const s = resolveSemantic({ q: "open latest deck for acme" });
    expect(s.plan.domains.length).toBeGreaterThan(0);
    expect(resolveKnowledge({ q: "policy" }).domain).toBe("knowledge");
    expect(resolveMemory({ q: "meeting notes" }).domain).toBe("memory");
    expect(resolveWorkspace({ q: "project alpha", ctx: { workspaceId: "w1" } }).scope.workspaceId).toBe("w1");
    expect(resolveConversation({ q: "hi", ctx: { conversationId: "c1" } }).conversationId).toBe("c1");
    expect(resolveFiles({ q: "receipt scan", ctx: { scopedFileIds: ["f1"] } }).ocr).toBe(true);
  });

  it("extracts entities and relationships", () => {
    const e = resolveEntities("Acme Corp related to Globex");
    expect(e.names).toContain("Acme Corp");
    const r = resolveRelationships("Acme related to Globex");
    expect(r.relation).toBe("related to");
    expect(r.from).toBeTruthy();
    expect(r.to).toBeTruthy();
  });

  it("resolveContext bundles all sources", () => {
    const b = resolveContext({ q: "invoices for Acme", ctx: { workspaceId: "w1", conversationId: "c1" } });
    expect(b.plan).toBeDefined();
    expect(b.knowledge.domain).toBe("knowledge");
    expect(b.memory.domain).toBe("memory");
    expect(b.workspace.domain).toBe("workspace");
    expect(b.conversation.domain).toBe("chats");
    expect(b.files.domain).toBe("files");
  });

  it("resolveForBrain composes retrieval hint", () => {
    const h = resolveForBrain("show invoices from last month", { workspaceId: "w1", conversationId: "c1" });
    expect(h.workspaceId).toBe("w1");
    expect(h.sources.workspace).toBe(true);
    expect(h.sources.conversation).toBe(true);
  });

  it("verifies single-owner invariants", () => {
    const s = isSingleOwner();
    expect(s.ok).toBe(true);
    expect(s.owners.search).toContain("search.service.ts");
    expect(s.owners.brain).toContain("kernel");
    expect(s.owners.memory).toContain("memory/intelligence");
  });
});
