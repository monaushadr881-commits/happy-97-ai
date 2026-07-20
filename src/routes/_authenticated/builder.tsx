/**
 * /builder — HAPPY AI Builder Platform™ (R206)
 *
 * Lovable + Bolt + Cursor + ChatGPT style AI builder workspace.
 *
 * STRICT REUSE — no new runtime, no new API, no new server-fn, no new
 * component. This route is a THIN presentation shell that:
 *   • Left rail   → in-page navigation across canonical workspace lenses
 *                   (Projects/Recent/Templates/History/Favorites/
 *                    Deployments/Knowledge/Files/Media/GitHub).
 *   • Center      → the ONE canonical HappyUniversalPromptBar.
 *   • Right rail  → live build progress / thinking / files / logs stream
 *                   populated locally from prompt-bar dispatch events.
 *
 * Every Send/Action is forwarded to the existing canonical runtimes
 * exactly as HappyUniversalPromptBar already forwards them — this route
 * does not open new server surfaces.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FolderOpen,
  Clock,
  LayoutTemplate,
  History,
  Star,
  Rocket,
  BookOpen,
  Files,
  Image as ImageIcon,
  Github,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Sparkles,
  FileCode2,
  Boxes,
  Server,
  Database,
  Terminal as TerminalIcon,
  AlertTriangle,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
  type HuppSurface,
} from "@/components/happy/HappyUniversalPromptBar";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "AI Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuilderRoute,
});

// ────────────────────────────────────────────────────────────────
// Left rail — workspace lenses
// ────────────────────────────────────────────────────────────────

type Lens =
  | "projects" | "recent" | "templates" | "history" | "favorites"
  | "deployments" | "knowledge" | "files" | "media" | "github";

const LENSES: { id: Lens; label: string; icon: React.ReactNode }[] = [
  { id: "projects",    label: "Projects",    icon: <FolderOpen className="h-4 w-4" /> },
  { id: "recent",      label: "Recent",      icon: <Clock className="h-4 w-4" /> },
  { id: "templates",   label: "Templates",   icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: "history",     label: "History",     icon: <History className="h-4 w-4" /> },
  { id: "favorites",   label: "Favorites",   icon: <Star className="h-4 w-4" /> },
  { id: "deployments", label: "Deployments", icon: <Rocket className="h-4 w-4" /> },
  { id: "knowledge",   label: "Knowledge",   icon: <BookOpen className="h-4 w-4" /> },
  { id: "files",       label: "Files",       icon: <Files className="h-4 w-4" /> },
  { id: "media",       label: "Media",       icon: <ImageIcon className="h-4 w-4" /> },
  { id: "github",      label: "GitHub",      icon: <Github className="h-4 w-4" /> },
];

// ────────────────────────────────────────────────────────────────
// Builder modes / output types (labels for the header row)
// ────────────────────────────────────────────────────────────────

const BUILDER_MODES: { id: string; label: string; surface: HuppSurface }[] = [
  { id: "website",    label: "Website",       surface: "website" },
  { id: "landing",    label: "Landing Page",  surface: "landing-page" },
  { id: "mobile",     label: "Mobile App",    surface: "mobile-app" },
  { id: "fullstack",  label: "Full Stack",    surface: "fullstack-app" },
  { id: "dashboard",  label: "Dashboard",     surface: "fullstack-app" },
  { id: "crm",        label: "CRM",           surface: "fullstack-app" },
  { id: "erp",        label: "ERP",           surface: "fullstack-app" },
  { id: "ecommerce",  label: "E-Commerce",    surface: "fullstack-app" },
  { id: "portfolio",  label: "Portfolio",     surface: "website" },
  { id: "restaurant", label: "Restaurant",    surface: "website" },
  { id: "hospital",   label: "Hospital",      surface: "fullstack-app" },
  { id: "school",     label: "School",        surface: "fullstack-app" },
  { id: "agent",      label: "AI Agent",      surface: "ai-agent" },
  { id: "chatbot",    label: "Chatbot",       surface: "ai-agent" },
];

const OUTPUT_TYPES = [
  "React", "Next.js", "TanStack Start", "React Native", "Expo",
  "FastAPI", "Node", "Express", "Supabase", "PostgreSQL", "MongoDB",
];

// ────────────────────────────────────────────────────────────────
// Right rail — live event log
// ────────────────────────────────────────────────────────────────

type BuildEvent = {
  id: string;
  at: string;
  kind: "thinking" | "file" | "component" | "api" | "database" | "log" | "error";
  text: string;
};

function useBuildLog() {
  const [events, setEvents] = React.useState<BuildEvent[]>([]);
  const push = React.useCallback((kind: BuildEvent["kind"], text: string) => {
    setEvents((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 200));
  }, []);
  const clear = React.useCallback(() => setEvents([]), []);
  return { events, push, clear };
}

const EVENT_STYLE: Record<BuildEvent["kind"], { icon: React.ReactNode; label: string }> = {
  thinking:  { icon: <Sparkles className="h-3.5 w-3.5" />,       label: "AI" },
  file:      { icon: <FileCode2 className="h-3.5 w-3.5" />,      label: "File" },
  component: { icon: <Boxes className="h-3.5 w-3.5" />,          label: "Component" },
  api:       { icon: <Server className="h-3.5 w-3.5" />,         label: "API" },
  database:  { icon: <Database className="h-3.5 w-3.5" />,       label: "DB" },
  log:       { icon: <TerminalIcon className="h-3.5 w-3.5" />,   label: "Log" },
  error:     { icon: <AlertTriangle className="h-3.5 w-3.5" />,  label: "Error" },
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

function BuilderRoute() {
  const [lens, setLens] = React.useState<Lens>("projects");
  const [surface, setSurface] = React.useState<HuppSurface>("fullstack-app");
  const [output, setOutput] = React.useState<string>("TanStack Start");
  const [device, setDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [scheme, setScheme] = React.useState<"light" | "dark">("dark");
  const [busy, setBusy] = React.useState(false);
  const log = useBuildLog();

  const handleSend = React.useCallback(async (payload: HuppSendPayload) => {
    setBusy(true);
    log.push("thinking", `Planning ${payload.mode} · ${payload.surface} · ${payload.model}`);
    log.push("log", `Prompt (${payload.prompt.length} chars) queued for canonical Assistant runtime`);
    if (payload.attachments.length) {
      log.push("file", `${payload.attachments.length} attachment(s) attached`);
    }
    // Handoff is owned by the canonical runtime. This route only observes.
    toast.success(`Sent to HAPPY · ${payload.surface}`);
    setTimeout(() => {
      log.push("component", "Awaiting canonical runtime response…");
      setBusy(false);
    }, 400);
  }, [log]);

  const handleAction = React.useCallback(async (intent: HuppActionIntent, _p: HuppSendPayload) => {
    log.push("log", `Action: ${intent}`);
  }, [log]);

  return (
    <Container className="py-4 md:py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">HAPPY AI Builder</h1>
          <Badge variant="secondary" className="ml-1">R206</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Output stack"
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
          >
            {OUTPUT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <div className="flex overflow-hidden rounded-md border">
            {[
              { id: "desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
              { id: "tablet",  icon: <Tablet className="h-3.5 w-3.5" /> },
              { id: "mobile",  icon: <Smartphone className="h-3.5 w-3.5" /> },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id as typeof device)}
                className={cn("px-2 py-1", device === d.id ? "bg-muted" : "hover:bg-muted/60")}
                aria-label={d.id}
              >
                {d.icon}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setScheme(scheme === "dark" ? "light" : "dark")}
          >
            {scheme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left rail */}
        <aside className="rounded-lg border bg-card/40 p-2">
          <nav className="flex flex-col gap-0.5">
            {LENSES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLens(l.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                  lens === l.id ? "bg-muted font-medium" : "hover:bg-muted/60",
                )}
              >
                {l.icon}
                <span>{l.label}</span>
              </button>
            ))}
          </nav>
          <Separator className="my-2" />
          <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Reuses canonical runtimes
          </div>
          <ul className="px-2 pb-2 text-[11px] text-muted-foreground space-y-0.5">
            <li>Assistant · Knowledge · Workspace</li>
            <li>Creator · Publishing · Automation</li>
            <li>Digital Human · Memory · Experience</li>
            <li>Mission Control · Universal Search</li>
          </ul>
        </aside>

        {/* Center — Prompt Bar + Builder modes */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="rounded-lg border bg-card/40 p-2">
            <div className="mb-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Builder Modes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BUILDER_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSurface(m.surface)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    surface === m.surface ? "border-primary bg-primary/10" : "hover:bg-muted/60",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <HappyUniversalPromptBar
            defaultSurface={surface}
            defaultMode="build"
            defaultModel="auto"
            draftKey="hupp:draft:builder"
            busy={busy}
            onSend={handleSend}
            onAction={handleAction}
          />

          <Tabs defaultValue={lens} value={lens} onValueChange={(v) => setLens(v as Lens)}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="projects">Preview</TabsTrigger>
              <TabsTrigger value="files">Explorer</TabsTrigger>
              <TabsTrigger value="history">Diff</TabsTrigger>
              <TabsTrigger value="deployments">Deployments</TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="mt-2">
              <div
                className={cn(
                  "rounded-lg border p-6 text-center text-sm text-muted-foreground",
                  scheme === "dark" ? "bg-background" : "bg-white text-black",
                )}
                style={{
                  maxWidth: device === "desktop" ? "100%" : device === "tablet" ? 768 : 390,
                  margin: "0 auto",
                  minHeight: 260,
                }}
              >
                Live Preview — {output} · {device} · {scheme}
                <div className="pt-2 text-xs">Send a prompt to generate the first draft.</div>
              </div>
            </TabsContent>
            <TabsContent value="files" className="mt-2">
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Explorer will populate from the canonical Creator/Workspace runtime output.
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-2">
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Diff view reuses canonical Memory & Experience timelines.
              </div>
            </TabsContent>
            <TabsContent value="deployments" className="mt-2">
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Deployments handled by canonical Publishing runtime.
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Right rail — build progress */}
        <aside className="rounded-lg border bg-card/40">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Live Build</div>
            <div className="flex items-center gap-1">
              {busy && <Badge variant="secondary" className="animate-pulse">running</Badge>}
              <Button type="button" size="sm" variant="ghost" onClick={log.clear}>Clear</Button>
            </div>
          </div>
          <Separator />
          <ScrollArea className="h-[520px]">
            <ul className="divide-y">
              {log.events.length === 0 && (
                <li className="p-4 text-xs text-muted-foreground">
                  AI thinking, generated files, components, APIs, DB events, logs
                  and errors will stream here.
                </li>
              )}
              {log.events.map((e) => {
                const s = EVENT_STYLE[e.kind];
                return (
                  <li key={e.id} className="flex gap-2 px-3 py-2 text-xs">
                    <span className="mt-0.5 text-muted-foreground">{s.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.label}</span>
                        <span className="text-muted-foreground">{e.at}</span>
                      </div>
                      <div className="truncate">{e.text}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>
      </div>
    </Container>
  );
}
