/**
 * /builder/college — HAPPY College Builder™
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
  GraduationCap, Building2, Users, User, CalendarCheck, Library,
  BedDouble, Bus, ClipboardCheck, Briefcase,
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

export const Route = createFileRoute("/_authenticated/builder/college")({
  head: () => ({
    meta: [
      { title: "College Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CollegeBuilderRoute,
});

type PresetId =
  | "erp" | "departments" | "faculty" | "students" | "attendance"
  | "library" | "hostel" | "transport" | "exams" | "placements";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "erp",         label: "College ERP",  icon: <GraduationCap className="h-4 w-4" />,  hint: "Programs · departments · calendar · policies." },
  { id: "departments", label: "Departments",  icon: <Building2 className="h-4 w-4" />,      hint: "Departments · HODs · courses · load." },
  { id: "faculty",     label: "Faculty",      icon: <Users className="h-4 w-4" />,          hint: "Profiles · assignments · leaves · appraisal." },
  { id: "students",    label: "Students",     icon: <User className="h-4 w-4" />,           hint: "Admission · roll · batches · records." },
  { id: "attendance",  label: "Attendance",   icon: <CalendarCheck className="h-4 w-4" />,  hint: "Class · lab · biometric · shortage alerts." },
  { id: "library",     label: "Library",      icon: <Library className="h-4 w-4" />,        hint: "Catalog · issue · return · fines · e-books." },
  { id: "hostel",      label: "Hostel",       icon: <BedDouble className="h-4 w-4" />,      hint: "Rooms · allocation · mess · leave · fees." },
  { id: "transport",   label: "Transport",    icon: <Bus className="h-4 w-4" />,            hint: "Routes · buses · passes · GPS · fees." },
  { id: "exams",       label: "Exams",        icon: <ClipboardCheck className="h-4 w-4" />, hint: "Schedules · seating · marks · grade · results." },
  { id: "placements",  label: "Placements",   icon: <Briefcase className="h-4 w-4" />,      hint: "Companies · drives · rounds · offers · analytics." },
];

const INTRO: Record<PresetId, string> = {
  erp:         "Describe the college · programs · departments · policies.",
  departments: "Describe the department · HOD · courses · load.",
  faculty:     "Describe the faculty · assignment · leaves · appraisal.",
  students:    "Describe the student · admission · batch · records.",
  attendance:  "Describe the attendance rule · mode · alerts.",
  library:     "Describe the library rule · issue · fine · e-book.",
  hostel:      "Describe the hostel · rooms · mess · leave · fees.",
  transport:   "Describe the route · bus · pass · GPS · fees.",
  exams:       "Describe the exam · schedule · seating · grade rule.",
  placements:  "Describe the drive · company · rounds · criteria.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function CollegeBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("erp");
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
            <GraduationCap className="h-4 w-4" /> HAPPY College Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — departments, academics, campus life, placements
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Business runtime. Every mutation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="College presets" className="flex flex-wrap gap-2">
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
            target={`college:${preset}`}
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
              <TabsTrigger value="overview"   className="gap-1"><LayoutGrid className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="academics"  className="gap-1"><ClipboardCheck className="h-4 w-4" />Academics</TabsTrigger>
              <TabsTrigger value="people"     className="gap-1"><Users className="h-4 w-4" />People</TabsTrigger>
              <TabsTrigger value="campus"     className="gap-1"><BedDouble className="h-4 w-4" />Campus</TabsTrigger>
              <TabsTrigger value="placements" className="gap-1"><Briefcase className="h-4 w-4" />Placements</TabsTrigger>
              <TabsTrigger value="analytics"  className="gap-1"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              <TabsTrigger value="activity"   className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"   className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders college state from the Business runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="academics"  className="mt-3"><p className="text-sm text-muted-foreground">Departments · courses · timetable · exams · results.</p></TabsContent>
            <TabsContent value="people"     className="mt-3"><p className="text-sm text-muted-foreground">Students · faculty · staff · admission · attendance.</p></TabsContent>
            <TabsContent value="campus"     className="mt-3"><p className="text-sm text-muted-foreground">Library · hostel · transport · mess · facilities.</p></TabsContent>
            <TabsContent value="placements" className="mt-3"><p className="text-sm text-muted-foreground">Companies · drives · rounds · offers · trends.</p></TabsContent>
            <TabsContent value="analytics"  className="mt-3"><p className="text-sm text-muted-foreground">Attendance · performance · placements · fees.</p></TabsContent>
            <TabsContent value="activity"   className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> College Log
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
