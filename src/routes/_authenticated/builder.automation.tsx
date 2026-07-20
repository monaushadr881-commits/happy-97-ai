/**
 * /builder/automation — HAPPY AI Automation Studio™ (R227)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer (surface: "automation")
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Automation Runtime + Approval + Audit + Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Workflow, Zap, GitBranch, PlayCircle, Mail, MessageCircle,
  Smartphone, Webhook, Clock, CalendarClock, ShieldCheck, ScrollText,
  Sparkles, Download, FileCheck2,
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

export const Route = createFileRoute("/_authenticated/builder/automation")({
  head: () => ({
    meta: [
      { title: "AI Automation Studio — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AutomationStudioRoute,
});

type PresetId =
  | "workflow" | "trigger" | "condition" | "action"
  | "email" | "whatsapp" | "sms" | "webhook"
  | "cron" | "scheduler" | "approval" | "logs";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "workflow",  label: "Workflow Builder", icon: <Workflow className="h-4 w-4" />,     hint: "Compose end-to-end workflows · triggers → conditions → actions." },
  { id: "trigger",   label: "Triggers",         icon: <Zap className="h-4 w-4" />,          hint: "Event · schedule · webhook · form · record change." },
  { id: "condition", label: "Conditions",       icon: <GitBranch className="h-4 w-4" />,    hint: "Branch on data · rules · filters · AI classification." },
  { id: "action",    label: "Actions",          icon: <PlayCircle className="h-4 w-4" />,   hint: "Do something · send · create · update · call API." },
  { id: "email",     label: "Email",            icon: <Mail className="h-4 w-4" />,         hint: "Send transactional email via canonical email runtime." },
  { id: "whatsapp",  label: "WhatsApp",         icon: <MessageCircle className="h-4 w-4" />,hint: "Send WhatsApp message via canonical channel runtime." },
  { id: "sms",       label: "SMS",              icon: <Smartphone className="h-4 w-4" />,   hint: "Send SMS via canonical channel runtime." },
  { id: "webhook",   label: "Webhook",          icon: <Webhook className="h-4 w-4" />,      hint: "POST payload to an external URL (signed)." },
  { id: "cron",      label: "Cron",             icon: <Clock className="h-4 w-4" />,        hint: "Cron expression · minute · hour · day · month · dow." },
  { id: "scheduler", label: "Scheduler",        icon: <CalendarClock className="h-4 w-4" />,hint: "Run once / recurring · timezone-aware." },
  { id: "approval",  label: "Approvals",        icon: <ShieldCheck className="h-4 w-4" />,  hint: "Gate steps with Founder / Executive approvals." },
  { id: "logs",      label: "Logs",             icon: <ScrollText className="h-4 w-4" />,   hint: "Runs · steps · status · retries · errors." },
];

const PRESET_INTRO: Record<PresetId, string> = {
  workflow:  "Describe the end-to-end workflow you want HAPPY to build.",
  trigger:   "Describe the trigger event / schedule / webhook.",
  condition: "Describe the branching rule or filter.",
  action:    "Describe what should happen when this step runs.",
  email:     "Describe recipient, template, and dynamic data.",
  whatsapp:  "Describe recipient number, template, and variables.",
  sms:       "Describe recipient number and message body.",
  webhook:   "Describe target URL, payload shape, and headers.",
  cron:      "Describe schedule in words · HAPPY writes the cron expression.",
  scheduler: "Describe when this should run · once or recurring.",
  approval:  "Describe who must approve and on what threshold.",
  logs:      "Ask about a run · filter by workflow / status / time.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function AutomationStudioRoute() {
  const [preset, setPreset] = React.useState<PresetId>("workflow");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY composing ${preset}…`);
  }, [preset, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const build     = () => { pushLog("log", `Build ${preset} via Automation Runtime`);         toast.info(`Building ${preset}…`); };
  const testRun   = () => { pushLog("log", `Test run · ${preset} · dry-run via Automation Runtime`); toast.info("Test running…"); };
  const exportDef = () => { pushLog("log", `Export ${preset} definition → JSON via Publishing Runtime`); toast.info("Exporting JSON…"); };
  const publish   = () => { pushLog("log", `Publish workflow → Approval → Audit → Mission Control`);   toast.info("Publishing…"); };

  const activePreset = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Workflow className="h-4 w-4" /> HAPPY AI Automation Studio
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Design workflows with triggers, conditions & actions
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every workflow flows through the canonical pipeline —
            Automation → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activePreset.icon}{activePreset.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Automation presets" className="flex flex-wrap gap-2">
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
            defaultSurface="automation"
            placeholder={PRESET_INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`automation:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={build}                        className="gap-1"><Sparkles className="h-4 w-4" />Build</Button>
            <Button size="sm" variant="outline"   onClick={testRun}  className="gap-1"><PlayCircle className="h-4 w-4" />Test Run</Button>
            <Button size="sm" variant="outline"   onClick={exportDef}className="gap-1"><Download className="h-4 w-4" />Export JSON</Button>
            <Button size="sm" variant="secondary" onClick={publish}  className="gap-1"><FileCheck2 className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="canvas" className="w-full">
            <TabsList>
              <TabsTrigger value="canvas"   className="gap-1"><Workflow className="h-4 w-4" />Canvas</TabsTrigger>
              <TabsTrigger value="triggers" className="gap-1"><Zap className="h-4 w-4" />Triggers</TabsTrigger>
              <TabsTrigger value="steps"    className="gap-1"><GitBranch className="h-4 w-4" />Steps</TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1"><CalendarClock className="h-4 w-4" />Schedule</TabsTrigger>
              <TabsTrigger value="runs"     className="gap-1"><ScrollText className="h-4 w-4" />Runs</TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center">
                <div className="flex flex-col items-center gap-2">
                  <Workflow className="h-6 w-6" />
                  <div>{activePreset.label} · workflow graph renders from Automation Runtime output — triggers → conditions → actions.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="triggers" className="mt-3">
              <p className="text-sm text-muted-foreground">Event · schedule · webhook · form · record change · manual.</p>
            </TabsContent>
            <TabsContent value="steps" className="mt-3">
              <p className="text-sm text-muted-foreground">Conditions, actions, approvals, and notifications for each branch.</p>
            </TabsContent>
            <TabsContent value="schedule" className="mt-3">
              <p className="text-sm text-muted-foreground">Cron expression, timezone, and next-run preview.</p>
            </TabsContent>
            <TabsContent value="runs" className="mt-3">
              <p className="text-sm text-muted-foreground">Run history · step-level status · retries · errors · mirrored to Mission Control.</p>
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
                  Preset changes, builds, test runs, exports, and publishes log here.
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
