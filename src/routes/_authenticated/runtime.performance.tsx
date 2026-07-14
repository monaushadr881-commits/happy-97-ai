import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/performance")({
  head: () => ({ meta: [{ title: "Runtime Performance — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Runtime Performance"
      description="Throughput, latency P50/P95/P99, memory usage, GC, health trend, per-capability breakdown."
      bullets={["Throughput", "Latency", "Memory", "GC", "Trend", "Capability mix"]}
      apiHints={["performanceRuntimeService", "apiPerformanceStatus"]}
    />
  ),
});
