-- R10 Wallet idempotency + status support
-- Partial unique index prevents processing the same source event twice.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_ledger_idem_idx
  ON public.wallet_ledger_entries (wallet_id, reference_type, reference_id, entry_type, direction)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

-- Wallet lifecycle status column ('open' | 'frozen' | 'closed').
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='wallets' AND column_name='status'
  ) THEN
    ALTER TABLE public.wallets ADD COLUMN status text NOT NULL DEFAULT 'open';
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_status_check
      CHECK (status IN ('open','frozen','closed'));
  END IF;
END $$;

-- Block ledger writes on non-open wallets (frozen / closed).
CREATE OR REPLACE FUNCTION public.wallet_ledger_wallet_open()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE s text;
BEGIN
  SELECT status INTO s FROM public.wallets WHERE id = NEW.wallet_id;
  IF s IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'wallet_% is % — ledger writes are blocked', NEW.wallet_id, s;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_wallet_ledger_wallet_open ON public.wallet_ledger_entries;
CREATE TRIGGER trg_wallet_ledger_wallet_open
  BEFORE INSERT ON public.wallet_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.wallet_ledger_wallet_open();
