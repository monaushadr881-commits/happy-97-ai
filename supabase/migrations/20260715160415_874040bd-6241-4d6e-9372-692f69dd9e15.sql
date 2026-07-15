
CREATE OR REPLACE FUNCTION public.happy_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.happy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('website','mobile','desktop','presentation','reception','meeting','training','api')),
  audience TEXT NOT NULL CHECK (audience IN ('founder','employee','customer','visitor','student','system')),
  persona TEXT NOT NULL,
  mode TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  presence TEXT NOT NULL DEFAULT 'idle' CHECK (presence IN ('idle','listening','thinking','speaking','presenting','teaching','waiting','busy','offline')),
  client_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.happy_sessions TO authenticated;
GRANT ALL ON public.happy_sessions TO service_role;
ALTER TABLE public.happy_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_sessions_owner_rw" ON public.happy_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "happy_sessions_ops_read" ON public.happy_sessions FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_happy_sessions_user ON public.happy_sessions(user_id, started_at DESC);
CREATE INDEX idx_happy_sessions_channel ON public.happy_sessions(channel, started_at DESC);

CREATE TABLE public.happy_conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.happy_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  turn_index INT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','happy','system','tool')),
  intent TEXT,
  capability TEXT,
  message TEXT,
  response TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  latency_ms INT,
  tokens_in INT,
  tokens_out INT,
  error TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_conversation_turns TO authenticated;
GRANT ALL ON public.happy_conversation_turns TO service_role;
ALTER TABLE public.happy_conversation_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_turns_owner_rw" ON public.happy_conversation_turns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "happy_turns_ops_read" ON public.happy_conversation_turns FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_happy_turns_session ON public.happy_conversation_turns(session_id, turn_index);

CREATE TABLE public.happy_presence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.happy_sessions(id) ON DELETE CASCADE,
  presence TEXT NOT NULL CHECK (presence IN ('idle','listening','thinking','speaking','presenting','teaching','waiting','busy','offline')),
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_presence_events TO authenticated;
GRANT ALL ON public.happy_presence_events TO service_role;
ALTER TABLE public.happy_presence_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_presence_owner_rw" ON public.happy_presence_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "happy_presence_ops_read" ON public.happy_presence_events FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_happy_presence_session ON public.happy_presence_events(session_id, occurred_at DESC);

CREATE TABLE public.happy_mode_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.happy_sessions(id) ON DELETE CASCADE,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  reason TEXT,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_mode_transitions TO authenticated;
GRANT ALL ON public.happy_mode_transitions TO service_role;
ALTER TABLE public.happy_mode_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_mode_owner_rw" ON public.happy_mode_transitions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.happy_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "happy_mode_ops_read" ON public.happy_mode_transitions FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_greeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  audience TEXT CHECK (audience IN ('founder','employee','customer','visitor','student','system')),
  channel TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning','afternoon','evening','night','any')) DEFAULT 'any',
  template TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, locale, audience, channel, time_of_day)
);
GRANT SELECT ON public.happy_greeting_templates TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.happy_greeting_templates TO authenticated;
GRANT ALL ON public.happy_greeting_templates TO service_role;
ALTER TABLE public.happy_greeting_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_greetings_read" ON public.happy_greeting_templates FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "happy_greetings_ops_write" ON public.happy_greeting_templates FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TRIGGER trg_happy_sessions_updated BEFORE UPDATE ON public.happy_sessions
  FOR EACH ROW EXECUTE FUNCTION public.happy_touch_updated_at();
CREATE TRIGGER trg_happy_greetings_updated BEFORE UPDATE ON public.happy_greeting_templates
  FOR EACH ROW EXECUTE FUNCTION public.happy_touch_updated_at();

INSERT INTO public.happy_greeting_templates (key, locale, audience, channel, time_of_day, template, priority) VALUES
  ('default','en','founder',NULL,'morning','Good morning, {{user_name}}. HAPPY reporting for duty at {{company}}. {{briefing_summary}}',100),
  ('default','en','founder',NULL,'afternoon','Good afternoon, {{user_name}}. HAPPY here with your {{company}} briefing. {{briefing_summary}}',100),
  ('default','en','founder',NULL,'evening','Good evening, {{user_name}}. HAPPY closing out the day at {{company}}. {{briefing_summary}}',100),
  ('default','en','founder',NULL,'night','Working late, {{user_name}}? HAPPY is with you at {{company}}.',100),
  ('default','en','employee',NULL,'any','Hi {{user_name}}, HAPPY here. How can I help at {{company}} today?',60),
  ('default','en','customer','website','any','Welcome to {{company}}. I''m HAPPY, your AI representative. How may I help?',60),
  ('default','en','customer','reception','any','Welcome to {{company}}. I''m HAPPY. Please tell me who you''re here to see.',80),
  ('default','en','visitor',NULL,'any','Hello, I''m HAPPY, the AI employee of {{company}}. What brings you in?',40),
  ('default','en','student','training','any','Welcome to today''s session. I''m HAPPY, your trainer at {{company}}.',60),
  ('default','en',NULL,'meeting','any','Meeting ready. HAPPY on standby for {{company}}.',30),
  ('default','en',NULL,'presentation','any','Presentation loaded. HAPPY presenting on behalf of {{company}}.',30),
  ('default','en',NULL,NULL,'any','Hello. I''m HAPPY, the AI employee of {{company}}. How can I help?',10),
  ('default','hi',NULL,NULL,'any','नमस्ते। मैं HAPPY हूँ, {{company}} का AI कर्मचारी। मैं आपकी क्या मदद कर सकता हूँ?',10),
  ('default','ur',NULL,NULL,'any','السلام علیکم۔ میں HAPPY ہوں، {{company}} کا AI ملازم۔ میں آپ کی کیا مدد کر سکتا ہوں؟',10);
