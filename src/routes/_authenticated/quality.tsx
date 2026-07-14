/** /quality — Quality Management · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/quality")({
  head: () => ({ meta: [{ title: "Quality Management — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Quality Management · v10.0"
      title="Quality Management"
      description="Quality dashboard, incoming/in-process/final inspection, QC, QA, CAPA and quality reports."
      icon={BadgeCheck}
      features={["Quality Dashboard","Incoming Inspection","In-Process","Final Inspection","QC","QA","CAPA","Reports"]}
    />
  ),
});
