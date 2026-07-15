
ALTER TABLE public.project_domains
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE text USING status::text,
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.project_domains
  ADD CONSTRAINT project_domains_status_chk CHECK (status IN (
    'pending','verification_required','verifying','verified',
    'active','suspended','expired','failed','removed'
  ));

ALTER TABLE public.project_domains
  ADD CONSTRAINT project_domains_ssl_state_chk CHECK (ssl_state IN (
    'pending','issued','active','renewing','expired','failed'
  ));

ALTER TABLE public.project_domains
  ADD CONSTRAINT project_domains_dns_status_chk CHECK (dns_status IN (
    'unknown','ok','missing','mismatch','error'
  ));
