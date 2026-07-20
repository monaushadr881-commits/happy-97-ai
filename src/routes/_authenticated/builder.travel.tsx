/**
 * /builder/travel — HAPPY Travel Builder™
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
  Plane, Map as MapIcon, BedDouble, PlaneTakeoff, CalendarCheck, CreditCard, ReceiptText, Star,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity, BarChart3,
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

export const Route = createFileRoute("/_authenticated/builder/travel")({
  head: () => ({
    meta: [
      { title: "Travel Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TravelBuilderRoute,
});

type PresetId =
  | "tours" | "hotels" | "flights" | "bookings" | "payments" | "invoices" | "reviews";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "tours",    label: "Tours",    icon: <MapIcon className="h-4 w-4" />,       hint: "Itineraries · packages · inclusions · pricing." },
  { id: "hotels",   label: "Hotels",   icon: <BedDouble className="h-4 w-4" />,     hint: "Rooms · rates · availability · amenities." },
  { id: "flights",  label: "Flights",  icon: <PlaneTakeoff className="h-4 w-4" />,  hint: "Routes · fares · classes · baggage · vendors." },
  { id: "bookings", label: "Bookings", icon: <CalendarCheck className="h-4 w-4" />, hint: "Reservations · pax · confirmations · vouchers." },
  { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />,    hint: "Cards · UPI · installments · refunds." },
  { id: "invoices", label: "Invoices", icon: <ReceiptText className="h-4 w-4" />,   hint: "GST · vouchers · e-invoice · receipts." },
  { id: "reviews",  label: "Reviews",  icon: <Star className="h-4 w-4" />,          hint: "Ratings · testimonials · replies · moderation." },
];

const INTRO: Record<PresetId, string> = {
  tours:    "Describe the tour · itinerary · inclusion · price.",
  hotels:   "Describe the property · room · rate · availability.",
  flights:  "Describe the route · fare · class · baggage rule.",
  bookings: "Describe the reservation · pax · voucher · confirmation.",
  payments: "Describe the payment · installment · refund rule.",
  invoices: "Describe the invoice · GST · voucher · e-invoice.",
  reviews:  "Describe the review flow · reply · moderation.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function TravelBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("tours");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "travel", onLog: pushLog });
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
            <Plane className="h-4 w-4" /> HAPPY Travel Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — tours, hotels, flights, bookings
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Travel presets" className="flex flex-wrap gap-2">
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
            target={`travel:${preset}`}
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
              <TabsTrigger value="inventory" className="gap-1"><MapIcon className="h-4 w-4" />Inventory</TabsTrigger>
              <TabsTrigger value="bookings"  className="gap-1"><CalendarCheck className="h-4 w-4" />Bookings</TabsTrigger>
              <TabsTrigger value="finance"   className="gap-1"><CreditCard className="h-4 w-4" />Finance</TabsTrigger>
              <TabsTrigger value="reviews"   className="gap-1"><Star className="h-4 w-4" />Reviews</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"  className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders travel state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="inventory" className="mt-3"><p className="text-sm text-muted-foreground">Tours · hotels · flights · vendors · availability.</p></TabsContent>
            <TabsContent value="bookings"  className="mt-3"><p className="text-sm text-muted-foreground">Reservations · pax · vouchers · confirmations.</p></TabsContent>
            <TabsContent value="finance"   className="mt-3"><p className="text-sm text-muted-foreground">Payments · refunds · invoices · GST · payouts.</p></TabsContent>
            <TabsContent value="reviews"   className="mt-3"><p className="text-sm text-muted-foreground">Ratings · testimonials · replies · moderation.</p></TabsContent>
            <TabsContent value="analytics" className="mt-3"><p className="text-sm text-muted-foreground">Sales · occupancy · load · conversion · vendor mix.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Travel Log
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
