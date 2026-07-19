CREATE TABLE IF NOT EXISTS public.auth_passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  authenticator_type TEXT NOT NULL DEFAULT 'platform'
    CHECK (authenticator_type IN ('platform','cross-platform','security_key')),
  device_id UUID REFERENCES public.auth_devices(id) ON DELETE SET NULL,
  label TEXT NOT NULL DEFAULT 'Passkey',
  is_backup BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, credential_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_passkeys TO authenticated;
GRANT ALL ON public.auth_passkeys TO service_role;
ALTER TABLE public.auth_passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_passkeys_owner_all" ON public.auth_passkeys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS auth_passkeys_user_active
  ON public.auth_passkeys(user_id, revoked_at, last_used_at DESC NULLS LAST);

CREATE TRIGGER trg_touch_auth_passkeys BEFORE UPDATE ON public.auth_passkeys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();