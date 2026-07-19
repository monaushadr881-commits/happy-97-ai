import { describe, it, expect } from "vitest";
import {
  THREAT_TYPES, SEVERITY, RESPONSE_ACTIONS, TIMELINE_FIELDS,
  ANTI_CREDIT_SIGNALS, ANTI_SESSION_SIGNALS, ANTI_EXTENSION_SIGNALS,
  ANTI_APK_SIGNALS, ANTI_AI_SIGNALS, ANTI_API_SIGNALS, ANTI_BOT_SIGNALS,
  OFFICER_BRIEFS, ALERT_CHANNELS, GUARDIAN_PIPELINE, GUARDIAN_META,
  severityForScore, responseForSeverity, shouldAlertFounder,
  shouldEnableSafeMode, classifyEvent, investigationSnapshot, summarizeEvents,
} from "@/lib/founder/guardian-ai";

describe("R160 — HAPPY Guardian AI™", () => {
  it("enumerates the canonical threat catalogue and constants", () => {
    expect(THREAT_TYPES.length).toBe(18);
    expect(SEVERITY.length).toBe(4);
    expect(RESPONSE_ACTIONS.length).toBe(9);
    expect(TIMELINE_FIELDS.length).toBe(13);
    expect(ANTI_CREDIT_SIGNALS.length).toBe(7);
    expect(ANTI_SESSION_SIGNALS.length).toBe(6);
    expect(ANTI_EXTENSION_SIGNALS.length).toBe(5);
    expect(ANTI_APK_SIGNALS.length).toBe(6);
    expect(ANTI_AI_SIGNALS.length).toBe(6);
    expect(ANTI_API_SIGNALS.length).toBe(6);
    expect(ANTI_BOT_SIGNALS.length).toBe(5);
    expect(OFFICER_BRIEFS.length).toBe(4);
    expect(ALERT_CHANNELS.length).toBe(4);
    expect(GUARDIAN_PIPELINE.length).toBe(8);
  });

  it("scores map to correct severities across the ladder", () => {
    expect(severityForScore(0)).toBe("low");
    expect(severityForScore(39)).toBe("low");
    expect(severityForScore(40)).toBe("medium");
    expect(severityForScore(70)).toBe("high");
    expect(severityForScore(95)).toBe("critical");
    expect(severityForScore(200)).toBe("critical");
  });

  it("privilege escalation and modified APK always trigger max response", () => {
    expect(responseForSeverity("critical", "privilege_escalation")).toBe("freeze_user");
    expect(responseForSeverity("high", "modified_apk")).toBe("require_founder_approval");
    expect(responseForSeverity("low", "credit_abuse")).toBe("warn");
    expect(responseForSeverity("medium", "api_abuse")).toBe("require_otp");
    expect(responseForSeverity("critical", "bot_network")).toBe("investigation_mode");
  });

  it("founder alerts fire only on high/critical", () => {
    expect(shouldAlertFounder("low")).toBe(false);
    expect(shouldAlertFounder("medium")).toBe(false);
    expect(shouldAlertFounder("high")).toBe(true);
    expect(shouldAlertFounder("critical")).toBe(true);
  });

  it("safe mode engages when thresholds are exceeded", () => {
    expect(shouldEnableSafeMode({ criticalLastHour: 0, highLastHour: 0 })).toBe(false);
    expect(shouldEnableSafeMode({ criticalLastHour: 10, highLastHour: 0 })).toBe(true);
    expect(shouldEnableSafeMode({ criticalLastHour: 0, highLastHour: 50 })).toBe(true);
  });

  it("classifyEvent produces a full timeline and investigation bundle", () => {
    const ev = classifyEvent({
      threat: "prompt_injection",
      score: 82,
      timeline: { who: "user_42", ip: "203.0.113.9", device: "chrome-mac" },
      now: new Date("2026-07-19T10:00:00Z"),
    });
    expect(ev.severity).toBe("high");
    expect(ev.response).toBe("require_founder_approval");
    expect(ev.alertFounder).toBe(true);
    expect(ev.timeline.who).toBe("user_42");
    expect(ev.timeline.risk).toBe(82);

    const snap = investigationSnapshot(ev);
    expect(snap.auditRequired).toBe(true);
    expect(snap.approvalRequired).toBe(true);
    expect(snap.evidenceFields.length).toBe(TIMELINE_FIELDS.length);
  });

  it("summarizeEvents rolls up counts and recommends safe mode", () => {
    const events = [
      classifyEvent({ threat: "bot_network", score: 95, timeline: {} }),
      classifyEvent({ threat: "bot_network", score: 92, timeline: {} }),
      classifyEvent({ threat: "credit_abuse", score: 50, timeline: {} }),
    ];
    const rpt = summarizeEvents("morning", events);
    expect(rpt.counts.critical).toBe(2);
    expect(rpt.counts.medium).toBe(1);
    expect(rpt.topThreats[0]).toBe("bot_network");
    expect(rpt.brief).toBe("morning");
  });

  it("guardian meta declares zero-duplication contract", () => {
    expect(GUARDIAN_META.createsNewRuntime).toBe(false);
    expect(GUARDIAN_META.createsNewTables).toBe(false);
    expect(GUARDIAN_META.duplicatesDetectionEngine).toBe(false);
    expect(GUARDIAN_META.threatCount).toBe(THREAT_TYPES.length);
  });
});
