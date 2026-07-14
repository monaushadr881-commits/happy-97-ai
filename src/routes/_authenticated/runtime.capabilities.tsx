import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/capabilities")({
  head: () => ({ meta: [{ title: "Capability Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Capability Runtime"
      description="Capability registry, loader, dispatcher, executor, validator, analytics, health, metrics, timeline and monitor for the single Digital Human."
      bullets={["Registry", "Loader", "Dispatcher", "Executor", "Validator", "Analytics", "Health", "Metrics", "Timeline", "Monitor"]}
      apiHints={["capabilitiesRuntimeService", "apiCapabilitiesStatus"]}
    />
  ),
});
