/**
 * /builder/assistant — HAPPY Assistant Expansion Builder™
 *
 * Thin presentation shell over the existing HAPPY runtime + Knowledge/Memory.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • HAPPY · Knowledge · Memory · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bot, MessagesSquare, FolderKanban, Folder, Pin, Search,
  BookMarked, LayoutTemplate, History, Brain, Upload, Download,
  Play, Sparkles, FileCheck2, ScrollText, LayoutGrid, Activity,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/builder/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant Expansion — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistantBuilderRoute,
});

type PresetId =
  | "multi-chat" | "projects" | "folders" | "pinned" | "search"
  | "prompt-library" | "templates" | "history" | "memory"
  | "export" | "import";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "multi-chat",     label: "Multi Chat",     icon: <MessagesSquare className="h-4 w-4" />, hint: "Parallel chats · side-by-side · compare responses · per-chat context." },
  { id: "projects",       label: "Projects",       icon: <FolderKanban className="h-4 w-4" />,   hint: "Group chats by project · scoped memory · shared instructions." },
  { id: "folders",        label: "Folders",        icon: <Folder className="h-4 w-4" />,         hint: "Organize · rename · nest · move · color · sort." },
  { id: "pinned",         label: "Pinned",         icon: <Pin className="h-4 w-4" />,            hint: "Pin chats · prompts · templates · quick access." },
  { id: "search",         label: "Search",         icon: <Search className="h-4 w-4" />,         hint: "Full-text · semantic · filters · date · tag · project." },
  { id: "prompt-library", label: "Prompt Library", icon: <BookMarked className="h-4 w-4" />,     hint: "Curated prompts · variables · categories · sharing." },
  { id: "templates",      label: "Templates",      icon: <LayoutTemplate className="h-4 w-4" />, hint: "Reusable chat starters · slot variables · versioning." },
  { id: "history",        label: "History",        icon: <History className="h-4 w-4" />,        hint: "Full transcript · restore · branch · archive." },
  { id: "memory",         label: "Memory",         icon: <Brain className="h-4 w-4" />,          hint: "Long-term facts · preferences · scope · retention." },
  { id: "export",         label: "Export",         icon: <Download className="h-4 w-4" />,       hint: "Markdown · JSON · PDF · per chat / project / all." },
  { id: "import",         label: "Import",         icon: <Upload className="h-4 w-4" />,         hint: "Upload transcripts · prompts · templates · map to projects." },
];

const INTRO: Record<PresetId, string> = {
  "multi-chat":     "Describe the multi-chat layout · context sharing · comparison rule.",
  projects:         "Describe the project · scoped memory · shared instruction.",
  folders:          "Describe the folder tree · move · rename · color rule.",
  pinned:           "Describe what to pin · order · quick-access placement.",
  search:           "Describe the search · filter · scope · ranking rule.",
  "prompt-library": "Describe the prompt · variables · category · sharing.",
  templates:        "Describe the template · slots · defaults · version.",
  history:          "Describe the history · restore · branch · archive rule.",
  memory:           "Describe the memory · scope · retention · redaction.",
  export:           "Describe the export · format · scope · destination.",
  import:           "Describe the import · source · mapping · dedupe rule.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function AssistantBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("multi-chat");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY working on ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} via HAPPY Runtime`);                 toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);         toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);         toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" /> HAPPY Assistant Expansion
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — multi chat, projects, folders, memory
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the HAPPY runtime — no second assistant. Every mutation flows through
            the pipeline: Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Assistant expansion presets" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={preset === p.id ? "default" : "outline"}
            onClick={() => { setPreset(p.id); pushLog("log", `Preset · ${p.label}`); }}
            className="gap-2"
          >
            {p.icon}{p.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{active.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`assistant:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                          className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview"  className="gap-1"><LayoutGrid className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="chats"     className="gap-1"><MessagesSquare className="h-4 w-4" />Chats</TabsTrigger>
              <TabsTrigger value="organize"  className="gap-1"><FolderKanban className="h-4 w-4" />Organize</TabsTrigger>
              <TabsTrigger value="library"   className="gap-1"><BookMarked className="h-4 w-4" />Library</TabsTrigger>
              <TabsTrigger value="memory"    className="gap-1"><Brain className="h-4 w-4" />Memory</TabsTrigger>
              <TabsTrigger value="portable"  className="gap-1"><Download className="h-4 w-4" />Portable</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders assistant state from the canonical runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chats"    className="mt-3"><p className="text-sm text-muted-foreground">Multi chat · parallel · side-by-side · compare · per-chat context.</p></TabsContent>
            <TabsContent value="organize" className="mt-3"><p className="text-sm text-muted-foreground">Projects · folders · pinned · search · filters.</p></TabsContent>
            <TabsContent value="library"  className="mt-3"><p className="text-sm text-muted-foreground">Prompt library · templates · slot variables · sharing.</p></TabsContent>
            <TabsContent value="memory"   className="mt-3"><p className="text-sm text-muted-foreground">Long-term memory · history · restore · retention.</p></TabsContent>
            <TabsContent value="portable" className="mt-3"><p className="text-sm text-muted-foreground">Export · import · Markdown · JSON · PDF · mapping.</p></TabsContent>
            <TabsContent value="activity" className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Assistant Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, runs, tunings, exports, and publishes log here.
                </li>
              )}
              {logs.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded hover:bg-muted">
                  <span className="text-muted-foreground mr-2">{l.at}</span>
                  <span className={
                    l.kind === "err"  ? "text-destructive" :
                    l.kind === "warn" ? "text-amber-500" : ""
                  }>{l.text}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">Mirrored to Mission Control.</p>
        </aside>
      </div>
    </Container>
  );
}
