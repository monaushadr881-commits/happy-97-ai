/** /education/library — Global course library. */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Panel, Chip, Hairline } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { eduListCourses, eduEnroll } from "@/lib/education-v1.functions";
import { BookOpen, GraduationCap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/library")({
  head: () => ({ meta: [{ title: "Library — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Library,
});

type Course = {
  id: string; slug: string; title: string; summary: string | null;
  cover_url: string | null; level: string | null; language: string | null;
  duration_minutes: number | null; price_cents: number; currency: string;
  is_public: boolean; tags: string[] | null;
};

function Library() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("");
  const qc = useQueryClient();
  const courses = useQuery({
    queryKey: ["edu", "courses", q, level],
    queryFn: () => eduListCourses({ data: { q: q || undefined, level: level || undefined, limit: 60 } }),
  });

  const enroll = async (id: string) => {
    try {
      await eduEnroll({ data: { course_id: id } });
      toast.success("Enrolled");
      qc.invalidateQueries({ queryKey: ["edu", "dashboard"] });
    } catch (e) { toast.error((e as Error).message); }
  };

  const list = (courses.data ?? []) as unknown as Course[];
  return (
    <>
      <PageHeader
        eyebrow="Education OS"
        title="Course library"
        description="Every course is taught by HAPPY — voice, whiteboard, 3D, simulations, adaptive practice, and Teach-Back mastery loops."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="max-w-xs" />
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="h-9 rounded-md bg-white/[0.03] border border-white/10 text-sm text-paper px-3">
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      {courses.isLoading ? <Panel className="p-6 text-sm text-soft-gray">Loading library…</Panel>
      : list.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Panel key={c.id} className="p-5 flex flex-col">
              <div className="h-24 rounded-md bg-gradient-to-br from-white/10 to-white/[0.02] grid place-items-center">
                {c.cover_url
                  ? <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover rounded-md" />
                  : <BookOpen className="h-8 w-8 text-gold/70" />}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="text-sm text-paper line-clamp-2">{c.title}</h3>
                {c.level && <Chip tone="info">{c.level}</Chip>}
              </div>
              {c.summary && <p className="mt-2 text-xs text-soft-gray line-clamp-3">{c.summary}</p>}
              <div className="mt-3 flex items-center justify-between text-[11px] text-soft-gray">
                <span>{c.duration_minutes ? `${c.duration_minutes} min` : "Self-paced"}</span>
                <span>{c.price_cents > 0 ? `${c.currency} ${(c.price_cents / 100).toFixed(0)}` : "Free"}</span>
              </div>
              <Button size="sm" className="mt-3" onClick={() => enroll(c.id)}>
                <GraduationCap className="h-3.5 w-3.5 mr-1" /> Enroll
              </Button>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="p-6 text-sm text-soft-gray">
          No courses yet. Content creators can seed the library from the <span className="text-gold">Creator</span> studio.
        </Panel>
      )}
      <Hairline className="mt-6" />
    </>
  );
}
