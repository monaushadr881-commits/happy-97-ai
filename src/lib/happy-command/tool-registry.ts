/**
 * HAPPY Tool Registry — canonical catalogue of what the SYSTEM can execute.
 *
 * Extends `src/lib/happy-command/agent-roster.ts` (who) and
 * `skill-registry.ts` (what an agent can do). A TOOL is the concrete
 * executor. PURE DATA + PURE FUNCTIONS: no runtime, no table, no provider.
 *
 * Honesty rule: a tool whose real integration is not wired in this
 * repository is marked `unavailable` and resolution returns
 * `CAPABILITY_UNAVAILABLE`. Never pretend an execution succeeded.
 */

export type HappyToolCategory =
  | "browser"
  | "computer"
  | "file"
  | "git"
  | "github"
  | "database"
  | "api"
  | "build"
  | "deployment"
  | "storage"
  | "search"
  | "document"
  | "image"
  | "video"
  | "audio"
  | "communication"
  | "analytics";

export type WorkforceRisk = "low" | "medium" | "high" | "critical";

export type ToolAvailability = "available" | "unavailable";

export const CAPABILITY_UNAVAILABLE = "CAPABILITY_UNAVAILABLE" as const;

export interface HappyTool {
  readonly id: string;
  readonly name: string;
  readonly category: HappyToolCategory;
  readonly input: string;
  readonly output: string;
  /** Permission scope required before this tool may run. */
  readonly permission: string;
  readonly risk: WorkforceRisk;
  /** Existing canonical owner or external integration, null when none. */
  readonly integration: string | null;
  readonly availability: ToolAvailability;
  readonly version: string;
}

export const HAPPY_TOOLS: readonly HappyTool[] = [
  {
    id: "tool.database.query",
    name: "Database Query",
    category: "database",
    input: "{ table, filters, columns }",
    output: "{ rows[] }",
    permission: "read:schema",
    risk: "low",
    integration: "src/integrations/supabase/client.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.database.migration",
    name: "Database Migration",
    category: "database",
    input: "{ sql }",
    output: "{ applied, statements }",
    permission: "write:migration",
    risk: "critical",
    integration: "supabase migrations",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.api.serverfn",
    name: "Server Function Call",
    category: "api",
    input: "{ capability, payload }",
    output: "{ result }",
    permission: "read:repo",
    risk: "medium",
    integration: "src/lib/api-v1.functions.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.build.pipeline",
    name: "Build Pipeline",
    category: "build",
    input: "{ target, mode }",
    output: "{ status, logs }",
    permission: "read:repo",
    risk: "medium",
    integration: "src/lib/builder/builder-submit.functions.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.storage.object",
    name: "Storage Object",
    category: "storage",
    input: "{ bucket, path, body }",
    output: "{ path, url }",
    permission: "write:content",
    risk: "medium",
    integration: "src/lib/cloud/cloud.functions.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.search.universal",
    name: "Universal Search",
    category: "search",
    input: "{ query, scope }",
    output: "{ hits[] }",
    permission: "read:knowledge",
    risk: "low",
    integration: "src/lib/founder/search.functions.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.document.generate",
    name: "Document Generator",
    category: "document",
    input: "{ type, outline }",
    output: "{ document_id, version }",
    permission: "write:docs",
    risk: "low",
    integration: "src/lib/founder/document.functions.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.analytics.report",
    name: "Analytics Report",
    category: "analytics",
    input: "{ metric, range }",
    output: "{ series[] }",
    permission: "read:analytics",
    risk: "low",
    integration: "src/services/domain/analytics.service.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.browser.fetch",
    name: "Browser / Web Fetch",
    category: "browser",
    input: "{ url }",
    output: "{ content }",
    permission: "read:knowledge",
    risk: "low",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.computer.shell",
    name: "Computer Control",
    category: "computer",
    input: "{ command }",
    output: "{ stdout, stderr }",
    permission: "platform.manage",
    risk: "critical",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.file.workspace",
    name: "Workspace File I/O",
    category: "file",
    input: "{ path, content }",
    output: "{ path }",
    permission: "write:code",
    risk: "high",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.git.commit",
    name: "Git Operations",
    category: "git",
    input: "{ branch, message }",
    output: "{ sha }",
    permission: "write:code",
    risk: "high",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.github.repo",
    name: "GitHub Repository",
    category: "github",
    input: "{ repo, action }",
    output: "{ result }",
    permission: "write:deployment",
    risk: "high",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.deployment.release",
    name: "Deployment Release",
    category: "deployment",
    input: "{ environment, build_id }",
    output: "{ deployment_id, status }",
    permission: "write:deployment",
    risk: "high",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.image.generate",
    name: "Image Generation",
    category: "image",
    input: "{ prompt, size }",
    output: "{ asset_path }",
    permission: "write:content",
    risk: "low",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.video.render",
    name: "Video Render",
    category: "video",
    input: "{ script, assets }",
    output: "{ asset_path }",
    permission: "write:content",
    risk: "medium",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
  {
    id: "tool.audio.tts",
    name: "Audio / Voice",
    category: "audio",
    input: "{ text, voice }",
    output: "{ audio_url }",
    permission: "write:content",
    risk: "low",
    integration: "src/routes/api/dh.tts.ts",
    availability: "available",
    version: "v1",
  },
  {
    id: "tool.communication.send",
    name: "Outbound Communication",
    category: "communication",
    input: "{ channel, recipients, template }",
    output: "{ delivery_id }",
    permission: "write:campaign",
    risk: "high",
    integration: null,
    availability: "unavailable",
    version: "v1",
  },
];

const BY_ID = new Map(HAPPY_TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): HappyTool | undefined {
  return BY_ID.get(id);
}

export function toolsInCategory(category: HappyToolCategory): readonly HappyTool[] {
  return HAPPY_TOOLS.filter((t) => t.category === category);
}

/** First available tool in a category, otherwise the first declared one. */
export function preferredTool(category: HappyToolCategory): HappyTool | undefined {
  const list = toolsInCategory(category);
  return list.find((t) => t.availability === "available") ?? list[0];
}

const RISK_ORDER: Record<WorkforceRisk, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function maxRisk(...levels: readonly WorkforceRisk[]): WorkforceRisk {
  return levels.reduce<WorkforceRisk>((a, b) => (RISK_ORDER[b] > RISK_ORDER[a] ? b : a), "low");
}

/** HIGH and CRITICAL always route through the existing approval system. */
export function riskRequiresApproval(risk: WorkforceRisk): boolean {
  return RISK_ORDER[risk] >= RISK_ORDER["high"];
}
