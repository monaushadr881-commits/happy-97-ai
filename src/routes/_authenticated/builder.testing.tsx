/**
 * /builder/testing — HAPPY AI Testing Center™ (R232)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Quality / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FlaskConical, TestTube2, Workflow, MousePointer2, Globe2,
  Gauge, ShieldCheck, Accessibility, Eye, Play, FileCheck2,
  Download, ScrollText, Sparkles,
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

export const Route = createFileRoute("/_authenticated/builder/testing")({
  head: () => ({
    meta: [
      { title: "AI Testing Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TestingCenterRoute,
});

type PresetId =
  | "unit" | "integration" | "playwright" | "cypress" | "api"
  | "performance" | "security" | "accessibility" | "visual";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "unit",          label: "Unit Tests",         icon: <TestTube2 className="h-4 w-4" />,     hint: "Vitest / Jest · pure functions · components · hooks." },
  { id: "integration",   label: "Integration Tests",  icon: <Workflow className="h-4 w-4" />,      hint: "Modules together · DB · queries · flows." },
  { id: "playwright",    label: "Playwright",         icon: <MousePointer2 className="h-4 w-4" />, hint: "End-to-end browser tests · multi-browser · trace." },
  { id: "cypress",       label: "Cypress",            icon: <MousePointer2 className="h-4 w-4" />, hint: "E2E component tests · time-travel debugging." },
  { id: "api",           label: "API Tests",          icon: <Globe2 className="h-4 w-4" />,        hint: "REST / GraphQL · contracts · auth · schemas." },
  { id: "performance",   label: "Performance Tests",  icon: <Gauge className="h-4 w-4" />,         hint: "k6 / Lighthouse · load · Core Web Vitals." },
  { id: "security",      label: "Security Tests",     icon: <ShieldCheck className="h-4 w-4" />,   hint: "OWASP · auth · RLS · secrets · injection." },
  { id: "accessibility", label: "Accessibility",      icon: <Accessibility className="h-4 w-4" />, hint: "axe · WCAG AA · keyboard · ARIA · contrast." },
  { id: "visual",        label: "Visual Regression",  icon: <Eye className="h-4 w-4" />,           hint: "Snapshot diff per route · device · theme." },
];

const INTRO: Record<PresetId, string> = {
  unit:          "Describe the module or function to unit-test.",
  integration:   "Describe the flow · modules · data to integration-test.",
  playwright:    "Describe the user journey to end-to-end test with Playwright.",
  cypress:       "Describe the flow to test with Cypress.",
  api:           "Describe the endpoint · payload · contract to test.",
  performance:   "Describe the route or workflow to load-test.",
  security:      "Describe the surface to security-test (auth, RLS, inputs).",
  accessibility: "Describe the route or component to a11y-test.",
  visual:        "Describe the route · device · theme to snapshot.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function TestingCenterRoute() {
  const [preset, setPreset] = React.useState<PresetId>("unit");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY generating ${preset} tests…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const generate = () => { pushLog("log", `Generate ${preset} suite via Quality Runtime`); toast.info(`Generating ${preset} tests…`); };
  const run      = () => { pushLog("log", `Run ${preset} suite via Quality Runtime`);      toast.info(`Running ${preset} tests…`); };
  const exportSuite = () => { pushLog("log", `Export ${preset} suite via Publishing Runtime`); toast.info("Exporting suite…"); };
  const publish  = () => { pushLog("log", `Publish results → Approval → Audit → Mission Control`); toast.info("Publishing results…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4" /> HAPPY AI Testing Center
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate and run tests across every surface
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every suite flows through the canonical pipeline —
            Quality → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Testing presets" className="flex flex-wrap gap-2">
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
            defaultSurface="code"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`testing:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                         className="gap-1"><Sparkles className="h-4 w-4" />Generate Suite</Button>
            <Button size="sm" variant="outline"   onClick={run}          className="gap-1"><Play className="h-4 w-4" />Run</Button>
            <Button size="sm" variant="outline"   onClick={exportSuite}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}      className="gap-1"><FileCheck2 className="h-4 w-4" />Publish Results</Button>
          </div>

          <Tabs defaultValue="suite" className="w-full">
            <TabsList>
              <TabsTrigger value="suite"    className="gap-1"><TestTube2 className="h-4 w-4" />Suite</TabsTrigger>
              <TabsTrigger value="runs"     className="gap-1"><Play className="h-4 w-4" />Runs</TabsTrigger>
              <TabsTrigger value="coverage" className="gap-1"><Gauge className="h-4 w-4" />Coverage</TabsTrigger>
              <TabsTrigger value="report"   className="gap-1"><FileCheck2 className="h-4 w-4" />Report</TabsTrigger>
            </TabsList>

            <TabsContent value="suite" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · generated specs render here from Quality Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="runs" className="mt-3">
              <p className="text-sm text-muted-foreground">Latest runs · pass / fail · duration · flake detection.</p>
            </TabsContent>
            <TabsContent value="coverage" className="mt-3">
              <p className="text-sm text-muted-foreground">Line, branch, and route coverage · mirrored to Mission Control.</p>
            </TabsContent>
            <TabsContent value="report" className="mt-3">
              <p className="text-sm text-muted-foreground">HAPPY summarizes failures, root causes, and suggested fixes.</p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Test Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, generations, runs, exports, and publishes log here.
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
