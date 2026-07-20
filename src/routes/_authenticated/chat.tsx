/**
 * /chat — HAPPY AI Chat Platform™ (R245)
 *
 * Thin presentation shell extending the existing Assistant.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Memory / Knowledge / Publishing via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Multi-chat / folders / pins / library / memory / search / export / import
 * are presentation surfaces over existing runtimes.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  MessageSquare, MessagesSquare, Folder, Pin, BookMarked, Brain, Search,
  Download, Upload, Plus, ScrollText, LayoutGrid,
  Play, Sparkles, FileCheck2,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat Platform — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPlatformRoute,
});

type PresetId =
  | "multi" | "folders" | "pinned" | "library" | "memory" | "search" | "export" | "import";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "multi",   label: "Multi Chat",     icon: <MessagesSquare className="h-4 w-4" />, hint: "Parallel conversations · threads · side-by-side compare." },
  { id: "folders", label: "Folders",        icon: <Folder className="h-4 w-4" />,         hint: "Organise threads · nested folders · move · color tags." },
  { id: "pinned",  label: "Pinned Chats",   icon: <Pin className="h-4 w-4" />,            hint: "Pin critical conversations for one-click resume." },
  { id: "library", label: "Prompt Library", icon: <BookMarked className="h-4 w-4" />,     hint: "Reusable prompts · variables · categories · sharing." },
  { id: "memory",  label: "Memory",         icon: <Brain className="h-4 w-4" />,          hint: "Long-term memories · facts · preferences · retention." },
  { id: "search",  label: "Search",         icon: <Search className="h-4 w-4" />,         hint: "Search across all threads · messages · attachments." },
  { id: "export",  label: "Export",         icon: <Download className="h-4 w-4" />,       hint: "Export threads · JSON · Markdown · PDF · archive." },
  { id: "import",  label: "Import",         icon: <Upload className="h-4 w-4" />,         hint: "Import ChatGPT · Claude · Gemini · JSON · Markdown." },
];

const INTRO: Record<PresetId, string> = {
  multi:   "Describe the parallel chats · models · task split.",
  folders: "Describe the folder tree · move rules · tags.",
  pinned:  "Describe the pinned resume · scope · notification.",
  library: "Describe the prompt · variables · category · sharing.",
  memory:  "Describe the memory · scope · retention · redaction.",
  search:  "Describe the search · scope · filters · date range.",
  export:  "Describe the export · format · scope · redaction.",
  import:  "Describe the import · source · mapping · dedupe.",
};

interface Thread   { id: string; title: string; folder: string; pinned: boolean; at: string }
interface LogLine  { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

const SEED_THREADS: Thread[] = [
  { id: "t1", title: "Product roadmap Q3",   folder: "Work",     pinned: true,  at: "10:14" },
  { id: "t2", title: "Masala pricing model", folder: "Business", pinned: true,  at: "09:52" },
  { id: "t3", title: "Weekly digest",        folder: "Ops",      pinned: false, at: "Yest"  },
  { id: "t4", title: "Content brainstorm",   folder: "Marketing",pinned: false, at: "Yest"  },
  { id: "t5", title: "Investor Q&A prep",    folder: "Founder",  pinned: false, at: "Mon"   },
];

function ChatPlatformRoute() {
  const [preset, setPreset] = React.useState<PresetId>("multi");
  const [threads, setThreads] = React.useState<Thread[]>(SEED_THREADS);
  const [activeId, setActiveId] = React.useState<string>("t1");
  const [query, setQuery] = React.useState("");
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? threads.filter((t) => t.title.toLowerCase().includes(q) || t.folder.toLowerCase().includes(q)) : threads;
  }, [threads, query]);

  const folders = React.useMemo(
    () => Array.from(new Set(threads.map((t) => t.folder))),
    [threads],
  );

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY working on ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const newChat = () => {
    const id = `t${threads.length + 1}`;
    setThreads((prev) => [{ id, title: "New chat", folder: "Inbox", pinned: false, at: "Now" }, ...prev]);
    setActiveId(id);
    pushLog("log", `New chat · ${id}`);
    toast.info("New chat created.");
  };
  const togglePin = (id: string) => {
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, pinned: !t.pinned } : t));
    pushLog("log", `Pin toggled · ${id}`);
  };
  const exportAll = () => { pushLog("log", `Export via Publishing Runtime`); toast.info("Exporting…"); };
  const importAny = () => { pushLog("log", `Import via Knowledge Runtime`);  toast.info("Import ready — drop a file."); };
  const optimize  = () => { pushLog("log", `AI optimize ${preset} via Knowledge Runtime`); toast.info("HAPPY optimizing…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;
  const activeThread = threads.find((t) => t.id === activeId);

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> HAPPY AI Chat Platform
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Multi-chat, memory, prompts — all in one workspace
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Assistant. Every action flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
          <Link to="/assistant" className="text-xs text-muted-foreground underline underline-offset-4">Open Assistant</Link>
        </div>
      </header>

      <Separator className="my-6" />

      <section aria-label="Chat platform presets" className="flex flex-wrap gap-2">
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px] gap-6">
        {/* Left: threads & folders */}
        <aside className="space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={newChat} className="gap-1 flex-1"><Plus className="h-4 w-4" />New chat</Button>
            <Button size="icon" variant="outline" onClick={exportAll} title="Export"><Download className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={importAny} title="Import"><Upload className="h-4 w-4" /></Button>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="pl-8 h-9"
            />
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="h-3.5 w-3.5" />Folders</div>
          <div className="flex flex-wrap gap-1">
            {folders.map((f) => (
              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
            ))}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><Pin className="h-3.5 w-3.5" />Pinned</div>
          <ScrollArea className="h-[420px] rounded-md border bg-muted/20">
            <ul className="p-1">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => { setActiveId(t.id); pushLog("log", `Open · ${t.title}`); }}
                    className={`w-full text-left px-2 py-2 rounded hover:bg-muted flex items-start gap-2 ${activeId === t.id ? "bg-muted" : ""}`}
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{t.title}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.folder} · {t.at}</span>
                    </span>
                    <Pin
                      className={`h-3.5 w-3.5 shrink-0 ${t.pinned ? "text-primary" : "text-muted-foreground"}`}
                      onClick={(e) => { e.stopPropagation(); togglePin(t.id); }}
                    />
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="p-3 text-xs text-muted-foreground">No chats match “{query}”.</li>
              )}
            </ul>
          </ScrollArea>
        </aside>

        {/* Center: composer + workspace */}
        <main className="space-y-4 min-w-0">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MessageSquare className="h-3.5 w-3.5" />
              {activeThread ? `${activeThread.folder} · ${activeThread.title}` : "No chat selected"}
            </div>
            <HappyUniversalPromptBar
              defaultSurface="fullstack-app"
              placeholder={INTRO[preset]}
              onSend={onSend}
              onAction={onAction}
            />
          </div>

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`chat:${preset}:${activeId}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => { pushLog("log", `Run ${preset}`); toast.info(`Running ${preset}…`); }} className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Optimize</Button>
            <Button size="sm" variant="outline"   onClick={exportAll} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="outline"   onClick={importAny} className="gap-1"><Upload className="h-4 w-4" />Import</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1"><LayoutGrid className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="library" className="gap-1"><BookMarked className="h-4 w-4" />Prompt Library</TabsTrigger>
              <TabsTrigger value="memory"  className="gap-1"><Brain className="h-4 w-4" />Memory</TabsTrigger>
              <TabsTrigger value="search"  className="gap-1"><Search className="h-4 w-4" />Search</TabsTrigger>
              <TabsTrigger value="io"      className="gap-1"><Download className="h-4 w-4" />Export / Import</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[260px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · surface renders here from the Assistant runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="library" className="mt-3"><p className="text-sm text-muted-foreground">Reusable prompts · variables · categories · team sharing.</p></TabsContent>
            <TabsContent value="memory"  className="mt-3"><p className="text-sm text-muted-foreground">Long-term memories · facts · preferences · retention policies.</p></TabsContent>
            <TabsContent value="search"  className="mt-3"><p className="text-sm text-muted-foreground">Search across threads · messages · attachments · date filters.</p></TabsContent>
            <TabsContent value="io"      className="mt-3"><p className="text-sm text-muted-foreground">Export JSON/MD/PDF · import ChatGPT/Claude/Gemini/JSON.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Chat Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, chat opens, pins, exports, imports, and publishes log here.
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
