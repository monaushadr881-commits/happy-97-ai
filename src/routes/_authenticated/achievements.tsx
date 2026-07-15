/** /achievements — UUE v5.0 · Achievements. */
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Achievements"
      description="XP, levels, badges, daily / weekly / monthly goals, milestones and rewards."
      icon={Trophy}
      features={["XP","Levels","Badges","Daily goals","Weekly goals","Monthly goals","Milestones","Rewards"]}
    />
  ),
});
