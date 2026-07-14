
-- =====================================================================
-- HAPPY X — Phase 4: Enterprise Database Architecture v1.0
-- Assumes Phase 2 tables & security-definer helpers already exist:
--   is_platform_founder, is_company_member, is_company_admin,
--   is_workspace_member, user_has_permission, touch_updated_at
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================================
-- SHARED ENUMS
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.record_status AS ENUM ('draft','active','archived','deleted','pending','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_session_status AS ENUM ('active','ended','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('enrolled','in_progress','completed','dropped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_stage AS ENUM ('lead','qualified','proposal','negotiation','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','sent','paid','overdue','void','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','succeeded','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('in_app','email','sms','push','webhook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('queued','running','succeeded','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- HELPER: apply the standard updated_at trigger to a table
-- =====================================================================
CREATE OR REPLACE FUNCTION public._hxp_attach_touch(_tbl regclass)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE trig_name text;
BEGIN
  trig_name := 'trg_touch_' || replace(_tbl::text, 'public.', '');
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trig_name, _tbl);
  EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', trig_name, _tbl);
END $$;

-- =====================================================================
-- 01. USER PREFERENCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  theme text NOT NULL DEFAULT 'dark',
  reduced_motion boolean NOT NULL DEFAULT false,
  notification_channels jsonb NOT NULL DEFAULT '{"in_app":true,"email":true,"push":false}'::jsonb,
  ai_persona_id uuid,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY up_self ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.user_preferences');

-- =====================================================================
-- 02. AI BRAIN
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ai_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL,
  voice_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  avatar_url text,
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  is_public boolean NOT NULL DEFAULT false,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
CREATE INDEX IF NOT EXISTS idx_ai_personas_company ON public.ai_personas(company_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_personas TO authenticated;
GRANT ALL ON public.ai_personas TO service_role;
ALTER TABLE public.ai_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY personas_read ON public.ai_personas FOR SELECT TO authenticated
  USING (is_public OR company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY personas_write ON public.ai_personas FOR ALL TO authenticated
  USING (company_id IS NULL AND public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (company_id IS NULL AND public.is_platform_founder(auth.uid())
              OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.ai_personas');

CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  persona_id uuid REFERENCES public.ai_personas(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'chat',
  status public.ai_session_status NOT NULL DEFAULT 'active',
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  cost_cents integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON public.ai_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_company ON public.ai_sessions(company_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sessions TO authenticated;
GRANT ALL ON public.ai_sessions TO service_role;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_sessions_self ON public.ai_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.ai_sessions');

CREATE TABLE IF NOT EXISTS public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'user',
  key text NOT NULL,
  content text NOT NULL,
  importance smallint NOT NULL DEFAULT 3,
  embedding vector(1536),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, key)
);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON public.ai_memories(user_id, importance DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_memories_self ON public.ai_memories FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.ai_memories');

CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title text NOT NULL,
  source_url text,
  mime_type text,
  language text DEFAULT 'en',
  content_hash text,
  size_bytes bigint,
  status public.record_status NOT NULL DEFAULT 'active',
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_kd_company ON public.ai_knowledge_documents(company_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_knowledge_documents TO authenticated;
GRANT ALL ON public.ai_knowledge_documents TO service_role;
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_kd_read ON public.ai_knowledge_documents FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY ai_kd_write ON public.ai_knowledge_documents FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.ai_knowledge_documents');

CREATE TABLE IF NOT EXISTS public.ai_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.ai_knowledge_documents(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_doc ON public.ai_knowledge_chunks(document_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_knowledge_chunks TO authenticated;
GRANT ALL ON public.ai_knowledge_chunks TO service_role;
ALTER TABLE public.ai_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_chunks_read ON public.ai_knowledge_chunks FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY ai_chunks_write ON public.ai_knowledge_chunks FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.ai_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  objective text NOT NULL,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.job_status NOT NULL DEFAULT 'queued',
  progress smallint NOT NULL DEFAULT 0,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_missions TO authenticated;
GRANT ALL ON public.ai_missions TO service_role;
ALTER TABLE public.ai_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_missions_scope ON public.ai_missions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)))
  WITH CHECK (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.ai_missions');

-- =====================================================================
-- 03. EDUCATION
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  cover_url text,
  level text,
  language text DEFAULT 'en',
  duration_minutes integer,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_public boolean NOT NULL DEFAULT false,
  status public.record_status NOT NULL DEFAULT 'draft',
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_read ON public.courses FOR SELECT TO authenticated
  USING (is_public OR company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY courses_write ON public.courses FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.courses');

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_read ON public.course_modules FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id)
         OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_public));
CREATE POLICY cm_write ON public.course_modules FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.course_modules');

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'video',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  media_url text,
  duration_seconds integer,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY lessons_read ON public.lessons FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id)
         OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_public));
CREATE POLICY lessons_write ON public.lessons FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.lessons');

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status public.enrollment_status NOT NULL DEFAULT 'enrolled',
  progress_pct smallint NOT NULL DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enroll_scope ON public.course_enrollments FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.course_enrollments');

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  progress_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY lp_self ON public.lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.lesson_progress');

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  max_score numeric(10,2) NOT NULL DEFAULT 100,
  due_at timestamptz,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assn_read ON public.assignments FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY assn_write ON public.assignments FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.assignments');

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric(10,2),
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_owner ON public.assignment_submissions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.assignment_submissions');

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  time_limit_seconds integer,
  passing_score smallint NOT NULL DEFAULT 60,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quiz_read ON public.quizzes FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY quiz_write ON public.quizzes FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.quizzes');

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  prompt text NOT NULL,
  kind text NOT NULL DEFAULT 'single_choice',
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct jsonb NOT NULL DEFAULT '[]'::jsonb,
  points numeric(6,2) NOT NULL DEFAULT 1,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY qq_all ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id))
  WITH CHECK (EXISTS(SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.company_id IS NULL OR public.is_company_admin(auth.uid(), q.company_id))));
