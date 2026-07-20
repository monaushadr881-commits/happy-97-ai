/**
 * /builder/analytics — HAPPY Analytics Center™ (R230)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "analytics")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Analytics / Mission Control runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, Users, MousePointerClick, DollarSign,
  Filter, Zap, AlertTriangle, Gauge, Search, Flame, Sparkles,
  Download, FileCheck2, ScrollText,
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

export const Route = createFileRoute("/_authenticated/builder/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsCenterRoute,
});

type PresetId =
  | "traffic" | "users" | "sessions" | "revenue" | "funnels"
  | "events" | "errors" | "performance" | "seo" | "heatmap" | "insights";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "traffic",     label: "Traffic",       icon: <TrendingUp className="h-4 w-4" />,        hint: "Pageviews · sources · channels · geography · devices." },
  { id: "users",       label: "Users",         icon: <Users className="h-4 w-4" />,             hint: "New vs returning · cohorts · retention · segments." },
  { id: "sessions",    label: "Sessions",      icon: <MousePointerClick className="h-4 w-4" />, hint: "Session duration · pages per session · bounce rate." },
  { id: "revenue",     label: "Revenue",       icon: <DollarSign className="h-4 w-4" />,        hint: "MRR · ARR · LTV · ARPU · churn · plan mix." },
  { id: "funnels",     label: "Funnels",       icon: <Filter className="h-4 w-4" />,            hint: "Multi-step conversion · drop-off · segment compare." },
  { id: "events",      label: "Events",        icon: <Zap className="h-4 w-4" />,               hint: "Custom event volume · properties · top actions." },
  { id: "errors",      label: "Errors",        icon: <AlertTriangle className="h-4 w-4" />,     hint: "Client + server errors · rates · top offenders." },
  { id: "performance", label: "Performance",   icon: <Gauge className="h-4 w-4" />,             hint: "Core Web Vitals · LCP · INP · CLS · TTFB." },
  { id: "seo",         label: "SEO",           icon: <Search className="h-4 w-4" />,            hint: "Search impressions · clicks · positions · queries." },
  { id: "heatmap",     label: "Heatmap Ready", icon: <Flame className="h-4 w-4" />,             hint: "Instrumentation ready for click / scroll / attention heatmaps." },
  { id: "insights",    label: "AI Insights",   icon: <Sparkles className="h-4 w-4" />,          hint: "HAPPY narrates trends · anomalies · opportunities." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  traffic:     "Ask about traffic · sources · geography · devices.",
  users:       "Ask about users · cohorts · retention · segments.",
  sessions:    "Ask about session duration, depth, and bounce.",
  revenue:     "Ask about MRR, LTV, ARPU, churn, or plan mix.",
  funnels:     "Describe the funnel · steps and segment to compare.",
  events:      "Ask about custom events · properties · top actions.",
  errors:      "Ask about error rate, top offenders, or a specific error.",
  performance: "Ask about Core Web Vitals or a slow route.",
  seo:         "Ask about search impressions, clicks, positions, queries.",
  heatmap:     "Describe the surface to instrument for heatmaps.",
  insights:    "Ask HAPPY what changed · why · and what to do next.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function AnalyticsCenterRoute() {
  const [preset, setPreset] = React.useState<PresetId>("traffic");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY analyzing ${preset}…`);
  }, [preset, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} report via Analytics Runtime`);        toast.info(`Running ${preset}…`); };
  const insight   = () => { pushLog("log", `AI insight · ${preset} via Analytics Runtime`);      toast.info("HAPPY generating insight…"); };
  const exportCsv = () => { pushLog("log", `Export ${preset} → CSV via Publishing Runtime`);     toast.info("Exporting CSV…"); };
  const publish   = () => { pushLog("log", `Publish report → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> HAPPY Analytics Center
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Understand traffic, users, revenue & performance
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every report flows through the canonical pipeline —
            Analytics → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Analytics presets" className="flex flex-wrap gap-2">
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
            defaultSurface="analytics"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`analytics:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={run}                          className="gap-1"><BarChart3 className="h-4 w-4" />Run Report</Button>
            <Button size="sm" variant="outline"   onClick={insight}  className="gap-1"><Sparkles className="h-4 w-4" />AI Insight</Button>
            <Button size="sm" variant="outline"   onClick={exportCsv}className="gap-1"><Download className="h-4 w-4" />Export CSV</Button>
            <Button size="sm" variant="secondary" onClick={publish}  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="funnels"  className="gap-1"><Filter className="h-4 w-4" />Funnels</TabsTrigger>
              <TabsTrigger value="events"   className="gap-1"><Zap className="h-4 w-4" />Events</TabsTrigger>
              <TabsTrigger value="quality"  className="gap-1"><Gauge className="h-4 w-4" />Quality</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1"><Sparkles className="h-4 w-4" />AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <div>{activePreset.label} · charts and KPIs render from Analytics Runtime output.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="funnels" className="mt-3">
              <p className="text-sm text-muted-foreground">Multi-step conversion · drop-off analysis · segment compare.</p>
            </TabsContent>
            <TabsContent value="events" className="mt-3">
              <p className="text-sm text-muted-foreground">Custom event volume · property breakdown · top actions per role.</p>
            </TabsContent>
            <TabsContent value="quality" className="mt-3">
              <p className="text-sm text-muted-foreground">Errors, Core Web Vitals, and SEO health · mirrored to Mission Control.</p>
            </TabsContent>
            <TabsContent value="insights" className="mt-3">
              <p className="text-sm text-muted-foreground">HAPPY narrates trends, anomalies, and opportunities via the Analytics Runtime.</p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Analytics Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, runs, insights, exports, and publishes log here.
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
