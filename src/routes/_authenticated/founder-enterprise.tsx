import { createFileRoute, Link } from "@tanstack/react-router";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";
import {
  Cpu, Building2, Globe, Smartphone, Layers, Database, Plug, LayoutGrid,
  FileText, Presentation, Image as ImageIcon, Video, Mic, Bot,
  BookOpen, Briefcase, Radar, Workflow, Wand2, Send, MessageSquare,
  Cloud, BarChart3, Shield, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/founder-enterprise")({
  head: () => ({
    meta: [
      { title: "HAPPY Founder Enterprise" },
      {
        name: "description",
        content:
          "One canonical HAPPY Founder Enterprise hub integrating AI OS, Business OS, all Builders, Digital Human, Knowledge, Workspace, Mission Control, Creator, Publishing, Communication, Cloud, Analytics, Security, and Deployment.",
      },
    ],
  }),
  component: FounderEnterprisePage,
});

type Tile = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; hint: string };

const PLATFORM: Tile[] = [
  { label: "AI Operating System", to: "/ai-os", icon: Cpu, hint: "Unified AI desktop" },
  { label: "Business OS", to: "/business-os", icon: Building2, hint: "Enterprise modules" },
  { label: "Mission Control", to: "/mission-control", icon: Radar, hint: "Live command center" },
  { label: "Workspace", to: "/dashboard", icon: LayoutGrid, hint: "Projects & context" },
];

const BUILDERS: Tile[] = [
  { label: "Website", to: "/builder/website", icon: Globe, hint: "Sites for 30 verticals" },
  { label: "App", to: "/builder/mobile", icon: Smartphone, hint: "iOS · Android · PWA" },
  { label: "Full Stack", to: "/builder/fullstack", icon: Layers, hint: "Frontend + backend" },
  { label: "Database", to: "/builder/database", icon: Database, hint: "Schema · RLS · RBAC" },
  { label: "API", to: "/builder/api", icon: Plug, hint: "Endpoints & webhooks" },
  { label: "UI", to: "/builder/ui", icon: LayoutGrid, hint: "Design system" },
];

const CONTENT: Tile[] = [
  { label: "Documents", to: "/builder/documents", icon: FileText, hint: "Docs · reports" },
  { label: "Presentations", to: "/builder/presentation", icon: Presentation, hint: "Decks" },
  { label: "Images", to: "/builder/image", icon: ImageIcon, hint: "AI imagery" },
  { label: "Videos", to: "/builder/video", icon: Video, hint: "AI video" },
  { label: "Voice", to: "/builder/voice", icon: Mic, hint: "TTS & STT" },
  { label: "Digital Human", to: "/digital-human", icon: Bot, hint: "HAPPY persona" },
];

const INTELLIGENCE: Tile[] = [
  { label: "Knowledge", to: "/knowledge", icon: BookOpen, hint: "Corpus & search" },
  { label: "Assistant", to: "/assistant", icon: Bot, hint: "HAPPY chat" },
  { label: "Automation", to: "/builder/automation", icon: Workflow, hint: "Workflows" },
  { label: "Creator", to: "/builder", icon: Wand2, hint: "Generate anything" },
  { label: "Publishing", to: "/mission-control", icon: Send, hint: "Approvals & release" },
];

const OPERATIONS: Tile[] = [
  { label: "Communication", to: "/communication", icon: MessageSquare, hint: "Email · SMS · Chat" },
  { label: "Cloud", to: "/cloud-platform", icon: Cloud, hint: "Drive · storage · backup" },
  { label: "Analytics", to: "/analytics-platform", icon: BarChart3, hint: "BI & insights" },
  { label: "Security", to: "/security-center", icon: Shield, hint: "RBAC · audit · compliance" },
  { label: "Deployment", to: "/deployment", icon: Rocket, hint: "Ship to production" },
  { label: "Business Suite", to: "/business", icon: Briefcase, hint: "CRM · ERP · HR · Finance" },
];

function TileGroup({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="group rounded-xl border bg-card hover:bg-accent transition p-4 flex flex-col gap-2"
          >
            <t.icon className="h-5 w-5 text-primary" />
            <div className="font-medium">{t.label}</div>
            <div className="text-xs text-muted-foreground">{t.hint}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FounderEnterprisePage() {
  return (
    <div className="flex flex-col h-full">
      <header className="border-b p-4 space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Founder Enterprise</h1>
        <p className="text-sm text-muted-foreground">
          One canonical hub — every runtime, every builder, every operation. No duplication.
        </p>
      </header>

      <div className="border-b p-3">
        <HappyUniversalPromptBar defaultSurface="chat" />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        <TileGroup title="Platform" tiles={PLATFORM} />
        <TileGroup title="Builders" tiles={BUILDERS} />
        <TileGroup title="Content & Digital Human" tiles={CONTENT} />
        <TileGroup title="Intelligence" tiles={INTELLIGENCE} />
        <TileGroup title="Operations" tiles={OPERATIONS} />
      </div>

      <div className="border-t p-3">
        <HappyUniversalActionBar mode="mission-control" payload={null} />
      </div>
    </div>
  );
}
