
-- ============================================================
-- R51 HAPPY AI EMPLOYEE STUDIO
-- ============================================================

CREATE TABLE public.happy_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  official_name TEXT NOT NULL DEFAULT 'HAPPY',
  role_title TEXT NOT NULL DEFAULT 'AI Employee',
  brand TEXT NOT NULL DEFAULT 'HAPPY',
  company TEXT NOT NULL DEFAULT 'H.P PRIVATE LIMITED',
  biography TEXT,
  mission TEXT,
  vision TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en','hi','ur'],
  primary_language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  active_version_id UUID,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT happy_identity_singleton_true CHECK (singleton = true)
);
GRANT SELECT ON public.happy_identity TO authenticated, anon;
GRANT INSERT, UPDATE ON public.happy_identity TO authenticated;
GRANT ALL ON public.happy_identity TO service_role;
ALTER TABLE public.happy_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_identity_read" ON public.happy_identity FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_identity_ops_write" ON public.happy_identity FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_appearance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE UNIQUE,
  face JSONB NOT NULL DEFAULT '{}'::jsonb,
  hair JSONB NOT NULL DEFAULT '{}'::jsonb,
  beard JSONB NOT NULL DEFAULT '{}'::jsonb,
  eyes JSONB NOT NULL DEFAULT '{}'::jsonb,
  skin JSONB NOT NULL DEFAULT '{}'::jsonb,
  clothing JSONB NOT NULL DEFAULT '{}'::jsonb,
  accessories JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment JSONB NOT NULL DEFAULT '{}'::jsonb,
  lighting JSONB NOT NULL DEFAULT '{}'::jsonb,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.happy_appearance TO authenticated, anon;
GRANT INSERT, UPDATE ON public.happy_appearance TO authenticated;
GRANT ALL ON public.happy_appearance TO service_role;
ALTER TABLE public.happy_appearance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_appearance_read" ON public.happy_appearance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_appearance_ops_write" ON public.happy_appearance FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'lovable' CHECK (provider IN ('lovable','openai','gemini','elevenlabs')),
  voice_id TEXT NOT NULL,
  pitch NUMERIC NOT NULL DEFAULT 1.0,
  speed NUMERIC NOT NULL DEFAULT 1.0,
  emotion TEXT DEFAULT 'neutral',
  pause_style TEXT DEFAULT 'natural',
  greeting_sample TEXT,
  business_tone JSONB NOT NULL DEFAULT '{}'::jsonb,
  teaching_tone JSONB NOT NULL DEFAULT '{}'::jsonb,
  founder_tone JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, language, provider, voice_id)
);
GRANT SELECT ON public.happy_voice TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.happy_voice TO authenticated;
GRANT ALL ON public.happy_voice TO service_role;
ALTER TABLE public.happy_voice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_voice_read" ON public.happy_voice FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_voice_ops_write" ON public.happy_voice FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('professional','friendly','confident','respectful','teaching','sales','founder','research','presentation','support','receptionist','meeting','learning')),
  system_prompt TEXT NOT NULL,
  temperament JSONB NOT NULL DEFAULT '{}'::jsonb,
  boundaries TEXT[] NOT NULL DEFAULT '{}',
  default_persona BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, mode)
);
GRANT SELECT ON public.happy_behavior TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.happy_behavior TO authenticated;
GRANT ALL ON public.happy_behavior TO service_role;
ALTER TABLE public.happy_behavior ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_behavior_read" ON public.happy_behavior FOR SELECT TO authenticated USING (true);
CREATE POLICY "happy_behavior_ops_write" ON public.happy_behavior FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  skill_code TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  runtime_route TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  required_permissions TEXT[] NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, skill_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.happy_skills TO authenticated;
GRANT ALL ON public.happy_skills TO service_role;
ALTER TABLE public.happy_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_skills_read" ON public.happy_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "happy_skills_ops_write" ON public.happy_skills FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_knowledge_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('document','category','kg_entity','course','memory','policy','product','service')),
  ref_id UUID,
  ref_key TEXT,
  label TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.happy_knowledge_refs TO authenticated;
