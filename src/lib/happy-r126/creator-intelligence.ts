/**
 * R126 — HAPPY Creator Studio™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No Creator Studio V2. No duplicate Video / Image / Audio / Editor runtime.
 *   - Canonical owners (extended, never replaced):
 *       Creator OS server fns  → `src/lib/creator-v1.functions.ts`
 *       Studio engine          → `src/lib/happy-studio/engine.ts`
 *       Studio server fns      → `src/lib/happy-studio/studio.functions.ts`
 *       AI Gateway             → Lovable AI (LOVABLE_API_KEY, server-only)
 *       Files                  → `src/lib/happy-r119/file-intelligence.ts`
 *       Search                 → `src/lib/happy-r120/search-intelligence.ts`
 *       Brain                  → `src/lib/brain/engine.ts`
 *       Memory                 → `src/lib/memory/engine.ts`
 *       Workspace              → `src/lib/happy-r118/workspace-intelligence.ts`
 *       Digital Human          → `src/components/digital-human/*`, R117
 *
 * Pure helpers only — no I/O, no state. Persistence flows through canonical
 * server functions. Zero new tables, zero new APIs, zero parallel runtimes.
 */

// ============================================================================
// Phase 2 — CREATOR_ARCHITECTURE_V2 (types)
// ============================================================================

export type MediaKind =
  | "video" | "reel" | "short" | "audio" | "podcast"
  | "image" | "graphic" | "thumbnail" | "logo" | "poster" | "banner" | "social_post" | "product_image"
  | "pdf" | "presentation" | "proposal" | "brochure" | "resume" | "invoice" | "certificate" | "report"
  | "animation" | "brand_kit" | "template";

export type CreatorStudio =
  | "video" | "image" | "audio" | "document" | "brand"
  | "ai_creator" | "publishing" | "calendar" | "analytics";

export type StudioMode =
  | "idle" | "editing" | "rendering" | "publishing" | "reviewing" | "planning";

export type PipelineStage =
  | "capture" | "assemble" | "edit" | "enhance" | "review" | "render" | "publish";

export type Platform =
  | "youtube" | "instagram" | "facebook" | "linkedin"
  | "x" | "whatsapp" | "telegram" | "tiktok";

export type CreatorRole =
  | "viewer" | "contributor" | "editor" | "reviewer"
  | "publisher" | "brand_owner" | "admin";

export type CreatorCap =
  | "view" | "create" | "edit" | "render" | "publish"
  | "schedule" | "brand_manage" | "delete" | "analytics";

// ============================================================================
// Phase 3 — Video Studio
// ============================================================================
export interface TimelineClip {
  id: string;
  kind: "video" | "audio" | "image" | "text" | "caption";
  start_ms: number;
  duration_ms: number;
  track?: number;
  src?: string;
}

export function timelineDurationMs(clips: TimelineClip[]): number {
  let end = 0;
  for (const c of clips) end = Math.max(end, c.start_ms + Math.max(0, c.duration_ms));
  return end;
}

export function normalizeTimeline(clips: TimelineClip[]): TimelineClip[] {
  // sort by track then start; snap negatives to 0
  return [...clips]
    .map((c) => ({ ...c, start_ms: Math.max(0, c.start_ms), duration_ms: Math.max(0, c.duration_ms) }))
    .sort((a, b) => (a.track ?? 0) - (b.track ?? 0) || a.start_ms - b.start_ms);
}

export function detectClipOverlaps(clips: TimelineClip[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const byTrack = new Map<number, TimelineClip[]>();
  for (const c of clips) {
    const k = c.track ?? 0;
    if (!byTrack.has(k)) byTrack.set(k, []);
    byTrack.get(k)!.push(c);
  }
  for (const arr of byTrack.values()) {
    const sorted = [...arr].sort((a, b) => a.start_ms - b.start_ms);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (prev.start_ms + prev.duration_ms > cur.start_ms) out.push([prev.id, cur.id]);
    }
  }
  return out;
}

export type CaptionCue = { start_ms: number; end_ms: number; text: string };

