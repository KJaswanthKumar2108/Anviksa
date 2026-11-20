# Anvīkṣā — Stage 4E Architecture Revision 1 Report
## Targeted Scientific Corrections, Scoring Integrity & Final Consistency Audit

**Document Version:** 4.1.0-STAGE4E-REV1-AUDIT  
**Milestone:** Stage 4E Revision 1  
**Architecture Baseline:** Stage 4.1.0-REVISED (Stage 4E Revision 1)  
**Previous Accepted Milestones:** Stage 4A, 4B, 4C, 4D, 4D.1  
**Execution Mode:** DOCUMENTATION-ONLY ARCHITECTURE REVISION  
**Implementation Authorization:** STRICTLY NOT GRANTED  
**Date:** 2026-11-20  

---

## 1. Executive Summary & Verification of Strict Execution Boundaries

Stage 4E Architecture Revision 1 resolves all scientific, mathematical, and architectural findings identified in the critical review of the initial Stage 4E draft. 

### Confirmation of Strict Boundaries:
1. **Zero Code Changes:** No TypeScript, JavaScript, or backend/frontend files were modified or created in `server/`, `src/`, or `tests/`.
2. **Zero Database Migrations or DDL:** No SQL migration files were created in `supabase/migrations/`, and zero DDL or mutations were executed on the live Supabase project (`dtlvtpntmtdmdawupylv`).
3. **Stage 4F Strictly Excluded:** The Stage 4F interactive workbench, UI canvases, and community challenge creation components remain completely unbuilt and unimplemented.
4. **Preservation of Accepted Milestones:** All accepted Stage 4A, 4B, 4C, 4D, and 4D.1 schemas, RLS policies, service-role isolation, composite foreign keys, and tests remain intact with 100% regression stability.

---

## 2. Summary of Targeted Scientific Corrections (Revision 1)

### 2.1 Correction 1: Decoupling Intrinsic Scientific Value from Researcher Suitability
- **Finding:** The initial draft incorporated feasibility directly into the opportunity ranking score, causing intrinsically monumental scientific problems to receive deflated scores simply because an individual researcher or single-GPU lab lacked compute.
- **Correction:** Established two strictly orthogonal assessments:
  1. **Assessment A: Intrinsic Scientific Opportunity Value ($V_{scientific} \in [0.0, 10.0]$):** Evaluates opportunity significance, evidence confidence, novelty, and tractability completely independent of any researcher or lab resources.
  2. **Assessment B: Researcher Execution Suitability ($E_{suitability} \in [0.0, 10.0]$):** Evaluates whether an individual researcher, team, or institution can realistically pursue the project under declared or verified compute, data, budget, and facility profiles.
  3. **Decision Output: Actionable Research Priority ($P_{actionable} \in [0.0, 10.0]$):** Formulates the 2D Strategic Decision Matrix ($V_{scientific}$ vs $E_{suitability}$). High-value opportunities exceeding local compute are surfaced as **`GRANT_OR_COLLABORATION_TARGET`** rather than having their intrinsic importance downgraded.

### 2.2 Correction 2: Elimination of Priority Circularity
- **Finding:** `S_priority` was circular—listed both as one of the 6 input dimensions and as the final composite output score.
- **Correction:** Removed `S_priority` as an input dimension entirely. The intrinsic input dimensions are strictly four: $S_{confidence}, S_{novelty}, S_{significance}, S_{tractability}$. Priority is strictly the decision output ($P_{actionable}$).

