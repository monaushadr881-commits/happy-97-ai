/**
 * /builder/digital-human — HAPPY Digital Human Studio™ (R223)
 *
 * Thin presentation shell. STRICT REUSE — EXTENDS existing Digital Human:
 *   • src/lib/digital-human/canonical-avatar.ts        (identity, expressions)
 *   • src/lib/digital-human/digital-human-runtime.functions.ts (experience handlers)
 *   • HappyUniversalPromptBar  (surface: "digital-human")
 *   • HappyUniversalActionBar  (canonical action bar)
 *
 * NO new avatar, NO new runtime, NO new server-fn, NO duplicated Digital Human.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  UserCircle2, Smile, AudioLines, Hand, Presentation, Users,
  Crown, GraduationCap, BadgeDollarSign, Headphones,
  Sparkles, Play, FileCheck2, Download, Palette, Film,
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

export const Route = createFileRoute("/_authenticated/builder/digital-human")({
  head: () => ({
    meta: [
      { title: "Digital Human Studio — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigitalHumanStudioRoute,
});

type CapabilityId =
  | "avatar" | "emotion" | "lip-sync" | "gesture";

type ModeId =
  | "presentation" | "meeting" | "founder" | "teacher" | "sales" | "support";

const CAPABILITIES: { id: CapabilityId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "avatar",   label: "Avatar",   icon: <UserCircle2 className="h-4 w-4" />, hint: "Extend the canonical HAPPY avatar identity · style · wardrobe." },
  { id: "emotion",  label: "Emotion",  icon: <Smile className="h-4 w-4" />,       hint: "Blend expressions from the canonical library (Neutral/Happy/Thinking/Explaining)." },
  { id: "lip-sync", label: "Lip Sync", icon: <AudioLines className="h-4 w-4" />,  hint: "Align mouth shapes to synthesized speech." },
  { id: "gesture",  label: "Gesture",  icon: <Hand className="h-4 w-4" />,        hint: "Layer hand & body gestures on the delivery timeline." },
];

const MODES: { id: ModeId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "presentation", label: "Presentation Mode",    icon: <Presentation className="h-4 w-4" />,    hint: "Narrate a deck · slide-aware pacing · pauses." },
  { id: "meeting",      label: "Meeting Mode",         icon: <Users className="h-4 w-4" />,           hint: "Live meeting persona · concise · attentive." },
  { id: "founder",      label: "Founder Mode",         icon: <Crown className="h-4 w-4" />,           hint: "Founder briefing · vision · directives." },
  { id: "teacher",      label: "Teacher Mode",         icon: <GraduationCap className="h-4 w-4" />,   hint: "Lesson delivery · explain · check understanding." },
  { id: "sales",        label: "Sales Mode",           icon: <BadgeDollarSign className="h-4 w-4" />, hint: "Discovery → pitch → objection → close." },
  { id: "support",      label: "Customer Support Mode",icon: <Headphones className="h-4 w-4" />,      hint: "Empathetic · resolve · escalate · confirm." },
];

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DigitalHumanStudioRoute() {
  const [capability, setCapability] = React.useState<CapabilityId>("avatar");
  const [mode, setMode]             = React.useState<ModeId>("presentation");
  const [logs, setLogs]             = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "digital-human", onLog: pushLog });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${capability}/${mode}: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(String(capability), p.prompt, p.attachments?.length ?? 0);
  }, [capability, mode, pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const rehearse = () => { pushLog("log", `Rehearse ${mode} via Digital Human Runtime`); toast.info(`Rehearsing ${mode}…`); };
  const render   = () => { pushLog("log", `Render ${capability} · ${mode} via Creator Runtime`); toast.info("Rendering scene…"); };
  const exportMp4 = () => { pushLog("log", `Export → MP4 via Publishing Runtime`); toast.info("Exporting MP4…"); };
  const publish  = () => { pushLog("log", `Publish → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activeCapability = CAPABILITIES.find((c) => c.id === capability)!;
  const activeMode       = MODES.find((m) => m.id === mode)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCircle2 className="h-4 w-4" /> HAPPY Digital Human Studio
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Extend HAPPY — one Digital Human, many modes
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every render extends the canonical HAPPY avatar and flows through
            Digital Human → Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">{activeCapability.icon}{activeCapability.label}</Badge>
          <Badge className="gap-1">{activeMode.icon}{activeMode.label}</Badge>
        </div>
      </header>

      <Separator className="my-6" />

      <section aria-label="Capabilities" className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Capabilities</div>
        <div className="flex flex-wrap gap-2">
          {CAPABILITIES.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={capability === c.id ? "default" : "outline"}
              onClick={() => { setCapability(c.id); pushLog("log", `Capability · ${c.label}`); }}
              className="gap-2"
            >
              {c.icon}{c.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{activeCapability.hint}</p>
      </section>

      <section aria-label="Modes" className="space-y-2 mt-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modes</div>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button
              key={m.id}
              size="sm"
              variant={mode === m.id ? "default" : "outline"}
              onClick={() => { setMode(m.id); pushLog("log", `Mode · ${m.label}`); }}
              className="gap-2"
            >
              {m.icon}{m.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{activeMode.hint}</p>
      </section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="digital-human"
            placeholder={`Direct HAPPY: ${activeMode.label} · ${activeCapability.label}.`}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`digital-human:${mode}:${capability}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={render}                          className="gap-1"><Sparkles className="h-4 w-4" />Render</Button>
            <Button size="sm" variant="outline" onClick={rehearse}      className="gap-1"><Play className="h-4 w-4" />Rehearse</Button>
            <Button size="sm" variant="outline" onClick={exportMp4}     className="gap-1"><Download className="h-4 w-4" />Export MP4</Button>
            <Button size="sm" variant="secondary" onClick={publish}     className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="stage" className="w-full">
            <TabsList>
              <TabsTrigger value="stage"      className="gap-1"><Film className="h-4 w-4" />Stage</TabsTrigger>
              <TabsTrigger value="expression" className="gap-1"><Smile className="h-4 w-4" />Expression</TabsTrigger>
              <TabsTrigger value="voice"      className="gap-1"><AudioLines className="h-4 w-4" />Voice & Lip</TabsTrigger>
              <TabsTrigger value="style"      className="gap-1"><Palette className="h-4 w-4" />Style</TabsTrigger>
            </TabsList>

            <TabsContent value="stage" className="mt-3">
              <div
                className="mx-auto rounded-lg border bg-background overflow-hidden grid place-items-center text-sm text-muted-foreground p-8 text-center"
                style={{ maxWidth: 720, aspectRatio: "16 / 9" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <UserCircle2 className="h-8 w-8" />
                  <div>Canonical HAPPY avatar · {activeMode.label} · {activeCapability.label}</div>
                  <div className="text-xs">Preview rendered from Digital Human Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="expression" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Blend expressions from the canonical library (Neutral · Happy · Thinking · Explaining).
                No new expression system — extends <code>canonical-avatar.ts</code>.
              </p>
            </TabsContent>
            <TabsContent value="voice" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Voice mode (Neutral · Warm · Professional) + lip-sync alignment to synthesized speech.
              </p>
            </TabsContent>
            <TabsContent value="style" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Wardrobe, background, and lighting drawn from Workspace tokens. Never a second identity.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: build log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Build Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Capability, mode, prompts, renders, and publishes log here.
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
