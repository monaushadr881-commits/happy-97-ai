/** /coach — UUE v5.0 · AI Coach. */
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "Coach — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="AI Coach"
      description="Contextual tips, interactive tutorials, learning mode, recommendations and workflow guidance."
      icon={GraduationCap}
      features={["Contextual tips","Tutorials","Learning mode","Recommendations","Workflow guidance"]}
    />
  ),
});