export function autoSubtitle(
  transcript: Array<{ at_ms: number; text: string }>,
  opts: { maxCharsPerCue?: number; minGapMs?: number } = {}
): CaptionCue[] {
  const max = opts.maxCharsPerCue ?? 80;
  const minGap = opts.minGapMs ?? 40;
  const cues: CaptionCue[] = [];
  for (let i = 0; i < transcript.length; i++) {
    const t = transcript[i];
    const next = transcript[i + 1];
    const end = Math.max(t.at_ms + minGap, (next?.at_ms ?? t.at_ms + 2000) - minGap);
    // chunk by max chars
    const words = t.text.split(/\s+/);
    let buf = "";
    let start = t.at_ms;
    const total = end - t.at_ms;
    const perChar = words.join(" ").length > 0 ? total / words.join(" ").length : 0;
    for (const w of words) {
      if ((buf + " " + w).trim().length > max) {
        const dur = Math.max(400, Math.round(buf.length * perChar));
        cues.push({ start_ms: start, end_ms: start + dur, text: buf.trim() });
        start += dur;
        buf = w;
      } else {
        buf = (buf + " " + w).trim();
      }
    }
    if (buf) cues.push({ start_ms: start, end_ms: end, text: buf.trim() });
  }
  return cues;
}

export type VideoPreset =
  | "reel_9x16" | "short_9x16" | "youtube_16x9" | "square_1x1" | "story_9x16" | "linkedin_16x9";

export function renderPreset(preset: VideoPreset): { w: number; h: number; fps: number; bitrate_kbps: number } {
  switch (preset) {
    case "reel_9x16":
    case "short_9x16":
    case "story_9x16":   return { w: 1080, h: 1920, fps: 30, bitrate_kbps: 8000 };
    case "youtube_16x9":
    case "linkedin_16x9":return { w: 1920, h: 1080, fps: 30, bitrate_kbps: 12000 };
    case "square_1x1":   return { w: 1080, h: 1080, fps: 30, bitrate_kbps: 8000 };
  }
}

// ============================================================================
// Phase 4 — Image Studio
// ============================================================================
export type ImagePreset =
  | "logo_512" | "poster_a3" | "banner_wide" | "thumbnail_16x9"
  | "instagram_1x1" | "instagram_4x5" | "story_9x16" | "product_1x1" | "og_1200x630";

export function imagePreset(p: ImagePreset): { w: number; h: number } {
  switch (p) {
    case "logo_512":        return { w: 512,  h: 512 };
    case "poster_a3":       return { w: 3508, h: 4961 };
    case "banner_wide":     return { w: 1920, h: 640 };
    case "thumbnail_16x9":  return { w: 1280, h: 720 };
    case "instagram_1x1":   return { w: 1080, h: 1080 };
    case "instagram_4x5":   return { w: 1080, h: 1350 };
    case "story_9x16":      return { w: 1080, h: 1920 };
    case "product_1x1":     return { w: 2000, h: 2000 };
    case "og_1200x630":     return { w: 1200, h: 630 };
  }
}

export function pickImageModel(kind: MediaKind, quality: "fast" | "standard" | "premium" = "standard"): string {
  if (kind === "logo" || kind === "thumbnail" || quality === "premium") return "google/gemini-3-pro-image";
  if (kind === "product_image" || kind === "poster") return "google/gemini-3.1-flash-image";
  return "google/gemini-3.1-flash-image";
}

// ============================================================================
// Phase 5 — Document Studio
// ============================================================================
export type DocKind = "pdf" | "presentation" | "proposal" | "brochure" | "resume" | "invoice" | "certificate" | "report";

export interface DocSection { heading: string; body?: string; bullets?: string[] }

