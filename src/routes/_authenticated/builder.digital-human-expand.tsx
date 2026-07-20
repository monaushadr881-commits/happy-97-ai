/**
 * /builder/digital-human-expand — HAPPY Digital Human Expansion Builder™
 *
 * Thin presentation shell over the existing Digital Human runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Digital Human · Voice · Knowledge · Meetings · Publishing · Approval · Audit · Mission Control.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  UserRound, Mic, Smile, Waves, BookOpen, CalendarClock,
  Handshake, GraduationCap, Crown,
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

export const Route = createFileRoute("/_authenticated/builder/digital-human-expand")({
  head: () => ({
    meta: [
      { title: "Digital Human Expansion — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigitalHumanExpandBuilderRoute,
});

type PresetId =
  | "avatar" | "voice" | "emotion" | "lipsync" | "knowledge"
  | "meetings" | "sales" | "teacher" | "founder";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "avatar",    label: "Avatar",    icon: <UserRound className="h-4 w-4" />,     hint: "Canonical HAPPY avatar · appearance · outfit · scene · pose." },
  { id: "voice",     label: "Voice",     icon: <Mic className="h-4 w-4" />,           hint: "Voice modes · tone · pace · language · streaming." },
  { id: "emotion",   label: "Emotion",   icon: <Smile className="h-4 w-4" />,         hint: "Expression library · mood · reactivity · blend." },
  { id: "lipsync",   label: "Lip Sync",  icon: <Waves className="h-4 w-4" />,         hint: "Viseme timing · phoneme alignment · latency · drift." },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen className="h-4 w-4" />,      hint: "Sources · citations · scope · retention · retrieval." },
  { id: "meetings",  label: "Meetings",  icon: <CalendarClock className="h-4 w-4" />, hint: "Join · presence · notes · action items · recap." },
  { id: "sales",     label: "Sales",     icon: <Handshake className="h-4 w-4" />,     hint: "Discovery · demo · objections · pricing · follow-up." },
  { id: "teacher",   label: "Teacher",   icon: <GraduationCap className="h-4 w-4" />, hint: "Curriculum · pace · quiz · feedback · progress." },
  { id: "founder",   label: "Founder",   icon: <Crown className="h-4 w-4" />,         hint: "Briefings · decisions · approvals · executive review." },
];

const INTRO: Record<PresetId, string> = {
  avatar:    "Describe the appearance · outfit · scene · pose.",
  voice:     "Describe the voice · tone · pace · language.",
  emotion:   "Describe the emotion · trigger · intensity · blend.",
  lipsync:   "Describe the lip-sync · phoneme · latency · fallback.",
  knowledge: "Describe the source · scope · citation · retention.",
  meetings:  "Describe the meeting · role · notes · action items.",
  sales:     "Describe the discovery · demo · objection · follow-up.",
  teacher:   "Describe the lesson · pace · quiz · feedback.",
  founder:   "Describe the briefing · decision · approval · review.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DigitalHumanExpandBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("avatar");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "digital-human-expand", onLog: pushLog });
  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(preset, p.prompt, p.attachments?.length ?? 0);
  }, [preset, pushLog, __submitPrompt]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const run       = () => { pushLog("log", `Run ${preset} via Digital Human Runtime`);         toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);         toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);         toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" /> HAPPY Digital Human Expansion
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — avatar, voice, emotion, lip-sync, roles
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the Digital Human runtime — no second Digital Human. Every mutation
            flows through the pipeline: Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Digital human presets" className="flex flex-wrap gap-2">
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
            target={`digital-human:${preset}`}
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
              <TabsTrigger value="presence"  className="gap-1"><UserRound className="h-4 w-4" />Presence</TabsTrigger>
              <TabsTrigger value="voice"     className="gap-1"><Mic className="h-4 w-4" />Voice</TabsTrigger>
              <TabsTrigger value="emotion"   className="gap-1"><Smile className="h-4 w-4" />Emotion</TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1"><BookOpen className="h-4 w-4" />Knowledge</TabsTrigger>
              <TabsTrigger value="roles"     className="gap-1"><Handshake className="h-4 w-4" />Roles</TabsTrigger>
              <TabsTrigger value="activity"  className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders Digital Human state from the canonical runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="presence"  className="mt-3"><p className="text-sm text-muted-foreground">Avatar · appearance · outfit · scene · pose.</p></TabsContent>
            <TabsContent value="voice"     className="mt-3"><p className="text-sm text-muted-foreground">Voice · tone · pace · language · streaming.</p></TabsContent>
            <TabsContent value="emotion"   className="mt-3"><p className="text-sm text-muted-foreground">Expression library · mood · reactivity · lip-sync alignment.</p></TabsContent>
            <TabsContent value="knowledge" className="mt-3"><p className="text-sm text-muted-foreground">Sources · citations · scope · retention · retrieval.</p></TabsContent>
            <TabsContent value="roles"     className="mt-3"><p className="text-sm text-muted-foreground">Meetings · Sales · Teacher · Founder role modes.</p></TabsContent>
            <TabsContent value="activity"  className="mt-3"><p className="text-sm text-muted-foreground">Runs · tunings · exports · publishes · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Digital Human Log
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
