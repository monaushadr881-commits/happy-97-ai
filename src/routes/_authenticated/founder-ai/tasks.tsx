import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FaiosShell } from "./-shell";
import { Panel, Chip, EmptyState } from "@/design-system/primitives";
import { listWorkspace } from "@/lib/faios/founder-workspace.functions";

export const Route = createFileRoute("/_authenticated/founder-ai/tasks")({ component: Page });

function Page() {
  const list = useServerFn(listWorkspace);
  const q = useQuery({ queryKey: ["faios", "tasks"], queryFn: () => list({ data: { kind: "task" } }) });
  return (
    <FaiosShell title="Founder Tasks" description="Task view of your workspace.">
      <Panel className="p-6">
        {q.data?.items?.length ? (
          <ul className="text-xs space-y-2">
            {q.data.items.map((it: any) => (
              <li key={it.id} className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-paper text-sm">{it.title}</span>
                <Chip tone={it.status === "done" ? "success" : "info"}>{it.status}</Chip>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No tasks" description="Add tasks from the Workspace tab." />}
      </Panel>
    </FaiosShell>
  );
}
