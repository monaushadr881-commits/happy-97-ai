/** /global — v4.0 roadmap placeholder (Global Platform). */
import { createFileRoute } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/global")({
  head: () => ({ meta: [{ title: "Global — HAPPY Roadmap v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Roadmap · v4.0"
      title="Global Platform"
      description="Reserved surface for localization, regional settings, compliance, tax, currency, timezone and country profiles. Permissions and API contracts are reserved — engines activate with v4.0."
      icon={Globe2}
      features={[
        "Localization",
        "Regional Settings",
        "Compliance Engine",
        "Tax Engine",
        "Currency Engine",
        "Timezone Engine",
        "Country Profiles",
        "Global Expansion Center",
      ]}
    />
  ),
});
