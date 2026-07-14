/** /learning-network — Enterprise Learning Network · v15.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/learning-network")({
  head: () => ({ meta: [{ title: "Enterprise Learning Network — HAPPY v15.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Enterprise Learning Network · v15.0"
      title="Enterprise Learning Network"
      description="Corporate learning, certification, training, skills, learning analytics, enterprise academy."
      icon={GraduationCap}
      features={["Corporate","Certification","Training","Skills","Analytics","Academy"]}
    />
  ),
});
