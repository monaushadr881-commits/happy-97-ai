import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/analytics")({
  head: () => ({ meta: [{ title: "Runtime Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Analytics"
      description="Throughput, latency, success rate, and capability mix across the autonomous runtime."
      bullets={["Throughput", "Latency P50/P95/P99", "Success rate", "Capability mix", "Memory usage", "Health trend"]}
      apiHints={["apiRtAnalytics", "apiRtMetrics"]}
    />
  ),
});
