import { createFileRoute } from "@tanstack/react-router";
import { V2TabBody } from "@/components/happyx/V2Module";
export const Route = createFileRoute("/_authenticated/memory/search")({
  head: () => ({ meta: [{ title: "Memory Search — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2TabBody
      title="Memory Search"
      description="Semantic recall across every memory scope with confidence scoring and context expansion."
      bullets={["Semantic search", "Confidence scoring", "Context expansion", "Cross-scope recall", "Result ranking", "Related memories"]}
      apiHints={["apiMemorySearch", "apiMemoryRecall"]}
    />
  ),
});
