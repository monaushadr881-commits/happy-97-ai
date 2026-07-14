/** /laboratory — Laboratory OS · v9.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/laboratory")({
  head: () => ({ meta: [{ title: "Laboratory OS — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Laboratory OS · v9.0"
      title="Laboratory OS"
      description="Lab dashboard, sample collection, test orders, reports, machine integration, quality control and analytics."
      icon={FlaskConical}
      features={["Lab Dashboard","Sample Collection","Test Orders","Reports","Machine Integration","QC","Analytics"]}
    />
  ),
});
