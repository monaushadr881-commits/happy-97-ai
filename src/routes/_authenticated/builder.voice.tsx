/**
 * /builder/voice — HAPPY Voice Builder™ (R222)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "voice")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Mic, BookOpen, Radio, Bot, Languages, Captions,
  Waves, Volume2, Sparkles, Download, FileCheck2, AudioLines, Music,
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

export const Route = createFileRoute("/_authenticated/builder/voice")({
  head: () => ({
    meta: [
      { title: "Voice Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VoiceBuilderRoute,
});

type PresetId =
  | "voice-clone" | "narration" | "podcast" | "ai-voice"
  | "dubbing" | "translation" | "lip-sync" | "speech";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "voice-clone", label: "Voice Clone",       icon: <Mic className="h-4 w-4" />,       hint: "Clone a reference voice · consent + sample required." },
  { id: "narration",   label: "Narration",         icon: <BookOpen className="h-4 w-4" />,  hint: "Long-form narration · chapters · pacing · pauses." },
  { id: "podcast",     label: "Podcast",           icon: <Radio className="h-4 w-4" />,     hint: "Podcast episode · intro · segments · outro." },
  { id: "ai-voice",    label: "AI Voice",          icon: <Bot className="h-4 w-4" />,       hint: "Synthetic HAPPY voice · tone · persona · pace." },
  { id: "dubbing",     label: "Dubbing",           icon: <Volume2 className="h-4 w-4" />,   hint: "Dub existing video/audio into a target voice." },
  { id: "translation", label: "Translation",       icon: <Languages className="h-4 w-4" />, hint: "Translate + speak in target language · preserve tone." },
  { id: "lip-sync",    label: "Lip Sync",          icon: <Captions className="h-4 w-4" />,  hint: "Sync generated speech to a talking avatar or video." },
  { id: "speech",      label: "Speech Generator",  icon: <AudioLines className="h-4 w-4" />,hint: "Speech / voiceover from a script · any voice." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  "voice-clone": "Describe the target voice and paste consent statement.",
  narration:     "Paste the script or chapter to narrate.",
  podcast:       "Describe episode topic, hosts, and structure.",
  "ai-voice":    "Describe the persona, tone, and sample line.",
  dubbing:       "Describe source clip and target voice/language.",
  translation:   "Paste text and target language.",
  "lip-sync":    "Describe script and target avatar/video reference.",
  speech:        "Paste the script for the voiceover.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function VoiceBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("narration");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY synthesizing ${preset}…`);
  }, [preset, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate   = () => { pushLog("log", `Generate ${preset} via Creator Runtime`); toast.info(`Generating ${preset}…`); };
  const exportMp3  = () => { pushLog("log", `Export ${preset} → MP3 via Publishing Runtime`); toast.info("Exporting MP3…"); };
  const exportWav  = () => { pushLog("log", `Export ${preset} → WAV via Publishing Runtime`); toast.info("Exporting WAV…"); };
  const publish    = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="h-4 w-4" /> HAPPY Voice Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate voice & speech with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every render flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Voice presets" className="flex flex-wrap gap-2">
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
      <p className="text-xs text-muted-foreground mt-2">{activePreset.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="voice"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`voice:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                       className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline"   onClick={exportMp3}  className="gap-1"><Download className="h-4 w-4" />Export MP3</Button>
            <Button size="sm" variant="outline"   onClick={exportWav}  className="gap-1"><Download className="h-4 w-4" />Export WAV</Button>
            <Button size="sm" variant="secondary" onClick={publish}    className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"  className="gap-1"><Waves className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="voice"    className="gap-1"><Bot className="h-4 w-4" />Voice</TabsTrigger>
              <TabsTrigger value="script"   className="gap-1"><BookOpen className="h-4 w-4" />Script</TabsTrigger>
              <TabsTrigger value="mastering" className="gap-1"><Music className="h-4 w-4" />Mastering</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center">
                <div className="flex flex-col items-center gap-2">
                  <AudioLines className="h-6 w-6" />
                  <div>{activePreset.label} · waveform + playback rendered from Creator Runtime output.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="voice" className="mt-3">
              <p className="text-sm text-muted-foreground">Voice, persona, pace, and pitch controls.</p>
            </TabsContent>
            <TabsContent value="script" className="mt-3">
              <p className="text-sm text-muted-foreground">Script, chapters, pauses, and pronunciation hints.</p>
            </TabsContent>
            <TabsContent value="mastering" className="mt-3">
              <p className="text-sm text-muted-foreground">Loudness, denoise, EQ, and format presets.</p>
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
                  Preset changes, generations, exports, and publishes log here.
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
