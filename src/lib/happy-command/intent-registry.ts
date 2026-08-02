/**
 * HAPPY Natural Language Command Engine — Canonical Intent Registry
 *
 * Extends the canonical Founder pipeline (`src/lib/founder/pipeline.ts`)
 * and the canonical builder entry (`src/lib/builder/builder-submit.functions.ts`)
 * — no duplication.
 *
 * This module is PURE DATA + PURE FUNCTIONS. It owns the single intent
 * taxonomy used to convert a natural-language command into:
 *
 *   Intent → Requirements → Plan → Tasks → Agents → Execution
 *
 * It introduces NO runtime, NO table, NO AI provider, NO approval engine.
 * Every intent points at an EXISTING canonical route/runtime owner.
 */

export type HappyIntentId =
  | "build_app"
  | "build_website"
  | "build_mobile"
  | "build_game"
  | "build_database"
  | "build_api"
  | "build_agent"
  | "fix_bug"
  | "deploy"
  | "connect_domain"
  | "inspect_production"
  | "create_content"
  | "create_campaign"
  | "analyze_business"
  | "manage_knowledge"
  | "automate_task"
  | "unknown";

export type HappyRiskLevel = "low" | "medium" | "high";

export interface HappyIntentDefinition {
  readonly id: HappyIntentId;
  readonly label: string;
  /** Existing canonical route this intent executes through. */
  readonly targetRoute: string;
  /** Existing canonical builder surface slug (submitBuilderPrompt.surface). */
  readonly surface: string;
  /** Preset id passed to the canonical builder entry. */
  readonly preset: string;
  readonly risk: HappyRiskLevel;
  /** High-impact actions require Founder approval before execution. */
  readonly requiresApproval: boolean;
  /** Canonical stage sequence shown to the Founder before execution. */
  readonly stages: readonly string[];
  /** Lowercase keyword triggers used by the deterministic classifier. */
  readonly keywords: readonly string[];
  /** Requirement questions used to build the requirement analysis. */
  readonly requirements: readonly string[];
}

const BUILD_STAGES = [
  "Requirement analysis",
  "Architecture",
  "UI/UX",
  "Frontend",
  "Backend",
  "Database",
  "APIs",
  "Authentication",
  "Testing",
  "Build",
  "Preview",
] as const;