export function documentOutline(kind: DocKind, topic: string): DocSection[] {
  const t = topic.trim() || "Untitled";
  switch (kind) {
    case "resume":       return [{ heading: "Summary" }, { heading: "Experience" }, { heading: "Skills" }, { heading: "Education" }, { heading: "Contact" }];
    case "invoice":      return [{ heading: "Header" }, { heading: "Line Items" }, { heading: "Totals" }, { heading: "Payment Terms" }];
    case "certificate":  return [{ heading: "Recipient" }, { heading: "Achievement" }, { heading: "Signatures" }];
    case "proposal":     return [{ heading: "Executive Summary" }, { heading: "Problem" }, { heading: "Solution" }, { heading: "Scope" }, { heading: "Timeline" }, { heading: "Pricing" }, { heading: "Next Steps" }];
    case "brochure":     return [{ heading: "Cover" }, { heading: "About" }, { heading: "Offerings" }, { heading: "Contact" }];
    case "report":       return [{ heading: `Overview — ${t}` }, { heading: "Findings" }, { heading: "Analysis" }, { heading: "Recommendations" }, { heading: "Appendix" }];
    case "presentation": return [{ heading: t }, { heading: "Problem" }, { heading: "Solution" }, { heading: "Market" }, { heading: "Traction" }, { heading: "Team" }, { heading: "Ask" }];
    case "pdf":
    default:             return [{ heading: t }, { heading: "Introduction" }, { heading: "Body" }, { heading: "Conclusion" }];
  }
}

// ============================================================================
// Phase 6 — Audio Studio
// ============================================================================
export type AudioEnhancement = "noise_removal" | "normalize" | "denoise_music" | "bass_boost" | "voice_clarify";

export function audioChain(kind: "podcast" | "voice_over" | "music" | "recording"): AudioEnhancement[] {
  switch (kind) {
    case "podcast":    return ["noise_removal", "voice_clarify", "normalize"];
    case "voice_over": return ["noise_removal", "voice_clarify", "normalize"];
    case "music":      return ["normalize", "bass_boost"];
    case "recording":  return ["noise_removal", "normalize"];
  }
}

export function pickTtsVoice(persona: "founder" | "customer" | "educator" | "marketer" | "narrator"): string {
  switch (persona) {
    case "founder":  return "alloy";
    case "customer": return "verse";
    case "educator": return "sage";
    case "marketer": return "coral";
    case "narrator": return "ballad";
  }
}

// ============================================================================
// Phase 7 — AI Creator (script / caption / hashtag / SEO / rewrite / translate)
// ============================================================================
export function generateHashtags(topic: string, platform: Platform, limit = 10): string[] {
  const stop = /^(the|a|an|and|or|to|of|in|on|for|is|are|be|by|with|from|it|as|at|this|that)$/i;
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stop.test(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const tag = "#" + w;
    if (!seen.has(tag)) { seen.add(tag); out.push(tag); }
  }
  const boilerplate: Record<Platform, string[]> = {
    youtube:   ["#youtube", "#shorts", "#viral"],
    instagram: ["#instagram", "#reels", "#explore"],
    facebook:  ["#facebook", "#fb"],
    linkedin:  ["#linkedin", "#growth", "#leadership"],
    x:         ["#x", "#trending"],
    whatsapp:  ["#status"],
    telegram:  ["#telegram"],
    tiktok:    ["#tiktok", "#fyp"],
  };
  for (const t of boilerplate[platform] ?? []) if (!seen.has(t)) { seen.add(t); out.push(t); }
  return out.slice(0, Math.max(1, limit));
}

export function seoScore(input: { title: string; description?: string; keywords?: string[] }): {
  score: number; issues: string[];
} {
  const issues: string[] = [];
  const title = (input.title ?? "").trim();
  const desc = (input.description ?? "").trim();
  const kw = input.keywords ?? [];
  let score = 100;
  if (title.length < 20) { score -= 20; issues.push("title_too_short"); }
  if (title.length > 65) { score -= 10; issues.push("title_too_long"); }
  if (desc.length < 70)  { score -= 15; issues.push("description_too_short"); }
  if (desc.length > 160) { score -= 10; issues.push("description_too_long"); }
  if (kw.length < 3)     { score -= 15; issues.push("insufficient_keywords"); }
  const lowerT = title.toLowerCase(); const lowerD = desc.toLowerCase();
  const covered = kw.filter((k) => lowerT.includes(k.toLowerCase()) || lowerD.includes(k.toLowerCase())).length;
  if (kw.length > 0 && covered / kw.length < 0.5) { score -= 15; issues.push("keyword_coverage_low"); }
  return { score: Math.max(0, Math.min(100, score)), issues };
}

