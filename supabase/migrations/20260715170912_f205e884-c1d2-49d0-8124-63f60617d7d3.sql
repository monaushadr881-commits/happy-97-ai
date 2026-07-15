
-- =========================================================================
-- R48 Learning & Training Orchestration
-- =========================================================================
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  audience text NOT NULL DEFAULT 'employee', -- beginner|intermediate|advanced|founder|manager|employee|developer|dealer|distributor|customer|custom
  category text NOT NULL,                    -- onboarding|training|academy|library|compliance|security|technical|business
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',      -- draft|published|archived
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_paths TO authenticated;
GRANT INSERT, UPDATE ON public.learning_paths TO authenticated;
GRANT ALL ON public.learning_paths TO service_role;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY lp_read ON public.learning_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY lp_write ON public.learning_paths FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_ops_admin(auth.uid()));
CREATE POLICY lp_update ON public.learning_paths FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_lp BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  item_type text NOT NULL,                   -- course|lesson|assignment|quiz|library|academy|presentation
  item_ref uuid NOT NULL,                    -- FK is intentionally logical — reuses existing runtime tables
  title text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, seq)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_path_items TO authenticated;
GRANT ALL ON public.learning_path_items TO service_role;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY lpi_read ON public.learning_path_items FOR SELECT TO authenticated USING (true);
CREATE POLICY lpi_write ON public.learning_path_items FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY lpi_update ON public.learning_path_items FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY lpi_delete ON public.learning_path_items FOR DELETE TO authenticated
  USING (public.is_ops_admin(auth.uid()));

-- =========================================================================
-- R49 Digital Human Integration Runtime
-- =========================================================================
CREATE TABLE public.dh_renderer_adapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                 -- portrait|layered|live2d|live3d|threejs|babylonjs|unreal_pixel|omniverse_ace|future
  label text NOT NULL,
  kind text NOT NULL,                        -- 2d|3d|streaming|xr
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  registered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dh_renderer_adapters TO authenticated;
GRANT INSERT, UPDATE ON public.dh_renderer_adapters TO authenticated;
GRANT ALL ON public.dh_renderer_adapters TO service_role;
ALTER TABLE public.dh_renderer_adapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY dra_read ON public.dh_renderer_adapters FOR SELECT TO authenticated USING (true);
CREATE POLICY dra_write ON public.dh_renderer_adapters FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY dra_update ON public.dh_renderer_adapters FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_dra BEFORE UPDATE ON public.dh_renderer_adapters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.dh_integration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  renderer_code text NOT NULL,
  identity_id uuid,                          -- links to happy_identity
  happy_session_id uuid,
  voice_session_id uuid,
  status text NOT NULL DEFAULT 'connecting', -- connecting|connected|degraded|disconnected|ended
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  latency_ms integer,
  sync_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dhis_user ON public.dh_integration_sessions(user_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.dh_integration_sessions TO authenticated;
GRANT ALL ON public.dh_integration_sessions TO service_role;
ALTER TABLE public.dh_integration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dhis_read ON public.dh_integration_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR (company_id IS NOT NULL AND public.is_company_admin(auth.uid(), company_id))
      OR public.is_ops_admin(auth.uid()));
CREATE POLICY dhis_write ON public.dh_integration_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY dhis_update ON public.dh_integration_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_touch_dhis BEFORE UPDATE ON public.dh_integration_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.dh_integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.dh_integration_sessions(id) ON DELETE CASCADE,
  seq bigint NOT NULL,
  user_id uuid NOT NULL,
  channel text NOT NULL,                     -- animation|lipsync|gesture|lookat|environment|health|stream
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  emitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);
CREATE INDEX idx_dhie_session ON public.dh_integration_events(session_id, seq);
GRANT SELECT, INSERT ON public.dh_integration_events TO authenticated;
GRANT ALL ON public.dh_integration_events TO service_role;
ALTER TABLE public.dh_integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY dhie_read ON public.dh_integration_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_ops_admin(auth.uid()));
CREATE POLICY dhie_write ON public.dh_integration_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.dh_integration_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE TRIGGER trg_dhie_immutable BEFORE UPDATE OR DELETE ON public.dh_integration_events
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

