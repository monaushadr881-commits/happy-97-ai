
-- Approvals table
CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  title text NOT NULL,
  reason text,
  amount_cents bigint DEFAULT 0,
  currency text DEFAULT 'USD',
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_company_status ON public.approvals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON public.approvals(entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_select_company_members" ON public.approvals
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "approvals_insert_company_members" ON public.approvals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND requested_by = auth.uid());

CREATE POLICY "approvals_update_admin_or_requester" ON public.approvals
  FOR UPDATE TO authenticated
  USING (
    public.is_company_admin(auth.uid(), company_id)
    OR (requested_by = auth.uid() AND status = 'pending')
  )
  WITH CHECK (
    public.is_company_admin(auth.uid(), company_id)
    OR (requested_by = auth.uid())
  );

CREATE POLICY "approvals_delete_admin" ON public.approvals
  FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id));

SELECT public._hxp_attach_touch('public.approvals');

-- Add approval_status to PO/SO
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
  CHECK (approval_status IN ('draft','pending','approved','rejected','completed','cancelled'));
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
  CHECK (approval_status IN ('draft','pending','approved','rejected','fulfilled','cancelled'));

CREATE INDEX IF NOT EXISTS idx_purchase_orders_approval ON public.purchase_orders(company_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_approval ON public.sales_orders(company_id, approval_status);
