
-- ============================================================================
-- R44 Business Specialist Modes Runtime
-- ============================================================================

-- Mode registry ---------------------------------------------------------------
CREATE TABLE public.specialist_mode_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  domain text NOT NULL,
  description text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  runtime_routes jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_roles text[] NOT NULL DEFAULT '{}',
  min_confidence numeric NOT NULL DEFAULT 0.4,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specialist_mode_registry TO authenticated;
GRANT ALL ON public.specialist_mode_registry TO service_role;
ALTER TABLE public.specialist_mode_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spec_registry_read_auth" ON public.specialist_mode_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "spec_registry_ops_write" ON public.specialist_mode_registry
  FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_spec_registry BEFORE UPDATE ON public.specialist_mode_registry
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Sessions --------------------------------------------------------------------
CREATE TABLE public.specialist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  workspace_id uuid,
  happy_session_id uuid,
  current_mode text NOT NULL,
  previous_mode text,
  mode_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spec_sessions_status_chk CHECK (status IN ('active','paused','archived','ended'))
);
CREATE INDEX idx_spec_sessions_user ON public.specialist_sessions(user_id, status);
CREATE INDEX idx_spec_sessions_company ON public.specialist_sessions(company_id);
GRANT SELECT, INSERT, UPDATE ON public.specialist_sessions TO authenticated;
GRANT ALL ON public.specialist_sessions TO service_role;
ALTER TABLE public.specialist_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spec_sessions_owner_read" ON public.specialist_sessions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
    OR public.is_ops_admin(auth.uid())
  );
CREATE POLICY "spec_sessions_owner_write" ON public.specialist_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spec_sessions_owner_update" ON public.specialist_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_touch_spec_sessions BEFORE UPDATE ON public.specialist_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Turns (immutable) -----------------------------------------------------------
CREATE TABLE public.specialist_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.specialist_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  company_id uuid,
  seq bigint NOT NULL,
  mode text NOT NULL,
  intent text NOT NULL,
  domain text NOT NULL,
  capability text,
  routed_runtime text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,        -- [{source_runtime, timestamp, evidence, confidence}]
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{reason, confidence, supporting_evidence, source_runtime, timestamp}]
  confidence numeric NOT NULL DEFAULT 0,
  latency_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);
CREATE INDEX idx_spec_turns_session ON public.specialist_turns(session_id, seq);
CREATE INDEX idx_spec_turns_user ON public.specialist_turns(user_id);
GRANT SELECT, INSERT ON public.specialist_turns TO authenticated;
GRANT ALL ON public.specialist_turns TO service_role;
ALTER TABLE public.specialist_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spec_turns_read" ON public.specialist_turns
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
    OR public.is_ops_admin(auth.uid())
  );
CREATE POLICY "spec_turns_write" ON public.specialist_turns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.specialist_turns_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'specialist_turns are immutable'; END $$;
CREATE TRIGGER trg_spec_turns_immutable
  BEFORE UPDATE OR DELETE ON public.specialist_turns
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

-- Analytics snapshots (append-only) -------------------------------------------
CREATE TABLE public.specialist_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  session_id uuid REFERENCES public.specialist_sessions(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  total_turns integer NOT NULL DEFAULT 0,
  total_sessions integer NOT NULL DEFAULT 0,
  mode_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  domain_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  avg_confidence numeric NOT NULL DEFAULT 0,
  evidence_coverage numeric NOT NULL DEFAULT 0,
  recommendation_count integer NOT NULL DEFAULT 0,
  avg_latency_ms numeric NOT NULL DEFAULT 0,
  computed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_spec_analytics_company ON public.specialist_analytics_snapshots(company_id, created_at DESC);
GRANT SELECT, INSERT ON public.specialist_analytics_snapshots TO authenticated;
GRANT ALL ON public.specialist_analytics_snapshots TO service_role;
ALTER TABLE public.specialist_analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spec_analytics_read" ON public.specialist_analytics_snapshots
  FOR SELECT TO authenticated
  USING (
    (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
    OR public.is_ops_admin(auth.uid())
    OR (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.specialist_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    ))
  );
CREATE POLICY "spec_analytics_write" ON public.specialist_analytics_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    computed_by = auth.uid()
    AND (
      (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
      OR public.is_ops_admin(auth.uid())
      OR (session_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.specialist_sessions s
        WHERE s.id = session_id AND s.user_id = auth.uid()
      ))
    )
  );

CREATE TRIGGER trg_spec_analytics_immutable
  BEFORE UPDATE OR DELETE ON public.specialist_analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

