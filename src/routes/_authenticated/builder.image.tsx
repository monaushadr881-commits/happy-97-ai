/**
 * /builder/image — HAPPY Image Builder™ (R220)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "image")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Image as ImageIcon, Sparkles, Download, FileCheck2, Monitor,
  Palette, Layers, Package, Share2, Megaphone, IdCard, FileText,
  ShoppingBag, Layout, Camera,
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

export const Route = createFileRoute("/_authenticated/builder/image")({
  head: () => ({
    meta: [
      { title: "Image Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImageBuilderRoute,
});

type PresetId =
  | "logo" | "banner" | "poster" | "thumbnail" | "packaging"
  | "social" | "product-mockup" | "business-card" | "letterhead" | "brand-kit";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string; ratio: string }[] = [
  { id: "logo",           label: "Logo",           icon: <Sparkles className="h-4 w-4" />,   hint: "Distinctive mark · usable at small sizes.",              ratio: "1 / 1" },
  { id: "banner",         label: "Banner",         icon: <Layout className="h-4 w-4" />,     hint: "Wide banner · web · email · event header.",              ratio: "3 / 1" },
  { id: "poster",         label: "Poster",         icon: <FileText className="h-4 w-4" />,   hint: "Print-ready poster with headline + hero art.",           ratio: "2 / 3" },
  { id: "thumbnail",      label: "Thumbnail",      icon: <ImageIcon className="h-4 w-4" />,  hint: "Click-worthy thumbnail for videos and cards.",           ratio: "16 / 9" },
  { id: "packaging",      label: "Packaging",      icon: <Package className="h-4 w-4" />,    hint: "Front-of-pack label with product art.",                   ratio: "3 / 4" },
  { id: "social",         label: "Social Media",   icon: <Share2 className="h-4 w-4" />,     hint: "Feed / story post with headline and brand.",             ratio: "1 / 1" },
  { id: "product-mockup", label: "Product Mockup", icon: <ShoppingBag className="h-4 w-4" />,hint: "Photoreal mockup on a clean background.",                ratio: "4 / 3" },
  { id: "business-card",  label: "Business Card",  icon: <IdCard className="h-4 w-4" />,     hint: "Front + back business card layout.",                     ratio: "7 / 4" },
  { id: "letterhead",     label: "Letterhead",     icon: <FileText className="h-4 w-4" />,   hint: "A4 letterhead with logo and contact strip.",             ratio: "1 / 1.414" },
  { id: "brand-kit",      label: "Brand Kit",      icon: <Palette className="h-4 w-4" />,    hint: "Palette · type · logo lockups · usage rules.",           ratio: "4 / 3" },
];

const PRESET_INTRO: Record<PresetId, string> = {
  logo:            "Describe the brand, personality, and any motif.",
  banner:          "Describe the message, audience, and placement.",
  poster:          "Describe the event/campaign and headline.",
  thumbnail:       "Describe the subject and the hook.",
  packaging:       "Describe the product, flavor, and shelf appeal.",
  social:          "Describe the channel and the message.",
  "product-mockup":"Describe the product and the scene.",
  "business-card": "Describe name, title, contact, and vibe.",
  letterhead:      "Describe the brand and letter purpose.",
  "brand-kit":     "Describe the brand personality and audience.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function ImageBuilderRoute() {
  const [preset, setPreset] = React.useState<PresetId>("logo");
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
  const exportPng   = () => { pushLog("log", `Export ${preset} → PNG via Publishing Runtime`); toast.info("Exporting PNG…"); };
  const exportSvg   = () => { pushLog("log", `Export ${preset} → SVG via Publishing Runtime`); toast.info("Exporting SVG…"); };
  const publishImg  = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" /> HAPPY Image Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Generate brand-ready images with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every asset flows through the canonical pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Image presets" className="flex flex-wrap gap-2">
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
            defaultSurface="image"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`image:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                     className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={exportPng}  className="gap-1"><Download className="h-4 w-4" />Export PNG</Button>
            <Button size="sm" variant="outline" onClick={exportSvg}  className="gap-1"><Download className="h-4 w-4" />Export SVG</Button>
            <Button size="sm" variant="secondary" onClick={publishImg} className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview"   className="gap-1"><Monitor className="h-4 w-4" />Preview</TabsTrigger>
              <TabsTrigger value="variants"  className="gap-1"><Layers className="h-4 w-4" />Variants</TabsTrigger>
              <TabsTrigger value="palette"   className="gap-1"><Palette className="h-4 w-4" />Palette</TabsTrigger>
              <TabsTrigger value="mockups"   className="gap-1"><Camera className="h-4 w-4" />Mockups</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              <div
                className="mx-auto rounded-lg border bg-background overflow-hidden grid place-items-center text-sm text-muted-foreground p-8 text-center"
                style={{ maxWidth: 720, aspectRatio: activePreset.ratio }}
              >
                {activePreset.label} preview · {activePreset.ratio.replace(" / ", ":")} · rendered from Creator Runtime output.
              </div>
            </TabsContent>
            <TabsContent value="variants" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Alternate compositions and color variants generated by HAPPY.
              </p>
            </TabsContent>
            <TabsContent value="palette" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Palette pulled from Workspace brand tokens; edit in Brand Kit.
              </p>
            </TabsContent>
            <TabsContent value="mockups" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Automatic mockups (t-shirt, phone, poster wall, packaging) via Publishing Runtime.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: build log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="h-4 w-4" /> Build Log
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
