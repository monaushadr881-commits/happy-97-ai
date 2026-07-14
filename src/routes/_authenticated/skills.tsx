/** /skills — Phase 2.14 AI Skills Marketplace. */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Store, Package, LayoutGrid, Settings as SettingsIcon } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/skills", label: "Overview", icon: Sparkles, exact: true },
  { to: "/skills/store", label: "Store", icon: Store },
  { to: "/skills/installed", label: "Installed", icon: Package },
  { to: "/skills/categories", label: "Categories", icon: LayoutGrid },
  { to: "/skills/settings", label: "Settings", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skills Marketplace — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.14"
      title="AI Skills Marketplace"
      description="Registry, store, installer and analytics for enterprise skills: Business, Education, Research, Coding, Marketing, Finance, Accounting, Legal, Manufacturing, Healthcare, Agriculture, Sales, Support, Presentation, Writing, Translation."
      icon={Sparkles}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Default skills", value: "16", hint: "Verified" },
          { label: "Installed", value: "0", hint: "Reserved" },
          { label: "Categories", value: "8", hint: "Domain grouped" },
          { label: "Verification", value: "Enterprise", hint: "Signed manifests" },
        ],
        note: "Skills are installed under the existing RBAC kernel with granular permissions, analytics and ratings. Runtime activates with the skills service.",
      }}
    />
  ),
});
