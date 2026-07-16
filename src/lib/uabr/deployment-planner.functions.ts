/** R67 UABR — deployment planner. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUabrAccess } from "./gate";
import { NATIVE_BLOCK, type UabrDeployPlan } from "./contracts";

const ModeEnum = z.enum(["website", "pwa", "android", "ios", "desktop", "backend", "frontend", "complete", "enterprise"]);

export const generateDeploymentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({
    modes: z.array(ModeEnum).min(1).max(6),
    channel: z.enum(["internal", "beta", "production"]).default("beta"),
  }).parse(raw))
  .handler(async ({ context, data }): Promise<UabrDeployPlan> => {
    await assertUabrAccess(context);
    const targets: UabrDeployPlan["targets"] = [];
    if (data.modes.some((m) => ["website", "pwa", "frontend", "complete", "enterprise"].includes(m))) {
      targets.push({ name: "Web (Lovable Publish)", status: "ready" });
    }
    if (data.modes.includes("backend") || data.modes.includes("complete") || data.modes.includes("enterprise")) {
      targets.push({ name: "Server functions (co-deployed with web)", status: "ready" });
    }
    if (data.modes.includes("android") || data.modes.includes("complete") || data.modes.includes("enterprise")) {
      targets.push({ name: "Android Play Store", status: "blocked", blocked_reason: NATIVE_BLOCK.android.reason, external: NATIVE_BLOCK.android });
    }
    if (data.modes.includes("ios") || data.modes.includes("complete") || data.modes.includes("enterprise")) {
      targets.push({ name: "iOS App Store", status: "blocked", blocked_reason: NATIVE_BLOCK.ios.reason, external: NATIVE_BLOCK.ios });
    }
    if (data.modes.includes("desktop") || data.modes.includes("enterprise")) {
      targets.push({ name: "Desktop (Windows/macOS/Linux)", status: "blocked", blocked_reason: NATIVE_BLOCK.desktop.reason, external: NATIVE_BLOCK.desktop });
    }
    return {
      targets,
      release_channel: data.channel,
      rollback: "Previous published build can be restored from the Release Runtime rollout history.",
    };
  });
