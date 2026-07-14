import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/education")({
  head: () => ({ meta: [{ title: "Education — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Learning"
      title="HAPPY Education Engine"
      icon={GraduationCap}
      description="From KG to PhD, competitive exams, coding, AI, business and languages — taught by HAPPY in a 3D classroom with adaptive mastery loops."
      features={["3D Classroom", "AI Teacher", "Whiteboard Mode", "Mock Tests", "Assignments", "Certificates", "Teach-Back", "Mastery Tracking", "Virtual Labs"]}
    />
  ),
});
