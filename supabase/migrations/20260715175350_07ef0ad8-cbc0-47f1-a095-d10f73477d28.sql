
-- R63 Enterprise Release & Store Automation Runtime
-- Extends existing release_records + deploy_store_readiness (R61). No duplication.

-- 1) Release artifacts (linked to release_records + deploy_artifacts)
CREATE TABLE public.release_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES public.deploy_artifacts(id) ON DELETE SET NULL,
  kind text NOT NULL,
  filename text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  sha256 text,
  sbom jsonb NOT NULL DEFAULT '{}'::jsonb,
  signed boolean NOT NULL DEFAULT false,
  signing_identity text,
  storage_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX release_artifacts_release_idx ON public.release_artifacts(release_id);
GRANT SELECT, INSERT ON public.release_artifacts TO authenticated;
GRANT ALL ON public.release_artifacts TO service_role;
ALTER TABLE public.release_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ra_read ON public.release_artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY ra_write ON public.release_artifacts FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) AND created_by = auth.uid());

-- Immutable
CREATE OR REPLACE FUNCTION public.release_artifacts_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'release_artifacts are immutable'; END $$;
CREATE TRIGGER trg_release_artifacts_immutable
  BEFORE UPDATE OR DELETE ON public.release_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.release_artifacts_immutable();

-- 2) Per-store submission tracking (per release, per store)
CREATE TABLE public.release_store_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  store text NOT NULL CHECK (store IN (
    'google_play','app_store','microsoft_store','amazon_appstore',
    'samsung_galaxy','huawei_appgallery','web','pwa'
  )),
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','ready','submitted','in_review','live','rejected','blocked','rolled_back')),
  validation_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  external_submission_id text,
  submitted_by uuid,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(release_id, store)
);
CREATE INDEX rss_release_idx ON public.release_store_submissions(release_id);
GRANT SELECT, INSERT, UPDATE ON public.release_store_submissions TO authenticated;
GRANT ALL ON public.release_store_submissions TO service_role;
ALTER TABLE public.release_store_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rss_read ON public.release_store_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY rss_write ON public.release_store_submissions FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY rss_update ON public.release_store_submissions FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_rss_touch BEFORE UPDATE ON public.release_store_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Signing profiles (identity metadata only, NEVER key material)
CREATE TABLE public.release_signing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_code text NOT NULL,
  profile_name text NOT NULL,
  identity_hint text,
  key_source text NOT NULL DEFAULT 'env'
    CHECK (key_source IN ('env','vault','manual','not_configured')),
  env_var_name text,
  fingerprint text,
  is_active boolean NOT NULL DEFAULT true,
  rotated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform_code, profile_name)
);
GRANT SELECT ON public.release_signing_profiles TO authenticated;
GRANT ALL ON public.release_signing_profiles TO service_role;
ALTER TABLE public.release_signing_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rsp_read ON public.release_signing_profiles FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_rsp_touch BEFORE UPDATE ON public.release_signing_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Rollback events (immutable audit)
CREATE TABLE public.release_rollbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_release_id uuid NOT NULL REFERENCES public.release_records(id),
  to_release_id uuid NOT NULL REFERENCES public.release_records(id),
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'standard' CHECK (severity IN ('standard','emergency')),
  initiated_by uuid NOT NULL DEFAULT auth.uid(),
  approved_by uuid,
  stores_affected jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','in_progress','completed','failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX rr_from_idx ON public.release_rollbacks(from_release_id);
GRANT SELECT, INSERT ON public.release_rollbacks TO authenticated;
GRANT UPDATE (status, completed_at, approved_by) ON public.release_rollbacks TO authenticated;
GRANT ALL ON public.release_rollbacks TO service_role;
ALTER TABLE public.release_rollbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlb_read ON public.release_rollbacks FOR SELECT TO authenticated USING (true);
CREATE POLICY rlb_write ON public.release_rollbacks FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) AND initiated_by = auth.uid());
CREATE POLICY rlb_update ON public.release_rollbacks FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

-- 5) Crash symbol uploads (metadata only, files live externally)
CREATE TABLE public.release_crash_symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  platform_code text NOT NULL,
  symbol_type text NOT NULL CHECK (symbol_type IN ('dsym','proguard','r8','pdb','sourcemap','breakpad','other')),
  filename text NOT NULL,
  sha256 text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  external_url text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rcs_release_idx ON public.release_crash_symbols(release_id);
GRANT SELECT, INSERT ON public.release_crash_symbols TO authenticated;
GRANT ALL ON public.release_crash_symbols TO service_role;
ALTER TABLE public.release_crash_symbols ENABLE ROW LEVEL SECURITY;
CREATE POLICY rcs_read ON public.release_crash_symbols FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY rcs_write ON public.release_crash_symbols FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) AND uploaded_by = auth.uid());

-- 6) Changelog entries (categorized, feed release_notes)
CREATE TABLE public.release_changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_records(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('feature','fix','security','breaking','known_issue','deprecated','performance')),
  summary text NOT NULL,
  detail text,
  reference_url text,
  authored_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rce_release_idx ON public.release_changelog_entries(release_id);
GRANT SELECT, INSERT ON public.release_changelog_entries TO authenticated;
GRANT ALL ON public.release_changelog_entries TO service_role;
ALTER TABLE public.release_changelog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY rce_read ON public.release_changelog_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY rce_write ON public.release_changelog_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) AND authored_by = auth.uid());

-- 7) Seed store readiness — honest BLOCKED status per store
INSERT INTO public.deploy_store_readiness (store, status, missing_dependencies, notes)
VALUES
  ('web','ready','[]'::jsonb,'Web build ready; PWA manifest present.'),
  ('google_play','blocked','["Google Play Console account","Signed AAB","Android Keystore secret"]'::jsonb,'Requires Google Play Console credentials & signing keystore.'),
  ('app_store','blocked','["Apple Developer account","Xcode build host","Distribution certificate","Provisioning profile"]'::jsonb,'Requires macOS + Xcode + Apple Developer credentials.'),
  ('microsoft_store','blocked','["Microsoft Partner Center account","MSIX signing cert"]'::jsonb,'Requires Microsoft Partner Center credentials.')
ON CONFLICT (store) DO UPDATE
  SET status = EXCLUDED.status,
      missing_dependencies = EXCLUDED.missing_dependencies,
      notes = EXCLUDED.notes,
      last_checked_at = now();
