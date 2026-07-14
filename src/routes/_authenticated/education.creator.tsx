/** /education/creator — Content Creator studio. NOT a teacher. */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Panel, Hairline, Chip } from "@/design-system/primitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useEducation } from "@/components/education/EducationContext";
import {
  eduListUploads, eduCreateUpload, eduUpdateUploadStatus, eduCreateCourse,
} from "@/lib/education-v1.functions";
import { UploadCloud, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/education/creator")({
  head: () => ({ meta: [{ title: "Creator — Education OS" }, { name: "robots", content: "noindex" }] }),
  component: Creator,
});

type Upload = { id: string; kind: string; title: string; description: string | null; url: string; size_bytes: number | null; status: string; created_at: string };

function Creator() {
  const { companies, companyId, setCompanyId } = useEducation();
  const qc = useQueryClient();

  const [uploadKind, setUploadKind] = useState<"pdf" | "book" | "video" | "audio" | "image" | "slides" | "other">("pdf");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [courseLevel, setCourseLevel] = useState("beginner");

  const uploads = useQuery({
    queryKey: ["edu", "uploads", companyId],
    queryFn: () => eduListUploads({ data: { company_id: companyId ?? undefined, mine: true, limit: 100 } }),
  });

  const createUpload = useMutation({
    mutationFn: () => eduCreateUpload({ data: {
      company_id: companyId ?? undefined, kind: uploadKind, title: uploadTitle, url: uploadUrl, description: uploadDesc || undefined,
    } }),
    onSuccess: () => { setUploadTitle(""); setUploadUrl(""); setUploadDesc(""); toast.success("Upload registered · pending review");
      qc.invalidateQueries({ queryKey: ["edu", "uploads", companyId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "approved" | "published" | "rejected" | "archived" }) => eduUpdateUploadStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edu", "uploads", companyId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createCourse = useMutation({
    mutationFn: () => eduCreateCourse({ data: {
      company_id: companyId!, title: courseTitle,
      slug: courseSlug.trim() || courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      level: courseLevel,
    } }),
    onSuccess: () => { setCourseTitle(""); setCourseSlug(""); toast.success("Course created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = ((uploads.data ?? []) as unknown as Upload[]);

  return (
    <>
      <PageHeader
        eyebrow="Education OS"
        title="Content Creator studio"
        description="Content Creators author courses, chapters, lessons and upload PDFs, books, videos, audio, images and slides. Students never interact with creators directly — HAPPY teaches every lesson."
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[10px] uppercase tracking-[0.22em] text-soft-gray">Company</span>
        <Select value={companyId ?? undefined} onValueChange={setCompanyId}>
          <SelectTrigger className="h-8 min-w-[240px] bg-white/[0.03] border-white/10 text-paper">
            <SelectValue placeholder={companies.length ? "Select company" : "No companies"} />
          </SelectTrigger>
          <SelectContent className="bg-obsidian border-white/10 text-paper">
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.display_name ?? c.legal_name ?? c.slug ?? c.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-gold" /> New course
          </h2>
          <Hairline className="my-4" />
          <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Course title" />
          <Input className="mt-2" value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} placeholder="Slug (optional; auto from title)" />
          <select value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)}
            className="mt-2 h-9 w-full rounded-md bg-white/[0.03] border border-white/10 text-sm text-paper px-3">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <Button className="mt-3 w-full" disabled={!companyId || !courseTitle.trim() || createCourse.isPending}
            onClick={() => createCourse.mutate()}>
            {createCourse.isPending ? "Creating…" : "Create draft"}
          </Button>
          <p className="mt-2 text-[11px] text-soft-gray">Courses start as drafts. Company admins publish them.</p>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper flex items-center gap-2">
            <UploadCloud className="h-3.5 w-3.5 text-gold" /> Register upload
          </h2>
          <Hairline className="my-4" />
          <select value={uploadKind} onChange={(e) => setUploadKind(e.target.value as "pdf" | "book" | "video" | "audio" | "image" | "slides" | "other")}
            className="h-9 w-full rounded-md bg-white/[0.03] border border-white/10 text-sm text-paper px-3">
            {["pdf", "book", "video", "audio", "image", "slides", "other"].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <Input className="mt-2" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Title" />
          <Input className="mt-2" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="URL (public or storage URL)" />
          <Textarea rows={3} className="mt-2" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Description (optional)" />
          <Button className="mt-3 w-full" disabled={!uploadTitle.trim() || !uploadUrl.trim() || createUpload.isPending}
            onClick={() => createUpload.mutate()}>
            {createUpload.isPending ? "Registering…" : "Register upload"}
          </Button>
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-paper">Your uploads</h2>
        <Hairline className="my-4" />
        {list.length ? (
          <ul className="divide-y divide-white/5">
            {list.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-paper">{u.title}</div>
                  <div className="text-[11px] text-soft-gray truncate">{u.kind} · {u.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={u.status === "published" ? "success" : u.status === "rejected" ? "danger" : "info"}>{u.status}</Chip>
                  <select value={u.status}
                    onChange={(e) => updateStatus.mutate({ id: u.id, status: e.target.value as "pending" | "approved" | "published" | "rejected" | "archived" })}
                    className="h-8 rounded-md bg-white/[0.03] border border-white/10 text-xs text-paper px-2">
                    {["pending", "approved", "published", "rejected", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-soft-gray">No uploads yet.</p>}
      </Panel>
    </>
  );
}
