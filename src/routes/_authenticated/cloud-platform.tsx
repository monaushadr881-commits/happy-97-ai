/**
 * /cloud-platform — HAPPY Cloud Platform™ (R285)
 *
 * Thin desktop-style shell that composes the ONE canonical
 * HappyUniversalPromptBar + HappyUniversalActionBar with in-app navigation
 * to existing canonical cloud/storage routes/runtimes (storage buckets,
 * cms_media, backups (bkp_*), knowledge, mission control). No new runtime,
 * no new API, no new component.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  HardDrive, Database, Archive, History, Share2, ShieldCheck,
  Image, FileText, Film, Music, FileArchive, Search, Cloud, FolderOpen,
} from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/cloud-platform")({
  head: () => ({
    meta: [
      { title: "HAPPY Cloud Platform" },
      { name: "description", content: "Cloud Platform — Drive, Storage, Backups, Versioning, Sharing, Permissions, Media Library, Documents, Images, Videos, Audio, Archives, Cloud Search." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CloudPlatformPage,
});

type Tile = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Group = { id: string; title: string; tiles: Tile[] };

const GROUPS: Group[] = [
  {
    id: "storage",
    title: "Drive & Storage",
    tiles: [
      { to: "/cloud", label: "Drive", icon: HardDrive },
      { to: "/cloud", label: "Storage Buckets", icon: Database },
      { to: "/cloud", label: "Files", icon: FolderOpen },
      { to: "/cloud", label: "Cloud", icon: Cloud },
    ],
  },
  {
    id: "protection",
    title: "Protection",
    tiles: [
      { to: "/mission-control", label: "Backups", icon: Archive },
      { to: "/mission-control", label: "Versioning", icon: History },
    ],
  },
  {
    id: "access",
    title: "Sharing & Access",
    tiles: [
      { to: "/mission-control", label: "Sharing", icon: Share2 },
      { to: "/mission-control", label: "Permissions", icon: ShieldCheck },
    ],
  },
  {
    id: "library",
    title: "Media Library",
    tiles: [
      { to: "/knowledge", label: "Media Library", icon: Image },
      { to: "/knowledge", label: "Documents", icon: FileText },
      { to: "/knowledge", label: "Images", icon: Image },
      { to: "/knowledge", label: "Videos", icon: Film },
      { to: "/knowledge", label: "Audio", icon: Music },
      { to: "/knowledge", label: "Archives", icon: FileArchive },
    ],
  },
  {
    id: "discovery",
    title: "Discovery",
    tiles: [
      { to: "/knowledge", label: "Cloud Search", icon: Search },
    ],
  },
];

function CloudPlatformPage() {
  const [activeGroup, setActiveGroup] = React.useState<string>("storage");

  const onSend = React.useCallback((p: HuppSendPayload) => {
    toast.success("Dispatched to Cloud Runtime", { description: p.prompt.slice(0, 120) });
  }, []);
  const onAction = React.useCallback((intent: HuppActionIntent) => {
    toast.message(`Action: ${intent}`);
  }, []);

  const group = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r border-border/60 bg-muted/20">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">HAPPY</Badge>
            <span className="text-sm font-semibold">Cloud Platform</span>
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

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-border/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">{group.title}</h1>
            <Badge variant="secondary" className="text-xs">Canonical Cloud Runtime</Badge>
          </div>
          <HappyUniversalActionBar mode="mission-control" payload={group.title} compact />
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

        <div className="border-t border-border/60 bg-card/40 p-3">
          <HappyUniversalPromptBar
            defaultSurface="chat"
            placeholder="Ask HAPPY to store, back up, share, or search any file, media, or archive…"
            onSend={onSend}
            onAction={onAction}
          />
        </div>
      </main>
    </div>
  );
}
