
-- R42 Emotion & Expression Runtime

CREATE TABLE public.happy_emotion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  voice_session_id UUID,
  conversation_turn_id UUID,
  emotion TEXT NOT NULL CHECK (emotion IN (
    'neutral','greeting','happy','confident','listening','thinking','speaking','teaching',
    'presentation','business','founder','research','approval','concern','empathy','curiosity',
    'celebration','busy','offline'
  )),
  mood TEXT NOT NULL CHECK (mood IN (
    'calm','professional','friendly','energetic','serious','supportive','focused','learning','executive'
  )),
  presence TEXT NOT NULL,
  behavior_mode TEXT NOT NULL,
  emotion_weight NUMERIC NOT NULL DEFAULT 1 CHECK (emotion_weight >= 0 AND emotion_weight <= 1),
  mood_weight NUMERIC NOT NULL DEFAULT 1 CHECK (mood_weight >= 0 AND mood_weight <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_emotion_events TO authenticated;
GRANT ALL ON public.happy_emotion_events TO service_role;
ALTER TABLE public.happy_emotion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_emotion_events_read" ON public.happy_emotion_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "happy_emotion_events_write" ON public.happy_emotion_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_happy_emotion_events_user ON public.happy_emotion_events(user_id, created_at DESC);
CREATE INDEX idx_happy_emotion_events_session ON public.happy_emotion_events(happy_session_id, created_at);
CREATE INDEX idx_happy_emotion_events_company ON public.happy_emotion_events(company_id, created_at DESC);
CREATE TRIGGER trg_happy_emotion_events_immutable
  BEFORE UPDATE OR DELETE ON public.happy_emotion_events
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

CREATE TABLE public.happy_expression_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  emotion_event_id UUID REFERENCES public.happy_emotion_events(id) ON DELETE SET NULL,
  t_ms INTEGER NOT NULL CHECK (t_ms >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  eye_open NUMERIC NOT NULL DEFAULT 1 CHECK (eye_open >= 0 AND eye_open <= 1),
  blink BOOLEAN NOT NULL DEFAULT false,
  double_blink BOOLEAN NOT NULL DEFAULT false,
  smile_amount NUMERIC NOT NULL DEFAULT 0 CHECK (smile_amount >= 0 AND smile_amount <= 1),
  jaw_intent NUMERIC NOT NULL DEFAULT 0 CHECK (jaw_intent >= 0 AND jaw_intent <= 1),
  brow_intent NUMERIC NOT NULL DEFAULT 0 CHECK (brow_intent >= -1 AND brow_intent <= 1),
  head_turn NUMERIC NOT NULL DEFAULT 0 CHECK (head_turn >= -1 AND head_turn <= 1),
  head_tilt NUMERIC NOT NULL DEFAULT 0 CHECK (head_tilt >= -1 AND head_tilt <= 1),
  shoulder_intent NUMERIC NOT NULL DEFAULT 0 CHECK (shoulder_intent >= -1 AND shoulder_intent <= 1),
  hand_gesture TEXT NOT NULL DEFAULT 'idle',
  body_pose TEXT NOT NULL DEFAULT 'neutral',
  breathing_level NUMERIC NOT NULL DEFAULT 0.5 CHECK (breathing_level >= 0 AND breathing_level <= 1),
  attention_level NUMERIC NOT NULL DEFAULT 0.5 CHECK (attention_level >= 0 AND attention_level <= 1),
  interest_level NUMERIC NOT NULL DEFAULT 0.5 CHECK (interest_level >= 0 AND interest_level <= 1),
  speaking_energy NUMERIC NOT NULL DEFAULT 0 CHECK (speaking_energy >= 0 AND speaking_energy <= 1),
  viseme_sync_ref TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_expression_frames TO authenticated;
GRANT ALL ON public.happy_expression_frames TO service_role;
ALTER TABLE public.happy_expression_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_expression_frames_read" ON public.happy_expression_frames FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "happy_expression_frames_write" ON public.happy_expression_frames FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_happy_expression_frames_session ON public.happy_expression_frames(happy_session_id, t_ms);
CREATE INDEX idx_happy_expression_frames_user ON public.happy_expression_frames(user_id, created_at DESC);
CREATE TRIGGER trg_happy_expression_frames_immutable
  BEFORE UPDATE OR DELETE ON public.happy_expression_frames
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

CREATE TABLE public.happy_gesture_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  emotion_event_id UUID REFERENCES public.happy_emotion_events(id) ON DELETE SET NULL,
  intent TEXT NOT NULL CHECK (intent IN (
    'idle','greeting','wave','point_left','point_right','explain','present','teach',
    'listen','think','celebrate','thank_you','goodbye'
  )),
  target TEXT,
  intensity NUMERIC NOT NULL DEFAULT 0.5 CHECK (intensity >= 0 AND intensity <= 1),
  duration_ms INTEGER NOT NULL DEFAULT 800 CHECK (duration_ms >= 0),
  reason TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_gesture_intents TO authenticated;
GRANT ALL ON public.happy_gesture_intents TO service_role;
ALTER TABLE public.happy_gesture_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_gesture_intents_read" ON public.happy_gesture_intents FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "happy_gesture_intents_write" ON public.happy_gesture_intents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_happy_gesture_intents_session ON public.happy_gesture_intents(happy_session_id, created_at);
CREATE TRIGGER trg_happy_gesture_intents_immutable
  BEFORE UPDATE OR DELETE ON public.happy_gesture_intents
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

CREATE TABLE public.happy_mood_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  mood TEXT NOT NULL,
  behavior_mode TEXT NOT NULL,
  average_energy NUMERIC NOT NULL DEFAULT 0 CHECK (average_energy >= 0 AND average_energy <= 1),
  average_attention NUMERIC NOT NULL DEFAULT 0 CHECK (average_attention >= 0 AND average_attention <= 1),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0 CHECK (sample_count >= 0),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_mood_snapshots TO authenticated;
GRANT ALL ON public.happy_mood_snapshots TO service_role;
ALTER TABLE public.happy_mood_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_mood_snapshots_read" ON public.happy_mood_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "happy_mood_snapshots_write" ON public.happy_mood_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_happy_mood_snapshots_session ON public.happy_mood_snapshots(happy_session_id, window_end DESC);

CREATE TABLE public.happy_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  default_emotion TEXT NOT NULL,
  default_mood TEXT NOT NULL,
  emotion_weight NUMERIC NOT NULL DEFAULT 1 CHECK (emotion_weight >= 0 AND emotion_weight <= 1),
  gesture_weight NUMERIC NOT NULL DEFAULT 1 CHECK (gesture_weight >= 0 AND gesture_weight <= 1),
  speech_style TEXT NOT NULL DEFAULT 'business',
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.happy_behavior_profiles TO authenticated;
GRANT ALL ON public.happy_behavior_profiles TO service_role;
ALTER TABLE public.happy_behavior_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_behavior_profiles_read" ON public.happy_behavior_profiles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "happy_behavior_profiles_admin_write" ON public.happy_behavior_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY "happy_behavior_profiles_admin_update" ON public.happy_behavior_profiles FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY "happy_behavior_profiles_admin_delete" ON public.happy_behavior_profiles FOR DELETE TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_happy_behavior_profiles BEFORE UPDATE ON public.happy_behavior_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.happy_emotion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  happy_session_id UUID,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  emotion_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  mode_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  gesture_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  expression_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  average_speaking_energy NUMERIC NOT NULL DEFAULT 0,
  average_listening_time_ms INTEGER NOT NULL DEFAULT 0,
  conversation_quality NUMERIC NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_emotion_analytics TO authenticated;
GRANT ALL ON public.happy_emotion_analytics TO service_role;
ALTER TABLE public.happy_emotion_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_emotion_analytics_read" ON public.happy_emotion_analytics FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.is_ops_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "happy_emotion_analytics_write" ON public.happy_emotion_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_happy_emotion_analytics_session ON public.happy_emotion_analytics(happy_session_id, window_end DESC);
CREATE TRIGGER trg_happy_emotion_analytics_immutable
  BEFORE UPDATE OR DELETE ON public.happy_emotion_analytics
  FOR EACH ROW EXECUTE FUNCTION public.memory_events_immutable();

-- Seed default behavior profiles
INSERT INTO public.happy_behavior_profiles (code, label, default_emotion, default_mood, emotion_weight, gesture_weight, speech_style, weights) VALUES
  ('founder',      'Founder',       'founder',      'executive',    1.0, 0.6, 'founder',      '{"formality":0.9,"warmth":0.7}'::jsonb),
  ('business',     'Business',      'business',     'professional', 0.9, 0.5, 'business',     '{"formality":0.8,"warmth":0.6}'::jsonb),
  ('receptionist', 'Receptionist',  'greeting',     'friendly',     0.9, 0.8, 'neutral',      '{"formality":0.6,"warmth":0.9}'::jsonb),
  ('sales',        'Sales',         'confident',    'energetic',    1.0, 0.9, 'business',     '{"formality":0.7,"warmth":0.8}'::jsonb),
  ('support',      'Support',       'empathy',      'supportive',   0.9, 0.6, 'neutral',      '{"formality":0.5,"warmth":1.0}'::jsonb),
  ('research',     'Research',      'research',     'focused',      0.7, 0.4, 'teaching',     '{"formality":0.7,"warmth":0.5}'::jsonb),
  ('meeting',      'Meeting',       'listening',    'professional', 0.8, 0.4, 'business',     '{"formality":0.8,"warmth":0.6}'::jsonb),
  ('learning',     'Learning',      'teaching',     'learning',     0.9, 0.7, 'teaching',     '{"formality":0.6,"warmth":0.8}'::jsonb),
  ('presentation', 'Presentation',  'presentation', 'energetic',    1.0, 0.9, 'presentation', '{"formality":0.8,"warmth":0.7}'::jsonb);
