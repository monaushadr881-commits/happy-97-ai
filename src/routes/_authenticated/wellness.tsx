/** /wellness — Wellness Platform · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/wellness")({
  head: () => ({ meta: [{ title: "Wellness Platform — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Wellness Platform · v9.0"
      title="Wellness Platform"
      description="Fitness, nutrition, sleep, mental wellness, habits, goals and progress analytics."
      icon={Activity}
      features={["Fitness","Nutrition","Sleep","Mental Wellness","Habits","Goals","Progress"]}
    />
  ),
});
