/** /assets — Asset Management · v10.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Asset Management — HAPPY v10.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Asset Management · v10.0"
      title="Asset Management"
      description="Machine and equipment registry, asset tracking, lifecycle, calibration, health and analytics."
      icon={Boxes}
      features={["Machine Registry","Equipment Registry","Tracking","Lifecycle","Calibration","Health","Analytics"]}
    />
  ),
});