SELECT public._hxp_attach_touch('public.quiz_questions');

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric(6,2),
  passed boolean,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_self ON public.quiz_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.quiz_attempts');

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  serial text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY cert_read ON public.certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY cert_write ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));

-- =====================================================================
-- 04. KNOWLEDGE LIBRARY
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_categories TO authenticated;
GRANT SELECT ON public.knowledge_categories TO anon;
GRANT ALL ON public.knowledge_categories TO service_role;
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY kc_read ON public.knowledge_categories FOR SELECT USING (true);
CREATE POLICY kc_write ON public.knowledge_categories FOR ALL TO authenticated
  USING (company_id IS NULL AND public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (company_id IS NULL AND public.is_platform_founder(auth.uid())
              OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.knowledge_categories');

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  body text NOT NULL,
  cover_url text,
  language text NOT NULL DEFAULT 'en',
  is_public boolean NOT NULL DEFAULT false,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body,''))) STORED,
  status public.record_status NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_ka_search ON public.knowledge_articles USING gin(search_vector);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;
GRANT SELECT ON public.knowledge_articles TO anon;
GRANT ALL ON public.knowledge_articles TO service_role;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ka_read_public ON public.knowledge_articles FOR SELECT USING (is_public AND status = 'active');
CREATE POLICY ka_read_member ON public.knowledge_articles FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY ka_write ON public.knowledge_articles FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.knowledge_articles');

CREATE TABLE IF NOT EXISTS public.knowledge_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_references TO authenticated;
GRANT SELECT ON public.knowledge_references TO anon;
GRANT ALL ON public.knowledge_references TO service_role;
ALTER TABLE public.knowledge_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY kr_read ON public.knowledge_references FOR SELECT USING (true);
CREATE POLICY kr_write ON public.knowledge_references FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.knowledge_articles a WHERE a.id = article_id
                AND a.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), a.company_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.knowledge_articles a WHERE a.id = article_id
                     AND a.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), a.company_id)));

