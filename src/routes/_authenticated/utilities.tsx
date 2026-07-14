/** /utilities — Smart Utilities · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/utilities")({
  head: () => ({ meta: [{ title: "Smart Utilities — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Smart Utilities · v8.0"
      title="Smart Utilities"
      description="Water, electricity, gas, internet, street lights, waste collection, asset monitoring and utility analytics."
      icon={Zap}
      features={["Water","Electricity","Gas","Internet","Street Lights","Waste Collection","Asset Monitoring","Utility Analytics"]}
    />
  ),
});
