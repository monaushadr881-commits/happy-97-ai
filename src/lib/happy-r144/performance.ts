/**
 * R144 · Production Performance & Optimization
 *
 * Pure decision helpers that EXTEND the canonical performance owners
 * (route loader / TanStack Query / happy-runtime cache / bundle splitter).
 * No new runtime, no new cache — just budgets, planners, and diagnostics.
 */

// ────────────────────────────────────────────────────────────────
// Budgets (Core Web Vitals + our platform targets)
// ────────────────────────────────────────────────────────────────
export const PERF_BUDGETS = {
  initialLoadMs: 2500,          // TTI target on mid-tier mobile
  lcpMs: 2500,                  // Largest Contentful Paint
  interactionMs: 100,           // INP / click → paint
  routeChunkKb: 180,            // gzipped per lazy route
  initialJsKb: 220,             // gzipped critical bundle
  cssKb: 60,                    // gzipped critical css
  imageKb: 250,                 // per hero-class image
  memoryMb: 150,                // steady-state heap
  cpuLongTaskMs: 50,            // any task > this is a jank offender
  dbQueryMs: 120,               // p95 canonical query
  brainStageMs: 350,            // per pipeline stage
  searchMs: 400,                // hybrid search p95
} as const;

export type PerfMetric = keyof typeof PERF_BUDGETS;

export interface PerfSample {
  metric: PerfMetric;
  value: number;
  label?: string;
}

export interface PerfVerdict {
  metric: PerfMetric;
  value: number;
  budget: number;
  status: "pass" | "warn" | "fail";
  overBy: number; // ratio (1 = at budget)
  label?: string;
}

/** Grade a single sample against its budget. warn @ 1.0–1.25×, fail > 1.25×. */
export function grade(sample: PerfSample): PerfVerdict {
  const budget = PERF_BUDGETS[sample.metric];
  const ratio = sample.value / budget;
  const status: PerfVerdict["status"] =
    ratio <= 1 ? "pass" : ratio <= 1.25 ? "warn" : "fail";
  return { ...sample, budget, status, overBy: ratio };
}

export function gradeAll(samples: PerfSample[]): PerfVerdict[] {
  return samples.map(grade);
}

export function perfScore(verdicts: PerfVerdict[]): number {
  if (!verdicts.length) return 100;
  const w = { pass: 1, warn: 0.7, fail: 0 } as const;
  const total = verdicts.reduce((s, v) => s + w[v.status], 0);
  return Math.round((total / verdicts.length) * 100);
}

// ────────────────────────────────────────────────────────────────
// Route / chunk loading plan (extends TanStack code-splitting)
// ────────────────────────────────────────────────────────────────
export type LoadStrategy = "eager" | "preload" | "lazy" | "on-visible" | "on-idle";

export interface RouteLoadPlan {
  route: string;
  strategy: LoadStrategy;
  reason: string;
}

/**
 * Decide how a route should ship. Critical shell (index, auth) is eager,
 * common next-hops preload, everything else lazy — matches TanStack Router
 * defaultPreload behavior without introducing a second router.
 */
export function planRouteLoading(
  route: string,
  opts: { authGate?: boolean; hot?: boolean; heavy?: boolean } = {},
): RouteLoadPlan {
  const r = route.toLowerCase();
  if (r === "/" || r === "/index" || r.startsWith("/auth"))
    return { route, strategy: "eager", reason: "critical-shell" };
  if (opts.authGate && (r.includes("dashboard") || r.includes("home")))
    return { route, strategy: "preload", reason: "post-login-hot-path" };
  if (opts.hot) return { route, strategy: "preload", reason: "frequent-nav" };
  if (opts.heavy) return { route, strategy: "on-idle", reason: "heavy-bundle" };
  return { route, strategy: "lazy", reason: "default-split" };
}

// ────────────────────────────────────────────────────────────────
// Image optimization
// ────────────────────────────────────────────────────────────────
export type ImageFormat = "avif" | "webp" | "jpeg" | "png" | "svg";

export interface ImagePlan {
  format: ImageFormat;
  width: number;
  quality: number;
  loading: "eager" | "lazy";
  fetchpriority: "high" | "low" | "auto";
  srcset: number[]; // widths
}