-- =====================================================================
-- 05. BUSINESS OS — CRM
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  code text,
  name text NOT NULL,
  email text,
  phone text,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_id text,
  status public.record_status NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(company_id, lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cust_scope ON public.customers FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.customers');

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  source text,
  stage public.deal_stage NOT NULL DEFAULT 'lead',
  score smallint NOT NULL DEFAULT 0,
  notes text,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_scope ON public.leads FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.leads');

CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stage public.deal_stage NOT NULL DEFAULT 'lead',
  probability smallint NOT NULL DEFAULT 20,
  expected_close_at timestamptz,
  closed_at timestamptz,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_scope ON public.deals FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.deals');

-- =====================================================================
-- 06. BUSINESS OS — ERP (Products / Inventory / Suppliers / Orders)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_scope ON public.product_categories FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.product_categories');

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sku text,
  name text NOT NULL,
  description text,
  price_cents bigint NOT NULL DEFAULT 0,
  cost_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  tax_rate_id uuid,
  is_service boolean NOT NULL DEFAULT false,
  weight_grams integer,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY prod_scope ON public.products FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.products');

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  email text, phone text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_id text,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY sup_scope ON public.suppliers FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.suppliers');

CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY wh_scope ON public.warehouses FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.warehouses');

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity numeric(18,4) NOT NULL DEFAULT 0,
  reserved numeric(18,4) NOT NULL DEFAULT 0,
  reorder_point numeric(18,4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_scope ON public.inventory_items FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.inventory_items');

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  number text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  status public.record_status NOT NULL DEFAULT 'draft',
  ordered_at timestamptz,
  received_at timestamptz,
  notes text,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_scope ON public.purchase_orders FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.purchase_orders');

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_cost_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY poi_scope ON public.purchase_order_items FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.purchase_orders p WHERE p.id = purchase_order_id AND public.is_company_member(auth.uid(), p.company_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.purchase_orders p WHERE p.id = purchase_order_id AND public.is_company_admin(auth.uid(), p.company_id)));

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  number text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  status public.record_status NOT NULL DEFAULT 'draft',
  ordered_at timestamptz,
  fulfilled_at timestamptz,
  notes text,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY so_scope ON public.sales_orders FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.sales_orders');

CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO authenticated;
GRANT ALL ON public.sales_order_items TO service_role;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY soi_scope ON public.sales_order_items FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.sales_orders s WHERE s.id = sales_order_id AND public.is_company_member(auth.uid(), s.company_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.sales_orders s WHERE s.id = sales_order_id AND public.is_company_member(auth.uid(), s.company_id)));

-- =====================================================================
-- 07. ACCOUNTING
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  parent_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_of_accounts TO authenticated;
GRANT ALL ON public.chart_of_accounts TO service_role;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY coa_scope ON public.chart_of_accounts FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.chart_of_accounts');

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  entry_date date NOT NULL,
  reference_type text,
  reference_id uuid,
  debit_cents bigint NOT NULL DEFAULT 0,
  credit_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS idx_ledger_company_date ON public.ledger_entries(company_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.ledger_entries(account_id, entry_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY led_scope ON public.ledger_entries FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  rate_bps integer NOT NULL,
  country text,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_rates TO authenticated;
GRANT ALL ON public.tax_rates TO service_role;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_scope ON public.tax_rates FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.tax_rates');
ALTER TABLE public.products ADD CONSTRAINT fk_products_tax FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  number text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  amount_paid_cents bigint NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id, issued_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv2_scope ON public.invoices FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.invoices');

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ii_scope ON public.invoice_items FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_company_member(auth.uid(), i.company_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_company_member(auth.uid(), i.company_id)));

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  provider text,
  provider_ref text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  received_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pay_scope ON public.payments FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.payments');

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text,
  vendor text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  spent_on date NOT NULL DEFAULT current_date,
  memo text,
  attachment_url text,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY exp_scope ON public.expenses FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.expenses');

-- =====================================================================
-- 08. CREATOR STUDIO
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.creative_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  description text,
  cover_url text,
  status public.record_status NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_projects TO authenticated;
GRANT ALL ON public.creative_projects TO service_role;
ALTER TABLE public.creative_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_scope ON public.creative_projects FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)))
  WITH CHECK (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.creative_projects');

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.creative_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  width integer, height integer, duration_seconds integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_assets TO authenticated;
GRANT ALL ON public.creative_assets TO service_role;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY ca_scope ON public.creative_assets FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)))
  WITH CHECK (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.creative_assets');

-- =====================================================================
-- 09. COMMUNITY
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_url text,
  visibility text NOT NULL DEFAULT 'public',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT ON public.groups TO anon;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY grp_read ON public.groups FOR SELECT USING (visibility = 'public' OR (auth.uid() IS NOT NULL AND owner_id = auth.uid()));
CREATE POLICY grp_write ON public.groups FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
SELECT public._hxp_attach_touch('public.groups');

CREATE TABLE IF NOT EXISTS public.group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_memberships TO authenticated;
GRANT ALL ON public.group_memberships TO service_role;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY gm_self ON public.group_memberships FOR ALL TO authenticated
  USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title text,
  body text NOT NULL,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'public',
  status public.record_status NOT NULL DEFAULT 'active',
  reply_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_read ON public.posts FOR SELECT USING (
  visibility = 'public' AND status = 'active'
  OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
);
CREATE POLICY posts_write ON public.posts FOR ALL TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
SELECT public._hxp_attach_touch('public.posts');

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  status public.record_status NOT NULL DEFAULT 'active',
  reaction_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comm_read ON public.comments FOR SELECT USING (status = 'active' OR (auth.uid() IS NOT NULL AND author_id = auth.uid()));
CREATE POLICY comm_write ON public.comments FOR ALL TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
SELECT public._hxp_attach_touch('public.comments');

CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY react_read ON public.reactions FOR SELECT USING (true);
CREATE POLICY react_write ON public.reactions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY fol_read ON public.follows FOR SELECT USING (true);
CREATE POLICY fol_write ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY fol_del  ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- =====================================================================
-- 10. MARKETPLACE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  price_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  cover_url text,
  category text,
  status public.record_status NOT NULL DEFAULT 'draft',
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY list_read ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY list_read_own ON public.listings FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY list_write ON public.listings FOR ALL TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
SELECT public._hxp_attach_touch('public.listings');

CREATE TABLE IF NOT EXISTS public.listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reviewer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_reviews TO authenticated;
GRANT SELECT ON public.listing_reviews TO anon;
GRANT ALL ON public.listing_reviews TO service_role;
ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY lr_read ON public.listing_reviews FOR SELECT USING (true);
CREATE POLICY lr_write ON public.listing_reviews FOR ALL TO authenticated
  USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider text,
  provider_ref text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_transactions TO authenticated;
GRANT ALL ON public.marketplace_transactions TO service_role;
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_scope ON public.marketplace_transactions FOR ALL TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());
SELECT public._hxp_attach_touch('public.marketplace_transactions');

