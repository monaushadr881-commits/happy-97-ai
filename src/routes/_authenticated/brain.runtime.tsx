import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/runtime")({
  head: () => ({ meta: [{ title: "Brain Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Brain Runtime" description="Live orchestration of the Enterprise Brain pipeline." bullets={["Queue","Capability usage","Throughput","Latency","Confidence","Timeline"]} apiHints={["apiBrainStatus","apiBrainProcess"]} />,
});