-- Seed baseline renderer adapters
INSERT INTO public.dh_renderer_adapters (code, label, kind, capabilities, required_assets, enabled) VALUES
 ('portrait','Portrait','2d','{"lipsync":false,"gesture":false,"emotion":true}','["portrait_image"]',true),
 ('layered','Layered Portrait','2d','{"lipsync":true,"gesture":false,"emotion":true}','["portrait_layers","viseme_layers"]',true),
 ('live2d','Live2D (Cubism)','2d','{"lipsync":true,"gesture":true,"emotion":true}','["cubism_model","cubism_motions"]',false),
 ('live3d','Live3D (WebGPU)','3d','{"lipsync":true,"gesture":true,"emotion":true,"pose":true}','["skeleton","blendshapes","animation_clips","material_set"]',false),
 ('threejs','Three.js','3d','{"lipsync":true,"gesture":true,"emotion":true}','["gltf_model","animation_clips"]',false),
 ('babylonjs','Babylon.js','3d','{"lipsync":true,"gesture":true,"emotion":true}','["gltf_model","animation_clips"]',false),
 ('unreal_pixel','Unreal Pixel Streaming','streaming','{"lipsync":true,"gesture":true,"emotion":true,"photoreal":true}','["metahuman_bundle","stream_endpoint"]',false),
 ('omniverse_ace','NVIDIA Omniverse ACE','streaming','{"lipsync":true,"gesture":true,"emotion":true,"photoreal":true}','["ace_bundle","stream_endpoint"]',false)
ON CONFLICT (code) DO NOTHING;

-- =========================================================================
-- R50 Production Readiness / Certification
-- =========================================================================
CREATE TABLE public.capability_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                 -- e.g. r41.voice_runtime
  release_id text NOT NULL,                  -- e.g. R41
  label text NOT NULL,
  runtime text NOT NULL,                     -- owning runtime module
  version text NOT NULL DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'planned',    -- working|partial|blocked|planned
  dependencies text[] NOT NULL DEFAULT '{}',
  owner text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.capability_registry TO authenticated;
