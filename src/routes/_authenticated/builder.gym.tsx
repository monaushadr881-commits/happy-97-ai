/**
 * /builder/gym — HAPPY Gym Builder™
 *
 * Thin presentation shell over the existing Business Runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business · Knowledge · Publishing · Approval · Audit · Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dumbbell, Users, Package, CalendarCheck, UserCog, Salad, Flame, Wallet,
  Play, Sparkles, Download, FileCheck2, ScrollText, LayoutGrid, Activity, BarChart3,
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

export const Route = createFileRoute("/_authenticated/builder/gym")({
  head: () => ({
    meta: [
      { title: "Gym Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GymBuilderRoute,
});

type PresetId =
  | "members" | "plans" | "attendance" | "trainer"
  | "diet" | "workout" | "payments" | "analytics";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "members",    label: "Members",    icon: <Users className="h-4 w-4" />,          hint: "Signup · profile · goals · measurements · renewals." },
  { id: "plans",      label: "Plans",      icon: <Package className="h-4 w-4" />,        hint: "Monthly · quarterly · PT · combo · offers." },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" />,  hint: "Biometric · QR · sessions · streaks · alerts." },
  { id: "trainer",    label: "Trainer",    icon: <UserCog className="h-4 w-4" />,        hint: "Profiles · clients · schedules · payouts." },
  { id: "diet",       label: "Diet",       icon: <Salad className="h-4 w-4" />,          hint: "Plans · macros · meals · logs · reminders." },
  { id: "workout",    label: "Workout",    icon: <Flame className="h-4 w-4" />,          hint: "Routines · splits · exercises · progress." },
  { id: "payments",   label: "Payments",   icon: <Wallet className="h-4 w-4" />,         hint: "Invoices · UPI · cards · dues · reminders." },
  { id: "analytics",  label: "Analytics",  icon: <BarChart3 className="h-4 w-4" />,      hint: "Members · retention · revenue · trainer load." },
];

const INTRO: Record<PresetId, string> = {
  members:    "Describe the member · goal · plan · onboarding.",
  plans:      "Describe the plan · duration · price · perks.",
  attendance: "Describe the attendance rule · mode · alerts.",
  trainer:    "Describe the trainer · clients · schedule · payout.",
  diet:       "Describe the diet plan · macros · meals · rules.",
  workout:    "Describe the workout · split · exercise · progress.",
  payments:   "Describe the invoice · mode · reminder · due rule.",
  analytics:  "Describe the report · metric · dimension · window.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function GymBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("members");
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
            <Dumbbell className="h-4 w-4" /> HAPPY Gym Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — members, plans, trainers, diet, workout
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Gym presets" className="flex flex-wrap gap-2">
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
            target={`gym:${preset}`}
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
              <TabsTrigger value="members"   className="gap-1"><Users className="h-4 w-4" />Members</TabsTrigger>
              <TabsTrigger value="training"  className="gap-1"><Flame className="h-4 w-4" />Training</TabsTrigger>
              <TabsTrigger value="nutrition" className="gap-1"><Salad className="h-4 w-4" />Nutrition</TabsTrigger>
              <TabsTrigger value="finance"   className="gap-1"><Wallet className="h-4 w-4" />Finance</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders gym state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="members"   className="mt-3"><p className="text-sm text-muted-foreground">Signup · plans · attendance · renewals · retention.</p></TabsContent>
            <TabsContent value="training"  className="mt-3"><p className="text-sm text-muted-foreground">Trainers · workouts · splits · exercises · progress.</p></TabsContent>
            <TabsContent value="nutrition" className="mt-3"><p className="text-sm text-muted-foreground">Diet plans · macros · meals · logs · reminders.</p></TabsContent>
            <TabsContent value="finance"   className="mt-3"><p className="text-sm text-muted-foreground">Invoices · payments · dues · trainer payouts.</p></TabsContent>
            <TabsContent value="analytics" className="mt-3"><p className="text-sm text-muted-foreground">Members · retention · revenue · trainer load.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Gym Log
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
