/** R74 — deployment readiness. Pure. */
export interface DeployInput {
  domainConfigured: boolean;
  sslActive: boolean;
  cdnActive: boolean;
  monitoringActive: boolean;
  rollbackAvailable: boolean;
  backupsActive: boolean;
  storeCredentials: {
    googlePlay: boolean; appStore: boolean;
    microsoft: boolean; amazon: boolean; samsung: boolean; huawei: boolean;
  };
}
export interface DeployReport {
  webReady: boolean;
  storeReady: Record<keyof DeployInput["storeCredentials"], boolean>;
  blockers: string[];
}
export function evaluateDeploy(i: DeployInput): DeployReport {
  const blockers: string[] = [];
  if (!i.domainConfigured) blockers.push("Domain not configured");
  if (!i.sslActive) blockers.push("SSL inactive");
  if (!i.cdnActive) blockers.push("CDN inactive");
  if (!i.monitoringActive) blockers.push("Monitoring inactive");
  if (!i.rollbackAvailable) blockers.push("Rollback unavailable");
  if (!i.backupsActive) blockers.push("Backups inactive");
  const storeReady = Object.fromEntries(
    Object.entries(i.storeCredentials).map(([k, v]) => [k, v]),
  ) as DeployReport["storeReady"];
  return { webReady: blockers.length === 0, storeReady, blockers };
}