export function summarizeForCaption(text: string, maxChars = 150): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function contentIdeas(topic: string, count = 5): string[] {
  const frames = [
    (t: string) => `${t}: 5 mistakes to avoid`,
    (t: string) => `The founder's guide to ${t}`,
    (t: string) => `How we grew ${t} in 30 days`,
    (t: string) => `${t} vs. the alternatives — the honest breakdown`,
    (t: string) => `A behind-the-scenes look at ${t}`,
    (t: string) => `${t} explained in 60 seconds`,
    (t: string) => `The future of ${t}`,
  ];
  const out: string[] = [];
  for (let i = 0; i < Math.max(1, count); i++) out.push(frames[i % frames.length](topic.trim() || "your idea"));
  return out;
}

// ============================================================================
// Phase 8 — Brand Studio
// ============================================================================
export interface BrandKit {
  name: string;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  font_display?: string;
  font_body?: string;
  logo_asset_id?: string;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function validateBrandKit(k: BrandKit): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!k.name?.trim()) issues.push("missing_name");
  if (!HEX.test(k.primary_color ?? "")) issues.push("invalid_primary_color");
  if (k.secondary_color && !HEX.test(k.secondary_color)) issues.push("invalid_secondary_color");
  if (k.accent_color && !HEX.test(k.accent_color)) issues.push("invalid_accent_color");
  return { ok: issues.length === 0, issues };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const L1 = luminance(fg), L2 = luminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return +(((hi + 0.05) / (lo + 0.05))).toFixed(2);
}

export function brandContrastOk(kit: BrandKit, bg = "#ffffff"): boolean {
  return contrastRatio(kit.primary_color, bg) >= 4.5;
}

// ============================================================================
// Phase 9 — Publishing (architecture-ready; no credentials)
// ============================================================================
export interface PublishTarget { platform: Platform; account_handle?: string }

export interface PublishPlan {
  media_kind: MediaKind;
  targets: PublishTarget[];
  scheduled_at?: string;
  caption?: string;
  hashtags?: string[];
  compliant: boolean;
  issues: string[];
}

const PLATFORM_LIMITS: Record<Platform, { caption_max: number; hashtags_max: number; supports: MediaKind[] }> = {
  youtube:   { caption_max: 5000, hashtags_max: 15, supports: ["video", "short", "thumbnail"] },
  instagram: { caption_max: 2200, hashtags_max: 30, supports: ["image", "reel", "short", "social_post", "thumbnail"] },
  facebook:  { caption_max: 5000, hashtags_max: 30, supports: ["video", "image", "social_post"] },
  linkedin:  { caption_max: 3000, hashtags_max: 20, supports: ["video", "image", "social_post", "pdf", "presentation"] },
  x:         { caption_max: 280,  hashtags_max: 5,  supports: ["image", "video", "short", "social_post"] },
  whatsapp:  { caption_max: 1024, hashtags_max: 5,  supports: ["image", "video", "pdf"] },
  telegram:  { caption_max: 1024, hashtags_max: 10, supports: ["image", "video", "pdf", "social_post"] },
  tiktok:    { caption_max: 2200, hashtags_max: 10, supports: ["video", "short", "reel"] },
};

export function validatePublishPlan(plan: PublishPlan): PublishPlan {
  const issues: string[] = [];
  const caption = plan.caption ?? "";
  const hashtags = plan.hashtags ?? [];
  for (const t of plan.targets) {
    const lim = PLATFORM_LIMITS[t.platform];
    if (!lim) { issues.push(`unknown_platform:${t.platform}`); continue; }
    if (!lim.supports.includes(plan.media_kind)) issues.push(`unsupported:${t.platform}:${plan.media_kind}`);
    if (caption.length > lim.caption_max) issues.push(`caption_too_long:${t.platform}`);
    if (hashtags.length > lim.hashtags_max) issues.push(`too_many_hashtags:${t.platform}`);
  }
  if (plan.scheduled_at && Date.parse(plan.scheduled_at) < Date.now() - 60_000) issues.push("scheduled_in_past");
  return { ...plan, compliant: issues.length === 0, issues };
}

// ============================================================================
// Phase 10 — Content Calendar
// ============================================================================
export interface CalendarItem {
  id: string;
  title: string;
  media_kind: MediaKind;
  scheduled_at: string; // ISO
  platforms: Platform[];
  campaign_id?: string;
  status?: "draft" | "scheduled" | "publishing" | "published" | "failed";
}

