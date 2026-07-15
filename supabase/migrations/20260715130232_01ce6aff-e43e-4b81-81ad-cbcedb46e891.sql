
-- R22 ERP Core

CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  number text NOT NULL,
  title text NOT NULL,
  justification text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','converted','cancelled')),
  currency text NOT NULL DEFAULT 'USD',
  total_cents bigint NOT NULL DEFAULT 0,
  needed_by date,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_read ON public.purchase_requests FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY pr_write ON public.purchase_requests FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR requested_by = auth.uid())
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE INDEX idx_pr_company_status ON public.purchase_requests(company_id, status);
CREATE TRIGGER trg_pr_touch BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_cost_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_request_items TO authenticated;
GRANT ALL ON public.purchase_request_items TO service_role;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY pri_scope ON public.purchase_request_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchase_requests r WHERE r.id = request_id AND public.is_company_member(auth.uid(), r.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_requests r WHERE r.id = request_id AND public.is_company_member(auth.uid(), r.company_id)));

CREATE TABLE public.vendor_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  reference text,
  currency text NOT NULL DEFAULT 'USD',
  total_cents bigint NOT NULL DEFAULT 0,
  valid_until date,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','shortlisted','awarded','rejected','expired')),
  notes text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_quotations TO authenticated;
GRANT ALL ON public.vendor_quotations TO service_role;
ALTER TABLE public.vendor_quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY vq_read ON public.vendor_quotations FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY vq_write ON public.vendor_quotations FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_vq_company ON public.vendor_quotations(company_id, status);
CREATE INDEX idx_vq_supplier ON public.vendor_quotations(supplier_id);
CREATE TRIGGER trg_vq_touch BEFORE UPDATE ON public.vendor_quotations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  number text NOT NULL,
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','partial','rejected','returned')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipts TO authenticated;
GRANT ALL ON public.goods_receipts TO service_role;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY gr_read ON public.goods_receipts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY gr_write ON public.goods_receipts FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE INDEX idx_gr_po ON public.goods_receipts(purchase_order_id);
CREATE TRIGGER trg_gr_touch BEFORE UPDATE ON public.goods_receipts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  po_item_id uuid REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  description text,
  quantity_received numeric(18,4) NOT NULL DEFAULT 0,
  quantity_rejected numeric(18,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goods_receipt_items TO authenticated;
GRANT ALL ON public.goods_receipt_items TO service_role;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY gri_scope ON public.goods_receipt_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.goods_receipts g WHERE g.id = receipt_id AND public.is_company_member(auth.uid(), g.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.goods_receipts g WHERE g.id = receipt_id AND public.is_company_admin(auth.uid(), g.company_id)));

CREATE TABLE public.vendor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_categories TO authenticated;
GRANT ALL ON public.vendor_categories TO service_role;
ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY vc_read ON public.vendor_categories FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY vc_write ON public.vendor_categories FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_vc_touch BEFORE UPDATE ON public.vendor_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.vendor_category_map (
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.vendor_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_category_map TO authenticated;
GRANT ALL ON public.vendor_category_map TO service_role;
ALTER TABLE public.vendor_category_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY vcm_scope ON public.vendor_category_map FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND public.is_company_member(auth.uid(), s.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND public.is_company_admin(auth.uid(), s.company_id)));

CREATE TABLE public.vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  rater_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ratings TO authenticated;
GRANT ALL ON public.vendor_ratings TO service_role;
ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY vr_read ON public.vendor_ratings FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY vr_insert ON public.vendor_ratings FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND rater_id = auth.uid());
CREATE POLICY vr_update_own ON public.vendor_ratings FOR UPDATE TO authenticated
  USING (rater_id = auth.uid()) WITH CHECK (rater_id = auth.uid());
CREATE POLICY vr_delete_admin ON public.vendor_ratings FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR rater_id = auth.uid());
CREATE INDEX idx_vr_supplier ON public.vendor_ratings(supplier_id);

CREATE TABLE public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'general',
  name text NOT NULL,
  url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_documents TO authenticated;
GRANT ALL ON public.vendor_documents TO service_role;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY vd_read ON public.vendor_documents FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY vd_write ON public.vendor_documents FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE public.vendor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  starts_on date,
  ends_on date,
  value_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  terms text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','terminated')),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_contracts TO authenticated;
GRANT ALL ON public.vendor_contracts TO service_role;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY vk_read ON public.vendor_contracts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY vk_write ON public.vendor_contracts FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE TRIGGER trg_vk_touch BEFORE UPDATE ON public.vendor_contracts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.approval_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  delegator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegatee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_delegations TO authenticated;
GRANT ALL ON public.approval_delegations TO service_role;
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_read ON public.approval_delegations FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY ad_write ON public.approval_delegations FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id) OR delegator_id = auth.uid())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND (delegator_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id)));
CREATE INDEX idx_ad_company_active ON public.approval_delegations(company_id, ends_at);
