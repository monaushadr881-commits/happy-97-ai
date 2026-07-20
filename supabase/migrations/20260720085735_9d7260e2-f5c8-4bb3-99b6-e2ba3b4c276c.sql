-- R195 Batch 2 (P0) — Fix confirmed RLS privilege escalation on public.purchase_requests
-- Canonical scan: only surface is public.purchase_requests; existing policies
-- pr_read / pr_admin_write / pr_requester_insert / pr_requester_delete_draft
-- are preserved. Only the broken pr_requester_update_draft policy is replaced,
-- and a defense-in-depth BEFORE UPDATE trigger is added on the same table.
-- No new table, no new function surface outside this row-guard trigger.

-- 1) Drop the vulnerable policy (self-referencing WITH CHECK subquery on the
--    same row let a requester mutate their own already-submitted request and
--    forge status transitions).
DROP POLICY IF EXISTS pr_requester_update_draft ON public.purchase_requests;

-- 2) Recreate: requesters may edit ONLY their own draft rows, and cannot flip
--    status through the policy WITH CHECK.
CREATE POLICY pr_requester_update_draft
  ON public.purchase_requests
  FOR UPDATE
  TO authenticated
  USING (
    requested_by = auth.uid()
    AND status = 'draft'
    AND NOT public.is_company_admin(auth.uid(), company_id)
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND status = 'draft'
    AND NOT public.is_company_admin(auth.uid(), company_id)
  );

-- 3) Row guard: block requesters from acting as approver on their own row and
--    freeze rows past draft from any non-admin mutation. This closes the last
--    class of self-approval attempts even if a future policy edit regresses.
CREATE OR REPLACE FUNCTION public.purchase_requests_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.requested_by = auth.uid()
       AND NOT public.is_company_admin(auth.uid(), NEW.company_id) THEN
      RAISE EXCEPTION 'requester cannot change status on own purchase request';
    END IF;
    IF OLD.status <> 'draft'
       AND NOT public.is_company_admin(auth.uid(), OLD.company_id) THEN
      RAISE EXCEPTION 'non-admin cannot modify a non-draft purchase request';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_purchase_requests_guard ON public.purchase_requests;
CREATE TRIGGER trg_purchase_requests_guard
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.purchase_requests_guard();