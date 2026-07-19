/**
 * HAPPY X — Education OS API v1 (server functions)
 *
 * The complete server surface for the AI-native Education Operating
 * System: student learning, content creator authoring, HAPPY AI tutoring,
 * flashcards (SM-2), notes, plans, sessions, quizzes and analytics.
 *
 * Rules enforced by the layer:
 *   - Every function goes through `requireSupabaseAuth`.
 *   - RLS on `courses/lessons/quizzes/enrollments/…` enforces access.
 *   - No teacher entity exists anywhere in this file. "Teaching" is a
 *     mode of HAPPY (aiTutorAsk) that talks to the Lovable AI Gateway.
 *   - Content Creators only write their own rows (`content_uploads`,
 *     courses/lessons scoped by company_id via RLS).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import { z } from "zod";

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// =====================================================================
// COURSE LIBRARY (public + company)
// =====================================================================
const LibraryFilter = z.object({
  q: z.string().max(120).optional(),
  level: z.string().max(30).optional(),
  language: z.string().max(10).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
export const eduListCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LibraryFilter.parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("courses")
      .select("id, slug, title, summary, cover_url, level, language, duration_minutes, price_cents, currency, is_public, status, tags, company_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.q) q = q.ilike("title", `%${data.q.replace(/[%_]/g, "")}%`);
    if (data.level) q = q.eq("level", data.level);
    if (data.language) q = q.eq("language", data.language);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduGetCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ course_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const s = context.supabase;
    const [course, modules, lessons] = await Promise.all([
      s.from("courses").select("id, slug, title, summary, cover_url, level, language, duration_minutes, price_cents, currency, is_public, status, tags, company_id").eq("id", data.course_id).maybeSingle(),
      s.from("course_modules").select("id, title, description, position").eq("course_id", data.course_id).order("position", { ascending: true }),
      s.from("lessons").select("id, module_id, title, kind, duration_seconds, position, media_url").eq("course_id", data.course_id).order("position", { ascending: true }),
    ]);
    if (course.error) throw course.error;
    if (!course.data) return null;
    return { course: course.data, modules: modules.data ?? [], lessons: lessons.data ?? [] };
  }));

// =====================================================================
// ENROLLMENTS + PROGRESS
// =====================================================================
export const eduMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase
      .from("course_enrollments")
      .select("id, course_id, status, progress_pct, enrolled_at, completed_at, courses:course_id(id, title, slug, cover_url, level, language, duration_minutes)")
      .eq("user_id", context.userId)
      .order("enrolled_at", { ascending: false })
      .limit(100);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduEnroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ course_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "enrollment", capability: "enroll", user_id: context.userId, company_id: ZERO_UUID, summary: `enroll ${data.course_id}` });
    const r = await context.supabase.from("course_enrollments")
      .upsert({ course_id: data.course_id, user_id: context.userId, status: "enrolled" }, { onConflict: "course_id,user_id" })
      .select("id, course_id, status, progress_pct").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    lesson_id: uuid,
    enrollment_id: uuid.optional(),
    progress_seconds: z.number().int().min(0),
    completed: z.boolean().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "lesson", capability: "progress", user_id: context.userId, company_id: ZERO_UUID, summary: `progress ${data.lesson_id}` });
    const r = await context.supabase.from("lesson_progress").upsert({
      lesson_id: data.lesson_id,
      user_id: context.userId,
      enrollment_id: data.enrollment_id ?? null,
      progress_seconds: data.progress_seconds,
      completed: data.completed ?? false,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "lesson_id,user_id" }).select("id, completed, progress_seconds").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// STUDY NOTES / BOOKMARKS
// =====================================================================
export const eduListNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ course_id: uuid.optional(), lesson_id: uuid.optional(), limit: z.number().int().min(1).max(200).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("study_notes")
      .select("id, title, body, tags, course_id, lesson_id, updated_at, created_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.lesson_id) q = q.eq("lesson_id", data.lesson_id);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduSaveNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().max(200).optional(),
    body: z.string().max(20000),
    tags: z.array(z.string().max(40)).max(20).optional(),
    course_id: uuid.optional(),
    lesson_id: uuid.optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "note", capability: data.id ? "update" : "create", user_id: context.userId, company_id: ZERO_UUID });
    const row = {
      user_id: context.userId,
      title: data.title ?? null,
      body: data.body,
      tags: data.tags ?? [],
      course_id: data.course_id ?? null,
      lesson_id: data.lesson_id ?? null,
    };
    const s = context.supabase;
    const r = data.id
      ? await s.from("study_notes").update(row).eq("id", data.id).eq("user_id", context.userId).select("id, title, body, tags, updated_at").single()
      : await s.from("study_notes").insert(row).select("id, title, body, tags, updated_at").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduDeleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "note", capability: "delete", user_id: context.userId, company_id: ZERO_UUID, summary: `delete ${data.id}` });
    const r = await context.supabase.from("study_notes").delete().eq("id", data.id).eq("user_id", context.userId);
    if (r.error) throw r.error;
    return { ok: true };
  }));

export const eduBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    resource_type: z.enum(["lesson", "course", "flashcard", "quiz", "upload"]),
    resource_id: uuid,
    label: z.string().max(200).optional(),
    timestamp_seconds: z.number().int().min(0).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "bookmark", capability: "create", user_id: context.userId, company_id: ZERO_UUID, metadata: { resource_type: data.resource_type } });
    const r = await context.supabase.from("study_bookmarks").insert({
      user_id: context.userId,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      label: data.label ?? null,
      timestamp_seconds: data.timestamp_seconds ?? null,
    }).select("id").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// FLASHCARDS + SM-2 REVIEW
// =====================================================================
export const eduListFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ due_only: z.boolean().optional(), limit: z.number().int().min(1).max(500).optional(), deck: z.string().optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("study_flashcards")
      .select("id, deck, front, back, ease, interval_days, reps, next_review_at, last_reviewed_at, course_id, lesson_id, updated_at")
      .eq("user_id", context.userId)
      .order("next_review_at", { ascending: true })
      .limit(data.limit ?? 200);
    if (data.due_only) q = q.lte("next_review_at", new Date().toISOString());
    if (data.deck) q = q.eq("deck", data.deck);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduSaveFlashcard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid.optional(),
    front: z.string().min(1).max(2000),
    back: z.string().min(1).max(4000),
    deck: z.string().max(80).optional(),
    course_id: uuid.optional(),
    lesson_id: uuid.optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "flashcard", capability: data.id ? "update" : "create", user_id: context.userId, company_id: ZERO_UUID });
    const row = {
      user_id: context.userId,
      front: data.front,
      back: data.back,
      deck: data.deck ?? null,
      course_id: data.course_id ?? null,
      lesson_id: data.lesson_id ?? null,
    };
    const s = context.supabase;
    const r = data.id
      ? await s.from("study_flashcards").update(row).eq("id", data.id).eq("user_id", context.userId).select("*").single()
      : await s.from("study_flashcards").insert(row).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// SM-2: quality 0..5. 0-2 reset; 3+ progress interval; ease clamped.
export const eduReviewFlashcard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid, quality: z.number().int().min(0).max(5) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "flashcard", capability: "review", user_id: context.userId, company_id: ZERO_UUID, metadata: { quality: data.quality } });
    const s = context.supabase;
    const cur = await s.from("study_flashcards")
      .select("id, ease, interval_days, reps")
      .eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (cur.error) throw cur.error;
    if (!cur.data) throw new Error("Flashcard not found");
    const prevEase = Number(cur.data.ease) || 2.5;
    const reps = Number(cur.data.reps) || 0;
    const interval = Number(cur.data.interval_days) || 0;

    let nextEase = prevEase + (0.1 - (5 - data.quality) * (0.08 + (5 - data.quality) * 0.02));
    if (nextEase < 1.3) nextEase = 1.3;
    let nextReps = reps + 1;
    let nextInterval: number;
    if (data.quality < 3) { nextReps = 0; nextInterval = 1; }
    else if (nextReps === 1) nextInterval = 1;
    else if (nextReps === 2) nextInterval = 6;
    else nextInterval = Math.round(interval * nextEase);

    const nextReviewAt = new Date(Date.now() + nextInterval * 86400_000).toISOString();
    const upd = await s.from("study_flashcards").update({
      ease: nextEase, interval_days: nextInterval, reps: nextReps,
      next_review_at: nextReviewAt, last_reviewed_at: new Date().toISOString(),
    }).eq("id", data.id).eq("user_id", context.userId).select("id, ease, interval_days, reps, next_review_at").single();
    if (upd.error) throw upd.error;
    return upd.data;
  }));

// =====================================================================
// QUIZZES + EXAMS
// =====================================================================
export const eduGetQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ quiz_id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const s = context.supabase;
    const [quiz, questions] = await Promise.all([
      s.from("quizzes").select("id, title, time_limit_seconds, passing_score, course_id, lesson_id").eq("id", data.quiz_id).maybeSingle(),
      s.from("quiz_questions").select("id, position, prompt, kind, choices, points").eq("quiz_id", data.quiz_id).order("position", { ascending: true }),
    ]);
    if (quiz.error) throw quiz.error;
    return { quiz: quiz.data, questions: questions.data ?? [] };
  }));

export const eduSubmitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    quiz_id: uuid,
    answers: z.array(z.object({ question_id: uuid, value: z.unknown() })).max(500),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "quiz", capability: "submit", user_id: context.userId, company_id: ZERO_UUID, summary: `submit ${data.quiz_id}` });
    const s = context.supabase;
    const [quiz, questions] = await Promise.all([
      s.from("quizzes").select("id, passing_score").eq("id", data.quiz_id).maybeSingle(),
      s.from("quiz_questions").select("id, correct, points, kind").eq("quiz_id", data.quiz_id),
    ]);
    if (quiz.error) throw quiz.error;
    if (questions.error) throw questions.error;
    const qList = (questions.data ?? []) as Array<{ id: string; correct: unknown; points: number; kind: string }>;
    const byId = new Map(qList.map((q) => [q.id, q]));
    let earned = 0, total = 0;
    for (const q of qList) total += Number(q.points ?? 1);
    for (const a of data.answers) {
      const q = byId.get(a.question_id);
      if (!q) continue;
      const correct = JSON.stringify(q.correct ?? []);
      const given = JSON.stringify(Array.isArray(a.value) ? a.value : [a.value]);
      if (correct === given) earned += Number(q.points ?? 1);
    }
    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passing = quiz.data?.passing_score ?? 60;
    const passed = score >= passing;
    const ins = await s.from("quiz_attempts").insert({
      quiz_id: data.quiz_id, user_id: context.userId,
      score, passed, answers: data.answers as unknown as never, submitted_at: new Date().toISOString(),
    }).select("id, score, passed").single();
    if (ins.error) throw ins.error;
    return ins.data;
  }));

export const eduMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("quiz_attempts")
      .select("id, quiz_id, score, passed, submitted_at, quizzes:quiz_id(title)")
      .eq("user_id", context.userId)
      .order("submitted_at", { ascending: false })
      .limit(50);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =====================================================================
// STUDY PLANS + SESSIONS + STREAKS
// =====================================================================
export const eduListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("study_plans")
      .select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduSavePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().min(1).max(200),
    goal: z.string().max(1000).optional(),
    target_at: z.string().datetime().optional(),
    plan: z.record(z.unknown()).optional(),
    status: z.enum(["active", "paused", "completed", "archived"]).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "plan", capability: data.id ? "update" : "create", user_id: context.userId, company_id: ZERO_UUID });
    const row = {
      user_id: context.userId,
      title: data.title,
      goal: data.goal ?? null,
      target_at: data.target_at ?? null,
      plan: (data.plan ?? {}) as unknown as never,
      status: data.status ?? "active",
    };
    const s = context.supabase;
    const r = data.id
      ? await s.from("study_plans").update(row).eq("id", data.id).eq("user_id", context.userId).select("*").single()
      : await s.from("study_plans").insert(row).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduLogSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    course_id: uuid.optional(),
    lesson_id: uuid.optional(),
    mode: z.string().max(30).optional(),
    seconds: z.number().int().min(1).max(21600),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "education", module: "session", capability: "log", user_id: context.userId, company_id: ZERO_UUID, metadata: { seconds: data.seconds } });
    const r = await context.supabase.from("study_sessions").insert({
      user_id: context.userId,
      course_id: data.course_id ?? null,
      lesson_id: data.lesson_id ?? null,
      mode: data.mode ?? "study",
      seconds: data.seconds,
      ended_at: new Date().toISOString(),
    }).select("id").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const s = context.supabase;
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [enrollments, dueCards, sessions, attempts, certs, notes, plans] = await Promise.all([
      s.from("course_enrollments").select("id, course_id, status, progress_pct, enrolled_at, courses:course_id(id, title, cover_url)").eq("user_id", context.userId).order("enrolled_at", { ascending: false }).limit(12),
      s.from("study_flashcards").select("id", { count: "exact", head: true }).eq("user_id", context.userId).lte("next_review_at", new Date().toISOString()),
      s.from("study_sessions").select("seconds, started_at").eq("user_id", context.userId).gte("started_at", since),
      s.from("quiz_attempts").select("id, score, passed, submitted_at").eq("user_id", context.userId).order("submitted_at", { ascending: false }).limit(5),
      s.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      s.from("study_notes").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
      s.from("study_plans").select("id, title, status, target_at").eq("user_id", context.userId).eq("status", "active").limit(3),
    ]);
    // Derive streak from sessions (consecutive days ending today).
    const byDay = new Map<string, number>();
    for (const r of (sessions.data ?? []) as Array<{ seconds: number; started_at: string }>) {
      const k = r.started_at.slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + r.seconds);
    }
    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      if (byDay.has(d)) streak++; else break;
    }
    const totalSeconds = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
    return {
      enrollments: enrollments.data ?? [],
      due_flashcards: dueCards.count ?? 0,
      streak_days: streak,
      minutes_30d: Math.round(totalSeconds / 60),
      recent_attempts: attempts.data ?? [],
      certificates: certs.count ?? 0,
      notes: notes.count ?? 0,
      active_plans: plans.data ?? [],
      series: Array.from(byDay.entries()).map(([date, seconds]) => ({ date, minutes: Math.round(seconds / 60) })).sort((a, b) => a.date < b.date ? -1 : 1),
    };
  }));

// =====================================================================
// CONTENT CREATOR — uploads + courses/lessons authoring
// =====================================================================
export const eduListUploads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: uuid.optional(), status: z.string().optional(), mine: z.boolean().optional(), limit: z.number().int().min(1).max(200).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("content_uploads")
      .select("id, kind, title, description, url, size_bytes, status, company_id, creator_id, course_id, lesson_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    if (data.status) q = q.eq("status", data.status);
    if (data.mine) q = q.eq("creator_id", context.userId);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const eduCreateUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(),
    kind: z.enum(["pdf", "book", "video", "audio", "image", "slides", "other"]),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    url: z.string().url().max(2000),
    size_bytes: z.number().int().min(0).optional(),
    course_id: uuid.optional(),
    lesson_id: uuid.optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("content_uploads").insert({
      creator_id: context.userId,
      company_id: data.company_id ?? null,
      kind: data.kind,
      title: data.title,
      description: data.description ?? null,
      url: data.url,
      size_bytes: data.size_bytes ?? null,
      course_id: data.course_id ?? null,
      lesson_id: data.lesson_id ?? null,
    }).select("id, status").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduUpdateUploadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid, status: z.enum(["pending", "approved", "published", "rejected", "archived"]) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("content_uploads").update({ status: data.status }).eq("id", data.id).select("id, status").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const eduCreateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid,
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(120),
    summary: z.string().max(2000).optional(),
    level: z.string().max(30).optional(),
    language: z.string().max(10).optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    is_public: z.boolean().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase.from("courses").insert({
      company_id: data.company_id,
      title: data.title, slug: data.slug,
      summary: data.summary ?? null,
      level: data.level ?? null,
      language: data.language ?? "en",
      tags: data.tags ?? [],
      is_public: data.is_public ?? false,
      status: "draft",
      created_by: context.userId, updated_by: context.userId,
    }).select("id, slug, title, status").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// UNIVERSAL EDUCATION SEARCH
// =====================================================================
export const eduSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ q: z.string().min(1).max(120), limit: z.number().int().min(1).max(30).optional() }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const like = `%${data.q.replace(/[%_]/g, "")}%`;
    const s = context.supabase;
    const lim = data.limit ?? 8;
    const [courses, lessons, notes, cards, uploads] = await Promise.all([
      s.from("courses").select("id, title, slug, level").ilike("title", like).eq("status", "active").limit(lim),
      s.from("lessons").select("id, title, course_id").ilike("title", like).limit(lim),
      s.from("study_notes").select("id, title, body").eq("user_id", context.userId).or(`title.ilike.${like},body.ilike.${like}`).limit(lim),
      s.from("study_flashcards").select("id, front, back, deck").eq("user_id", context.userId).or(`front.ilike.${like},back.ilike.${like}`).limit(lim),
      s.from("content_uploads").select("id, title, kind, status").eq("status", "published").ilike("title", like).limit(lim),
    ]);
    return {
      courses: courses.data ?? [],
      lessons: lessons.data ?? [],
      notes: notes.data ?? [],
      flashcards: cards.data ?? [],
      uploads: uploads.data ?? [],
    };
  }));

// =====================================================================
// HAPPY AI TEACHER — modes routed through Lovable AI Gateway
// =====================================================================
type TeachMode = "teacher" | "professor" | "mentor" | "tutor" | "coach" | "coding" | "language" | "business" | "culture";

const MODE_INSTRUCTIONS: Record<TeachMode, string> = {
  teacher: "You are HAPPY, an AI Teacher for school-age learners. Teach in a warm, patient, structured way with concrete examples, small practice questions, and gentle check-ins.",
  professor: "You are HAPPY, an AI Professor. Explain with academic rigor: define terms precisely, cite mechanisms, use worked derivations, note counter-arguments and open questions.",
  mentor: "You are HAPPY, an AI Mentor. Ask reflective questions first, then guide the learner to their own answers. Encourage growth, discipline and long-term thinking.",
  tutor: "You are HAPPY, an AI Tutor. Diagnose the misconception, teach it back simpler, then re-check with a targeted question. Iterate until the learner shows mastery.",
  coach: "You are HAPPY, an AI Career Coach. Ask about goals, constraints and current skills. Deliver an actionable weekly plan with measurable outcomes.",
  coding: "You are HAPPY, an AI Coding Mentor. Show minimal runnable examples, explain runtime and complexity, and always include one debugging or test suggestion.",
  language: "You are HAPPY, an AI Language Trainer. Introduce grammar with real dialogues, use spaced repetition of vocabulary, and end every response with one practice prompt.",
  business: "You are HAPPY, an AI Business Coach. Use crisp frameworks (jobs-to-be-done, unit economics, wedge strategy). Recommend the next decision, not just theory.",
  culture: "You are HAPPY, an AI Culture & Religion Guide. Present multiple traditions respectfully and factually. Attribute interpretations to their sources, and avoid presenting any single tradition's views as universal facts.",
};

const AskInput = z.object({
  mode: z.enum(["teacher", "professor", "mentor", "tutor", "coach", "coding", "language", "business", "culture"]).default("teacher"),
  topic: z.string().max(200).optional(),
  course_id: uuid.optional(),
  lesson_id: uuid.optional(),
  session_id: uuid.nullable().optional(),
  message: z.string().min(1).max(6000),
  variant: z.enum(["explain", "simpler", "advanced", "practice", "flashcards", "summary"]).optional(),
});

export const aiTutorAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AskInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const s = context.supabase;

    // Load or start session
    let sessionId = data.session_id ?? null;
    let transcript: Array<{ role: "user" | "assistant" | "system"; content: string; at: string }> = [];
    if (sessionId) {
      const r = await s.from("ai_tutor_sessions")
        .select("id, transcript").eq("id", sessionId).eq("user_id", context.userId).maybeSingle();
      if (r.error) throw r.error;
      transcript = (r.data?.transcript as typeof transcript) ?? [];
    } else {
      const ins = await s.from("ai_tutor_sessions").insert({
        user_id: context.userId,
        mode: data.mode,
        topic: data.topic ?? null,
        course_id: data.course_id ?? null,
        lesson_id: data.lesson_id ?? null,
        transcript: [],
      }).select("id").single();
      if (ins.error) throw ins.error;
      sessionId = ins.data.id as string;
    }

    const variantHint =
      data.variant === "simpler" ? "Re-explain the previous answer at a simpler level with a concrete metaphor." :
      data.variant === "advanced" ? "Deepen the previous answer with advanced nuances and one open research question." :
      data.variant === "practice" ? "Generate 5 practice questions on this topic with brief explanations." :
      data.variant === "flashcards" ? "Return 8 flashcards as JSON in a fenced code block: [{\"front\":...,\"back\":...}]." :
      data.variant === "summary" ? "Summarize the topic in 6 bullet points a learner can revise from." :
      "Teach one step at a time. End with one short check-for-understanding question.";

    const messages = [
      { role: "system", content: `${MODE_INSTRUCTIONS[data.mode]} ${variantHint} Use markdown; be concise; never invent facts.` },
      ...transcript.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.topic ? `[Topic: ${data.topic}]\n\n${data.message}` : data.message },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });
    if (res.status === 429) throw new Error("AI is busy right now — please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`AI Gateway error: ${res.status}`);
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";

    const now = new Date().toISOString();
    const nextTranscript = [
      ...transcript,
      { role: "user" as const, content: data.message, at: now },
      { role: "assistant" as const, content: answer, at: now },
    ].slice(-100);
    const upd = await s.from("ai_tutor_sessions").update({ transcript: nextTranscript, updated_at: now })
      .eq("id", sessionId).eq("user_id", context.userId).select("id").single();
    if (upd.error) throw upd.error;

    return { session_id: sessionId, answer, transcript: nextTranscript };
  }));

export const aiTutorSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("ai_tutor_sessions")
      .select("id, mode, topic, course_id, lesson_id, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =====================================================================
// LEARNING ANALYTICS
// =====================================================================
export const eduAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ days: z.number().int().min(1).max(365).optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const s = context.supabase;
    const [sessions, attempts, enrollments, completedLessons, cards] = await Promise.all([
      s.from("study_sessions").select("seconds, mode, started_at, course_id").eq("user_id", context.userId).gte("started_at", since),
      s.from("quiz_attempts").select("score, passed, submitted_at").eq("user_id", context.userId).gte("submitted_at", since),
      s.from("course_enrollments").select("id, status, progress_pct, completed_at").eq("user_id", context.userId),
      s.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("completed", true).gte("last_seen_at", since),
      s.from("study_flashcards").select("reps, ease").eq("user_id", context.userId),
    ]);

    const byDay: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    for (const r of (sessions.data ?? []) as Array<{ seconds: number; mode: string | null; started_at: string }>) {
      const k = r.started_at.slice(0, 10);
      byDay[k] = (byDay[k] ?? 0) + r.seconds;
      const m = r.mode ?? "study";
      byMode[m] = (byMode[m] ?? 0) + r.seconds;
    }
    const scores = (attempts.data ?? []) as Array<{ score: number | null; passed: boolean | null }>;
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b.score ?? 0), 0) / scores.length) : 0;
    const pass = scores.length ? Math.round(100 * scores.filter((s) => s.passed).length / scores.length) : 0;
    const enrolls = (enrollments.data ?? []) as Array<{ status: string; progress_pct: number | null }>;
    const completed = enrolls.filter((e) => e.status === "completed").length;
    const cardsArr = (cards.data ?? []) as Array<{ reps: number | null; ease: number | null }>;
    const avgEase = cardsArr.length ? Number((cardsArr.reduce((a, c) => a + Number(c.ease ?? 2.5), 0) / cardsArr.length).toFixed(2)) : 2.5;

    return {
      minutes_series: Object.entries(byDay).map(([date, seconds]) => ({ date, minutes: Math.round(seconds / 60) })).sort((a, b) => a.date < b.date ? -1 : 1),
      mode_breakdown: Object.entries(byMode).map(([mode, seconds]) => ({ mode, minutes: Math.round(seconds / 60) })),
      average_score: avg,
      pass_rate_pct: pass,
      completed_lessons: completedLessons.count ?? 0,
      completed_courses: completed,
      enrollments: enrolls.length,
      cards_total: cardsArr.length,
      average_ease: avgEase,
    };
  }));
