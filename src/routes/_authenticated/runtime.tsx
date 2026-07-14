/** /runtime — Phase 3.0 Autonomous Capability Runtime (v2.1). */
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Radio, ListChecks, BarChart3, Settings as SettingsIcon, Target, Wrench, Workflow, BrainCircuit, CalendarRange, ShieldAlert, Compass } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/runtime", label: "Overview", icon: Activity, exact: true },
  { to: "/runtime/live", label: "Live", icon: Radio },
  { to: "/runtime/executions", label: "Executions", icon: ListChecks },
  { to: "/runtime/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/runtime/settings", label: "Settings", icon: SettingsIcon },
  { to: "/runtime/planning", label: "Planning", icon: Target },
  { to: "/runtime/goals", label: "Goals", icon: Compass },
  { to: "/runtime/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/runtime/risks", label: "Risks", icon: ShieldAlert },
  { to: "/runtime/tools", label: "Tools", icon: Wrench },
  { to: "/runtime/workflows", label: "Workflows", icon: Workflow },
  { to: "/runtime/intelligence", label: "Intelligence", icon: BrainCircuit },
];

export const Route = createFileRoute("/_authenticated/runtime")({
  head: () => ({ meta: [{ title: "Runtime — HAPPY v2.1" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.1 · Phase 3.0"
      title="Autonomous Capability Runtime"
      description="The first activation layer of HAPPY's single Digital Human. Intent → Capability → Planner → Memory → Tool → Execution → Validation → Response → Analytics."
      icon={Activity}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Runtime managers", value: "11", hint: "Capability, Execution, Context, Memory, Tool, Planner, Scheduler, Analytics, Health, Metrics" },
          { label: "Enabled runtimes", value: "8", hint: "Business, Education, Knowledge, Creator, Research, Support, Founder, Automation" },
          { label: "Pipeline stages", value: "9", hint: "Intent → Analytics" },
          { label: "Digital Human", value: "1", hint: "Single identity" },
        ],
        note: "All surfaces are wired against runtime-v3 contracts. Runtime activates once the capability kernel ships and reuses RBAC, RLS, audit, permissions and feature flags from the v1.0 kernel.",
      }}
    />
  ),
});
