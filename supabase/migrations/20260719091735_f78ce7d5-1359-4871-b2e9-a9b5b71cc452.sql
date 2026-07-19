
-- ============================================================
-- Approvals: block requester self-approval
-- ============================================================
DROP POLICY IF EXISTS "approvals_update_admin_or_requester" ON public.approvals;

CREATE POLICY "approvals_update_admin" ON public.approvals
  FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Requester may edit their own pending request but NEVER touch decision fields.
CREATE POLICY "approvals_update_requester_pending" ON public.approvals
  FOR UPDATE TO authenticated
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
    AND NOT public.is_company_admin(auth.uid(), company_id)
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND status = 'pending'
    AND approver_id IS NOT DISTINCT FROM (SELECT approver_id FROM public.approvals a WHERE a.id = approvals.id)
    AND decided_at IS NOT DISTINCT FROM (SELECT decided_at FROM public.approvals a WHERE a.id = approvals.id)
  );

-- ============================================================
-- Purchase requests: only admins may change status
-- ============================================================
DROP POLICY IF EXISTS pr_write ON public.purchase_requests;

CREATE POLICY pr_admin_write ON public.purchase_requests FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY pr_requester_insert ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id)
    AND requested_by = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY pr_requester_update_draft ON public.purchase_requests FOR UPDATE TO authenticated
  USING (
    requested_by = auth.uid()
    AND status IN ('draft','submitted')
    AND NOT public.is_company_admin(auth.uid(), company_id)
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND status = (SELECT p.status FROM public.purchase_requests p WHERE p.id = purchase_requests.id)
  );

CREATE POLICY pr_requester_delete_draft ON public.purchase_requests FOR DELETE TO authenticated
  USING (requested_by = auth.uid() AND status = 'draft');

-- ============================================================
-- Quiz attempts: students may not self-grade
-- ============================================================
DROP POLICY IF EXISTS qa_self ON public.quiz_attempts;

CREATE POLICY qa_self_read ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY qa_self_insert ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND score IS NULL
    AND passed IS NULL
  );

-- Owner may update answers/submitted_at but never score/passed.
CREATE POLICY qa_self_update ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND score IS NOT DISTINCT FROM (SELECT a.score  FROM public.quiz_attempts a WHERE a.id = quiz_attempts.id)
    AND passed IS NOT DISTINCT FROM (SELECT a.passed FROM public.quiz_attempts a WHERE a.id = quiz_attempts.id)
  );

-- Admins/instructors of the owning quiz's company may write grading fields.
CREATE POLICY qa_admin_all ON public.quiz_attempts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_attempts.quiz_id
        AND q.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), q.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_attempts.quiz_id
        AND q.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), q.company_id)
    )
  );

-- ============================================================
-- Assignment submissions: students may not self-grade
-- ============================================================
DROP POLICY IF EXISTS sub_owner ON public.assignment_submissions;

CREATE POLICY sub_owner_read ON public.assignment_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY sub_owner_insert ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND score IS NULL
    AND feedback IS NULL
    AND graded_at IS NULL
  );

CREATE POLICY sub_owner_update ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND score     IS NOT DISTINCT FROM (SELECT s.score     FROM public.assignment_submissions s WHERE s.id = assignment_submissions.id)
    AND feedback  IS NOT DISTINCT FROM (SELECT s.feedback  FROM public.assignment_submissions s WHERE s.id = assignment_submissions.id)
    AND graded_at IS NOT DISTINCT FROM (SELECT s.graded_at FROM public.assignment_submissions s WHERE s.id = assignment_submissions.id)
  );

-- Company admins/instructors of the assignment's owning company may grade.
CREATE POLICY sub_admin_all ON public.assignment_submissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      LEFT JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id
        AND c.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), c.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      LEFT JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id
        AND c.company_id IS NOT NULL
        AND public.is_company_admin(auth.uid(), c.company_id)
    )
  );
