-- R27 HAPPY Brain runtime
CREATE TABLE public.brain_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('voice','chat','palette','api','digital_human','automation','founder','job')),
  channel text,                     -- app/module the request originated from
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','running','completed','failed','cancelled')),
  input text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,     -- company/module/screen/permissions snapshot
  summary text,
  founder_mode boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_sessions_company_started ON public.brain_sessions (company_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.brain_sessions TO authenticated;
GRANT ALL ON public.brain_sessions TO service_role;
ALTER TABLE public.brain_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_sessions read own or admin" ON public.brain_sessions FOR SELECT TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR user_id = auth.uid());
CREATE POLICY "brain_sessions insert own" ON public.brain_sessions FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "brain_sessions update own or admin" ON public.brain_sessions FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR user_id = auth.uid())
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR user_id = auth.uid());
CREATE TRIGGER trg_touch_brain_sessions BEFORE UPDATE ON public.brain_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.brain_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.brain_sessions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  intent text NOT NULL,               -- business|finance|sales|crm|erp|builder|marketplace|analytics|support|conversation|unknown
  action text,                        -- domain verb: create_website, run_report, list_invoices, ...
  entity_type text,                   -- invoice|deal|listing|report|...
  entity_id uuid,
  confidence numeric NOT NULL DEFAULT 0,
  alternatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  chosen_runtime text,                -- revenue|crm|erp|finance|wms|mfg|marketplace|builder|deployment|analytics|dh
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_intents_session ON public.brain_intents (session_id);
GRANT SELECT, INSERT ON public.brain_intents TO authenticated;
GRANT ALL ON public.brain_intents TO service_role;
ALTER TABLE public.brain_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_intents read" ON public.brain_intents FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "brain_intents insert" ON public.brain_intents FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.brain_intents_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'brain_intents are immutable'; END $$;
CREATE TRIGGER trg_brain_intents_immutable BEFORE UPDATE OR DELETE ON public.brain_intents FOR EACH ROW EXECUTE FUNCTION public.brain_intents_immutable();

CREATE TABLE public.brain_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.brain_sessions(id) ON DELETE CASCADE,
  intent_id uuid REFERENCES public.brain_intents(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,        -- [{step, runtime, tool, args, requires_confirmation}]
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','executing','completed','failed','cancelled')),
  requires_confirmation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_plans_session ON public.brain_plans (session_id);
GRANT SELECT, INSERT, UPDATE ON public.brain_plans TO authenticated;
GRANT ALL ON public.brain_plans TO service_role;
ALTER TABLE public.brain_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_plans read" ON public.brain_plans FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "brain_plans write" ON public.brain_plans FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE TRIGGER trg_touch_brain_plans BEFORE UPDATE ON public.brain_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.brain_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.brain_sessions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  decision_type text NOT NULL,           -- runtime|tool|workflow|permission|company
  candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  chosen text NOT NULL,
  rationale text NOT NULL,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,           -- observed facts backing the choice
  recommendation jsonb NOT NULL DEFAULT '{}'::jsonb,  -- AI recommendation (kept separate from facts)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_decisions_session ON public.brain_decisions (session_id, created_at DESC);
GRANT SELECT, INSERT ON public.brain_decisions TO authenticated;
GRANT ALL ON public.brain_decisions TO service_role;
ALTER TABLE public.brain_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_decisions read" ON public.brain_decisions FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "brain_decisions insert" ON public.brain_decisions FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.brain_decisions_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'brain_decisions are immutable'; END $$;
CREATE TRIGGER trg_brain_decisions_immutable BEFORE UPDATE OR DELETE ON public.brain_decisions FOR EACH ROW EXECUTE FUNCTION public.brain_decisions_immutable();

CREATE TABLE public.brain_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.brain_sessions(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.brain_plans(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  runtime text NOT NULL,               -- revenue|crm|erp|finance|wms|mfg|marketplace|builder|deployment|analytics|dh
  tool text NOT NULL,                  -- runtime-specific tool name
  args jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded','failed','skipped','denied')),
  result_facts jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_recommendation jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  duration_ms integer,
  requires_confirmation boolean NOT NULL DEFAULT false,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brain_tool_calls_session ON public.brain_tool_calls (session_id, created_at DESC);
CREATE INDEX brain_tool_calls_runtime ON public.brain_tool_calls (company_id, runtime, created_at DESC);
GRANT SELECT, INSERT ON public.brain_tool_calls TO authenticated;
GRANT ALL ON public.brain_tool_calls TO service_role;
ALTER TABLE public.brain_tool_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_tool_calls read" ON public.brain_tool_calls FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "brain_tool_calls insert" ON public.brain_tool_calls FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.brain_tool_calls_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'brain_tool_calls are immutable'; END $$;
CREATE TRIGGER trg_brain_tool_calls_immutable BEFORE UPDATE OR DELETE ON public.brain_tool_calls FOR EACH ROW EXECUTE FUNCTION public.brain_tool_calls_immutable();