/** /education/exams — recent attempts and pass rate. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip, StatCard } from "@/design-system/primitives";
import { eduMyAttempts } from "@/lib/education-v1.functions";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/education/exams")({
  head: () => ({ meta: [{ title: "Exams — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Exams,
});

type Attempt = { id: string; quiz_id: string; score: number | null; passed: boolean | null; submitted_at: string; quizzes: { title: string | null } | null };

function Exams() {
  const q = useQuery({ queryKey: ["edu", "attempts"], queryFn: () => eduMyAttempts() });
  const list = ((q.data ?? []) as unknown as Attempt[]);
  const passRate = list.length ? Math.round(100 * list.filter((a) => a.passed).length / list.length) : 0;
  const avg = list.length ? Math.round(list.reduce((a, b) => a + (b.score ?? 0), 0) / list.length) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Education OS"
        title="Exams & practice"
        description="Daily practice, weekly tests, monthly tests, competitive exams, adaptive exams — every attempt scored and diagnosed."
      />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Attempts" value={list.length.toLocaleString()} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Average" value={`${avg}%`} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Pass rate" value={`${passRate}%`} icon={<ClipboardList className="h-4 w-4" />} />
      </section>
      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent attempts</h2>
        <Hairline className="my-4" />
        {list.length ? (
          <ul className="divide-y divide-white/5">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-paper">{a.quizzes?.title ?? "Quiz"}</div>
                  <div className="text-[11px] text-soft-gray">{new Date(a.submitted_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-paper">{a.score ?? 0}%</span>
                  <Chip tone={a.passed ? "success" : "warning"}>{a.passed ? "Passed" : "Retry"}</Chip>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-soft-gray">No exam attempts yet — visit a course to start.</p>}
      </Panel>
    </>
  );
}
