import { describe, it, expect } from "vitest";
import {
  DOCUMENTATION_TYPES, CHANGELOG_FIELDS, RELEASE_NOTES_SECTIONS,
  API_DOC_FIELDS, DATABASE_DOC_FIELDS, ARCHITECTURE_DOC_FIELDS,
  SECURITY_DOC_FIELDS, USER_DOC_FIELDS, DEVELOPER_DOC_FIELDS,
  FOUNDER_DOC_FIELDS, QUALITY_GATES, AI_REVIEW_AREAS, PIPELINE_STAGES,
  CANONICAL_OWNERS, R167_POLICY,
  requiredDocTypes, detectGates, runAiReview, evaluateDocumentation,
  type DocumentationRequest, type GeneratedDoc, type DocumentationType,
} from "@/lib/founder/documentation-engine";

const fullDoc = (type: DocumentationType): GeneratedDoc => ({
  type, path: `docs/${type}.md`, complete: true, reviewed: true,
});

const baseReq = (overrides: Partial<DocumentationRequest> = {}): DocumentationRequest => ({
  implementationId: "impl-1",
  founderId: "founder-1",
  affectsApi: false,
  affectsDatabase: false,
  affectsSecurity: false,
  affectsUi: false,
  affectsBusiness: false,
  docs: [],
  auditPresent: true,
  releaseNotes: { version: "1.0.0", sections: {} as never },
  changelog: {
    version: "1.0.0", date: "2026-07-19", founder: "f", summary: "s",
    files_changed: [], modules_changed: [], apis_changed: [], tables_changed: [],
    security_impact: "none", performance_impact: "none", rollback_available: true,
  },
  ...overrides,
});

describe("R167 — AI Documentation Engine™", () => {
  it("enumerates governance taxonomy", () => {
    expect(DOCUMENTATION_TYPES.length).toBe(15);
    expect(CHANGELOG_FIELDS.length).toBe(11);
    expect(RELEASE_NOTES_SECTIONS.length).toBe(7);
    expect(API_DOC_FIELDS.length).toBe(9);
    expect(DATABASE_DOC_FIELDS.length).toBe(7);
    expect(ARCHITECTURE_DOC_FIELDS.length).toBe(7);
    expect(SECURITY_DOC_FIELDS.length).toBe(7);
    expect(USER_DOC_FIELDS.length).toBe(6);
    expect(DEVELOPER_DOC_FIELDS.length).toBe(6);
    expect(FOUNDER_DOC_FIELDS.length).toBe(6);
    expect(QUALITY_GATES.length).toBe(6);
    expect(AI_REVIEW_AREAS.length).toBe(5);
    expect(PIPELINE_STAGES.length).toBe(10);
  });

  it("references canonical owners only (no V2)", () => {
    expect(CANONICAL_OWNERS).toContain("R158_ApprovalGateway");
    expect(CANONICAL_OWNERS).toContain("R166_RollbackRecovery");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
  });

  it("required doc types scale with change surface", () => {
    const base = requiredDocTypes(baseReq());
    expect(base).toEqual(expect.arrayContaining(["architecture", "developer", "founder", "release"]));
    const full = requiredDocTypes(baseReq({
      affectsApi: true, affectsDatabase: true, affectsSecurity: true, affectsUi: true,
    }));
    expect(full).toEqual(expect.arrayContaining(["api", "database", "migration", "security", "user"]));
  });

  it("detects missing docs and release notes as gates", () => {
    const gates = detectGates(baseReq({ releaseNotes: undefined }));
    expect(gates).toContain("documentation_missing");
    expect(gates).toContain("architecture_missing");
    expect(gates).toContain("release_notes_missing");
  });

  it("api/db/security gates fire only for their surfaces", () => {
    const gates = detectGates(baseReq({
      affectsApi: true, affectsDatabase: true, affectsSecurity: true,
      docs: [fullDoc("architecture"), fullDoc("developer"), fullDoc("founder"), fullDoc("release")],
    }));
    expect(gates).toEqual(expect.arrayContaining([
      "api_docs_missing", "database_docs_missing", "security_docs_missing",
    ]));
  });

  it("passes with complete docs across all surfaces", () => {
    const docs: GeneratedDoc[] = [
      "architecture", "developer", "founder", "release",
      "api", "database", "migration", "security", "user",
    ].map((t) => fullDoc(t as DocumentationType));
    const decision = evaluateDocumentation(baseReq({
      affectsApi: true, affectsDatabase: true, affectsSecurity: true, affectsUi: true, docs,
    }));
    expect(decision.gates).toEqual([]);
    expect(decision.recommendation).toBe("complete");
    expect(decision.presentation.aiReviewScore).toBeGreaterThanOrEqual(80);
  });

  it("blocks when documentation is missing", () => {
    const decision = evaluateDocumentation(baseReq());
    expect(decision.recommendation).toBe("block");
    expect(decision.gates.length).toBeGreaterThan(0);
  });

  it("AI review covers all five areas", () => {
    const review = runAiReview(baseReq({ docs: [fullDoc("architecture")] }));
    expect(review.map((r) => r.area).sort()).toEqual([...AI_REVIEW_AREAS].sort());
  });

  it("enforces compile-time locks and handoff", () => {
    const d = evaluateDocumentation(baseReq());
    expect(d.canAutoComplete).toBe(false);
    expect(d.handoffTarget).toBe("R158_ApprovalGateway");
    expect(d.reuseOnly).toBe(true);
    expect(d.newRuntime).toBe(false);
    expect(R167_POLICY.canAutoComplete).toBe(false);
    expect(R167_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R167_POLICY.newRuntime).toBe(false);
  });
});
