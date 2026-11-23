# Anvīkṣā — Stage 4E-IMP-04 Security & Validation Report
## Threat Modeling, RLS Hardening, and Adversarial Verification

**Work Package:** Stage 4E-IMP-04  
**Document Version:** 1.0.0-STAGE4E-IMP04-SECURITY  

---

## 1. Security Architecture & Threat Mitigation

### 1.1 Row-Level Security (RLS) Isolation
- Direct SQL `INSERT`, `UPDATE`, and `DELETE` on `researcher_resources`, `researcher_resource_profiles`, and `research_strategic_recommendations` are blocked for public/client roles via explicit `WITH CHECK (false)` and `USING (false)` policies.
- Researchers can only `SELECT` their own resources (`auth.uid() = user_id`).
- All modifications are performed through `SECURITY DEFINER` atomic stored procedures:
  - `rpc_upsert_researcher_resource`
  - `rpc_persist_strategic_recommendation`

### 1.2 Authentication & User Impersonation Defense
- Every API endpoint validates the `Authorization: Bearer <token>` header against Supabase auth.
- Any request attempting to supply a differing `userId` in the body payload is rejected with `403 Forbidden` (`USER_MISMATCH`).

### 1.3 Upstream Staleness & Epistemic Invalidation Cascades
- When an upstream experiment protocol is updated (`research_experiments.is_stale = true`), the database trigger `trg_cascade_experiment_to_recommendations` automatically updates all dependent strategic recommendations with `is_stale = true` and `staleness_reason = 'UPSTREAM_EXPERIMENT_PROTOCOL_STALE'`.
- Similarly, updating a researcher's resource inventory automatically invalidates active recommendations for that researcher with reason `UPSTREAM_RESOURCE_INVENTORY_MODIFIED`.

---

## 2. Adversarial Security Verification Results

| Test ID | Adversarial Vector | Expected Outcome | Actual Verification |
|---|---|---|---|
| SEC-01 | Unauthenticated GET `/api/research/resources` | 401 Unauthorized | Passed (401) |
| SEC-02 | Forged Bearer Token | 401 Unauthorized | Passed (401) |
| SEC-03 | Direct Client Insert to `researcher_resources` | RLS Permission Denied | Passed (RLS Error) |
| SEC-04 | Direct Client Insert to `research_strategic_recommendations` | RLS Permission Denied | Passed (RLS Error) |
| SEC-05 | Client Spoofs `userId` of another researcher | 403 Forbidden | Passed (USER_MISMATCH) |
| SEC-06 | Upstream Experiment Invalidation | Cascade `is_stale = true` | Passed (is_stale = true) |
