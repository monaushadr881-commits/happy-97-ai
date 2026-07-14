import type { IntentKind } from "./intent";
export const contextCollector = {
  collect(userId: string | undefined, intent: IntentKind, extra?: Record<string, unknown>) {
    return {
      userId: userId ?? "anonymous",
      intent,
      at: new Date().toISOString(),
      workspace: (extra?.workspace as string) ?? "default",
      surfaces: ["conversation", "enterprise", "workspace", "business", "education", "knowledge", "founder", "automation"],
      extra: extra ?? {},
    };
  },
};
