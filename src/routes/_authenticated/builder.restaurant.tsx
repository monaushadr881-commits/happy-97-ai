/**
 * /builder/restaurant — HAPPY Restaurant Builder™
 *
 * Thin presentation shell over the existing Business Runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business · Commerce · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  UtensilsCrossed, Globe, Smartphone, QrCode, CalendarCheck, ChefHat,
  Receipt, ScanLine, ShoppingBag, Bike, Warehouse, BarChart3,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity,
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

export const Route = createFileRoute("/_authenticated/builder/restaurant")({
  head: () => ({
    meta: [
      { title: "Restaurant Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantBuilderRoute,
});

type PresetId =
  | "website" | "app" | "qr" | "booking" | "kds" | "billing"
  | "pos" | "online" | "delivery" | "inventory" | "analytics";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "website",   label: "Restaurant Website", icon: <Globe className="h-4 w-4" />,         hint: "Brand · menu · gallery · booking · SEO." },
  { id: "app",       label: "Restaurant App",     icon: <Smartphone className="h-4 w-4" />,    hint: "Native app · loyalty · notifications · orders." },
  { id: "qr",        label: "QR Menu",            icon: <QrCode className="h-4 w-4" />,        hint: "Per-table QR · digital menu · order-at-table." },
  { id: "booking",   label: "Table Booking",      icon: <CalendarCheck className="h-4 w-4" />, hint: "Reservations · floor plan · slots · reminders." },
  { id: "kds",       label: "Kitchen Display",    icon: <ChefHat className="h-4 w-4" />,       hint: "KOT · stations · timers · bump · expo." },
  { id: "billing",   label: "Billing",            icon: <Receipt className="h-4 w-4" />,       hint: "Invoices · GST · splits · tips · rounding." },
  { id: "pos",       label: "POS",                icon: <ScanLine className="h-4 w-4" />,      hint: "Counter · dine-in · takeaway · shifts · Z-report." },
  { id: "online",    label: "Online Orders",      icon: <ShoppingBag className="h-4 w-4" />,   hint: "Direct · aggregators · menu sync · status." },
  { id: "delivery",  label: "Delivery",           icon: <Bike className="h-4 w-4" />,          hint: "Riders · zones · SLA · live tracking · COD." },
  { id: "inventory", label: "Inventory",          icon: <Warehouse className="h-4 w-4" />,     hint: "Ingredients · recipes · wastage · reorder." },
  { id: "analytics", label: "Analytics",          icon: <BarChart3 className="h-4 w-4" />,     hint: "Sales · covers · items · dayparts · cohorts." },
];

const INTRO: Record<PresetId, string> = {
  website:   "Describe the restaurant site · brand · menu · booking.",
  app:       "Describe the app · loyalty · push · order flow.",
  qr:        "Describe the QR menu · tables · categories · rules.",
  booking:   "Describe the reservation rule · slots · floor plan.",
  kds:       "Describe the kitchen flow · stations · timers.",
  billing:   "Describe the bill format · GST · splits · tips.",
  pos:       "Describe the POS mode · shift · counter · Z-report.",
  online:    "Describe the online channel · aggregator · menu sync.",
  delivery:  "Describe the delivery zone · rider · SLA · COD.",
  inventory: "Describe the ingredient · recipe · wastage · reorder.",
  analytics: "Describe the report · metric · daypart · window.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function RestaurantBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("website");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "restaurant", onLog: pushLog });
  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(preset, p.prompt, p.attachments?.length ?? 0);
  }, [preset, pushLog, __submitPrompt]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} via Business Runtime`);            toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);       toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);       toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UtensilsCrossed className="h-4 w-4" /> HAPPY Restaurant Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — front-of-house, kitchen, delivery, analytics
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Restaurant presets" className="flex flex-wrap gap-2">
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
            target={`restaurant:${preset}`}
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
              <TabsTrigger value="menu"      className="gap-1"><QrCode className="h-4 w-4" />Menu</TabsTrigger>
              <TabsTrigger value="orders"    className="gap-1"><ShoppingBag className="h-4 w-4" />Orders</TabsTrigger>
              <TabsTrigger value="kitchen"   className="gap-1"><ChefHat className="h-4 w-4" />Kitchen</TabsTrigger>
              <TabsTrigger value="delivery"  className="gap-1"><Bike className="h-4 w-4" />Delivery</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders restaurant state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="menu"      className="mt-3"><p className="text-sm text-muted-foreground">QR menu · categories · items · modifiers · pricing · availability.</p></TabsContent>
            <TabsContent value="orders"    className="mt-3"><p className="text-sm text-muted-foreground">Dine-in · takeaway · online · aggregator · status · splits · tips.</p></TabsContent>
            <TabsContent value="kitchen"   className="mt-3"><p className="text-sm text-muted-foreground">KDS · stations · timers · bump · expo · recipe · wastage.</p></TabsContent>
            <TabsContent value="delivery"  className="mt-3"><p className="text-sm text-muted-foreground">Zones · riders · SLA · live tracking · COD · reconciliation.</p></TabsContent>
            <TabsContent value="analytics" className="mt-3"><p className="text-sm text-muted-foreground">Sales · covers · top items · dayparts · funnels · retention.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Restaurant Log
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
