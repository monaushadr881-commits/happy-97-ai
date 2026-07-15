
-- R23 Manufacturing Runtime

CREATE TABLE public.mfg_product_kinds (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('finished','raw','semi','packaging')),
  uom text NOT NULL DEFAULT 'unit',
  shelf_life_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mfg_product_kinds TO authenticated;
GRANT ALL ON public.mfg_product_kinds TO service_role;
ALTER TABLE public.mfg_product_kinds ENABLE ROW LEVEL SECURITY;
CREATE POLICY mpk_read ON public.mfg_product_kinds FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY mpk_write ON public.mfg_product_kinds FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_mpk_touch BEFORE UPDATE ON public.mfg_product_kinds FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bill_of_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  yield_quantity numeric(18,4) NOT NULL DEFAULT 1,
  uom text NOT NULL DEFAULT 'unit',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','archived')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_of_materials TO authenticated;
GRANT ALL ON public.bill_of_materials TO service_role;
ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY bom_read ON public.bill_of_materials FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY bom_write ON public.bill_of_materials FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_bom_company ON public.bill_of_materials(company_id, status);
CREATE TRIGGER trg_bom_touch BEFORE UPDATE ON public.bill_of_materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL REFERENCES public.bill_of_materials(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL,
  uom text NOT NULL DEFAULT 'unit',
  scrap_pct numeric(6,3) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bom_items TO authenticated;
GRANT ALL ON public.bom_items TO service_role;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY bomi_scope ON public.bom_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bill_of_materials b WHERE b.id = bom_id AND public.is_company_member(auth.uid(), b.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bill_of_materials b WHERE b.id = bom_id AND public.is_company_admin(auth.uid(), b.company_id)));

CREATE TABLE public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','maintenance','offline','decommissioned')),
  capacity_per_hour numeric(18,4),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY mch_read ON public.machines FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY mch_write ON public.machines FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_mch_touch BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.machine_downtime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  reason text NOT NULL DEFAULT 'unspecified',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machine_downtime TO authenticated;
GRANT ALL ON public.machine_downtime TO service_role;
ALTER TABLE public.machine_downtime ENABLE ROW LEVEL SECURITY;
CREATE POLICY dwn_read ON public.machine_downtime FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY dwn_write ON public.machine_downtime FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_dwn_machine ON public.machine_downtime(machine_id, started_at DESC);

CREATE TABLE public.maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'preventive' CHECK (kind IN ('preventive','corrective','inspection')),
  scheduled_for timestamptz,
  performed_at timestamptz,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_orders TO authenticated;
GRANT ALL ON public.maintenance_orders TO service_role;
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY mnt_read ON public.maintenance_orders FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY mnt_write ON public.maintenance_orders FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_mnt_machine ON public.maintenance_orders(machine_id, scheduled_for);
CREATE TRIGGER trg_mnt_touch BEFORE UPDATE ON public.maintenance_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  bom_id uuid REFERENCES public.bill_of_materials(id) ON DELETE SET NULL,
  machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  planned_quantity numeric(18,4) NOT NULL DEFAULT 0,
  produced_quantity numeric(18,4) NOT NULL DEFAULT 0,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','in_progress','completed','cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders TO authenticated;
GRANT ALL ON public.production_orders TO service_role;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_mfg_read ON public.production_orders FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY po_mfg_write ON public.production_orders FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_pomfg_company ON public.production_orders(company_id, status);
CREATE TRIGGER trg_pomfg_touch BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  batch_number text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 0,
  manufactured_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  quality_status text NOT NULL DEFAULT 'pending' CHECK (quality_status IN ('pending','pass','fail','rework','quarantined')),
  traceability jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, batch_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_batches TO authenticated;
GRANT ALL ON public.production_batches TO service_role;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY pb_read ON public.production_batches FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY pb_write ON public.production_batches FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_pb_company ON public.production_batches(company_id, quality_status);
CREATE INDEX idx_pb_product ON public.production_batches(product_id);
CREATE TRIGGER trg_pb_touch BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.production_batches(id) ON DELETE CASCADE,
  production_order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
  inspector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result text NOT NULL CHECK (result IN ('pass','fail','rework')),
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  inspected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_inspections TO authenticated;
GRANT ALL ON public.quality_inspections TO service_role;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY qi_read ON public.quality_inspections FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY qi_write ON public.quality_inspections FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_qi_batch ON public.quality_inspections(batch_id);
