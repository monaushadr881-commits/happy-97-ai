
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_primary   TEXT,
  ADD COLUMN IF NOT EXISTS phone_secondary TEXT;

CREATE OR REPLACE FUNCTION public.grant_founder_for_verified_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder_role_id uuid;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
  IF lower(NEW.email) <> 'hpgrouprewa@gmail.com' THEN RETURN NEW; END IF;

  SELECT id INTO v_founder_role_id
  FROM public.roles WHERE code = 'founder' AND company_id IS NULL LIMIT 1;

  IF v_founder_role_id IS NOT NULL THEN
    INSERT INTO public.role_assignments (user_id, role_id, scope_type, scope_id, granted_by)
    VALUES (NEW.id, v_founder_role_id, 'platform', NULL, NEW.id)
    ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'founder')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET phone_primary   = COALESCE(phone_primary,   '+91 8269525234'),
      phone_secondary = COALESCE(phone_secondary, '+91 8370096706'),
      updated_at      = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_founder   ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_founder ON auth.users;

CREATE TRIGGER on_auth_user_created_grant_founder
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_founder_for_verified_identity();

CREATE TRIGGER on_auth_user_confirmed_grant_founder
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_founder_for_verified_identity();

DO $$
DECLARE
  v_user_id uuid;
  v_founder_role_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = 'hpgrouprewa@gmail.com'
    AND email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_founder_role_id
  FROM public.roles WHERE code = 'founder' AND company_id IS NULL LIMIT 1;

  IF v_founder_role_id IS NOT NULL THEN
    INSERT INTO public.role_assignments (user_id, role_id, scope_type, scope_id, granted_by)
    VALUES (v_user_id, v_founder_role_id, 'platform', NULL, v_user_id)
    ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'founder')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET phone_primary   = COALESCE(phone_primary,   '+91 8269525234'),
      phone_secondary = COALESCE(phone_secondary, '+91 8370096706'),
      updated_at      = now()
  WHERE id = v_user_id;
END $$;
