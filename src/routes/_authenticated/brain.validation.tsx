import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/validation")({
  head: () => ({ meta: [{ title: "Brain Validation — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Validation Engine" description="Output, permission, business, security and quality validation." bullets={["Output","Permission","Business","Security","Quality"]} apiHints={["apiBrainValidate"]} />,
});
