/** HPE v1.0 — shared contracts. Expansion only, no modification of existing modules. */

export const PRESENCE_STATES = [
  "offline", "connecting", "online", "available", "busy",
  "thinking", "learning", "researching", "planning", "building",
  "monitoring", "analyzing", "listening", "speaking", "presenting",
  "teaching", "coding", "writing", "creating", "reading",
  "reviewing", "approving", "meeting", "waiting", "sleeping",
] as const;
export type PresenceState = (typeof PRESENCE_STATES)[number];

export const EMOTION_STATES = [
  "happy", "calm", "focused", "thinking", "celebrating",
  "concerned", "professional", "friendly", "motivational", "supportive",
] as const;
export type EmotionState = (typeof EMOTION_STATES)[number];

export const SUPPORTED_LANGUAGES = [
  "hi", "en", "hi-en", "ur", "ar", "fr", "es", "de", "ru",
  "zh", "ja", "ko", "ta", "te", "kn", "ml", "mr", "gu", "pa",
  "bn", "or", "as",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RELATIONSHIP_DEFAULTS = {
  language: "en" as SupportedLanguage,
  tone: "friendly" as "formal" | "casual" | "friendly" | "professional",
  greeting_style: "warm" as string,
  emoji_enabled: true,
  morning_behavior: "gentle" as string,
  night_behavior: "quiet" as string,
  working_hours: { start: "09:00", end: "19:00", timezone: "Asia/Kolkata" },
  holiday_behavior: "respect" as string,
  favorite_features: [] as string[],
  favorite_projects: [] as string[],
  favorite_brands: [] as string[],
  theme: "system" as string,
  voice: "default" as string,
  notification_style: "human" as string,
  writing_style: "concise" as string,
};

export type RelationshipPrefs = typeof RELATIONSHIP_DEFAULTS;

export const BRIEF_TYPES = [
  "morning", "evening", "night", "weekly", "monthly",
  "revenue", "website_health", "app_health", "server_health", "ai_health",
  "security_alerts", "growth_suggestions", "business_risks",
  "competitor_watch", "pending_tasks", "deployment_status",
  "release_status", "notification_summary",
] as const;
export type BriefType = (typeof BRIEF_TYPES)[number];

export const HEARTBEAT_INTERVAL_MS = 25_000;
export const PRESENCE_STALE_AFTER_MS = 90_000;
