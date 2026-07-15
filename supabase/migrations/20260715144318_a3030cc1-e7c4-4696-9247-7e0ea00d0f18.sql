
-- R33 Observability Platform
CREATE TABLE public.obs_trace_spans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  service TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID,
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX obs_trace_spans_trace_idx ON public.obs_trace_spans(trace_id, started_at);
CREATE INDEX obs_trace_spans_service_idx ON public.obs_trace_spans(service, started_at DESC);
GRANT SELECT, INSERT ON public.obs_trace_spans TO authenticated;
GRANT ALL ON public.obs_trace_spans TO service_role;
ALTER TABLE public.obs_trace_spans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops read trace spans" ON public.obs_trace_spans FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops insert trace spans" ON public.obs_trace_spans FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.obs_trace_spans_immutable() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'obs_trace_spans are immutable'; END $$;
CREATE TRIGGER obs_trace_spans_no_update BEFORE UPDATE OR DELETE ON public.obs_trace_spans FOR EACH ROW EXECUTE FUNCTION public.obs_trace_spans_immutable();

CREATE TABLE public.obs_log_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  correlation_id TEXT,
  trace_id TEXT,
  actor_id UUID,
  company_id UUID,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX obs_log_entries_service_idx ON public.obs_log_entries(service, occurred_at DESC);
CREATE INDEX obs_log_entries_level_idx ON public.obs_log_entries(level, occurred_at DESC);
CREATE INDEX obs_log_entries_corr_idx ON public.obs_log_entries(correlation_id);
GRANT SELECT, INSERT ON public.obs_log_entries TO authenticated;
GRANT ALL ON public.obs_log_entries TO service_role;
ALTER TABLE public.obs_log_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops read logs" ON public.obs_log_entries FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops insert logs" ON public.obs_log_entries FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.obs_log_entries_immutable() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'obs_log_entries are immutable'; END $$;
CREATE TRIGGER obs_log_entries_no_update BEFORE UPDATE OR DELETE ON public.obs_log_entries FOR EACH ROW EXECUTE FUNCTION public.obs_log_entries_immutable();

CREATE TABLE public.obs_status_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  group_name TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obs_status_components TO authenticated;
GRANT ALL ON public.obs_status_components TO service_role;
ALTER TABLE public.obs_status_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops manage components" ON public.obs_status_components FOR ALL TO authenticated USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER obs_status_components_touch BEFORE UPDATE ON public.obs_status_components FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.obs_status_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_key TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  incident_id UUID,
  actor_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX obs_status_updates_key_idx ON public.obs_status_updates(component_key, occurred_at DESC);
GRANT SELECT, INSERT ON public.obs_status_updates TO authenticated;
GRANT ALL ON public.obs_status_updates TO service_role;
ALTER TABLE public.obs_status_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ops read status updates" ON public.obs_status_updates FOR SELECT TO authenticated USING (public.is_ops_admin(auth.uid()));
CREATE POLICY "ops insert status updates" ON public.obs_status_updates FOR INSERT TO authenticated WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.obs_status_updates_immutable() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'obs_status_updates are immutable'; END $$;
CREATE TRIGGER obs_status_updates_no_update BEFORE UPDATE OR DELETE ON public.obs_status_updates FOR EACH ROW EXECUTE FUNCTION public.obs_status_updates_immutable();

-- Seed default public status components (idempotent on key)
INSERT INTO public.obs_status_components (key, name, group_name, sort_order) VALUES
  ('platform', 'Platform', 'Core', 10),
  ('api-gateway', 'API Gateway', 'Core', 20),
  ('database', 'Database', 'Core', 30),
  ('queue', 'Job Queue', 'Core', 40),
  ('ai-gateway', 'AI Gateway', 'Intelligence', 50),
  ('brain', 'Happy Brain', 'Intelligence', 60),
  ('memory', 'Memory Engine', 'Intelligence', 70),
  ('knowledge-graph', 'Knowledge Graph', 'Intelligence', 80),
  ('automation', 'Automation', 'Runtime', 90),
  ('agents', 'AI Agents', 'Runtime', 100),
  ('analytics', 'Analytics', 'Runtime', 110),
  ('revenue', 'Revenue & Billing', 'Business', 120),
  ('crm', 'CRM', 'Business', 130),
  ('erp', 'ERP', 'Business', 140),
  ('manufacturing', 'Manufacturing', 'Business', 150),
  ('warehouse', 'Warehouse', 'Business', 160),
  ('finance', 'Finance', 'Business', 170),
  ('marketplace', 'Marketplace', 'Business', 180),
  ('deployment', 'Deployment', 'Runtime', 190),
  ('digital-human', 'Digital Human', 'Runtime', 200),
  ('notifications', 'Notifications', 'Core', 210),
  ('webhooks', 'Webhooks', 'Core', 220)
ON CONFLICT (key) DO NOTHING;