-- Seed the 30 specialist modes -----------------------------------------------
INSERT INTO public.specialist_mode_registry (code, label, domain, description, capabilities, runtime_routes) VALUES
 ('founder_advisor','Founder Advisor','executive','Executive strategy, growth, risk, approvals','["strategy","risk","approvals","growth","health"]','{"primary":"founder-workspace","fallback":"brain"}'),
 ('ceo_advisor','CEO Advisor','executive','Board-level operations, KPIs, decisions','["kpi","decision","board","escalation"]','{"primary":"founder-workspace","fallback":"brain"}'),
 ('sales_consultant','Sales Consultant','sales','Products, pricing, dealers, quotations, follow-ups','["catalog","pricing","quotation","lead_followup"]','{"primary":"crm","secondary":"commerce"}'),
 ('marketing_consultant','Marketing Consultant','marketing','Campaigns, content, audience, funnels','["campaign","content","audience"]','{"primary":"cms","secondary":"analytics"}'),
 ('finance_consultant','Finance Consultant','finance','Revenue, expenses, cash flow, KPIs','["revenue","expenses","cashflow","kpi"]','{"primary":"finance","secondary":"analytics"}'),
 ('accounting_consultant','Accounting Consultant','finance','Ledgers, invoices, journals, tax','["ledger","invoice","journal","tax"]','{"primary":"finance"}'),
 ('revenue_consultant','Revenue Consultant','finance','Revenue ops, subscriptions, credits','["subscription","credits","wallet","revenue"]','{"primary":"revenue","secondary":"wallet"}'),
 ('crm_consultant','CRM Consultant','crm','Leads, deals, customer pipeline','["lead","deal","customer","task"]','{"primary":"crm"}'),
 ('erp_consultant','ERP Consultant','erp','Procurement, vendors, POs, approvals','["procurement","po","vendor","approval"]','{"primary":"erp"}'),
 ('hr_consultant','HR Consultant','hr','Employees, roles, workforce','["employee","workforce","role"]','{"primary":"hr","secondary":"workforce"}'),
 ('recruitment_consultant','Recruitment Consultant','hr','Hiring, candidates, pipeline','["hiring","candidate"]','{"primary":"hr"}'),
 ('manufacturing_consultant','Manufacturing Consultant','manufacturing','Production, batches, quality, machines','["production","batch","quality","machine"]','{"primary":"mfg","secondary":"quality"}'),
 ('warehouse_consultant','Warehouse Consultant','warehouse','Bins, zones, movement, transfers','["bin","zone","movement","transfer"]','{"primary":"wms"}'),
 ('inventory_consultant','Inventory Consultant','warehouse','Stock, thresholds, reservations','["stock","threshold","reservation"]','{"primary":"wms","secondary":"analytics"}'),
 ('marketplace_consultant','Marketplace Consultant','marketplace','Listings, purchases, creators, plugins','["listing","purchase","creator","plugin"]','{"primary":"marketplace","secondary":"plugins"}'),
 ('website_builder_consultant','Website Builder Consultant','builder','Sites, pages, publishing','["site","page","publish"]','{"primary":"website-builder","secondary":"deployment"}'),
 ('app_builder_consultant','App Builder Consultant','builder','Apps, screens, publishing','["app","screen","publish"]','{"primary":"app-builder","secondary":"deployment"}'),
 ('deployment_consultant','Deployment Consultant','deployment','Deployments, domains, certificates','["deployment","domain","cert"]','{"primary":"deployment"}'),
 ('plugin_consultant','Plugin Consultant','marketplace','Plugin lifecycle, grants, analytics','["plugin","grant","analytics"]','{"primary":"plugins"}'),
 ('automation_consultant','Automation Consultant','automation','Workflows, runs, approvals','["workflow","run","approval"]','{"primary":"automation"}'),
 ('ai_consultant','AI Consultant','ai','Agents, missions, tools','["agent","mission","tool"]','{"primary":"brain","secondary":"agents"}'),
 ('research_consultant','Research Consultant','knowledge','Research, insights, references','["research","insight","reference"]','{"primary":"knowledge","secondary":"kg"}'),
 ('education_consultant','Education Consultant','learning','Courses, lessons, progress','["course","lesson","progress"]','{"primary":"education"}'),
 ('library_consultant','Library Consultant','knowledge','Digital library, articles, chunks','["article","chunk","category"]','{"primary":"knowledge"}'),
 ('razvi_academy_consultant','Razvi Academy Consultant','learning','Razvi Academy programs and enrollments','["program","enrollment","assignment"]','{"primary":"education","secondary":"presentation-runtime"}'),
 ('support_consultant','Support Consultant','support','Tickets, incidents, SLAs','["ticket","incident","sla"]','{"primary":"support","fallback":"observability"}'),
 ('legal_consultant','Legal Documentation Consultant','legal','Contracts, agreements, docs','["contract","document","clause"]','{"primary":"cms","secondary":"knowledge"}'),
 ('compliance_consultant','Compliance Consultant','compliance','Policies, audits, controls','["policy","audit","control"]','{"primary":"compliance","secondary":"audit"}'),
 ('security_consultant','Security Consultant','security','Access, roles, findings','["access","role","finding"]','{"primary":"security","secondary":"audit"}'),
 ('operations_consultant','Operations Consultant','operations','Ops KPIs, incidents, health','["kpi","incident","health"]','{"primary":"operations","secondary":"observability"}')
ON CONFLICT (code) DO NOTHING;
