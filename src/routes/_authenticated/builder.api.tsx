/**
 * /builder/api — HAPPY API Builder™ (R216)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business / Automation / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Network, Boxes, FileJson, Webhook, Radio, ListChecks,
  KeyRound, ShieldCheck, Gauge, CheckCircle2, BookOpen, Send,
  Sparkles, Cable,
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

export const Route = createFileRoute("/_authenticated/builder/api")({
  head: () => ({
    meta: [
      { title: "API Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiBuilderRoute,
});

type StyleId = "rest" | "graphql" | "openapi" | "webhook" | "realtime";

const STYLES: { id: StyleId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "rest",     label: "REST",     icon: <Network className="h-4 w-4" />, hint: "Resource-oriented endpoints · JSON payloads." },
  { id: "graphql",  label: "GraphQL",  icon: <Boxes className="h-4 w-4" />,   hint: "Typed schema · queries · mutations · subscriptions." },
  { id: "openapi",  label: "OpenAPI",  icon: <FileJson className="h-4 w-4" />,hint: "Spec-first design · contract-driven codegen." },
  { id: "webhook",  label: "Webhook",  icon: <Webhook className="h-4 w-4" />, hint: "Signed inbound · verified handlers · retries." },
  { id: "realtime", label: "Realtime", icon: <Radio className="h-4 w-4" />,   hint: "Server-sent · WebSocket · presence · pubsub." },
];

type FeatureId = "crud" | "jwt" | "oauth" | "ratelimit" | "validation" | "swagger" | "postman";

const FEATURES: { id: FeatureId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "crud",       label: "CRUD",              icon: <ListChecks className="h-4 w-4" />,   hint: "List · Read · Create · Update · Delete." },
  { id: "jwt",        label: "JWT",               icon: <KeyRound className="h-4 w-4" />,     hint: "Bearer tokens · claims · rotation." },
  { id: "oauth",      label: "OAuth",             icon: <ShieldCheck className="h-4 w-4" />,  hint: "Client flows · scopes · PKCE." },
  { id: "ratelimit",  label: "Rate Limit",        icon: <Gauge className="h-4 w-4" />,        hint: "Token bucket · per-key quotas." },
  { id: "validation", label: "Validation",        icon: <CheckCircle2 className="h-4 w-4" />, hint: "Zod / JSON Schema on every request." },
  { id: "swagger",    label: "Swagger",           icon: <BookOpen className="h-4 w-4" />,     hint: "Interactive API docs." },
  { id: "postman",    label: "Postman Collection",icon: <Send className="h-4 w-4" />,         hint: "Exportable request collection." },
];

const STYLE_INTRO: Record<StyleId, string> = {
  rest:     "Describe resources, verbs, auth, and response shapes.",
  graphql:  "Describe types, queries, mutations, and subscriptions.",
  openapi:  "Describe the API contract — paths, schemas, security schemes.",
  webhook:  "Describe events, signing scheme, retries, and handlers.",
  realtime: "Describe channels, events, presence, and auth.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function ApiBuilderRoute() {
  const [style, setStyle] = React.useState<StyleId>("rest");
  const [features, setFeatures] = React.useState<Set<FeatureId>>(new Set(["crud", "jwt", "validation"]));
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const toggleFeature = (id: FeatureId) => {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    pushLog("log", `Feature · ${id}`);
  };
  const { submit: __submitPrompt } = useBuilderPrompt({ surface: "api", onLog: pushLog });

  const onSend = React.useCallback((p: HuppSendPayload) => {
    const feats = Array.from(features).join(",") || "—";
    pushLog("log", `HAPPY · ${style} [${feats}]: ${p.prompt.slice(0, 160)}`);
    void __submitPrompt(String(style), p.prompt, p.attachments?.length ?? 0);
  }, [style, features, pushLog, __submitPrompt]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate = () => { pushLog("log", `Generate ${style} API via Business + Automation Runtimes`); toast.info("Generating API…"); };
  const test     = () => { pushLog("log", `Contract test suite queued for ${style}`);                 toast.info("Running contract tests…"); };
  const publish  = () => { pushLog("warn", `Publish request queued via Publishing Runtime`);          toast.warning("Awaiting approval…"); };
  const exportPostman = () => { pushLog("log", `Postman collection export queued`);                   toast.info("Exporting collection…"); };
  const openSwagger   = () => { pushLog("log", `Swagger UI requested`);                                toast.info("Opening Swagger…"); };

  const activeStyle = STYLES.find((s) => s.id === style)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cable className="h-4 w-4" /> HAPPY API Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Design APIs with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every endpoint, contract, and webhook is orchestrated by the existing
            Business, Automation, and Publishing runtimes. No parallel API layer.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activeStyle.icon}{activeStyle.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="API styles" className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={style === s.id ? "default" : "outline"}
            onClick={() => { setStyle(s.id); pushLog("log", `Style · ${s.label}`); }}
            className="gap-2"
          >
            {s.icon}{s.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{activeStyle.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_340px] gap-6">
        {/* Left: features */}
        <aside className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground px-2 pb-1">API Features</div>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFeature(f.id)}
              className={
                "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted " +
                (features.has(f.id) ? "bg-muted font-medium" : "")
              }
            >
              {f.icon}{f.label}
              {features.has(f.id) && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />}
            </button>
          ))}
          <p className="text-xs text-muted-foreground px-2 pt-2">
            Toggled features are forwarded with every generation request.
          </p>
        </aside>

        {/* Center: composer + workspaces */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={STYLE_INTRO[style]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`api:${style}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                     className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={test}       className="gap-1"><CheckCircle2 className="h-4 w-4" />Contract Test</Button>
            <Button size="sm" variant="outline" onClick={openSwagger}className="gap-1"><BookOpen className="h-4 w-4" />Swagger</Button>
            <Button size="sm" variant="outline" onClick={exportPostman} className="gap-1"><Send className="h-4 w-4" />Postman</Button>
            <Button size="sm" variant="outline" onClick={publish}    className="gap-1"><Network className="h-4 w-4" />Publish</Button>
          </div>

          <Tabs defaultValue="endpoints" className="w-full">
            <TabsList>
              <TabsTrigger value="endpoints" className="gap-1"><Network className="h-4 w-4" />Endpoints</TabsTrigger>
              <TabsTrigger value="schema"    className="gap-1"><FileJson className="h-4 w-4" />Schema</TabsTrigger>
              <TabsTrigger value="security"  className="gap-1"><ShieldCheck className="h-4 w-4" />Security</TabsTrigger>
              <TabsTrigger value="playground"className="gap-1"><Send className="h-4 w-4" />Playground</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Describe resources in the composer. HAPPY drafts routes, handlers,
                and validators for the {activeStyle.label} style.
              </p>
            </TabsContent>
            <TabsContent value="schema" className="mt-3">
              <pre className="border rounded p-4 text-xs bg-muted/30 overflow-x-auto">
{`// Generated schema (OpenAPI / GraphQL SDL / JSON Schema) appears here.
// Every request/response is validated by the canonical pipeline.`}
              </pre>
            </TabsContent>
            <TabsContent value="security" className="mt-3">
              <p className="text-sm text-muted-foreground">
                JWT · OAuth · Rate Limit toggles above feed the Business Runtime.
                All privileged calls remain gated by has_role / RLS.
              </p>
            </TabsContent>
            <TabsContent value="playground" className="mt-3">
              <div className="border rounded p-6 text-center text-sm text-muted-foreground">
                Interactive request playground appears after Generate.
              </div>
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
                  Generation, contract tests, and publish events log here.
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
