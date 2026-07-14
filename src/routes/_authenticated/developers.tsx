/** /developers — Phase 2.9 Developer Platform layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Code2, Package, Plug, Webhook, BookOpen } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/developers", label: "Overview", icon: Code2, exact: true },
  { to: "/developers/sdk", label: "SDK", icon: Package },
  { to: "/developers/apis", label: "APIs", icon: Plug },
  { to: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/developers/docs", label: "Docs", icon: BookOpen },
];

export const Route = createFileRoute("/_authenticated/developers")({
  head: () => ({ meta: [{ title: "Developers — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.9"
      title="Developer Platform"
      description="First-class portal for HAPPY builders — SDKs, APIs, webhooks, OAuth clients, sandbox and documentation."
      icon={Code2}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "API version", value: "v2", hint: "Versioned only" },
          { label: "SDK languages", value: "TS · Py · Go", hint: "Reserved" },
          { label: "OAuth clients", value: "0", hint: "Federation ready" },
          { label: "Sandbox", value: "Ready", hint: "Isolated env" },
        ],
        note: "All developer surfaces flow through the reserved developer-v2 API. RBAC, API keys and webhook signing align with existing security.",
      }}
    />
  ),
});
