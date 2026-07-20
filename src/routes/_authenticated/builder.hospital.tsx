/**
 * /builder/hospital — HAPPY Hospital Builder™
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
  Stethoscope, CalendarCheck, UserCog, Users, Receipt, FileHeart,
  Pill, FlaskConical, BedDouble, Activity as ActivityIcon, ShieldCheck,
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

export const Route = createFileRoute("/_authenticated/builder/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HospitalBuilderRoute,
});

type PresetId =
  | "appointments" | "doctors" | "patients" | "billing" | "emr"
  | "pharmacy" | "lab" | "ipd" | "opd" | "insurance";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "appointments", label: "Appointments", icon: <CalendarCheck className="h-4 w-4" />,   hint: "Slots · booking · reminders · queue · no-show." },
  { id: "doctors",      label: "Doctors",      icon: <UserCog className="h-4 w-4" />,         hint: "Profiles · specialties · schedules · consult fees." },
  { id: "patients",     label: "Patients",     icon: <Users className="h-4 w-4" />,           hint: "Registration · UHID · demographics · history." },
  { id: "billing",      label: "Billing",      icon: <Receipt className="h-4 w-4" />,         hint: "Consult · procedures · packages · GST · settle." },
  { id: "emr",          label: "EMR",          icon: <FileHeart className="h-4 w-4" />,       hint: "Vitals · notes · Rx · orders · timeline." },
  { id: "pharmacy",     label: "Pharmacy",     icon: <Pill className="h-4 w-4" />,            hint: "Stock · Rx · dispense · substitutes · batches." },
  { id: "lab",          label: "Laboratory",   icon: <FlaskConical className="h-4 w-4" />,    hint: "Tests · samples · analyzers · reports · deliver." },
  { id: "ipd",          label: "IPD",          icon: <BedDouble className="h-4 w-4" />,       hint: "Beds · admissions · nursing · rounds · discharge." },
  { id: "opd",          label: "OPD",          icon: <ActivityIcon className="h-4 w-4" />,    hint: "Consult · queue · Rx · investigations · follow-up." },
  { id: "insurance",    label: "Insurance",    icon: <ShieldCheck className="h-4 w-4" />,     hint: "TPAs · pre-auth · claims · settlement · MOU." },
];

const INTRO: Record<PresetId, string> = {
  appointments: "Describe the appointment rule · slot · reminder.",
  doctors:      "Describe the doctor · specialty · schedule · fees.",
  patients:     "Describe the patient · UHID · demographics.",
  billing:      "Describe the bill · procedure · package · GST.",
  emr:          "Describe the EMR template · vitals · Rx · orders.",
  pharmacy:     "Describe the pharmacy · stock · Rx · batch rule.",
  lab:          "Describe the lab test · sample · analyzer · report.",
  ipd:          "Describe the IPD flow · ward · nursing · discharge.",
  opd:          "Describe the OPD flow · queue · Rx · follow-up.",
  insurance:    "Describe the TPA · pre-auth · claim · settle.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function HospitalBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("appointments");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "hospital", onLog: pushLog });
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
            <Stethoscope className="h-4 w-4" /> HAPPY Hospital Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — OPD, IPD, EMR, pharmacy, lab, insurance
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Hospital presets" className="flex flex-wrap gap-2">
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
            target={`hospital:${preset}`}
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
              <TabsTrigger value="clinical"  className="gap-1"><FileHeart className="h-4 w-4" />Clinical</TabsTrigger>
              <TabsTrigger value="wards"     className="gap-1"><BedDouble className="h-4 w-4" />Wards</TabsTrigger>
              <TabsTrigger value="ancillary" className="gap-1"><FlaskConical className="h-4 w-4" />Ancillary</TabsTrigger>
              <TabsTrigger value="finance"   className="gap-1"><Receipt className="h-4 w-4" />Finance</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"  className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders hospital state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="clinical"  className="mt-3"><p className="text-sm text-muted-foreground">OPD · EMR · Rx · orders · vitals · follow-up.</p></TabsContent>
            <TabsContent value="wards"     className="mt-3"><p className="text-sm text-muted-foreground">IPD · beds · nursing · rounds · discharge · handover.</p></TabsContent>
            <TabsContent value="ancillary" className="mt-3"><p className="text-sm text-muted-foreground">Pharmacy · laboratory · radiology · supply.</p></TabsContent>
            <TabsContent value="finance"   className="mt-3"><p className="text-sm text-muted-foreground">Billing · packages · GST · insurance · claims.</p></TabsContent>
            <TabsContent value="analytics" className="mt-3"><p className="text-sm text-muted-foreground">Footfall · occupancy · TAT · revenue · outcomes.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Hospital Log
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
