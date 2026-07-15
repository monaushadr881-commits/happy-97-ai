/**
 * R39–R50 HAPPY Runtime — Persona registry.
 *
 * These personas are runtime hints that the brain uses when selecting a
 * behavior mode from the `happy_behavior` table. They are NOT alternate
 * identities; there is only ONE HAPPY (see R51).
 */

export const HAPPY_PERSONAS = [
  "founder",
  "business",
  "receptionist",
  "meeting",
  "learning",
  "teaching",
  "sales",
  "support",
  "research",
  "presentation",
  "professional",
  "friendly",
] as const;

export type HappyPersona = (typeof HAPPY_PERSONAS)[number];

export function isPersona(value: string): value is HappyPersona {
  return (HAPPY_PERSONAS as readonly string[]).includes(value);
}

export type PersonaContext = {
  persona: HappyPersona;
  audience: "founder" | "employee" | "customer" | "visitor" | "student";
  channel: "website" | "mobile" | "desktop" | "presentation" | "reception" | "meeting" | "training";
  language: string; // ISO 639-1
};

/**
 * Map an audience+channel to a default persona. Runtime callers can override.
 */
export function defaultPersona(
  audience: PersonaContext["audience"],
  channel: PersonaContext["channel"],
): HappyPersona {
  if (audience === "founder") return "founder";
  if (channel === "reception") return "receptionist";
  if (channel === "meeting") return "meeting";
  if (channel === "training") return "teaching";
  if (channel === "presentation") return "presentation";
  if (audience === "customer") return "sales";
  if (audience === "student") return "teaching";
  return "professional";
}
