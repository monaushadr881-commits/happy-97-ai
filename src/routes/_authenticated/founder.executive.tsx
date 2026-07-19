/**
 * /founder/executive — R181 Founder Dashboard coverage fix.
 * Directory of all AI Executive Board modules (R160-R180). Read-only surface
 * so Founder can locate every governance / C-suite module from one place.
 * Pure UI extension — no new runtime, no duplicate services.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import {
  Brain, Cpu, DollarSign, TrendingUp, Package, Users, FlaskConical,
  Rocket, Lightbulb, Compass, Palette, Shield, Bug, GitBranch,
  Undo2, FileText, Gauge, Search, BookOpen, Eye,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder/executive")({
  head: () => ({ meta: [{ title: "Executive Board — Founder" }, { name: "robots", content: "noindex" }] }),
  component: FounderExecutive,
});

type Entry = {
  code: string;
  title: string;
  description: string;
  module: string;
  route?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const EXEC_BOARD: Entry[] = [
  { code: "R171", title: "AI CTO", description: "Technology strategy, architecture governance, technical debt.", module: "src/lib/founder/ai-cto.ts", icon: Cpu },
  { code: "R172", title: "AI COO", description: "Operations excellence, runbooks, capacity planning.", module: "src/lib/founder/ai-coo.ts", icon: TrendingUp },
  { code: "R173", title: "AI CFO", description: "Financial governance, unit economics, runway.", module: "src/lib/founder/ai-cfo.ts", icon: DollarSign },
  { code: "R174", title: "AI CPO", description: "Product intelligence, roadmap alignment.", module: "src/lib/founder/ai-cpo.ts", route: "/roadmap", icon: Package },
  { code: "R175", title: "AI CGO", description: "Growth intelligence, funnel, retention.", module: "src/lib/founder/ai-cgo.ts", icon: Users },
  { code: "R176", title: "AI Research Director", description: "Research pipeline, evidence quality.", module: "src/lib/founder/ai-research-director.ts", route: "/research", icon: FlaskConical },
  { code: "R177", title: "AI Release Director", description: "Release planning, SemVer, rollout readiness.", module: "src/lib/founder/ai-release-director.ts", icon: Rocket },
  { code: "R178", title: "AI Innovation Director", description: "Discovers and prioritizes future innovations.", module: "src/lib/founder/ai-innovation-director.ts", route: "/innovation", icon: Lightbulb },
  { code: "R179", title: "AI Strategy Director", description: "Aligns all executive recommendations into unified strategy.", module: "src/lib/founder/ai-strategy-director.ts", route: "/executive", icon: Compass },
  { code: "R180", title: "AI Creative Director", description: "Brand consistency, creative QA, media governance.", module: "src/lib/founder/ai-creative-director.ts", icon: Palette },
];

const GOVERNANCE: Entry[] = [
  { code: "R158", title: "Approval Gateway", description: "Explain-Before-Execute contract, 17-stage pipeline.", module: "src/lib/founder/approval-gateway.ts", route: "/founder/security", icon: Shield },
  { code: "R159", title: "Intent Engine", description: "Natural language → engineering plan with clarifications.", module: "src/lib/founder/intent-engine.ts", icon: Brain },
  { code: "R160", title: "Guardian AI", description: "Critical-action guardrails, credit protection.", module: "src/lib/founder/guardian-ai.ts", icon: Shield },
  { code: "R161", title: "Software Architect", description: "Duplicate detection, canonical owner enforcement.", module: "src/lib/founder/software-architect.ts", icon: GitBranch },
  { code: "R162", title: "Code Review Engineer", description: "PR-quality automated review.", module: "src/lib/founder/code-review-engineer.ts", icon: Eye },
  { code: "R163", title: "QA Testing Engineer", description: "Test coverage assessment.", module: "src/lib/founder/qa-testing-engineer.ts", icon: Bug },
  { code: "R164", title: "Impact Analyzer", description: "Blast-radius analysis for every change.", module: "src/lib/founder/impact-analyzer.ts", icon: Gauge },
  { code: "R165", title: "Preview Studio", description: "Multi-surface preview before approval.", module: "src/lib/founder/preview-studio.ts", icon: Eye },
  { code: "R166", title: "Rollback Recovery", description: "Rollback envelopes, snapshots, restore plans.", module: "src/lib/founder/rollback-recovery.ts", icon: Undo2 },
  { code: "R167", title: "Documentation Engine", description: "Auto-generated docs, coverage tracking.", module: "src/lib/founder/documentation-engine.ts", icon: FileText },
  { code: "R168", title: "Optimization Advisor", description: "Perf / cost / bundle recommendations.", module: "src/lib/founder/optimization-advisor.ts", icon: Gauge },
  { code: "R169", title: "Learning Memory", description: "Founder-preference learning ledger.", module: "src/lib/founder/learning-memory.ts", route: "/learning", icon: BookOpen },
  { code: "R170", title: "Competitor Intelligence", description: "Ethical competitive signals.", module: "src/lib/founder/competitor-intelligence.ts", icon: Search },
];

function Grid({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <Panel className="p-5">
      <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">{title}</h2>
      <Hairline className="my-4" />
      <ul className="grid gap-3 md:grid-cols-2">
        {entries.map((e) => {
          const Icon = e.icon;
          const body = (
            <div className="flex items-start gap-3 rounded-md border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
              <Icon className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-paper text-sm font-medium truncate">{e.title}</span>
                  <Chip tone="neutral">{e.code}</Chip>
                  {e.route && <Chip tone="success">Route</Chip>}
                </div>
                <p className="text-xs text-soft-gray mt-0.5">{e.description}</p>
                <p className="text-[10px] font-mono text-soft-gray/60 mt-1 truncate">{e.module}</p>
              </div>
            </div>
          );
          return (
            <li key={e.code}>
              {e.route ? <Link to={e.route}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function FounderExecutive() {
  return (
    <>
      <PageHeader
        eyebrow="Mission Control"
        title="Executive Board & Governance"
        description="Every AI executive and governance module — the Founder's map to R158–R180."
      />
      <div className="space-y-4">
        <Grid title="AI Executive Board (R171–R180)" entries={EXEC_BOARD} />
        <Grid title="Governance Layer (R158–R170)" entries={GOVERNANCE} />
      </div>
    </>
  );
}
