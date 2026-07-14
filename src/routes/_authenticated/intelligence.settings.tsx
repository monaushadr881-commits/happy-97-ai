import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/settings")({
  head: () => ({ meta: [{ title: "Intelligence Settings — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Intelligence Settings"
      description="Configure forecast horizons, alert thresholds, report cadence and data scopes."
      bullets={["Forecast horizons", "Alert thresholds", "Report cadence", "Data scopes", "Advisor tone", "Privacy tier"]}
      apiHints={["apiIntelSettings", "apiIntelUpdateSettings"]}
    />
  ),
});