### 2.3 Correction 3: Evaluation Metric Formalization (All 10 Specification Criteria)
- **Finding:** Metrics lacked rigorous mathematical formulations, numerators/denominators, confidence interval models, and gaming analyses.
- **Correction:** Formally defined all six metrics across all 10 architectural criteria:
  - $HFI \ge 90\%$ (Hypothesis Falsifiability Index, Wilson score confidence interval).
  - $BAR = 100\%$ (Literature Baseline Authenticity Rate: justified why $100\%$ is an exact boolean audit check with zero tolerance for fabricated citations).
  - $\tau_{rank} \ge 0.70$ (Kendall's Rank Correlation Concordance, Fieller standard error).
  - $UCR \le 5.0\%$ (Unsupported Claim Rate, bootstrap CI).
  - $PCI \ge 8.5/10.0$ (Protocol Completeness Index, Student's t CI).
  - $RUS \ge 4.2/5.0$ (Researcher Utility Score, Likert scale).
- Disentangled the five evaluation dimensions: Functional correctness, Evidence-grounding accuracy, Scientific quality, Researcher usefulness, Statistical calibration.

### 2.4 Correction 4: Expert Annotation Methodology & Multi-Rater Statistics
- **Finding:** Indiscriminate use of Cohen's kappa for multi-rater panels.
- **Correction:** Replaced with appropriate multi-rater statistical formulations:
  - Fleiss' kappa ($\kappa_{Fleiss} \ge 0.75$) for categorical classifications.
  - Krippendorff's alpha ($\alpha_{Kripp} \ge 0.80$) for ordinal ratings and missing-data resilience.
  - Intraclass Correlation Coefficient ($\text{ICC}(2, k) \ge 0.75$) for continuous scores.
- Designed pre-evaluation pilot annotation study ($N=20$ artifacts, 3 raters) to calibrate rubrics before full execution.

### 2.5 Correction 5: Temporal Leakage Prevention in Retrospective Benchmarking
- **Finding:** Historical 2020–2022 literature trajectories risked data leakage if future citations or post-hoc papers entered scoring features.
- **Correction:** Implemented strict temporal freeze protocol ($t \le T_0$). When evaluating at $T_0$, OpenAlex queries and citation features strictly exclude all data published after $T_0$. Future trajectories are used exclusively as target labels.

### 2.6 Correction 6: Repository Model Adapter Verification
- **Finding:** Documentation ambiguity regarding `gemini-3-flash-preview` vs `gemini-2.5-flash`.
- **Correction:** Audited `src/lib/ai/modelAdapter.ts` and `server/researchGapExtractionService.ts` to document the exact multi-tier execution chain:
  1. Primary: `gemma-4-26b-a4b-it`
  2. Secondary: `gemma-4-31b-it`
  3. Default Fallback: `process.env.GEMINI_FALLBACK_MODEL || 'gemini-3-flash-preview'`
  4. Overload Cascade Candidate: `'gemini-2.5-flash'`
- Model attribution truthfulness is permanently enforced.

### 2.7 Correction 7: Data Model Decoupling & Conceptual Schema
- **Finding:** Single opportunity table forced researcher-specific feasibility into general opportunity records.
- **Correction:** Decoupled into `public.research_opportunities` (stores intrinsic $V_{scientific}$ and dimensions) and `public.researcher_opportunity_evaluations` (stores $E_{suitability}$ and $P_{actionable}$ per researcher profile).

### 2.8 Correction 8: In-Depth Audit of 11 Experimental Paradigms
- **Finding:** Need to ensure all 11 experimental paradigms specify exact hypotheses, variables, baselines, metrics, and falsification rules without forcing statistical null-hypotheses onto theoretical proofs or qualitative systems.
- **Correction:** Completed exhaustive formal specification table in `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md`.

---

## 3. Documented Open Architectural Decisions

1. **Decision 4E-1: Statistical Calibration Dataset Acquisition Strategy**
   - *Status:* OPEN.
   - *Options:* Retrospective Literature Back-Testing ($t \le T_0$) vs. Prospective 12-Member Expert Panel Adjudication during Phase 5.
   - *Recommendation:* Prospective Expert Panel (highest scientific validity).
2. **Decision 4E-2: Default Weighting Regime Selection**
   - *Status:* OPEN.
   - *Options:* Fixed Balanced Default ($0.30, 0.25, 0.30, 0.15$) with manual toggle vs. Automated inference based on declared researcher profile.
   - *Recommendation:* Automated inference with transparent manual override.
3. **Decision 4E-3: Automated Codebase Verification Depth**
   - *Status:* OPEN.
   - *Options:* HTTPS URL reachability and license regex checking vs. Full AST parsing of baseline Python/C++ repositories.
   - *Recommendation:* HTTPS + license checking for Stage 4E; AST parsing deferred to Phase 5 execution engine.

---

## 4. Exact Documentation Files Updated & Synchronized

All architecture documents have been updated in place and synchronized:

1. [docs/STAGE_4E_ARCHITECTURE.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_ARCHITECTURE.md) (Revision 1)
2. [docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md) (Revision 1)
3. [docs/STAGE_4E_HYPOTHESIS_METHODOLOGY.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_HYPOTHESIS_METHODOLOGY.md) (Revision 1)
4. [docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md) (Revision 1)
5. [docs/STAGE_4E_DATA_AND_API_DESIGN.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_DATA_AND_API_DESIGN.md) (Revision 1)
6. [docs/STAGE_4E_EVALUATION_FRAMEWORK.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_EVALUATION_FRAMEWORK.md) (Revision 1)
7. [docs/STAGE_4E_ACCEPTANCE_CRITERIA.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4E_ACCEPTANCE_CRITERIA.md) (Revision 1)
8. [docs/STAGE_4_IMPLEMENTATION_ROADMAP.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4_IMPLEMENTATION_ROADMAP.md) (Synchronized)
9. [BUILD_PLAN.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/BUILD_PLAN.md) & [docs/BUILD_PLAN.md](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/BUILD_PLAN.md) (Synchronized with 0 diff)

---

## 5. Final Architecture Verdict

```
================================================================================
STAGE 4E ARCHITECTURE VERDICT:
STAGE 4E ARCHITECTURE REVISION COMPLETE — READY FOR FINAL REVIEW
================================================================================
```

*Substantiation:* All scientific, mathematical, and structural issues identified in the initial draft have been rigorously corrected. Intrinsic scientific value is formally decoupled from researcher suitability; priority circularity is eliminated; all 6 evaluation metrics are specified across 10 architectural criteria; multi-rater annotation methodology is mathematically grounded in Fleiss' kappa and Krippendorff's alpha; temporal leakage prevention is established; model adapter configuration is repository-verified; and all 20 non-negotiable scientific invariants are preserved. Implementation remains strictly unstarted pending final user review.
