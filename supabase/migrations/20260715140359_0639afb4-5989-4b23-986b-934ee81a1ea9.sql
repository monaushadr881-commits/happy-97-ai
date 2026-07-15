-- R30 HAPPY Automation Engine

-- ============ auto_workflows ============
CREATE TABLE public.auto_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_kind text NOT NULL CHECK (trigger_kind IN (
    'manual','api','schedule','webhook','user_event','db_change','payment',
    'deployment','crm','erp','marketplace','builder','ai','memory','notification'
  )),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,          -- ordered array of {id,kind,runtime,action,args,condition,parallel,requires_approval}
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  retry_policy jsonb NOT NULL DEFAULT '{"max_attempts":3,"backoff":"exponential"}'::jsonb,
  requires_approval boolean NOT NULL DEFAULT false,
  approval_role text,
  timezone text NOT NULL DEFAULT 'UTC',
  cron_expr text,
  active boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auto_workflows_company ON public.auto_workflows (company_id);
CREATE INDEX auto_workflows_trigger ON public.auto_workflows (trigger_kind) WHERE active = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_workflows TO authenticated;
GRANT ALL ON public.auto_workflows TO service_role;
ALTER TABLE public.auto_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_workflows read" ON public.auto_workflows FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_workflows write" ON public.auto_workflows FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_auto_workflows BEFORE UPDATE ON public.auto_workflows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ auto_runs ============
CREATE TABLE public.auto_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.auto_workflows(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_kind text NOT NULL,
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled','awaiting_approval','retrying')),
  attempt integer NOT NULL DEFAULT 1,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auto_runs_workflow_time ON public.auto_runs (workflow_id, created_at DESC);
CREATE INDEX auto_runs_company_status ON public.auto_runs (company_id, status);
GRANT SELECT, INSERT, UPDATE ON public.auto_runs TO authenticated;
GRANT ALL ON public.auto_runs TO service_role;
ALTER TABLE public.auto_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_runs read" ON public.auto_runs FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_runs insert" ON public.auto_runs FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_runs update" ON public.auto_runs FOR UPDATE TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- ============ auto_step_runs (immutable audit) ============
CREATE TABLE public.auto_step_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.auto_runs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  step_id text,
  kind text NOT NULL,                                -- action|condition|approval|delay|call_runtime
  runtime text,                                      -- revenue|crm|erp|finance|wms|mfg|builder|deployment|notification|analytics|bi|brain|memory|kg
  action text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('running','succeeded','failed','skipped','awaiting_approval')),
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auto_step_runs_run ON public.auto_step_runs (run_id, step_index);
GRANT SELECT, INSERT ON public.auto_step_runs TO authenticated;
GRANT ALL ON public.auto_step_runs TO service_role;
ALTER TABLE public.auto_step_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_step_runs read" ON public.auto_step_runs FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_step_runs insert" ON public.auto_step_runs FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.auto_step_runs_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'auto_step_runs are immutable'; END $$;
CREATE TRIGGER trg_auto_step_runs_immutable BEFORE UPDATE OR DELETE ON public.auto_step_runs
  FOR EACH ROW EXECUTE FUNCTION public.auto_step_runs_immutable();

-- ============ auto_queue ============
CREATE TABLE public.auto_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.auto_workflows(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.auto_runs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('workflow','retry','step','deadletter')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 5,               -- 1 highest, 10 lowest
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','deadletter')),
  last_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auto_queue_ready ON public.auto_queue (status, scheduled_for, priority) WHERE status = 'pending';
CREATE INDEX auto_queue_company ON public.auto_queue (company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_queue TO authenticated;
GRANT ALL ON public.auto_queue TO service_role;
ALTER TABLE public.auto_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_queue read" ON public.auto_queue FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_queue write" ON public.auto_queue FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_auto_queue BEFORE UPDATE ON public.auto_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ auto_approvals ============
CREATE TABLE public.auto_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.auto_runs(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.auto_workflows(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_role text NOT NULL,
  step_index integer,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','expired')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auto_approvals_run ON public.auto_approvals (run_id);
CREATE INDEX auto_approvals_company_status ON public.auto_approvals (company_id, status);
GRANT SELECT, INSERT, UPDATE ON public.auto_approvals TO authenticated;
GRANT ALL ON public.auto_approvals TO service_role;
ALTER TABLE public.auto_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_approvals read" ON public.auto_approvals FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_approvals insert" ON public.auto_approvals FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "auto_approvals decide" ON public.auto_approvals FOR UPDATE TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_auto_approvals BEFORE UPDATE ON public.auto_approvals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();