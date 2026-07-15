-- =========================================================================
-- R61 UNIVERSAL DEPLOYMENT RUNTIME
-- =========================================================================

-- 1. deploy_platform_registry -------------------------------------------------
CREATE TABLE public.deploy_platform_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  adapter text NOT NULL,
  category text NOT NULL,
  required_dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  readiness_state text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deploy_platform_registry TO authenticated;
GRANT ALL ON public.deploy_platform_registry TO service_role;

ALTER TABLE public.deploy_platform_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deploy_platform_registry_read_admin"
  ON public.deploy_platform_registry FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deploy_platform_registry_write_admin"
  ON public.deploy_platform_registry FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_deploy_platform_registry_touch
  BEFORE UPDATE ON public.deploy_platform_registry
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. deploy_builds ------------------------------------------------------------
CREATE TABLE public.deploy_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_code text NOT NULL REFERENCES public.deploy_platform_registry(platform_code),
  channel text NOT NULL CHECK (channel IN ('production','staging','testing','development')),
  version text NOT NULL,
  git_sha text,
  status text NOT NULL CHECK (status IN ('queued','running','succeeded','failed','blocked')),
  blocked_reason text,
  logs_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deploy_builds_platform ON public.deploy_builds(platform_code, started_at DESC);
CREATE INDEX idx_deploy_builds_status ON public.deploy_builds(status);

GRANT SELECT, INSERT, UPDATE ON public.deploy_builds TO authenticated;
GRANT ALL ON public.deploy_builds TO service_role;

ALTER TABLE public.deploy_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deploy_builds_read_admin"
  ON public.deploy_builds FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deploy_builds_insert_admin"
  ON public.deploy_builds FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deploy_builds_update_admin"
  ON public.deploy_builds FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Immutability: only status/blocked_reason/logs_url/finished_at/metadata may change
CREATE OR REPLACE FUNCTION public.deploy_builds_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'deploy_builds are append-only'; END IF;
  IF NEW.platform_code IS DISTINCT FROM OLD.platform_code
     OR NEW.channel IS DISTINCT FROM OLD.channel
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.git_sha IS DISTINCT FROM OLD.git_sha
     OR NEW.started_by IS DISTINCT FROM OLD.started_by
     OR NEW.started_at IS DISTINCT FROM OLD.started_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN RAISE EXCEPTION 'deploy_builds core fields are immutable'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_deploy_builds_guard
  BEFORE UPDATE OR DELETE ON public.deploy_builds
  FOR EACH ROW EXECUTE FUNCTION public.deploy_builds_guard();

-- 3. deploy_artifacts ---------------------------------------------------------
CREATE TABLE public.deploy_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.deploy_builds(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('web_bundle','pwa','apk','aab','ipa','msi','dmg','appimage','deb','zip','other')),
  filename text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  sha256 text,
  storage_url text,
  signed boolean NOT NULL DEFAULT false,
  signing_identity text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deploy_artifacts_build ON public.deploy_artifacts(build_id);

GRANT SELECT, INSERT ON public.deploy_artifacts TO authenticated;
GRANT ALL ON public.deploy_artifacts TO service_role;

ALTER TABLE public.deploy_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deploy_artifacts_read_admin"
  ON public.deploy_artifacts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deploy_artifacts_insert_admin"
  ON public.deploy_artifacts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.deploy_artifacts_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'deploy_artifacts are append-only'; END $$;

CREATE TRIGGER trg_deploy_artifacts_immutable
  BEFORE UPDATE OR DELETE ON public.deploy_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.deploy_artifacts_immutable();

-- 4. deploy_store_readiness ---------------------------------------------------
CREATE TABLE public.deploy_store_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store text NOT NULL UNIQUE CHECK (store IN ('google_play','app_store','microsoft_store','web')),
  status text NOT NULL CHECK (status IN ('ready','blocked','submitted','live')) DEFAULT 'blocked',
  missing_dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deploy_store_readiness TO authenticated;
GRANT ALL ON public.deploy_store_readiness TO service_role;

ALTER TABLE public.deploy_store_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deploy_store_readiness_read_admin"
  ON public.deploy_store_readiness FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deploy_store_readiness_write_admin"
  ON public.deploy_store_readiness FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_deploy_store_readiness_touch
  BEFORE UPDATE ON public.deploy_store_readiness
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- SEEDS
-- =========================================================================

INSERT INTO public.deploy_platform_registry (platform_code, display_name, adapter, category, required_dependencies, enabled, readiness_state, notes) VALUES
  ('web',         'Web (SSR)',           'web',            'web',      '[]'::jsonb, true,  'working', 'Baseline TanStack Start build'),
  ('pwa',         'Progressive Web App', 'pwa',            'web',      '["vite-plugin-pwa"]'::jsonb, true,  'working', 'Guarded SW registration'),
  ('android_apk', 'Android APK',         'capacitor-android','mobile', '["android-sdk","keystore"]'::jsonb, true,  'blocked', 'Requires Android SDK + release keystore'),
  ('android_aab', 'Android App Bundle',  'capacitor-android','mobile', '["android-sdk","play-upload-key"]'::jsonb, true,  'blocked', 'Requires Android SDK + Play upload key'),
  ('ios',         'iOS (iPhone)',        'capacitor-ios',  'mobile',   '["macos-host","xcode","apple-developer-account"]'::jsonb, true,  'blocked', 'Requires macOS host + Xcode + Apple Dev'),
  ('ipados',      'iPadOS',              'capacitor-ios',  'mobile',   '["macos-host","xcode","apple-developer-account"]'::jsonb, true,  'blocked', 'Same as iOS'),
  ('macos',       'macOS Desktop',       'tauri-mac',      'desktop',  '["macos-host","developer-id-cert","rust-toolchain"]'::jsonb, true,  'blocked', 'Requires macOS host + Developer ID cert'),
  ('windows',     'Windows Desktop',     'tauri-win',      'desktop',  '["windows-host","code-signing-cert","rust-toolchain"]'::jsonb, true,  'blocked', 'Requires Windows host + code-signing cert'),
  ('linux',       'Linux Desktop',       'tauri-linux',    'desktop',  '["rust-toolchain"]'::jsonb, true,  'partial', 'Rust toolchain not present in this sandbox'),
  ('chromeos',    'ChromeOS',            'web',            'web',      '[]'::jsonb, true,  'working', 'Served via web build'),
  ('android_tv',  'Android TV',          'capacitor-android','mobile', '["android-sdk","leanback-ui"]'::jsonb, false, 'planned', 'Future-ready'),
  ('wearos',      'Wear OS',             'wearos-companion','mobile',  '["android-sdk","wear-companion-module"]'::jsonb, false, 'planned', 'Future-ready'),
  ('visionpro',   'Apple Vision Pro',    'capacitor-ios',  'mobile',   '["macos-host","xcode","visionos-sdk"]'::jsonb, false, 'planned', 'Future-ready');

INSERT INTO public.deploy_store_readiness (store, status, missing_dependencies, notes) VALUES
  ('google_play',      'blocked', '["play-console-service-account","upload-keystore"]'::jsonb, 'Add Play Console credentials and keystore'),
  ('app_store',        'blocked', '["app-store-connect-api-key","apple-developer-account"]'::jsonb, 'Add App Store Connect API key'),
  ('microsoft_store',  'blocked', '["partner-center-account","code-signing-cert"]'::jsonb, 'Add Microsoft Partner Center credentials'),
  ('web',              'ready',   '[]'::jsonb, 'Publishable via Lovable to *.lovable.app; happy.ai requires DNS');
