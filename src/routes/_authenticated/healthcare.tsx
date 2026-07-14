/** /healthcare — Healthcare OS · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Hospital } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/healthcare")({
  head: () => ({ meta: [{ title: "Healthcare OS — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Healthcare OS · v9.0"
      title="Healthcare OS"
      description="Hospital, clinic, doctor, nurse, reception, emergency, OT, ICU, wards and patient journey orchestration."
      icon={Hospital}
      features={["Hospital Dashboard","Clinic Dashboard","Doctor Workspace","Nurse Workspace","Reception","Emergency","Operation Theatre","ICU","Ward Management","Patient Journey"]}
    />
  ),
});