GRANT ALL ON public.happy_knowledge_refs TO service_role;
ALTER TABLE public.happy_knowledge_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_knowledge_read" ON public.happy_knowledge_refs FOR SELECT TO authenticated USING (true);
CREATE POLICY "happy_knowledge_ops_write" ON public.happy_knowledge_refs FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  clip_code TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('idle','blink','smile','listen','talk','presentation','teaching','walk','sit','stand','gesture','custom')),
  asset_url TEXT,
  asset_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  loops BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, clip_code)
);
GRANT SELECT ON public.happy_animations TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.happy_animations TO authenticated;
GRANT ALL ON public.happy_animations TO service_role;
ALTER TABLE public.happy_animations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_animations_read" ON public.happy_animations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_animations_ops_write" ON public.happy_animations FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published','rolled_back')),
  snapshot JSONB NOT NULL,
  checksum TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, version)
);
GRANT SELECT, INSERT ON public.happy_versions TO authenticated;
GRANT ALL ON public.happy_versions TO service_role;
ALTER TABLE public.happy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_versions_read" ON public.happy_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "happy_versions_ops_insert" ON public.happy_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));

-- Immutable snapshot (allow status/timestamp transitions only)
CREATE OR REPLACE FUNCTION public.happy_versions_immutable_core()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'happy_versions are immutable'; END IF;
  IF NEW.identity_id IS DISTINCT FROM OLD.identity_id
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
     OR NEW.checksum IS DISTINCT FROM OLD.checksum
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN RAISE EXCEPTION 'happy_versions core fields are immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_happy_versions_immutable
  BEFORE UPDATE OR DELETE ON public.happy_versions
  FOR EACH ROW EXECUTE FUNCTION public.happy_versions_immutable_core();

CREATE POLICY "happy_versions_ops_update" ON public.happy_versions FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

ALTER TABLE public.happy_identity ADD CONSTRAINT happy_identity_active_version_fk
  FOREIGN KEY (active_version_id) REFERENCES public.happy_versions(id) ON DELETE SET NULL;

CREATE TABLE public.happy_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('website','mobile','desktop','founder','presentation','reception','training')),
  version_id UUID REFERENCES public.happy_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','paused','rolled_back','failed')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identity_id, channel)
);
GRANT SELECT ON public.happy_deployments TO authenticated, anon;
GRANT INSERT, UPDATE ON public.happy_deployments TO authenticated;
GRANT ALL ON public.happy_deployments TO service_role;
ALTER TABLE public.happy_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_deployments_read" ON public.happy_deployments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "happy_deployments_ops_write" ON public.happy_deployments FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

CREATE TABLE public.happy_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.happy_identity(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('identity','appearance','voice','behavior','skills','knowledge','animations','deployment')),
  proposed_changes JSONB NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn','applied')),
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  applied_version_id UUID REFERENCES public.happy_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.happy_change_requests TO authenticated;
GRANT ALL ON public.happy_change_requests TO service_role;
ALTER TABLE public.happy_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "happy_change_read" ON public.happy_change_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "happy_change_create" ON public.happy_change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "happy_change_ops_manage" ON public.happy_change_requests FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

SELECT public._hxp_attach_touch('public.happy_identity');
SELECT public._hxp_attach_touch('public.happy_appearance');
SELECT public._hxp_attach_touch('public.happy_voice');
SELECT public._hxp_attach_touch('public.happy_behavior');
SELECT public._hxp_attach_touch('public.happy_skills');
SELECT public._hxp_attach_touch('public.happy_animations');
SELECT public._hxp_attach_touch('public.happy_deployments');
SELECT public._hxp_attach_touch('public.happy_change_requests');

CREATE INDEX idx_happy_voice_identity ON public.happy_voice(identity_id, language);
CREATE INDEX idx_happy_behavior_identity ON public.happy_behavior(identity_id, mode);
CREATE INDEX idx_happy_skills_identity ON public.happy_skills(identity_id, enabled);
CREATE INDEX idx_happy_versions_identity ON public.happy_versions(identity_id, created_at DESC);
CREATE INDEX idx_happy_change_status ON public.happy_change_requests(status, created_at DESC);

