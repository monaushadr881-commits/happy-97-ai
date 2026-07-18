import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const R = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("R141 — Creator Studio + Builder UI Completion", () => {
  it("Creator Hub route surfaces every mission tab", () => {
    const src = R("src/routes/_authenticated/studio.hub.tsx");
    for (const slug of ["uploads","collections","templates","publishing","scheduling","analytics","ai","comments","approvals","versions"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("Website Builder covers Pages · Sections · Components · Theme · Navigation · SEO · Forms · Preview · Publish", () => {
    const src = R("src/routes/_authenticated/websites.tsx");
    for (const slug of ["pages","sections","components","theme","navigation","seo","forms","preview","publish"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("App Builder covers Screens · Navigation · Components · Theme · Preview · Publish", () => {
    const src = R("src/routes/_authenticated/app-builder.tsx");
    for (const slug of ["screens","navigation","components","theme","preview","publish"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("Database Builder covers Entities · Relations · Indexes · Validation · Preview", () => {
    const src = R("src/routes/_authenticated/database-builder.tsx");
    for (const slug of ["entities","relations","indexes","validation","preview"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("API Builder covers Endpoints · Schemas · Authentication · Testing · Documentation", () => {
    const src = R("src/routes/_authenticated/api-fabric.tsx");
    for (const slug of ["endpoints","schemas","auth","testing","docs"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("AI Builder covers Agents · Prompts · Knowledge · Memory · Testing", () => {
    const src = R("src/routes/_authenticated/ai-builder.tsx");
    for (const slug of ["agents","prompts","knowledge","memory","testing"]) {
      expect(src).toContain(`slug: "${slug}"`);
    }
  });
  it("Universal Builder hub links to every specialised builder", () => {
    const src = R("src/routes/_authenticated/builder.tsx");
    for (const to of ["/websites","/app-builder","/workflows","/database-builder","/api-fabric","/ai-builder"]) {
      expect(src).toContain(to);
    }
  });
  it("FOUNDER LOCK — no Creator V2 / Builder V2 runtime introduced", () => {
    for (const f of [
      "src/routes/_authenticated/studio.hub.tsx",
      "src/routes/_authenticated/builder.tsx",
      "src/routes/_authenticated/websites.tsx",
      "src/routes/_authenticated/app-builder.tsx",
      "src/routes/_authenticated/database-builder.tsx",
      "src/routes/_authenticated/api-fabric.tsx",
      "src/routes/_authenticated/ai-builder.tsx",
    ]) {
      const src = R(f);
      expect(src).not.toMatch(/creator[- ]?v2/i);
      expect(src).not.toMatch(/builder[- ]?v2/i);
    }
  });
});
