/** R74 — testing coverage aggregator. Pure. */
export interface TestInput {
  unitFiles: number;
  smokeRoutes: number;
  totalRoutes: number;
  a11yRoutes: number;
  playwrightFlows: number;
}
export interface TestReport {
  score: number;
  routeCoveragePct: number;
  a11yCoveragePct: number;
}
export function evaluateTesting(i: TestInput): TestReport {
  const routeCoveragePct = i.totalRoutes ? Math.round((i.smokeRoutes / i.totalRoutes) * 100) : 0;
  const a11yCoveragePct = i.totalRoutes ? Math.round((i.a11yRoutes / i.totalRoutes) * 100) : 0;
  const base = routeCoveragePct * 0.5 + a11yCoveragePct * 0.3 + Math.min(20, i.playwrightFlows * 2);
  return { score: Math.round(base), routeCoveragePct, a11yCoveragePct };
}
