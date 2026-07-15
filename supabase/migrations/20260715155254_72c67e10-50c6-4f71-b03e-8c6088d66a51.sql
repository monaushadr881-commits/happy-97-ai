
-- R38 Founder Copilot Workspace — orchestration-only schema.

CREATE TABLE IF NOT EXISTS public.founder_workspace_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_modules text[] NOT NULL DEFAULT '{}',
  favorite_dashboards text[] NOT NULL DEFAULT '{}',
  recent_projects uuid[] NOT NULL DEFAULT '{}',
  saved_views jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL DEFAULT 'system',
  language text NOT NULL DEFAULT 'en',
  accessibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_workspace_prefs TO authenticated;
GRANT ALL ON public.founder_workspace_prefs TO service_role;
ALTER TABLE public.founder_workspace_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs read" ON public.founder_workspace_prefs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own prefs insert" ON public.founder_workspace_prefs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own prefs update" ON public.founder_workspace_prefs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own prefs delete" ON public.founder_workspace_prefs FOR DELETE TO authenticated USING (user_id = auth.uid());
SELECT public._hxp_attach_touch('public.founder_workspace_prefs');

CREATE TABLE IF NOT EXISTS public.founder_command_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  command_text text NOT NULL,
  input_mode text NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text','voice','shortcut')),
  intent text,
  capability text,
  target_runtime text,
  status text NOT NULL DEFAULT 'dispatched'
    CHECK (status IN ('dispatched','completed','failed','ambiguous')),
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_founder_cmd_user_time ON public.founder_command_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_cmd_runtime ON public.founder_command_history(target_runtime, created_at DESC);
GRANT SELECT, INSERT ON public.founder_command_history TO authenticated;
GRANT ALL ON public.founder_command_history TO service_role;
ALTER TABLE public.founder_command_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cmds read" ON public.founder_command_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_founder(auth.uid()));
CREATE POLICY "own cmds insert" ON public.founder_command_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.founder_command_history_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'founder_command_history entries are immutable'; END $$;
DROP TRIGGER IF EXISTS trg_founder_cmd_immutable ON public.founder_command_history;
CREATE TRIGGER trg_founder_cmd_immutable
  BEFORE UPDATE OR DELETE ON public.founder_command_history
  FOR EACH ROW EXECUTE FUNCTION public.founder_command_history_immutable();

CREATE TABLE IF NOT EXISTS public.founder_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('daily','weekly','monthly','quarterly','annual')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_runtimes text[] NOT NULL DEFAULT '{}',
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, period, period_start)
);
CREATE INDEX IF NOT EXISTS idx_founder_briefings_lookup ON public.founder_briefings(company_id, period, period_start DESC);
GRANT SELECT, INSERT ON public.founder_briefings TO authenticated;
GRANT ALL ON public.founder_briefings TO service_role;
ALTER TABLE public.founder_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefings read" ON public.founder_briefings FOR SELECT TO authenticated USING (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
CREATE POLICY "briefings insert" ON public.founder_briefings FOR INSERT TO authenticated WITH CHECK (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);

CREATE TABLE IF NOT EXISTS public.founder_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('fact','ai')),
  category text NOT NULL,
  title text NOT NULL,
  body text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4),
  source_runtime text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','acknowledged','dismissed','actioned','expired')),
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (kind = 'fact' OR (kind = 'ai' AND confidence IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_founder_recs_company_kind ON public.founder_recommendations(company_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_recs_status ON public.founder_recommendations(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.founder_recommendations TO authenticated;
GRANT ALL ON public.founder_recommendations TO service_role;
ALTER TABLE public.founder_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs read" ON public.founder_recommendations FOR SELECT TO authenticated USING (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
CREATE POLICY "recs insert" ON public.founder_recommendations FOR INSERT TO authenticated WITH CHECK (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
CREATE POLICY "recs update" ON public.founder_recommendations FOR UPDATE TO authenticated USING (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
) WITH CHECK (
  public.is_platform_founder(auth.uid())
  OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
);
