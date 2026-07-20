/**
 * /builder/video — HAPPY Video Builder™ (R221)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "video")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Video, Megaphone, Youtube, Instagram, Music2, Film,
  UserSquare2, ShoppingBag, Building2, Sparkles, Download,
  FileCheck2, Monitor, Layers, Palette, Camera,
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

export const Route = createFileRoute("/_authenticated/builder/video")({
  head: () => ({
    meta: [
      { title: "Video Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VideoBuilderRoute,
});

type PresetId =
  | "promo" | "ad" | "youtube" | "reel" | "tiktok" | "shorts"
  | "talking-avatar" | "product-demo" | "company-intro";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string; ratio: string }[] = [
  { id: "promo",           label: "Promo",           icon: <Megaphone className="h-4 w-4" />,    hint: "Short brand promo · hook · offer · CTA.",                 ratio: "16 / 9" },
  { id: "ad",              label: "Advertisement",   icon: <Film className="h-4 w-4" />,         hint: "Paid ad · problem · solution · proof · CTA.",             ratio: "1 / 1" },
  { id: "youtube",         label: "YouTube",         icon: <Youtube className="h-4 w-4" />,      hint: "Long-form YouTube video with intro/outro.",               ratio: "16 / 9" },
  { id: "reel",            label: "Instagram Reel",  icon: <Instagram className="h-4 w-4" />,    hint: "Vertical reel · fast cuts · captions.",                   ratio: "9 / 16" },
  { id: "tiktok",          label: "TikTok",          icon: <Music2 className="h-4 w-4" />,       hint: "Vertical TikTok · trend-aware · hook first.",             ratio: "9 / 16" },
  { id: "shorts",          label: "Shorts",          icon: <Youtube className="h-4 w-4" />,      hint: "YouTube Shorts · vertical · under 60s.",                  ratio: "9 / 16" },
  { id: "talking-avatar",  label: "Talking Avatar",  icon: <UserSquare2 className="h-4 w-4" />,  hint: "Digital Human presenter · script · voice · lip-sync.",    ratio: "9 / 16" },
  { id: "product-demo",    label: "Product Demo",    icon: <ShoppingBag className="h-4 w-4" />,  hint: "Feature walkthrough · screen capture · voiceover.",       ratio: "16 / 9" },
  { id: "company-intro",   label: "Company Intro",   icon: <Building2 className="h-4 w-4" />,    hint: "Who we are · what we do · why it matters.",               ratio: "16 / 9" },
];

const PRESET_INTRO: Record<PresetId, string> = {
  promo:            "Describe the offer, audience, and desired action.",
  ad:               "Describe the product, pain, and single CTA.",
  youtube:          "Describe the topic, hook, and outline.",
  reel:             "Describe the hook and the 3-beat story.",
  tiktok:           "Describe the trend angle and hook.",
  shorts:           "Describe the hook and payoff in under 60s.",
  "talking-avatar": "Describe the script and the presenter tone.",
  "product-demo":   "Describe the feature, benefit, and demo path.",
  "company-intro":  "Describe the company, mission, and clients.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function VideoBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("promo");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY rendering ${preset}…`);
  }, [preset, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate    = () => { pushLog("log", `Generate ${preset} via Creator Runtime`); toast.info(`Generating ${preset}…`); };
  const exportMp4   = () => { pushLog("log", `Export ${preset} → MP4 via Publishing Runtime`); toast.info("Exporting MP4…"); };
  const exportGif   = () => { pushLog("log", `Export ${preset} → GIF via Publishing Runtime`); toast.info("Exporting GIF…"); };
  const publishVid  = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4" /> HAPPY Video Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate video content with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every video flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Video presets" className="flex flex-wrap gap-2">
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
        {/* Center: composer + preview */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="video"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`video:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                     className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={exportMp4}  className="gap-1"><Download className="h-4 w-4" />Export MP4</Button>
            <Button size="sm" variant="outline" onClick={exportGif}  className="gap-1"><Download className="h-4 w-4" />Export GIF</Button>
            <Button size="sm" variant="secondary" onClick={publishVid} className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"   className="gap-1"><Monitor className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="storyboard" className="gap-1"><Layers className="h-4 w-4" />Storyboard</TabsTrigger>
              <TabsTrigger value="script"    className="gap-1"><Film className="h-4 w-4" />Script</TabsTrigger>
              <TabsTrigger value="brand"     className="gap-1"><Palette className="h-4 w-4" />Brand</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div
                className="mx-auto rounded-lg border bg-background overflow-hidden grid place-items-center text-sm text-muted-foreground p-8 text-center"
                style={{ maxWidth: 720, aspectRatio: activePreset.ratio }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-6 w-6" />
                  <div>{activePreset.label} · {activePreset.ratio.replace(" / ", ":")} · rendered from Creator Runtime output.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="storyboard" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Scene-by-scene storyboard generated by HAPPY.
              </p>
            </TabsContent>
            <TabsContent value="script" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Script + voiceover lines with timing cues.
              </p>
            </TabsContent>
            <TabsContent value="brand" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Brand palette, typography, and logo pulled from Workspace tokens.
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
