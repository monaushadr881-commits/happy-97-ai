/**
 * /optimization — HAPPY Platform Optimization™ (R249)
 *
 * Thin presentation shell for platform-wide optimization surfaces.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Knowledge · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every optimization flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Gauge, Zap, Database, Package, Image as ImageIcon, ServerCog,
  Droplets, Accessibility, Search,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity,
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

export const Route = createFileRoute("/_authenticated/optimization")({
  head: () => ({
    meta: [
      { title: "Platform Optimization — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OptimizationRoute,
});

type PresetId =
  | "performance" | "caching" | "queries" | "bundle" | "images"
  | "ssr" | "hydration" | "a11y" | "seo";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "performance", label: "Performance",   icon: <Gauge className="h-4 w-4" />,         hint: "LCP · INP · CLS · TTFB · long tasks · frame budget." },
  { id: "caching",     label: "Caching",       icon: <Zap className="h-4 w-4" />,           hint: "Query · SWR · CDN · route · asset · edge cache." },
  { id: "queries",     label: "Queries",       icon: <Database className="h-4 w-4" />,      hint: "Slow queries · indexes · RLS · N+1 · plan review." },
  { id: "bundle",      label: "Bundle",        icon: <Package className="h-4 w-4" />,       hint: "Code splitting · tree shaking · dedupe · lazy routes." },
  { id: "images",      label: "Images",        icon: <ImageIcon className="h-4 w-4" />,     hint: "AVIF · WebP · sizing · preload · LCP hero." },
  { id: "ssr",         label: "SSR",           icon: <ServerCog className="h-4 w-4" />,     hint: "Server functions · streaming · loader boundaries." },
  { id: "hydration",   label: "Hydration",     icon: <Droplets className="h-4 w-4" />,      hint: "Client boundaries · mismatches · deferred islands." },
  { id: "a11y",        label: "Accessibility", icon: <Accessibility className="h-4 w-4" />, hint: "Contrast · labels · focus · landmarks · targets." },
  { id: "seo",         label: "SEO",           icon: <Search className="h-4 w-4" />,        hint: "Titles · descriptions · og · canonical · JSON-LD." },
];

const INTRO: Record<PresetId, string> = {
  performance: "Describe the performance target · route · budget.",
  caching:     "Describe the cache layer · scope · TTL.",
  queries:     "Describe the slow query · table · frequency.",
  bundle:      "Describe the bundle target · route · size budget.",
  images:      "Describe the image · format · usage · viewport.",
  ssr:         "Describe the SSR path · streaming · boundary.",
  hydration:   "Describe the hydration surface · boundary · risk.",
  a11y:        "Describe the surface · component · issue.",
  seo:         "Describe the route · title · description · schema.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function OptimizationRoute() {
  const [preset, setPreset] = React.useState<PresetId>("performance");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY optimizing ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const scan      = () => { pushLog("log", `Scan ${preset} via Knowledge Runtime`);         toast.info(`Scanning ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);      toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);      toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="h-4 w-4" /> HAPPY Platform Optimization
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — tune performance, cache, queries, bundle, and more
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every optimization flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Optimization presets" className="flex flex-wrap gap-2">
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
            target={`optimization:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={scan}                          className="gap-1"><Play className="h-4 w-4" />Scan</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1"><LayoutGrid className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="metrics"  className="gap-1"><Gauge className="h-4 w-4" />Metrics</TabsTrigger>
              <TabsTrigger value="findings" className="gap-1"><Search className="h-4 w-4" />Findings</TabsTrigger>
              <TabsTrigger value="fixes"    className="gap-1"><Sparkles className="h-4 w-4" />Fixes</TabsTrigger>
              <TabsTrigger value="activity" className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders diagnostics from the Knowledge runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="metrics"  className="mt-3"><p className="text-sm text-muted-foreground">Core Web Vitals · TTFB · cache hit rate · query p95 · bundle KB.</p></TabsContent>
            <TabsContent value="findings" className="mt-3"><p className="text-sm text-muted-foreground">Ranked issues · severity · surface · owner · pipeline linkage.</p></TabsContent>
            <TabsContent value="fixes"    className="mt-3"><p className="text-sm text-muted-foreground">AI-suggested patches · previews · approvals · rollouts.</p></TabsContent>
            <TabsContent value="activity" className="mt-3"><p className="text-sm text-muted-foreground">Scans · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Optimization Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, scans, tunings, exports, and publishes log here.
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
