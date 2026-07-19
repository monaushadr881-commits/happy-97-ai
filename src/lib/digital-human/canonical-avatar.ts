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
