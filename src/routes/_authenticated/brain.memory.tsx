import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/brain/memory")({
  head: () => ({ meta: [{ title: "Brain Memory — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => <V2TabBody title="Brain Memory" description="Conversation, working, preference and domain memory." bullets={["Conversation","Working","Preference","Business","Education","Knowledge","Research","Creator","Founder","Automation"]} apiHints={["apiBrainMemory"]} />,
});
