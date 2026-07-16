/** R74 — production readiness aggregator. Pure. */
export interface ReadinessInput {
  routes: number;
  serverFns: number;
  migrations: number;
  hasHealthEndpoint: boolean;
  hasErrorBoundaries: boolean;
  hasNotFoundBoundaries: boolean;
  supabaseLinterErrors: number;
  supabaseLinterWarnings: number;
  typecheckSeconds: number;
}
export interface ReadinessReport {
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D";
  blockers: string[];
  warnings: string[];
}

export function evaluateReadiness(input: ReadinessInput): ReadinessReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!input.hasHealthEndpoint) warnings.push("No health-check endpoint surfaced");
  if (!input.hasErrorBoundaries) blockers.push("Routes missing errorComponent");
  if (!input.hasNotFoundBoundaries) blockers.push("Routes missing notFoundComponent");
  if (input.supabaseLinterErrors > 0) blockers.push(`Supabase linter errors: ${input.supabaseLinterErrors}`);
  if (input.supabaseLinterWarnings > 0) warnings.push(`Supabase linter warnings: ${input.supabaseLinterWarnings}`);
  if (input.typecheckSeconds > 60) warnings.push(`Typecheck > 60s (${input.typecheckSeconds}s) — see r73 migration plan`);
  const base = 100 - blockers.length * 15 - warnings.length * 5;
  const score = Math.max(0, Math.min(100, base));
  const grade: ReadinessReport["grade"] = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";
  return { score, grade, blockers, warnings };
}
