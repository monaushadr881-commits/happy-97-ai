
-- ============================================================
-- R36 PLUGIN FRAMEWORK
-- ============================================================

-- Plugin registry
CREATE TABLE public.plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  publisher TEXT NOT NULL,
  publisher_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  homepage_url TEXT,
  icon_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','deprecated','suspended')),
  verified BOOLEAN NOT NULL DEFAULT false,
  latest_version_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plugins TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.plugins TO authenticated;
GRANT ALL ON public.plugins TO service_role;
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugins_read_published" ON public.plugins FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_ops_admin(auth.uid()));
CREATE POLICY "plugins_ops_manage" ON public.plugins FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

-- Plugin versions (immutable)
CREATE TABLE public.plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,
  entry_point TEXT,
  runtime TEXT NOT NULL DEFAULT 'serverfn' CHECK (runtime IN ('serverfn','webhook','iframe','worker')),
  checksum TEXT NOT NULL,
  changelog TEXT,
  min_platform_version TEXT,
  deprecated BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plugin_id, version)
);
GRANT SELECT ON public.plugin_versions TO authenticated, anon;
GRANT INSERT, UPDATE ON public.plugin_versions TO authenticated;
GRANT ALL ON public.plugin_versions TO service_role;
ALTER TABLE public.plugin_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_versions_read" ON public.plugin_versions FOR SELECT TO anon, authenticated
  USING (EXISTS(SELECT 1 FROM public.plugins p WHERE p.id = plugin_id AND (p.status = 'published' OR public.is_ops_admin(auth.uid()))));
CREATE POLICY "plugin_versions_ops_write" ON public.plugin_versions FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

ALTER TABLE public.plugins ADD CONSTRAINT plugins_latest_version_fk
  FOREIGN KEY (latest_version_id) REFERENCES public.plugin_versions(id) ON DELETE SET NULL;

-- Permission catalog
CREATE TABLE public.plugin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'company' CHECK (scope IN ('platform','company','workspace','user')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  requires_founder_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plugin_permissions TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.plugin_permissions TO authenticated;
GRANT ALL ON public.plugin_permissions TO service_role;
ALTER TABLE public.plugin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_permissions_read" ON public.plugin_permissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plugin_permissions_ops_write" ON public.plugin_permissions FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

-- Permissions requested by a version
CREATE TABLE public.plugin_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_version_id UUID NOT NULL REFERENCES public.plugin_versions(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  reason TEXT,
  optional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plugin_version_id, permission_code)
);
GRANT SELECT ON public.plugin_grants TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.plugin_grants TO authenticated;
GRANT ALL ON public.plugin_grants TO service_role;
ALTER TABLE public.plugin_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_grants_read" ON public.plugin_grants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plugin_grants_ops_write" ON public.plugin_grants FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

-- Installations
CREATE TABLE public.plugin_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  plugin_version_id UUID NOT NULL REFERENCES public.plugin_versions(id),
  previous_version_id UUID REFERENCES public.plugin_versions(id),
  status TEXT NOT NULL DEFAULT 'installed' CHECK (status IN ('installed','disabled','failed','uninstalled')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  granted_permissions TEXT[] NOT NULL DEFAULT '{}',
  installed_by UUID REFERENCES auth.users(id),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, plugin_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_installations TO authenticated;
GRANT ALL ON public.plugin_installations TO service_role;
ALTER TABLE public.plugin_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_installs_read" ON public.plugin_installations FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_ops_admin(auth.uid()));
CREATE POLICY "plugin_installs_admin_write" ON public.plugin_installations FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id) OR public.is_ops_admin(auth.uid()));

-- Immutable event log
CREATE TABLE public.plugin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES public.plugin_installations(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  plugin_id UUID REFERENCES public.plugins(id) ON DELETE SET NULL,
  plugin_version_id UUID REFERENCES public.plugin_versions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('installed','enabled','disabled','upgraded','rolled_back','uninstalled','invoked','error','permission_granted','permission_revoked','config_changed')),
  actor_id UUID REFERENCES auth.users(id),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','error','critical')),
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.plugin_events TO authenticated;
GRANT ALL ON public.plugin_events TO service_role;
ALTER TABLE public.plugin_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_events_read" ON public.plugin_events FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id)));
CREATE POLICY "plugin_events_insert" ON public.plugin_events FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));

CREATE OR REPLACE FUNCTION public.plugin_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN RAISE EXCEPTION 'plugin_events are immutable'; END $$;
CREATE TRIGGER trg_plugin_events_immutable
  BEFORE UPDATE OR DELETE ON public.plugin_events
  FOR EACH ROW EXECUTE FUNCTION public.plugin_events_immutable();

-- Analytics
CREATE TABLE public.plugin_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES public.plugin_installations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  invocations INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  p95_latency_ms INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(installation_id, day)
);
GRANT SELECT, INSERT, UPDATE ON public.plugin_analytics_daily TO authenticated;
GRANT ALL ON public.plugin_analytics_daily TO service_role;
ALTER TABLE public.plugin_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_analytics_read" ON public.plugin_analytics_daily FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()) OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "plugin_analytics_write" ON public.plugin_analytics_daily FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "plugin_analytics_update" ON public.plugin_analytics_daily FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));

-- Touch triggers
SELECT public._hxp_attach_touch('public.plugins');
SELECT public._hxp_attach_touch('public.plugin_installations');
SELECT public._hxp_attach_touch('public.plugin_analytics_daily');

CREATE INDEX idx_plugins_status ON public.plugins(status);
CREATE INDEX idx_plugin_versions_plugin ON public.plugin_versions(plugin_id);
CREATE INDEX idx_plugin_installations_company ON public.plugin_installations(company_id);
CREATE INDEX idx_plugin_events_installation ON public.plugin_events(installation_id, created_at DESC);
CREATE INDEX idx_plugin_analytics_day ON public.plugin_analytics_daily(company_id, day DESC);

-- Seed baseline permission catalog
INSERT INTO public.plugin_permissions (code, label, description, scope, risk_level, requires_founder_approval) VALUES
  ('read.public', 'Read public data', 'Read publicly available data only', 'company', 'low', false),
  ('read.company', 'Read company data', 'Read company records within RLS scope', 'company', 'medium', false),
  ('write.company', 'Write company data', 'Create or modify company records', 'company', 'high', false),
  ('read.finance', 'Read finance data', 'Read finance module data', 'company', 'high', true),
  ('write.finance', 'Write finance data', 'Create or modify finance records', 'company', 'critical', true),
  ('read.crm', 'Read CRM data', 'Read CRM leads/deals/customers', 'company', 'medium', false),
  ('write.crm', 'Write CRM data', 'Create or modify CRM records', 'company', 'high', false),
  ('brain.invoke', 'Invoke HAPPY Brain', 'Call brain sessions and intents', 'company', 'medium', false),
  ('agents.invoke', 'Invoke AI Agents', 'Execute registered AI agents', 'company', 'medium', false),
  ('automation.trigger', 'Trigger automations', 'Start automation workflows', 'company', 'medium', false),
  ('webhooks.receive', 'Receive webhooks', 'Handle inbound webhook payloads', 'company', 'medium', false),
  ('storage.read', 'Read storage', 'Read from storage buckets', 'company', 'medium', false),
  ('storage.write', 'Write storage', 'Upload to storage buckets', 'company', 'high', false),
  ('platform.manage', 'Manage platform', 'Platform-level operations', 'platform', 'critical', true)
ON CONFLICT (code) DO NOTHING;
