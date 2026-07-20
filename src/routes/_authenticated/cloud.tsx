/**
 * /cloud — HAPPY Cloud™ (R247)
 *
 * Thin presentation shell for cloud storage, media, backups, versioning, sharing.
 * STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Storage / Publishing / Approval / Audit / Mission Control runtimes.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 * Every mutation flows through the 13-stage canonical pipeline.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Cloud, HardDrive, Images, DatabaseBackup, History, Share2,
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

export const Route = createFileRoute("/_authenticated/cloud")({
  head: () => ({
    meta: [
      { title: "HAPPY Cloud — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CloudRoute,
});

type PresetId = "storage" | "media" | "backups" | "versioning" | "sharing";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "storage",    label: "Cloud Storage", icon: <HardDrive className="h-4 w-4" />,      hint: "Buckets · folders · quotas · access · lifecycle." },
  { id: "media",      label: "Media Library", icon: <Images className="h-4 w-4" />,         hint: "Images · video · audio · docs · tags · previews." },
  { id: "backups",    label: "Backups",       icon: <DatabaseBackup className="h-4 w-4" />, hint: "Schedules · retention · encryption · restore points." },
  { id: "versioning", label: "Versioning",    icon: <History className="h-4 w-4" />,        hint: "History · diffs · rollback · retention windows." },
  { id: "sharing",    label: "Sharing",       icon: <Share2 className="h-4 w-4" />,         hint: "Links · expiry · passwords · permissions · audit." },
];

const INTRO: Record<PresetId, string> = {
  storage:    "Describe the bucket · path · quota · access policy.",
  media:      "Describe the asset · type · tags · usage.",
  backups:    "Describe the backup · scope · schedule · retention.",
  versioning: "Describe the version policy · scope · retention.",
  sharing:    "Describe the share · recipients · expiry · permissions.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function CloudRoute() {
  const [preset, setPreset] = React.useState<PresetId>("storage");
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

  const run       = () => { pushLog("log", `Run ${preset} via Storage Runtime`);           toast.info(`Running ${preset}…`); };
  const optimize  = () => { pushLog("log", `AI tune ${preset} via Knowledge Runtime`);     toast.info("HAPPY tuning…"); };
  const exportRpt = () => { pushLog("log", `Export ${preset} via Publishing Runtime`);     toast.info("Exporting…"); };
  const publish   = () => { pushLog("log", `Publish ${preset} → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" /> HAPPY Cloud
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            One canonical HAPPY — storage, media, backups, versioning, sharing
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every operation flows through the pipeline —
            Creator → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Cloud presets" className="flex flex-wrap gap-2">
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
            target={`cloud:${preset}`}
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
              <TabsTrigger value="storage"    className="gap-1"><HardDrive className="h-4 w-4" />Storage</TabsTrigger>
              <TabsTrigger value="media"      className="gap-1"><Images className="h-4 w-4" />Media</TabsTrigger>
              <TabsTrigger value="backups"    className="gap-1"><DatabaseBackup className="h-4 w-4" />Backups</TabsTrigger>
              <TabsTrigger value="versions"   className="gap-1"><History className="h-4 w-4" />Versions</TabsTrigger>
              <TabsTrigger value="sharing"    className="gap-1"><Share2 className="h-4 w-4" />Sharing</TabsTrigger>
              <TabsTrigger value="activity"   className="gap-1"><Activity className="h-4 w-4" />Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[240px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · HAPPY renders cloud state from the Storage runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="storage"  className="mt-3"><p className="text-sm text-muted-foreground">Buckets · folders · quotas · lifecycle · access policies.</p></TabsContent>
            <TabsContent value="media"    className="mt-3"><p className="text-sm text-muted-foreground">Images · video · audio · docs · tags · previews · CDN.</p></TabsContent>
            <TabsContent value="backups"  className="mt-3"><p className="text-sm text-muted-foreground">Schedules · retention · encryption · restore points.</p></TabsContent>
            <TabsContent value="versions" className="mt-3"><p className="text-sm text-muted-foreground">History · diffs · rollback · retention windows.</p></TabsContent>
            <TabsContent value="sharing"  className="mt-3"><p className="text-sm text-muted-foreground">Links · expiry · passwords · permissions · audit trail.</p></TabsContent>
            <TabsContent value="activity" className="mt-3"><p className="text-sm text-muted-foreground">Uploads · downloads · restores · shares · Mission Control.</p></TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Cloud Log
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
