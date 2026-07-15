
-- R43 Presentation & Whiteboard Runtime

CREATE TABLE public.presentation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presenter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  voice_session_id UUID,
  presentation_type TEXT NOT NULL CHECK (presentation_type IN (
    'founder_briefing','investor_pitch','company_overview','business_review',
    'sales_demo','product_demo','training','learning','meeting','workshop',
    'research','factory_tour','marketplace_demo','website_demo','application_demo'
  )),
  mode TEXT NOT NULL DEFAULT 'business' CHECK (mode IN (
    'founder','business','learning','teaching','presentation','meeting','workshop'
  )),
  title TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT 'preparing' CHECK (state IN (
    'preparing','waiting','presenting','teaching','question_answer','paused','finished','cancelled'
  )),
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_slide_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.presentation_sessions TO authenticated;
GRANT ALL ON public.presentation_sessions TO service_role;
ALTER TABLE public.presentation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_sessions_read" ON public.presentation_sessions FOR SELECT TO authenticated
  USING (auth.uid() = presenter_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
    OR participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)));
CREATE POLICY "presentation_sessions_insert" ON public.presentation_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = presenter_id);
CREATE POLICY "presentation_sessions_update" ON public.presentation_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = presenter_id OR public.is_ops_admin(auth.uid()))
  WITH CHECK (auth.uid() = presenter_id OR public.is_ops_admin(auth.uid()));
CREATE INDEX idx_presentation_sessions_presenter ON public.presentation_sessions(presenter_id, created_at DESC);
CREATE INDEX idx_presentation_sessions_company ON public.presentation_sessions(company_id, created_at DESC);
CREATE INDEX idx_presentation_sessions_state ON public.presentation_sessions(state, created_at DESC);
CREATE TRIGGER trg_touch_presentation_sessions BEFORE UPDATE ON public.presentation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.presentation_sessions(id) ON DELETE CASCADE,
  scene_index INTEGER NOT NULL DEFAULT 0 CHECK (scene_index >= 0),
  slide_index INTEGER NOT NULL CHECK (slide_index >= 0),
  chapter TEXT,
  kind TEXT NOT NULL DEFAULT 'slide' CHECK (kind IN ('slide','scene','chapter','question','exercise','summary','whiteboard')),
  title TEXT NOT NULL,
  body TEXT,
  reference_type TEXT,
  reference_id UUID,
  transition TEXT NOT NULL DEFAULT 'cut' CHECK (transition IN ('cut','fade','slide_left','slide_right','zoom')),
  narration TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, slide_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentation_slides TO authenticated;
GRANT ALL ON public.presentation_slides TO service_role;
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_slides_read" ON public.presentation_slides FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id
    AND (s.presenter_id = auth.uid() OR public.is_ops_admin(auth.uid())
      OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id))
      OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE POLICY "presentation_slides_write" ON public.presentation_slides FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid()));
CREATE POLICY "presentation_slides_update" ON public.presentation_slides FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid()));
CREATE POLICY "presentation_slides_delete" ON public.presentation_slides FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid()));
CREATE INDEX idx_presentation_slides_session ON public.presentation_slides(session_id, slide_index);
CREATE TRIGGER trg_touch_presentation_slides BEFORE UPDATE ON public.presentation_slides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.presentation_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.presentation_sessions(id) ON DELETE CASCADE,
  issuer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('slide','whiteboard','pointer','annotation','teaching','session')),
  command TEXT NOT NULL,
  target_slide_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sequence BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.presentation_commands TO authenticated;
GRANT ALL ON public.presentation_commands TO service_role;
ALTER TABLE public.presentation_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_commands_read" ON public.presentation_commands FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id
    AND (s.presenter_id = auth.uid() OR public.is_ops_admin(auth.uid())
      OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id))
      OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE POLICY "presentation_commands_write" ON public.presentation_commands FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = issuer_id AND EXISTS (
    SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id
      AND (s.presenter_id = auth.uid()
        OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE INDEX idx_presentation_commands_session ON public.presentation_commands(session_id, sequence);
CREATE INDEX idx_presentation_commands_channel ON public.presentation_commands(session_id, channel, created_at);
CREATE TRIGGER trg_presentation_commands_immutable
  BEFORE UPDATE OR DELETE ON public.presentation_commands
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

CREATE TABLE public.presentation_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.presentation_sessions(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES public.presentation_slides(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note','highlight','question','answer','action','decision')),
  body TEXT NOT NULL,
  region JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.presentation_annotations TO authenticated;
GRANT ALL ON public.presentation_annotations TO service_role;
ALTER TABLE public.presentation_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_annotations_read" ON public.presentation_annotations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id
    AND (s.presenter_id = auth.uid() OR public.is_ops_admin(auth.uid())
      OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id))
      OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE POLICY "presentation_annotations_write" ON public.presentation_annotations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id
      AND (s.presenter_id = auth.uid()
        OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE POLICY "presentation_annotations_update" ON public.presentation_annotations FOR UPDATE TO authenticated
  USING (auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid())
    OR public.is_ops_admin(auth.uid()))
  WITH CHECK (auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.presentation_sessions s WHERE s.id = session_id AND s.presenter_id = auth.uid())
    OR public.is_ops_admin(auth.uid()));
CREATE INDEX idx_presentation_annotations_session ON public.presentation_annotations(session_id, created_at DESC);
CREATE TRIGGER trg_touch_presentation_annotations BEFORE UPDATE ON public.presentation_annotations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.presentation_annotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES public.presentation_annotations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  region JSONB NOT NULL DEFAULT '{}'::jsonb,
  kind TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (annotation_id, version)
);
GRANT SELECT, INSERT ON public.presentation_annotation_versions TO authenticated;
GRANT ALL ON public.presentation_annotation_versions TO service_role;
ALTER TABLE public.presentation_annotation_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_annotation_versions_read" ON public.presentation_annotation_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presentation_annotations a
    JOIN public.presentation_sessions s ON s.id = a.session_id
    WHERE a.id = annotation_id
      AND (s.presenter_id = auth.uid() OR public.is_ops_admin(auth.uid())
        OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id))
        OR s.participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text)))));
CREATE POLICY "presentation_annotation_versions_write" ON public.presentation_annotation_versions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = editor_id);
CREATE TRIGGER trg_presentation_annotation_versions_immutable
  BEFORE UPDATE OR DELETE ON public.presentation_annotation_versions
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

CREATE TABLE public.presentation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.presentation_sessions(id) ON DELETE CASCADE,
  presenter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  slides_total INTEGER NOT NULL DEFAULT 0,
  slides_shown INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  annotation_count INTEGER NOT NULL DEFAULT 0,
  pointer_count INTEGER NOT NULL DEFAULT 0,
  whiteboard_command_count INTEGER NOT NULL DEFAULT 0,
  interaction_rate NUMERIC NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  teaching_effectiveness NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.presentation_analytics TO authenticated;
GRANT ALL ON public.presentation_analytics TO service_role;
ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_analytics_read" ON public.presentation_analytics FOR SELECT TO authenticated
  USING (auth.uid() = presenter_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "presentation_analytics_write" ON public.presentation_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = presenter_id);
CREATE INDEX idx_presentation_analytics_session ON public.presentation_analytics(session_id, window_end DESC);
CREATE TRIGGER trg_presentation_analytics_immutable
  BEFORE UPDATE OR DELETE ON public.presentation_analytics
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

ALTER TABLE public.presentation_sessions
  ADD CONSTRAINT fk_presentation_sessions_current_slide
  FOREIGN KEY (current_slide_id) REFERENCES public.presentation_slides(id) ON DELETE SET NULL;
