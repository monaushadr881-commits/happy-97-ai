/**
 * R139 — Founder Dashboard UI Completion.
 * Verifies the pure alert prioritiser added to canonical founder-dashboard.
 */
import { describe, it, expect } from "vitest";
import {
  buildFounderAlerts,
  countAlertsBySeverity,
  type ServiceHealth,
  type AnalyticsSnapshot,
  type ArchitectureAudit,
} from "@/lib/happy-r130/founder-dashboard";

const svc = (over: Partial<ServiceHealth>): ServiceHealth => ({
  kind: "brain",
  availability: 1,
  errorRate: 0,
  latencyP95Ms: 100,
  updatedAt: 1,
  ...over,
});

const snap = (over: Partial<AnalyticsSnapshot> = {}): AnalyticsSnapshot => ({
  dau: 100, mau: 1000, companies: 5, workspaces: 10, projects: 3, files: 20,
  aiTokens: 500, creditsUsedMinor: 0, activeSubscriptions: 4, revenueMinor: 10000,
  creatorPublishes: 0, commSent: 0, at: 1_700_000_000_000, ...over,
});

describe("R139 buildFounderAlerts", () => {
  it("returns no alerts when everything is healthy and flat", () => {
    const alerts = buildFounderAlerts({ services: [svc({})], cur: snap(), prev: snap() });
    expect(alerts.length).toBe(0);
  });

  it("emits critical for major-outage service", () => {
    const alerts = buildFounderAlerts({
      services: [svc({ kind: "revenue", availability: 0.5, errorRate: 0.5, latencyP95Ms: 5000 })],
      cur: snap(),
      prev: snap(),
    });
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].source).toBe("health");
  });

  it("prioritises critical > high > medium > low", () => {
    const arch: ArchitectureAudit = {
      duplicates: [{ capability: "x", files: ["a"] }],
      orphanModules: [], missingDocs: [], registryDrift: [],
      brokenTests: 3, buildOk: false,
    };
    const alerts = buildFounderAlerts({
      services: [svc({ availability: 0.98, errorRate: 0.05, latencyP95Ms: 4000 })],
      cur: snap({ revenueMinor: 500 }),
      prev: snap({ revenueMinor: 1000 }),
      architecture: arch,
    });
    const ranks = alerts.map((a) => a.severity);
    // First alert should be critical (build failing or revenue drop -50%).
    expect(ranks[0]).toBe("critical");
    // Sorted non-decreasing severity rank.
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    for (let i = 1; i < ranks.length; i++) {
      expect(order[ranks[i]]).toBeGreaterThanOrEqual(order[ranks[i - 1]]);
    }
  });

  it("counts alerts by severity", () => {
    const alerts = buildFounderAlerts({
      services: [
        svc({ kind: "brain", availability: 0.5, errorRate: 0.5, latencyP95Ms: 100 }),
        svc({ kind: "search", availability: 0.98, errorRate: 0.05, latencyP95Ms: 4000 }),
      ],
      cur: snap(), prev: snap(),
    });
    const counts = countAlertsBySeverity(alerts);
    expect(counts.critical + counts.high + counts.medium + counts.low).toBe(alerts.length);
  });
});
