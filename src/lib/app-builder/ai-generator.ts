/**
 * R13 — AI App Tree Generator
 *
 * Real Lovable AI Gateway call — no mocks, no templates masquerading as AI.
 * Response is parsed against the AppTree Zod schema so a malformed model
 * output surfaces as a hard error rather than corrupt project state.
 */
import { appTreeSchema, type AppKind, type AppTree, APP_TREE_VERSION } from "./schema";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface AiAppGenerationInput {
  brief: string;
  kind: AppKind;
  projectName: string;
  brand?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    headingFont?: string;
    bodyFont?: string;
    voice?: string;
  };
  targets?: AppTree["build"]["targets"];
  model?: string;
}

export interface AiAppGenerationResult {
  tree: AppTree;
  model: string;
  latencyMs: number;
  usage?: { input_tokens?: number; output_tokens?: number };
}

const SYSTEM_PROMPT = `You are HAPPY's mobile+web app architect. You output ONLY strict JSON that matches the provided AppTree schema — no prose, no markdown fences.
Rules:
- version MUST be 1.
- Every screen path starts with '/'. The home screen path is '/'.
- Every component has id, type from the allowed enum, and props with real copy.
- Component types: button, input, textarea, select, checkbox, switch, card, list, list_item, avatar, badge, chip, nav_tabs, nav_drawer, app_bar, bottom_nav, dialog, sheet, toast, form, chart, map, camera, location, media, image, video, text, heading, divider, spacer, columns, row, notification_center, custom.
- Screen roles: auth, onboarding, home, list, detail, form, settings, profile, checkout, search, custom.
- Between 3 and 10 screens. Include a home screen. Ecommerce/marketplace: include cart + product/listing detail. Social: include feed + profile. Education: include courses + lesson detail.
- theme.primary/secondary/accent MUST be valid #rrggbb hex.
- navigation.primary is one of: bottom_tabs, drawer, top_tabs, stack. navigation.items reference existing screen ids.
- auth.providers is a subset of: email, google, apple, phone, magic_link.
- dataModel.entities is empty unless the brief clearly implies a specific table.`;

const TREE_JSON_HINT = `AppTree JSON shape:
{
  "version": 1,
  "kind": "<AppKind>",
  "displayName": "string",
  "description": "string",
  "theme": { "mode": "light|dark|auto|corporate|playful|custom", "primary": "#rrggbb", "secondary": "#rrggbb", "accent": "#rrggbb", "background": "#rrggbb", "foreground": "#rrggbb", "headingFont": "string", "bodyFont": "string", "radius": 0-32 },
  "auth": { "enabled": true, "providers": ["email"], "requiredForAllScreens": false },
  "dataModel": { "entities": [] },
  "navigation": { "primary": "bottom_tabs", "items": [{ "label": "Home", "screenId": "home" }] },
  "screens": [{
    "id": "home", "path": "/", "title": "Home", "role": "home",
    "requiresAuth": false, "layout": "stack",
    "components": [{ "id": "hero", "type": "heading", "props": { "text": "Welcome" } }],
    "state": {}
  }],
  "actions": [],
  "apiCalls": [],
  "assets": [],
  "build": { "targets": ["web","pwa"], "version": "0.1.0" }
}`;

function buildUserPrompt(input: AiAppGenerationInput): string {
  const brand = input.brand
    ? `Brand: primary=${input.brand.primary ?? "auto"}, secondary=${input.brand.secondary ?? "auto"}, accent=${input.brand.accent ?? "auto"}, headingFont=${input.brand.headingFont ?? "auto"}, bodyFont=${input.brand.bodyFont ?? "auto"}, voice=${input.brand.voice ?? "auto"}.`
    : "";
  const targets = input.targets?.length ? `Build targets: ${input.targets.join(",")}` : "Build targets: web,pwa";
  return [
    `App kind: ${input.kind}`,
    `App name: ${input.projectName}`,
    brand,
    targets,
    "",
    `Brief:\n${input.brief}`,
    "",
    TREE_JSON_HINT,
    "",
    "Return ONLY the AppTree JSON object.",
  ].filter(Boolean).join("\n");
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1].trim() : trimmed;
  try { return JSON.parse(body); } catch (e) {
    const s = body.indexOf("{"); const end = body.lastIndexOf("}");
    if (s >= 0 && end > s) return JSON.parse(body.slice(s, end + 1));
    throw new Error(`ai_response_not_json: ${(e as Error).message}`);
  }
}

export async function generateAppTree(input: AiAppGenerationInput): Promise<AiAppGenerationResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("missing_lovable_api_key");
  if (!input.brief?.trim()) throw new Error("empty_brief");

  const model = input.model ?? DEFAULT_MODEL;
  const startedAt = Date.now();

  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (resp.status === 402) throw new Error(`ai_credits_exhausted: ${body}`);
    if (resp.status === 429) throw new Error(`ai_rate_limited: ${body}`);
    throw new Error(`ai_gateway_${resp.status}: ${body.slice(0, 300)}`);
  }

  const payload = await resp.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("ai_empty_response");

  const raw = extractJson(content);
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (!("version" in obj)) obj.version = APP_TREE_VERSION;
    if (!("kind" in obj)) obj.kind = input.kind;
    if (!("displayName" in obj)) obj.displayName = input.projectName;
  }
  const parsed = appTreeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`ai_schema_invalid: ${parsed.error.issues.slice(0, 3).map((i) => i.message).join("; ")}`);
  }

  return {
    tree: parsed.data,
    model,
    latencyMs: Date.now() - startedAt,
    usage: {
      input_tokens: payload.usage?.input_tokens ?? payload.usage?.prompt_tokens,
      output_tokens: payload.usage?.output_tokens ?? payload.usage?.completion_tokens,
    },
  };
}
