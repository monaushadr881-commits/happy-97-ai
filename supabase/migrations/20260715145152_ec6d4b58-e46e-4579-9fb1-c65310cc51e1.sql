
-- R34 Backup / Disaster Recovery / Business Continuity

CREATE TABLE public.bkp_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  target_scope TEXT NOT NULL,                 -- database | storage | media | builder | marketplace | deployments | configuration | apigw | secrets_meta | automation | agents | knowledge | memory
  backup_type TEXT NOT NULL DEFAULT 'full',    -- full | incremental | differential | point_in_time
  schedule_cron TEXT,                          -- e.g. '0 3 * * *'
  retention_daily INTEGER NOT NULL DEFAULT 7,
  retention_weekly INTEGER NOT NULL DEFAULT 4,
  retention_monthly INTEGER NOT NULL DEFAULT 12,
  retention_yearly INTEGER NOT NULL DEFAULT 3,
  encryption_algo TEXT NOT NULL DEFAULT 'aes-256-gcm',
  compression TEXT NOT NULL DEFAULT 'zstd',
  deduplication BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bkp_policies TO authenticated;
GRANT ALL ON public.bkp_policies TO service_role;
ALTER TABLE public.bkp_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp policies" ON public.bkp_policies FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER bkp_policies_touch BEFORE UPDATE ON public.bkp_policies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bkp_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.bkp_policies(id) ON DELETE SET NULL,
  target TEXT NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'running',      -- running | succeeded | failed | verified | expired
  trigger TEXT NOT NULL DEFAULT 'scheduled',   -- scheduled | manual | drill
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  object_count INTEGER NOT NULL DEFAULT 0,
  checksum TEXT,
  encryption_algo TEXT,
  compression TEXT,
  storage_ref TEXT,                            -- opaque reference to underlying object storage
  parent_job_id UUID REFERENCES public.bkp_jobs(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_checksum TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bkp_jobs_target_idx ON public.bkp_jobs(target, started_at DESC);
CREATE INDEX bkp_jobs_status_idx ON public.bkp_jobs(status, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bkp_jobs TO authenticated;
GRANT ALL ON public.bkp_jobs TO service_role;
ALTER TABLE public.bkp_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp jobs" ON public.bkp_jobs FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER bkp_jobs_touch BEFORE UPDATE ON public.bkp_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bkp_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.bkp_jobs(id) ON DELETE CASCADE,
  target TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  object_count INTEGER NOT NULL DEFAULT 0,
  storage_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bkp_artifacts_job_idx ON public.bkp_artifacts(job_id);
GRANT SELECT, INSERT, DELETE ON public.bkp_artifacts TO authenticated;
GRANT ALL ON public.bkp_artifacts TO service_role;
ALTER TABLE public.bkp_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp artifacts" ON public.bkp_artifacts FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.bkp_restore_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_job_id UUID REFERENCES public.bkp_jobs(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'full',           -- full | partial | object | project | database | configuration
  target TEXT NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'running',      -- running | succeeded | failed | verified
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  restored_objects INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_checksum TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bkp_restore_jobs_status_idx ON public.bkp_restore_jobs(status, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bkp_restore_jobs TO authenticated;
GRANT ALL ON public.bkp_restore_jobs TO service_role;
ALTER TABLE public.bkp_restore_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp restores" ON public.bkp_restore_jobs FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER bkp_restore_jobs_touch BEFORE UPDATE ON public.bkp_restore_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bkp_recovery_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  rto_minutes INTEGER NOT NULL DEFAULT 60,
  rpo_minutes INTEGER NOT NULL DEFAULT 60,
  owner_id UUID,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_drill_at TIMESTAMPTZ,
  last_drill_status TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bkp_recovery_plans TO authenticated;
GRANT ALL ON public.bkp_recovery_plans TO service_role;
ALTER TABLE public.bkp_recovery_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp plans" ON public.bkp_recovery_plans FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER bkp_recovery_plans_touch BEFORE UPDATE ON public.bkp_recovery_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bkp_recovery_drills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.bkp_recovery_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',      -- running | passed | failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  verified BOOLEAN NOT NULL DEFAULT false,
  findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  steps_result JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bkp_drills_plan_idx ON public.bkp_recovery_drills(plan_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bkp_recovery_drills TO authenticated;
GRANT ALL ON public.bkp_recovery_drills TO service_role;
ALTER TABLE public.bkp_recovery_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage bkp drills" ON public.bkp_recovery_drills FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER bkp_recovery_drills_touch BEFORE UPDATE ON public.bkp_recovery_drills FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bkp_audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,                          -- backup.started | backup.succeeded | backup.failed | backup.verified | restore.started | restore.succeeded | restore.failed | restore.verified | retention.pruned | drill.started | drill.completed | policy.upserted
  ref_type TEXT NOT NULL,                      -- policy | job | restore | plan | drill | artifact
  ref_id UUID,
  actor_id UUID,
  severity TEXT NOT NULL DEFAULT 'info',       -- info | warning | critical
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bkp_audit_ref_idx ON public.bkp_audit_events(ref_type, ref_id, occurred_at DESC);
CREATE INDEX bkp_audit_kind_idx ON public.bkp_audit_events(kind, occurred_at DESC);
GRANT SELECT, INSERT ON public.bkp_audit_events TO authenticated;
GRANT ALL ON public.bkp_audit_events TO service_role;
ALTER TABLE public.bkp_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops read bkp audit" ON public.bkp_audit_events FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops insert bkp audit" ON public.bkp_audit_events FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.bkp_audit_events_immutable() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'bkp_audit_events are immutable'; END $$;
CREATE TRIGGER bkp_audit_events_no_update BEFORE UPDATE OR DELETE ON public.bkp_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.bkp_audit_events_immutable();