export const HAPPY_INTENTS: readonly HappyIntentDefinition[] = [
  {
    id: "build_app",
    label: "Build an application",
    targetRoute: "/builder/fullstack",
    surface: "fullstack",
    preset: "app",
    risk: "medium",
    requiresApproval: false,
    stages: BUILD_STAGES,
    keywords: ["build me an app", "create an app", "build an app", "application", "saas", "admin panel", "marketplace", "full stack", "fullstack"],
    requirements: ["Product goal", "Primary users", "Core modules", "Auth model", "Data entities", "Integrations"],
  },
  {
    id: "build_website",
    label: "Build a website",
    targetRoute: "/builder/website",
    surface: "website",
    preset: "business",
    risk: "low",
    requiresApproval: false,
    stages: ["Requirement analysis", "Sitemap", "Sections", "Copy", "Design", "SEO", "Responsive check", "Preview"],
    keywords: ["website", "landing page", "web page", "homepage", "portfolio", "blog", "company site"],
    requirements: ["Business name", "Pages required", "Brand tone", "Primary call to action", "SEO keywords"],
  },
  {
    id: "build_mobile",
    label: "Build a mobile app",
    targetRoute: "/builder/mobile",
    surface: "mobile",
    preset: "android-ios",
    risk: "medium",
    requiresApproval: false,
    stages: ["Requirement analysis", "Navigation", "Screens", "Auth", "Notifications", "Build config", "Store assets", "Preview"],
    keywords: ["mobile app", "android", "ios", "apk", "aab", "pwa", "play store", "app store"],
    requirements: ["Platforms", "Screens", "Auth model", "Push notifications", "Offline behaviour"],
  },
  {
    id: "build_game",
    label: "Build a game",
    targetRoute: "/builder/ui",
    surface: "game",
    preset: "2d",
    risk: "low",
    requiresApproval: false,
    stages: ["Concept", "Mechanics", "Characters", "Levels", "Assets", "Audio", "Game logic", "Testing", "Build"],
    keywords: ["game", "2d game", "3d game", "multiplayer", "leaderboard", "level design"],
    requirements: ["Genre", "Dimension (2D/3D)", "Core loop", "Player progression", "Platform"],
  },
  {
    id: "build_database",
    label: "Design a database",
    targetRoute: "/builder/database",
    surface: "database",
    preset: "schema",
    risk: "medium",
    requiresApproval: false,
    stages: ["Entity discovery", "Schema", "Relationships", "Indexes", "RLS policies", "Migrations", "Seed data"],
    keywords: ["database", "schema", "table", "migration", "relationship", "index", "seed data"],
    requirements: ["Entities", "Relationships", "Access model", "Retention rules"],
  },
  {
    id: "build_api",
    label: "Build an API",
    targetRoute: "/builder/api",
    surface: "api",
    preset: "rest",
    risk: "medium",
    requiresApproval: false,
    stages: ["Contract", "Endpoints", "Auth", "Validation", "Docs", "Tests", "Monitoring"],
    keywords: ["api", "rest", "endpoint", "webhook", "oauth", "api key", "integration api"],
    requirements: ["Resources", "Auth scheme", "Rate limits", "Consumers"],
  },
  {
    id: "build_agent",
    label: "Create an AI agent",
    targetRoute: "/builder/agents",
    surface: "agents",
    preset: "assistant",
    risk: "medium",
    requiresApproval: false,
    stages: ["Role definition", "Skills", "Tools", "Permissions", "Guardrails", "Evaluation", "Publish draft"],
    keywords: ["ai agent", "create an agent", "customer support agent", "agent store", "publish agent"],
    requirements: ["Agent role", "Tools allowed", "Permission scope", "Escalation rule"],
  },
  {
    id: "fix_bug",
    label: "Diagnose and fix",
    targetRoute: "/builder/code",
    surface: "code",
    preset: "debug",
    risk: "medium",
    requiresApproval: false,
    stages: ["Reproduce", "Diagnose", "Root cause", "Fix proposal", "Diff preview", "Tests", "Retest"],
    keywords: ["fix", "bug", "crash", "error", "not working", "broken", "debug", "why is"],
    requirements: ["Affected surface", "Reproduction steps", "Expected behaviour", "Severity"],
  },
  {
    id: "deploy",
    label: "Deploy",
    targetRoute: "/deployment",
    surface: "deploy",
    preset: "production",
    risk: "high",
    requiresApproval: true,
    stages: ["Pre-flight checks", "Build", "Staging", "Final check", "Approval", "Production deploy", "Health check", "Report"],
    keywords: ["deploy", "publish live", "go live", "ship it", "release", "production deploy", "rollback"],
    requirements: ["Target environment", "Version", "Rollback plan", "Health check targets"],
  },
  {
    id: "connect_domain",
    label: "Connect a domain",
    targetRoute: "/deployment",
    surface: "deploy",
    preset: "domain",
    risk: "high",
    requiresApproval: true,
    stages: ["Domain validation", "DNS plan", "Approval", "Binding", "SSL", "Verification"],
    keywords: ["domain", "dns", "subdomain", "ssl", "custom url", "connect my domain"],
    requirements: ["Domain name", "Registrar access", "Target project", "SSL mode"],
  },
  {
    id: "inspect_production",
    label: "Inspect production",
    targetRoute: "/mission-control",
    surface: "testing",
    preset: "inspect",
    risk: "low",
    requiresApproval: false,
    stages: ["Uptime check", "Error scan", "Performance scan", "Crash detection", "Report"],
    keywords: ["inspect", "monitor", "check my app", "check my website", "uptime", "performance", "health"],
    requirements: ["Target project", "Time window", "Metrics of interest"],
  },
  {
    id: "create_content",
    label: "Create content",
    targetRoute: "/builder/image",
    surface: "image",
    preset: "creative",
    risk: "low",
    requiresApproval: false,
    stages: ["Brief", "Concept", "Draft", "Brand check", "Refine", "Export"],
    keywords: ["logo", "poster", "thumbnail", "image", "video", "voice", "avatar", "design", "brand asset"],
    requirements: ["Asset type", "Dimensions", "Brand constraints", "Delivery format"],
  },
  {
    id: "create_campaign",
    label: "Create a campaign",
    targetRoute: "/communication",
    surface: "automation",
    preset: "campaign",
    risk: "high",
    requiresApproval: true,
    stages: ["Audience", "Message plan", "Calendar", "Creative", "Approval", "Publish", "Analytics"],
    keywords: ["campaign", "social media", "30 days of content", "content calendar", "broadcast", "mass email", "ad copy"],
    requirements: ["Channels", "Audience", "Duration", "Offer", "Budget"],
  },
  {
    id: "analyze_business",
    label: "Analyze business",
    targetRoute: "/analytics-platform",
    surface: "analytics",
    preset: "overview",
    risk: "low",
    requiresApproval: false,
    stages: ["Data scope", "KPI selection", "Analysis", "Insights", "Forecast", "Report"],
    keywords: ["analyze my business", "revenue", "sales report", "kpi", "forecast", "competitor", "trend"],
    requirements: ["Period", "Metrics", "Comparison baseline"],
  },
  {
    id: "manage_knowledge",
    label: "Manage knowledge",
    targetRoute: "/knowledge",
    surface: "research",
    preset: "knowledge",
    risk: "low",
    requiresApproval: false,
    stages: ["Source intake", "Ingestion", "Indexing", "Permissions", "Verification"],
    keywords: ["knowledge", "upload document", "ingest", "train on my data", "company data", "tutor", "learn"],
    requirements: ["Sources", "Audience", "Permission scope"],
  },
  {
    id: "automate_task",
    label: "Automate a task",
    targetRoute: "/builder/automation",
    surface: "automation",
    preset: "workflow",
    risk: "medium",
    requiresApproval: false,
    stages: ["Trigger", "Steps", "Conditions", "Error handling", "Dry run", "Enable"],
    keywords: ["automate", "workflow", "schedule", "recurring", "every day", "trigger", "when someone"],
    requirements: ["Trigger", "Steps", "Failure policy", "Schedule"],
  },
  {
    id: "unknown",
    label: "Clarify the request",
    targetRoute: "/assistant",
    surface: "chat",
    preset: "clarify",
    risk: "low",
    requiresApproval: false,
    stages: ["Clarify goal", "Confirm scope", "Route to owner"],
    keywords: [],
    requirements: ["Goal", "Expected outcome"],
  },
];

