import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { generateProjectPlan } from "@/lib/uabr/project-planner.functions";

export const Route = createFileRoute("/_authenticated/uabr/planner")({ component: Page });

function Page() {
  const fn = useServerFn(generateProjectPlan);
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const mut = useMutation({ mutationFn: (input: { prompt: string; project_name?: string }) => fn({ data: input }) });

  return (
    <UabrShell title="Project Planner" description="Turn a natural-language brief into a complete, approvable project plan.">
      <Panel className="p-6 space-y-4">
        <div className="grid gap-3">
          <label className="text-xs uppercase tracking-wide text-soft-gray">Project name (optional)</label>
          <input
            className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. GoldenPlate"
          />
          <label className="text-xs uppercase tracking-wide text-soft-gray">Describe what you want</label>
          <textarea
            className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-paper min-h-32"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a cloud-kitchen platform with online ordering, KOT, and delivery tracking. Website + Android + iOS."
          />
          <div>
            <button
              className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50"
              disabled={mut.isPending || prompt.trim().length < 4}
              onClick={() => mut.mutate({ prompt, project_name: projectName || undefined })}
            >
              {mut.isPending ? "Planning…" : "Generate Plan"}
            </button>
          </div>
        </div>
      </Panel>

      {mut.error && <Panel className="p-4 text-red-400 text-sm">{(mut.error as Error).message}</Panel>}

      {mut.data && (
        <div className="space-y-4">
          <Panel className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-paper">{mut.data.project_name}</h3>
                <p className="text-sm text-soft-gray">{mut.data.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip tone="info">{mut.data.industry}</Chip>
                {mut.data.modes.map((m) => <Chip key={m} tone="neutral">{m}</Chip>)}
                <Chip tone={mut.data.blocked_reason ? "warning" : "success"}>
                  {mut.data.complexity} · {mut.data.timeline_days}d · {mut.data.estimated_credits} credits
                </Chip>
              </div>
            </div>
          </Panel>
          <Panel className="p-6">
            <h4 className="text-sm font-semibold text-paper mb-2">Steps</h4>
            <ul className="text-xs space-y-2">
              {mut.data.steps.map((s) => (
                <li key={s.order} className="flex items-start justify-between gap-4 border-t border-white/5 pt-2">
                  <div>
                    <p className="text-paper">{s.order}. {s.title}</p>
                    <p className="text-soft-gray">{s.category} · risk {s.risk}{s.blocked_reason ? ` · ${s.blocked_reason}` : ""}</p>
                  </div>
                  <Chip tone={s.status === "blocked" ? "warning" : s.status === "ready" ? "success" : "info"}>{s.status}</Chip>
                </li>
              ))}
            </ul>
          </Panel>
          <div className="grid md:grid-cols-2 gap-4">
            <Panel className="p-6">
              <h4 className="text-sm font-semibold text-paper mb-2">Modules</h4>
              <div className="flex flex-wrap gap-2">{mut.data.modules.map((m) => <Chip key={m} tone="neutral">{m}</Chip>)}</div>
            </Panel>
            <Panel className="p-6">
              <h4 className="text-sm font-semibold text-paper mb-2">Features</h4>
              <ul className="text-xs list-disc pl-5 text-soft-gray space-y-1">{mut.data.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </Panel>
            <Panel className="p-6">
              <h4 className="text-sm font-semibold text-paper mb-2">Database tables</h4>
              <div className="flex flex-wrap gap-2">{mut.data.database_tables.map((t) => <Chip key={t} tone="info">{t}</Chip>)}</div>
            </Panel>
            <Panel className="p-6">
              <h4 className="text-sm font-semibold text-paper mb-2">External dependencies</h4>
              <div className="text-xs text-soft-gray space-y-1">
                {(["toolchain", "secrets", "accounts", "certificates"] as const).map((k) => {
                  const v = (mut.data!.external_dependencies as any)[k] as string[] | undefined;
                  if (!v || v.length === 0) return null;
                  return <div key={k}><span className="text-paper capitalize">{k}:</span> {v.join(", ")}</div>;
                })}
                {mut.data.blocked_reason ? <p className="text-amber-300">{mut.data.blocked_reason}</p> : <p className="text-emerald-300">All planned steps are ready.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {!mut.data && !mut.isPending && (
        <EmptyState title="Waiting for your idea" description="Enter a brief above to see a complete project plan." />
      )}
    </UabrShell>
  );
}
