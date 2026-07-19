import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, RELEASE_TYPES, VERSION_KINDS, ROLLOUT_STRATEGIES,
  CHECKLIST_ITEMS, KPI_DIMENSIONS, INCIDENT_RISK_KINDS, POST_RELEASE_SIGNALS,
  REPORT_SECTIONS, FOUNDER_CONTROLS, PRIORITY_LEVELS, CANONICAL_OWNERS,
  EXECUTIVE_COUNCIL, HANDOFF_CHAIN, PIPELINE_STAGES, R177_POLICY,
  checklistMissing, checklistComplete, isValidSemver,
  scoreReadiness, releaseConfidence, scorePriority,
  detectRisks, computeKpis, recommend, evaluatePostRelease,
  councilConflicts, composeReleaseReport,
  type ReleaseCandidate,
} from "@/lib/founder/ai-release-director";

const good: ReleaseCandidate = {
  id: "r1", name: "Web 2.4.0", type: "website", version: "2.4.0",
  versionKind: "minor", rollout: "staged",
  checklist: Object.fromEntries(CHECKLIST_ITEMS.map((k) => [k, true])),
  scores: { quality: 92, stability: 90, performance: 88, security: 95, docCompleteness: 90, rollbackReadiness: 90, dependencyHealth: 88, compatibility: 90 },
};
const risky: ReleaseCandidate = {
  id: "r2", name: "API 3.0.0", type: "api", version: "3.0.0",
  versionKind: "major", rollout: "canary",
  checklist: { architecture_approved: true, qa_passed: true },
  scores: { quality: 45, stability: 50, performance: 55, security: 40, docCompleteness: 40, rollbackReadiness: 20, dependencyHealth: 40, compatibility: 45 },
  incidents30d: 4,
};
const founderPreview: ReleaseCandidate = {
  ...good, id: "r3", name: "Founder Dashboard", type: "founder_dashboard",
  rollout: "founder_preview", founderRequested: true,
};
const hotfix: ReleaseCandidate = {
  ...good, id: "r4", versionKind: "hotfix", scores: { ...good.scores, quality: 80 },
};

describe("R177 — AI Release Director™", () => {
  it("enumerates governance constants", () => {
    expect(RESPONSIBILITIES.length).toBe(10);
    expect(RELEASE_TYPES.length).toBe(9);
    expect(VERSION_KINDS.length).toBe(6);
    expect(ROLLOUT_STRATEGIES.length).toBe(7);
    expect(CHECKLIST_ITEMS.length).toBe(10);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(INCIDENT_RISK_KINDS.length).toBe(6);
    expect(POST_RELEASE_SIGNALS.length).toBe(6);
    expect(REPORT_SECTIONS.length).toBe(7);
    expect(FOUNDER_CONTROLS.length).toBe(7);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(10);
    expect(EXECUTIVE_COUNCIL.length).toBe(6);
    expect(CANONICAL_OWNERS.length).toBeGreaterThanOrEqual(30);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("locks governance policy", () => {
    expect(R177_POLICY.canDeploy).toBe(false);
    expect(R177_POLICY.canEditProduction).toBe(false);
    expect(R177_POLICY.canBypassApprovalGateway).toBe(false);
    expect(R177_POLICY.canAutoImplement).toBe(false);
    expect(R177_POLICY.newRuntime).toBe(false);
    expect(R177_POLICY.reuseOnly).toBe(true);
    expect(R177_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
  });

  it("checklist helpers", () => {
    expect(checklistComplete(good.checklist)).toBe(true);
    expect(checklistMissing(risky.checklist).length).toBeGreaterThan(0);
  });

  it("validates semver", () => {
    expect(isValidSemver("1.2.3")).toBe(true);
    expect(isValidSemver("1.2.3-rc.1")).toBe(true);
    expect(isValidSemver("not-a-version")).toBe(false);
  });

  it("scores readiness and confidence", () => {
    expect(scoreReadiness(good)).toBeGreaterThanOrEqual(85);
    expect(scoreReadiness(risky)).toBeLessThan(50);
    expect(releaseConfidence(risky)).toBeLessThan(releaseConfidence(good));
  });

  it("prioritizes with founder + urgency boosts", () => {
    expect(scorePriority(good)).toMatch(/p[0-3]/);
    expect(scorePriority(hotfix)).toBe("p0");
    expect(scorePriority(risky)).toMatch(/p[23]/);
  });

  it("detects risks by kind and severity", () => {
    const rs = detectRisks(risky);
    expect(rs.length).toBeGreaterThan(0);
    expect(rs.some((r) => r.kind === "rollback_risk" && r.severity === "critical")).toBe(true);
  });

  it("computes all KPI dimensions", () => {
    const k = computeKpis(good);
    for (const d of KPI_DIMENSIONS) expect(typeof k[d]).toBe("number");
    expect(k.overall_release_score).toBeGreaterThan(80);
  });

  it("recommendation routes through R158", () => {
    const r = recommend(good);
    expect(r.handoffTarget).toBe("R158_ApprovalGateway");
    expect(recommend(risky).kind).toBe("block");
    expect(recommend(hotfix).kind).toBe("release_canary");
    expect(recommend(founderPreview).kind).toBe("founder_preview_first");
  });

  it("evaluates post-release and recommends rollback when unsafe", () => {
    const ok = evaluatePostRelease({ health: 90, performance: 88, errors: 0, stability: 92, adoption: 70, rollbackRequests: 0 });
    expect(ok.rollbackRecommended).toBe(false);
    const bad = evaluatePostRelease({ health: 40, performance: 30, errors: 25, stability: 30, adoption: 20, rollbackRequests: 8 });
    expect(bad.rollbackRecommended).toBe(true);
  });

  it("surfaces council conflicts", () => {
    const c = councilConflicts({ cto: { blockingRisk: true, note: "arch drift" }, cfo: { blockingRisk: false } });
    expect(c.length).toBe(1);
    expect(c[0].member).toBe("R171_AI_CTO");
  });

  it("composes an executive release report", () => {
    const rep = composeReleaseReport([good, risky, hotfix, founderPreview], { coo: { blockingRisk: true, note: "ops window" } });
    expect(rep.module).toBe("R177_AI_ReleaseDirector");
    expect(rep.candidates).toBe(4);
    expect(rep.recommendations.length).toBe(4);
    expect(rep.checklistGaps.some((g) => g.candidateId === "r2" && g.missing.length > 0)).toBe(true);
    expect(rep.councilConflicts.some((c) => c.member === "R172_AI_COO")).toBe(true);
    expect(rep.handoffTarget).toBe("R158_ApprovalGateway");
    expect(rep.policy.canDeploy).toBe(false);
  });
});
