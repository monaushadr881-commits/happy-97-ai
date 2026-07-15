
-- ============================================================
-- R64 Release Engineering & Distribution Platform
-- Expansion-only. Reuses is_ops_admin, has_role, touch_updated_at.
-- ============================================================

-- 1. Release artifact registry
CREATE TABLE public.release_artifact_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('apk','aab','ipa','msix','exe','dmg','pkg','appimage','snap','flatpak','docker','source','sourcemap','crash_symbol','debug_symbol','other')),
  filename text NOT NULL,
  sha256 text,
  size_bytes bigint,
  storage_url text,
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','valid','invalid','blocked')),
  validation_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.release_artifact_registry TO authenticated;
GRANT ALL ON public.release_artifact_registry TO service_role;
ALTER TABLE public.release_artifact_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_artifacts_admin_read" ON public.release_artifact_registry FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_artifacts_admin_write" ON public.release_artifact_registry FOR ALL TO authenticated USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_release_artifact_registry BEFORE UPDATE ON public.release_artifact_registry FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_r64_artifacts_release ON public.release_artifact_registry(release_id);

-- 2. Build pipeline runs
CREATE TABLE public.build_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES public.release_records(id) ON DELETE SET NULL,
  platform_code text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled','blocked')),
  priority integer NOT NULL DEFAULT 100,
  build_kind text NOT NULL DEFAULT 'manual' CHECK (build_kind IN ('incremental','clean','nightly','manual','scheduled')),
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms bigint,
  estimated_ms bigint,
  logs_url text,
  cache_hit boolean NOT NULL DEFAULT false,
  blocked_reason text,
  requested_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.build_pipeline_runs TO authenticated;
GRANT ALL ON public.build_pipeline_runs TO service_role;
ALTER TABLE public.build_pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_pipeline_admin_read" ON public.build_pipeline_runs FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_pipeline_admin_write" ON public.build_pipeline_runs FOR ALL TO authenticated USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_build_pipeline_runs BEFORE UPDATE ON public.build_pipeline_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_r64_pipeline_status ON public.build_pipeline_runs(status, priority DESC, queued_at);
CREATE INDEX idx_r64_pipeline_release ON public.build_pipeline_runs(release_id);

-- 3. Build pipeline events (append-only)
CREATE TABLE public.build_pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.build_pipeline_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.build_pipeline_events TO authenticated;
GRANT ALL ON public.build_pipeline_events TO service_role;
ALTER TABLE public.build_pipeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_pipe_events_admin_read" ON public.build_pipeline_events FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_pipe_events_admin_insert" ON public.build_pipeline_events FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.build_pipeline_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'build_pipeline_events are immutable'; END $$;
CREATE TRIGGER trg_r64_pipe_events_immutable BEFORE UPDATE OR DELETE ON public.build_pipeline_events FOR EACH ROW EXECUTE FUNCTION public.build_pipeline_events_immutable();
CREATE INDEX idx_r64_pipe_events_run ON public.build_pipeline_events(run_id, created_at);

-- 4. Release rollouts
CREATE TABLE public.release_rollouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  store text NOT NULL,
  current_percent integer NOT NULL DEFAULT 0 CHECK (current_percent BETWEEN 0 AND 100),
  target_percent integer NOT NULL DEFAULT 100 CHECK (target_percent BETWEEN 0 AND 100),
  state text NOT NULL DEFAULT 'planned' CHECK (state IN ('planned','active','paused','cancelled','rolled_back','completed')),
  country_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (release_id, store)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.release_rollouts TO authenticated;
GRANT ALL ON public.release_rollouts TO service_role;
ALTER TABLE public.release_rollouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_rollouts_admin_read" ON public.release_rollouts FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_rollouts_admin_write" ON public.release_rollouts FOR ALL TO authenticated USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_release_rollouts BEFORE UPDATE ON public.release_rollouts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Release rollout events (append-only)
CREATE TABLE public.release_rollout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rollout_id uuid NOT NULL REFERENCES public.release_rollouts(id) ON DELETE CASCADE,
  from_state text,
  to_state text NOT NULL,
  from_percent integer,
  to_percent integer,
  reason text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.release_rollout_events TO authenticated;
GRANT ALL ON public.release_rollout_events TO service_role;
ALTER TABLE public.release_rollout_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_rollout_events_admin_read" ON public.release_rollout_events FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_rollout_events_admin_insert" ON public.release_rollout_events FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.release_rollout_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'release_rollout_events are immutable'; END $$;
CREATE TRIGGER trg_r64_rollout_events_immutable BEFORE UPDATE OR DELETE ON public.release_rollout_events FOR EACH ROW EXECUTE FUNCTION public.release_rollout_events_immutable();
CREATE INDEX idx_r64_rollout_events_rollout ON public.release_rollout_events(rollout_id, created_at);

-- 6. Release store metrics (append-only snapshots)
CREATE TABLE public.release_store_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  store text NOT NULL,
  downloads bigint NOT NULL DEFAULT 0,
  installs bigint NOT NULL DEFAULT 0,
  updates bigint NOT NULL DEFAULT 0,
  rating_avg numeric(3,2),
  rating_count bigint NOT NULL DEFAULT 0,
  crash_free_rate numeric(5,4),
  anr_rate numeric(5,4),
  retention_d1 numeric(5,4),
  retention_d7 numeric(5,4),
  retention_d30 numeric(5,4),
  revenue_cents bigint NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.release_store_metrics TO authenticated;
GRANT ALL ON public.release_store_metrics TO service_role;
ALTER TABLE public.release_store_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_store_metrics_admin_read" ON public.release_store_metrics FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_store_metrics_admin_insert" ON public.release_store_metrics FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.release_store_metrics_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'release_store_metrics are immutable'; END $$;
CREATE TRIGGER trg_r64_store_metrics_immutable BEFORE UPDATE OR DELETE ON public.release_store_metrics FOR EACH ROW EXECUTE FUNCTION public.release_store_metrics_immutable();
CREATE INDEX idx_r64_store_metrics_release ON public.release_store_metrics(release_id, store, snapshot_at DESC);

-- 7. Release automation checks
CREATE TABLE public.release_automation_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  check_kind text NOT NULL,
  status text NOT NULL CHECK (status IN ('pass','warn','fail','blocked')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.release_automation_checks TO authenticated;
GRANT ALL ON public.release_automation_checks TO service_role;
ALTER TABLE public.release_automation_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_checks_admin_read" ON public.release_automation_checks FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_checks_admin_insert" ON public.release_automation_checks FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_r64_checks_release ON public.release_automation_checks(release_id, checked_at DESC);

-- 8. Daily pipeline metrics rollup
CREATE TABLE public.release_pipeline_metrics_daily (
  day date PRIMARY KEY,
  builds_total integer NOT NULL DEFAULT 0,
  builds_succeeded integer NOT NULL DEFAULT 0,
  builds_failed integer NOT NULL DEFAULT 0,
  builds_blocked integer NOT NULL DEFAULT 0,
  builds_cancelled integer NOT NULL DEFAULT 0,
  avg_duration_ms bigint,
  released_count integer NOT NULL DEFAULT 0,
  rollback_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.release_pipeline_metrics_daily TO authenticated;
GRANT ALL ON public.release_pipeline_metrics_daily TO service_role;
ALTER TABLE public.release_pipeline_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r64_daily_metrics_admin_read" ON public.release_pipeline_metrics_daily FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "r64_daily_metrics_admin_write" ON public.release_pipeline_metrics_daily FOR ALL TO authenticated USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_release_pipeline_metrics_daily BEFORE UPDATE ON public.release_pipeline_metrics_daily FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
