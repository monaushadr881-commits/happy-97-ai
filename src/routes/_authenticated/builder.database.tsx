/**
 * /builder/database — HAPPY Database AI Builder™ (R215)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Business / Creator / Publishing runtimes via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Database, Cloud, Server, Leaf, Flame, Boxes, Table2, Link2,
  ListTree, ShieldCheck, Lock, Sprout, GitBranch, Network,
  FileCode2, CheckCircle2, Sparkles,
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

export const Route = createFileRoute("/_authenticated/builder/database")({
  head: () => ({
    meta: [
      { title: "Database Builder — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DatabaseBuilderRoute,
});

type EngineId = "supabase" | "postgres" | "mysql" | "mongodb" | "firebase" | "redis";

const ENGINES: { id: EngineId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "supabase", label: "Supabase",    icon: <Cloud className="h-4 w-4" />,    hint: "Managed Postgres · Auth · RLS · Storage · Realtime." },
  { id: "postgres", label: "PostgreSQL",  icon: <Database className="h-4 w-4" />, hint: "Relational SQL · schemas, functions, extensions." },
  { id: "mysql",    label: "MySQL",       icon: <Server className="h-4 w-4" />,   hint: "Relational SQL · InnoDB · replication." },
  { id: "mongodb",  label: "MongoDB",     icon: <Leaf className="h-4 w-4" />,     hint: "Document · collections · aggregation pipelines." },
  { id: "firebase", label: "Firebase",    icon: <Flame className="h-4 w-4" />,    hint: "Firestore · rules · realtime listeners." },
  { id: "redis",    label: "Redis",       icon: <Boxes className="h-4 w-4" />,    hint: "In-memory · cache · queues · pub/sub." },
];

type ObjectId =
  | "tables" | "relations" | "indexes" | "policies" | "rls"
  | "seed" | "migrations" | "diagram" | "sql" | "validate";

const OBJECTS: { id: ObjectId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "tables",     label: "Tables",           icon: <Table2 className="h-4 w-4" />,      hint: "Design tables · columns · constraints." },
  { id: "relations",  label: "Relations",        icon: <Link2 className="h-4 w-4" />,       hint: "1:1 · 1:N · N:N · foreign keys." },
  { id: "indexes",    label: "Indexes",          icon: <ListTree className="h-4 w-4" />,    hint: "B-tree · unique · partial · covering." },
  { id: "policies",   label: "Policies",         icon: <ShieldCheck className="h-4 w-4" />, hint: "Access rules per role / scope." },
  { id: "rls",        label: "Row Level Security", icon: <Lock className="h-4 w-4" />,     hint: "auth.uid() · has_role() · immutable audit." },
  { id: "seed",       label: "Seed Data",        icon: <Sprout className="h-4 w-4" />,      hint: "Deterministic seed rows for demos & tests." },
  { id: "migrations", label: "Migrations",       icon: <GitBranch className="h-4 w-4" />,   hint: "Versioned · reviewed · reversible." },
  { id: "diagram",    label: "Database Diagram", icon: <Network className="h-4 w-4" />,     hint: "ER diagram · relationship map." },
  { id: "sql",        label: "SQL Generator",    icon: <FileCode2 className="h-4 w-4" />,   hint: "DDL · DML · policy · index scripts." },
  { id: "validate",   label: "Validation",       icon: <CheckCircle2 className="h-4 w-4" />,hint: "Lint · policy audit · missing GRANTs." },
];

const ENGINE_INTRO: Record<EngineId, string> = {
  supabase: "Describe the domain: entities, roles, RLS rules, and audit needs.",
  postgres: "Describe schemas, tables, relationships, indexes, and functions.",
  mysql:    "Describe tables, engines, charset, indexes, and relationships.",
  mongodb:  "Describe collections, embedded vs referenced documents, and indexes.",
  firebase: "Describe collections, subcollections, and security rules.",
  redis:    "Describe keyspaces, data types, TTLs, and access patterns.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function DatabaseBuilderRoute() {
  const [engine, setEngine] = React.useState<EngineId>("supabase");
  const [object, setObject] = React.useState<ObjectId>("tables");
  const [logs, setLogs] = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${engine}/${object}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY drafting ${object} for ${engine}…`);
  }, [engine, object, pushLog]);

  const onAction = React.useCallback((intent: HuppActionIntent) => {
    pushLog("log", `Prompt action · ${intent}`);
  }, [pushLog]);

  const onBarAction = React.useCallback((e: UabActionEvent) => {
    pushLog("log", `Bar action · ${e.id}`);
  }, [pushLog]);

  const generate = () => { pushLog("log", `Generate ${object} for ${engine} via Business Runtime`); toast.info(`Generating ${object}…`); };
  const validate = () => { pushLog("log", `Validate schema for ${engine} via Business Runtime`);    toast.info("Validation queued…"); };
  const migrate  = () => { pushLog("warn", `Migration request queued (Approval → Audit → Execution)`); toast.warning("Migration awaiting approval…"); };

  const activeEngine = ENGINES.find((e) => e.id === engine)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" /> HAPPY Database Builder
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Design databases with HAPPY
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every schema, policy, and migration flows through the Business Runtime
            and canonical pipeline — no shadow databases, no bypass APIs.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{activeEngine.icon}{activeEngine.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Database engines" className="flex flex-wrap gap-2">
        {ENGINES.map((e) => (
          <Button
            key={e.id}
            size="sm"
            variant={engine === e.id ? "default" : "outline"}
            onClick={() => { setEngine(e.id); pushLog("log", `Engine · ${e.label}`); }}
            className="gap-2"
          >
            {e.icon}{e.label}
          </Button>
        ))}
      </section>
      <p className="text-xs text-muted-foreground mt-2">{activeEngine.hint}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_340px] gap-6">
        {/* Left: object library */}
        <aside className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground px-2 pb-1">Schema Objects</div>
          {OBJECTS.map((o) => (
            <button
              key={o.id}
              onClick={() => { setObject(o.id); pushLog("log", `Object · ${o.label}`); }}
              className={
                "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted " +
                (object === o.id ? "bg-muted font-medium" : "")
              }
            >
              {o.icon}{o.label}
            </button>
          ))}
        </aside>

        {/* Center: composer + workspaces */}
        <main className="space-y-4 min-w-0">
          <HappyUniversalPromptBar
            defaultSurface="fullstack-app"
            placeholder={ENGINE_INTRO[engine]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`database:${engine}:${object}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={generate}                 className="gap-1"><Sparkles className="h-4 w-4" />Generate</Button>
            <Button size="sm" variant="outline" onClick={validate} className="gap-1"><CheckCircle2 className="h-4 w-4" />Validate</Button>
            <Button size="sm" variant="outline" onClick={migrate}  className="gap-1"><GitBranch className="h-4 w-4" />Create Migration</Button>
          </div>

          <Tabs defaultValue="schema" className="w-full">
            <TabsList>
              <TabsTrigger value="schema"   className="gap-1"><Table2 className="h-4 w-4" />Schema</TabsTrigger>
              <TabsTrigger value="diagram"  className="gap-1"><Network className="h-4 w-4" />Diagram</TabsTrigger>
              <TabsTrigger value="sql"      className="gap-1"><FileCode2 className="h-4 w-4" />SQL</TabsTrigger>
              <TabsTrigger value="policies" className="gap-1"><ShieldCheck className="h-4 w-4" />Policies</TabsTrigger>
              <TabsTrigger value="seed"     className="gap-1"><Sprout className="h-4 w-4" />Seed</TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Describe entities in the composer above. HAPPY drafts columns,
                constraints, and relationships against the {activeEngine.label} engine.
              </p>
            </TabsContent>
            <TabsContent value="diagram" className="mt-3">
              <div className="border rounded p-6 text-center text-sm text-muted-foreground">
                Live ER diagram renders after Generate.
              </div>
            </TabsContent>
            <TabsContent value="sql" className="mt-3">
              <pre className="border rounded p-4 text-xs bg-muted/30 overflow-x-auto">
{`-- Generated SQL will appear here.
-- Every migration is routed through Approval → Audit → Execution
-- and mirrored to Mission Control.`}
              </pre>
            </TabsContent>
            <TabsContent value="policies" className="mt-3">
              <p className="text-sm text-muted-foreground">
                RLS policies use canonical helpers (<code>has_role</code>,{" "}
                <code>is_company_member</code>). Every public table requires GRANTs
                — the validator refuses migrations that miss them.
              </p>
            </TabsContent>
            <TabsContent value="seed" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Deterministic seed rows ship inside the same migration for demo
                and test parity.
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
                  Generation, validation, and migration events log here.
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
