/** /settings-theme — Dynamic Theme Engine v2.0 · Theme picker. */
import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings-theme")({
  head: () => ({ meta: [{ title: "Theme — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Dynamic Theme Engine · v2.0"
      title="Theme"
      description="Aurora Dynamic, Executive Dark, Professional Light and eight more premium themes. Instant switch, module-aware accents, seasonal collections."
      icon={Palette}
      features={["Aurora Dynamic","Executive Dark","Professional Light","Midnight Black","Ocean Blue","Emerald Green","Royal Purple","Sunset Orange","Rose Gold","Founder Gold","Seasonal","Brand themes"]}
    />
  ),
});
