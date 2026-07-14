/** /white-label — White Label · Domains & Hosting. */
import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/white-label")({
  head: () => ({ meta: [{ title: "White Label — HAPPY" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Domains & Hosting"
      title="White Label"
      description="Remove HAPPY branding, custom footer, login, emails & domain (Premium+)."
      icon={Palette}
      features={["Realtime","Multi-channel","AI-powered","Analytics","Automation","Founder controls","RBAC","Audit"]}
    />
  ),
});
