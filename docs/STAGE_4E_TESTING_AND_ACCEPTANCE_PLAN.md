# Anvīkṣā — Stage 4E Testing & Acceptance Plan
## Comprehensive Test Strategies, Adversarial Verifications & Acceptance Tracking

**Document Version:** 4.1.0-STAGE4E-TEST-PLAN  
**Status:** ARCHITECTURAL SPECIFICATION ONLY (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E  
**Date:** 2026-11-21  

---

# 1. Executive Summary & Verification Strategy

This document establishes the comprehensive test plan and acceptance framework for Stage 4E. 

The verification strategy follows the established Anvīkṣā test architecture:
- Zero flaky tests: deterministic assertions with mocked external API fixtures.
- Security-first: comprehensive RLS bypass attacks and SQL injection probes.
- Scientific rigor: adversarial test vectors designed to probe non-compensatory gates, uncalibrated thresholds, and data leakage barriers.
- Regression preservation: all 207 existing platform checks (Stages 4A–4D.1) must pass without alteration.

---

# 2. Master Work Package Status Tracking

In accordance with strict execution boundaries, all Stage 4E work packages are classified as **NOT IMPLEMENTED**:

| Work Package ID | Work Package Title | Implementation Status | Test Suite Status | Acceptance Status | Required Evidence for Closure |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **4E-IMP-01** | **Research Opportunity Intelligence** | `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | 100% passing tests in `tests/stage4e_opportunity_intelligence.ts`. Decoupled scoring verified. |
| **4E-IMP-02** | **Falsifiable Hypothesis Engine** | `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | 100% passing tests in `tests/stage4e_hypothesis_engine.ts`. 10-point rubric ($HFI \ge 90\%$) verified. |
| **4E-IMP-03** | **Experiment Protocol Synthesizer**| `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | 100% passing tests in `tests/stage4e_experiment_synthesizer.ts`. 11 paradigms & $BAR = 100\%$ verified. |
| **4E-IMP-04** | **Resource Suitability & 2D Matrix**| `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | 100% passing tests in `tests/stage4e_resource_suitability.ts`. Discrete states & zero multipliers verified. |
| **4E-IMP-05** | **Evaluation & Multi-Rater Review**| `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | 100% passing tests in `tests/stage4e_evaluation_framework.ts`. Non-parametric bootstrap & BIBD verified. |
| **4E-IMP-06** | **Integration & Acceptance Suite** | `NOT IMPLEMENTED` | `PLANNED` | `PENDING AUTH` | End-to-end execution of `tests/stage4e_acceptance_verification.ts` across 50 benchmark cases. |

---

# 3. Work Package Test Specifications

### 3.1 4E-IMP-01: Research Opportunity Intelligence
- **Unit Tests:**
  - `test_opportunity_scoring_math`: Verifies linear combination $V_{scientific} = 0.30 S_c + 0.25 S_n + 0.30 S_s + 0.15 S_t$.
  - `test_residual_scope_isolation`: Verifies JSONB parser extracts unresolved scope and active trade-offs for partially addressed gaps.
  - `test_weighting_regime_sensitivity`: Asserts Kendall's $\tau \ge 0.85$ across Balanced, Theory, Exploration, and Rigor profiles.
- **Adversarial Tests:**
  - `test_adversarial_novelty_saturation`: Feeds gap with 100 identical preprints; asserts $S_{novelty}$ drops continuously and triggers `TOPIC_SATURATION_WARNING` without artificial scalar min-capping.
  - `test_adversarial_premise_falsification`: Injects confirmed cross-literature contradiction; verifies trigger of `INELIGIBLE_FALSIFIED_PREMISE` gate.
  - `test_missing_metric_data`: Injects gap with unoperationalized literature metrics; asserts system assigns `STATUS: METRIC_UNSPECIFIED` without injecting an arbitrary numerical penalty.
- **Database & Security Tests:**
  - `test_composite_fk_restriction`: Attempts to insert opportunity with non-existent `(gap_id, validation_run_id)`; asserts PostgreSQL foreign key violation.
  - `test_opportunity_rls_public_read`: Verifies unauthenticated users can read eligible opportunities but cannot execute mutations.

### 3.2 4E-IMP-02: Falsifiable Hypothesis Engine
- **Unit Tests:**
  - `test_schema_completeness_27_fields`: Validates AST structure of synthesized hypotheses across all 6 paradigms.
  - `test_null_alternative_disjunction`: Asserts $H_0 \cap H_1 = \emptyset$ and $H_0 \cup H_1 = \Omega$.
  - `test_variable_isolation`: Verifies independent, dependent, and control variables are strictly partitioned.
- **Adversarial Tests:**
  - `test_tautology_rejection`: Injects trivial circular statement (*"Transformer self-attention computes dot-product attention"*); asserts Gate 6 rejection.
  - `test_physical_law_violation`: Injects statement claiming sub-linear sorting without comparisons; asserts Gate 7 rejection.
  - `test_unfalsifiable_platitude`: Injects unfalsifiable statement without failure criteria; asserts status `REQUIRES_REFINEMENT`.
- **Database & Security Tests:**
  - `test_immutable_hypothesis_versions`: Mutates hypothesis statement; asserts previous payload is immutably archived in `public.research_hypothesis_versions` with incremented `current_version`.

### 3.3 4E-IMP-03: Experiment Protocol Synthesizer
- **Unit Tests:**
  - `test_11_paradigm_schema_conformance`: Synthesizes one protocol for each of the 11 paradigms; validates required variables, baselines, and falsification rules.
  - `test_statistical_power_calculator`: Verifies sample size calculation for two-tailed t-test ($\alpha = 0.05, 1-\beta = 0.80, d = 0.5 \implies N \approx 128$).
  - `test_threats_to_validity_coverage`: Asserts all 4 epistemic quadrants (Internal, External, Construct, Conclusion) are populated.
- **Adversarial Tests:**
  - `test_zero_hallucinated_baselines ($BAR = 100\%$):` Injects synthetic baseline paper; asserts harvester rejection.
  - `test_unreported_metric_truthfulness`: Injects baseline paper lacking target metric; asserts system labels `UNREPORTED_IN_ORIGINAL_PUBLICATION` instead of inventing a number.
  - `test_uncalibrated_threshold_labeling`: Injects ambiguous clinical trial threshold; asserts system outputs `REQUIRES_RESEARCHER_SPECIFICATION`.

### 3.4 4E-IMP-04: Resource Suitability & Strategic Recommendations
- **Unit Tests:**
  - `test_discrete_evidence_state_transitions`: Validates transitions across `VERIFIED_AVAILABLE`, `DECLARED_AVAILABLE`, `VERIFIED_UNAVAILABLE`, `UNKNOWN`, and `EXPIRED_EVIDENCE`.
  - `test_2d_strategic_quadrant_mapping`: Verifies all 5 quadrant outcomes:
    - $V \ge 6.0, E \ge 6.0 \implies \text{IMMEDIATE\_HIGH\_PRIORITY}$.
    - $V \ge 6.0, E < 6.0 \implies \text{GRANT\_OR\_COLLABORATION\_TARGET}$.
    - $V < 6.0, E \ge 6.0 \implies \text{FEASIBLE\_RESEARCH\_OPPORTUNITY}$.
    - $V < 6.0, E < 6.0 \implies \text{DEPRIORITIZED}$.
    - $E \text{ is null} \implies \text{SUITABILITY\_UNDETERMINED}$.
- **Adversarial Tests:**
  - `test_zero_arbitrary_multipliers`: Confirms that self-declared resources are never multiplied by $0.70$ or $0.80$.
  - `test_unknown_evidence_invariant`: Sets profile to empty/unknown; asserts $E_{suitability} = \text{null}$ and quadrant is `SUITABILITY_UNDETERMINED` (never penalizing the score).
  - `test_verified_unavailable_hard_gate`: Marks required GPU as `VERIFIED_UNAVAILABLE`; asserts $E_{suitability} = 0.00$.

### 3.5 4E-IMP-05: Evaluation Framework & Multi-Rater System
- **Unit Tests:**
  - `test_kendall_tau_b_paired_bootstrap`: Resamples tied ranking vectors over $B = 2,000$ iterations; validates BCa confidence interval construction.
  - `test_cluster_aware_ucr_bootstrap`: Resamples clustered assertions across $G = 100$ gaps; validates cluster-robust standard errors.
  - `test_pci_endpoint_handling`: Evaluates BCa bootstrap and Bayesian beta squeezing on $PCI = 0.0$ and $PCI = 10.0$; confirms zero domain singularities and bounds strictly in $[0.0, 10.0]$.
  - `test_bibd_algebraic_orthogonality`: Verifies $(12, 220, 55, 3, 10)$ parameters: $vr = bk = 660, \lambda(v-1) = r(k-1) = 110$.
- **Adversarial Tests:**
  - `test_coi_permutation_swap`: Flags reviewer with institutional co-authorship; verifies automated swap with unconflicted domain peer preserving $\lambda$.
  - `test_adjudication_escalation`: Generates score delta $> 1.5$; verifies routing to Senior Scientific Arbitrator.

### 3.6 4E-IMP-06: End-to-End Master Pipeline & Regression
- **Full Pipeline Verification:**
  - Ingests test paper $\to$ extracts gap $\to$ validates across literature $\to$ generates opportunity $\to$ generates hypothesis $\to$ designs protocol $\to$ executes researcher review.
- **Staleness Propagation Verification:**
  - Mutates upstream gap outcome; verifies that dependent opportunity, hypothesis, and protocol records are marked `is_stale = true` within the same transaction.
- **Platform Regression Check:**
  - Runs all existing suites: `stage4a_database_security.ts`, `stage4b_discovery_ingestion.ts`, `stage4c_extraction_verification.ts`, `stage4d_validation_verification.ts`, `stage4d_1_adversarial_verification.ts`. Target: **207/207 PASSED**.

---

# 4. Acceptance Commands & Execution Criteria

When implementation authorization is granted, the following automated commands will serve as the non-negotiable gates for Stage 4E completion:

```powershell
# 1. Typecheck and Static Lint
npm run lint

# 2. Existing Platform Regression Verification (Must maintain 207 passing checks)
npx tsx tests/stage4a_database_security.ts
npx tsx tests/stage4b_discovery_ingestion.ts
npx tsx tests/stage4c_extraction_verification.ts
npx tsx tests/stage4d_validation_verification.ts
npx tsx tests/stage4d_1_adversarial_verification.ts

# 3. Stage 4E Subsystem Verification Suites
npx tsx tests/stage4e_opportunity_intelligence.ts
npx tsx tests/stage4e_hypothesis_engine.ts
npx tsx tests/stage4e_experiment_synthesizer.ts
npx tsx tests/stage4e_resource_suitability.ts
npx tsx tests/stage4e_evaluation_framework.ts

# 4. Stage 4E Master End-to-End Integration Suite
npx tsx tests/stage4e_acceptance_verification.ts
```

```
═══════════════════════════════════════════════════════════════════════════════
  STAGE 4E TESTING & ACCEPTANCE PLAN: RATIFIED
  TEST SUITE EXECUTION BLOCKED PENDING IMPLEMENTATION AUTHORIZATION
═══════════════════════════════════════════════════════════════════════════════
```
