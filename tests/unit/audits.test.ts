import { describe, expect, it } from "vitest";
import { evaluateQuality } from "@/lib/production/quality-audit";
import { evaluateSecurity } from "@/lib/production/security-audit";
import { evaluatePerf } from "@/lib/production/performance-audit";
import { evaluateReadiness } from "@/lib/production/production-readiness";
import { evaluateTesting } from "@/lib/production/testing";

describe("quality audit", () => {
  it("scores clean input at 100", () => {
    const r = evaluateQuality({ fileCount: 10, largestFileLines: 200, duplicateImports: 0, unusedImports: 0, circularDeps: 0 });
    expect(r.score).toBe(100);
    expect(r.issues).toHaveLength(0);
  });
  it("flags oversized files and duplicates", () => {
    const r = evaluateQuality({ fileCount: 1, largestFileLines: 20000, duplicateImports: 2, unusedImports: 50, circularDeps: 1 });
    expect(r.issues.length).toBe(4);
    expect(r.score).toBeLessThan(100);
  });
});

describe("security audit", () => {
  it("clean config passes", () => {
    const r = evaluateSecurity({ tables: 5, tablesWithRls: 5, tablesWithGrants: 5, publicEndpoints: 2, publicEndpointsWithSignatureCheck: 2, missingRequiredSecrets: [] });
    expect(r.score).toBe(100);
    expect(r.criticals).toHaveLength(0);
  });
  it("critical when RLS missing", () => {
    const r = evaluateSecurity({ tables: 5, tablesWithRls: 3, tablesWithGrants: 5, publicEndpoints: 0, publicEndpointsWithSignatureCheck: 0, missingRequiredSecrets: [] });
    expect(r.criticals.some((c) => c.includes("RLS"))).toBe(true);
  });
  it("warns on missing secrets", () => {
    const r = evaluateSecurity({ tables: 1, tablesWithRls: 1, tablesWithGrants: 1, publicEndpoints: 0, publicEndpointsWithSignatureCheck: 0, missingRequiredSecrets: ["STRIPE"] });
    expect(r.warnings[0]).toContain("STRIPE");
  });
});

describe("performance audit", () => {
  it("passes with good vitals", () => {
    const r = evaluatePerf({ lcpMs: 1800, inpMs: 100, cls: 0.02, tbtMs: 100, routeJsKb: 120 });
    expect(r.fails).toHaveLength(0);
    expect(r.score).toBe(100);
  });
  it("catches each threshold breach", () => {
    const r = evaluatePerf({ lcpMs: 3000, inpMs: 300, cls: 0.3, tbtMs: 400, routeJsKb: 500 });
    expect(r.fails).toHaveLength(5);
    expect(r.score).toBe(25);
  });
});

describe("production readiness", () => {
  it("grade A when clean", () => {
    const r = evaluateReadiness({
      routes: 10, serverFns: 10, migrations: 5,
      hasHealthEndpoint: true, hasErrorBoundaries: true, hasNotFoundBoundaries: true,
      supabaseLinterErrors: 0, supabaseLinterWarnings: 0, typecheckSeconds: 30,
    });
    expect(r.grade).toBe("A");
  });
  it("blockers drive grade down", () => {
    const r = evaluateReadiness({
      routes: 1, serverFns: 1, migrations: 1,
      hasHealthEndpoint: false, hasErrorBoundaries: false, hasNotFoundBoundaries: false,
      supabaseLinterErrors: 3, supabaseLinterWarnings: 2, typecheckSeconds: 90,
    });
    expect(r.blockers.length).toBeGreaterThanOrEqual(3);
    expect(["C", "D"]).toContain(r.grade);
  });
});

describe("testing coverage", () => {
  it("reports zero when nothing covered", () => {
    const r = evaluateTesting({ unitFiles: 0, smokeRoutes: 0, totalRoutes: 10, a11yRoutes: 0, playwrightFlows: 0 });
    expect(r.routeCoveragePct).toBe(0);
    expect(r.a11yCoveragePct).toBe(0);
  });
  it("proportional coverage", () => {
    const r = evaluateTesting({ unitFiles: 5, smokeRoutes: 5, totalRoutes: 10, a11yRoutes: 2, playwrightFlows: 3 });
    expect(r.routeCoveragePct).toBe(50);
    expect(r.a11yCoveragePct).toBe(20);
    expect(r.score).toBeGreaterThan(0);
  });
});
