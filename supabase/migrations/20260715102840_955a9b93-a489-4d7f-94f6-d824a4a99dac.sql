
DO $$ BEGIN
  CREATE TYPE public.payment_provider_code AS ENUM ('stripe','razorpay','paddle','cashfree','paypal','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_verify_result AS ENUM ('verified','bad_signature','expired','replay','missing','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.webhook_process_status AS ENUM ('received','processed','ignored','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider_code NOT NULL,
  provider_event_id TEXT,
  event_type TEXT NOT NULL,
  canonical_type TEXT,
  verify_result public.webhook_verify_result NOT NULL,
  process_status public.webhook_process_status NOT NULL DEFAULT 'received',
  http_status INT NOT NULL,
  latency_ms INT NOT NULL DEFAULT 0,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  signature_present BOOLEAN NOT NULL DEFAULT false,
  timestamp_present BOOLEAN NOT NULL DEFAULT false,
  payload_digest TEXT,
  error_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pwe_provider_time_idx ON public.payment_webhook_events(provider, received_at DESC);
CREATE INDEX IF NOT EXISTS pwe_verify_idx ON public.payment_webhook_events(verify_result, received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS pwe_provider_event_uk ON public.payment_webhook_events(provider, provider_event_id) WHERE provider_event_id IS NOT NULL;

GRANT SELECT ON public.payment_webhook_events TO authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pwe_read_ops ON public.payment_webhook_events
  FOR SELECT TO authenticated
  USING (public.is_ops_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.payment_webhook_events_immutable()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN RAISE EXCEPTION 'payment_webhook_events are immutable'; END $$;

DROP TRIGGER IF EXISTS pwe_no_mutate ON public.payment_webhook_events;
CREATE TRIGGER pwe_no_mutate BEFORE UPDATE OR DELETE ON public.payment_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.payment_webhook_events_immutable();
