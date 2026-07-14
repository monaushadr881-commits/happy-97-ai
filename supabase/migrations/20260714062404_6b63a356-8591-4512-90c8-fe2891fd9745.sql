-- ============================================================
-- HAPPY X — Phase 5.6 Operations Schema
-- ============================================================

-- Enums ------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.health_status AS ENUM ('ok','degraded','down','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_status AS ENUM ('open','investigating','identified','monitoring','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deployment_status AS ENUM ('pending','in_progress','succeeded','failed','rolled_back');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deployment_strategy AS ENUM ('rolling','blue_green','canary','hotfix');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: is_ops_admin ---------------------------------------
CREATE OR REPLACE FUNCTION public.is_ops_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT public.is_platform_founder(_user_id)
    OR public.user_has_permission(_user_id, 'platform.manage', 'platform', NULL);
$$;

-- 1) health_checks -------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  kind text NOT NULL DEFAULT 'liveness',
  status public.health_status NOT NULL DEFAULT 'unknown',
  latency_ms integer,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_checks_service_time ON public.health_checks(service, checked_at DESC);

GRANT SELECT ON public.health_checks TO authenticated;
GRANT ALL ON public.health_checks TO service_role;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_read_health" ON public.health_checks FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops_admin_write_health" ON public.health_checks FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- 2) alert_rules ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  service text NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_service ON public.alert_rules(service);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_manage_alert_rules" ON public.alert_rules FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
SELECT public._hxp_attach_touch('public.alert_rules');

-- 3) incidents -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  service text NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  status public.incident_status NOT NULL DEFAULT 'open',
  root_cause text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  opened_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_service ON public.incidents(service);

GRANT SELECT, INSERT, UPDATE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_manage_incidents" ON public.incidents FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
SELECT public._hxp_attach_touch('public.incidents');

-- 4) incident_events -----------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incident_events_incident ON public.incident_events(incident_id, occurred_at DESC);

GRANT SELECT, INSERT ON public.incident_events TO authenticated;
GRANT ALL ON public.incident_events TO service_role;
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_manage_incident_events" ON public.incident_events FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

-- 5) deployments ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  channel text NOT NULL DEFAULT 'production',
  strategy public.deployment_strategy NOT NULL DEFAULT 'rolling',
  status public.deployment_status NOT NULL DEFAULT 'pending',
  notes text,
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deployments_channel_time ON public.deployments(channel, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.deployments TO authenticated;
GRANT ALL ON public.deployments TO service_role;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_manage_deployments" ON public.deployments FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
SELECT public._hxp_attach_touch('public.deployments');

-- 6) metrics_events ------------------------------------------
CREATE TABLE IF NOT EXISTS public.metrics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  metric text NOT NULL,
  value numeric NOT NULL,
  unit text,
  labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_metrics_events_svc_metric_time
  ON public.metrics_events(service, metric, occurred_at DESC);

GRANT SELECT, INSERT ON public.metrics_events TO authenticated;
GRANT ALL ON public.metrics_events TO service_role;
ALTER TABLE public.metrics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_read_metrics" ON public.metrics_events FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops_admin_write_metrics" ON public.metrics_events FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- 7) cron_runs -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  duration_ms integer,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cron_runs_job_time ON public.cron_runs(job_name, started_at DESC);

GRANT SELECT, INSERT ON public.cron_runs TO authenticated;
GRANT ALL ON public.cron_runs TO service_role;
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops_admin_read_cron" ON public.cron_runs FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops_admin_write_cron" ON public.cron_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
