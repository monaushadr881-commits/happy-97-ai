// R44 — Domain router. Deterministic intent → domain → runtime resolution.
// No hardcoded responses; only routes to owning runtimes.

import type { SpecialistModeCode, SpecialistDomain, RouteResolution } from './contracts';

type ModeRegistryRow = {
  code: string;
  domain: string;
  capabilities: unknown;
  runtime_routes: unknown;
  min_confidence: number;
  enabled: boolean;
};

const KEYWORDS: Record<string, { domain: SpecialistDomain; mode: SpecialistModeCode; capability: string }[]> = {
  revenue: [{ domain: 'finance', mode: 'revenue_consultant', capability: 'revenue' }],
  invoice: [{ domain: 'finance', mode: 'accounting_consultant', capability: 'invoice' }],
  expense: [{ domain: 'finance', mode: 'finance_consultant', capability: 'expenses' }],
  cashflow: [{ domain: 'finance', mode: 'finance_consultant', capability: 'cashflow' }],
  lead: [{ domain: 'crm', mode: 'crm_consultant', capability: 'lead' }],
  deal: [{ domain: 'crm', mode: 'crm_consultant', capability: 'deal' }],
  quotation: [{ domain: 'sales', mode: 'sales_consultant', capability: 'quotation' }],
  price: [{ domain: 'sales', mode: 'sales_consultant', capability: 'pricing' }],
  campaign: [{ domain: 'marketing', mode: 'marketing_consultant', capability: 'campaign' }],
  procurement: [{ domain: 'erp', mode: 'erp_consultant', capability: 'procurement' }],
  vendor: [{ domain: 'erp', mode: 'erp_consultant', capability: 'vendor' }],
  purchase: [{ domain: 'erp', mode: 'erp_consultant', capability: 'po' }],
  employee: [{ domain: 'hr', mode: 'hr_consultant', capability: 'employee' }],
  hire: [{ domain: 'hr', mode: 'recruitment_consultant', capability: 'hiring' }],
  production: [{ domain: 'manufacturing', mode: 'manufacturing_consultant', capability: 'production' }],
  batch: [{ domain: 'manufacturing', mode: 'manufacturing_consultant', capability: 'batch' }],
  machine: [{ domain: 'manufacturing', mode: 'manufacturing_consultant', capability: 'machine' }],
  stock: [{ domain: 'warehouse', mode: 'inventory_consultant', capability: 'stock' }],
  inventory: [{ domain: 'warehouse', mode: 'inventory_consultant', capability: 'stock' }],
  transfer: [{ domain: 'warehouse', mode: 'warehouse_consultant', capability: 'transfer' }],
  listing: [{ domain: 'marketplace', mode: 'marketplace_consultant', capability: 'listing' }],
  plugin: [{ domain: 'marketplace', mode: 'plugin_consultant', capability: 'plugin' }],
  website: [{ domain: 'builder', mode: 'website_builder_consultant', capability: 'site' }],
  app: [{ domain: 'builder', mode: 'app_builder_consultant', capability: 'app' }],
  deploy: [{ domain: 'deployment', mode: 'deployment_consultant', capability: 'deployment' }],
  domain: [{ domain: 'deployment', mode: 'deployment_consultant', capability: 'domain' }],
  workflow: [{ domain: 'automation', mode: 'automation_consultant', capability: 'workflow' }],
  agent: [{ domain: 'ai', mode: 'ai_consultant', capability: 'agent' }],
  course: [{ domain: 'learning', mode: 'education_consultant', capability: 'course' }],
  academy: [{ domain: 'learning', mode: 'razvi_academy_consultant', capability: 'program' }],
  research: [{ domain: 'knowledge', mode: 'research_consultant', capability: 'research' }],
  article: [{ domain: 'knowledge', mode: 'library_consultant', capability: 'article' }],
  ticket: [{ domain: 'support', mode: 'support_consultant', capability: 'ticket' }],
  incident: [{ domain: 'operations', mode: 'operations_consultant', capability: 'incident' }],
  contract: [{ domain: 'legal', mode: 'legal_consultant', capability: 'contract' }],
  policy: [{ domain: 'compliance', mode: 'compliance_consultant', capability: 'policy' }],
  audit: [{ domain: 'compliance', mode: 'compliance_consultant', capability: 'audit' }],
  role: [{ domain: 'security', mode: 'security_consultant', capability: 'role' }],
  access: [{ domain: 'security', mode: 'security_consultant', capability: 'access' }],
  approval: [{ domain: 'executive', mode: 'founder_advisor', capability: 'approvals' }],
  strategy: [{ domain: 'executive', mode: 'founder_advisor', capability: 'strategy' }],
  kpi: [{ domain: 'executive', mode: 'ceo_advisor', capability: 'kpi' }],
  growth: [{ domain: 'executive', mode: 'founder_advisor', capability: 'growth' }],
  risk: [{ domain: 'executive', mode: 'founder_advisor', capability: 'risk' }],
};

export function routeIntent(
  intent: string,
  currentMode: SpecialistModeCode,
  registry: ModeRegistryRow[],
): RouteResolution {
  const lower = intent.toLowerCase();
  let best: RouteResolution | null = null;
  let bestScore = 0;

  for (const [kw, matches] of Object.entries(KEYWORDS)) {
    if (!lower.includes(kw)) continue;
    for (const m of matches) {
      const row = registry.find((r) => r.code === m.mode && r.enabled);
      if (!row) continue;
      const routes = (row.runtime_routes ?? {}) as Record<string, string>;
      const runtime = routes.primary ?? m.domain;
      const score = kw.length + (currentMode === m.mode ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = {
          mode: m.mode,
          domain: m.domain,
          capability: m.capability,
          routed_runtime: runtime,
          confidence: Math.min(0.95, 0.5 + kw.length * 0.03 + (currentMode === m.mode ? 0.15 : 0)),
        };
      }
    }
  }

  if (best) return best;

  // Fallback: stay in current mode, no capability match.
  const row = registry.find((r) => r.code === currentMode);
  const routes = (row?.runtime_routes ?? {}) as Record<string, string>;
  return {
    mode: currentMode,
    domain: (row?.domain as SpecialistDomain) ?? 'executive',
    capability: null,
    routed_runtime: routes.primary ?? 'brain',
    confidence: 0.3,
  };
}
