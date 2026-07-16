import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listTerminal } from "@/lib/faios/founder-terminal.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/terminal")({ component: Page });

function Page() {
  const list = useServerFn(listTerminal);
  const q = useQuery({ queryKey: ["faios", "terminal"], queryFn: () => list({ data: { limit: 200 } }), refetchInterval: 5_000 });
  return (
    <FaiosShell title="Founder Terminal" description="Live stream from HAPPY's planner, executor, and reviewers.">
      <Panel className="p-6 font-mono text-xs bg-black/40">
        {q.data?.lines?.length ? (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {q.data.lines.slice().reverse().map((l: any) => (
              <div key={l.id} className="flex gap-2">
                <span className="text-soft-gray">{new Date(l.created_at).toLocaleTimeString()}</span>
                <Chip tone={l.level === "error" ? "danger" : l.level === "warn" ? "warning" : "info"}>{l.channel}</Chip>
                <span className="text-paper">{l.message}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No output yet" description="Submit a command from Chat." />}
      </Panel>
    </FaiosShell>
  );
}
