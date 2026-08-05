/**
 * /command-center — HAPPY COMMAND CENTER
 *
 * The ONE natural-language command surface for the platform.
 * Extends `src/lib/happy-command/*` (Command Engine) and reuses the
 * canonical `HappyUniversalPromptBar` + `HappyUniversalActionBar`.
 * No second composer, no duplicate runtime, no duplicate approval engine.
 */
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity,
  BadgeDollarSign,
  Bot,
  Boxes,
  Braces,
  Building2,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  Gamepad2,
  Globe,
  LayoutDashboard,
  Loader2,
  MessagesSquare,
  Puzzle,
  Rocket,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Workflow,
  XCircle,
} from "lucide-react";
import { HappyUniversalPromptBar } from "@/components/happy/HappyUniversalPromptBar";
import { HappyUniversalActionBar } from "@/components/happy/HappyUniversalActionBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  submitCommand,
  planCommand,
  listCommands,
  cancelCommand,
  commandCenterOverview,
} from "@/lib/happy-command/command.functions";
import type { CommandPlan, CommandRecord } from "@/lib/happy-command/command-core";
import type { CommandCenterOverview } from "@/lib/happy-command/command-resolve";
import { resolveTask } from "@/lib/happy-command/workforce-core";
import {
  executeSkillTask,
  retrySkillTask,
  cancelSkillExecution,
  listSkillExecutions,
} from "@/lib/happy-command/execution.functions";
import type { ExecutionResult } from "@/lib/happy-command/execution-core";
import type { WorkforceExecution } from "@/lib/happy-command/workforce-resolve";

