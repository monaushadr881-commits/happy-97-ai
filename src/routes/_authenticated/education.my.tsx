/** /education/my — enrolled courses and progress. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { eduMyEnrollments } from "@/lib/education-v1.functions";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/education/my")({
  head: () => ({ meta: [{ title: "My Learning — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: My,
});

type Enroll = { id: string; course_id: string; status: string; progress_pct: number; enrolled_at: string; completed_at: string | null; courses: { id: string; title: string; slug: string; cover_url: string | null; level: string | null; language: string | null; duration_minutes: number | null } | null };

function My() {
  const q = useQuery({ queryKey: ["edu", "my"], queryFn: () => eduMyEnrollments() });
  const list = ((q.data ?? []) as unknown as Enroll[]);
  return (
    <>
      <PageHeader eyebrow="Education OS" title="My learning" description="Every course you're enrolled in, with live progress." />
      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((e) => (
            <Panel key={e.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 rounded bg-white/5 grid place-items-center text-gold">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm text-paper">{e.courses?.title ?? "Untitled"}</h3>
                    <Chip tone={e.status === "completed" ? "success" : "info"}>{e.status}</Chip>
                  </div>
                  <div className="mt-2 h-1 rounded bg-white/5 overflow-hidden">
                    <div className="h-full bg-gold" style={{ width: `${e.progress_pct ?? 0}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-soft-gray flex justify-between">
                    <span>{e.progress_pct}% complete</span>
                    <span>{e.courses?.level ?? "—"} · {e.courses?.language ?? "en"}</span>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : <Panel className="p-6 text-sm text-soft-gray">No enrollments yet.</Panel>}
      <Hairline className="mt-6" />
    </>
  );
}
