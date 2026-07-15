-- R31 HAPPY AI Agent Platform

-- ============ agent_registry ============
CREATE TABLE public.agent_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,                                -- founder|business|finance|crm|erp|hr|manufacturing|warehouse|marketplace|builder|deployment|support|research|documentation|analytics|security|compliance|digital_human
  kind text NOT NULL DEFAULT 'system' CHECK (kind IN ('system','custom')),
  name text NOT NULL,
  description text,
  system_prompt text,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  capabilities text[] NOT NULL DEFAULT '{}',
  allowed_runtimes text[] NOT NULL DEFAULT '{}',
  allowed_actions text[] NOT NULL DEFAULT '{}',
  max_concurrent integer NOT NULL DEFAULT 3,
  max_iterations integer NOT NULL DEFAULT 8,
  active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
CREATE INDEX agent_registry_company ON public.agent_registry (company_id);
CREATE INDEX agent_registry_code ON public.agent_registry (code) WHERE active = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_registry TO authenticated;
GRANT ALL ON public.agent_registry TO service_role;
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_registry read" ON public.agent_registry FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_registry write" ON public.agent_registry FOR ALL TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_agent_registry BEFORE UPDATE ON public.agent_registry
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ agent_tasks ============
CREATE TABLE public.agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_registry(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  workflow_run_id uuid REFERENCES public.auto_runs(id) ON DELETE SET NULL,
  brain_session_id uuid REFERENCES public.brain_sessions(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  goal text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 5,
  deadline_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed','escalated','cancelled','awaiting_approval')),
  iterations integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  escalated_to uuid REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  escalation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_tasks_agent_status ON public.agent_tasks (agent_id, status);
CREATE INDEX agent_tasks_company_time ON public.agent_tasks (company_id, created_at DESC);
CREATE INDEX agent_tasks_parent ON public.agent_tasks (parent_task_id);
GRANT SELECT, INSERT, UPDATE ON public.agent_tasks TO authenticated;
GRANT ALL ON public.agent_tasks TO service_role;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_tasks read" ON public.agent_tasks FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_tasks insert" ON public.agent_tasks FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_tasks update" ON public.agent_tasks FOR UPDATE TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_agent_tasks BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ agent_messages (immutable) ============
CREATE TABLE public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  from_agent_id uuid REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  to_agent_id uuid REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('agent','brain','automation','founder','user','system')),
  role text NOT NULL DEFAULT 'assistant' CHECK (role IN ('system','user','assistant','tool')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_messages_task_time ON public.agent_messages (task_id, created_at);
CREATE INDEX agent_messages_company ON public.agent_messages (company_id, created_at DESC);
GRANT SELECT, INSERT ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_messages read" ON public.agent_messages FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_messages insert" ON public.agent_messages FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.agent_messages_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'agent_messages are immutable'; END $$;
CREATE TRIGGER trg_agent_messages_immutable BEFORE UPDATE OR DELETE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.agent_messages_immutable();

-- ============ agent_tool_calls (immutable) ============
CREATE TABLE public.agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  runtime text NOT NULL,                             -- revenue|crm|erp|finance|wms|mfg|builder|deployment|marketplace|analytics|bi|brain|memory|kg|notification|hrms
  action text NOT NULL,
  arguments jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_facts jsonb NOT NULL DEFAULT '{}'::jsonb,   -- observed data
  ai_recommendation text,                            -- advisory only, kept separate
  status text NOT NULL CHECK (status IN ('success','failed','blocked','skipped')),
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_tool_calls_task ON public.agent_tool_calls (task_id);
CREATE INDEX agent_tool_calls_company_time ON public.agent_tool_calls (company_id, created_at DESC);
GRANT SELECT, INSERT ON public.agent_tool_calls TO authenticated;
GRANT ALL ON public.agent_tool_calls TO service_role;
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_tool_calls read" ON public.agent_tool_calls FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_tool_calls insert" ON public.agent_tool_calls FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.agent_tool_calls_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'agent_tool_calls are immutable'; END $$;
CREATE TRIGGER trg_agent_tool_calls_immutable BEFORE UPDATE OR DELETE ON public.agent_tool_calls
  FOR EACH ROW EXECUTE FUNCTION public.agent_tool_calls_immutable();

-- ============ agent_metrics_daily ============
CREATE TABLE public.agent_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_registry(id) ON DELETE CASCADE,
  day date NOT NULL,
  tasks_total integer NOT NULL DEFAULT 0,
  tasks_succeeded integer NOT NULL DEFAULT 0,
  tasks_failed integer NOT NULL DEFAULT 0,
  tasks_escalated integer NOT NULL DEFAULT 0,
  avg_duration_ms integer NOT NULL DEFAULT 0,
  tool_calls integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, agent_id, day)
);
CREATE INDEX agent_metrics_daily_company_day ON public.agent_metrics_daily (company_id, day DESC);
GRANT SELECT, INSERT, UPDATE ON public.agent_metrics_daily TO authenticated;
GRANT ALL ON public.agent_metrics_daily TO service_role;
ALTER TABLE public.agent_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_metrics_daily read" ON public.agent_metrics_daily FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "agent_metrics_daily write" ON public.agent_metrics_daily FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_agent_metrics BEFORE UPDATE ON public.agent_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();