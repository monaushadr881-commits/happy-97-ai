-- R106 — job_queue: explicit deny-by-default INSERT/UPDATE/DELETE for
-- authenticated users. Workers use the service_role client which bypasses
-- RLS, so this does not affect background processing.
DROP POLICY IF EXISTS jq_no_insert ON public.job_queue;
DROP POLICY IF EXISTS jq_no_update ON public.job_queue;
DROP POLICY IF EXISTS jq_no_delete ON public.job_queue;

CREATE POLICY jq_no_insert ON public.job_queue
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY jq_no_update ON public.job_queue
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY jq_no_delete ON public.job_queue
  FOR DELETE TO authenticated USING (false);