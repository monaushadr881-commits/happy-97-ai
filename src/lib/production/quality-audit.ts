/** R74 — quality audit heuristics. Pure. */
export interface QualityInput {
  fileCount: number;
  largestFileLines: number;
  duplicateImports: number;
  unusedImports: number;
  circularDeps: number;
}
export interface QualityReport {
  score: number;
  issues: string[];
}
export function evaluateQuality(input: QualityInput): QualityReport {
  const issues: string[] = [];
  if (input.largestFileLines > 5000) issues.push(`Very large file: ${input.largestFileLines} lines`);
  if (input.duplicateImports > 0) issues.push(`Duplicate imports: ${input.duplicateImports}`);
  if (input.unusedImports > 20) issues.push(`Many unused imports: ${input.unusedImports}`);
  if (input.circularDeps > 0) issues.push(`Circular dependencies: ${input.circularDeps}`);
  const score = Math.max(0, 100 - issues.length * 10);
  return { score, issues };
}
