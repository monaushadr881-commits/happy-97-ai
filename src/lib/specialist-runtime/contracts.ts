// R44 Business Specialist Runtime — contracts
// Renderer-agnostic orchestration layer. Modes are runtime capabilities of the
// single HAPPY AI Employee — never a separate assistant identity.

export type SpecialistModeCode =
  | 'founder_advisor' | 'ceo_advisor'
  | 'sales_consultant' | 'marketing_consultant'
  | 'finance_consultant' | 'accounting_consultant' | 'revenue_consultant'
  | 'crm_consultant' | 'erp_consultant'
  | 'hr_consultant' | 'recruitment_consultant'
  | 'manufacturing_consultant' | 'warehouse_consultant' | 'inventory_consultant'
  | 'marketplace_consultant' | 'website_builder_consultant' | 'app_builder_consultant'
  | 'deployment_consultant' | 'plugin_consultant' | 'automation_consultant'
  | 'ai_consultant' | 'research_consultant'
  | 'education_consultant' | 'library_consultant' | 'razvi_academy_consultant'
  | 'support_consultant' | 'legal_consultant' | 'compliance_consultant'
  | 'security_consultant' | 'operations_consultant';

export type SpecialistDomain =
  | 'executive' | 'sales' | 'marketing' | 'finance' | 'crm' | 'erp'
  | 'hr' | 'manufacturing' | 'warehouse' | 'marketplace' | 'builder'
  | 'deployment' | 'automation' | 'ai' | 'knowledge' | 'learning'
  | 'support' | 'legal' | 'compliance' | 'security' | 'operations';

export type SessionStatus = 'active' | 'paused' | 'archived' | 'ended';

export type JsonValue =
  | string | number | boolean | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Fact {
  source_runtime: string;
  timestamp: string;
  evidence: JsonValue;
  confidence: number; // 0..1
}

export interface Recommendation {
  reason: string;
  confidence: number; // 0..1
  supporting_evidence: JsonValue[];
  source_runtime: string;
  timestamp: string;
}

export interface RouteResolution {
  mode: SpecialistModeCode;
  domain: SpecialistDomain;
  capability: string | null;
  routed_runtime: string;
  confidence: number;
}

export interface TurnResult {
  route: RouteResolution;
  facts: Fact[];
  recommendations: Recommendation[];
  latency_ms: number;
}
