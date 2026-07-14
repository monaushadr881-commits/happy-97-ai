/** /patients — Electronic Health Records · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/patients")({
  head: () => ({ meta: [{ title: "Electronic Health Records — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Electronic Health Records · v9.0"
      title="Electronic Health Records"
      description="Patient profile, medical history, allergies, medications, lab reports, radiology, vitals, diagnoses, treatment plans and discharge summaries."
      icon={UserCircle}
      features={["Patient Profile","Medical History","Allergies","Medications","Lab Reports","Radiology","Vitals","Diagnoses","Treatment Plans","Discharge Summary"]}
    />
  ),
});
