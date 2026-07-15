
-- =============================================================
-- R35 Multi-Region / HA Platform
-- =============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.ha_region_role AS ENUM ('primary', 'secondary', 'standby', 'edge');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_region_status AS ENUM ('healthy', 'degraded', 'offline', 'recovering');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_replication_scope AS ENUM (
    'database_metadata', 'configuration', 'builder_projects',
    'marketplace_metadata', 'automation_definitions',
    'knowledge_graph', 'memory_metadata'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_replication_status AS ENUM ('in_sync', 'lagging', 'diverged', 'failed', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_failover_kind AS ENUM ('automatic', 'manual', 'graceful', 'rollback');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_failover_status AS ENUM ('planned', 'running', 'succeeded', 'failed', 'rolled_back');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_traffic_policy AS ENUM ('primary_only', 'active_active', 'weighted', 'geo', 'failover');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.ha_event_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ha_regions
CREATE TABLE IF NOT EXISTS public.ha_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role public.ha_region_role NOT NULL DEFAULT 'secondary',
  status public.ha_region_status NOT NULL DEFAULT 'recovering',
  provider TEXT NOT NULL DEFAULT 'cloudflare',
  location TEXT,
  endpoint_url TEXT,
  latency_ms INTEGER,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_probed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ha_regions TO authenticated;
GRANT ALL ON public.ha_regions TO service_role;
ALTER TABLE public.ha_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins manage regions" ON public.ha_regions
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- ha_replication_marks (upsert per region+scope)
CREATE TABLE IF NOT EXISTS public.ha_replication_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.ha_regions(id) ON DELETE CASCADE,
  scope public.ha_replication_scope NOT NULL,
  digest TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  marked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, scope)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ha_replication_marks TO authenticated;
GRANT ALL ON public.ha_replication_marks TO service_role;
ALTER TABLE public.ha_replication_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins manage marks" ON public.ha_replication_marks
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- ha_replication_checks (append-only)
CREATE TABLE IF NOT EXISTS public.ha_replication_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.ha_replication_scope NOT NULL,
  source_region_id UUID NOT NULL REFERENCES public.ha_regions(id) ON DELETE CASCADE,
  target_region_id UUID NOT NULL REFERENCES public.ha_regions(id) ON DELETE CASCADE,
  status public.ha_replication_status NOT NULL,
  source_digest TEXT NOT NULL,
  target_digest TEXT NOT NULL DEFAULT '',
  source_total INTEGER NOT NULL DEFAULT 0,
  target_total INTEGER NOT NULL DEFAULT 0,
  lag_rows INTEGER NOT NULL DEFAULT 0,
  verified_by UUID,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ha_replication_checks TO authenticated;
GRANT ALL ON public.ha_replication_checks TO service_role;
ALTER TABLE public.ha_replication_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins read replication checks" ON public.ha_replication_checks
  FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops admins insert replication checks" ON public.ha_replication_checks
  FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.ha_replication_checks_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'ha_replication_checks are immutable'; END $$;
DROP TRIGGER IF EXISTS trg_ha_repl_checks_immutable ON public.ha_replication_checks;
CREATE TRIGGER trg_ha_repl_checks_immutable
  BEFORE UPDATE OR DELETE ON public.ha_replication_checks
  FOR EACH ROW EXECUTE FUNCTION public.ha_replication_checks_immutable();

-- ha_failover_runs
CREATE TABLE IF NOT EXISTS public.ha_failover_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.ha_failover_kind NOT NULL,
  from_region_id UUID REFERENCES public.ha_regions(id) ON DELETE SET NULL,
  to_region_id UUID REFERENCES public.ha_regions(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status public.ha_failover_status NOT NULL DEFAULT 'planned',
  traffic_switched BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  started_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ha_failover_runs TO authenticated;
GRANT ALL ON public.ha_failover_runs TO service_role;
ALTER TABLE public.ha_failover_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins read failovers" ON public.ha_failover_runs
  FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops admins insert failovers" ON public.ha_failover_runs
  FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops admins update failovers" ON public.ha_failover_runs
  FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- ha_traffic_policies
CREATE TABLE IF NOT EXISTS public.ha_traffic_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy public.ha_traffic_policy NOT NULL UNIQUE,
  active_region_id UUID REFERENCES public.ha_regions(id) ON DELETE SET NULL,
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ha_traffic_policies TO authenticated;
GRANT ALL ON public.ha_traffic_policies TO service_role;
ALTER TABLE public.ha_traffic_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins manage traffic" ON public.ha_traffic_policies
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- Seed traffic policies (idempotent)
INSERT INTO public.ha_traffic_policies (policy)
VALUES ('primary_only'), ('active_active'), ('weighted'), ('geo'), ('failover')
ON CONFLICT (policy) DO NOTHING;

-- ha_events (append-only)
CREATE TABLE IF NOT EXISTS public.ha_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  severity public.ha_event_severity NOT NULL DEFAULT 'info',
  region_id UUID REFERENCES public.ha_regions(id) ON DELETE SET NULL,
  ref_type TEXT,
  ref_id UUID,
  actor_id UUID,
  message TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ha_events TO authenticated;
GRANT ALL ON public.ha_events TO service_role;
ALTER TABLE public.ha_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops admins read ha events" ON public.ha_events
  FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops admins insert ha events" ON public.ha_events
  FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.ha_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'ha_events are immutable'; END $$;
DROP TRIGGER IF EXISTS trg_ha_events_immutable ON public.ha_events;
CREATE TRIGGER trg_ha_events_immutable
  BEFORE UPDATE OR DELETE ON public.ha_events
  FOR EACH ROW EXECUTE FUNCTION public.ha_events_immutable();

-- updated_at touches
SELECT public._hxp_attach_touch('public.ha_regions');
SELECT public._hxp_attach_touch('public.ha_replication_marks');
SELECT public._hxp_attach_touch('public.ha_failover_runs');
SELECT public._hxp_attach_touch('public.ha_traffic_policies');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ha_regions_role ON public.ha_regions(role);
CREATE INDEX IF NOT EXISTS idx_ha_regions_status ON public.ha_regions(status);
CREATE INDEX IF NOT EXISTS idx_ha_repl_checks_verified_at ON public.ha_replication_checks(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_ha_repl_checks_scope ON public.ha_replication_checks(scope);
CREATE INDEX IF NOT EXISTS idx_ha_failover_runs_started_at ON public.ha_failover_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ha_events_occurred_at ON public.ha_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ha_events_severity ON public.ha_events(severity);