export function detectCalendarConflicts(items: CalendarItem[], minGapMinutes = 15): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const byKey = new Map<string, CalendarItem[]>();
  for (const it of items) {
    for (const p of it.platforms) {
      const k = p;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k)!.push(it);
    }
  }
  for (const arr of byKey.values()) {
    const sorted = [...arr].sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
    for (let i = 1; i < sorted.length; i++) {
      const gap = (Date.parse(sorted[i].scheduled_at) - Date.parse(sorted[i - 1].scheduled_at)) / 60000;
      if (gap < minGapMinutes) out.push([sorted[i - 1].id, sorted[i].id]);
    }
  }
  return out;
}

export function nextBestPublishSlot(platform: Platform, from: Date = new Date()): Date {
  // deterministic heuristic (UTC): weekday windows
  const primeHours: Record<Platform, number[]> = {
    youtube:   [15, 18, 20],
    instagram: [11, 14, 19],
    facebook:  [9, 13, 20],
    linkedin:  [8, 12, 17],
    x:         [9, 12, 18, 21],
    whatsapp:  [10, 19],
    telegram:  [10, 19],
    tiktok:    [12, 18, 21],
  };
  const hours = primeHours[platform] ?? [12];
  const d = new Date(from.getTime());
  for (let i = 0; i < 7 * 24; i++) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      for (const h of hours) {
        if (d.getUTCHours() < h) { d.setUTCHours(h, 0, 0, 0); return d; }
      }
    }
    d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  }
  return d;
}

// ============================================================================
// Phase 11 — Creator Analytics
// ============================================================================
export interface EngagementSnapshot {
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  watch_seconds?: number;
  duration_seconds?: number;
  followers_delta?: number;
}

export function engagementRate(s: EngagementSnapshot): number {
  const reach = s.reach ?? s.views ?? 0;
  if (reach <= 0) return 0;
  const interactions = (s.likes ?? 0) + (s.comments ?? 0) + (s.shares ?? 0) + (s.saves ?? 0);
  return +(interactions / reach).toFixed(4);
}

export function watchTimeRatio(s: EngagementSnapshot): number {
  if (!s.duration_seconds || !s.watch_seconds) return 0;
  return +(Math.min(1, s.watch_seconds / s.duration_seconds)).toFixed(4);
}

export function contentPerformance(s: EngagementSnapshot): { grade: "A" | "B" | "C" | "D" | "F"; score: number } {
  const er = engagementRate(s);
  const wt = watchTimeRatio(s);
  const growth = Math.max(0, Math.min(1, (s.followers_delta ?? 0) / Math.max(50, (s.reach ?? s.views ?? 1000))));
  const score = Math.round((er * 40 + wt * 35 + growth * 25) * 100);
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";
  return { grade, score };
}

export function creatorSnapshot(items: Array<{ media_kind: MediaKind } & EngagementSnapshot>): {
  total: number;
  avg_engagement: number;
  avg_watch_ratio: number;
  by_kind: Record<string, number>;
} {
  const total = items.length;
  const er = total ? items.reduce((s, i) => s + engagementRate(i), 0) / total : 0;
  const wt = total ? items.reduce((s, i) => s + watchTimeRatio(i), 0) / total : 0;
  const by_kind: Record<string, number> = {};
  for (const i of items) by_kind[i.media_kind] = (by_kind[i.media_kind] ?? 0) + 1;
  return { total, avg_engagement: +er.toFixed(4), avg_watch_ratio: +wt.toFixed(4), by_kind };
}

// ============================================================================
// Phase 12 — Brain Integration (resolver + intent → studio)
// ============================================================================
export type CreatorIntent =
  | "video" | "image" | "audio" | "document"
  | "brand" | "publish" | "schedule" | "analytics" | "ideas";

