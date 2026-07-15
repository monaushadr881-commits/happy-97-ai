
-- Add dead-letter status
ALTER TYPE public.webhook_process_status ADD VALUE IF NOT EXISTS 'dead';

-- Add retry-lifecycle columns to payment_webhook_events
ALTER TABLE public.payment_webhook_events
  ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS business_result jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Replace immutability trigger: only core fields immutable; lifecycle columns writable
CREATE OR REPLACE FUNCTION public.payment_webhook_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'payment_webhook_events are immutable';
  END IF;
  IF NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_event_id IS DISTINCT FROM OLD.provider_event_id
     OR NEW.event_type IS DISTINCT FROM OLD.event_type
     OR NEW.canonical_type IS DISTINCT FROM OLD.canonical_type
     OR NEW.verify_result IS DISTINCT FROM OLD.verify_result
     OR NEW.http_status IS DISTINCT FROM OLD.http_status
     OR NEW.latency_ms IS DISTINCT FROM OLD.latency_ms
     OR NEW.signature_present IS DISTINCT FROM OLD.signature_present
     OR NEW.timestamp_present IS DISTINCT FROM OLD.timestamp_present
     OR NEW.payload_digest IS DISTINCT FROM OLD.payload_digest
     OR NEW.received_at IS DISTINCT FROM OLD.received_at
     OR NEW.correlation_id IS DISTINCT FROM OLD.correlation_id
  THEN
    RAISE EXCEPTION 'payment_webhook_events core fields are immutable';
  END IF;
  RETURN NEW;
END; $$;

-- Retry-queue index (failed events ready to reprocess)
CREATE INDEX IF NOT EXISTS pwe_retry_idx
  ON public.payment_webhook_events (process_status, next_attempt_at)
  WHERE process_status = 'failed';

-- Idempotent payments upsert key
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_ref_uk
  ON public.payments (provider, provider_ref)
  WHERE provider IS NOT NULL AND provider_ref IS NOT NULL;
