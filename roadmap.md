# Database security remediation
- [x] Apply fail-closed credit and marketplace-purchase write restrictions and scoped queue reads.
- [x] Add mandatory audit recording for financial writes.
- [x] Inspect hosted grants/policies and verify anonymous/global queue denial with real requests.
- [ ] Verify financial mutation denial and audit execution: blocked by disabled hosted EXPLAIN and the standing no-hosted-data-writes restriction.
- [ ] Verify governed financial writers: existing credit handlers use authenticated INSERT and now fail closed; reviewed server-authoritative writer integration is still required.
- [ ] Verify tenant-to-tenant queue boundaries with populated fixtures and suitable tenant sessions; current global queue test alone does not establish this.