
CREATE TABLE public.happy_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'character','skeleton','blendshapes','animation','material',
    'texture','hdr_environment','voice_profile','motion_library'
  )),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  current_version_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_type, name)
);
GRANT SELECT ON public.happy_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.happy_assets TO authenticated;
GRANT ALL ON public.happy_assets TO service_role;
ALTER TABLE public.happy_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_assets_read" ON public.happy_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_assets_ops_write" ON public.happy_assets FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.happy_assets(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  mime_type TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validated','published','deprecated')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_id, version)
);
GRANT SELECT ON public.happy_asset_versions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.happy_asset_versions TO authenticated;
GRANT ALL ON public.happy_asset_versions TO service_role;
ALTER TABLE public.happy_asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_asset_versions_read" ON public.happy_asset_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_asset_versions_ops_write" ON public.happy_asset_versions FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_happy_asset_versions_asset ON public.happy_asset_versions(asset_id, created_at DESC);

ALTER TABLE public.happy_assets
  ADD CONSTRAINT happy_assets_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.happy_asset_versions(id) ON DELETE SET NULL;

CREATE TABLE public.happy_character_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_key TEXT NOT NULL DEFAULT 'HAPPY' CHECK (character_key = 'HAPPY'),
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validated','published','deprecated')),
  rig_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  skeleton_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  blendshape_profile TEXT NOT NULL DEFAULT 'arkit52' CHECK (blendshape_profile IN ('arkit52','equivalent','custom')),
  animation_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (character_key, version)
);
GRANT SELECT ON public.happy_character_manifests TO anon, authenticated;
GRANT INSERT, UPDATE ON public.happy_character_manifests TO authenticated;
GRANT ALL ON public.happy_character_manifests TO service_role;
ALTER TABLE public.happy_character_manifests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_manifests_read" ON public.happy_character_manifests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_manifests_ops_write" ON public.happy_character_manifests FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_manifest_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES public.happy_character_manifests(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'character','skeleton','blendshapes','animation','material',
    'texture','hdr_environment','voice_profile','motion_library'
  )),
  slot TEXT,
  asset_version_id UUID NOT NULL REFERENCES public.happy_asset_versions(id) ON DELETE RESTRICT,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (manifest_id, role, slot)
);
GRANT SELECT ON public.happy_manifest_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.happy_manifest_assets TO authenticated;
GRANT ALL ON public.happy_manifest_assets TO service_role;
ALTER TABLE public.happy_manifest_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_manifest_assets_read" ON public.happy_manifest_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_manifest_assets_ops_write" ON public.happy_manifest_assets FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_asset_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES public.happy_character_manifests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('rig','skeleton','blendshape','animation','material','compatibility','manifest')),
  status TEXT NOT NULL CHECK (status IN ('READY','PARTIAL','BLOCKED')),
  missing JSONB NOT NULL DEFAULT '[]'::jsonb,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  runner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.happy_asset_validations TO authenticated;
GRANT SELECT ON public.happy_asset_validations TO anon;
GRANT ALL ON public.happy_asset_validations TO service_role;
ALTER TABLE public.happy_asset_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_asset_validations_read" ON public.happy_asset_validations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_asset_validations_ops_insert" ON public.happy_asset_validations FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE INDEX idx_happy_asset_validations_manifest ON public.happy_asset_validations(manifest_id, created_at DESC);

CREATE TRIGGER trg_happy_assets_updated BEFORE UPDATE ON public.happy_assets
  FOR EACH ROW EXECUTE FUNCTION public.happy_touch_updated_at();
CREATE TRIGGER trg_happy_manifests_updated BEFORE UPDATE ON public.happy_character_manifests
  FOR EACH ROW EXECUTE FUNCTION public.happy_touch_updated_at();
