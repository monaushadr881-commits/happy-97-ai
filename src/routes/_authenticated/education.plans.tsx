/** /education/plans — personal AI study plans. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { eduListPlans, eduSavePlan } from "@/lib/education-v1.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/plans")({
  head: () => ({ meta: [{ title: "Study Plans — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Plans,
});

type Plan = { id: string; title: string; goal: string | null; target_at: string | null; status: string; created_at: string };

function Plans() {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [target, setTarget] = useState("");
  const qc = useQueryClient();

  const plans = useQuery({ queryKey: ["edu", "plans"], queryFn: () => eduListPlans() });
  const save = useMutation({
    mutationFn: () => eduSavePlan({ data: { title, goal: goal || undefined, target_at: target ? new Date(target).toISOString() : undefined } }),
    onSuccess: () => { setTitle(""); setGoal(""); setTarget(""); toast.success("Plan created");
      qc.invalidateQueries({ queryKey: ["edu", "plans"] });
      qc.invalidateQueries({ queryKey: ["edu", "dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = ((plans.data ?? []) as unknown as Plan[]);
  return (
    <>
      <PageHeader eyebrow="Education OS" title="Study plans" description="Personalised learning plans, tracked to your target date." />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Your plans</h2>
          <Hairline className="my-4" />
          {list.length ? (
            <ul className="space-y-3">
              {list.map((p) => (
                <li key={p.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm text-paper">{p.title}</div>
                      {p.goal && <div className="mt-1 text-xs text-soft-gray">{p.goal}</div>}
                    </div>
                    <Chip tone={p.status === "completed" ? "success" : p.status === "paused" ? "warning" : "info"}>{p.status}</Chip>
                  </div>
                  <div className="mt-2 text-[11px] text-soft-gray">
                    {p.target_at ? `Target ${new Date(p.target_at).toLocaleDateString()}` : "No target date"} · Created {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-soft-gray">No plans yet.</p>}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">New plan</h2>
          <Hairline className="my-4" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Master calculus)" />
          <Textarea rows={4} className="mt-2" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (what does mastery look like?)" />
          <Input type="date" className="mt-2" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Button className="mt-3 w-full" onClick={() => save.mutate()} disabled={!title.trim() || save.isPending}>
            {save.isPending ? "Saving…" : "Create plan"}
          </Button>
        </Panel>
      </div>
    </>
  );
}
