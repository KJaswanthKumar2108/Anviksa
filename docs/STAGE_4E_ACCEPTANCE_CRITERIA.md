# Anvīkṣā — Stage 4E Acceptance Criteria & Quality Gates
## Twenty Non-Negotiable Scientific Invariants, Quality Gates & Stage 4E Definition of Done
### Revision 1: Decoupled Scoring, Multi-Rater Reliability & Temporal Leakage Guards

**Document Version:** 4.1.0-STAGE4E-CRITERIA-REV1  
**Status:** REVISED ACCEPTANCE GATES SPECIFICATION ONLY (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E  
**Baseline:** Version 4.1.0-REVISED (Stage 4E Revision 1)  
**Date:** 2026-11-20  

---

## 1. The Twenty Non-Negotiable Scientific Invariants

Any implementation of Stage 4E that violates any of the following 20 invariants will be rejected immediately with zero tolerance:

1. **The Ineligible Candidate Invariant:** A candidate research gap extracted from a single paper (`CANDIDATE_RESEARCH_GAP`) is not automatically an eligible research opportunity. It must be corroborated and validated by Stage 4D cross-literature validation before ranking.
2. **The Addressed Resolution Invariant:** A research gap conclusively classified as `ADDRESSED` in Stage 4D cannot be ranked as an active, unresolved research opportunity.
3. **The Residual Scope Isolation Invariant:** A gap classified as `PARTIALLY_ADDRESSED` is eligible for opportunity ranking **only if** its remaining unresolved component and active trade-offs are explicitly and deterministically isolated.
4. **The Score Orthogonality Invariant:** Stage 4D provisional validation strength ($S_{val}$) is an uncalibrated retrospective consensus heuristic. It must never be used or interpreted as Stage 4E prospective research opportunity priority ($P_{actionable}$).
5. **The Value-Suitability Decoupling Invariant:** Intrinsic scientific opportunity value ($V_{scientific}$) and researcher execution suitability ($E_{suitability}$) must be separately represented, calculated, stored, and explained. Researcher resource constraints must **never** degrade the intrinsic scientific importance of an opportunity.
6. **The Priority Non-Circularity Invariant:** Actionable priority ($P_{actionable}$) is strictly a decision output combining scientific value and execution suitability. It must never be included as an independent input dimension.
7. **The Significance-Citation Separation Invariant:** Citation count must never serve as a proxy for scientific significance. Significance is grounded in downstream enablement, system criticality, and theoretical foundationalness.
8. **The Negative Novelty Invariant:** Scientific novelty cannot be established merely through the absence of a search token in a finite retrieved corpus. It requires analysis of literature velocity, related baselines, and domain saturation.
9. **The Falsifiability Invariant:** Every generated hypothesis must define concrete conditions under which it is disproven, or be explicitly returned with status `REQUIRES_REFINEMENT`.
10. **The Bilateral Evidence Traceability Invariant:** Every hypothesis and protocol must maintain an auditable, immutable link to its parent research gap, validation run identifier, and verified source chunks with exact code-point offsets.
11. **The Zero-Fabricated-Baselines Invariant ($BAR = 100\%$):** No experiment protocol may contain fabricated baseline numbers, synthetic measurements, or phantom paper citations. Unreported baseline performance must be explicitly marked as requiring measurement during trial execution.
12. **The Non-Invented Threshold Invariant:** No quantitative threshold may be fabricated merely to make a protocol template appear complete. Thresholds requiring human calibration must be labeled `REQUIRES_RESEARCHER_SPECIFICATION`. Missing measurements must be labeled `NOT_OPERATIONALIZED`.
13. **The Mandatory Human Review Invariant:** AI-generated hypotheses and experimental designs remain unapproved proposals until an authorized researcher executes an explicit approval action.
14. **The Approval vs Execution Separation Invariant:** `RESEARCHER_APPROVED` denotes human verification of protocol design; it does not mean an experiment has been executed.
15. **The Non-Fabricated Results Invariant:** A proposed experiment must never be presented as completed, and its outcome must never be presumed prior to actual physical/computational execution.
16. **The Temporal Leakage Prevention Invariant:** In retrospective evaluations ($T_0$), all future citations, papers, and outcomes published after $T_0$ are strictly prohibited from entering input discovery or scoring features.
17. **The Epistemic Staleness Invariant:** When Stage 4D evidence updates or a gap outcome changes, all dependent opportunities, hypotheses, and protocols must be marked as `is_stale = true`.
18. **The Immutable Provenance Invariant:** Historical scientific artifacts and researcher revisions must remain permanently immutable and auditable in version tables.
19. **The Trusted Server Persistence Invariant:** All Stage 4E state transitions and artifact records must be persisted exclusively via server-verified RPCs with service-role security.
20. **The Stage 4F Exclusion Invariant:** The Stage 4F interactive workbench, UI canvases, and challenge conversion components must remain completely unimplemented during Stage 4E.

---

## 2. Nine Explicit Stage 4E Acceptance Gates

The future implementation of Stage 4E will be evaluated against nine formal acceptance gates:

### Gate 4E.1: Decoupled Opportunity Scoring & Non-Compensatory Gates
- [ ] Eligibility gate rejects gaps with outcomes `ADDRESSED`, `CONTRADICTED`, and `INSUFFICIENT_EVIDENCE`.
- [ ] Gaps with outcome `PARTIALLY_ADDRESSED` enter ranking only with an explicit `residual_unresolved_scope` payload.
- [ ] Decoupled scores calculate Intrinsic Scientific Value ($V_{scientific}$) and Researcher Suitability ($E_{suitability}$) independently in range $[0.0, 10.0]$.
- [ ] Priority circularity is eliminated: $P_{actionable}$ is an output combining $V_{scientific}$ and $E_{suitability}$ across the 2D Decision Matrix.
- [ ] Active contradictions cap $S_{confidence}$ at $\le 3.0$ and trigger non-compensatory gate penalties.
- [ ] Four distinct weighting regimes (Balanced, Theory, Exploration, Rigor) are supported with sensitivity reporting.

### Gate 4E.2: Falsifiable Hypothesis Schema & 10-Point Rubric
- [ ] Synthesized hypotheses conform strictly to the 27-field schema with operational independent, dependent, and control variables.
- [ ] The 10-point automated falsifiability rubric executes with deterministic verification preceding AI audit.
- [ ] Tautological hypotheses or statements without failure conditions are rejected with status `REQUIRES_REFINEMENT`.
- [ ] Methodological diversity supports empirical, comparative, theoretical, computational, qualitative, and ablation paradigms without forcing irrelevant statistical formalisms.

### Gate 4E.3: Verified Literature Baselines ($BAR = 100\%$) & Zero Hallucinations
- [ ] Every baseline references an existing record in `public.research_papers` with authentic DOI or OpenAlex ID.
- [ ] Baselines verify exact reported numbers against source chunk tables. Zero fabricated metrics permitted ($BAR = 100\%$).
- [ ] Open-source codebases and licenses (MIT, Apache 2.0, GPL) are verified; private/gated baselines are flagged.

### Gate 4E.4: Protocol Reproducibility across 11 Paradigms
- [ ] Protocols across all 11 experimental paradigms specify required inputs, variables, baselines, and falsification rules.
- [ ] Synthesized experiment protocols include hardware requirements, VRAM bounds, software dependencies, and estimated wall-clock hours.
- [ ] Metrics include units, operational definitions, measurement instruments, and directions of improvement.
- [ ] Explicit falsification decision criteria define quantitative conditions under which the hypothesis is rejected.
- [ ] Uncalibrated thresholds are truthfully labeled `REQUIRES_RESEARCHER_SPECIFICATION`. Missing measurements are labeled `NOT_OPERATIONALIZED`.

### Gate 4E.5: Multi-Rater Evaluation Methodology & Pilot Calibration
- [ ] Evaluation protocol uses Fleiss' kappa ($\kappa_{Fleiss} \ge 0.75$) for categorical ratings, Krippendorff's alpha ($\alpha_{Kripp} \ge 0.80$) for ordinal/missing ratings, and $\text{ICC}(2, k) \ge 0.75$ for continuous ratings.
- [ ] Pre-evaluation pilot study on $N=20$ artifacts verifies rater calibration before launching full benchmark.
- [ ] Disagreements exceeding $1.5$ delta on 5-point scale escalate to senior scientific arbitration.

### Gate 4E.6: Temporal Leakage-Free Back-Testing ($t \le T_0$)
- [ ] Historical validation runs freeze literature at $T_0$, strictly blocking post-$T_0$ citations and papers from input discovery.
- [ ] Historical prediction performance, expert panel ratings, subsequent citation velocity, and actual experimental impact are recorded as separate ground-truth concepts.

### Gate 4E.7: Human Review, Approval & Audit Lifecycle
- [ ] Researchers can inspect, edit, approve, or reject hypotheses and protocols via authenticated endpoints.
- [ ] Every modification creates an immutable entry in `public.research_hypothesis_versions` or `public.research_experiment_versions`.
- [ ] AI-generated artifacts cannot transition to `RESEARCHER_APPROVED` without an explicit human review event.
- [ ] All approval events record reviewer ID, decision, rationale, and parameter diffs in `public.researcher_reviews`.

### Gate 4E.8: Invalidation, Staleness & Epistemic Evolution
- [ ] When a new Stage 4D validation run occurs, existing opportunities, hypotheses, and protocols are marked `is_stale = true`.
- [ ] Stale artifacts are visually and programmatically barred from transitioning to `RESEARCHER_APPROVED` without re-evaluation.
- [ ] Re-evaluation against updated evidence refreshes the opportunity scores and preserves historical revisions.

### Gate 4E.9: Server-Role Security, RLS & Advisory Concurrency
- [ ] Direct anonymous and authenticated client SQL inserts to Stage 4E tables are blocked by PostgreSQL RLS.
- [ ] Persistence is executed exclusively through server-side trusted RPCs with `service_role` checks.
- [ ] Transaction-level advisory locks prevent concurrent duplicate generation requests for the same opportunity.

---

## 3. Definition of Done for Stage 4E

Stage 4E will be considered complete and ready for acceptance only when:
1. All nine acceptance gates (4E.1 through 4E.9) have passed verification.
2. The double-blind expert annotation protocol demonstrates $HFI \ge 90\%$, $BAR = 100\%$, and $\tau_{rank} \ge 0.70$ on the curated benchmark dataset.
3. Zero regressions occur across all previously accepted Stage 4A, 4B, 4C, 4D, and 4D.1 test suites.
4. Clean TypeScript typecheck (`tsc --noEmit`) and clean Vite client production build (`npm run build`).
5. Stage 4F remains strictly unimplemented.
