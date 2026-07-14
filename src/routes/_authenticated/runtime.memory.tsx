import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/runtime/memory")({
  head: () => ({ meta: [{ title: "Memory Runtime — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Memory Runtime"
      description="Working, conversation, business, education, knowledge, creator, research, founder, automation, preference and task memory with ranking, compression, recall, search, relationships and analytics."
      bullets={["Working", "Conversation", "Business", "Education", "Knowledge", "Creator", "Research", "Founder", "Automation", "Preference", "Task", "Ranking", "Compression", "Recall", "Search", "Relationships", "Analytics"]}
      apiHints={["memoryRuntimeService", "apiMemoryStatus"]}
    />
  ),
});
