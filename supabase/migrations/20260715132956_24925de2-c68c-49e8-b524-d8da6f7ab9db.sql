
-- =========================================================================
-- R25 FINANCE & ACCOUNTING RUNTIME
-- =========================================================================

-- ENUMS
DO $$ BEGIN CREATE TYPE public.fin_journal_status AS ENUM ('draft','posted','reversed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fin_bill_status    AS ENUM ('draft','pending','approved','paid','partial','cancelled','overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fin_note_kind      AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fin_bank_txn_type  AS ENUM ('deposit','withdrawal','transfer_in','transfer_out','fee','interest','adjustment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fin_recon_status   AS ENUM ('open','in_progress','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fin_gst_status     AS ENUM ('draft','filed','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- journal_entries ----------
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  memo text,
  status public.fin_journal_status NOT NULL DEFAULT 'draft',
  reference_type text, reference_id uuid, reference_number text,
  reversed_by uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  reversal_of uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  currency text NOT NULL DEFAULT 'INR',
  total_debit_cents bigint NOT NULL DEFAULT 0,
  total_credit_cents bigint NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  posted_at timestamptz, posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "je_read"  ON public.journal_entries FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "je_write" ON public.journal_entries FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.journal_entries');
CREATE INDEX IF NOT EXISTS idx_je_company_date ON public.journal_entries (company_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_je_ref ON public.journal_entries (reference_type, reference_id);

-- ---------- journal_lines ----------
CREATE TABLE IF NOT EXISTS public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  debit_cents bigint NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
  credit_cents bigint NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
  memo text,
  tax_rate_id uuid REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  contact_type text, contact_id uuid,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit_cents = 0) OR (credit_cents = 0))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jl_scope" ON public.journal_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_lines.entry_id AND public.is_company_member(auth.uid(), j.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_lines.entry_id AND public.is_company_admin(auth.uid(), j.company_id)));
CREATE INDEX IF NOT EXISTS idx_jl_entry ON public.journal_lines (entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_account ON public.journal_lines (account_id);

-- ---------- Immutability once posted ----------
CREATE OR REPLACE FUNCTION public.journal_posted_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME = 'journal_entries' THEN
    IF TG_OP = 'DELETE' THEN
      IF OLD.status = 'posted' THEN RAISE EXCEPTION 'posted journal entries are immutable'; END IF;
      RETURN OLD;
    END IF;
    IF OLD.status = 'posted' AND NEW.status = 'posted' THEN
      -- allow flipping to 'reversed' or setting reversed_by only
      IF (NEW.entry_date IS DISTINCT FROM OLD.entry_date)
         OR (NEW.memo IS DISTINCT FROM OLD.memo)
         OR (NEW.total_debit_cents IS DISTINCT FROM OLD.total_debit_cents)
         OR (NEW.total_credit_cents IS DISTINCT FROM OLD.total_credit_cents)
         OR (NEW.currency IS DISTINCT FROM OLD.currency)
         OR (NEW.reference_type IS DISTINCT FROM OLD.reference_type)
         OR (NEW.reference_id IS DISTINCT FROM OLD.reference_id)
      THEN RAISE EXCEPTION 'posted journal entries are immutable'; END IF;
    END IF;
    RETURN NEW;
  ELSE
    -- journal_lines: block any change if parent is posted
    IF EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = COALESCE(NEW.entry_id, OLD.entry_id) AND j.status IN ('posted','reversed')) THEN
      RAISE EXCEPTION 'lines of posted journal entries are immutable';
    END IF;
    RETURN COALESCE(NEW, OLD);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_je_immutable ON public.journal_entries;
CREATE TRIGGER trg_je_immutable BEFORE UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.journal_posted_immutable();
DROP TRIGGER IF EXISTS trg_jl_immutable ON public.journal_lines;
CREATE TRIGGER trg_jl_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.journal_posted_immutable();

-- ---------- vendor_bills (AP) ----------
CREATE TABLE IF NOT EXISTS public.vendor_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  number text NOT NULL,
  supplier_ref text,
  currency text NOT NULL DEFAULT 'INR',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  amount_paid_cents bigint NOT NULL DEFAULT 0,
  status public.fin_bill_status NOT NULL DEFAULT 'draft',
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_bills TO authenticated;
GRANT ALL ON public.vendor_bills TO service_role;
ALTER TABLE public.vendor_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vb_read"  ON public.vendor_bills FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "vb_write" ON public.vendor_bills FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.vendor_bills');
CREATE INDEX IF NOT EXISTS idx_vb_company_date ON public.vendor_bills (company_id, bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_vb_supplier ON public.vendor_bills (supplier_id);
CREATE INDEX IF NOT EXISTS idx_vb_status ON public.vendor_bills (status);

-- ---------- vendor_bill_items ----------
CREATE TABLE IF NOT EXISTS public.vendor_bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.vendor_bills(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description text,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL DEFAULT 0,
  tax_rate_id uuid REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_bill_items TO authenticated;
GRANT ALL ON public.vendor_bill_items TO service_role;
ALTER TABLE public.vendor_bill_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vbi_scope" ON public.vendor_bill_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendor_bills b WHERE b.id = vendor_bill_items.bill_id AND public.is_company_member(auth.uid(), b.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendor_bills b WHERE b.id = vendor_bill_items.bill_id AND public.is_company_admin(auth.uid(), b.company_id)));
CREATE INDEX IF NOT EXISTS idx_vbi_bill ON public.vendor_bill_items (bill_id);

-- ---------- credit_debit_notes ----------
CREATE TABLE IF NOT EXISTS public.credit_debit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind public.fin_note_kind NOT NULL,
  number text NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  bill_id uuid REFERENCES public.vendor_bills(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  currency text NOT NULL DEFAULT 'INR',
  amount_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'issued',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_debit_notes TO authenticated;
GRANT ALL ON public.credit_debit_notes TO service_role;
ALTER TABLE public.credit_debit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cdn_read"  ON public.credit_debit_notes FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "cdn_write" ON public.credit_debit_notes FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.credit_debit_notes');
CREATE INDEX IF NOT EXISTS idx_cdn_company ON public.credit_debit_notes (company_id, note_date DESC);

-- ---------- bank_accounts ----------
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank_name text,
  account_number text,
  ifsc text,
  currency text NOT NULL DEFAULT 'INR',
  account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  opening_balance_cents bigint NOT NULL DEFAULT 0,
  current_balance_cents bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ba_read"  ON public.bank_accounts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "ba_write" ON public.bank_accounts FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.bank_accounts');

-- ---------- bank_transactions ----------
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  txn_date date NOT NULL DEFAULT CURRENT_DATE,
  txn_type public.fin_bank_txn_type NOT NULL,
  amount_cents bigint NOT NULL,
  description text,
  reference text,
  counterparty text,
  reconciled boolean NOT NULL DEFAULT false,
  reconciled_at timestamptz,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;
GRANT ALL ON public.bank_transactions TO service_role;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt_read"  ON public.bank_transactions FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "bt_write" ON public.bank_transactions FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX IF NOT EXISTS idx_bt_account_date ON public.bank_transactions (bank_account_id, txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_bt_recon ON public.bank_transactions (reconciled);

-- ---------- bank_reconciliations ----------
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  period_start date NOT NULL, period_end date NOT NULL,
  statement_balance_cents bigint NOT NULL DEFAULT 0,
  book_balance_cents bigint NOT NULL DEFAULT 0,
  difference_cents bigint NOT NULL DEFAULT 0,
  status public.fin_recon_status NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_reconciliations TO authenticated;
GRANT ALL ON public.bank_reconciliations TO service_role;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "br_read"  ON public.bank_reconciliations FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "br_write" ON public.bank_reconciliations FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.bank_reconciliations');

-- ---------- gst_returns ----------
CREATE TABLE IF NOT EXISTS public.gst_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start date NOT NULL, period_end date NOT NULL,
  output_tax_cents bigint NOT NULL DEFAULT 0,
  input_tax_cents bigint NOT NULL DEFAULT 0,
  net_payable_cents bigint NOT NULL DEFAULT 0,
  status public.fin_gst_status NOT NULL DEFAULT 'draft',
  filed_at timestamptz,
  reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, period_start, period_end)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gst_returns TO authenticated;
GRANT ALL ON public.gst_returns TO service_role;
ALTER TABLE public.gst_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gr2_read"  ON public.gst_returns FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "gr2_write" ON public.gst_returns FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.gst_returns');
