/**
 * HAPPY X Kernel — Feature Flag System
 *
 * Runtime toggles with sensible defaults, per-user overrides (localStorage),
 * and event emission so subscribers can react without polling.
 *
 * Includes reservations for the v2.0 – v6.0 roadmap so future modules can be
 * enabled without touching the kernel or shipping a schema migration.
 */

import { eventBus } from "./event-bus";
import { logger } from "./logger";

export type FeatureFlagKey =
  // v1.0 — current
  | "assistant.streaming"
  | "assistant.voice"
  | "studio.image"
  | "studio.video"
  | "studio.music"
  | "marketplace.checkout"
  | "community.groups"
  | "enterprise.audit"
  | "knowledge.semanticSearch"
  | "notifications.push"
  // v2.0 — Agent OS & Developer Platform (reserved)
  | "roadmap.v2.agentOs"
  | "roadmap.v2.multiAgent"
  | "roadmap.v2.autonomousTasks"
  | "roadmap.v2.workflowAutomation"
  | "roadmap.v2.pluginMarketplace"
  | "roadmap.v2.developerPlatform"
  | "roadmap.v2.sdk"
  | "roadmap.v2.publicApis"
  | "roadmap.v2.skillsMarketplace"
  | "roadmap.v2.promptMarketplace"
  | "roadmap.v2.enterpriseExtensions"
  // v3.0 — Enterprise Intelligence (reserved)
  | "roadmap.v3.predictiveAnalytics"
  | "roadmap.v3.executiveAdvisor"
  | "roadmap.v3.forecasting"
  | "roadmap.v3.scenarioPlanning"
  | "roadmap.v3.aiReports"
  | "roadmap.v3.aiInsights"
  | "roadmap.v3.decisionIntelligence"
  // v4.0 — Global Platform (reserved)
  | "roadmap.v4.localization"
  | "roadmap.v4.regionalSettings"
  | "roadmap.v4.compliance"
  | "roadmap.v4.tax"
  | "roadmap.v4.currency"
  | "roadmap.v4.timezone"
  | "roadmap.v4.countryProfiles"
  | "roadmap.v4.globalExpansion"
  // v5.0 — Enterprise Cloud (reserved)
  | "roadmap.v5.sso"
  | "roadmap.v5.orgManagement"
  | "roadmap.v5.partnerPortal"
  | "roadmap.v5.resellerPortal"
  | "roadmap.v5.enterpriseMarketplace"
  | "roadmap.v5.integrationHub"
  | "roadmap.v5.identityFederation"
  // v6.0 — Autonomous Enterprise (reserved)
  | "roadmap.v6.robotics"
  | "roadmap.v6.iot"
  | "roadmap.v6.smartFactory"
  | "roadmap.v6.digitalTwin"
  | "roadmap.v6.aiOps"
  | "roadmap.v6.enterpriseAutomation"
  | "roadmap.v6.aiProcessManager";

const DEFAULTS: Record<FeatureFlagKey, boolean> = {
  "assistant.streaming": true,
  "assistant.voice": false,
  "studio.image": true,
  "studio.video": false,
  "studio.music": false,
  "marketplace.checkout": false,
  "community.groups": true,
  "enterprise.audit": true,
  "knowledge.semanticSearch": false,
  "notifications.push": false,
  // roadmap flags — all OFF until the corresponding module ships
  "roadmap.v2.agentOs": false,
  "roadmap.v2.multiAgent": false,
  "roadmap.v2.autonomousTasks": false,
  "roadmap.v2.workflowAutomation": false,
  "roadmap.v2.pluginMarketplace": false,
  "roadmap.v2.developerPlatform": false,
  "roadmap.v2.sdk": false,
  "roadmap.v2.publicApis": false,
  "roadmap.v2.skillsMarketplace": false,
  "roadmap.v2.promptMarketplace": false,
  "roadmap.v2.enterpriseExtensions": false,
  "roadmap.v3.predictiveAnalytics": false,
  "roadmap.v3.executiveAdvisor": false,
  "roadmap.v3.forecasting": false,
  "roadmap.v3.scenarioPlanning": false,
  "roadmap.v3.aiReports": false,
  "roadmap.v3.aiInsights": false,
  "roadmap.v3.decisionIntelligence": false,
  "roadmap.v4.localization": false,
  "roadmap.v4.regionalSettings": false,
  "roadmap.v4.compliance": false,
  "roadmap.v4.tax": false,
  "roadmap.v4.currency": false,
  "roadmap.v4.timezone": false,
  "roadmap.v4.countryProfiles": false,
  "roadmap.v4.globalExpansion": false,
  "roadmap.v5.sso": false,
  "roadmap.v5.orgManagement": false,
  "roadmap.v5.partnerPortal": false,
  "roadmap.v5.resellerPortal": false,
  "roadmap.v5.enterpriseMarketplace": false,
  "roadmap.v5.integrationHub": false,
  "roadmap.v5.identityFederation": false,
  "roadmap.v6.robotics": false,
  "roadmap.v6.iot": false,
  "roadmap.v6.smartFactory": false,
  "roadmap.v6.digitalTwin": false,
  "roadmap.v6.aiOps": false,
  "roadmap.v6.enterpriseAutomation": false,
  "roadmap.v6.aiProcessManager": false,
};

const STORAGE_KEY = "happyx.feature-flags.v1";

function readOverrides(): Partial<Record<FeatureFlagKey, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<FeatureFlagKey, boolean>>) : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Partial<Record<FeatureFlagKey, boolean>>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    logger.warn("failed to persist feature flags", { err: String(err) });
  }
}

const state: Record<FeatureFlagKey, boolean> = { ...DEFAULTS };

export function initFeatureFlags() {
  const overrides = readOverrides();
  for (const [k, v] of Object.entries(overrides)) {
    if (k in state && typeof v === "boolean") {
      state[k as FeatureFlagKey] = v;
    }
  }
}

export function isEnabled(key: FeatureFlagKey): boolean {
  return state[key];
}

export function setFlag(key: FeatureFlagKey, enabled: boolean) {
  state[key] = enabled;
  const overrides = readOverrides();
  overrides[key] = enabled;
  writeOverrides(overrides);
  eventBus.emit("feature-flag:changed", { key, enabled });
}

export function allFlags(): Readonly<Record<FeatureFlagKey, boolean>> {
  return { ...state };
}
