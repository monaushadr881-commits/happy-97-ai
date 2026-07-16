import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LiveShell } from "./-shell";
import { Panel } from "@/design-system/primitives";
import { generateBrief, listBriefs } from "@/lib/happy-presence/founder-briefing.functions";
import { BRIEF_TYPES, type BriefType } from "@/lib/happy-presence/contracts";

export const Route = createFileRoute("/_authenticated/live/founder")({ component: FounderPage });

function FounderPage() {
  const genFn = useServerFn(generateBrief);
  const listFn = useServerFn(listBriefs);
  const { data, refetch } = useQuery({ queryKey: ["hpe", "briefs"], queryFn: () => listFn() });
  const gen = useMutation({ mutationFn: (t: BriefType) => genFn({ data: { brief_type: t } }), onSuccess: () => refetch() });

  return (
    <LiveShell title="Founder Live AI" description="Morning/Evening/Night briefings and health summaries.">
      <Panel className="p-6 mb-4">
        <div className="flex flex-wrap gap-2">
          {BRIEF_TYPES.map((t) => (
            <button key={t} onClick={() => gen.mutate(t)} className="px-2.5 py-1 rounded-md border border-white/10 text-xs text-paper hover:bg-white/5">{t}</button>
          ))}
        </div>
      </Panel>
      <div className="space-y-3">
        {(data?.briefs ?? []).map((b: any) => (
          <Panel key={b.id} className="p-4">
            <div className="text-sm text-paper font-semibold">{b.brief_type}</div>
            <div className="text-xs text-soft-gray mb-2">{new Date(b.generated_at).toLocaleString()}</div>
            <pre className="text-xs text-soft-gray overflow-x-auto">{JSON.stringify(b.content, null, 2)}</pre>
          </Panel>
        ))}
      </div>
    </LiveShell>
  );
}
