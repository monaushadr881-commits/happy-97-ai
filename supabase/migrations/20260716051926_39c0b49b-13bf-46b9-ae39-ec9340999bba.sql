
CREATE TABLE IF NOT EXISTS public.happy_presence_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key text NOT NULL,
  state text NOT NULL DEFAULT 'connecting',
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  device jsonb NOT NULL DEFAULT '{}'::jsonb,
  network jsonb NOT NULL DEFAULT '{}'::jsonb,
  workspace_id uuid,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_key)
);
CREATE INDEX IF NOT EXISTS idx_hpe_presence_user ON public.happy_presence_sessions(user_id, last_heartbeat DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.happy_presence_sessions TO authenticated;
GRANT ALL ON public.happy_presence_sessions TO service_role;
ALTER TABLE public.happy_presence_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_presence_self ON public.happy_presence_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_hpe_presence_touch BEFORE UPDATE ON public.happy_presence_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.happy_relationship_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  personalization_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.happy_relationship_prefs TO authenticated;
GRANT ALL ON public.happy_relationship_prefs TO service_role;
ALTER TABLE public.happy_relationship_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_relationship_self ON public.happy_relationship_prefs FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_hpe_relationship_touch BEFORE UPDATE ON public.happy_relationship_prefs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.happy_language_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_lang text NOT NULL DEFAULT 'en',
  confidence numeric NOT NULL DEFAULT 0,
  recent_samples jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.happy_language_profile TO authenticated;
GRANT ALL ON public.happy_language_profile TO service_role;
ALTER TABLE public.happy_language_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_language_self ON public.happy_language_profile FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_hpe_language_touch BEFORE UPDATE ON public.happy_language_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.happy_live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'client',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hpe_live_events_user_time ON public.happy_live_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.happy_live_events TO authenticated;
GRANT ALL ON public.happy_live_events TO service_role;
ALTER TABLE public.happy_live_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_live_events_read ON public.happy_live_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hpe_live_events_insert ON public.happy_live_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.happy_live_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'happy_live_events are immutable'; END $$;
CREATE TRIGGER trg_hpe_live_events_immut BEFORE UPDATE OR DELETE ON public.happy_live_events
  FOR EACH ROW EXECUTE FUNCTION public.happy_live_events_immutable();

CREATE TABLE IF NOT EXISTS public.happy_proactive_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  tone text NOT NULL DEFAULT 'friendly',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  dispatched_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hpe_proactive_user_time ON public.happy_proactive_messages(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.happy_proactive_messages TO authenticated;
GRANT ALL ON public.happy_proactive_messages TO service_role;
ALTER TABLE public.happy_proactive_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_proactive_read ON public.happy_proactive_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hpe_proactive_write ON public.happy_proactive_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hpe_proactive_update ON public.happy_proactive_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.happy_founder_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hpe_founder_briefs_user_time ON public.happy_founder_briefs(user_id, generated_at DESC);
GRANT SELECT, INSERT ON public.happy_founder_briefs TO authenticated;
GRANT ALL ON public.happy_founder_briefs TO service_role;
ALTER TABLE public.happy_founder_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hpe_briefs_read ON public.happy_founder_briefs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY hpe_briefs_write ON public.happy_founder_briefs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
