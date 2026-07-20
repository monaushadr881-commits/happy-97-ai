/**
 * /platform — HAPPY X Final Platform Integration™ (R214)
 *
 * ONE integration hub — thin presentation shell that links every builder
 * and every canonical runtime already shipped. STRICT REUSE:
 *   • No new runtime · no new server-fn · no new API · no new component.
 *   • Reuses HappyUniversalPromptBar + HappyUniversalActionBar as the
 *     single AI + action surface across the platform.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Globe, Smartphone, Server, Bot, Code2, Clapperboard, Rocket,
  Sparkles, BookOpen, Users, Activity, Wand2, Send, Zap,
  Building2, Search, Database, Plug, Palette, FileText,
  Presentation, Image as ImageIcon, Video, Mic, MessageSquare,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/platform")({
  head: () => ({
    meta: [
      { title: "HAPPY X Platform — Integrated Builders & Runtimes" },
      { name: "description", content: "Every HAPPY X builder and canonical runtime, integrated behind one prompt bar and one action bar." },
    ],
  }),
  component: PlatformHubRoute,
});

const BUILDERS: { to: string; label: string; icon: React.ReactNode; hint: string }[] = [
  { to: "/builder/website",   label: "Website Builder",   icon: <Globe className="h-4 w-4" />,        hint: "AI, Landing, Business, Ecommerce, CMS, SEO." },
  { to: "/builder/mobile",    label: "Mobile Builder",    icon: <Smartphone className="h-4 w-4" />,   hint: "React Native, Expo, Android, iOS, Push, Offline." },
  { to: "/builder/fullstack", label: "Full Stack Builder",icon: <Server className="h-4 w-4" />,       hint: "Frontend, Backend, DB, API, Auth, RBAC, Deploy." },
  { to: "/builder/agents",    label: "AI Agent Builder",  icon: <Bot className="h-4 w-4" />,          hint: "Sales, Support, HR, WhatsApp, Voice, Automation." },
  { to: "/builder/code",      label: "Code Workspace",    icon: <Code2 className="h-4 w-4" />,        hint: "Editor, Diff, Terminal, Errors, Git, Deploy." },
  { to: "/studio",            label: "Media Studio",      icon: <Clapperboard className="h-4 w-4" />, hint: "Assets, Image, Voice, Brand, Marketing, Exports." },
  { to: "/builder/deploy",    label: "Deployment Center", icon: <Rocket className="h-4 w-4" />,       hint: "GitHub, Vercel, Netlify, Cloudflare, Docker, ZIP." },
];

const RUNTIMES: { label: string; icon: React.ReactNode; note: string }[] = [
  { label: "Universal Prompt Bar", icon: <Wand2 className="h-4 w-4" />,     note: "Canonical AI composer for every surface." },
  { label: "Universal Action Bar", icon: <Send className="h-4 w-4" />,      note: "Copy · Edit · Save · Build · Export · Share." },
  { label: "Knowledge",            icon: <BookOpen className="h-4 w-4" />,  note: "Knowledge Runtime · retrieval + citations." },
  { label: "Workspace",            icon: <Users className="h-4 w-4" />,     note: "Workspace Awareness · roles + rooms." },
  { label: "Mission Control",      icon: <Activity className="h-4 w-4" />,  note: "Live pipeline / audit / delivery." },
  { label: "Creator",              icon: <Sparkles className="h-4 w-4" />,  note: "Founder file/asset generation." },
  { label: "Publishing",           icon: <Rocket className="h-4 w-4" />,    note: "Deploy · Export · Distribution." },
  { label: "Automation",           icon: <Zap className="h-4 w-4" />,       note: "Triggers · workflows · schedules." },
  { label: "Digital Human",        icon: <Bot className="h-4 w-4" />,       note: "HAPPY avatar · voice · expressions." },
  { label: "Business",             icon: <Building2 className="h-4 w-4" />, note: "Dealer · Order · CRM · Manufacturing." },
  { label: "Universal Search",     icon: <Search className="h-4 w-4" />,    note: "Cross-domain search index." },
];

function PlatformHubRoute() {
  return (
    <Container className="py-6 md:py-10">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" /> HAPPY X · Final Platform Integration
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Every builder. Every runtime. One HAPPY.
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A single prompt bar and a single action bar orchestrate every canonical
          runtime — Knowledge, Workspace, Mission Control, Creator, Publishing,
          Automation, Digital Human, Business, and Universal Search.
        </p>
      </header>

      <Separator className="my-6" />

      <section className="space-y-3">
        <HappyUniversalPromptBar defaultSurface="code" placeholder="Ask HAPPY to build, ship, or orchestrate anything…" />
        <HappyUniversalActionBar mode="creator" payload="" target="platform:hub" />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4" /> Integrated Builders
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BUILDERS.map((b) => (
            <li key={b.to}>
              <Link
                to={b.to}
                className="block border rounded-lg p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 font-medium">{b.icon}{b.label}</div>
                <p className="text-xs text-muted-foreground mt-1">{b.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" /> Canonical Runtimes
        </h2>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {RUNTIMES.map((r) => (
            <li key={r.label} className="border rounded p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">{r.icon}{r.label}</div>
              <p className="text-xs text-muted-foreground mt-1">{r.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">No duplicate runtime</Badge>
        <Badge variant="secondary">No duplicate API</Badge>
        <Badge variant="secondary">No duplicate component</Badge>
        <Badge variant="secondary">Canonical pipeline enforced</Badge>
      </section>
    </Container>
  );
}
