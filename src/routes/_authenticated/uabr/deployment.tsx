import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UabrShell } from "./-shell";
import { Panel, Chip } from "@/design-system/primitives";
import { generateDeploymentPlan } from "@/lib/uabr/deployment-planner.functions";

export const Route = createFileRoute("/_authenticated/uabr/deployment")({ component: Page });

const MODES = ["website", "pwa", "android", "ios", "desktop", "backend", "frontend", "complete", "enterprise"] as const;
type M = (typeof MODES)[number];

function Page() {
  const fn = useServerFn(generateDeploymentPlan);
  const [modes, setModes] = useState<M[]>(["website"]);
  const [channel, setChannel] = useState<"internal" | "beta" | "production">("beta");
  const mut = useMutation({ mutationFn: () => fn({ data: { modes, channel } }) });
  const toggle = (m: M) => setModes((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  return (
    <UabrShell title="Deployment Planner" description="Web is one-click. Native + store publishing are blocked pending credentials.">
      <Panel className="p-6 space-y-3">
        <div className="flex flex-wrap gap-2">{MODES.map((m) => (
          <button key={m} onClick={() => toggle(m)} className={`px-3 py-1.5 rounded-md text-xs border ${modes.includes(m) ? "border-gold/40 text-gold bg-gold/10" : "border-white/10 text-soft-gray"}`}>{m}</button>
        ))}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-soft-gray">Channel:</span>
          {(["internal", "beta", "production"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)} className={`px-3 py-1 rounded-md text-xs border ${channel === c ? "border-gold/40 text-gold bg-gold/10" : "border-white/10 text-soft-gray"}`}>{c}</button>
          ))}
        </div>
        <button className="px-4 py-2 rounded-md bg-gold/20 text-gold border border-gold/40 text-sm disabled:opacity-50" disabled={modes.length === 0 || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? "Planning…" : "Plan Deployment"}</button>
      </Panel>
      {mut.data && (
        <Panel className="p-4 space-y-2">
          <ul className="text-sm space-y-2">{mut.data.targets.map((t) => (
            <li key={t.name} className="flex items-start justify-between gap-4 border-t border-white/5 pt-2">
              <div>
                <p className="text-paper">{t.name}</p>
                {t.blocked_reason && <p className="text-xs text-amber-300">{t.blocked_reason}</p>}
                {t.external?.secrets?.length ? <p className="text-xs text-soft-gray">Secrets: {t.external.secrets.join(", ")}</p> : null}
              </div>
              <Chip tone={t.status === "ready" ? "success" : "warning"}>{t.status}</Chip>
            </li>))}</ul>
          <p className="text-xs text-soft-gray">Rollback: {mut.data.rollback}</p>
        </Panel>
      )}
    </UabrShell>
  );
}
