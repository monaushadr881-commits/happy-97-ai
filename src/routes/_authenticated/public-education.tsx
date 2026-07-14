/** /public-education — Public Education · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/public-education")({
  head: () => ({ meta: [{ title: "Public Education — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Public Education · v8.0"
      title="Public Education"
      description="School, college and university dashboards, student and teacher analytics, digital classrooms, examinations and scholarships."
      icon={GraduationCap}
      features={["School Dashboard","College Dashboard","University Dashboard","Student Analytics","Teacher Analytics","Institution Analytics","Digital Classrooms","Examinations","Scholarships"]}
    />
  ),
});