export const Route = createFileRoute("/_authenticated/command-center")({
  head: () => ({
    meta: [
      { title: "HAPPY Command Center — natural-language control" },
      {
        name: "description",
        content:
          "Give HAPPY a natural-language command. HAPPY detects intent, analyses requirements, plans, assigns agents, requests approval for high-impact work, and executes.",
      },
      { property: "og:title", content: "HAPPY Command Center" },
      {
        property: "og:description",
        content: "One command surface for apps, websites, agents, deployments, business and knowledge.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommandCenterPage,
});

type Tile = { label: string; to: string; icon: React.ComponentType<{ className?: string }> };

const SURFACES: Tile[] = [
  { label: "AI Assistant", to: "/assistant", icon: Sparkles },
  { label: "Projects", to: "/mission-control", icon: LayoutDashboard },
  { label: "Apps", to: "/builder/fullstack", icon: Boxes },
  { label: "Websites", to: "/builder/website", icon: Globe },
  { label: "Games", to: "/builder/ui", icon: Gamepad2 },
  { label: "Agents", to: "/builder/agents", icon: Bot },
  { label: "Tasks", to: "/mission-control", icon: CheckCircle2 },
  { label: "Workflows", to: "/builder/automation", icon: Workflow },
  { label: "Deployments", to: "/deployment", icon: Rocket },
  { label: "Databases", to: "/builder/database", icon: Database },
  { label: "APIs", to: "/builder/api", icon: Braces },
  { label: "Files", to: "/cloud-platform", icon: Cloud },
  { label: "Knowledge", to: "/knowledge", icon: FileText },
  { label: "Social & Comms", to: "/communication", icon: MessagesSquare },
  { label: "Business", to: "/business-os", icon: Building2 },
  { label: "Analytics", to: "/analytics-platform", icon: Activity },
  { label: "Billing", to: "/finance", icon: BadgeDollarSign },
  { label: "Marketplace", to: "/marketplace", icon: Store },
  { label: "Integrations", to: "/ecosystem", icon: Puzzle },
  { label: "Security", to: "/security-center", icon: Shield },
  { label: "Activity & Logs", to: "/mission-control", icon: ScrollText },
  { label: "Commerce", to: "/builder/ecommerce", icon: ShoppingBag },
  { label: "Publishing", to: "/cms", icon: Share2 },
  { label: "Settings", to: "/settings", icon: Settings },
];

function statusTone(status: string) {
  if (status === "SUCCESS") return "secondary" as const;
  if (status === "REQUIRES_APPROVAL" || status === "CAPABILITY_UNAVAILABLE") return "outline" as const;
  return "destructive" as const;
}

function riskTone(risk: string) {
  if (risk === "high") return "destructive" as const;
  if (risk === "medium") return "secondary" as const;
  return "outline" as const;
}

function CommandCenterPage() {
  const runPlan = useServerFn(planCommand);
  const runSubmit = useServerFn(submitCommand);
  const runList = useServerFn(listCommands);
  const runCancel = useServerFn(cancelCommand);
  const runOverview = useServerFn(commandCenterOverview);

  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState<CommandPlan | null>(null);
  const [pendingApproval, setPendingApproval] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<CommandRecord[]>([]);
  const [overview, setOverview] = React.useState<CommandCenterOverview | null>(null);
  const runExecute = useServerFn(executeSkillTask);
  const runRetry = useServerFn(retrySkillTask);
  const runCancelExec = useServerFn(cancelSkillExecution);
  const runExecutions = useServerFn(listSkillExecutions);
  const [executions, setExecutions] = React.useState<Record<string, ExecutionResult>>({});
  const [running, setRunning] = React.useState<string | null>(null);
  const [recent, setRecent] = React.useState<WorkforceExecution[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      const [h, o, x] = await Promise.all([
        runList({ data: { limit: 20 } }),
        runOverview({}),
        runExecutions({ data: { limit: 15 } }),
      ]);
      setHistory(h.commands);
      setOverview(o);
      setRecent(x.executions);
    } catch {
      /* overview is best-effort */
    }
  }, [runList, runOverview, runExecutions]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSend = React.useCallback(
    async (payload: { prompt: string }) => {
      const text = payload.prompt.trim();
      if (!text) {
        toast.error("Give HAPPY a command first.");
        return;
      }
      setBusy(true);
      setPendingApproval(null);
      try {
        const p = await runPlan({ data: { command: text } });
        setCurrent(p);
        if (p.requiresApproval) {
          const res = await runSubmit({ data: { command: text, confirmed: false } });
          setPendingApproval(res.command_id);
          toast.warning("Approval required before HAPPY executes this.");
        } else {
          await runSubmit({ data: { command: text, confirmed: true } });
          toast.success(`HAPPY accepted · ${p.intentLabel}`);
        }
        await refresh();
      } catch (e) {
        toast.error(`HAPPY could not interpret that · ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [runPlan, runSubmit, refresh],
  );

  const execute = React.useCallback(
    async (task: string, agent: string) => {
      setRunning(task);
      try {
        const res = await runExecute({
          data: { task, agent, goal: current?.command ?? null, input: {} },
        });
        setExecutions((prev) => ({ ...prev, [task]: res }));
        if (res.status === "SUCCESS") toast.success(res.message);
        else if (res.status === "REQUIRES_APPROVAL") toast.warning(res.message);
        else toast.error(`${res.status} · ${res.message}`);
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(null);
      }
    },
    [runExecute, current, refresh],
  );

  const retry = React.useCallback(
    async (task: string, agent: string) => {
      setRunning(task);
      try {
        const res = await runRetry({ data: { task, agent, attempt: 0, input: {} } });
        if (res.result) setExecutions((prev) => ({ ...prev, [task]: res.result! }));
        toast[res.retried ? "success" : "warning"](res.reason);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(null);
      }
    },
    [runRetry],
  );

  const cancelExec = React.useCallback(
    async (correlationId: string) => {
      try {
        const res = await runCancelExec({ data: { correlation_id: correlationId } });
        toast[res.cancelled ? "success" : "warning"](res.reason);
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    },
    [runCancelExec, refresh],
  );

  const approve = React.useCallback(async () => {
    if (!current) return;
    setBusy(true);
    try {
      await runSubmit({ data: { command: current.command, confirmed: true } });
      setPendingApproval(null);
      toast.success("Approved — HAPPY is executing.");
      await refresh();
    } catch (e) {
      toast.error(`Execution failed · ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [current, runSubmit, refresh]);

  const reject = React.useCallback(async () => {
    if (!pendingApproval) return;
    setBusy(true);
    try {
      await runCancel({ data: { id: pendingApproval, reason: "Rejected by Founder" } });
      setPendingApproval(null);
      setCurrent(null);
      toast.success("Command rejected.");
      await refresh();
    } catch (e) {
      toast.error(`Could not reject · ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [pendingApproval, runCancel, refresh]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">HAPPY Command Center</h1>
        <p className="text-sm text-muted-foreground">
          Say what you want. HAPPY detects the intent, analyses requirements, plans, assigns agents, and asks for
          approval before anything high-impact.
        </p>
      </header>

      {overview ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Companies", value: overview.companies },
            { label: "Workspaces", value: overview.workspaces },
            { label: "Commands", value: overview.commands },
            { label: "Approvals pending", value: overview.approvalsPending },
            { label: "Jobs queued", value: overview.jobsQueued },
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
          placeholder='e.g. "HAPPY, build me a food delivery platform with customer, delivery and admin apps."'
          draftKey="happy.command-center"
          onSend={handleSend}
        />
      </section>

      {current ? (
        <section className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{current.intentLabel}</Badge>
            <Badge variant={riskTone(current.risk)}>{current.risk} risk</Badge>
            <Badge variant="outline">{Math.round(current.confidence * 100)}% confidence</Badge>
            {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Link to={current.targetRoute} className="text-xs underline text-muted-foreground ml-auto">
              {current.targetRoute}
            </Link>
          </div>

          <dl className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reason</dt>
              <dd>{current.reason}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Impact</dt>
              <dd>{current.impact}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Target</dt>
              <dd>{current.targetRoute}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Expected result</dt>
              <dd>{current.expectedResult}</dd>
            </div>
          </dl>

          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Requirements analysed</h2>
            <div className="flex flex-wrap gap-2">
              {current.requirements.map((r) => (
                <Badge key={r} variant="outline">
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Plan · {current.tasks.length} tasks · agent → skill → tool
            </h2>
            <ol className="space-y-2">
              {current.tasks.map((t) => (
                <li key={t.order} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
                  <span className="text-xs text-muted-foreground w-6">{t.order}</span>
                  <span className="font-medium">{t.stage}</span>
                  <Badge variant="secondary">{t.agentTitle}</Badge>
                  {(() => {
                    const r = resolveTask(t.stage, { agent: t.agent, intent: current.intent, order: t.order });
                    return (
                      <>
                        <Badge variant="outline">{r.skillName}</Badge>
                        <Badge variant={r.toolAvailability === "available" ? "outline" : "destructive"}>
                          {r.toolAvailability === "available" ? r.toolName : "CAPABILITY_UNAVAILABLE"}
                        </Badge>
                        <Badge variant={riskTone(r.risk)}>{r.risk}</Badge>
                        <Badge variant={r.requiresApproval ? "destructive" : "outline"}>
                          {r.requiresApproval ? "approval-gated" : "autonomous"}
                        </Badge>
                      </>
                    );
                  })()}
                  <code className="text-[11px] text-muted-foreground ml-auto">{t.owner}</code>
                </li>
              ))}
            </ol>
          </div>

          {pendingApproval ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <span className="text-sm">
                This action is high-impact. HAPPY will not execute it until you approve.
              </span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" onClick={approve} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={reject} disabled={busy}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ) : null}

          <HappyUniversalActionBar mode="mission-control" payload={current} compact />
        </section>
      ) : null}

      {current ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Skill &amp; tool execution
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {current.tasks.map((t) => {
              const r = resolveTask(t.stage, { agent: t.agent, intent: current.intent, order: t.order });
              const x = executions[r.task];
              return (
                <li key={`${t.order}-${t.stage}`} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Badge variant="outline">{r.agentTitle}</Badge>
                  <Badge variant="outline">{r.skillName}</Badge>
                  <Badge variant={r.toolAvailability === "available" ? "outline" : "destructive"}>
                    {r.toolName}
                  </Badge>
                  <Badge variant={riskTone(r.risk)}>{r.risk}</Badge>
                  <Badge variant={r.requiresApproval ? "destructive" : "outline"}>
                    {r.requiresApproval ? "approval-gated" : "autonomous"}
                  </Badge>
                  {x ? (
                    <>
                      <Badge variant={statusTone(x.status)}>{x.status}</Badge>
                      <Badge variant={x.verification === "VERIFIED" ? "secondary" : "outline"}>
                        {x.verification}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(x.startedAt).toLocaleTimeString()} · {x.duration_ms}ms
                      </span>
                      {x.error ? (
                        <span className="text-xs text-destructive max-w-[40ch] truncate">{x.error}</span>
                      ) : null}
                    </>
                  ) : null}
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={running === r.task}
                      onClick={() => void execute(r.task, String(t.agent))}
                    >
                      {running === r.task ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Execute"
                      )}
                    </Button>
                    {x?.retryable ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={running === r.task}
                        onClick={() => void retry(r.task, String(t.agent))}
                      >
                        Retry
                      </Button>
                    ) : null}
                    {x?.correlation_id && x.status !== "SUCCESS" ? (
                      <Button size="sm" variant="ghost" onClick={() => void cancelExec(x.correlation_id)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent executions
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No executions recorded yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {recent.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <Badge variant="outline">{x.action}</Badge>
                <span className="truncate max-w-[34ch]">{x.task || "—"}</span>
                <Badge variant="outline">{x.tool ?? "—"}</Badge>
                <Badge variant={riskTone(x.risk)} className="ml-auto">
                  {x.risk}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(x.occurredAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Command history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commands yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {history.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <Badge variant="outline">{c.intentLabel}</Badge>
                <span className="truncate max-w-[38ch]">{c.command || "—"}</span>
                <Badge variant={c.status === "cancelled" ? "destructive" : "secondary"} className="ml-auto">
                  {c.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.occurredAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">All surfaces</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SURFACES.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="rounded-xl border bg-card hover:bg-accent transition p-3 flex flex-col gap-2"
            >
              <t.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
