import { describe, it, expect } from "vitest";
import {
  PERF_BUDGETS,
  grade,
  gradeAll,
  perfScore,
  planRouteLoading,
  planImage,
  cachePolicy,
  scanForDuplicateRuntimes,
  pipelineHotspots,
  pipelineTotal,
  buildPerfSnapshot,
} from "@/lib/happy-r144/performance";

describe("R144 · Production Performance & Optimization", () => {
  it("grades samples against budgets", () => {
    const pass = grade({ metric: "lcpMs", value: PERF_BUDGETS.lcpMs - 100 });
    const warn = grade({ metric: "lcpMs", value: PERF_BUDGETS.lcpMs * 1.1 });
    const fail = grade({ metric: "lcpMs", value: PERF_BUDGETS.lcpMs * 2 });
    expect(pass.status).toBe("pass");
    expect(warn.status).toBe("warn");
    expect(fail.status).toBe("fail");
  });

  it("perfScore weights warn less than pass and fail as zero", () => {
    const s = perfScore(
      gradeAll([
        { metric: "lcpMs", value: 1000 },       // pass
        { metric: "interactionMs", value: 110 }, // warn
        { metric: "initialJsKb", value: 500 },   // fail
      ]),
    );
    expect(s).toBeGreaterThan(50);
    expect(s).toBeLessThan(80);
  });

  it("planRouteLoading picks eager shell, preload post-login, lazy default", () => {
    expect(planRouteLoading("/").strategy).toBe("eager");
    expect(planRouteLoading("/auth/login").strategy).toBe("eager");
    expect(planRouteLoading("/dashboard", { authGate: true }).strategy).toBe("preload");
    expect(planRouteLoading("/founder/analytics", { heavy: true }).strategy).toBe("on-idle");
    expect(planRouteLoading("/settings/profile").strategy).toBe("lazy");
  });

  it("planImage promotes LCP to eager + high priority, uses AVIF/WebP", () => {
    const lcp = planImage({ role: "lcp", intrinsicWidth: 1600 });
    expect(lcp.loading).toBe("eager");
    expect(lcp.fetchpriority).toBe("high");
    expect(["avif", "webp"]).toContain(lcp.format);
    const thumb = planImage({ role: "thumbnail", intrinsicWidth: 800 });
    expect(thumb.width).toBeLessThanOrEqual(320);
    const svg = planImage({ role: "icon", intrinsicWidth: 64, isVector: true });
    expect(svg.format).toBe("svg");
  });

  it("cachePolicy scales stale/gc with data class", () => {
    expect(cachePolicy("static").staleTimeMs).toBeGreaterThan(cachePolicy("live").staleTimeMs);
    expect(cachePolicy("realtime").staleTimeMs).toBe(0);
    expect(cachePolicy("user").refetchOnFocus).toBe(true);
  });

  it("scanForDuplicateRuntimes flags -v2 siblings and passes clean paths", () => {
    const bad = scanForDuplicateRuntimes([
      "src/lib/cache-v2.ts",
      "src/lib/optimizer-v2/index.ts",
    ]);
    expect(bad.ok).toBe(false);
    expect(bad.offenders.length).toBe(2);
    const good = scanForDuplicateRuntimes([
      "src/lib/happy-runtime/cache.ts",
      "src/lib/brain/engine.ts",
    ]);
    expect(good.ok).toBe(true);
  });

  it("pipelineHotspots returns top N by ms and pipelineTotal sums", () => {
    const stages = [
      { stage: "retrieve", ms: 40 },
      { stage: "rank", ms: 120 },
      { stage: "generate", ms: 300 },
      { stage: "shape", ms: 20 },
    ];
    expect(pipelineTotal(stages)).toBe(480);
    const hot = pipelineHotspots(stages, 2);
    expect(hot[0].stage).toBe("generate");
    expect(hot[1].stage).toBe("rank");
  });

  it("buildPerfSnapshot assembles score, verdicts, hotspots, duplication", () => {
    const snap = buildPerfSnapshot({
      samples: [
        { metric: "lcpMs", value: 2100 },
        { metric: "initialJsKb", value: 210 },
      ],
      stages: [{ stage: "brain", ms: 200 }, { stage: "memory", ms: 80 }],
      scanPaths: ["src/lib/happy-runtime/cache.ts"],
    });
    expect(snap.score).toBe(100);
    expect(snap.verdicts).toHaveLength(2);
    expect(snap.hotspots[0].stage).toBe("brain");
    expect(snap.duplication.ok).toBe(true);
    expect(snap.generatedAt).toMatch(/T/);
  });
});
