/** /education/analytics — learning analytics for the current user. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, StatCard } from "@/design-system/primitives";
import { eduAnalytics } from "@/lib/education-v1.functions";
import { BarChart3, Clock, Layers, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/education/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Analytics,
});

function Analytics() {
  const q = useQuery({ queryKey: ["edu", "analytics"], queryFn: () => eduAnalytics({ data: { days: 30 } }) });
  const d = q.data;
  const series = (d?.minutes_series ?? []);
  const modes = (d?.mode_breakdown ?? []);
  const max = Math.max(1, ...series.map((s) => s.minutes));
  const modeMax = Math.max(1, ...modes.map((m) => m.minutes));

  return (
    <>
      <PageHeader eyebrow="Education OS" title="Learning analytics" description="Retention, completion, revision frequency and HAPPY-teaching insights." />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Avg score" value={`${d?.average_score ?? 0}%`} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Pass rate" value={`${d?.pass_rate_pct ?? 0}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Lessons done" value={(d?.completed_lessons ?? 0).toLocaleString()} icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Courses done" value={(d?.completed_courses ?? 0).toLocaleString()} icon={<Clock className="h-4 w-4" />} />
      </section>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Minutes per day (30d)</h2>
        <Hairline className="my-4" />
        <div className="flex items-end gap-1 h-40">
          {series.length ? series.map((s) => (
            <div key={s.date} className="flex-1 bg-gold/60 rounded-sm" style={{ height: `${(s.minutes / max) * 100}%`, minHeight: 2 }} title={`${s.date}: ${s.minutes}m`} />
          )) : <p className="text-xs text-soft-gray">No sessions logged.</p>}
        </div>
      </Panel>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Time by mode</h2>
        <Hairline className="my-4" />
        {modes.length ? (
          <ul className="space-y-2">
            {modes.map((m) => (
              <li key={m.mode} className="text-sm">
                <div className="flex justify-between text-xs text-soft-gray">
                  <span className="uppercase tracking-[0.15em] text-paper">{m.mode}</span>
                  <span>{m.minutes} min</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-white/5 overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: `${(m.minutes / modeMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-soft-gray">No mode data yet.</p>}
      </Panel>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StatCard label="Enrollments" value={(d?.enrollments ?? 0).toLocaleString()} />
        <StatCard label="Flashcards · avg ease" value={`${d?.cards_total ?? 0} · ${d?.average_ease ?? 2.5}`} />
      </div>
    </>
  );
}
