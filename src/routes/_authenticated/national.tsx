/** /national — National Analytics · v8.0 surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/national")({
  head: () => ({ meta: [{ title: "National Analytics — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="National Analytics · v8.0"
      title="National Analytics"
      description="Population, economic, employment, education, healthcare, agriculture, transport and infrastructure analytics."
      icon={Flag}
      features={["Population","Economic","Employment","Education","Healthcare","Agriculture","Transport","Infrastructure"]}
    />
  ),
});
