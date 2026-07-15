-- R32 HAPPY Enterprise API Gateway, Integration Hub, Developer Platform (apigw_ prefix)

CREATE TABLE public.apigw_api_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  version text NOT NULL DEFAULT 'v1',
  kind text NOT NULL DEFAULT 'private' CHECK (kind IN ('public','private','internal','partner','admin','founder')),
  base_path text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated','disabled')),
  deprecated_at timestamptz,
  successor_id uuid REFERENCES public.apigw_api_registry(id) ON DELETE SET NULL,
  default_rate_limit_per_min integer NOT NULL DEFAULT 120,
  requires_auth boolean NOT NULL DEFAULT true,
  auth_methods text[] NOT NULL DEFAULT ARRAY['bearer','api_key'],
  scopes text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug, version)
);
CREATE INDEX apigw_api_registry_company ON public.apigw_api_registry (company_id);
CREATE INDEX apigw_api_registry_kind ON public.apigw_api_registry (kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_api_registry TO authenticated;
GRANT ALL ON public.apigw_api_registry TO service_role;
ALTER TABLE public.apigw_api_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_api_registry read" ON public.apigw_api_registry FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_api_registry write" ON public.apigw_api_registry FOR ALL TO authenticated
USING (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_api_registry BEFORE UPDATE ON public.apigw_api_registry
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_api_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid NOT NULL REFERENCES public.apigw_api_registry(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE','OPTIONS')),
  path text NOT NULL,
  summary text,
  description text,
  request_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  example_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  example_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_scopes text[] NOT NULL DEFAULT '{}',
  rate_limit_per_min integer,
  cacheable boolean NOT NULL DEFAULT false,
  deprecated boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  runtime text,
  runtime_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (api_id, method, path)
);
CREATE INDEX apigw_api_routes_api ON public.apigw_api_routes (api_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_api_routes TO authenticated;
GRANT ALL ON public.apigw_api_routes TO service_role;
ALTER TABLE public.apigw_api_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_api_routes read" ON public.apigw_api_routes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.apigw_api_registry a WHERE a.id = api_id
  AND (a.company_id IS NULL OR public.is_company_member(auth.uid(), a.company_id))));
CREATE POLICY "apigw_api_routes write" ON public.apigw_api_routes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.apigw_api_registry a WHERE a.id = api_id
  AND a.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), a.company_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.apigw_api_registry a WHERE a.id = api_id
  AND a.company_id IS NOT NULL AND public.is_company_admin(auth.uid(), a.company_id)));
