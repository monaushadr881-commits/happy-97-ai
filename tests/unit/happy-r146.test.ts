import { describe, it, expect } from "vitest";
import {
  rollup,
  checkSecurity,
  checkRuntimePillars,
  checkPerformance,
  checkAdapters,
  checkDeployment,
  buildReadinessReport,
  RUNTIME_PILLARS,
} from "@/lib/happy-r146/hardening";

describe("R146 · Production Hardening", () => {
  it("rollup escalates to worst verdict", () => {
    expect(rollup([{ id: "a", area: "x", verdict: "ready", note: "" }])).toBe("ready");
    expect(
      rollup([
        { id: "a", area: "x", verdict: "ready", note: "" },
        { id: "b", area: "x", verdict: "configuration_required", note: "" },
      ]),
    ).toBe("configuration_required");
    expect(
      rollup([
        { id: "a", area: "x", verdict: "configuration_required", note: "" },
        { id: "b", area: "x", verdict: "blocked", note: "" },
      ]),
    ).toBe("blocked");
  });

  it("security check blocks on RLS gap or missing hardening", () => {
    const res = checkSecurity({
      rlsEnabledTables: 40,
      totalPublicTables: 42,
      cronAuthEnforced: true,
      ttsRateLimited: true,
      postgrestSanitized: true,
      auditLogImmutable: true,
      secretsPresent: ["A"],
      requiredSecrets: ["A", "B"],
    });
    expect(res.find((r) => r.id === "sec.rls")?.verdict).toBe("blocked");
    expect(res.find((r) => r.id === "sec.secrets")?.verdict).toBe("configuration_required");
  });

  it("all pillars have owners when provided", () => {
    const owners = Object.fromEntries(
      RUNTIME_PILLARS.map((p) => [p, `src/lib/${p}`]),
    ) as Record<(typeof RUNTIME_PILLARS)[number], string>;
    const res = checkRuntimePillars(owners);
    expect(res.every((r) => r.verdict === "ready")).toBe(true);
  });

  it("performance verdict tiers", () => {
    expect(checkPerformance(95).verdict).toBe("ready");
    expect(checkPerformance(80).verdict).toBe("configuration_required");
    expect(checkPerformance(50).verdict).toBe("blocked");
  });

  it("adapters flag external-only as blocked", () => {
    const res = checkAdapters([
      { name: "stripe", family: "payments", hasSecret: false, hasSandbox: true },
      { name: "openai", family: "ai", hasSecret: true, hasSandbox: false },
      { name: "twilio", family: "comms", hasSecret: false, hasSandbox: false, externalOnly: true },
    ]);
    expect(res[0].verdict).toBe("configuration_required");
    expect(res[1].verdict).toBe("ready");
    expect(res[2].verdict).toBe("blocked");
  });

  it("deployment env gap → configuration_required", () => {
    const res = checkDeployment({
      envVars: ["SUPABASE_URL"],
      requiredEnv: ["SUPABASE_URL", "LOVABLE_API_KEY"],
      healthEndpoint: true,
      rollbackReady: true,
      backupsEnabled: true,
      ciGreen: true,
    });
    expect(res.find((r) => r.id === "deploy.env")?.verdict).toBe("configuration_required");
  });

  it("readiness report separates externals from critical", () => {
    const report = buildReadinessReport([
      { id: "sec.rls", area: "security", verdict: "ready", note: "ok" },
      {
        id: "adapter.comms.twilio",
        area: "adapters",
        verdict: "blocked",
        note: "external dependency — awaiting provider credentials",
      },
      { id: "deploy.ci", area: "deployment", verdict: "blocked", note: "tests red" },
    ]);
    expect(report.critical.map((c) => c.id)).toEqual(["deploy.ci"]);
    expect(report.externalDependencies.map((c) => c.id)).toEqual(["adapter.comms.twilio"]);
    expect(report.verdict).toBe("blocked");
  });
});
