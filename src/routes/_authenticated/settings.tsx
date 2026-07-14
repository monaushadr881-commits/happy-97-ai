import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="You"
      title="Account & Settings"
      icon={SettingsIcon}
      description="Manage your profile, security, sessions, notifications, privacy and connected apps."
      features={["Profile", "Password", "MFA", "Sessions", "Notifications", "Privacy", "API Keys", "Connected Apps", "Delete Account"]}
    />
  ),
});
