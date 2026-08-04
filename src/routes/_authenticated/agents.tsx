/**
 * /agents — HAPPY AGENT WORKFORCE
 *
 * Founder console over the canonical Agent / Skill / Tool registries.
 * Extends `src/lib/happy-command/*`; reuses `HappyUniversalPromptBar` and
 * `HappyUniversalActionBar`. No second runtime, approval engine or audit log.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  workforceCatalog,
  resolveWorkforce,
  executeWorkforceTask,
  retryWorkforceTask,
  listWorkforceExecutions,
  setAgentCapability,
} from "@/lib/happy-command/workforce.functions";
import type { WorkforcePlan, WorkforceResolution } from "@/lib/happy-command/workforce-core";
import type { WorkforceExecution } from "@/lib/happy-command/workforce-resolve";
import type { HappyAgent } from "@/lib/happy-command/agent-roster";
import type { HappySkill } from "@/lib/happy-command/skill-registry";
import type { HappyTool } from "@/lib/happy-command/tool-registry";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({
    meta: [
      { title: "HAPPY Agent Workforce — agents, skills and tools" },
      {
        name: "description",
        content:
          "Inspect the HAPPY agent workforce: every agent, its skills, the tools it can execute, permission scope, risk level and approval state.",
      },
      { property: "og:title", content: "HAPPY Agent Workforce" },
      {
        property: "og:description",
        content: "Agent → Skill → Tool → Permission → Risk → Approval → Execution, in one Founder console.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentWorkforcePage,
});

function riskTone(risk: string) {
  if (risk === "critical" || risk === "high") return "destructive" as const;
  if (risk === "medium") return "secondary" as const;
  return "outline" as const;
}

function ResolutionRow({
  r,
  goal,
  busy,
  onRun,
  onRetry,
}: {
  r: WorkforceResolution;
  goal: string;
  busy: boolean;
  onRun: (r: WorkforceResolution, confirmed: boolean) => void;
  onRetry: (r: WorkforceResolution) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
      <span className="w-6 text-xs text-muted-foreground">{r.order}</span>
      <span className="font-medium">{r.task}</span>
      <Badge variant="secondary">{r.agentTitle}</Badge>
      <Badge variant="outline">{r.skillName}</Badge>
      <Badge variant={r.toolAvailability === "available" ? "outline" : "destructive"}>{r.toolName}</Badge>
      <Badge variant={riskTone(r.risk)}>{r.risk}</Badge>
      {r.status === "capability_unavailable" ? (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="h-3 w-3" /> CAPABILITY_UNAVAILABLE
        </Badge>
      ) : (
        <Badge variant={r.requiresApproval ? "destructive" : "outline"}>
          {r.requiresApproval ? "approval-gated" : "autonomous"}
        </Badge>
      )}
      <span className="ml-auto flex gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onRun(r, !r.requiresApproval)}>
          Run
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRetry(r)} title="Retry">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </span>
      <p className="w-full text-xs text-muted-foreground">
        {r.note} · scopes: {r.permissions.join(", ") || "none"} · owner: <code>{r.owner}</code> · goal:{" "}
        {goal.slice(0, 60)}
      </p>
    </li>
  );
}

function AgentWorkforcePage() {
  const runCatalog = useServerFn(workforceCatalog);
  const runResolve = useServerFn(resolveWorkforce);
  const runExecute = useServerFn(executeWorkforceTask);
  const runRetry = useServerFn(retryWorkforceTask);
  const runHistory = useServerFn(listWorkforceExecutions);
  const runToggle = useServerFn(setAgentCapability);

  const [busy, setBusy] = React.useState(false);
  const [agents, setAgents] = React.useState<readonly HappyAgent[]>([]);
  const [skills, setSkills] = React.useState<readonly HappySkill[]>([]);
  const [tools, setTools] = React.useState<readonly HappyTool[]>([]);
  const [summary, setSummary] = React.useState<{
    agents: number;
    skills: number;
    tools: number;
    toolsAvailable: number;
  } | null>(null);
  const [plan, setPlan] = React.useState<WorkforcePlan | null>(null);
  const [pending, setPending] = React.useState<WorkforceResolution | null>(null);
  const [history, setHistory] = React.useState<WorkforceExecution[]>([]);
  const [tab, setTab] = React.useState<"agents" | "skills" | "tools">("agents");

  const refresh = React.useCallback(async () => {
    try {
      const [c, h] = await Promise.all([runCatalog({}), runHistory({ data: { limit: 25 } })]);
      setAgents(c.agents);
      setSkills(c.skills);
      setTools(c.tools);
      setSummary(c.summary);
      setHistory(h.executions);
    } catch {
      /* best effort */
    }
  }, [runCatalog, runHistory]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSend = React.useCallback(
    async (payload: { prompt: string }) => {
      const text = payload.prompt.trim();
      if (!text) {
        toast.error("Describe the work first.");
        return;
      }
      setBusy(true);
      setPending(null);
      try {
        const p = await runResolve({ data: { goal: text } });
        setPlan(p);
        toast.success(`${p.resolutions.length} tasks resolved · ${p.intentLabel}`);
      } catch (e) {
        toast.error(`Could not resolve · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runResolve],
  );

  const run = React.useCallback(
    async (r: WorkforceResolution, confirmed: boolean) => {
      setBusy(true);
      try {
        const res = await runExecute({
          data: { task: r.task, agent: r.agentId ?? undefined, goal: plan?.goal ?? r.task, confirmed },
        });
        if (res.status === "awaiting_approval") {
          setPending(r);
          toast.warning(res.message);
        } else if (res.status === "capability_unavailable") {
          toast.error(res.message);
        } else if (res.status === "denied") {
          toast.error(res.message);
        } else {
          setPending(null);
          toast.success(res.message);
        }
        await refresh();
      } catch (e) {
        toast.error(`Execution failed · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runExecute, plan, refresh],
  );

  const retry = React.useCallback(
    async (r: WorkforceResolution) => {
      setBusy(true);
      try {
        await runRetry({ data: { task: r.task, agent: r.agentId ?? undefined } });
        toast.success("Retry recorded.");
        await refresh();
      } catch (e) {
        toast.error(`Retry failed · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runRetry, refresh],
  );

  const toggle = React.useCallback(
    async (agent: string, enabled: boolean) => {
      try {
        await runToggle({ data: { agent, enabled } });
        toast.success(`${agent} ${enabled ? "enabled" : "disabled"}.`);
        await refresh();
      } catch {
        toast.error("Founder/company-admin permission required.");
      }
    },
    [runToggle, refresh],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Agent Workforce</h1>
        <p className="text-sm text-muted-foreground">
          Command → Mission → Agent → Skill → Tool → Permission → Approval → Execution → Verification → Audit.
        </p>
      </header>

      {summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Agents", value: summary.agents },
            { label: "Skills", value: summary.skills },
            { label: "Tools", value: summary.tools },
            { label: "Tools wired", value: summary.toolsAvailable },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      ) : null}

      <section className="rounded-xl border bg-card p-3">
        <HappyUniversalPromptBar
          defaultSurface="chat"
          defaultMode="build"
          busy={busy}
          placeholder='e.g. "Create a website for my restaurant with online ordering."'
          draftKey="happy.agent-workforce"
          onSend={handleSend}
        />
      </section>

      {plan ? (
        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{plan.intentLabel}</Badge>
            <Badge variant={riskTone(plan.risk)}>{plan.risk} risk</Badge>
            <Badge variant="outline">{plan.resolutions.length} tasks</Badge>
            {plan.unavailable.length > 0 ? (
              <Badge variant="destructive">{plan.unavailable.length} unavailable capability</Badge>
            ) : null}
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>

          <ol className="space-y-2">
            {plan.resolutions.map((r) => (
              <ResolutionRow
                key={`${r.order}-${r.skillId}`}
                r={r}
                goal={plan.goal}
                busy={busy}
                onRun={run}
                onRetry={retry}
              />
            ))}
          </ol>

          {pending ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <span className="text-sm">
                {pending.risk.toUpperCase()} risk — {pending.agentTitle} needs approval for “{pending.skillName}”.
              </span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => void run(pending, true)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setPending(null)}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          ) : null}

          <HappyUniversalActionBar mode="mission-control" payload={plan} compact />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex gap-2">
          {(["agents", "skills", "tools"] as const).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
              {t}
            </Button>
          ))}
          <Link to="/command-center" className="ml-auto self-center text-xs underline text-muted-foreground">
            Command Center
          </Link>
          <Link to="/missions" className="self-center text-xs underline text-muted-foreground">
            Missions
          </Link>
        </div>

        {tab === "agents" ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {agents.map((a) => (
              <li key={a.id} className="rounded-xl border bg-card p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{a.title}</span>
                  <Badge variant={a.autonomous ? "outline" : "destructive"}>
                    {a.autonomous ? "autonomous" : "approval-gated"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => void toggle(a.id, !a.autonomous)}
                  >
                    {a.autonomous ? "Disable" : "Enable"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{a.mission}</p>
                <div className="flex flex-wrap gap-1">
                  {a.capabilities.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>
                <code className="block text-[10px] text-muted-foreground">{a.owner}</code>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "skills" ? (
          <ul className="divide-y rounded-xl border bg-card">
            {skills.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <Badge variant="outline">{k.category}</Badge>
                <span className="font-medium">{k.name}</span>
                <span className="text-xs text-muted-foreground">{k.description}</span>
                <Badge variant={riskTone(k.risk)} className="ml-auto">
                  {k.risk}
                </Badge>
                <Badge variant="secondary">{k.tool} tools</Badge>
                <code className="text-[10px] text-muted-foreground">{k.permissions.join(" ")}</code>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "tools" ? (
          <ul className="divide-y rounded-xl border bg-card">
            {tools.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <Badge variant="outline">{t.category}</Badge>
                <span className="font-medium">{t.name}</span>
                <code className="text-[10px] text-muted-foreground">
                  {t.input} → {t.output}
                </code>
                <Badge variant={riskTone(t.risk)} className="ml-auto">
                  {t.risk}
                </Badge>
                <Badge variant={t.availability === "available" ? "secondary" : "destructive"}>
                  {t.availability === "available" ? "wired" : "CAPABILITY_UNAVAILABLE"}
                </Badge>
                <code className="text-[10px] text-muted-foreground">{t.integration ?? "no integration"}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Execution audit</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workforce executions yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <Badge variant={h.action === "executed" ? "secondary" : "destructive"}>
                  {h.action.replace(/_/g, " ")}
                </Badge>
                <span className="truncate max-w-[32ch]">{h.task || "—"}</span>
                <Badge variant="outline">{h.agent}</Badge>
                <code className="text-[10px] text-muted-foreground">{h.skill ?? "—"}</code>
                <Badge variant={riskTone(h.risk)} className="ml-auto">
                  {h.risk}
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(h.occurredAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
