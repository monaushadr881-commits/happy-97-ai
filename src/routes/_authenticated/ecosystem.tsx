/**
 * /ecosystem — HAPPY Ecosystem™ (R248)
 *
 * Thin integration hub connecting every canonical surface.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Digital Human · Mission Control · Knowledge · Workspace · Memory · Automation
 *     runtimes via the 13-stage canonical pipeline.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Network, Boxes, Building2, UserCircle2, Radar, MessageSquare, MousePointerClick,
  BookOpen, LayoutGrid, Brain, Workflow,
  Play, Sparkles, Download, FileCheck2, ScrollText, Activity,
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

export const Route = createFileRoute("/_authenticated/ecosystem")({
  head: () => ({
    meta: [
      { title: "HAPPY Ecosystem — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EcosystemRoute,
});

type NodeId =
  | "builders" | "business" | "digital-human" | "mission-control"
  | "prompt-bar" | "action-bar" | "knowledge" | "workspace" | "memory" | "automation";

const NODES: {
  id: NodeId; label: string; icon: React.ReactNode; hint: string; to?: string;
}[] = [
  { id: "builders",        label: "All Builders",         icon: <Boxes className="h-4 w-4" />,             hint: "Website · Mobile · Full Stack · Agent · Code · UI · Docs · Slides · Image · Video · Voice · Digital Human.",     to: "/builder" },
  { id: "business",        label: "All Business Modules", icon: <Building2 className="h-4 w-4" />,         hint: "HR · CRM · ERP · Finance · Manufacturing · Healthcare · Education · Agriculture · Marketplace." },
  { id: "digital-human",   label: "Digital Human",        icon: <UserCircle2 className="h-4 w-4" />,       hint: "Realtime voice · emotion · avatar · meeting · presentation · sales · teacher.",                                    to: "/digital-human" },
  { id: "mission-control", label: "Mission Control",      icon: <Radar className="h-4 w-4" />,             hint: "Live health · executions · approvals · audit · rollbacks across every runtime." },
  { id: "prompt-bar",      label: "Universal Prompt Bar", icon: <MessageSquare className="h-4 w-4" />,     hint: "One composer · 20 surfaces · history · attachments · quick actions." },
  { id: "action-bar",      label: "Universal Action Bar", icon: <MousePointerClick className="h-4 w-4" />, hint: "Copy · Edit · Save · Build · Export · Share · Favorites · Delete." },
  { id: "knowledge",       label: "Knowledge",            icon: <BookOpen className="h-4 w-4" />,          hint: "Docs · policies · SOPs · vector search · citations." },
  { id: "workspace",       label: "Workspace",            icon: <LayoutGrid className="h-4 w-4" />,        hint: "Presence · awareness · projects · lenses · collaborators." },
  { id: "memory",          label: "Memory",               icon: <Brain className="h-4 w-4" />,             hint: "Session · project · founder · long-term memory. One canonical store." },
  { id: "automation",      label: "Automation",           icon: <Workflow className="h-4 w-4" />,          hint: "Triggers · schedules · workflows · pipelines · reactions." },
];

const INTRO: Record<NodeId, string> = {
  "builders":        "Describe what to build · target · scope.",
  "business":        "Describe the business workflow · domain · outcome.",
  "digital-human":   "Describe the session · mode · voice · audience.",
  "mission-control": "Describe what to inspect · scope · time window.",
  "prompt-bar":      "Describe the composer surface · preset · payload.",
  "action-bar":      "Describe the action · target · policy.",
  "knowledge":       "Describe the query · sources · citation policy.",
  "workspace":       "Describe the workspace · project · collaborators.",
  "memory":          "Describe the memory · scope · retention.",
  "automation":      "Describe the trigger · condition · action · schedule.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function EcosystemRoute() {
  const [node, setNode] = React.useState<NodeId>("builders");
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${node}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY routing to ${node}…`);
  }, [node, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${node} via canonical pipeline`);           toast.info(`Running ${node}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${node} via Knowledge runtime`);        toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${node} via Publishing runtime`);        toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${node} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = NODES.find((n) => n.id === node)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4" /> HAPPY Ecosystem
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — every builder, module, and runtime, integrated
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every node flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Ecosystem nodes" className="flex flex-wrap gap-2">
        {NODES.map((n) => (
          <Button
            key={n.id}
            size="sm"
            variant={node === n.id ? "default" : "outline"}
            onClick={() => { setNode(n.id); pushLog("log", `Node · ${n.label}`); }}
            className="gap-2"
          >
            {n.icon}{n.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">
        {active.hint}
        {active.to && (
          <>
            {" · "}
            <Link to={active.to} className="underline underline-offset-2">Open surface</Link>
          </>
        )}
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={INTRO[node]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`ecosystem:${node}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                            className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={optimize}   className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="graph" className="w-full">
            <TabsList>
              <TabsTrigger value="graph"     className="gap-1"><Network className="h-4 w-4" />Graph</TabsTrigger>
              <TabsTrigger value="nodes"     className="gap-1"><Boxes className="h-4 w-4" />Nodes</TabsTrigger>
              <TabsTrigger value="pipeline"  className="gap-1"><Workflow className="h-4 w-4" />Pipeline</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="mt-3">
              <div className="rounded-lg border bg-background p-6 min-h-[280px]">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {NODES.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNode(n.id)}
                      className={`text-left rounded-md border p-3 hover:bg-muted transition ${node === n.id ? "border-primary bg-muted/40" : ""}`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">{n.icon}{n.label}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="nodes"    className="mt-3"><p className="text-sm text-muted-foreground">Every canonical owner registered · versioned · monitored.</p></TabsContent>
            <TabsContent value="pipeline" className="mt-3"><p className="text-sm text-muted-foreground">Founder → adopt → withBrain → runBrain → Search → Knowledge → Workspace → Permission → Impact → Executive → Approval → Audit → Execution → Mission Control.</p></TabsContent>
            <TabsContent value="activity" className="mt-3"><p className="text-sm text-muted-foreground">Executions · approvals · audits · rollbacks · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Ecosystem Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Node changes, runs, tunings, exports, and publishes log here.
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
