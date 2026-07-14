
CREATE TABLE IF NOT EXISTS public.dh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'assistant',
  surface text NOT NULL DEFAULT 'conversation',
  title text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dh_sessions_user ON public.dh_sessions(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dh_sessions TO authenticated;
GRANT ALL ON public.dh_sessions TO service_role;
ALTER TABLE public.dh_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dh_sessions_self ON public.dh_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.dh_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  voice text NOT NULL DEFAULT 'alloy',
  language text NOT NULL DEFAULT 'en',
  speed numeric(3,2) NOT NULL DEFAULT 1.00,
  captions boolean NOT NULL DEFAULT true,
  reduced_motion boolean NOT NULL DEFAULT false,
  high_contrast boolean NOT NULL DEFAULT false,
  large_text boolean NOT NULL DEFAULT false,
  mute_audio boolean NOT NULL DEFAULT false,
  emotion_adaptation boolean NOT NULL DEFAULT false,
  memory_enabled boolean NOT NULL DEFAULT true,
  camera_consent boolean NOT NULL DEFAULT false,
  microphone_consent boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dh_preferences TO authenticated;
GRANT ALL ON public.dh_preferences TO service_role;
ALTER TABLE public.dh_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY dh_prefs_self ON public.dh_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.dh_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  audience text,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dh_pres_user ON public.dh_presentations(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dh_presentations TO authenticated;
GRANT ALL ON public.dh_presentations TO service_role;
ALTER TABLE public.dh_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY dh_pres_self ON public.dh_presentations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
