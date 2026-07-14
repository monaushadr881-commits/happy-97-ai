import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/intelligence/live")({
  head: () => ({ meta: [{ title: "Live Intelligence — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Live Intelligence"
      description="Streaming view of active decisions, running workflows, capability dispatches and inbound signals."
      bullets={["Active decisions", "Running workflows", "Capability dispatch", "Inbound signals", "SLA heartbeat", "Live audit"]}
      apiHints={["apiDashLive", "apiArQueue", "apiWrMonitor"]}
    />
  ),
});