const BY_ID = new Map<HappyIntentId, HappyIntentDefinition>(
  HAPPY_INTENTS.map((i) => [i.id, i]),
);

export function getIntent(id: HappyIntentId): HappyIntentDefinition {
  return BY_ID.get(id) ?? BY_ID.get("unknown")!;
}

export interface IntentMatch {
  readonly intent: HappyIntentDefinition;
  readonly confidence: number;
  readonly matched: readonly string[];
}

/**
 * Deterministic keyword classifier. Runs BEFORE any model call so the
 * engine degrades gracefully when AI is unavailable.
 */
export function classifyCommand(raw: string): IntentMatch {
  const text = (raw ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return { intent: getIntent("unknown"), confidence: 0, matched: [] };

  let best: IntentMatch = { intent: getIntent("unknown"), confidence: 0, matched: [] };

  for (const def of HAPPY_INTENTS) {
    if (def.id === "unknown") continue;
    const matched: string[] = [];
    let score = 0;
    for (const kw of def.keywords) {
      if (text.includes(kw)) {
        matched.push(kw);
        // Longer phrases are stronger signals.
        score += kw.includes(" ") ? 3 : 1;
      }
    }
    if (score === 0) continue;
    const confidence = Math.min(0.95, 0.45 + score * 0.12);
    if (confidence > best.confidence) best = { intent: def, confidence, matched };
  }

  return best;
}

/** Strip the "HAPPY," / "Happy," addressing prefix from a command. */
export function normalizeCommand(raw: string): string {
  return (raw ?? "")
    .trim()
    .replace(/^["'«]?\s*happy\s*[,:—-]\s*/i, "")
    .replace(/^["'«]|["'»]$/g, "")
    .trim();
}
