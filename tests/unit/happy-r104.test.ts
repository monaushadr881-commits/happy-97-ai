/** R104 — HAPPY VRM Digital Human activation. */
import { describe, it, expect } from "vitest";
import {
  ASSET_CONTRACTS,
  validateAll,
  validateRuntime,
  type AssetManifest,
} from "@/components/digital-human/renderers/asset-contracts";
import {
  RUNTIME_CATALOG,
  runtimeStatus,
} from "@/components/digital-human/renderers/index";
import { detectRuntime } from "@/components/digital-human/renderers/runtime-detect";
import vrmAsset from "@/assets/digital-human/vrm/happy.vrm.asset.json";

describe("R104 VRM activation", () => {
  it("ships the Founder-supplied VRM pointer", () => {
    expect(vrmAsset.url).toMatch(/^\/__l5e\/assets-v1\//);
    expect(vrmAsset.original_filename).toBe("happy.vrm");
    expect(vrmAsset.size).toBeGreaterThan(1024 * 1024); // > 1 MB, real asset
  });

  it("marks the vrm runtime as ready in the catalog", () => {
    expect(RUNTIME_CATALOG.vrm.status).toBe("ready");
    expect(runtimeStatus("vrm")).toBe("ready");
  });

  it("validates the vrm asset contract against a manifest that contains the pointer", () => {
    const manifest: AssetManifest = {};
    for (const p of ASSET_CONTRACTS.vrm.required) manifest[p] = true;
    const result = validateRuntime("vrm", manifest);
    expect(result.status).toBe("ready");
    expect(result.missing).toEqual([]);
  });

  it("reports blocked when the vrm pointer is absent", () => {
    const result = validateRuntime("vrm", {});
    expect(result.status).toBe("blocked_asset_required");
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("prefers vrm at boot-time detection when the pointer is present", () => {
    const { chosen, results } = detectRuntime();
    // portrait is always ready as a fallback, so the picker order must not
    // downgrade to portrait when vrm is available.
    expect(results.vrm.status).toBe("ready");
    expect(chosen).toBe("vrm");
  });

  it("does not duplicate the vrm entry", () => {
    const vrmEntries = Object.values(RUNTIME_CATALOG).filter((c) => c.id === "vrm");
    expect(vrmEntries).toHaveLength(1);
  });

  it("validateAll surfaces vrm alongside portrait/live2d/live3d", () => {
    const results = validateAll({
      "public/happy-portrait-v2.png": true,
      ...Object.fromEntries(ASSET_CONTRACTS.vrm.required.map((p) => [p, true])),
    });
    expect(results.portrait.status).toBe("ready");
    expect(results.vrm.status).toBe("ready");
  });
});
