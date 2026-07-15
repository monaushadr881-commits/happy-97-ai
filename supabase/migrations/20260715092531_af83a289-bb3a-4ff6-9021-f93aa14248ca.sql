
-- =========================================================================
-- Enterprise Financial Foundation
-- =========================================================================

-- ---------- ENUMS -------------------------------------------------------

DO $$ BEGIN CREATE TYPE public.plan_tier AS ENUM ('free','starter','professional','business','enterprise','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.billing_interval AS ENUM ('month','quarter','half_year','year','three_year','five_year','lifetime'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('trial','active','paused','past_due','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_event_type AS ENUM ('created','trial_started','activated','renewed','upgraded','downgraded','paused','resumed','cancelled','expired','payment_failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.wallet_owner_type AS ENUM ('user','company'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ledger_direction AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.wallet_entry_type AS ENUM ('purchase','refund','reward','referral','adjustment','marketplace_earning','builder_earning','consume','payout','chargeback'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.credit_entry_type AS ENUM ('purchase','consume','refund','expire','transfer_in','transfer_out','bonus','referral','admin_grant','marketplace_usage','ai_usage','builder_usage','automation_usage'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- PLANS -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier public.plan_tier NOT NULL DEFAULT 'starter',
  billing_interval public.billing_interval NOT NULL DEFAULT 'month',
  price_cents BIGINT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  credits_included BIGINT NOT NULL DEFAULT 0 CHECK (credits_included >= 0),
  seats_included INT NOT NULL DEFAULT 1 CHECK (seats_included >= 0),
  trial_days INT NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 100,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plans_active_sort_idx ON public.plans(is_active, sort_order);

GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read_all ON public.plans FOR SELECT TO authenticated USING (is_active OR public.is_ops_admin(auth.uid()));
CREATE POLICY plans_admin_write ON public.plans FOR ALL TO authenticated
  USING (public.is_ops_admin(auth.uid())) WITH CHECK (public.is_ops_admin(auth.uid()));

SELECT public._hxp_attach_touch('public.plans');

-- ---------- SUBSCRIPTIONS ----------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  seats INT NOT NULL DEFAULT 1 CHECK (seats >= 0),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  provider TEXT,
  provider_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_company_idx ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON public.subscriptions(current_period_end);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subs_read ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY subs_admin_write ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

SELECT public._hxp_attach_touch('public.subscriptions');

-- ---------- SUBSCRIPTION EVENTS (immutable) ----------------------------

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type public.subscription_event_type NOT NULL,
  from_plan_id UUID REFERENCES public.plans(id),
  to_plan_id UUID REFERENCES public.plans(id),
  actor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sub_events_sub_idx ON public.subscription_events(subscription_id, occurred_at DESC);

GRANT SELECT, INSERT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_events_read ON public.subscription_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.subscriptions s
                 WHERE s.id = subscription_id
                   AND public.is_company_member(auth.uid(), s.company_id)));
CREATE POLICY sub_events_insert ON public.subscription_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.subscriptions s
                      WHERE s.id = subscription_id
                        AND public.is_company_admin(auth.uid(), s.company_id)));

CREATE OR REPLACE FUNCTION public.subscription_events_immutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'subscription_events are immutable'; END $$;
DROP TRIGGER IF EXISTS sub_events_no_update ON public.subscription_events;
CREATE TRIGGER sub_events_no_update BEFORE UPDATE OR DELETE ON public.subscription_events
  FOR EACH ROW EXECUTE FUNCTION public.subscription_events_immutable();

-- ---------- WALLETS ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type public.wallet_owner_type NOT NULL,
  owner_id UUID NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_type, owner_id, currency)
);
CREATE INDEX IF NOT EXISTS wallets_owner_idx ON public.wallets(owner_type, owner_id);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallets_read ON public.wallets FOR SELECT TO authenticated USING (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR (owner_type = 'company' AND public.is_company_member(auth.uid(), owner_id))
  OR public.is_ops_admin(auth.uid())
);
CREATE POLICY wallets_user_own ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid());
CREATE POLICY wallets_company_admin ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (owner_type = 'company' AND public.is_company_admin(auth.uid(), owner_id));
CREATE POLICY wallets_update_owner ON public.wallets FOR UPDATE TO authenticated USING (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR (owner_type = 'company' AND public.is_company_admin(auth.uid(), owner_id))
);

SELECT public._hxp_attach_touch('public.wallets');

-- ---------- WALLET LEDGER (immutable) ----------------------------------

CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  direction public.ledger_direction NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  entry_type public.wallet_entry_type NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_ledger_wallet_idx ON public.wallet_ledger_entries(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_ledger_ref_idx ON public.wallet_ledger_entries(reference_type, reference_id);

GRANT SELECT, INSERT ON public.wallet_ledger_entries TO authenticated;
GRANT ALL ON public.wallet_ledger_entries TO service_role;

ALTER TABLE public.wallet_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_ledger_read ON public.wallet_ledger_entries FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND (
    (w.owner_type = 'user' AND w.owner_id = auth.uid())
    OR (w.owner_type = 'company' AND public.is_company_member(auth.uid(), w.owner_id))
    OR public.is_ops_admin(auth.uid())
  ))
);
-- Inserts require ownership (or company admin for company wallets). Adjustments only via ops admin.
CREATE POLICY wallet_ledger_insert ON public.wallet_ledger_entries FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND (
    (w.owner_type = 'user' AND w.owner_id = auth.uid())
    OR (w.owner_type = 'company' AND public.is_company_admin(auth.uid(), w.owner_id))
    OR public.is_ops_admin(auth.uid())
  ))
  AND (entry_type <> 'adjustment' OR public.is_ops_admin(auth.uid()))
);

CREATE OR REPLACE FUNCTION public.wallet_ledger_immutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'wallet_ledger_entries are immutable'; END $$;
DROP TRIGGER IF EXISTS wallet_ledger_no_update ON public.wallet_ledger_entries;
CREATE TRIGGER wallet_ledger_no_update BEFORE UPDATE OR DELETE ON public.wallet_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.wallet_ledger_immutable();

-- ---------- CREDIT LEDGER (immutable) ----------------------------------

CREATE TABLE IF NOT EXISTS public.credit_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type public.wallet_owner_type NOT NULL,
  owner_id UUID NOT NULL,
  direction public.ledger_direction NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  entry_type public.credit_entry_type NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_owner_idx ON public.credit_ledger_entries(owner_type, owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_ref_idx ON public.credit_ledger_entries(reference_type, reference_id);

GRANT SELECT, INSERT ON public.credit_ledger_entries TO authenticated;
GRANT ALL ON public.credit_ledger_entries TO service_role;

ALTER TABLE public.credit_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_ledger_read ON public.credit_ledger_entries FOR SELECT TO authenticated USING (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR (owner_type = 'company' AND public.is_company_member(auth.uid(), owner_id))
  OR public.is_ops_admin(auth.uid())
);
CREATE POLICY credit_ledger_insert ON public.credit_ledger_entries FOR INSERT TO authenticated WITH CHECK (
  (
    (owner_type = 'user' AND owner_id = auth.uid())
    OR (owner_type = 'company' AND public.is_company_admin(auth.uid(), owner_id))
    OR public.is_ops_admin(auth.uid())
  )
  AND (entry_type NOT IN ('admin_grant','bonus','referral') OR public.is_ops_admin(auth.uid()))
);

CREATE OR REPLACE FUNCTION public.credit_ledger_immutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'credit_ledger_entries are immutable'; END $$;
DROP TRIGGER IF EXISTS credit_ledger_no_update ON public.credit_ledger_entries;
CREATE TRIGGER credit_ledger_no_update BEFORE UPDATE OR DELETE ON public.credit_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.credit_ledger_immutable();

-- ---------- BALANCE VIEWS ----------------------------------------------

CREATE OR REPLACE VIEW public.v_wallet_balances AS
SELECT
  w.id AS wallet_id,
  w.owner_type,
  w.owner_id,
  w.currency,
  COALESCE(SUM(CASE WHEN e.direction = 'credit' THEN e.amount_cents ELSE -e.amount_cents END), 0)::BIGINT AS balance_cents,
  COUNT(e.id)::BIGINT AS entry_count,
  MAX(e.created_at) AS last_entry_at
FROM public.wallets w
LEFT JOIN public.wallet_ledger_entries e ON e.wallet_id = w.id
GROUP BY w.id;

GRANT SELECT ON public.v_wallet_balances TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_credit_balances AS
SELECT
  owner_type,
  owner_id,
  COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)::BIGINT AS balance,
  COUNT(*)::BIGINT AS entry_count,
  MAX(created_at) AS last_entry_at
FROM public.credit_ledger_entries
WHERE expires_at IS NULL OR expires_at > now()
GROUP BY owner_type, owner_id;

GRANT SELECT ON public.v_credit_balances TO authenticated, service_role;

-- ---------- SEED PLANS -------------------------------------------------

INSERT INTO public.plans (code, name, tier, billing_interval, price_cents, currency, credits_included, seats_included, trial_days, features, sort_order)
VALUES
  ('free',         'Free',         'free',         'month', 0,        'USD', 100,     1,  0,  '{"support":"community"}'::jsonb, 10),
  ('starter',      'Starter',      'starter',      'month', 1900,     'USD', 2000,    3,  14, '{"support":"email"}'::jsonb, 20),
  ('professional', 'Professional', 'professional', 'month', 4900,     'USD', 10000,   10, 14, '{"support":"priority"}'::jsonb, 30),
  ('business',     'Business',     'business',     'month', 14900,    'USD', 50000,   25, 14, '{"support":"priority","sla":"business"}'::jsonb, 40),
  ('enterprise',   'Enterprise',   'enterprise',   'year',  0,        'USD', 0,       0,  0,  '{"support":"dedicated","sla":"enterprise","white_label":true}'::jsonb, 50)
ON CONFLICT (code) DO NOTHING;
