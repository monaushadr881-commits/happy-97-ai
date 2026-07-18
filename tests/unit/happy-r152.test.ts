import { describe, it, expect } from "vitest";
import {
  AVATAR_ENGINE_METHODS,
  listRenderers,
  getRenderer,
  registerRenderer,
  listPlatforms,
  getPlatform,
  registerPlatform,
  listXRModes,
  getXRAdapter,
  listAssets,
  registerAsset,
  r152Report,
} from "@/lib/happy-r152";

describe("R152 · Future Platform & Avatar Architecture", () => {
  it("declares the 16 canonical Avatar Engine methods", () => {
    expect(AVATAR_ENGINE_METHODS).toEqual([
      "initialize","load","unload","render",
      "speak","listen",
      "animate","gesture","emotion","expression",
      "lookAt","move","teleport",
      "present","whiteboard",
      "shutdown",
    ]);
    expect(AVATAR_ENGINE_METHODS.length).toBe(16);
  });

  it("registers VRM as primary and three architecture-ready renderers", () => {
    const rs = listRenderers();
    expect(rs.find((r) => r.id === "vrm")?.status).toBe("primary");
    for (const id of ["metahuman", "live2d", "nvidia_ace"] as const) {
      expect(getRenderer(id)?.status).toBe("architecture_ready");
    }
    expect(getRenderer("plugin")?.status).toBe("plugin_slot");
  });

  it("blocks forked renderer registrations under an existing id", () => {
    expect(() =>
      registerRenderer({
        id: "vrm", name: "VRM V2", status: "primary",
        canonicalOwner: "src/lib/forked-runtime.ts", externalDeps: [],
      }),
    ).toThrow(/duplicate registration/);
  });

  it("registers 8 platforms, all reusing canonical owners", () => {
    const ps = listPlatforms();
    expect(ps.length).toBe(8);
    for (const p of ps) {
      expect(p.brain).toBe("canonical");
      expect(p.memory).toBe("canonical");
      expect(p.workspace).toBe("canonical");
      expect(p.conversation).toBe("canonical");
      expect(p.digitalHuman).toBe("canonical");
    }
    expect(getPlatform("web")?.status).toBe("active");
    expect(getPlatform("vision_pro")?.status).toBe("pending");
  });

  it("rejects platforms that try to fork a canonical owner", () => {
    expect(() =>
      registerPlatform({
        id: "windows", name: "Windows V2", status: "pending",
        shell: "x", externalDeps: [],
        brain: "canonical", memory: "canonical",
        workspace: "forked" as unknown as "canonical",
        conversation: "canonical", digitalHuman: "canonical",
      }),
    ).toThrow(/canonical/);
  });

  it("prepares AR / VR / MR adapters as unsupported stubs", async () => {
    expect(listXRModes()).toEqual(["ar", "vr", "mr"]);
    expect(await getXRAdapter("ar").isSupported()).toBe(false);
    await expect(getXRAdapter("vr").startSession()).rejects.toThrow(/xr_not_provisioned/);
  });

  it("seeds the unified asset registry across every kind", () => {
    const kinds = new Set(listAssets().map((a) => a.kind));
    for (const k of [
      "vrm","metahuman","live2d","animation","expression",
      "voice_pack","environment_pack","camera_preset",
      "bmw_entry","presentation","whiteboard",
    ]) expect(kinds.has(k as any)).toBe(true);
  });

  it("blocks asset id collisions with a different owner", () => {
    expect(() =>
      registerAsset({
        id: "vrm.happy.primary", kind: "vrm", name: "x",
        owner: "src/forked.ts", status: "active",
      }),
    ).toThrow(/duplicate id/);
  });

  it("report reflects the four registries", () => {
    const r = r152Report();
    expect(r.renderers).toBeGreaterThanOrEqual(5);
    expect(r.platforms).toBe(8);
    expect(r.xrModes).toBe(3);
    expect(r.assets).toBeGreaterThanOrEqual(11);
    expect(r.canonicalOwners.digitalHuman).toMatch(/HappyVRM\.tsx$/);
  });
});
