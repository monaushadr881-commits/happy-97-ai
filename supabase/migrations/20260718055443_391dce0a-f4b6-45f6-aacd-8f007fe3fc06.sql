-- R114: HAPPY ID + Session/Device Manager + Login History + Security Alerts + Session Policies
-- Extends existing Supabase auth. NO duplicate auth tables. NO changes to auth.* schema.

-- 1. auth_devices — user's known devices
CREATE TABLE public.auth_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  ip_hash TEXT,
  location_country TEXT,
  location_region TEXT,
  trusted BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_devices TO authenticated;
GRANT ALL ON public.auth_devices TO service_role;
ALTER TABLE public.auth_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_devices_owner_all" ON public.auth_devices
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX auth_devices_user_last_seen ON public.auth_devices(user_id, last_seen_at DESC);
CREATE TRIGGER trg_touch_auth_devices BEFORE UPDATE ON public.auth_devices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. auth_sessions_meta — session metadata (Supabase manages the actual session; we track metadata)
CREATE TABLE public.auth_sessions_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  device_id UUID REFERENCES public.auth_devices(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  end_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_sessions_meta TO authenticated;
GRANT ALL ON public.auth_sessions_meta TO service_role;
ALTER TABLE public.auth_sessions_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_sessions_owner_all" ON public.auth_sessions_meta
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX auth_sessions_user_active ON public.auth_sessions_meta(user_id, ended_at, last_active_at DESC);
CREATE TRIGGER trg_touch_auth_sessions_meta BEFORE UPDATE ON public.auth_sessions_meta
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. auth_login_history — immutable login history
CREATE TABLE public.auth_login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signin','signout','signup','failed','magic_link','oauth','otp','passkey','sso','token_refresh','session_expired','remote_logout')),
  provider TEXT,
  device_id UUID REFERENCES public.auth_devices(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auth_login_history TO authenticated;
GRANT ALL ON public.auth_login_history TO service_role;
ALTER TABLE public.auth_login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_login_history_owner_read" ON public.auth_login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_login_history_owner_insert" ON public.auth_login_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX auth_login_history_user_created ON public.auth_login_history(user_id, created_at DESC);
-- Immutable
CREATE OR REPLACE FUNCTION public.auth_login_history_immutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'auth_login_history is immutable'; END $$;
CREATE TRIGGER trg_auth_login_history_immutable
  BEFORE UPDATE OR DELETE ON public.auth_login_history
  FOR EACH ROW EXECUTE FUNCTION public.auth_login_history_immutable();

-- 4. auth_security_alerts — user-visible security alerts (new device, failed logins, remote logout)
CREATE TABLE public.auth_security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_device','new_location','failed_logins','remote_logout','password_changed','mfa_changed','session_hijack_suspected','trusted_device_added','trusted_device_removed')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  message TEXT NOT NULL,
  device_id UUID REFERENCES public.auth_devices(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.auth_security_alerts TO authenticated;
GRANT ALL ON public.auth_security_alerts TO service_role;
ALTER TABLE public.auth_security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_security_alerts_owner_read" ON public.auth_security_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_security_alerts_owner_ack" ON public.auth_security_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_security_alerts_owner_insert" ON public.auth_security_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX auth_security_alerts_user_created ON public.auth_security_alerts(user_id, acknowledged_at, created_at DESC);
CREATE TRIGGER trg_touch_auth_security_alerts BEFORE UPDATE ON public.auth_security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. auth_session_policies — per-user or per-company session limits (One Active Session default; enterprise configurable)
CREATE TABLE public.auth_session_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('user','company','platform')),
  scope_id UUID,
  max_active_sessions INT NOT NULL DEFAULT 1 CHECK (max_active_sessions >= 1),
  require_trusted_device BOOLEAN NOT NULL DEFAULT false,
  idle_timeout_minutes INT NOT NULL DEFAULT 43200,
  absolute_timeout_hours INT NOT NULL DEFAULT 720,
  require_mfa BOOLEAN NOT NULL DEFAULT false,
  allowed_providers TEXT[] NOT NULL DEFAULT ARRAY['email','google','apple','passkey','otp','sso']::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scope_type, scope_id)
);
GRANT SELECT ON public.auth_session_policies TO authenticated;
GRANT ALL ON public.auth_session_policies TO service_role;
ALTER TABLE public.auth_session_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_session_policies_read_own_user" ON public.auth_session_policies
  FOR SELECT TO authenticated USING (
    (scope_type = 'platform')
    OR (scope_type = 'user' AND scope_id = auth.uid())
    OR (scope_type = 'company' AND public.is_company_member(auth.uid(), scope_id))
  );
CREATE POLICY "auth_session_policies_company_admin_write" ON public.auth_session_policies
  FOR ALL TO authenticated USING (
    scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id)
  ) WITH CHECK (
    scope_type = 'company' AND public.is_company_admin(auth.uid(), scope_id)
  );
CREATE POLICY "auth_session_policies_user_own_write" ON public.auth_session_policies
  FOR ALL TO authenticated USING (
    scope_type = 'user' AND scope_id = auth.uid()
  ) WITH CHECK (
    scope_type = 'user' AND scope_id = auth.uid()
  );
CREATE TRIGGER trg_touch_auth_session_policies BEFORE UPDATE ON public.auth_session_policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed platform default policy (One Active Session)
INSERT INTO public.auth_session_policies (scope_type, scope_id, max_active_sessions, allowed_providers)
VALUES ('platform', NULL, 1, ARRAY['email','google','apple','passkey','otp','sso']::text[])
ON CONFLICT (scope_type, scope_id) DO NOTHING;