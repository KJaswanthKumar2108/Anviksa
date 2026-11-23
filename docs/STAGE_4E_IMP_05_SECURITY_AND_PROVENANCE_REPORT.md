# Anvīkṣā — Stage 4E-IMP-05 Security and Provenance Report
## Row-Level Security, Author Review Isolation, Senior Arbitration & Epistemic Invalidation Cascades

**Document Version:** 1.0.0-STAGE4E-IMP05-SECURITY  
**Milestone:** Stage 4E — Research Opportunity Intelligence  
**Work Package:** Stage 4E-IMP-05 — Evaluation and Scientific Review  
**Baseline:** Frozen Stage 4E Architecture + Final Scientific Integrity Amendment  
**Date:** 2026-11-23  

---

## 1. Security Architecture & Threat Model

Stage 4E handles high-stakes research intelligence. If untrusted actors or unauthenticated clients could directly manipulate review decisions, approve unverified hypotheses, or alter historical evaluation scores, the epistemic integrity of the platform would be destroyed.

To guard against these failure modes, 4E-IMP-05 implements:
1. **Zero Client Trust:** All evaluation and review tables are locked down with PostgreSQL Row-Level Security (RLS). Direct client SQL `INSERT`, `UPDATE`, and `DELETE` queries are rejected unconditionally.
2. **Author Self-Review Demarcation:** The system prevents researchers from masquerading as independent peer reviewers.
3. **Formal Disagreement Escalation:** Disagreements exceeding predefined variance boundaries automatically escalate to Senior Scientific Arbitration.
4. **Epistemic Invalidation Triggers:** When parent research hypotheses or experiment protocols undergo revisions or become stale, active reviews are automatically invalidated.

---

## 2. Row-Level Security (RLS) Implementation

### 2.1 Table RLS Posture

| Database Table | RLS State | SELECT Policy | Client Mutation Policy (INSERT/UPDATE/DELETE) |
| :--- | :--- | :--- | :--- |
| `public.researcher_reviews` | **ENABLED** | `FOR SELECT TO authenticated USING (true)` | Blocked via `WITH CHECK (false)` & `USING (false)` |
| `public.research_evaluations` | **ENABLED** | `FOR SELECT TO authenticated USING (true)` | Blocked via `WITH CHECK (false)` & `USING (false)` |
| `public.research_reviewer_allocations` | **ENABLED** | `FOR SELECT TO authenticated USING (true)` | Blocked via `WITH CHECK (false)` & `USING (false)` |

### 2.2 Anonymous Client Rejection
In addition to authenticated write blocks, anonymous client roles (`anon`) are explicitly barred:
```sql
CREATE POLICY rls_reviews_anon_block_all ON public.researcher_reviews
    FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY rls_evaluations_anon_block_all ON public.research_evaluations
    FOR ALL TO anon USING (false) WITH CHECK (false);
```
Verified in Gate 1 of `tests/stage4e_scientific_evaluation.ts`: direct anonymous inserts to `research_evaluations` and `researcher_reviews` fail immediately.

---

## 3. Human Review Integrity & Author Demarcation

### 3.1 Strict Separation of Author Self-Review vs Independent Peer Review
A critical scientific invariant is that **no investigator may approve their own hypothesis or experimental protocol**.

In `rpc_submit_researcher_review`:
```plpgsql
-- Determine creator of the entity
IF p_entity_type = 'HYPOTHESIS' THEN
    SELECT created_by, status INTO v_creator_id, v_current_status
    FROM public.research_hypotheses WHERE id = p_entity_id;
ELSIF p_entity_type = 'EXPERIMENT' THEN
    SELECT created_by, status INTO v_creator_id, v_current_status
    FROM public.research_experiments WHERE id = p_entity_id;
END IF;

-- Detect self-review: if reviewer matches creator, force AUTHOR role
IF v_creator_id IS NOT NULL AND v_creator_id = p_reviewer_id THEN
    v_is_self_review := true;
    v_effective_role := 'AUTHOR';
END IF;

-- Only independent peer reviews or senior arbitrators can advance status to RESEARCHER_APPROVED
IF NOT v_is_self_review THEN
    IF p_decision IN ('APPROVED', 'MODIFIED_AND_APPROVED') THEN
        IF p_entity_type = 'HYPOTHESIS' THEN
            UPDATE public.research_hypotheses SET status = 'RESEARCHER_APPROVED' WHERE id = p_entity_id;
        ELSIF p_entity_type = 'EXPERIMENT' THEN
            UPDATE public.research_experiments SET status = 'RESEARCHER_APPROVED' WHERE id = p_entity_id;
        END IF;
    END IF;
END IF;
```

#### Verification Result (Gate 9)
- When Author (User A) submits an approval review on their own hypothesis:
  - `is_self_review` evaluates to `true`.
  - `reviewer_role` is forced to `'AUTHOR'`.
  - Parent hypothesis status remains `VERIFIED_FOR_REVIEW`.
