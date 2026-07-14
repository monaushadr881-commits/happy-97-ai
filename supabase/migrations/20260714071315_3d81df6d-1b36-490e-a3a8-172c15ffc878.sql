
CREATE TABLE IF NOT EXISTS public.creator_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'general',
  name text NOT NULL,
  description text,
  cover_asset_id uuid,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  archived boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_projects_user ON public.creator_projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_projects_kind ON public.creator_projects(user_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_projects TO authenticated;
GRANT ALL ON public.creator_projects TO service_role;
ALTER TABLE public.creator_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_projects_self ON public.creator_projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.creator_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE SET NULL,
  kind text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  name text NOT NULL,
  data_url text,
  external_url text,
  width integer,
  height integer,
  duration_ms integer,
  size_bytes integer,
  prompt text,
  model text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_assets_user ON public.creator_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_assets_project ON public.creator_assets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_assets_kind ON public.creator_assets(user_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_assets TO authenticated;
GRANT ALL ON public.creator_assets TO service_role;
ALTER TABLE public.creator_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_assets_self ON public.creator_assets FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.creator_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE SET NULL,
  studio text NOT NULL,
  operation text NOT NULL,
  model text,
  status text NOT NULL DEFAULT 'succeeded',
  prompt text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_asset_id uuid REFERENCES public.creator_assets(id) ON DELETE SET NULL,
  error text,
  cost_credits numeric(10,4),
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_gen_user ON public.creator_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_gen_studio ON public.creator_generations(user_id, studio, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_generations TO authenticated;
GRANT ALL ON public.creator_generations TO service_role;
ALTER TABLE public.creator_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_gen_self ON public.creator_generations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.creator_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  primary_color text NOT NULL DEFAULT '#C6A25E',
  secondary_color text NOT NULL DEFAULT '#0B0B0F',
  accent_color text NOT NULL DEFAULT '#E9E4D8',
  heading_font text NOT NULL DEFAULT 'Playfair Display',
  body_font text NOT NULL DEFAULT 'Inter',
  logo_asset_id uuid REFERENCES public.creator_assets(id) ON DELETE SET NULL,
  voice_guide text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_brand_user ON public.creator_brand_kits(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_brand_kits TO authenticated;
GRANT ALL ON public.creator_brand_kits TO service_role;
ALTER TABLE public.creator_brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_brand_self ON public.creator_brand_kits FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

SELECT public._hxp_attach_touch('public.creator_projects');
SELECT public._hxp_attach_touch('public.creator_brand_kits');
