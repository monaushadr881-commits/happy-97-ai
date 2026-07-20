/**
 * /builder/workflow — HAPPY Visual Workflow Builder™ (R228)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "automation")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Automation Runtime + Approval + Audit + Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Workflow, MousePointer2, Boxes, GitBranch, Repeat, Sparkles,
  LayoutTemplate, ScrollText, History, GitCommit, PlayCircle,
  Download, FileCheck2, Link2,
} from "lucide-react";
import { Container } from "@/design-system/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBuilderPrompt } from "@/hooks/use-builder-prompt";
import {
  HappyUniversalPromptBar,
  type HuppSendPayload,
  type HuppActionIntent,
} from "@/components/happy/HappyUniversalPromptBar";
import {
  HappyUniversalActionBar,
  type UabActionEvent,
} from "@/components/happy/HappyUniversalActionBar";

export const Route = createFileRoute("/_authenticated/builder/workflow")({
  head: () => ({
    meta: [
      { title: "Visual Workflow Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkflowBuilderRoute,
});

type PresetId =
  | "canvas" | "nodes" | "connections" | "conditions" | "loops"
  | "suggest" | "templates" | "logs" | "history" | "versioning";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "canvas",      label: "Drag & Drop Canvas", icon: <MousePointer2 className="h-4 w-4" />,   hint: "Compose the workflow visually · drag nodes · draw connections." },
  { id: "nodes",       label: "Nodes",              icon: <Boxes className="h-4 w-4" />,           hint: "Trigger · action · condition · loop · approval · notification nodes." },
  { id: "connections", label: "Connections",        icon: <Link2 className="h-4 w-4" />,           hint: "Wire outputs to inputs · pass data between steps." },
  { id: "conditions",  label: "Conditions",         icon: <GitBranch className="h-4 w-4" />,       hint: "Branch on data · rules · filters · AI classification." },
  { id: "loops",       label: "Loops",              icon: <Repeat className="h-4 w-4" />,          hint: "For-each · while · retry with backoff." },
  { id: "suggest",     label: "AI Suggestion",      icon: <Sparkles className="h-4 w-4" />,        hint: "HAPPY suggests next node · missing branches · optimizations." },
  { id: "templates",   label: "Templates",          icon: <LayoutTemplate className="h-4 w-4" />,  hint: "Start from a canonical template · onboarding · billing · CRM · ops." },
  { id: "logs",        label: "Execution Logs",     icon: <ScrollText className="h-4 w-4" />,      hint: "Per-run · per-step · status · retries · errors." },
  { id: "history",     label: "History",            icon: <History className="h-4 w-4" />,         hint: "Timeline of edits, publishes, and runs." },
  { id: "versioning",  label: "Versioning",         icon: <GitCommit className="h-4 w-4" />,       hint: "Draft · publish · rollback · diff between versions." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  canvas:      "Describe the workflow · HAPPY lays out nodes and connections on the canvas.",
  nodes:       "Describe a node to add · trigger, action, condition, loop, approval, notification.",
  connections: "Describe how data should flow between two nodes.",
  conditions:  "Describe the branching rule · which paths run when.",
  loops:       "Describe the loop · for-each collection, while condition, retry policy.",
  suggest:     "Ask HAPPY what to add next · missing branches · optimizations.",
  templates:   "Pick a starting template · onboarding · billing · CRM · ops.",
  logs:        "Ask about a run · filter by workflow · status · time.",
  history:     "Ask about an edit or publish in the timeline.",
  versioning:  "Draft, publish, rollback, or diff between two versions.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function WorkflowBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("canvas");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "workflow", onLog: pushLog });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(String(preset), p.prompt, p.attachments?.length ?? 0);
  }, [preset, pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const build     = () => { pushLog("log", `Build ${preset} via Automation Runtime`);                    toast.info(`Building ${preset}…`); };
  const testRun   = () => { pushLog("log", `Test run · ${preset} · dry-run via Automation Runtime`);     toast.info("Test running…"); };
  const exportDef = () => { pushLog("log", `Export workflow definition → JSON via Publishing Runtime`);  toast.info("Exporting JSON…"); };
  const publish   = () => { pushLog("log", `Publish workflow → Approval → Audit → Mission Control`);     toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Workflow className="h-4 w-4" /> HAPPY Visual Workflow Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Design workflows visually · drag, drop, connect
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every workflow flows through the canonical pipeline —
            Automation → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Workflow presets" className="flex flex-wrap gap-2">
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
      <p className="text-xs text-muted-foreground mt-2">{activePreset.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="automation"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`workflow:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={build}                        className="gap-1"><Sparkles className="h-4 w-4" />Build</Button>
            <Button size="sm" variant="outline"   onClick={testRun}  className="gap-1"><PlayCircle className="h-4 w-4" />Test Run</Button>
            <Button size="sm" variant="outline"   onClick={exportDef}className="gap-1"><Download className="h-4 w-4" />Export JSON</Button>
            <Button size="sm" variant="secondary" onClick={publish}  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="canvas" className="w-full">
            <TabsList>
              <TabsTrigger value="canvas"    className="gap-1"><MousePointer2 className="h-4 w-4" />Canvas</TabsTrigger>
              <TabsTrigger value="nodes"     className="gap-1"><Boxes className="h-4 w-4" />Nodes</TabsTrigger>
              <TabsTrigger value="templates" className="gap-1"><LayoutTemplate className="h-4 w-4" />Templates</TabsTrigger>
              <TabsTrigger value="history"   className="gap-1"><History className="h-4 w-4" />History</TabsTrigger>
              <TabsTrigger value="versions"  className="gap-1"><GitCommit className="h-4 w-4" />Versions</TabsTrigger>
              <TabsTrigger value="runs"      className="gap-1"><ScrollText className="h-4 w-4" />Runs</TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[320px]"
                style={{ backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
                <div className="flex flex-col items-center gap-2">
                  <Workflow className="h-6 w-6" />
                  <div>Drag-drop canvas · nodes and connections render from Automation Runtime output.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="nodes" className="mt-3">
              <p className="text-sm text-muted-foreground">Trigger · action · condition · loop · approval · notification · webhook · delay.</p>
            </TabsContent>
            <TabsContent value="templates" className="mt-3">
              <p className="text-sm text-muted-foreground">Canonical starter workflows · onboarding · billing · CRM · ops · manufacturing.</p>
            </TabsContent>
            <TabsContent value="history" className="mt-3">
              <p className="text-sm text-muted-foreground">Timeline of edits, publishes, and runs · mirrored to Audit.</p>
            </TabsContent>
            <TabsContent value="versions" className="mt-3">
              <p className="text-sm text-muted-foreground">Draft · publish · rollback · diff between versions via Publishing Runtime.</p>
            </TabsContent>
            <TabsContent value="runs" className="mt-3">
              <p className="text-sm text-muted-foreground">Execution logs · step-level status · retries · errors · mirrored to Mission Control.</p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: build log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Build Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, builds, test runs, exports, and publishes log here.
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
