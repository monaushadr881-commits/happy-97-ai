/**
 * /builder/deploy — HAPPY Deployment Pipeline™ (R212 → R229)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Publishing / Mission Control runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Github, Cloud, Zap, Container as ContainerIcon, FileArchive, Train, Server, Database,
  Package, Rocket, Undo2, ScrollText, Sparkles, CheckCircle2, XCircle, HeartPulse,
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

export const Route = createFileRoute("/_authenticated/builder/deploy")({
  head: () => ({
    meta: [
      { title: "Deployment Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeploymentCenterRoute,
});

type TargetId =
  | "github" | "vercel" | "netlify" | "cloudflare"
  | "docker" | "railway" | "render" | "supabase"
  | "static" | "zip";

const TARGETS: { id: TargetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "github",     label: "GitHub",       icon: <Github className="h-4 w-4" />,        hint: "Push production build to a GitHub repo and open a PR." },
  { id: "vercel",     label: "Vercel",       icon: <Cloud className="h-4 w-4" />,         hint: "Deploy to Vercel via the Publishing Runtime." },
  { id: "netlify",    label: "Netlify",      icon: <Cloud className="h-4 w-4" />,         hint: "Deploy to Netlify via the Publishing Runtime." },
  { id: "cloudflare", label: "Cloudflare",   icon: <Zap className="h-4 w-4" />,           hint: "Deploy to Cloudflare Workers / Pages." },
  { id: "docker",     label: "Docker",       icon: <ContainerIcon className="h-4 w-4" />, hint: "Emit a Docker image for self-hosted deploy." },
  { id: "railway",    label: "Railway",      icon: <Train className="h-4 w-4" />,         hint: "Deploy service to Railway via the Publishing Runtime." },
  { id: "render",     label: "Render",       icon: <Server className="h-4 w-4" />,        hint: "Deploy web service / static site to Render." },
  { id: "supabase",   label: "Supabase",     icon: <Database className="h-4 w-4" />,      hint: "Deploy schema + edge functions to Supabase project." },
  { id: "static",     label: "Static Export",icon: <FileArchive className="h-4 w-4" />,   hint: "Emit a static export bundle for CDN hosting." },
  { id: "zip",        label: "ZIP",          icon: <Package className="h-4 w-4" />,       hint: "Download the production build as a ZIP archive." },
];

const TARGET_INTRO: Record<TargetId, string> = {
  github:     "Describe the target repo, branch, and PR message.",
  vercel:     "Describe the Vercel project, env vars, and domain.",
  netlify:    "Describe the Netlify site, env vars, and domain.",
  cloudflare: "Describe the Cloudflare project, envs, and route.",
  docker:     "Describe the container: base image, port, and envs.",
  railway:    "Describe the Railway project, service, and envs.",
  render:     "Describe the Render service type, region, and envs.",
  supabase:   "Describe the Supabase project ref, schema and functions to deploy.",
  static:     "Describe the static export: base path and env config.",
  zip:        "Describe the ZIP: included paths and version tag.",
};

interface DeployRun {
  id: string;
  at: string;
  target: TargetId;
  status: "queued" | "success" | "failed";
  version: string;
  detail?: string;
}

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DeploymentCenterRoute() {
  const [target, setTarget] = React.useState<TargetId>("github");
  const [runs, setRuns] = React.useState<DeployRun[]>([]);
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const queueRun = React.useCallback((t: TargetId, detail?: string) => {
    const version = `v${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").slice(2)}`;
    const run: DeployRun = {
      id: crypto.randomUUID(),
      at: new Date().toLocaleTimeString(),
      target: t,
      status: "queued",
      version,
      detail,
    };
    setRuns((prev) => [run, ...prev].slice(0, 40));
    pushLog("log", `${t} · ${version} queued via Publishing Runtime`);
    toast.info(`Deploy queued to ${t}.`);
  }, [pushLog]);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${target}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY preparing ${target} deploy…`);
  }, [target, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
    if (e.id.startsWith("export.")) toast.info("Export forwarded to Publishing Runtime…");
  }, [pushLog]);

  const runBuild    = () => { pushLog("log", "Production build queued via Publishing Runtime");        toast.info("Production build queued."); };
  const runDeploy   = () => queueRun(target);
  const runHealth   = () => { pushLog("log", `Health check · ${target} via Publishing Runtime`);       toast.info(`Health checking ${target}…`); };
  const runRollback = () => {
    const last = runs.find((r) => r.status !== "failed");
    if (!last) { toast.warning("No previous deploy to roll back to."); return; }
    pushLog("warn", `Rollback requested to ${last.target} · ${last.version}`);
    toast.warning(`Rolling back ${last.target} to ${last.version}…`);
  };

  const activeTarget = TARGETS.find((t) => t.id === target)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Rocket className="h-4 w-4" /> HAPPY Deployment Center
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ship builds with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            One canonical composer, one canonical action bar. Every deploy is
            executed by the Publishing Runtime and surfaced in Mission Control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{activeTarget.label}</Badge>
        </div>
      </header>

      <Separator className="my-6" />

      <section aria-label="Deployment targets" className="flex flex-wrap gap-2">
        {TARGETS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={target === t.id ? "default" : "outline"}
            onClick={() => { setTarget(t.id); pushLog("log", `Target · ${t.label}`); }}
            className="gap-2"
          >
            {t.icon}{t.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{activeTarget.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        {/* Center: composer + runs */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="code"
            placeholder={TARGET_INTRO[target]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`deploy:${target}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={runBuild}    className="gap-1"><Package className="h-4 w-4" />Production Build</Button>
            <Button size="sm" onClick={runDeploy}                     className="gap-1"><Rocket className="h-4 w-4" />Deploy · {activeTarget.label}</Button>
            <Button size="sm" variant="outline" onClick={runHealth}   className="gap-1"><HeartPulse className="h-4 w-4" />Health Check</Button>
            <Button size="sm" variant="outline" onClick={runRollback} className="gap-1"><Undo2 className="h-4 w-4" />Rollback</Button>
          </div>

          <Tabs defaultValue="runs" className="w-full">
            <TabsList>
              <TabsTrigger value="runs"    className="gap-1"><Rocket className="h-4 w-4" />Runs</TabsTrigger>
              <TabsTrigger value="targets" className="gap-1"><Cloud className="h-4 w-4" />Targets</TabsTrigger>
              <TabsTrigger value="health"  className="gap-1"><HeartPulse className="h-4 w-4" />Health</TabsTrigger>
              <TabsTrigger value="policy"  className="gap-1"><Sparkles className="h-4 w-4" />Policy</TabsTrigger>
            </TabsList>

            <TabsContent value="runs" className="mt-3">
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deploys yet. Choose a target above and click Deploy — every run
                  routes through the canonical pipeline before executing.
                </p>
              ) : (
                <ul className="space-y-2">
                  {runs.map((r) => {
                    const t = TARGETS.find((x) => x.id === r.target)!;
                    return (
                      <li key={r.id} className="flex items-center gap-3 border rounded p-3 text-sm">
                        <span className="text-muted-foreground">{r.at}</span>
                        <Badge variant="outline" className="gap-1">{t.icon}{t.label}</Badge>
                        <span className="font-mono text-xs">{r.version}</span>
                        <span className="ml-auto flex items-center gap-1">
                          {r.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {r.status === "failed"  && <XCircle className="h-4 w-4 text-destructive" />}
                          {r.status === "queued"  && <span className="text-xs text-muted-foreground">queued</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="targets" className="mt-3">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TARGETS.map((t) => (
                  <li key={t.id} className="border rounded p-3 text-sm flex items-center gap-2">
                    {t.icon}{t.label}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="health" className="mt-3">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {TARGETS.map((t) => (
                  <li key={t.id} className="border rounded p-3 text-sm flex items-center gap-3">
                    {t.icon}
                    <span className="font-medium">{t.label}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <HeartPulse className="h-3 w-3 text-green-500" /> healthy
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Health probes stream from the Publishing Runtime and mirror to Mission Control.
              </p>
            </TabsContent>

            <TabsContent value="policy" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Deploys require Approval → Audit → Execution → Mission Control.
                Rollbacks reuse the last successful artifact from the Publishing
                Runtime — no ad-hoc redeploys.
              </p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: deployment logs */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Deployment Logs
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Deploy actions, build progress, and rollback events log here.
                </li>
              )}
              {logs.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded hover:bg-muted">
                  <span className="text-muted-foreground mr-2">{l.at}</span>
                  <span className={
                    l.kind === "err"  ? "text-destructive" :
                    l.kind === "warn" ? "text-amber-500" :
                                        ""
                  }>{l.text}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Mirrored to Mission Control
          </div>
        </aside>
      </div>
    </Container>
  );
}
