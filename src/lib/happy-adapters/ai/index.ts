/**
 * AI provider adapters. The canonical AI runtime is the Lovable AI Gateway
 * (routed via `LOVABLE_API_KEY` — always managed, always available). These
 * adapters exist so the canonical Brain (`src/lib/brain/engine.ts`) can be
 * routed to a BYO provider when a workspace explicitly overrides the default.
 * They DO NOT create a second Brain, model registry, or prompt pipeline.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError } from "../types";

export interface AiChatRequest { model: string; messages: Array<{ role: string; content: string }>; }
export interface AiChatResponse { text: string; providerRef?: string; }
export interface AiAdapter { id: string; isConfigured(): boolean; chat(req: AiChatRequest): Promise<AiChatResponse>; }

function make(id: string, envs: string[]): AiAdapter {
  return {
    id,
    isConfigured: () => checkEnv(envs).configured,
    async chat() {
      const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: override adapter — canonical calls go through Lovable AI Gateway`);
    },
  };
}

export const lovable: AiAdapter = {
  id: "ai.lovable_gateway",
  isConfigured: () => checkEnv(["LOVABLE_API_KEY"]).configured,
  async chat() {
    throw new Error("ai.lovable_gateway: use src/lib/happy-chat.functions.ts (canonical owner)");
  },
};

export const openai = make("ai.openai", ["OPENAI_API_KEY"]);
export const gemini = make("ai.gemini", ["GEMINI_API_KEY"]);
export const anthropic = make("ai.anthropic", ["ANTHROPIC_API_KEY"]);
export const local = make("ai.local", ["LOCAL_MODEL_BASE_URL"]);

export const registry: Record<string, AiAdapter> = { lovable, openai, gemini, anthropic, local };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "ai.lovable_gateway": ["LOVABLE_API_KEY"],
    "ai.openai": ["OPENAI_API_KEY"],
    "ai.gemini": ["GEMINI_API_KEY"],
    "ai.anthropic": ["ANTHROPIC_API_KEY"],
    "ai.local": ["LOCAL_MODEL_BASE_URL"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
