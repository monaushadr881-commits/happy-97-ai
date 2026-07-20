/**
 * /agriculture — HAPPY Agriculture Builder™ (R240)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Knowledge / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sprout, Tractor, Wheat, Mountain, CloudSun, LineChart,
  Wrench, Brain,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid,
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

export const Route = createFileRoute("/_authenticated/agriculture")({
  head: () => ({
    meta: [
      { title: "Agriculture Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgricultureRoute,
});

type PresetId =
  | "farm" | "crop" | "soil" | "weather"
  | "market" | "equipment" | "advisory";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "farm",      label: "Farm",          icon: <Tractor className="h-4 w-4" />,   hint: "Plots · parcels · owners · boundaries · certifications." },
  { id: "crop",      label: "Crop",          icon: <Wheat className="h-4 w-4" />,     hint: "Variety · calendar · yield · rotation · pests." },
  { id: "soil",      label: "Soil",          icon: <Mountain className="h-4 w-4" />,  hint: "Tests · pH · NPK · organic carbon · recommendations." },
  { id: "weather",   label: "Weather",       icon: <CloudSun className="h-4 w-4" />,  hint: "Forecast · rainfall · alerts · frost · heat stress." },
  { id: "market",    label: "Market Prices", icon: <LineChart className="h-4 w-4" />, hint: "Mandi · commodity · trends · MSP · buyers." },
  { id: "equipment", label: "Equipment",     icon: <Wrench className="h-4 w-4" />,    hint: "Machinery · maintenance · rental · fuel · logs." },
  { id: "advisory",  label: "AI Advisory",   icon: <Brain className="h-4 w-4" />,     hint: "HAPPY recommendations · schedule · risk · yield boost." },
];

const INTRO: Record<PresetId, string> = {
  farm:      "Describe the farm · plots · owner · certifications.",
  crop:      "Describe the crop · variety · calendar · rotation.",
  soil:      "Describe the soil test · results · plot · date.",
  weather:   "Describe the location · window · alert thresholds.",
  market:    "Describe the commodity · mandi · window.",
  equipment: "Describe the equipment · maintenance · fuel logs.",
  advisory:  "Describe the farm context · HAPPY advises next actions.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function AgricultureRoute() {
  const [preset, setPreset] = React.useState<PresetId>("farm");
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

  const generate = () => { pushLog("log", `Generate ${preset} via Creator Runtime`);              toast.info(`Generating ${preset}…`); };
  const optimize = () => { pushLog("log", `AI optimize ${preset} via Knowledge Runtime`);         toast.info("HAPPY optimizing…"); };
  const exportRpt= () => { pushLog("log", `Export ${preset} via Publishing Runtime`);             toast.info("Exporting…"); };
  const publish  = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sprout className="h-4 w-4" /> HAPPY Agriculture Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ship farm, crop, soil & advisory experiences end-to-end
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every action flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Agriculture presets" className="flex flex-wrap gap-2">
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
            target={`agriculture:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                       className="gap-1"><Play className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline"   onClick={optimize}   className="gap-1"><Sparkles className="h-4 w-4" />AI Optimize</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt}  className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><LayoutGrid className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="plots"    className="gap-1"><Tractor className="h-4 w-4" />Plots</TabsTrigger>
              <TabsTrigger value="signals"  className="gap-1"><CloudSun className="h-4 w-4" />Signals</TabsTrigger>
              <TabsTrigger value="advisory" className="gap-1"><Brain className="h-4 w-4" />Advisory</TabsTrigger>
              <TabsTrigger value="publish"  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · surface renders here from Creator Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="plots"    className="mt-3"><p className="text-sm text-muted-foreground">Plots · crops · rotations · owners · certifications.</p></TabsContent>
            <TabsContent value="signals"  className="mt-3"><p className="text-sm text-muted-foreground">Soil · weather · market · equipment health signals.</p></TabsContent>
            <TabsContent value="advisory" className="mt-3"><p className="text-sm text-muted-foreground">HAPPY next-best actions · risk alerts · yield boosters.</p></TabsContent>
            <TabsContent value="publish"  className="mt-3"><p className="text-sm text-muted-foreground">Approval · schedule · rollout · rollback · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Agriculture Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, generations, optimizations, exports, and publishes log here.
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
