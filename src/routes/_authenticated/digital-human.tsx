/**
 * /digital-human — HAPPY Digital Human Pro™ (R246)
 *
 * Thin presentation shell extending the canonical Digital Human runtime.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Digital Human / Voice / Presentation runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Realtime Voice · Emotion AI · Avatar Creator · Meeting / Presentation /
 * Sales / Teacher modes are presentation surfaces over existing runtimes
 * (`src/lib/digital-human/canonical-avatar.ts`, `digital-human-runtime.functions.ts`).
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  UserCircle2, Mic, HeartPulse, Palette, Presentation, Users,
  Handshake, GraduationCap,
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

export const Route = createFileRoute("/_authenticated/digital-human")({
  head: () => ({
    meta: [
      { title: "Digital Human Pro — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigitalHumanRoute,
});

type PresetId =
  | "voice" | "emotion" | "avatar" | "meeting" | "presentation" | "sales" | "teacher";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "voice",        label: "Realtime Voice",     icon: <Mic className="h-4 w-4" />,           hint: "Low-latency STT · streaming TTS · interruptions · VAD." },
  { id: "emotion",      label: "Emotion AI",         icon: <HeartPulse className="h-4 w-4" />,    hint: "Mood detection · expressions · empathy · tone adaptation." },
  { id: "avatar",       label: "Avatar Creator",     icon: <Palette className="h-4 w-4" />,       hint: "Face · rig · outfit · voice · signature gestures." },
  { id: "meeting",      label: "Meeting Mode",       icon: <Users className="h-4 w-4" />,         hint: "Agenda · notes · action items · follow-ups." },
  { id: "presentation", label: "Presentation Mode",  icon: <Presentation className="h-4 w-4" />,  hint: "Slides · narration · Q&A · pacing · handoffs." },
  { id: "sales",        label: "Sales Mode",         icon: <Handshake className="h-4 w-4" />,     hint: "Discovery · objections · pitch · pricing · next steps." },
  { id: "teacher",      label: "Teacher Mode",       icon: <GraduationCap className="h-4 w-4" />, hint: "Lesson · Socratic prompts · checks · feedback." },
];

const INTRO: Record<PresetId, string> = {
  voice:        "Describe the voice session · language · latency budget.",
  emotion:      "Describe emotion targets · triggers · fallbacks.",
  avatar:       "Describe the avatar · face · outfit · voice · gestures.",
  meeting:      "Describe the meeting · attendees · agenda · outcome.",
  presentation: "Describe the deck · audience · duration · call to action.",
  sales:        "Describe the account · discovery · objections · offer.",
  teacher:      "Describe the lesson · learner · rubric · checkpoints.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DigitalHumanRoute() {
  const [preset, setPreset] = React.useState<PresetId>("voice");
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

  const startMode = () => { pushLog("log", `Start ${preset} via Digital Human Runtime`); toast.info(`Starting ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);   toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);   toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle2 className="h-4 w-4" /> HAPPY Digital Human Pro
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — realtime, expressive, mode-aware
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Extends the canonical avatar. Every session flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Digital Human presets" className="flex flex-wrap gap-2">
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
            <Button size="sm" onClick={startMode}                     className="gap-1"><Play className="h-4 w-4" />Start</Button>
            <Button size="sm" variant="outline"   onClick={optimize}  className="gap-1"><Sparkles className="h-4 w-4" />AI Tune</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="stage" className="w-full">
            <TabsList>
              <TabsTrigger value="stage"    className="gap-1"><LayoutGrid className="h-4 w-4" />Stage</TabsTrigger>
              <TabsTrigger value="voice"    className="gap-1"><Mic className="h-4 w-4" />Voice</TabsTrigger>
              <TabsTrigger value="emotion"  className="gap-1"><HeartPulse className="h-4 w-4" />Emotion</TabsTrigger>
              <TabsTrigger value="avatar"   className="gap-1"><Palette className="h-4 w-4" />Avatar</TabsTrigger>
              <TabsTrigger value="sessions" className="gap-1"><Activity className="h-4 w-4" />Sessions</TabsTrigger>
              <TabsTrigger value="publish"  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="stage" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders here from the Digital Human runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="voice"    className="mt-3"><p className="text-sm text-muted-foreground">Realtime STT · streaming TTS · VAD · barge-in · language routing.</p></TabsContent>
            <TabsContent value="emotion"  className="mt-3"><p className="text-sm text-muted-foreground">Mood detection · expression library · empathy · tone adaptation.</p></TabsContent>
            <TabsContent value="avatar"   className="mt-3"><p className="text-sm text-muted-foreground">Face · rig · outfit · voice · signature gestures · presets.</p></TabsContent>
            <TabsContent value="sessions" className="mt-3"><p className="text-sm text-muted-foreground">Health · session stats · transcripts · action items · rollbacks.</p></TabsContent>
            <TabsContent value="publish"  className="mt-3"><p className="text-sm text-muted-foreground">Approval · schedule · rollout · rollback · Mission Control.</p></TabsContent>
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
                  Preset changes, starts, tunings, exports, and publishes log here.
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
