
-- Recovery codes (hashed)
CREATE TABLE IF NOT EXISTS public.auth_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_recovery_codes TO authenticated;
GRANT ALL ON public.auth_recovery_codes TO service_role;
ALTER TABLE public.auth_recovery_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_recovery_codes_owner" ON public.auth_recovery_codes;
CREATE POLICY "auth_recovery_codes_owner" ON public.auth_recovery_codes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS auth_recovery_codes_user ON public.auth_recovery_codes(user_id);

-- Provider registry (which providers are enabled)
CREATE TABLE IF NOT EXISTS public.auth_provider_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  architecture_ready boolean NOT NULL DEFAULT true,
  configured boolean NOT NULL DEFAULT false,
  display_name text,
  category text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auth_provider_registry TO authenticated, anon;
GRANT ALL ON public.auth_provider_registry TO service_role;
ALTER TABLE public.auth_provider_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_provider_registry_read" ON public.auth_provider_registry;
CREATE POLICY "auth_provider_registry_read" ON public.auth_provider_registry
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_provider_registry_admin" ON public.auth_provider_registry;
CREATE POLICY "auth_provider_registry_admin" ON public.auth_provider_registry
  FOR ALL USING (public.is_platform_founder(auth.uid()))
  WITH CHECK (public.is_platform_founder(auth.uid()));

INSERT INTO public.auth_provider_registry (provider, enabled, architecture_ready, configured, display_name, category) VALUES
  ('email',     true,  true, true,  'Email + Password', 'password'),
  ('magic_link',true,  true, true,  'Magic Link',       'passwordless'),
  ('google',    true,  true, true,  'Google',           'oauth'),
  ('apple',     true,  true, true,  'Apple',            'oauth'),
  ('microsoft', false, true, false, 'Microsoft',        'oauth'),
  ('github',    false, true, false, 'GitHub',           'oauth'),
  ('phone_otp', false, true, false, 'Phone OTP',        'passwordless'),
  ('passkey',   false, true, false, 'Passkey',          'webauthn'),
  ('sso',       false, true, false, 'Enterprise SSO',   'saml'),
  ('biometric', false, true, false, 'Biometric',        'mobile')
ON CONFLICT (provider) DO NOTHING;

-- Devices: risk score + emergency lock
ALTER TABLE public.auth_devices
  ADD COLUMN IF NOT EXISTS risk_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emergency_locked boolean NOT NULL DEFAULT false;

-- Policies: enterprise configurable flag
ALTER TABLE public.auth_session_policies
  ADD COLUMN IF NOT EXISTS enterprise_configurable boolean NOT NULL DEFAULT true;
