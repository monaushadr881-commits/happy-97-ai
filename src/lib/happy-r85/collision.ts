/**
 * R85 — Adaptive positioning / collision avoidance.
 *
 * Detect open dialogs, sheets and floating action bars in the DOM
 * and decide whether HAPPY should shift out of the way. Pure DOM
 * read; no mutations.
 */

import type { DeskCorner } from "@/components/happy-desk/delivery-bus";

const COLLISION_SELECTORS = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[data-state="open"][data-radix-popper-content-wrapper]',
  '[data-slot="sheet-content"]',
  '[data-floating-action-bar]',
  '.command-palette[data-open="true"]',
] as const;

export interface Rect { x: number; y: number; w: number; h: number }

export function readObstacleRects(doc: Document = document): Rect[] {
  const out: Rect[] = [];
  for (const sel of COLLISION_SELECTORS) {
    try {
      const nodes = doc.querySelectorAll(sel);
      for (const n of nodes) {
        const r = (n as Element).getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      }
    } catch { /* selector unsupported — skip */ }
  }
  return out;
}

export interface ViewportSize { w: number; h: number }

/** Approximate desk rect for a given corner. */
export function deskRectFor(corner: DeskCorner, vp: ViewportSize, size = 96): Rect {
  const margin = 16;
  const x = corner === "br" || corner === "tr" ? vp.w - size - margin : margin;
  const y = corner === "br" || corner === "bl" ? vp.h - size - margin : margin;
  return { x, y, w: size, h: size };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

/**
 * Given the preferred corner and observed obstacles, return the corner
 * with the least overlap. Deterministic, prefers the original corner
 * on ties to avoid jitter.
 */
export function pickSafeCorner(
  preferred: DeskCorner,
  vp: ViewportSize,
  obstacles: Rect[],
): DeskCorner {
  const corners: DeskCorner[] = [preferred, "br", "bl", "tr", "tl"];
  let best: DeskCorner = preferred;
  let bestScore = Infinity;
  for (const c of corners) {
    const dr = deskRectFor(c, vp);
    let score = 0;
    for (const o of obstacles) if (rectsOverlap(dr, o)) score += o.w * o.h;
    // small bias so preferred wins ties
    if (c !== preferred) score += 1;
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return best;
}
