/** /tools — Phase 2.14 Enterprise Tool Runtime. */
import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Play, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/tools", label: "Overview", icon: Wrench, exact: true },
  { to: "/tools/runtime", label: "Runtime", icon: Play },
  { to: "/tools/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/tools/settings", label: "Settings", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({ meta: [{ title: "Tools — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.14"
      title="Enterprise Tool Runtime"
      description="Discovery, execution, validation, permissions, analytics and health for HAPPY's enterprise tool set: Business, Education, Knowledge, Creator and Automation tools."
      icon={Wrench}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Tool families", value: "5", hint: "Business, Education, Knowledge, Creator, Automation" },
          { label: "Enabled tools", value: "0", hint: "Reserved" },
          { label: "Health", value: "Nominal", hint: "Monitors ready" },
          { label: "Permission scopes", value: "RBAC", hint: "Reused kernel" },
        ],
        note: "Every tool call passes validation, permission and audit gates before dispatch. Runtime activates with the tool-runtime service.",
      }}
    />
  ),
});