export function classifyCreatorIntent(query: string): CreatorIntent | null {
  const q = query.toLowerCase();
  if (/\b(reel|short|video|shoot|edit|timeline|caption|subtitle)\b/.test(q)) return "video";
  if (/\b(image|photo|thumbnail|logo|poster|banner|graphic|product shot)\b/.test(q)) return "image";
  if (/\b(audio|voice[- ]?over|podcast|music|bgm|tts|narrate)\b/.test(q)) return "audio";
  if (/\b(pdf|deck|slide|presentation|proposal|brochure|invoice|resume|report|certificate)\b/.test(q)) return "document";
  if (/\b(brand|logo kit|palette|typography|guidelines)\b/.test(q)) return "brand";
  if (/\b(publish|post|share|upload)\b/.test(q)) return "publish";
  if (/\b(schedule|calendar|plan|when to post)\b/.test(q)) return "schedule";
  if (/\b(analytics|views|reach|engagement|watch time|performance)\b/.test(q)) return "analytics";
  if (/\b(idea|topic|angle|hook|script)\b/.test(q)) return "ideas";
  return null;
}

export function intentToStudio(intent: CreatorIntent): CreatorStudio {
  switch (intent) {
    case "video":     return "video";
    case "image":     return "image";
    case "audio":     return "audio";
    case "document":  return "document";
    case "brand":     return "brand";
    case "publish":   return "publishing";
    case "schedule":  return "calendar";
    case "analytics": return "analytics";
    case "ideas":     return "ai_creator";
  }
}

export interface CreatorBrainCard {
  studio: CreatorStudio;
  intent: CreatorIntent;
  route: string;
  suggestions: string[];
}

export function resolveForBrain(query: string): CreatorBrainCard | null {
  const intent = classifyCreatorIntent(query);
  if (!intent) return null;
  const studio = intentToStudio(intent);
  const routes: Record<CreatorStudio, string> = {
    video:       "/studio/video",
    image:       "/studio/image",
    audio:       "/studio/voice",
    document:    "/studio/presentation",
    brand:       "/studio/brand",
    ai_creator:  "/studio/copy",
    publishing:  "/studio/marketing",
    calendar:    "/studio/calendar",
    analytics:   "/studio/exports",
  };
  const suggestions: string[] = [];
  if (intent === "video")     suggestions.push("Open timeline", "Auto-caption", "Render 9:16");
  if (intent === "image")     suggestions.push("Generate image", "Edit image", "Make thumbnail");
  if (intent === "audio")     suggestions.push("Record voice-over", "TTS narration", "Noise removal");
  if (intent === "document")  suggestions.push("Generate deck", "Draft proposal", "Build report");
  if (intent === "brand")     suggestions.push("Save brand kit", "Check contrast", "Pick palette");
  if (intent === "publish")   suggestions.push("Validate plan", "Pick platforms", "Compose caption");
  if (intent === "schedule")  suggestions.push("Next best slot", "Detect conflicts", "Balance week");
  if (intent === "analytics") suggestions.push("Engagement snapshot", "Top content", "Growth trend");
  if (intent === "ideas")     suggestions.push("5 content ideas", "Trending hooks", "Script outline");
  return { studio, intent, route: routes[studio], suggestions };
}

// ============================================================================
// Phase 13 — Digital Human presets
// ============================================================================
export type CreatorDhMode =
  | "creator" | "presentation" | "teacher" | "marketing" | "brand";

export function pickDhCreatorMode(studio: CreatorStudio | CreatorIntent): CreatorDhMode {
  switch (studio) {
    case "document":                       return "presentation";
    case "brand":                          return "brand";
    case "publishing": case "publish":
    case "calendar":  case "schedule":     return "marketing";
    case "analytics":                      return "teacher";
    default:                               return "creator";
  }
}

// ============================================================================
// Permissions — role × capability matrix
// ============================================================================
const MATRIX: Record<CreatorRole, CreatorCap[]> = {
  viewer:      ["view", "analytics"],
  contributor: ["view", "create"],
  editor:      ["view", "create", "edit", "render"],
  reviewer:    ["view", "analytics"],
  publisher:   ["view", "create", "edit", "render", "publish", "schedule", "analytics"],
  brand_owner: ["view", "create", "edit", "brand_manage", "analytics"],
  admin:       ["view", "create", "edit", "render", "publish", "schedule", "brand_manage", "delete", "analytics"],
};

export function creatorCan(role: CreatorRole, cap: CreatorCap): boolean {
  return MATRIX[role]?.includes(cap) ?? false;
}
