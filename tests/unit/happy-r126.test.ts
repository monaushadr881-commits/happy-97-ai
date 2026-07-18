import { describe, it, expect } from "vitest";
import {
  timelineDurationMs, normalizeTimeline, detectClipOverlaps, autoSubtitle, renderPreset,
  imagePreset, pickImageModel,
  documentOutline,
  audioChain, pickTtsVoice,
  generateHashtags, seoScore, summarizeForCaption, contentIdeas,
  validateBrandKit, contrastRatio, brandContrastOk,
  validatePublishPlan,
  detectCalendarConflicts, nextBestPublishSlot,
  engagementRate, watchTimeRatio, contentPerformance, creatorSnapshot,
  classifyCreatorIntent, intentToStudio, resolveForBrain,
  pickDhCreatorMode, creatorCan,
} from "@/lib/happy-r126/creator-intelligence";

describe("R126 Creator Studio", () => {
  it("timeline: duration, normalization, overlaps", () => {
    const clips = [
      { id: "a", kind: "video" as const, start_ms: 0, duration_ms: 1000, track: 0 },
      { id: "b", kind: "video" as const, start_ms: 500, duration_ms: 1000, track: 0 },
      { id: "c", kind: "audio" as const, start_ms: -100, duration_ms: 3000, track: 1 },
    ];
    expect(timelineDurationMs(clips)).toBe(2900);
    const n = normalizeTimeline(clips);
    expect(n[0].track).toBe(0);
    expect(n.find((c) => c.id === "c")!.start_ms).toBe(0);
    expect(detectClipOverlaps(clips)).toEqual([["a", "b"]]);
  });

  it("auto-subtitle chunks into cues", () => {
    const cues = autoSubtitle(
      [{ at_ms: 0, text: "hello world this is a caption test with enough words" }, { at_ms: 4000, text: "second segment" }],
      { maxCharsPerCue: 20 },
    );
    expect(cues.length).toBeGreaterThan(1);
    expect(cues[0].end_ms).toBeGreaterThan(cues[0].start_ms);
  });

  it("render/image presets", () => {
    expect(renderPreset("reel_9x16").h).toBe(1920);
    expect(imagePreset("og_1200x630")).toEqual({ w: 1200, h: 630 });
    expect(pickImageModel("logo")).toMatch(/gemini/);
  });

  it("document outlines vary by kind", () => {
    expect(documentOutline("resume", "x").length).toBe(5);
    expect(documentOutline("invoice", "x")[0].heading).toBe("Header");
    expect(documentOutline("presentation", "Pitch")[0].heading).toBe("Pitch");
  });

  it("audio chain + tts voice", () => {
    expect(audioChain("podcast")).toContain("voice_clarify");
    expect(pickTtsVoice("founder")).toBe("alloy");
  });

  it("hashtags / seo / caption / ideas", () => {
    const tags = generateHashtags("Growing a SaaS business", "instagram", 6);
    expect(tags[0]).toMatch(/^#/);
    expect(tags.length).toBeLessThanOrEqual(6);
    const seo = seoScore({ title: "Short", description: "x", keywords: [] });
    expect(seo.issues).toContain("title_too_short");
    expect(seo.score).toBeLessThan(100);
    expect(summarizeForCaption("word ".repeat(80), 40).endsWith("…")).toBe(true);
    expect(contentIdeas("HAPPY", 3).length).toBe(3);
  });

  it("brand kit validation + contrast", () => {
    expect(validateBrandKit({ name: "H", primary_color: "#ff00aa" }).ok).toBe(true);
    expect(validateBrandKit({ name: "", primary_color: "nope" }).issues.length).toBeGreaterThan(0);
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
    expect(brandContrastOk({ name: "n", primary_color: "#000000" })).toBe(true);
    expect(brandContrastOk({ name: "n", primary_color: "#eeeeee" })).toBe(false);
  });

  it("publish plan validation enforces platform limits", () => {
    const plan = validatePublishPlan({
      media_kind: "video",
      targets: [{ platform: "x" }, { platform: "youtube" }],
      caption: "x".repeat(400),
      hashtags: Array.from({ length: 20 }, (_, i) => `#t${i}`),
      compliant: false,
      issues: [],
    });
    expect(plan.compliant).toBe(false);
    expect(plan.issues.some((i) => i.startsWith("caption_too_long:x"))).toBe(true);
    expect(plan.issues.some((i) => i.startsWith("too_many_hashtags:x"))).toBe(true);
  });

  it("calendar conflicts + next slot", () => {
    const now = Date.now();
    const conflicts = detectCalendarConflicts([
      { id: "a", title: "a", media_kind: "reel", scheduled_at: new Date(now).toISOString(), platforms: ["instagram"] },
      { id: "b", title: "b", media_kind: "reel", scheduled_at: new Date(now + 5 * 60000).toISOString(), platforms: ["instagram"] },
    ]);
    expect(conflicts.length).toBe(1);
    const slot = nextBestPublishSlot("linkedin", new Date("2026-07-20T05:00:00Z"));
    expect(slot.getUTCHours()).toBeGreaterThanOrEqual(8);
  });

  it("engagement / watch / performance / snapshot", () => {
    const s = { views: 1000, reach: 1000, likes: 80, comments: 10, shares: 5, saves: 5, watch_seconds: 45, duration_seconds: 60, followers_delta: 25 };
    expect(engagementRate(s)).toBeCloseTo(0.1, 4);
    expect(watchTimeRatio(s)).toBeCloseTo(0.75, 2);
    const perf = contentPerformance(s);
    expect(["A", "B", "C", "D", "F"]).toContain(perf.grade);
    const snap = creatorSnapshot([{ media_kind: "reel", ...s }, { media_kind: "reel", ...s }]);
    expect(snap.total).toBe(2);
    expect(snap.by_kind.reel).toBe(2);
  });

  it("brain intent → studio + resolver", () => {
    expect(classifyCreatorIntent("please edit my reel")).toBe("video");
    expect(classifyCreatorIntent("make a logo")).toBe("image");
    expect(classifyCreatorIntent("when should I post?")).toBe("schedule");
    expect(intentToStudio("analytics")).toBe("analytics");
    const card = resolveForBrain("draft a proposal deck");
    expect(card?.studio).toBe("document");
    expect(card?.route).toMatch(/^\/studio/);
  });

  it("DH modes + permissions", () => {
    expect(pickDhCreatorMode("brand")).toBe("brand");
    expect(pickDhCreatorMode("analytics")).toBe("teacher");
    expect(creatorCan("viewer", "publish")).toBe(false);
    expect(creatorCan("publisher", "publish")).toBe(true);
    expect(creatorCan("admin", "delete")).toBe(true);
  });
});
