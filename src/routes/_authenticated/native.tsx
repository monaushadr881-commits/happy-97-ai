/** /native — v4.0 Native Apps surface. */
import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/native")({
  head: () => ({ meta: [{ title: "Native Apps — HAPPY v4.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global AI Platform · v4.0"
      title="Native Apps"
      description="Android, iOS, Tablet and Desktop shells with offline mode, push notifications and home-screen widgets — all speaking to the same HAPPY runtime."
      icon={Smartphone}
      features={[
        "Android",
        "iOS",
        "Tablet",
        "Desktop",
        "Offline Mode",
        "Push Notifications",
        "Widgets",
      ]}
    />
  ),
});
