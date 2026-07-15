
-- Widen project_domains for DNS/SSL tracking (kept as text to avoid enum lock-in).
ALTER TABLE public.project_domains
  ADD COLUMN IF NOT EXISTS dns_status      text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS ssl_state       text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ssl_issued_at   timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_serial      text,
  ADD COLUMN IF NOT EXISTS ssl_issuer      text,
  ADD COLUMN IF NOT EXISTS ssl_last_error  text,
  ADD COLUMN IF NOT EXISTS verified_at     timestamptz,
  ADD COLUMN IF NOT EXISTS redirect_rules  jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS project_domains_ssl_expiry_idx
  ON public.project_domains(ssl_expires_at) WHERE ssl_expires_at IS NOT NULL;

-- ============ project_domain_certificates ============
CREATE TABLE IF NOT EXISTS public.project_domain_certificates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id    uuid NOT NULL REFERENCES public.project_domains(id) ON DELETE CASCADE,
  serial       text,
  issuer       text,
  fingerprint  text,
  state        text NOT NULL DEFAULT 'pending',
  issued_at    timestamptz,
  expires_at   timestamptz,
  renewed_from uuid REFERENCES public.project_domain_certificates(id) ON DELETE SET NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_domain_certificates TO authenticated;
GRANT ALL ON public.project_domain_certificates TO service_role;

ALTER TABLE public.project_domain_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_manage_domain_certs"
  ON public.project_domain_certificates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_domains d
                 WHERE d.id = project_domain_certificates.domain_id
                   AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_domains d
                      WHERE d.id = project_domain_certificates.domain_id
                        AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))));

CREATE INDEX IF NOT EXISTS project_domain_certs_domain_idx
  ON public.project_domain_certificates(domain_id);
CREATE INDEX IF NOT EXISTS project_domain_certs_expiry_idx
  ON public.project_domain_certificates(expires_at) WHERE expires_at IS NOT NULL;

SELECT public._hxp_attach_touch('public.project_domain_certificates'::regclass);

-- ============ project_domain_events (immutable) ============
CREATE TABLE IF NOT EXISTS public.project_domain_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id  uuid NOT NULL REFERENCES public.project_domains(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  level      text NOT NULL DEFAULT 'info',
  message    text,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.project_domain_events TO authenticated;
GRANT ALL ON public.project_domain_events TO service_role;

ALTER TABLE public.project_domain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_domain_events"
  ON public.project_domain_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.project_domains d
                 WHERE d.id = project_domain_events.domain_id
                   AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))));

CREATE POLICY "owners_write_domain_events"
  ON public.project_domain_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_domains d
                      WHERE d.id = project_domain_events.domain_id
                        AND (d.user_id = auth.uid() OR public.is_ops_admin(auth.uid()))));

CREATE INDEX IF NOT EXISTS project_domain_events_domain_idx
  ON public.project_domain_events(domain_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.project_domain_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'project_domain_events are immutable'; END $$;

DROP TRIGGER IF EXISTS trg_project_domain_events_immutable
  ON public.project_domain_events;
CREATE TRIGGER trg_project_domain_events_immutable
  BEFORE UPDATE OR DELETE ON public.project_domain_events
  FOR EACH ROW EXECUTE FUNCTION public.project_domain_events_immutable();