-- =====================================================================
-- 11. NOTIFICATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  action_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_self ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  channel public.notification_channel NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY np_self ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.notification_preferences');

-- =====================================================================
-- 12. MEDIA LIBRARY
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  width integer, height integer, duration_seconds integer,
  checksum text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.record_status NOT NULL DEFAULT 'active',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_scope ON public.media_assets FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)))
  WITH CHECK (owner_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.media_assets');

-- =====================================================================
-- 13. API KEYS / WEBHOOKS / INTEGRATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  hashed_key text NOT NULL UNIQUE,
  prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY ak_scope ON public.api_keys FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.api_keys');

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY wh_scope ON public.webhooks FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.webhooks');

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  attempts smallint NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whd_webhook ON public.webhook_deliveries(webhook_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY whd_scope ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND public.is_company_admin(auth.uid(), w.company_id)));

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status public.record_status NOT NULL DEFAULT 'active',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials_ref text,
  connected_at timestamptz,
  connected_by uuid,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY intg_scope ON public.integrations FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.integrations');

-- =====================================================================
-- 14. AUTOMATION / WORKFLOWS / JOBS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY wf_scope ON public.workflows FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.workflows');

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status public.job_status NOT NULL DEFAULT 'queued',
  input jsonb, output jsonb, error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wr_workflow ON public.workflow_runs(workflow_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY wr_scope ON public.workflow_runs FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND public.is_company_member(auth.uid(), w.company_id)));

CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  cron text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_jobs TO authenticated;
GRANT ALL ON public.scheduled_jobs TO service_role;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sj_scope ON public.scheduled_jobs FOR ALL TO authenticated
  USING (company_id IS NULL AND public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (company_id IS NULL AND public.is_platform_founder(auth.uid())
              OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.scheduled_jobs');

CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority smallint NOT NULL DEFAULT 5,
  status public.job_status NOT NULL DEFAULT 'queued',
  attempts smallint NOT NULL DEFAULT 0,
  max_attempts smallint NOT NULL DEFAULT 5,
  run_after timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jq_ready ON public.job_queue(status, run_after) WHERE status = 'queued';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_queue TO authenticated;
GRANT ALL ON public.job_queue TO service_role;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY jq_scope ON public.job_queue FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_admin(auth.uid(), company_id));

-- =====================================================================
-- 15. FEATURE FLAGS & REMOTE CONFIG
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY ff_read ON public.feature_flags FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY ff_write ON public.feature_flags FOR ALL TO authenticated
  USING (company_id IS NULL AND public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (company_id IS NULL AND public.is_platform_founder(auth.uid())
              OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.feature_flags');

CREATE TABLE IF NOT EXISTS public.remote_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_config TO authenticated;
GRANT ALL ON public.remote_config TO service_role;
ALTER TABLE public.remote_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc_read ON public.remote_config FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY rc_write ON public.remote_config FOR ALL TO authenticated
  USING (company_id IS NULL AND public.is_platform_founder(auth.uid())
         OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)))
  WITH CHECK (company_id IS NULL AND public.is_platform_founder(auth.uid())
              OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
SELECT public._hxp_attach_touch('public.remote_config');

-- =====================================================================
-- 16. LOCALIZATION (public read reference tables)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.countries (
  code char(2) PRIMARY KEY,
  code3 char(3),
  name text NOT NULL,
  dial_code text,
  currency_code char(3),
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY cty_read ON public.countries FOR SELECT USING (true);
CREATE POLICY cty_write ON public.countries FOR ALL TO authenticated
  USING (public.is_platform_founder(auth.uid())) WITH CHECK (public.is_platform_founder(auth.uid()));

CREATE TABLE IF NOT EXISTS public.currencies (
  code char(3) PRIMARY KEY,
  name text NOT NULL,
  symbol text,
  decimals smallint NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.currencies TO anon, authenticated;
GRANT ALL ON public.currencies TO service_role;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY cur_read ON public.currencies FOR SELECT USING (true);
CREATE POLICY cur_write ON public.currencies FOR ALL TO authenticated
  USING (public.is_platform_founder(auth.uid())) WITH CHECK (public.is_platform_founder(auth.uid()));

CREATE TABLE IF NOT EXISTS public.languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  native_name text,
  is_rtl boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lng_read ON public.languages FOR SELECT USING (true);
CREATE POLICY lng_write ON public.languages FOR ALL TO authenticated
  USING (public.is_platform_founder(auth.uid())) WITH CHECK (public.is_platform_founder(auth.uid()));

INSERT INTO public.currencies(code, name, symbol) VALUES
  ('USD','US Dollar','$'), ('EUR','Euro','€'), ('GBP','British Pound','£'),
  ('INR','Indian Rupee','₹'), ('JPY','Japanese Yen','¥'), ('AUD','Australian Dollar','$'),
  ('CAD','Canadian Dollar','$'), ('AED','UAE Dirham','د.إ'), ('SGD','Singapore Dollar','$')
ON CONFLICT DO NOTHING;

INSERT INTO public.languages(code, name, native_name, is_rtl) VALUES
  ('en','English','English',false), ('hi','Hindi','हिन्दी',false),
  ('es','Spanish','Español',false), ('fr','French','Français',false),
  ('de','German','Deutsch',false), ('ar','Arabic','العربية',true),
  ('zh','Chinese','中文',false), ('ja','Japanese','日本語',false),
  ('pt','Portuguese','Português',false), ('ru','Russian','Русский',false)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 17. PRIVACY: CONSENT + DATA REQUESTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  policy_version text,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY cons_self ON public.consents FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status public.job_status NOT NULL DEFAULT 'queued',
  notes text,
  fulfilled_at timestamptz,
  export_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.data_requests TO authenticated;
GRANT ALL ON public.data_requests TO service_role;
ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY dr_self ON public.data_requests FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_founder(auth.uid()))
  WITH CHECK (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.data_requests');

-- =====================================================================
-- 18. VERSION HISTORY (universal snapshots)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  company_id uuid,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);
CREATE INDEX IF NOT EXISTS idx_ev_entity ON public.entity_versions(entity_type, entity_id, version DESC);
GRANT SELECT, INSERT ON public.entity_versions TO authenticated;
GRANT ALL ON public.entity_versions TO service_role;
ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ev_read ON public.entity_versions FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY ev_write ON public.entity_versions FOR INSERT TO authenticated
  WITH CHECK (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

-- =====================================================================
-- FINAL: hardening — helper function ownership
-- =====================================================================
REVOKE ALL ON FUNCTION public._hxp_attach_touch(regclass) FROM PUBLIC;
