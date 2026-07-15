/** /focus — UUE v5.0 · Focus Mode. */
import { createFileRoute } from "@tanstack/react-router";
import { Focus } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Ultimate User Experience · v5.0"
      title="Focus Mode"
      description="Minimal interface, deep-work timer, Pomodoro cycles and session analytics for sustained focus."
      icon={Focus}
      features={["Minimal UI","Deep work timer","Pomodoro","Session analytics","Distraction blocker"]}
    />
  ),
});
