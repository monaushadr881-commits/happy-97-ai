/**
 * R12 — AI Site Tree Generator
 *
 * Uses the Lovable AI Gateway (LOVABLE_API_KEY) to turn a natural-language
 * brief into a fully validated SiteTree. This is a real model call — no
 * mock, no template. The response is parsed with the site tree Zod schema
 * so a malformed model output surfaces as an error instead of corrupt data.
 */
import {
  emptySiteTree,
  siteTreeSchema,
  type SiteTree,
  type WebsiteProjectKind,
} from "./schema";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export interface AiGenerationInput {
  brief: string;
  kind: WebsiteProjectKind;
  projectName: string;
  brand?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    headingFont?: string;
    bodyFont?: string;
    voice?: string;
  };
  model?: string;
}

export interface AiGenerationResult {
  tree: SiteTree;
  model: string;
  latencyMs: number;
  usage?: { input_tokens?: number; output_tokens?: number };
}

const SYSTEM_PROMPT = `You are HAPPY's website architect. You output ONLY strict JSON that matches the provided SiteTree schema — no prose, no markdown fences.
Rules:
- version MUST be 1.
- Every page path starts with '/'. Home is '/'.
- Every section has an id, a type from the allowed enum, and a props object with the copy for that section.
- Section types: hero, navbar, footer, features, cards, pricing, gallery, faq, testimonials, contact_form, map, video, cta, text, image, columns, table, chart, custom.
- Populate the seo.title and seo.description with real copy tailored to the brief.
- Populate theme.primary/secondary/accent as valid #rrggbb hex.
- Return between 3 and 8 pages depending on the kind. Corporate/business sites include About and Contact. Ecommerce includes a Shop page.
- Every section props object should include human-readable content: headline/subheadline for hero, items[] for features/cards/pricing/faq/testimonials, fields[] for contact_form.`;

const TREE_JSON_HINT = `SiteTree JSON shape:
{
  "version": 1,
  "theme": { "mode": "light|dark|aurora|corporate|luxury|custom", "primary": "#rrggbb", "secondary": "#rrggbb", "accent": "#rrggbb", "background": "#rrggbb", "foreground": "#rrggbb", "headingFont": "string", "bodyFont": "string", "radius": 0-32 },
  "seo": { "title": "string", "description": "string", "keywords": ["..."], "twitterCard": "summary_large_image" },
  "navigation": [{ "label": "Home", "href": "/" }],
  "pages": [{
    "id": "home", "path": "/", "title": "Home",
    "sections": [{ "id": "hero-1", "type": "hero", "props": { "headline": "...", "subheadline": "...", "ctaLabel": "..." } }]
  }]
}`;

function buildUserPrompt(input: AiGenerationInput): string {
  const brand = input.brand
    ? `Brand preferences: primary=${input.brand.primary ?? "auto"}, secondary=${input.brand.secondary ?? "auto"}, accent=${input.brand.accent ?? "auto"}, headingFont=${input.brand.headingFont ?? "auto"}, bodyFont=${input.brand.bodyFont ?? "auto"}, voice=${input.brand.voice ?? "auto"}.`
    : "";
  return [
    `Project kind: ${input.kind}`,
    `Project name: ${input.projectName}`,
    brand,
    "",
    `Brief:\n${input.brief}`,
    "",
    TREE_JSON_HINT,
    "",
    "Return ONLY the SiteTree JSON object.",
  ].filter(Boolean).join("\n");
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip ``` fences if the model added them despite instructions
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try { return JSON.parse(body); } catch (e) {
    // Attempt to salvage the first {...} block
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(body.slice(start, end + 1));
    }
    throw new Error(`ai_response_not_json: ${(e as Error).message}`);
  }
}

/**
 * Real Lovable AI call. Never mocked. On any failure we surface the reason
 * to the caller so the UI can show a truthful error (no silent template).
 */
export async function generateSiteTree(input: AiGenerationInput): Promise<AiGenerationResult> {
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
    const bodyText = await resp.text().catch(() => "");
    if (resp.status === 402) throw new Error(`ai_credits_exhausted: ${bodyText}`);
    if (resp.status === 429) throw new Error(`ai_rate_limited: ${bodyText}`);
    throw new Error(`ai_gateway_${resp.status}: ${bodyText.slice(0, 300)}`);
  }

  const payload = await resp.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("ai_empty_response");

  const raw = extractJson(content);
  // Ensure version is set even if model omits it.
  if (typeof raw === "object" && raw !== null && !("version" in raw)) {
    (raw as Record<string, unknown>).version = 1;
  }
  const parsed = siteTreeSchema.safeParse(raw);
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

/** Deterministic starter tree — used only when a project is created without AI */
export function starterTree(kind: WebsiteProjectKind, name: string): SiteTree {
  return emptySiteTree(name);
}
