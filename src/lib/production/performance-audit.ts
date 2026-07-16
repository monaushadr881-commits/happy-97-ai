/** R74 — performance audit heuristics. Pure. */
export interface PerfInput {
  lcpMs: number; inpMs: number; cls: number; tbtMs: number;
  routeJsKb: number;
}
export interface PerfReport {
  score: number;
  fails: string[];
}
export function evaluatePerf(i: PerfInput): PerfReport {
  const fails: string[] = [];
  if (i.lcpMs > 2500) fails.push(`LCP ${i.lcpMs}ms > 2500`);
  if (i.inpMs > 200)  fails.push(`INP ${i.inpMs}ms > 200`);
  if (i.cls > 0.1)    fails.push(`CLS ${i.cls} > 0.1`);
  if (i.tbtMs > 200)  fails.push(`TBT ${i.tbtMs}ms > 200`);
  if (i.routeJsKb > 180) fails.push(`Route JS ${i.routeJsKb}KB > 180`);
  return { score: Math.max(0, 100 - fails.length * 15), fails };
}
