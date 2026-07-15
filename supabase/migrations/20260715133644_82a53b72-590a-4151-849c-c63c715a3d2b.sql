-- R26 Enterprise Analytics / BI runtime
CREATE TABLE public.bi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL, -- 'revenue' | 'finance' | 'crm' | 'wms' | 'mfg' | 'marketplace' | 'builder' | 'system' | 'founder'
  metric_key text NOT NULL,
  period_grain text NOT NULL CHECK (period_grain IN ('hour','day','week','month','quarter','year','all')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  value_numeric numeric,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'engine',
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, scope, metric_key, period_grain, period_start)
);
CREATE INDEX bi_snapshots_lookup ON public.bi_snapshots (company_id, scope, metric_key, period_grain, period_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_snapshots TO authenticated;
GRANT ALL ON public.bi_snapshots TO service_role;
ALTER TABLE public.bi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_snapshots read" ON public.bi_snapshots FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_snapshots write" ON public.bi_snapshots FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_bi_snapshots BEFORE UPDATE ON public.bi_snapshots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bi_report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general', -- revenue|finance|sales|ops|marketplace|builder|founder
  scope text NOT NULL DEFAULT 'company',
  query_spec jsonb NOT NULL DEFAULT '{}'::jsonb,  -- declarative spec: metrics, filters, grain
  visualization jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule text,          -- cron expression, nullable
  delivery jsonb NOT NULL DEFAULT '{}'::jsonb, -- {email:[], format:'pdf'|'xlsx'|'csv'|'json'}
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_report_definitions TO authenticated;
GRANT ALL ON public.bi_report_definitions TO service_role;
ALTER TABLE public.bi_report_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_report_defs read" ON public.bi_report_definitions FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_report_defs write" ON public.bi_report_definitions FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_touch_bi_report_definitions BEFORE UPDATE ON public.bi_report_definitions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bi_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  definition_id uuid REFERENCES public.bi_report_definitions(id) ON DELETE SET NULL,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded','failed','running')),
  format text NOT NULL DEFAULT 'json',
  period_start timestamptz,
  period_end timestamptz,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  duration_ms integer,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bi_report_runs_lookup ON public.bi_report_runs (company_id, code, created_at DESC);
GRANT SELECT, INSERT ON public.bi_report_runs TO authenticated;
GRANT ALL ON public.bi_report_runs TO service_role;
ALTER TABLE public.bi_report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_report_runs read" ON public.bi_report_runs FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_report_runs insert" ON public.bi_report_runs FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.bi_report_runs_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'bi_report_runs are immutable'; END $$;
CREATE TRIGGER trg_bi_report_runs_immutable BEFORE UPDATE OR DELETE ON public.bi_report_runs FOR EACH ROW EXECUTE FUNCTION public.bi_report_runs_immutable();

CREATE TABLE public.bi_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL,       -- revenue|expense|sales|inventory|demand|production|deployment
  metric_key text NOT NULL,
  method text NOT NULL DEFAULT 'linear',  -- linear|ema|naive
  horizon_days integer NOT NULL,
  history_from timestamptz NOT NULL,
  history_to timestamptz NOT NULL,
  history_points jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{t, v}]
  forecast_points jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{t, v, lo?, hi?}]
  confidence numeric,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bi_forecasts_lookup ON public.bi_forecasts (company_id, scope, metric_key, created_at DESC);
GRANT SELECT, INSERT ON public.bi_forecasts TO authenticated;
GRANT ALL ON public.bi_forecasts TO service_role;
ALTER TABLE public.bi_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_forecasts read" ON public.bi_forecasts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_forecasts insert" ON public.bi_forecasts FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.bi_forecasts_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'bi_forecasts are immutable'; END $$;
CREATE TRIGGER trg_bi_forecasts_immutable BEFORE UPDATE OR DELETE ON public.bi_forecasts FOR EACH ROW EXECUTE FUNCTION public.bi_forecasts_immutable();

CREATE TABLE public.bi_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','notice','warning','critical')),
  kind text NOT NULL DEFAULT 'summary', -- summary|trend|anomaly|risk|recommendation
  title text NOT NULL,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,             -- observed facts (numeric evidence)
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,   -- AI suggestions
  source text NOT NULL DEFAULT 'engine',
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bi_insights_lookup ON public.bi_insights (company_id, scope, created_at DESC);
GRANT SELECT, INSERT ON public.bi_insights TO authenticated;
GRANT ALL ON public.bi_insights TO service_role;
ALTER TABLE public.bi_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_insights read" ON public.bi_insights FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_insights insert" ON public.bi_insights FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE OR REPLACE FUNCTION public.bi_insights_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN RAISE EXCEPTION 'bi_insights are immutable'; END $$;
CREATE TRIGGER trg_bi_insights_immutable BEFORE UPDATE OR DELETE ON public.bi_insights FOR EACH ROW EXECUTE FUNCTION public.bi_insights_immutable();

CREATE TABLE public.bi_alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  scope text NOT NULL,
  metric_key text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','notice','warning','critical')),
  observed_value numeric,
  threshold_value numeric,
  message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bi_alert_events_lookup ON public.bi_alert_events (company_id, scope, triggered_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.bi_alert_events TO authenticated;
GRANT ALL ON public.bi_alert_events TO service_role;
ALTER TABLE public.bi_alert_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_alert_events read" ON public.bi_alert_events FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_alert_events insert" ON public.bi_alert_events FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bi_alert_events ack" ON public.bi_alert_events FOR UPDATE TO authenticated USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));