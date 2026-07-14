
-- =====================================================================
-- HAPPY X — Phase 9: AI Education Operating System (Education OS)
-- Extensions to the existing courses/lessons/quizzes catalog.
-- Reuses is_company_member / is_company_admin from Phase 2.
-- =====================================================================

-- Personal study notes -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text,
  body text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_notes_user ON public.study_notes(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes TO authenticated;
GRANT ALL ON public.study_notes TO service_role;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sn_self ON public.study_notes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.study_notes');

-- Bookmarks ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  label text,
  timestamp_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_bookmarks_user ON public.study_bookmarks(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_bookmarks TO authenticated;
GRANT ALL ON public.study_bookmarks TO service_role;
ALTER TABLE public.study_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY sb_self ON public.study_bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Flashcards (SM-2) ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  deck text,
  front text NOT NULL,
  back text NOT NULL,
  ease numeric(4,2) NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flash_user_due ON public.study_flashcards(user_id, next_review_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_flashcards TO authenticated;
GRANT ALL ON public.study_flashcards TO service_role;
ALTER TABLE public.study_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY fc_self ON public.study_flashcards FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.study_flashcards');

-- Study plans ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  goal text,
  target_at timestamptz,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_user ON public.study_plans(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY sp_self ON public.study_plans FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.study_plans');

-- Study sessions (learning-time log) ----------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  mode text,
  seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ssn_user_day ON public.study_sessions(user_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ss_self ON public.study_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Content-creator uploads ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  size_bytes bigint,
  status text NOT NULL DEFAULT 'pending',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uploads_company ON public.content_uploads(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_creator ON public.content_uploads(creator_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_uploads TO authenticated;
GRANT ALL ON public.content_uploads TO service_role;
ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY cu_read ON public.content_uploads FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR (status = 'published' AND (company_id IS NULL OR public.is_company_member(auth.uid(), company_id)))
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  );
CREATE POLICY cu_insert ON public.content_uploads FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());
CREATE POLICY cu_update ON public.content_uploads FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (creator_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY cu_delete ON public.content_uploads FOR DELETE TO authenticated
  USING (creator_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.content_uploads');

-- AI tutor sessions ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'teacher',
  topic text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tutor_user ON public.ai_tutor_sessions(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_tutor_sessions TO authenticated;
GRANT ALL ON public.ai_tutor_sessions TO service_role;
ALTER TABLE public.ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ats_self ON public.ai_tutor_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.ai_tutor_sessions');
