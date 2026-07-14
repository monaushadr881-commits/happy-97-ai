import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/settings")({
  head: () => ({ meta: [{ title: "Runtime Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Settings"
      description="Feature flags, concurrency caps, timeouts, and per-capability enablement for the autonomous runtime."
      bullets={["Feature flags", "Concurrency", "Timeouts", "Per-capability toggles", "Sandbox policy", "Audit level"]}
      apiHints={["apiRtSettings", "apiRtUpdateSettings"]}
    />
  ),
});
