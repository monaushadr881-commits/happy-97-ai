import type { IntentKind } from "./intent";
const MAP: Record<IntentKind, string> = {
  greeting: "conversation", question: "knowledge", task: "execution",
  business: "business-os", education: "education-os", knowledge: "knowledge-os",
  research: "research", creator: "creator-studio", support: "support",
  founder: "founder-cc", automation: "automation", presentation: "presentation",
  whiteboard: "whiteboard", "multi-capability": "orchestrator",
};
export const capabilityCoordinator = {
  select(intent: IntentKind) { return MAP[intent] ?? "conversation"; },
  list() { return Object.entries(MAP).map(([intent, capability]) => ({ intent, capability })); },
};
