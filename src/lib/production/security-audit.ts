/** R74 — security audit heuristics. Pure. */
export interface SecInput {
  tables: number;
  tablesWithRls: number;
  tablesWithGrants: number;
  publicEndpoints: number;
  publicEndpointsWithSignatureCheck: number;
  missingRequiredSecrets: string[];
}
export interface SecReport {
  score: number;
  criticals: string[];
  warnings: string[];
}
export function evaluateSecurity(i: SecInput): SecReport {
  const criticals: string[] = [];
  const warnings: string[] = [];
  if (i.tables !== i.tablesWithRls) criticals.push(`RLS missing on ${i.tables - i.tablesWithRls} tables`);
  if (i.tables !== i.tablesWithGrants) criticals.push(`GRANTs missing on ${i.tables - i.tablesWithGrants} tables`);
  if (i.publicEndpoints !== i.publicEndpointsWithSignatureCheck)
    criticals.push(`Public endpoints without signature check: ${i.publicEndpoints - i.publicEndpointsWithSignatureCheck}`);
  if (i.missingRequiredSecrets.length) warnings.push(`Missing secrets: ${i.missingRequiredSecrets.join(", ")}`);
  const score = Math.max(0, 100 - criticals.length * 25 - warnings.length * 5);
  return { score, criticals, warnings };
}
