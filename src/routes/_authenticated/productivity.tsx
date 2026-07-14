/** /productivity — Unified Productivity · v16.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/productivity")({
  head: () => ({ meta: [{ title: "Unified Productivity — HAPPY v16.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Unified Productivity · v16.0"
      title="Unified Productivity"
      description="Email, calendar, tasks, goals, habits, projects, meeting assistant, reminders, focus dashboard."
      icon={CheckSquare}
      features={["Email","Calendar","Tasks","Goals","Habits","Projects","Meetings","Reminders","Focus"]}
    />
  ),
});
