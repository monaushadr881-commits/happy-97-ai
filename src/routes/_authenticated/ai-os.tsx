/**
 * /ai-os — HAPPY AI Operating System™ (R281)
 *
 * STRICT REUSE — thin desktop-style shell that composes the ONE canonical
 * HappyUniversalPromptBar + HappyUniversalActionBar with in-app navigation
 * to existing canonical routes/runtimes. No new runtime, no new API, no
 * new component.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard, FolderKanban, FolderOpen, Files, Search, ListChecks,
  StickyNote, BookOpen, Brain, Hammer, Rocket, Radar,
  MessageSquare, Globe, Smartphone, Layers, Database, Plug, Palette,
  FileText, Presentation, Image as ImageIcon, Video, Mic, Bot, Workflow,
  Beaker, BarChart3,
  Users, Building2, Wallet, UserCog, Banknote, Boxes, Warehouse, Factory,
  ClipboardList, TrendingUp, Megaphone, LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/ai-os")({
  head: () => ({
    meta: [
      { title: "HAPPY AI Operating System" },
      { name: "description", content: "One AI Operating System for workspace, AI tools, and business — powered by HAPPY canonical runtimes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiOsPage,
});

type Tile = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Group = { id: string; title: string; tiles: Tile[] };

const GROUPS: Group[] = [
  {
    id: "workspace",
    title: "Workspace",
    tiles: [
      { to: "/dashboard", label: "Desktop", icon: LayoutDashboard },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/files", label: "Explorer", icon: FolderOpen },
      { to: "/files", label: "Files", icon: Files },
      { to: "/search", label: "Search", icon: Search },
      { to: "/tasks", label: "Tasks", icon: ListChecks },
      { to: "/notes", label: "Notes", icon: StickyNote },
      { to: "/knowledge", label: "Knowledge", icon: BookOpen },
      { to: "/memory", label: "Memory", icon: Brain },
      { to: "/builder", label: "Builder", icon: Hammer },
      { to: "/builder/deploy", label: "Deploy", icon: Rocket },
      { to: "/mission-control", label: "Mission Control", icon: Radar },
    ],
  },
  {
    id: "ai-tools",
    title: "AI Tools",
    tiles: [
      { to: "/chat", label: "AI Chat", icon: MessageSquare },
      { to: "/builder/website", label: "Website Builder", icon: Globe },
      { to: "/builder/mobile", label: "App Builder", icon: Smartphone },
      { to: "/builder/fullstack", label: "Full Stack Builder", icon: Layers },
      { to: "/builder/database", label: "Database Builder", icon: Database },
      { to: "/builder/api", label: "API Builder", icon: Plug },
      { to: "/builder/ui", label: "UI Builder", icon: Palette },
      { to: "/builder/documents", label: "Document Builder", icon: FileText },
      { to: "/builder/presentation", label: "Presentation Builder", icon: Presentation },
      { to: "/builder/image", label: "Image Builder", icon: ImageIcon },
      { to: "/builder/video", label: "Video Builder", icon: Video },
      { to: "/builder/voice", label: "Voice Builder", icon: Mic },
      { to: "/digital-human", label: "Digital Human", icon: Bot },
      { to: "/builder/automation", label: "Automation", icon: Workflow },
      { to: "/builder/research", label: "Research", icon: Beaker },
      { to: "/business/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "business",
    title: "Business",
    tiles: [
      { to: "/crm", label: "CRM", icon: Users },
      { to: "/erp", label: "ERP", icon: Building2 },
      { to: "/business/finance", label: "Finance", icon: Wallet },
      { to: "/hr", label: "HR", icon: UserCog },
      { to: "/business/finance", label: "Payroll", icon: Banknote },
      { to: "/business/inventory", label: "Inventory", icon: Boxes },
      { to: "/business/inventory", label: "Warehouse", icon: Warehouse },
      { to: "/business/manufacturing", label: "Manufacturing", icon: Factory },
      { to: "/projects", label: "Projects", icon: ClipboardList },
      { to: "/business/crm", label: "Sales", icon: TrendingUp },
      { to: "/business/crm", label: "Marketing", icon: Megaphone },
      { to: "/business/crm", label: "Support", icon: LifeBuoy },
    ],
  },
];

function AiOsPage() {
  const [activeGroup, setActiveGroup] = React.useState<string>("workspace");

  const onSend = React.useCallback((p: HuppSendPayload) => {
    toast.success("Dispatched to HAPPY", { description: p.prompt.slice(0, 120) });
  }, []);
  const onAction = React.useCallback((intent: HuppActionIntent) => {
    toast.message(`Action: ${intent}`);
  }, []);

  const group = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full bg-background text-foreground">
      {/* Left rail — group nav */}
      <aside className="w-56 shrink-0 border-r border-border/60 bg-muted/20">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">HAPPY</Badge>
            <span className="text-sm font-semibold">AI OS</span>
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100%-4rem)]">
          <nav className="p-2 space-y-1">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                  activeGroup === g.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                {g.title}
                <span className="ml-2 text-xs opacity-60">{g.tiles.length}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Center — desktop */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-border/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">{group.title}</h1>
            <Badge variant="secondary" className="text-xs">Canonical HAPPY Runtimes</Badge>
          </div>
          <HappyUniversalActionBar mode="message" payload={group.title} compact />

        </header>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {group.tiles.map((t) => (
                <Link
                  key={`${t.to}-${t.label}`}
                  to={t.to}
                  className="group rounded-xl border border-border/60 bg-card hover:bg-accent hover:border-primary/40 transition-colors p-4 flex flex-col items-start gap-3 min-h-24"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium leading-tight">{t.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom — universal prompt bar (single canonical composer) */}
        <div className="border-t border-border/60 bg-card/40 p-3">
          <HappyUniversalPromptBar
            surface="assistant"
            placeholder="Ask HAPPY anything — build, automate, generate, analyze…"
            onSend={onSend}
            onAction={onAction}
          />
        </div>
      </main>
    </div>
  );
}
