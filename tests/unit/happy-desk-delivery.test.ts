import { describe, it, expect } from "vitest";
import { deskCornerFor } from "@/components/happy-desk/delivery-bus";

describe("deskCornerFor", () => {
  it("uses bottom-left for builder to keep right rail clear", () => {
    expect(deskCornerFor("/_authenticated/builder/canvas")).toBe("bl");
    expect(deskCornerFor("/builder")).toBe("bl");
  });
  it("uses top-right for analytics", () => {
    expect(deskCornerFor("/_authenticated/analytics/x")).toBe("tr");
  });
  it("uses top-left for founder", () => {
    expect(deskCornerFor("/_authenticated/founder/dashboard")).toBe("tl");
  });
  it("defaults to bottom-right", () => {
    expect(deskCornerFor("/")).toBe("br");
    expect(deskCornerFor("/settings/anything")).toBe("br");
  });
});
