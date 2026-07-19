/**
 * HAPPY™ Canonical Avatar — R190 Batch 1
 *
 * SINGLE canonical Digital Human identity for the entire HAPPY X ecosystem.
 * Extends the existing Digital Human runtime owner
 * (`src/lib/digital-human/digital-human-runtime.functions.ts`) — does NOT
 * introduce a new runtime, module, memory, or dashboard.
 *
 * All future outfits, animations, voices, expressions, and 3D models MUST
 * extend this profile. Never register a second Founder avatar.
 */
import avatarAsset from "@/assets/happy-avatar.png.asset.json";

export const HAPPY_CANONICAL_AVATAR = Object.freeze({
  id: "happy.canonical.v1",
  name: "HAPPY™",
  identity: "Founder AI",
  role: "Universal AI Assistant",
  status: "primary" as const,
  gender: "male" as const,
  version: "1.0.0",
  image_url: avatarAsset.url,
  asset_id: avatarAsset.asset_id,
  appearance: Object.freeze({
    style: "Executive",
    suit: "Black",
    shirt: "White",
    footwear: "White Sneakers",
    theme: "Premium Black & Gold",
  }),
  capabilities: Object.freeze([
    "conversation", "voice", "presentation", "teaching",
    "business-consulting", "revenue-guidance", "education",
    "marketplace", "healthcare", "manufacturing", "agriculture",
    "founder-mode", "mission-control",
  ] as const),
  emotions: Object.freeze([
    "neutral", "happy", "thinking", "explaining", "greeting",
    "celebrating", "warning", "focused", "listening",
  ] as const),
  animations: Object.freeze([
    "idle", "walk", "talk", "point", "explain",
    "sit", "stand", "wave", "typing", "presentation",
  ] as const),
  voices: Object.freeze([
    { locale: "hi-IN", label: "Hindi", status: "active" },
    { locale: "en-IN", label: "English", status: "active" },
    { locale: "ur-PK", label: "Urdu", status: "active" },
  ] as const),
  future_multilingual: true,
  canonical: true as const,
});

export type HappyCanonicalAvatar = typeof HAPPY_CANONICAL_AVATAR;

/**
 * R190 Batch 2 — Canonical extension libraries.
 *
 * Extends the SINGLE HAPPY™ Canonical Avatar with Conversation Modes,
 * Voice Modes, Expression Library, and Presentation Modes. These are
 * additive tables consumed by the existing Digital Human runtime — no
 * second avatar, no second runtime, no duplicate voice/experience/memory.
 */

export const HAPPY_CONVERSATION_MODES = Object.freeze([
  { id: "business-advisor",   label: "Business Advisor",   tone: "executive",     domain: "business"      },
  { id: "teacher",            label: "Teacher",            tone: "educational",   domain: "education"     },
  { id: "sales-assistant",    label: "Sales Assistant",    tone: "friendly",      domain: "commerce"      },
  { id: "healthcare-guide",   label: "Healthcare Guide",   tone: "professional",  domain: "healthcare"    },
  { id: "manufacturing-guide",label: "Manufacturing Guide",tone: "professional",  domain: "manufacturing" },
  { id: "agriculture-guide",  label: "Agriculture Guide",  tone: "friendly",      domain: "agriculture"   },
  { id: "marketplace-guide",  label: "Marketplace Guide",  tone: "friendly",      domain: "marketplace"   },
  { id: "founder-mode",       label: "Founder Mode",       tone: "executive",     domain: "founder"       },
] as const);

export const HAPPY_VOICE_MODES = Object.freeze([
  { id: "professional",  label: "Professional",  pitch: "neutral", pace: "steady"   },
  { id: "friendly",      label: "Friendly",      pitch: "warm",    pace: "relaxed"  },
  { id: "motivational",  label: "Motivational",  pitch: "bright",  pace: "dynamic"  },
  { id: "executive",     label: "Executive",     pitch: "deep",    pace: "measured" },
  { id: "educational",   label: "Educational",   pitch: "clear",   pace: "slow"     },
] as const);

export const HAPPY_EXPRESSION_LIBRARY = Object.freeze([
  { id: "thinking",    label: "Thinking",    emotion: "thinking"    },
  { id: "listening",   label: "Listening",   emotion: "listening"   },
  { id: "explaining",  label: "Explaining",  emotion: "explaining"  },
  { id: "greeting",    label: "Greeting",    emotion: "greeting"    },
  { id: "warning",     label: "Warning",     emotion: "warning"     },
  { id: "approval",    label: "Approval",    emotion: "happy"       },
  { id: "celebration", label: "Celebration", emotion: "celebrating" },
  { id: "success",     label: "Success",     emotion: "happy"       },
  { id: "failure",     label: "Failure",     emotion: "focused"     },
] as const);

export const HAPPY_PRESENTATION_MODES = Object.freeze([
  { id: "meeting",           label: "Meeting",           animation: "sit"          },
  { id: "training",          label: "Training",          animation: "explain"      },
  { id: "business-pitch",    label: "Business Pitch",    animation: "presentation" },
  { id: "product-demo",      label: "Product Demo",      animation: "point"        },
  { id: "dashboard-review",  label: "Dashboard Review",  animation: "typing"       },
  { id: "founder-briefing",  label: "Founder Briefing",  animation: "stand"        },
] as const);

export type HappyConversationMode = (typeof HAPPY_CONVERSATION_MODES)[number]["id"];
export type HappyVoiceMode        = (typeof HAPPY_VOICE_MODES)[number]["id"];
export type HappyExpression       = (typeof HAPPY_EXPRESSION_LIBRARY)[number]["id"];
export type HappyPresentationMode = (typeof HAPPY_PRESENTATION_MODES)[number]["id"];
