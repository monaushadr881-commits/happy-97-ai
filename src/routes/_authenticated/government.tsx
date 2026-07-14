/** /government — Digital Government · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/government")({
  head: () => ({ meta: [{ title: "Digital Government — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Digital Government · v8.0"
      title="Digital Government"
      description="Citizen services, document center, certificates, licenses, identity verification, records, complaints, applications, tracking, approvals."
      icon={Landmark}
      features={["Citizen Services","Document Center","Certificates","Licenses","Identity Verification","Public Records","Complaints","Applications","Tracking","Approvals"]}
    />
  ),
});
