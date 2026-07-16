/** R66 FAIOS — shared contract types. */

export type FaiosMode = "explain" | "suggest" | "preview" | "approval" | "automatic" | "emergency" | "read_only";
export type FaiosStatus =
  | "received" | "analyzing" | "planned" | "awaiting_approval"
  | "approved" | "rejected" | "executing" | "succeeded" | "failed" | "blocked";
export type FaiosRisk = "low" | "medium" | "high" | "critical";

export type FaiosCategory =
  | "ui" | "ux" | "seo" | "performance" | "bugfix" | "feature" | "refactor"
  | "content" | "database" | "security" | "deployment" | "build" | "docs"
  | "business" | "unknown";

export interface FaiosPlanStep {
  order: number;
  title: string;
  detail?: string;
  files?: string[];
  risk?: FaiosRisk;
  requires_credentials?: string[];
  blocked?: boolean;
  blocked_reason?: string;
}

export interface FaiosPlan {
  summary: string;
  category: FaiosCategory;
  risk: FaiosRisk;
  requires_approval: boolean;
  steps: FaiosPlanStep[];
  impact: {
    files_touched_estimate: number;
    performance?: string;
    security?: string;
    accessibility?: string;
    rollback?: string;
  };
  estimated_minutes: number;
  external_dependencies?: {
    secrets?: string[];
    accounts?: string[];
    toolchain?: string[];
  };
  blocked?: boolean;
  blocked_reason?: string;
}

export interface FaiosCommandRow {
  id: string;
  founder_id: string;
  raw_text: string;
  intent: string | null;
  category: FaiosCategory | null;
  status: FaiosStatus;
  mode: FaiosMode;
  plan: FaiosPlan | Record<string, unknown>;
  risk_level: FaiosRisk;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export const AUTO_MODE_FORBIDDEN: FaiosCategory[] = [
  "database", "security", "deployment",
];

export const READ_ONLY_INTENTS = [
  "explain", "analyze", "show", "list", "describe", "summarize",
];
