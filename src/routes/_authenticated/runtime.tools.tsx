/** /runtime/tools — Phase 3.2 Tool Execution Runtime layout. */
import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Radio, History } from "lucide-react";
import { V2ModuleShell, type V2Tab } from "@/components/happyx/V2Module";

const tabs: V2Tab[] = [
  { to: "/runtime/tools", label: "Overview", icon: Wrench, exact: true },
  { to: "/runtime/tools/live", label: "Live", icon: Radio },
  { to: "/runtime/tools/history", label: "History", icon: History },
];

export const Route = createFileRoute("/_authenticated/runtime/tools")({
  head: () => ({ meta: [{ title: "Runtime Tools — HAPPY v2.1" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <V2ModuleShell
      eyebrow="Roadmap · v2.1 · Phase 3.2"
      title="Tool Execution Runtime"
      description="Dynamic tool loader, permission validator, sandboxed execution, health, queue, metrics and recovery — reused RBAC and audit."
      icon={Wrench}
      tabs={tabs}
      overview={{
        kpis: [
          { label: "Loader", value: "Dynamic", hint: "Lazy load" },
          { label: "Sandbox", value: "Isolated", hint: "Per-execution" },
          { label: "Queue", value: "0", hint: "Reserved" },
          { label: "Health", value: "Nominal", hint: "Monitors ready" },
        ],
        note: "Every tool call passes the permission validator and audit gate before dispatch. Runtime activates with tool-execution-v3.",
      }}
    />
  ),
});
