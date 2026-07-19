/**
 * HAPPY X Kernel — Feature Flag System
 *
 * Runtime toggles with sensible defaults, per-user overrides (localStorage),
 * and event emission so subscribers can react without polling.
 */

import { eventBus } from "./event-bus";
import { logger } from "./logger";

export type FeatureFlagKey =
  | "assistant.streaming"
  | "assistant.voice"
  | "studio.image"
  | "studio.video"
  | "studio.music"
  | "marketplace.checkout"
  | "community.groups"
  | "enterprise.audit"
  | "knowledge.semanticSearch"
  | "notifications.push";

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
