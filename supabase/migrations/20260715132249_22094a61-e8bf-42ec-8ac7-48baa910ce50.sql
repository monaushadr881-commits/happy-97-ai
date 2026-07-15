
-- =========================================================================
-- R24 WAREHOUSE MANAGEMENT SYSTEM
-- =========================================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.wms_zone_type AS ENUM ('storage','receiving','dispatch','staging','quarantine','damage','returns','production');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_txn_type AS ENUM ('receive','issue','transfer_out','transfer_in','adjustment','damage','expiry','return','reserve','release','count_adjust','production_in','production_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_lot_status AS ENUM ('available','quarantine','damaged','expired','consumed','on_hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_reservation_status AS ENUM ('active','released','fulfilled','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_transfer_status AS ENUM ('draft','in_transit','received','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_count_status AS ENUM ('scheduled','in_progress','completed','approved','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wms_valuation AS ENUM ('FIFO','FEFO','LIFO','WEIGHTED_AVG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- warehouse_zones ----------
CREATE TABLE IF NOT EXISTS public.warehouse_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  zone_type public.wms_zone_type NOT NULL DEFAULT 'storage',
  aisle text, sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_zones TO authenticated;
GRANT ALL ON public.warehouse_zones TO service_role;
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wz_read"  ON public.warehouse_zones FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "wz_write" ON public.warehouse_zones FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.warehouse_zones');
CREATE INDEX IF NOT EXISTS idx_wz_wh ON public.warehouse_zones (warehouse_id);

-- ---------- warehouse_bins ----------
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.warehouse_zones(id) ON DELETE SET NULL,
  code text NOT NULL,
  rack text, shelf text, position text,
  capacity numeric(18,4),
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_bins TO authenticated;
GRANT ALL ON public.warehouse_bins TO service_role;
ALTER TABLE public.warehouse_bins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_read"  ON public.warehouse_bins FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "wb_write" ON public.warehouse_bins FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.warehouse_bins');
CREATE INDEX IF NOT EXISTS idx_wb_wh   ON public.warehouse_bins (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wb_zone ON public.warehouse_bins (zone_id);

-- ---------- inventory_lots ----------
CREATE TABLE IF NOT EXISTS public.inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  bin_id uuid REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  batch_no text, lot_no text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  mfg_date date, expiry_date date,
  quantity numeric(18,4) NOT NULL DEFAULT 0,
  unit_cost numeric(18,4),
  status public.wms_lot_status NOT NULL DEFAULT 'available',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_lots TO authenticated;
GRANT ALL ON public.inventory_lots TO service_role;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "il_read"  ON public.inventory_lots FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "il_write" ON public.inventory_lots FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.inventory_lots');
CREATE INDEX IF NOT EXISTS idx_il_prod_wh ON public.inventory_lots (product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_il_expiry  ON public.inventory_lots (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_il_status  ON public.inventory_lots (status);

-- ---------- inventory_transactions (IMMUTABLE LEDGER) ----------
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  txn_type public.wms_txn_type NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  bin_id uuid REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
  qty_delta numeric(18,4) NOT NULL,
  balance_after numeric(18,4),
  unit_cost numeric(18,4),
  ref_type text, ref_id uuid, ref_number text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itx_read"   ON public.inventory_transactions FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "itx_insert" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.inventory_transactions_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'inventory_transactions are immutable'; END $$;
DROP TRIGGER IF EXISTS trg_itx_immutable ON public.inventory_transactions;
CREATE TRIGGER trg_itx_immutable BEFORE UPDATE OR DELETE ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.inventory_transactions_immutable();

CREATE INDEX IF NOT EXISTS idx_itx_prod_wh_time ON public.inventory_transactions (product_id, warehouse_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itx_company_time ON public.inventory_transactions (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itx_ref         ON public.inventory_transactions (ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_itx_lot         ON public.inventory_transactions (lot_id);

-- ---------- stock_reservations ----------
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  lot_id uuid REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
  quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
  ref_type text NOT NULL,
  ref_id uuid,
  status public.wms_reservation_status NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  released_at timestamptz,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_reservations TO authenticated;
GRANT ALL ON public.stock_reservations TO service_role;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_read"  ON public.stock_reservations FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "sr_write" ON public.stock_reservations FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.stock_reservations');
CREATE INDEX IF NOT EXISTS idx_sr_prod_wh_status ON public.stock_reservations (product_id, warehouse_id, status);
CREATE INDEX IF NOT EXISTS idx_sr_ref ON public.stock_reservations (ref_type, ref_id);

-- ---------- stock_transfers ----------
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status public.wms_transfer_status NOT NULL DEFAULT 'draft',
  shipped_at timestamptz, received_at timestamptz,
  shipped_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number),
  CHECK (from_warehouse_id <> to_warehouse_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfers TO service_role;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "st_read"  ON public.stock_transfers FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "st_write" ON public.stock_transfers FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.stock_transfers');
CREATE INDEX IF NOT EXISTS idx_st_company_time ON public.stock_transfers (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_st_status ON public.stock_transfers (status);

-- ---------- stock_transfer_items ----------
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  lot_id uuid REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
  from_bin_id uuid REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  to_bin_id uuid REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
  quantity_received numeric(18,4) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfer_items TO authenticated;
GRANT ALL ON public.stock_transfer_items TO service_role;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sti_scope" ON public.stock_transfer_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stock_transfers s WHERE s.id = stock_transfer_items.transfer_id AND public.is_company_member(auth.uid(), s.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stock_transfers s WHERE s.id = stock_transfer_items.transfer_id AND public.is_company_admin(auth.uid(), s.company_id)));
CREATE INDEX IF NOT EXISTS idx_sti_transfer ON public.stock_transfer_items (transfer_id);

-- ---------- cycle_counts ----------
CREATE TABLE IF NOT EXISTS public.cycle_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  number text NOT NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz, completed_at timestamptz, approved_at timestamptz,
  status public.wms_count_status NOT NULL DEFAULT 'scheduled',
  is_blind boolean NOT NULL DEFAULT false,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  counted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_counts TO authenticated;
GRANT ALL ON public.cycle_counts TO service_role;
ALTER TABLE public.cycle_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_read"  ON public.cycle_counts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "cc_write" ON public.cycle_counts FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.cycle_counts');
CREATE INDEX IF NOT EXISTS idx_cc_wh ON public.cycle_counts (warehouse_id, scheduled_at DESC);

-- ---------- cycle_count_items ----------
CREATE TABLE IF NOT EXISTS public.cycle_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES public.cycle_counts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  bin_id uuid REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
  expected_qty numeric(18,4) NOT NULL DEFAULT 0,
  counted_qty numeric(18,4),
  variance numeric(18,4) GENERATED ALWAYS AS (COALESCE(counted_qty,0) - expected_qty) STORED,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_count_items TO authenticated;
GRANT ALL ON public.cycle_count_items TO service_role;
ALTER TABLE public.cycle_count_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cci_scope" ON public.cycle_count_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cycle_counts c WHERE c.id = cycle_count_items.count_id AND public.is_company_member(auth.uid(), c.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cycle_counts c WHERE c.id = cycle_count_items.count_id AND public.is_company_admin(auth.uid(), c.company_id)));
CREATE INDEX IF NOT EXISTS idx_cci_count ON public.cycle_count_items (count_id);

-- ---------- inventory_thresholds ----------
CREATE TABLE IF NOT EXISTS public.inventory_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  min_stock numeric(18,4) NOT NULL DEFAULT 0,
  max_stock numeric(18,4),
  reorder_level numeric(18,4) NOT NULL DEFAULT 0,
  safety_stock numeric(18,4) NOT NULL DEFAULT 0,
  expiry_alert_days int NOT NULL DEFAULT 30,
  valuation public.wms_valuation NOT NULL DEFAULT 'FIFO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, product_id, warehouse_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_thresholds TO authenticated;
GRANT ALL ON public.inventory_thresholds TO service_role;
ALTER TABLE public.inventory_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "it_read"  ON public.inventory_thresholds FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "it_write" ON public.inventory_thresholds FOR ALL   TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
SELECT public._hxp_attach_touch('public.inventory_thresholds');
CREATE INDEX IF NOT EXISTS idx_it_prod ON public.inventory_thresholds (product_id, warehouse_id);
