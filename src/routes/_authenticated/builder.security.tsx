/**
 * /builder/security — HAPPY Security Center™ (R233)
 *
 * Thin presentation shell. STRICT REUSE:
 *   • HappyUniversalPromptBar  — canonical AI composer
 *   • HappyUniversalActionBar  — canonical action bar
 *   • Quality / Publishing / Mission Control via composer + action bar.
 *
 * NO new runtime, NO new server-fn, NO new API, NO new component.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShieldCheck, UserCog, DatabaseZap, KeyRound, LockKeyhole,
  PackageSearch, Bug, ShieldAlert, TerminalSquare, Timer,
  FileCheck2, Play, Download, ScrollText, Sparkles,
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

export const Route = createFileRoute("/_authenticated/builder/security")({
  head: () => ({
    meta: [
      { title: "Security Center — HAPPY X" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SecurityCenterRoute,
});

type PresetId =
  | "rbac" | "rls" | "jwt" | "secrets" | "deps"
  | "xss" | "csrf" | "sqli" | "ratelimit" | "report";

const PRESETS: { id: PresetId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "rbac",      label: "RBAC Audit",           icon: <UserCog className="h-4 w-4" />,        hint: "Roles · permissions · privilege escalation paths." },
  { id: "rls",       label: "RLS Audit",            icon: <DatabaseZap className="h-4 w-4" />,    hint: "Row Level Security · policies · missing gates." },
  { id: "jwt",       label: "JWT Audit",            icon: <KeyRound className="h-4 w-4" />,       hint: "Signing · claims · expiry · rotation · bearer flow." },
  { id: "secrets",   label: "Secrets Audit",        icon: <LockKeyhole className="h-4 w-4" />,    hint: "Secret usage · exposure · rotation · least privilege." },
  { id: "deps",      label: "Dependency Scan",      icon: <PackageSearch className="h-4 w-4" />,  hint: "npm audit · known CVEs · high / critical severity." },
  { id: "xss",       label: "XSS Scan",             icon: <Bug className="h-4 w-4" />,            hint: "Unsafe HTML sinks · dangerouslySetInnerHTML · escape." },
  { id: "csrf",      label: "CSRF Scan",            icon: <ShieldAlert className="h-4 w-4" />,    hint: "State-changing requests · origin checks · tokens." },
  { id: "sqli",      label: "SQL Injection Scan",   icon: <TerminalSquare className="h-4 w-4" />, hint: "Raw SQL · unsafe interpolation · parameterization." },
  { id: "ratelimit", label: "Rate Limit Audit",     icon: <Timer className="h-4 w-4" />,          hint: "Public endpoints · auth flows · abuse surfaces." },
  { id: "report",    label: "Security Report",      icon: <FileCheck2 className="h-4 w-4" />,     hint: "Consolidated findings · severity · remediation." },
];

const INTRO: Record<PresetId, string> = {
  rbac:      "Describe the role / permission surface to audit.",
  rls:       "Describe the table or policy to audit for RLS.",
  jwt:       "Describe the JWT flow · claims · rotation to audit.",
  secrets:   "Describe the secret · scope · rotation to audit.",
  deps:      "Ask HAPPY to scan dependencies for known CVEs.",
  xss:       "Describe the route or component to scan for XSS sinks.",
  csrf:      "Describe the state-changing endpoint to CSRF-scan.",
  sqli:      "Describe the query or endpoint to scan for SQL injection.",
  ratelimit: "Describe the endpoint or flow to rate-limit-audit.",
  report:    "Ask HAPPY to consolidate a Security Report across all audits.",
};

interface LogLine { id: string; at: string; kind: "log" | "warn" | "err"; text: string }

function SecurityCenterRoute() {
  const [preset, setPreset] = React.useState<PresetId>("rbac");
  const [logs, setLogs]     = React.useState<LogLine[]>([]);

  const pushLog = React.useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), at: new Date().toLocaleTimeString(), kind, text },
      ...prev,
    ].slice(0, 400));
  }, []);

  const onSend = React.useCallback((p: HuppSendPayload) => {
    pushLog("log", `HAPPY · ${preset}: ${p.prompt.slice(0, 160)}`);
    toast.success(`HAPPY auditing ${preset}…`);
  }, [preset, pushLog]);

  const onAction    = React.useCallback((i: HuppActionIntent) => pushLog("log", `Prompt action · ${i}`), [pushLog]);
  const onBarAction = React.useCallback((e: UabActionEvent)   => pushLog("log", `Bar action · ${e.id}`), [pushLog]);

  const scan     = () => { pushLog("log", `Run ${preset} scan via Quality Runtime`);              toast.info(`Scanning ${preset}…`); };
  const remediate= () => { pushLog("log", `Remediate ${preset} via Quality Runtime`);             toast.info("Generating remediation…"); };
  const exportRpt= () => { pushLog("log", `Export ${preset} findings via Publishing Runtime`);    toast.info("Exporting findings…"); };
  const publish  = () => { pushLog("log", `Publish report → Approval → Audit → Mission Control`); toast.info("Publishing…"); };

  const active = PRESETS.find((p) => p.id === preset)!;

  return (
    <Container className="py-6 md:py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> HAPPY Security Center
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Audit RBAC, RLS, JWT, secrets, deps & top web risks
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every audit flows through the canonical pipeline —
            Quality → Approval → Audit → Publishing → Mission Control.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">{active.icon}{active.label}</Badge>
      </header>

      <Separator className="my-6" />

      <section aria-label="Security audit presets" className="flex flex-wrap gap-2">
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
            defaultSurface="code"
            placeholder={INTRO[preset]}
            onSend={onSend}
            onAction={onAction}
          />

          <HappyUniversalActionBar
            mode="creator"
            payload=""
            target={`security:${preset}`}
            onAction={onBarAction}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={scan}                          className="gap-1"><Play className="h-4 w-4" />Run Scan</Button>
            <Button size="sm" variant="outline"   onClick={remediate} className="gap-1"><Sparkles className="h-4 w-4" />Suggest Fix</Button>
            <Button size="sm" variant="outline"   onClick={exportRpt} className="gap-1"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="secondary" onClick={publish}   className="gap-1"><FileCheck2 className="h-4 w-4" />Publish Report</Button>
          </div>

          <Tabs defaultValue="findings" className="w-full">
            <TabsList>
              <TabsTrigger value="findings"   className="gap-1"><ShieldAlert className="h-4 w-4" />Findings</TabsTrigger>
              <TabsTrigger value="severity"   className="gap-1"><Bug className="h-4 w-4" />Severity</TabsTrigger>
              <TabsTrigger value="remediation"className="gap-1"><Sparkles className="h-4 w-4" />Remediation</TabsTrigger>
              <TabsTrigger value="report"     className="gap-1"><FileCheck2 className="h-4 w-4" />Report</TabsTrigger>
            </TabsList>

            <TabsContent value="findings" className="mt-3">
              <div className="rounded-lg border bg-background p-6 grid place-items-center text-sm text-muted-foreground text-center min-h-[280px]">
                <div className="flex flex-col items-center gap-2">
                  {active.icon}
                  <div>{active.label} · findings render here from Quality Runtime.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="severity" className="mt-3">
              <p className="text-sm text-muted-foreground">Critical · High · Medium · Low · Info · mirrored to Mission Control.</p>
            </TabsContent>
            <TabsContent value="remediation" className="mt-3">
              <p className="text-sm text-muted-foreground">HAPPY proposes minimal, canonical fixes — reviewed via Approval.</p>
            </TabsContent>
            <TabsContent value="report" className="mt-3">
              <p className="text-sm text-muted-foreground">Consolidated Security Report · exportable · published to Mission Control.</p>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right: log */}
        <aside className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ScrollText className="h-4 w-4" /> Security Log
          </div>
          <ScrollArea className="h-[560px] rounded-md border bg-muted/20">
            <ul className="p-2 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <li className="text-muted-foreground p-2">
                  Preset changes, scans, remediations, exports, and publishes log here.
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