- When Independent Peer (User B) submits an approval review:
  - `is_self_review` evaluates to `false`.
  - Parent hypothesis status advances to `RESEARCHER_APPROVED`.

---

## 4. Senior Scientific Arbitration & Disagreement Escalation

### 4.1 Disagreement Threshold Triggers
In multi-rater evaluation, subjective variance can yield conflicting reviews. Anvīkṣā establishes two formal escalation triggers:
1. **Continuous Rating Delta ($> 1.5$):** If the difference between any pair of active rater Likert scores on a 5-point scale exceeds $1.5$ (e.g. Rater 1 gives $5/5$ and Rater 2 gives $2/5$, delta = $3.0$).
2. **Binary Decision Split ($2 - 1$):** If one reviewer approves while another rejects.

### 4.2 Arbitration Protocol
When either trigger fires:
- The submission service flags the artifact with `escalatedToArbitration = true`.
- An independent Senior Scientific Arbitrator is assigned.
- The Arbitrator evaluates the artifact and blinded peer critiques.
- The Arbitrator records a binding ruling accompanied by mandatory written justification stored in `public.researcher_reviews.adjudication_notes`.
- **Tie-Breaking Rule:** If an unresolved physical or mathematical counterexample exists, the artifact is automatically rejected.

#### Verification Result (Gate 10)
- Verified in Gate 10: Dissenting review with delta $3.0 > 1.5$ triggered escalation flag.
- Senior Arbitrator submitted binding approval with recorded adjudication notes, successfully resolving the dispute.

---

## 5. Epistemic Invalidation & Cascade Triggers

### 5.1 Invalidation Trigger on Hypothesis Statement Revision
When an investigator edits a hypothesis statement, previous peer reviews no longer apply to the revised artifact. A PostgreSQL database trigger enforces this automatically:
```sql
CREATE OR REPLACE FUNCTION public.fn_cascade_hypothesis_invalidation_to_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (
        (NEW.is_stale = true AND OLD.is_stale IS DISTINCT FROM true) OR
        (NEW.hypothesis_statement IS DISTINCT FROM OLD.hypothesis_statement)
    )) THEN
        UPDATE public.researcher_reviews
        SET is_invalidated = true,
            invalidation_reason = CASE 
                WHEN NEW.is_stale = true THEN 'UPSTREAM_EVIDENCE_STALE'
                ELSE 'HYPOTHESIS_STATEMENT_REVISED'
            END
        WHERE entity_type = 'HYPOTHESIS' AND entity_id = NEW.id AND is_invalidated = false;
    END IF;
    RETURN NEW;
END;
$$;
```

### 5.2 Experiment Objective Revision Trigger
An identical trigger (`trg_cascade_experiment_to_reviews`) guards `public.research_experiments`, ensuring that changes to experiment objectives or staleness invalidate existing reviews.

### 5.3 Explicit Invalidation RPC (`rpc_invalidate_entity_reviews`)
Provides an atomic administrative function to invalidate all active reviews for an entity and reset its status from `RESEARCHER_APPROVED` back to `VERIFIED_FOR_REVIEW`.

#### Verification Result (Gate 11)
- Updating a hypothesis statement immediately cascaded to `researcher_reviews`: active reviews were marked `is_invalidated = true` with reason `'HYPOTHESIS_STATEMENT_REVISED'`.
- Review history was completely preserved, maintaining a monotonic immutable audit log.

---

## 6. Security & Provenance Audit Matrix

| Security / Integrity Requirement | Implementation Mechanism | Verified in Gate | Status |
| :--- | :--- | :--- | :--- |
| **RLS Direct Insert Lockdown** | `rls_reviews_block_client_insert`, `rls_evaluations_block_client_insert` | Gate 1 | **PASSED** |
| **Anonymous Caller Denial** | `rls_reviews_anon_block_all`, Bearer auth on `/api/research/reviews` | Gate 1 & 12 | **PASSED** |
| **Author Self-Review Demarcation** | `rpc_submit_researcher_review` creator check | Gate 9 | **PASSED** |
| **Self-Approval Prevention** | Status update conditional on `NOT v_is_self_review` | Gate 9 | **PASSED** |
| **Disagreement Escalation** | Delta $> 1.5$ & split decision detector | Gate 10 | **PASSED** |
| **Senior Arbitrator Authority** | `reviewer_role = 'SENIOR_ARBITRATOR'` + `adjudication_notes` | Gate 10 | **PASSED** |
| **Revision Invalidation Trigger** | `trg_cascade_hypothesis_to_reviews` | Gate 11 | **PASSED** |
| **Staleness Invalidation Trigger** | `trg_cascade_experiment_to_reviews` | Gate 11 | **PASSED** |
| **Historical Audit Monotonicity** | All prior reviews retained with `is_invalidated = true` | Gate 11 & 12 | **PASSED** |
