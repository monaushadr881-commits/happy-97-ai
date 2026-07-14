import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/health")({
  head: () => ({ meta: [{ title: "Brain Health — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Brain Health" description="Kernel health, queue depth, capability usage, memory pressure and confidence." bullets={["Kernel","Queue","Capability","Memory","Confidence","Timeline"]} apiHints={["apiBrainHealth"]} />,
});
