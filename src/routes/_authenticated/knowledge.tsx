import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Wisdom"
      title="Religion & Culture Knowledge"
      icon={BookOpen}
      description="A curated, respectful, source-cited library across world religions, philosophies, sciences and cultures — explored through HAPPY."
      features={["Cited Sources", "Multi-tradition", "Translations", "Study Paths", "Quotations", "Historical Context", "Comparative View"]}
    />
  ),
});
