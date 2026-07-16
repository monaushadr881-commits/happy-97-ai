import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listActivity } from "@/lib/faios/founder-execution.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/activity")({ component: Page });

function Page() {
  const list = useServerFn(listActivity);
  const q = useQuery({ queryKey: ["faios", "activity"], queryFn: () => list({ data: { limit: 200 } }), refetchInterval: 10_000 });
  return (
    <FaiosShell title="Founder Activity Feed" description="Live execution telemetry.">
      <Panel className="p-6">
        {q.data?.activity?.length ? (
          <ul className="text-xs space-y-2">
            {q.data.activity.map((a: any) => (
              <li key={a.id} className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-paper">{a.stage}</span>
                <span className="text-soft-gray">{new Date(a.created_at).toLocaleString()}</span>
                <Chip tone={a.status === "succeeded" ? "success" : a.status === "blocked" ? "warning" : "info"}>{a.status}</Chip>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No activity" description="Submit a command." />}
      </Panel>
    </FaiosShell>
  );
}