CREATE TRIGGER trg_touch_apigw_api_routes BEFORE UPDATE ON public.apigw_api_routes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  key_last4 text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  allowed_apis uuid[] NOT NULL DEFAULT '{}',
  rate_limit_per_min integer NOT NULL DEFAULT 120,
  environment text NOT NULL DEFAULT 'live' CHECK (environment IN ('live','test','sandbox')),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  rotated_from uuid REFERENCES public.apigw_keys(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX apigw_keys_hash_uq ON public.apigw_keys (key_hash);
CREATE INDEX apigw_keys_company ON public.apigw_keys (company_id) WHERE revoked_at IS NULL;
GRANT SELECT, INSERT, UPDATE ON public.apigw_keys TO authenticated;
GRANT ALL ON public.apigw_keys TO service_role;
ALTER TABLE public.apigw_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_keys read" ON public.apigw_keys FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_keys write" ON public.apigw_keys FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_keys BEFORE UPDATE ON public.apigw_keys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_service_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scopes text[] NOT NULL DEFAULT '{}',
  api_key_id uuid REFERENCES public.apigw_keys(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_service_accounts TO authenticated;
GRANT ALL ON public.apigw_service_accounts TO service_role;
ALTER TABLE public.apigw_service_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_svc_acc read" ON public.apigw_service_accounts FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_svc_acc write" ON public.apigw_service_accounts FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_svc_acc BEFORE UPDATE ON public.apigw_service_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id text NOT NULL UNIQUE,
  client_secret_hash text NOT NULL,
  name text NOT NULL,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  allowed_scopes text[] NOT NULL DEFAULT '{}',
  grant_types text[] NOT NULL DEFAULT ARRAY['authorization_code','refresh_token'],
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_oauth_clients TO authenticated;
GRANT ALL ON public.apigw_oauth_clients TO service_role;
ALTER TABLE public.apigw_oauth_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_oauth_clients read" ON public.apigw_oauth_clients FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_oauth_clients write" ON public.apigw_oauth_clients FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_oauth_clients BEFORE UPDATE ON public.apigw_oauth_clients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.apigw_oauth_clients(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_hash text NOT NULL,
  refresh_token_hash text,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX apigw_oauth_tokens_access_uq ON public.apigw_oauth_tokens (access_token_hash);
CREATE INDEX apigw_oauth_tokens_client ON public.apigw_oauth_tokens (client_id) WHERE revoked_at IS NULL;
GRANT SELECT, INSERT, UPDATE ON public.apigw_oauth_tokens TO authenticated;
GRANT ALL ON public.apigw_oauth_tokens TO service_role;
ALTER TABLE public.apigw_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_oauth_tokens read" ON public.apigw_oauth_tokens FOR SELECT TO authenticated
USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "apigw_oauth_tokens write" ON public.apigw_oauth_tokens FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE public.apigw_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  api_id uuid REFERENCES public.apigw_api_registry(id) ON DELETE SET NULL,
  route_id uuid REFERENCES public.apigw_api_routes(id) ON DELETE SET NULL,
  api_key_id uuid REFERENCES public.apigw_keys(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  auth_method text,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  latency_ms integer NOT NULL DEFAULT 0,
  request_bytes integer NOT NULL DEFAULT 0,
  response_bytes integer NOT NULL DEFAULT 0,
  ip inet,
  user_agent text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apigw_usage_company_time ON public.apigw_usage_log (company_id, created_at DESC);
CREATE INDEX apigw_usage_api_time ON public.apigw_usage_log (api_id, created_at DESC);
CREATE INDEX apigw_usage_key ON public.apigw_usage_log (api_key_id, created_at DESC);
CREATE INDEX apigw_usage_status ON public.apigw_usage_log (status_code) WHERE status_code >= 400;
GRANT SELECT, INSERT ON public.apigw_usage_log TO authenticated;
GRANT ALL ON public.apigw_usage_log TO service_role;
ALTER TABLE public.apigw_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_usage read" ON public.apigw_usage_log FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_usage insert" ON public.apigw_usage_log FOR INSERT TO authenticated
WITH CHECK (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.apigw_usage_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'apigw_usage_log is immutable'; END; $$;
CREATE TRIGGER trg_apigw_usage_immutable BEFORE UPDATE OR DELETE ON public.apigw_usage_log
  FOR EACH ROW EXECUTE FUNCTION public.apigw_usage_immutable();

CREATE TABLE public.apigw_rate_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  limit_per_min integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_key, window_start)
);
CREATE INDEX apigw_rate_scope_time ON public.apigw_rate_counters (scope_key, window_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_rate_counters TO authenticated;
GRANT ALL ON public.apigw_rate_counters TO service_role;
ALTER TABLE public.apigw_rate_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_rate_counters all" ON public.apigw_rate_counters FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TABLE public.apigw_webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  event_types text[] NOT NULL DEFAULT '{}',
  secret_hash text NOT NULL,
  secret_last4 text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  version text NOT NULL DEFAULT 'v1',
  max_retries integer NOT NULL DEFAULT 5,
  backoff text NOT NULL DEFAULT 'exponential' CHECK (backoff IN ('linear','exponential')),
  timeout_ms integer NOT NULL DEFAULT 10000,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_streak integer NOT NULL DEFAULT 0,
  disabled_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apigw_wh_ep_company ON public.apigw_webhook_endpoints (company_id) WHERE active = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_webhook_endpoints TO authenticated;
GRANT ALL ON public.apigw_webhook_endpoints TO service_role;
ALTER TABLE public.apigw_webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_wh_ep read" ON public.apigw_webhook_endpoints FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_wh_ep write" ON public.apigw_webhook_endpoints FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_wh_ep BEFORE UPDATE ON public.apigw_webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.apigw_webhook_endpoints(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_id text NOT NULL,
  payload jsonb NOT NULL,
  signature text NOT NULL,
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed','dead_letter','retrying')),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_status_code integer,
  last_response text,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apigw_wh_deliv_pending ON public.apigw_webhook_deliveries (status, next_attempt_at) WHERE status IN ('pending','retrying');
CREATE INDEX apigw_wh_deliv_endpoint ON public.apigw_webhook_deliveries (endpoint_id, created_at DESC);
CREATE UNIQUE INDEX apigw_wh_deliv_event_uq ON public.apigw_webhook_deliveries (endpoint_id, event_id);
GRANT SELECT, INSERT, UPDATE ON public.apigw_webhook_deliveries TO authenticated;
GRANT ALL ON public.apigw_webhook_deliveries TO service_role;
ALTER TABLE public.apigw_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_wh_deliv read" ON public.apigw_webhook_deliveries FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_wh_deliv write" ON public.apigw_webhook_deliveries FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_wh_deliv BEFORE UPDATE ON public.apigw_webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_webhook_inbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  source text NOT NULL,
  event_type text,
  event_id text NOT NULL,
  signature text,
  verified boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL,
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','duplicate','rejected','failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, event_id)
);
CREATE INDEX apigw_wh_in_company_time ON public.apigw_webhook_inbound (company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.apigw_webhook_inbound TO authenticated;
GRANT ALL ON public.apigw_webhook_inbound TO service_role;
ALTER TABLE public.apigw_webhook_inbound ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_wh_in read" ON public.apigw_webhook_inbound FOR SELECT TO authenticated
USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_wh_in write" ON public.apigw_webhook_inbound FOR ALL TO authenticated
USING (company_id IS NULL OR public.is_company_admin(auth.uid(), company_id))
WITH CHECK (company_id IS NULL OR public.is_company_admin(auth.uid(), company_id));

CREATE TABLE public.apigw_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  auth_kind text NOT NULL CHECK (auth_kind IN ('oauth2','api_key','service_account','webhook','none')),
  scopes text[] NOT NULL DEFAULT '{}',
  webhook_events text[] NOT NULL DEFAULT '{}',
  documentation_url text,
  icon_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','beta','deprecated','planned')),
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.apigw_connectors TO authenticated;
GRANT ALL ON public.apigw_connectors TO service_role;
ALTER TABLE public.apigw_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_connectors read" ON public.apigw_connectors FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_touch_apigw_connectors BEFORE UPDATE ON public.apigw_connectors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.apigw_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL REFERENCES public.apigw_connectors(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  credentials_ref text,
  scopes text[] NOT NULL DEFAULT '{}',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('unknown','healthy','degraded','error','disabled')),
  last_health_at timestamptz,
  last_health_message text,
  last_used_at timestamptz,
  failure_streak integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, connector_id, name)
);
CREATE INDEX apigw_connections_company ON public.apigw_connections (company_id);
CREATE INDEX apigw_connections_status ON public.apigw_connections (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apigw_connections TO authenticated;
GRANT ALL ON public.apigw_connections TO service_role;
ALTER TABLE public.apigw_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apigw_connections read" ON public.apigw_connections FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "apigw_connections write" ON public.apigw_connections FOR ALL TO authenticated
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_apigw_connections BEFORE UPDATE ON public.apigw_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.apigw_connectors (code, name, category, auth_kind, status, description) VALUES
  ('google_workspace','Google Workspace','productivity','oauth2','active','Gmail, Drive, Calendar, Docs'),
  ('microsoft_365','Microsoft 365','productivity','oauth2','active','Outlook, OneDrive, Teams'),
  ('github','GitHub','dev','oauth2','active','Repos, issues, PRs'),
  ('gitlab','GitLab','dev','oauth2','active','Repos, pipelines'),
  ('slack','Slack','comms','oauth2','active','Channels, messages'),
  ('discord','Discord','comms','oauth2','active','Guilds, channels'),
  ('whatsapp_business','WhatsApp Business','comms','api_key','active','Messaging via WhatsApp Business API'),
  ('twilio','Twilio','comms','api_key','active','SMS, voice, WhatsApp'),
  ('smtp','SMTP','comms','api_key','active','Generic SMTP relay'),
  ('cloudflare','Cloudflare','cloud','api_key','active','DNS, workers, R2'),
  ('netlify','Netlify','cloud','api_key','active','Static hosting'),
  ('vercel','Vercel','cloud','api_key','active','Edge hosting'),
  ('stripe','Stripe','payments','api_key','active','Cards, subscriptions'),
  ('razorpay','Razorpay','payments','api_key','active','India payments'),
  ('cashfree','Cashfree','payments','api_key','active','India payments'),
  ('paddle','Paddle','payments','api_key','active','Merchant of record'),
  ('paypal','PayPal','payments','api_key','active','Global payments'),
  ('aws','Amazon Web Services','cloud','api_key','active','S3, SES, Lambda'),
  ('azure','Microsoft Azure','cloud','api_key','active','Blob, functions'),
  ('digitalocean','DigitalOcean','cloud','api_key','active','Droplets, spaces')
ON CONFLICT (code) DO NOTHING;