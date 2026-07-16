import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listFounderCommands } from "@/lib/faios/founder-command.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/history")({ component: Page });

function Page() {
  const list = useServerFn(listFounderCommands);
  const q = useQuery({ queryKey: ["faios", "history"], queryFn: () => list({ data: { limit: 200 } }) });
  return (
    <FaiosShell title="Founder Timeline" description="Every command HAPPY has heard.">
      <Panel className="p-6">
        {q.data?.commands?.length ? (
          <ul className="text-xs space-y-3">
            {q.data.commands.map((c: any) => (
              <li key={c.id} className="border-t border-white/5 pt-2">
                <div className="flex justify-between">
                  <p className="text-paper text-sm">{c.raw_text}</p>
                  <Chip tone={c.status === "succeeded" ? "success" : c.status === "blocked" ? "warning" : "info"}>{c.status}</Chip>
                </div>
                <p className="text-soft-gray">{c.intent} · {c.category} · risk {c.risk_level} · {new Date(c.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No history" description="Nothing yet." />}
      </Panel>
    </FaiosShell>
  );
}
