import { describe, it, expect } from "vitest";
import { repositionForComfort } from "@/lib/happy-cinematic/comfort-engine";

const viewport = { w: 1000, h: 800 };

describe("repositionForComfort", () => {
  it("keeps stage in place when overlap is small", () => {
    const r = repositionForComfort({
      stage: { x: 800, y: 600, w: 180, h: 180 },
      viewport,
      doNotCover: [{ x: 0, y: 0, w: 400, h: 300 }],
      preferredAnchor: "bottom-right",
    });
    expect(r.moved).toBe(false);
  });

  it("moves stage away from overlap when heavily covered", () => {
    const stage = { x: 100, y: 100, w: 300, h: 300 };
    const r = repositionForComfort({
      stage,
      viewport,
      doNotCover: [{ x: 50, y: 50, w: 400, h: 400 }],
      preferredAnchor: "bottom-right",
    });
    expect(r.moved).toBe(true);
    expect(r.stage).not.toEqual(stage);
  });
});