-- Bootstrap the singleton identity + baseline behaviors + baseline skills
DO $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.happy_identity (
    official_name, role_title, brand, company, biography, mission, vision, languages, primary_language, status
  ) VALUES (
    'HAPPY', 'AI Employee', 'HAPPY', 'H.P PRIVATE LIMITED',
    'HAPPY is the official AI Employee of H.P PRIVATE LIMITED.',
    'Serve every stakeholder with real, verifiable, enterprise-grade intelligence.',
    'Become the permanent AI representative of H.P PRIVATE LIMITED.',
    ARRAY['en','hi','ur'], 'en', 'draft'
  ) RETURNING id INTO _id;

  INSERT INTO public.happy_appearance (identity_id) VALUES (_id);

  INSERT INTO public.happy_behavior (identity_id, mode, system_prompt, default_persona) VALUES
    (_id, 'professional', 'You are HAPPY, the official AI Employee of H.P PRIVATE LIMITED. Be precise, respectful, and enterprise-grade.', true),
    (_id, 'friendly',     'You are HAPPY. Be warm, welcoming, and human.', false),
    (_id, 'founder',      'You are HAPPY speaking privately with the founder. Be direct, honest, and outcomes-focused.', false),
    (_id, 'teaching',     'You are HAPPY as a teacher. Explain step by step with examples.', false),
    (_id, 'sales',        'You are HAPPY in sales mode. Understand needs, propose value, never oversell.', false),
    (_id, 'receptionist', 'You are HAPPY greeting visitors. Confirm identity, route inquiries, book meetings.', false),
    (_id, 'meeting',      'You are HAPPY in a live meeting. Track agenda, capture decisions, assign action items.', false),
    (_id, 'presentation', 'You are HAPPY presenting. Speak with cadence, advance slides, respond to questions.', false),
    (_id, 'research',     'You are HAPPY researching. Cite sources, separate fact from inference.', false),
    (_id, 'support',      'You are HAPPY in support mode. Diagnose, resolve, escalate cleanly.', false),
    (_id, 'learning',     'You are HAPPY learning. Ask, absorb, summarize, verify.', false);

  INSERT INTO public.happy_skills (identity_id, skill_code, label, category, runtime_route) VALUES
    (_id, 'crm',           'CRM operations',        'business',      'crm.functions'),
    (_id, 'erp',           'ERP operations',        'business',      'erp.functions'),
    (_id, 'finance',       'Finance operations',    'business',      'finance.functions'),
    (_id, 'manufacturing', 'Manufacturing runtime', 'operations',    'mfg.functions'),
    (_id, 'warehouse',     'Warehouse / WMS',       'operations',    'wms.functions'),
    (_id, 'marketplace',   'Marketplace ops',       'commerce',      'marketplace.functions'),
    (_id, 'website',       'Website Builder',       'builder',       'website-builder.functions'),
    (_id, 'app',           'App Builder',           'builder',       'app-builder.functions'),
    (_id, 'deployment',    'Deployment',            'devops',        'deployment.functions'),
    (_id, 'analytics',     'Analytics & BI',        'intelligence',  'bi.functions'),
    (_id, 'presentation',  'Presentation control',  'delivery',      'happy-runtime.presentation'),
    (_id, 'whiteboard',    'Whiteboard control',    'delivery',      'happy-runtime.whiteboard');

  INSERT INTO public.happy_voice (identity_id, language, provider, voice_id, is_primary, greeting_sample) VALUES
    (_id, 'en', 'lovable', 'alloy', true,  'Hello, I am HAPPY, the AI Employee of H.P PRIVATE LIMITED. How may I help you today?'),
    (_id, 'hi', 'lovable', 'alloy', false, 'नमस्ते, मैं HAPPY हूँ। मैं आपकी क्या सहायता कर सकता हूँ?'),
    (_id, 'ur', 'lovable', 'alloy', false, 'السلام علیکم، میں HAPPY ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟');

  INSERT INTO public.happy_animations (identity_id, clip_code, label, category, loops) VALUES
    (_id, 'idle',         'Idle stance',       'idle',         true),
    (_id, 'blink',        'Blink',             'blink',        true),
    (_id, 'smile',        'Smile',             'smile',        false),
    (_id, 'listen',       'Listening pose',    'listen',       true),
    (_id, 'talk',         'Talking',           'talk',         true),
    (_id, 'presentation', 'Presenting',        'presentation', true),
    (_id, 'teaching',     'Teaching',          'teaching',     true),
    (_id, 'gesture_open', 'Open hand gesture', 'gesture',      false),
    (_id, 'walk',         'Walk cycle',        'walk',         true),
    (_id, 'sit',          'Sit',               'sit',          false),
    (_id, 'stand',        'Stand',             'stand',        false);
END $$;
