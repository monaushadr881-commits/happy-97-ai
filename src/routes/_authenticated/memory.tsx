/** /memory — Phase 2.6 Memory Intelligence Engine layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Brain, LayoutDashboard, Clock, Search, SlidersHorizontal, Settings as SettingsIcon } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/memory", label: "Overview", icon: Brain, exact: true },
  { to: "/memory/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/memory/timeline", label: "Timeline", icon: Clock },
  { to: "/memory/search", label: "Search", icon: Search },
  { to: "/memory/preferences", label: "Preferences", icon: SlidersHorizontal },
  { to: "/memory/settings", label: "Settings", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({ meta: [{ title: "Memory — HAPPY v2.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.0 · Phase 2.6"
      title="Memory Intelligence Engine"
      description="Working, long-term, conversation, preference and domain memories for the single Digital Human. Compression, ranking, recall and privacy contracts are reserved via the memory-v2 API."
      icon={Brain}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Memories tracked", value: "—", hint: "Reserved" },
          { label: "Active scopes", value: "8", hint: "Working, long-term, domain" },
          { label: "Compression ratio", value: "—", hint: "Ranking pending" },
          { label: "Privacy tier", value: "Enterprise", hint: "Encryption at rest" },
        ],
        note: "Memory scopes are wired to conversation, business, education, knowledge, creator, founder and automation. Runtime activates with the memory service.",
      }}
    />
  ),
});
