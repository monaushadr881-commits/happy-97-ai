/**
 * HAPPY X Kernel — Configuration Manager
 *
 * Immutable runtime configuration composed from environment + defaults.
 * Client-safe: only reads VITE_* variables in the browser.
 */

export interface HappyXConfig {
  readonly app: {
    readonly name: string;
    readonly company: string;
    readonly version: string;
    readonly environment: "development" | "preview" | "production";
  };
  readonly supabase: {
    readonly url: string;
    readonly publishableKey: string;
    readonly projectId: string;
  };
  readonly ai: {
    readonly defaultChatModel: string;
    readonly defaultImageModel: string;
  };
  readonly features: {
    readonly community: boolean;
    readonly marketplace: boolean;
    readonly studio: boolean;
    readonly enterprise: boolean;
  };
}

function env(key: string, fallback = ""): string {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function detectEnvironment(): HappyXConfig["app"]["environment"] {
  if (import.meta.env.DEV) return "development";
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host.includes("-dev.lovable.app") || host.includes("preview")) return "preview";
  return "production";
}

export const config: HappyXConfig = Object.freeze({
  app: {
    name: "HAPPY X",
    company: "HAPPY PERSON PRIVATE LIMITED",
    version: "0.1.0",
    environment: detectEnvironment(),
  },
  supabase: {
    url: env("VITE_SUPABASE_URL"),
    publishableKey: env("VITE_SUPABASE_PUBLISHABLE_KEY"),
    projectId: env("VITE_SUPABASE_PROJECT_ID"),
  },
  ai: {
    defaultChatModel: "openai/gpt-5.5",
    defaultImageModel: "google/gemini-3-pro-image",
  },
  features: {
    community: true,
    marketplace: true,
    studio: true,
    enterprise: true,
  },
});