export function planImage(opts: {
  role: "lcp" | "hero" | "content" | "thumbnail" | "icon";
  intrinsicWidth: number;
  hasAlpha?: boolean;
  isVector?: boolean;
}): ImagePlan {
  if (opts.isVector)
    return { format: "svg", width: opts.intrinsicWidth, quality: 100, loading: "lazy", fetchpriority: "auto", srcset: [] };
  const isLcp = opts.role === "lcp";
  const isThumb = opts.role === "thumbnail" || opts.role === "icon";
  const format: ImageFormat = opts.hasAlpha ? "webp" : "avif";
  const width = Math.min(opts.intrinsicWidth, isThumb ? 320 : 1920);
  const srcset = isThumb ? [160, 320] : [480, 768, 1200, 1600, 1920].filter((w) => w <= width);
  return {
    format,
    width,
    quality: isLcp ? 82 : isThumb ? 70 : 75,
    loading: isLcp ? "eager" : "lazy",
    fetchpriority: isLcp ? "high" : "auto",
    srcset,
  };
}

// ────────────────────────────────────────────────────────────────
// Query / cache TTL policy — extends TanStack Query defaults;
// does NOT introduce a second cache.
// ────────────────────────────────────────────────────────────────
export type DataClass =
  | "static"       // config, enums
  | "reference"    // rarely-changing lists
  | "user"         // profile, prefs
  | "workspace"    // scoped collaborative data
  | "live"         // dashboards, feeds
  | "realtime";    // presence, chat

export interface CachePolicy {
  staleTimeMs: number;
  gcTimeMs: number;
  refetchOnFocus: boolean;
  refetchOnReconnect: boolean;
}

export function cachePolicy(cls: DataClass): CachePolicy {
  switch (cls) {
    case "static":    return { staleTimeMs: 24 * 3600_000, gcTimeMs: 48 * 3600_000, refetchOnFocus: false, refetchOnReconnect: false };
    case "reference": return { staleTimeMs: 60 * 60_000,   gcTimeMs: 4  * 3600_000, refetchOnFocus: false, refetchOnReconnect: true  };
    case "user":      return { staleTimeMs: 5  * 60_000,   gcTimeMs: 30 * 60_000,   refetchOnFocus: true,  refetchOnReconnect: true  };
    case "workspace": return { staleTimeMs: 60_000,        gcTimeMs: 15 * 60_000,   refetchOnFocus: true,  refetchOnReconnect: true  };
    case "live":      return { staleTimeMs: 10_000,        gcTimeMs: 5  * 60_000,   refetchOnFocus: true,  refetchOnReconnect: true  };
    case "realtime":  return { staleTimeMs: 0,             gcTimeMs: 60_000,        refetchOnFocus: false, refetchOnReconnect: true  };
  }
}

// ────────────────────────────────────────────────────────────────
// Duplication guard — enforces "no V2" architecture lock
// ────────────────────────────────────────────────────────────────
export interface DuplicationReport {
  ok: boolean;
  offenders: string[];
  reason: string;
}

const V2_PATTERNS = [
  /-v2(\.|\/|$)/i,
  /_v2(\.|\/|$)/i,
  /\bcache2\b/i,
  /\bruntime2\b/i,
  /performance-engine-v2/i,
  /optimizer-v2/i,
];

export function scanForDuplicateRuntimes(paths: string[]): DuplicationReport {
  const offenders = paths.filter((p) => V2_PATTERNS.some((re) => re.test(p)));
  return {
    ok: offenders.length === 0,
    offenders,
    reason: offenders.length
      ? "R144 lock: extend canonical owner instead of creating a V2 sibling"
      : "no duplicate runtime/cache detected",
  };
}

// ────────────────────────────────────────────────────────────────
// Brain / Memory / Search pipeline instrumentation helper
// ────────────────────────────────────────────────────────────────
export interface StageTiming { stage: string; ms: number }

export function pipelineHotspots(stages: StageTiming[], topN = 3): StageTiming[] {
  return [...stages].sort((a, b) => b.ms - a.ms).slice(0, topN);
}

export function pipelineTotal(stages: StageTiming[]): number {
  return stages.reduce((s, x) => s + x.ms, 0);
}

// ────────────────────────────────────────────────────────────────
// Top-level snapshot — the shape /founder/performance renders
// ────────────────────────────────────────────────────────────────
export interface PerfSnapshot {
  score: number;
  verdicts: PerfVerdict[];
  hotspots: StageTiming[];
  duplication: DuplicationReport;
  generatedAt: string;
}

export function buildPerfSnapshot(input: {
  samples: PerfSample[];
  stages?: StageTiming[];
  scanPaths?: string[];
}): PerfSnapshot {
  const verdicts = gradeAll(input.samples);
  return {
    score: perfScore(verdicts),
    verdicts,
    hotspots: pipelineHotspots(input.stages ?? []),
    duplication: scanForDuplicateRuntimes(input.scanPaths ?? []),
    generatedAt: new Date().toISOString(),
  };
}
