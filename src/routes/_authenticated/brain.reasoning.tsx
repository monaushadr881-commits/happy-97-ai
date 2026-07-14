import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/reasoning")({
  head: () => ({ meta: [{ title: "Brain Reasoning — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Reasoning Engine" description="Goal, constraints, dependencies, alternatives, confidence and risks." bullets={["Goal","Constraints","Dependencies","Alternatives","Ranking","Confidence","Risks"]} apiHints={["apiBrainReason"]} />,
});
