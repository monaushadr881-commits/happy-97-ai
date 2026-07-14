/** /education — Student Dashboard: today's goals, streaks, due reviews, plans. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, Panel, Hairline, Chip } from "@/design-system/primitives";
import { eduStudentDashboard } from "@/lib/education-v1.functions";
import { GraduationCap, Flame, Clock, Layers, Award, Sparkles, StickyNote, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/education/")({
  head: () => ({ meta: [{ title: "Dashboard — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Enroll = { id: string; status: string; progress_pct: number; courses: { id: string; title: string; cover_url: string | null } | null };
type Attempt = { id: string; score: number | null; passed: boolean | null; submitted_at: string };
type Plan = { id: string; title: string; status: string; target_at: string | null };
type SeriesPoint = { date: string; minutes: number };

function Dashboard() {
  const q = useQuery({ queryKey: ["edu", "dashboard"], queryFn: () => eduStudentDashboard() });
  const d = q.data;
  const enrollments = ((d?.enrollments ?? []) as unknown as Enroll[]);
  const series = ((d?.series ?? []) as unknown as SeriesPoint[]);
  const maxMin = Math.max(1, ...series.map((s) => s.minutes));

  return (
    <>
      <PageHeader
        eyebrow="Education OS"
        title="Your learning cockpit"
        description="HAPPY teaches every lesson — as Teacher, Professor, Mentor, Tutor, Coach and beyond. Progress, streaks and reviews live here."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Streak" value={`${d?.streak_days ?? 0}d`} icon={<Flame className="h-4 w-4" />} />
        <StatCard label="Minutes (30d)" value={(d?.minutes_30d ?? 0).toLocaleString()} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Due reviews" value={(d?.due_flashcards ?? 0).toLocaleString()} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Certificates" value={(d?.certificates ?? 0).toLocaleString()} icon={<Award className="h-4 w-4" />} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Continue learning</h2>
            <Link to="/education/library" className="text-xs text-gold">Browse library →</Link>
          </div>
          <Hairline className="my-4" />
          {enrollments.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {enrollments.slice(0, 6).map((e) => (
                <li key={e.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded bg-white/5 grid place-items-center text-gold">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-paper">{e.courses?.title ?? "Untitled course"}</div>
                      <div className="mt-2 h-1 rounded bg-white/5 overflow-hidden">
                        <div className="h-full bg-gold" style={{ width: `${e.progress_pct ?? 0}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-soft-gray">
                        <span>{e.progress_pct ?? 0}% complete</span>
                        <Chip tone={e.status === "completed" ? "success" : "info"}>{e.status}</Chip>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-soft-gray">You haven't enrolled in any courses yet. Explore the library to begin.</p>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Active study plans</h2>
          <Hairline className="my-4" />
          {((d?.active_plans ?? []) as unknown as Plan[]).length ? (
            <ul className="space-y-2">
              {((d?.active_plans ?? []) as unknown as Plan[]).map((p) => (
                <li key={p.id} className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-sm text-paper">{p.title}</div>
                  <div className="text-[11px] text-soft-gray">
                    {p.target_at ? `Target ${new Date(p.target_at).toLocaleDateString()}` : "No target date"}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Link to="/education/plans" className="text-xs text-gold">Create your first plan →</Link>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-paper">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Ask HAPPY anything
          </div>
          <Hairline className="my-4" />
          <p className="text-sm text-paper/80">
            HAPPY teaches you in your mode of choice — Teacher, Professor, Mentor, Tutor, Coach, Coding, Language, Business or Culture — and adapts until you've mastered it.
          </p>
          <Link to="/education/tutor" className="mt-3 inline-flex text-xs uppercase tracking-[0.2em] text-gold">Open AI Teacher →</Link>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Recent quiz attempts</h2>
          <Hairline className="my-4" />
          {((d?.recent_attempts ?? []) as unknown as Attempt[]).length ? (
            <ul className="divide-y divide-white/5">
              {((d?.recent_attempts ?? []) as unknown as Attempt[]).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-paper">Score {a.score ?? 0}%</div>
                    <div className="text-[11px] text-soft-gray">{new Date(a.submitted_at).toLocaleString()}</div>
                  </div>
                  <Chip tone={a.passed ? "success" : "warning"}>{a.passed ? "Passed" : "Retry"}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-soft-gray">No attempts yet — try a quiz from any lesson.</p>
          )}
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Learning minutes — last 30 days</h2>
          <div className="text-[11px] text-soft-gray flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><StickyNote className="h-3 w-3" /> Notes {d?.notes ?? 0}</span>
            <span className="inline-flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Enrollments {enrollments.length}</span>
          </div>
        </div>
        <Hairline className="my-4" />
        <div className="flex items-end gap-1 h-32">
          {series.length ? series.slice(-30).map((s) => (
            <div key={s.date} className="flex-1 bg-gold/60 rounded-sm" style={{ height: `${(s.minutes / maxMin) * 100}%`, minHeight: 2 }} title={`${s.date}: ${s.minutes}m`} />
          )) : <p className="text-xs text-soft-gray">No study sessions logged in the last 30 days.</p>}
        </div>
      </Panel>
    </>
  );
}
