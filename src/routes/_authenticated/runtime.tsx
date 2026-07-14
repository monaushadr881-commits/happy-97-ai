/** /runtime — v3.1 Autonomous Intelligence Runtime shell. */
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, Radio, ListChecks, BarChart3, Settings as SettingsIcon, Target, Wrench,
  Workflow, BrainCircuit, CalendarRange, ShieldAlert, Compass, LayoutDashboard,
  Cpu, Database, GitBranch, PlayCircle, Eye, ScrollText, Gauge, Lock, Users,
  Bot, Puzzle, Code2, Sparkles,
} from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/runtime", label: "Overview", icon: Activity, exact: true },
  { to: "/runtime/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/runtime/live", label: "Live", icon: Radio },
  { to: "/runtime/health", label: "Health", icon: Gauge },
  { to: "/runtime/capabilities", label: "Capabilities", icon: Cpu },
  { to: "/runtime/memory", label: "Memory", icon: Database },
  { to: "/runtime/planning", label: "Planning", icon: Target },
  { to: "/runtime/decision", label: "Decision", icon: BrainCircuit },
  { to: "/runtime/execution", label: "Execution", icon: PlayCircle },
  { to: "/runtime/tools", label: "Tools", icon: Wrench },
  { to: "/runtime/workflows", label: "Workflows", icon: Workflow },
  { to: "/runtime/intelligence", label: "Intelligence", icon: BrainCircuit },
  { to: "/runtime/collaboration", label: "Collaboration", icon: Users },
  { to: "/runtime/automation", label: "Automation", icon: Bot },
  { to: "/runtime/plugins", label: "Plugins", icon: Puzzle },
  { to: "/runtime/developers", label: "Developers", icon: Code2 },
  { to: "/runtime/skills", label: "Skills", icon: Sparkles },
  { to: "/runtime/executions", label: "Executions", icon: ListChecks },
  { to: "/runtime/history", label: "History", icon: GitBranch },
  { to: "/runtime/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/runtime/monitor", label: "Monitor", icon: Eye },
  { to: "/runtime/logs", label: "Logs", icon: ScrollText },
  { to: "/runtime/performance", label: "Performance", icon: BarChart3 },
  { to: "/runtime/security", label: "Security", icon: Lock },
  { to: "/runtime/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/runtime/risks", label: "Risks", icon: ShieldAlert },
  { to: "/runtime/goals", label: "Goals", icon: Compass },
  { to: "/runtime/settings", label: "Settings", icon: SettingsIcon },
];

export const Route = createFileRoute("/_authenticated/runtime")({
  head: () => ({ meta: [{ title: "Runtime — HAPPY v3.1" }, { name: "robots", content: "noindex" }] }),
  component: RuntimeShell,
});

function RuntimeShell() {
  return (
    <V2ModuleShell
      eyebrow="Roadmap · v3.1 · Autonomous Intelligence Runtime"
      title="Autonomous Intelligence Runtime"
      description="One Digital Human. Capabilities, memory, planning, decision, execution, tools, workflows, collaboration, automation, plugins, developers and skills — orchestrated through a single autonomous runtime."
      icon={Activity}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Runtime managers", value: "15", hint: "Capability · Memory · Planning · Decision · Execution · Tool · Workflow · Collab · Automation · Plugin · Developer · Skills · Dashboard · Enterprise · Intelligence" },
          { label: "Capability runtimes", value: "10", hint: "Business · Education · Knowledge · Creator · Research · Support · Founder · Automation · Presentation · Whiteboard" },
          { label: "Pipeline stages", value: "9", hint: "Intent → Analytics" },
          { label: "Digital Human", value: "1", hint: "Single identity — always" },
        ],
        note: "v3.1 surfaces are wired against runtime-v3 service contracts and reuse RBAC, RLS, permissions, audit and feature flags from the v1.0 kernel. No new security model, no additional identities.",
      }}
    />
  );
}
