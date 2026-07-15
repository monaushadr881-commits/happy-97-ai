
-- R41 Voice Intelligence Runtime

CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  channel TEXT NOT NULL,
  provider TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  style TEXT NOT NULL DEFAULT 'business' CHECK (style IN ('business','teaching','founder','presentation','neutral')),
  pitch NUMERIC,
  rate NUMERIC,
  volume NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended','timeout','error')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,
  error TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.voice_sessions TO authenticated;
GRANT ALL ON public.voice_sessions TO service_role;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_sessions_owner_read" ON public.voice_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "voice_sessions_owner_write" ON public.voice_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voice_sessions_owner_update" ON public.voice_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_ops_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_ops_admin(auth.uid()));
CREATE INDEX idx_voice_sessions_user ON public.voice_sessions(user_id, started_at DESC);
CREATE INDEX idx_voice_sessions_company ON public.voice_sessions(company_id, started_at DESC);

CREATE TABLE public.voice_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  kind TEXT NOT NULL CHECK (kind IN ('text','audio','transcript','partial')),
  text TEXT,
  language TEXT,
  provider TEXT,
  voice_id TEXT,
  audio_ref TEXT,
  audio_bytes BIGINT,
  duration_ms INTEGER,
  latency_ms INTEGER,
  interrupted BOOLEAN NOT NULL DEFAULT false,
  timings JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.voice_turns TO authenticated;
GRANT ALL ON public.voice_turns TO service_role;
ALTER TABLE public.voice_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_turns_read" ON public.voice_turns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id
    AND (s.user_id = auth.uid() OR public.is_ops_admin(auth.uid())
      OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id)))));
CREATE POLICY "voice_turns_write" ON public.voice_turns FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "voice_turns_update" ON public.voice_turns FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))));
CREATE INDEX idx_voice_turns_session ON public.voice_turns(session_id, started_at);

CREATE TABLE public.voice_interruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  turn_id UUID REFERENCES public.voice_turns(id) ON DELETE SET NULL,
  cause TEXT NOT NULL CHECK (cause IN ('user_speak','user_cancel','network','timeout','provider_error','system')),
  from_state TEXT,
  to_state TEXT,
  offset_ms INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.voice_interruptions TO authenticated;
GRANT ALL ON public.voice_interruptions TO service_role;
ALTER TABLE public.voice_interruptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_interruptions_read" ON public.voice_interruptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id
    AND (s.user_id = auth.uid() OR public.is_ops_admin(auth.uid())
      OR (s.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), s.company_id)))));
CREATE POLICY "voice_interruptions_write" ON public.voice_interruptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.voice_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
-- Immutable: no UPDATE / DELETE policies.
CREATE INDEX idx_voice_interruptions_session ON public.voice_interruptions(session_id, created_at);

CREATE TABLE public.voice_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('lovable','openai','gemini','elevenlabs')),
  voice_id TEXT NOT NULL,
  label TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT true,
  style_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider, voice_id, language)
);
GRANT SELECT ON public.voice_provider_configs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.voice_provider_configs TO authenticated;
GRANT ALL ON public.voice_provider_configs TO service_role;
ALTER TABLE public.voice_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_provider_configs_read" ON public.voice_provider_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "voice_provider_configs_ops_write" ON public.voice_provider_configs FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.voice_provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.voice_provider_health TO authenticated;
GRANT ALL ON public.voice_provider_health TO service_role;
ALTER TABLE public.voice_provider_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_provider_health_read" ON public.voice_provider_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "voice_provider_health_ops_write" ON public.voice_provider_health FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_voice_provider_health ON public.voice_provider_health(provider, checked_at DESC);

CREATE TABLE public.voice_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0,
  total_duration_ms BIGINT NOT NULL DEFAULT 0,
  interruptions INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER,
  failure_rate NUMERIC,
  by_provider JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_language JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.voice_analytics_snapshots TO authenticated;
GRANT ALL ON public.voice_analytics_snapshots TO service_role;
ALTER TABLE public.voice_analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_analytics_read" ON public.voice_analytics_snapshots FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "voice_analytics_write" ON public.voice_analytics_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_voice_sessions_updated BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_voice_provider_configs_updated BEFORE UPDATE ON public.voice_provider_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
