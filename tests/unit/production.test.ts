import { describe, it, expect } from "vitest";
import { evaluatePerf } from "@/lib/production/performance-audit";
import { evaluateDeploy } from "@/lib/production/deployment-readiness";

describe("performance audit", () => {
  it("perfect scores when all budgets pass", () => {
    const r = evaluatePerf({ lcpMs: 1000, inpMs: 50, cls: 0.05, tbtMs: 100, routeJsKb: 100 });
    expect(r.fails).toEqual([]);
    expect(r.score).toBe(100);
  });
  it("flags each failing budget individually", () => {
    const r = evaluatePerf({ lcpMs: 3000, inpMs: 300, cls: 0.2, tbtMs: 300, routeJsKb: 300 });
    expect(r.fails.length).toBe(5);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
  it("score never below zero", () => {
    const r = evaluatePerf({ lcpMs: 9999, inpMs: 999, cls: 5, tbtMs: 9999, routeJsKb: 9999 });
    expect(r.score).toBe(Math.max(0, 100 - 5 * 15));
  });
});

describe("deployment readiness", () => {
  const good: any = {
    domainConfigured: true, sslActive: true, cdnActive: true,
    monitoringActive: true, rollbackAvailable: true, backupsActive: true,
    storeCredentials: { googlePlay: false, appStore: false, microsoft: false, amazon: false, samsung: false, huawei: false },
  };

  it("web ready when infra all set", () => {
    const r = evaluateDeploy(good);
    expect(r.webReady).toBe(true);
    expect(r.blockers).toEqual([]);
  });
  it("lists every missing infra piece", () => {
    const r = evaluateDeploy({ ...good, domainConfigured: false, sslActive: false });
    expect(r.blockers).toEqual(expect.arrayContaining([
      expect.stringMatching(/domain/i),
      expect.stringMatching(/ssl/i),
    ]));
    expect(r.webReady).toBe(false);
  });
  it("store readiness mirrors credentials", () => {
    const r = evaluateDeploy({ ...good, storeCredentials: { ...good.storeCredentials, googlePlay: true } });
    expect(r.storeReady.googlePlay).toBe(true);
    expect(r.storeReady.appStore).toBe(false);
  });
});
