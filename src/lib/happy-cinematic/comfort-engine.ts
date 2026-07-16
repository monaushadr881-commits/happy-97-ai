/** R72 — comfort engine: reposition stage to never cover important UI. */

export interface Rect { x: number; y: number; w: number; h: number }

export interface ComfortInput {
  stage: Rect;
  viewport: { w: number; h: number };
  doNotCover: Rect[];
  preferredAnchor: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  marginPx?: number;
}

export interface ComfortResult { stage: Rect; moved: boolean }

function overlapArea(a: Rect, b: Rect) {
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return w * h;
}

export function repositionForComfort(input: ComfortInput): ComfortResult {
  const margin = input.marginPx ?? 16;
  const cover = input.doNotCover.reduce((s, r) => s + overlapArea(input.stage, r), 0);
  const stageArea = input.stage.w * input.stage.h || 1;
  if (cover / stageArea <= 0.2) return { stage: input.stage, moved: false };

  const anchors: Array<[number, number]> = [
    [input.viewport.w - input.stage.w - margin, input.viewport.h - input.stage.h - margin],
    [margin,                                     input.viewport.h - input.stage.h - margin],
    [input.viewport.w - input.stage.w - margin, margin],
    [margin,                                     margin],
  ];

  let best = input.stage;
  let bestCover = cover;
  for (const [x, y] of anchors) {
    const candidate: Rect = { x, y, w: input.stage.w, h: input.stage.h };
    const c = input.doNotCover.reduce((s, r) => s + overlapArea(candidate, r), 0);
    if (c < bestCover) { best = candidate; bestCover = c; }
  }
  return { stage: best, moved: best !== input.stage };
}
