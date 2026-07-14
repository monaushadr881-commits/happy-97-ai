import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/reflection")({
  head: () => ({ meta: [{ title: "Brain Reflection — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Reflection Engine" description="Internal self-evaluation. Never exposed as chain-of-thought." bullets={["Completeness","Quality","Confidence","Follow-up"]} apiHints={["apiBrainReflect"]} />,
});