GRANT INSERT, UPDATE ON public.capability_registry TO authenticated;
GRANT ALL ON public.capability_registry TO service_role;
ALTER TABLE public.capability_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_read ON public.capability_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY cr_write ON public.capability_registry FOR INSERT TO authenticated
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE POLICY cr_update ON public.capability_registry FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_cr BEFORE UPDATE ON public.capability_registry
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.capability_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_code text NOT NULL,
  status text NOT NULL,                      -- ok|degraded|down|unknown
  verification_method text NOT NULL,         -- typecheck|rls|policy|invoke|manual|automated
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  checked_by uuid,
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chc_cap ON public.capability_health_checks(capability_code, checked_at DESC);
GRANT SELECT, INSERT ON public.capability_health_checks TO authenticated;
GRANT ALL ON public.capability_health_checks TO service_role;
ALTER TABLE public.capability_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY chc_read ON public.capability_health_checks FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY chc_write ON public.capability_health_checks FOR INSERT TO authenticated
  WITH CHECK (checked_by = auth.uid() AND public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_chc_immutable BEFORE UPDATE OR DELETE ON public.capability_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

CREATE TABLE public.certification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id text NOT NULL,
  version text NOT NULL,
  generated_by uuid NOT NULL,
  overall_status text NOT NULL,              -- ready|not_ready|blocked
  readiness_score numeric NOT NULL DEFAULT 0,
  capability_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependency_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  health_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  security_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  performance_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_matrix jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cert_release ON public.certification_reports(release_id, created_at DESC);
GRANT SELECT, INSERT ON public.certification_reports TO authenticated;
GRANT ALL ON public.certification_reports TO service_role;
ALTER TABLE public.certification_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY cert_read ON public.certification_reports FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));
CREATE POLICY cert_write ON public.certification_reports FOR INSERT TO authenticated
  WITH CHECK (generated_by = auth.uid() AND public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_cert_immutable BEFORE UPDATE OR DELETE ON public.certification_reports
  FOR EACH ROW EXECUTE FUNCTION public.specialist_turns_immutable();

CREATE TABLE public.release_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  channel text NOT NULL DEFAULT 'rc',        -- rc|stable|hotfix|rollback
  released_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',    -- pending|released|rolled_back|superseded
  release_notes text,
  compatibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  certification_id uuid REFERENCES public.certification_reports(id) ON DELETE SET NULL,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.release_records TO authenticated;
GRANT ALL ON public.release_records TO service_role;
ALTER TABLE public.release_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY rr_read ON public.release_records FOR SELECT TO authenticated USING (true);
CREATE POLICY rr_write ON public.release_records FOR INSERT TO authenticated
  WITH CHECK (released_by = auth.uid() AND public.is_ops_admin(auth.uid()));
CREATE POLICY rr_update ON public.release_records FOR UPDATE TO authenticated
  USING (public.is_ops_admin(auth.uid()))
  WITH CHECK (public.is_ops_admin(auth.uid()));
CREATE TRIGGER trg_touch_rr BEFORE UPDATE ON public.release_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed capability registry with the R38..R50 backend runtimes
INSERT INTO public.capability_registry (code, release_id, label, runtime, version, status, dependencies, owner, description) VALUES
 ('r38.founder_workspace','R38','Founder Workspace','founder-workspace','1.0.0','working','{}','platform','Executive command center orchestration'),
 ('r39.happy_runtime','R39','Happy Runtime','happy-runtime','1.0.0','working','{r38.founder_workspace}','platform','Single HAPPY identity/session/experience runtime'),
 ('r40.happy_assets','R40','Happy Character Assets','happy-assets','1.0.0','working','{r39.happy_runtime}','platform','Character asset contract and pipeline'),
 ('r41.voice_runtime','R41','Voice Intelligence','voice-runtime','1.0.0','working','{r39.happy_runtime}','platform','Streaming voice orchestration with fallback'),
 ('r42.emotion_runtime','R42','Emotion & Expression','emotion-runtime','1.0.0','working','{r39.happy_runtime}','platform','Emotion, expression, gesture intent'),
 ('r43.presentation_runtime','R43','Presentation & Whiteboard','presentation-runtime','1.0.0','working','{r42.emotion_runtime,r41.voice_runtime}','platform','Presentation and whiteboard orchestration'),
 ('r44.specialist_runtime','R44','Business Specialist Modes','specialist-runtime','1.0.0','working','{r39.happy_runtime}','platform','30 specialist modes, deterministic router'),
 ('r45.founder_ai','R45','Founder Executive AI','founder-executive','1.0.0','working','{r44.specialist_runtime,r38.founder_workspace}','platform','Executive briefings, decisions, reports'),
 ('r46.receptionist','R46','Public AI Receptionist','receptionist','1.0.0','working','{r44.specialist_runtime}','platform','Visitor experience and lead qualification'),
 ('r47.meeting_runtime','R47','Meeting & Collaboration','meeting-runtime','1.0.0','working','{r43.presentation_runtime}','platform','Meetings, minutes, decisions, action items'),
 ('r48.learning_runtime','R48','Learning & Training','learning-runtime','1.0.0','working','{r43.presentation_runtime}','platform','Learning paths reusing existing courses/lessons/quizzes/assignments/certificates'),
 ('r49.dh_integration','R49','Digital Human Integration','dh-integration','1.0.0','partial','{r40.happy_assets,r41.voice_runtime,r42.emotion_runtime}','platform','Renderer adapters and streaming contracts; renderers themselves external'),
 ('r50.certification','R50','Production Certification','certification','1.0.0','working','{}','platform','Capability registry, health, certification, releases')
ON CONFLICT (code) DO NOTHING;

-- Renderers not yet certified: explicit blocked entries
INSERT INTO public.capability_registry (code, release_id, label, runtime, version, status, dependencies, owner, description) VALUES
 ('r49.renderer.live2d','R49','Live2D Renderer','dh-integration','1.0.0','blocked','{r49.dh_integration}','platform','Requires real Cubism assets'),
 ('r49.renderer.live3d','R49','Live3D Renderer','dh-integration','1.0.0','blocked','{r49.dh_integration}','platform','Requires real skeleton, blendshapes, animation clips'),
 ('r49.renderer.unreal_pixel','R49','Unreal Pixel Streaming','dh-integration','1.0.0','planned','{r49.dh_integration}','platform','Requires Unreal MetaHuman + pixel streaming infra'),
 ('r49.renderer.omniverse_ace','R49','Omniverse ACE','dh-integration','1.0.0','planned','{r49.dh_integration}','platform','Requires NVIDIA ACE infrastructure'),
 ('r49.renderer.xr_vr_ar','R49','XR/VR/AR','dh-integration','1.0.0','planned','{r49.dh_integration}','platform','Requires XR device runtime')
ON CONFLICT (code) DO NOTHING;
