import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/tools/settings")({
  head: () => ({ meta: [{ title: "Tool Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Tool Settings"
      description="Global tool policy: default permissions, allow-list, health thresholds and analytics opt-in."
      bullets={["Default permissions", "Allow-list", "Health thresholds", "Analytics opt-in", "Regional visibility", "Owner routing"]}
      apiHints={["apiTrSettings", "apiTrUpdateSettings"]}
    />
  ),
});
