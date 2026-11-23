# Anvīkṣā — Stage 4E-IMP-04 Final Security & Validation Report
## Threat Modeling, RLS Audit, and Adversarial Verification

**Document Version:** 1.0.0-STAGE4E-IMP04-FINAL-SECURITY  
**Milestone:** Stage 4E — Research Opportunity Intelligence  
**Work Package:** 4E-IMP-04  
**Status:** **SECURED & AUDITED**  

---

## 1. Security Architecture Summary

1. **Row-Level Security (RLS):**
   - Tables: `researcher_resource_profiles`, `researcher_resources`, `research_strategic_recommendations`, `researcher_reviews`.
   - Read policies: Enforce owner isolation (`auth.uid() = user_id`).
   - Write policies: Direct client `INSERT`, `UPDATE`, and `DELETE` explicitly denied (`WITH CHECK (false)` / `USING (false)`).
2. **Privileged RPC Security:**
   - `rpc_upsert_researcher_resource`: Restricted to authenticated users and `service_role`. Ensures user cannot modify records belonging to other researchers.
   - `rpc_persist_strategic_recommendation`: Restricted strictly to `service_role`.
3. **Actor Identity Derivation:**
   - The API extracts authenticated researcher identity directly from validated Bearer JWT tokens via `admin.auth.getUser(token)`.
   - Body-supplied `userId` mismatches trigger an immediate `403 Forbidden` (`USER_MISMATCH`).
4. **Verification Provenance Guard:**
   - Rejects unverified client claims of `VERIFIED_AVAILABLE` unless accompanied by an authorized independent evidence source and authentic verification reference.

---

## 2. Adversarial Security Test Suite Results

All security assertions executed in `tests/stage4e_resource_suitability.ts` passed:
- `[PASS]` Unauthenticated request rejected with 401 Unauthorized
- `[PASS]` Invalid Bearer token rejected with 401 Unauthorized
- `[PASS]` Direct anonymous insert to researcher_resources strictly blocked by RLS
- `[PASS]` Direct anonymous insert to research_strategic_recommendations strictly blocked by RLS
- `[PASS]` Honest Provenance: Self-declared verified claim downgraded to DECLARED_AVAILABLE
- `[PASS]` Upstream experiment staleness propagates is_stale = true to recommendation
