
-- ============ Enums ============
DO $$ BEGIN
  CREATE TYPE public.project_deployment_env AS ENUM ('development','preview','staging','production');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_deployment_target AS ENUM (
    'web','pwa','static_export','cloudflare','netlify','vercel','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_deployment_state AS ENUM (
    'queued','building','deploying','succeeded','failed','cancelled','rolled_back'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_domain_status AS ENUM (
    'pending','verifying','verified','failed','removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ project_deployments ============
CREATE TABLE IF NOT EXISTS public.project_deployments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment   public.project_deployment_env NOT NULL DEFAULT 'preview',
  target        public.project_deployment_target NOT NULL DEFAULT 'web',
  status        public.project_deployment_state NOT NULL DEFAULT 'queued',
  version       text NOT NULL DEFAULT '0.0.0',
  release_notes text,
  artifact_path text,
  artifact_bytes bigint,
  deployed_url  text,
  build_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at    timestamptz,
  finished_at   timestamptz,
  duration_ms   integer,
  cancelled_at  timestamptz,
  rolled_back_from uuid REFERENCES public.project_deployments(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_deployments TO authenticated;
GRANT ALL ON public.project_deployments TO service_role;

ALTER TABLE public.project_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_project_deployments"
  ON public.project_deployments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE POLICY "owners_write_project_deployments"
  ON public.project_deployments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE POLICY "owners_update_project_deployments"
  ON public.project_deployments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_ops_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE POLICY "ops_delete_project_deployments"
  ON public.project_deployments FOR DELETE TO authenticated
  USING (public.is_ops_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS project_deployments_project_idx
  ON public.project_deployments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_deployments_user_idx
  ON public.project_deployments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_deployments_status_idx
  ON public.project_deployments(status, created_at DESC);

SELECT public._hxp_attach_touch('public.project_deployments'::regclass);

-- ============ project_deployment_events (immutable logs) ============
CREATE TABLE IF NOT EXISTS public.project_deployment_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id  uuid NOT NULL REFERENCES public.project_deployments(id) ON DELETE CASCADE,
  step           text NOT NULL,
  level          text NOT NULL DEFAULT 'info',
  message        text NOT NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.project_deployment_events TO authenticated;
GRANT ALL ON public.project_deployment_events TO service_role;

ALTER TABLE public.project_deployment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_project_deployment_events"
  ON public.project_deployment_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_deployments d
      WHERE d.id = deployment_id
        AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))
    )
  );

CREATE POLICY "insert_project_deployment_events"
  ON public.project_deployment_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_deployments d
      WHERE d.id = deployment_id
        AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))
    )
  );

CREATE OR REPLACE FUNCTION public.project_deployment_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'project_deployment_events are immutable'; END $$;

DROP TRIGGER IF EXISTS trg_project_deployment_events_immutable
  ON public.project_deployment_events;
CREATE TRIGGER trg_project_deployment_events_immutable
  BEFORE UPDATE OR DELETE ON public.project_deployment_events
  FOR EACH ROW EXECUTE FUNCTION public.project_deployment_events_immutable();

CREATE INDEX IF NOT EXISTS project_deployment_events_deployment_idx
  ON public.project_deployment_events(deployment_id, created_at);

-- ============ project_domains ============
CREATE TABLE IF NOT EXISTS public.project_domains (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostname      text NOT NULL,
  is_primary    boolean NOT NULL DEFAULT false,
  ssl_status    text NOT NULL DEFAULT 'pending',
  status        public.project_domain_status NOT NULL DEFAULT 'pending',
  dns_records   jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_token text,
  last_checked_at timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hostname)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_domains TO authenticated;
GRANT ALL ON public.project_domains TO service_role;

ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_manage_project_domains"
  ON public.project_domains FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_ops_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS project_domains_project_idx
  ON public.project_domains(project_id);

SELECT public._hxp_attach_touch('public.project_domains'::regclass);
