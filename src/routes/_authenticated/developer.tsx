import { createFileRoute } from "@tanstack/react-router";
import { PersonaDashboard } from "@/components/happyx/PersonaDashboard";
import { Key, Code2, Blocks, Sparkles, ScrollText, BarChart3, TerminalSquare, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({ meta: [{ title: "Developer Dashboard — HAPPY X" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PersonaDashboard
      persona="Developer"
      subtitle="API keys, SDKs, plugins, skills, and deployments."
      tiles={[
        { icon: Key, label: "API Keys", desc: "Create · Rotate · Revoke" },
        { icon: Code2, label: "SDK", desc: "TypeScript · Python · REST" },
        { icon: Blocks, label: "Plugins", desc: "Publish & manage" },
        { icon: Sparkles, label: "Skills", desc: "Agent skills registry" },
        { icon: ScrollText, label: "Logs", desc: "Request & error logs" },
        { icon: BarChart3, label: "Analytics", desc: "Usage & performance" },
        { icon: TerminalSquare, label: "Sandbox", desc: "Test environment" },
        { icon: Rocket, label: "Deployments", desc: "Preview & production" },
      ]}
    />
  ),
});
