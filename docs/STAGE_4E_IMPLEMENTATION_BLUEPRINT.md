# Anvīkṣā — Stage 4E Comprehensive Implementation Blueprint
## Research Opportunity Intelligence, Falsifiable Hypothesis Generation & Experiment Protocol Design

**Document Version:** 4.1.0-STAGE4E-BLUEPRINT  
**Status:** FROZEN IMPLEMENTATION BLUEPRINT (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E  
**Baseline Architecture:** Stage 4E Architecture Accepted with Documented Non-Blocking Limitations  
**Amendments Ratified:** `docs/STAGE_4E_FINAL_SCIENTIFIC_INTEGRITY_AMENDMENT.md`  
**Date:** 2026-11-21  

---

# 1. Executive Summary & Blueprint Mission

This document establishes the definitive, repository-aware engineering implementation blueprint for Stage 4E of Anvīkṣā. 

Stage 4E builds directly on the accepted and verified capabilities of Stages 4A–4D.1:
- **Stage 4A:** Literature Knowledge Graph, Paper Chunking & Text Normalization Provenance (`public.research_papers`, `public.paper_chunks`).
- **Stage 4B:** Multi-Paper Discovery & Ingestion Pipeline (`openAlexService`, `multiPaperIngestionService`).
- **Stage 4C:** AI Limitation Extraction & Epistemic Classification (`researchGapExtractionService`).
- **Stage 4D & 4D.1:** Cross-Literature Validation, Methodological Comparability, Source Independence & Contradiction Detection (`crossLiteratureValidationService`, `methodologicalComparabilityEngine`, `sourceIndependenceService`, `contradictionDetectionService`, `provisionalValidationStrengthService`).

Stage 4E transforms cross-literature-validated research gaps into actionable, scientifically defensible research roadmaps:
1. **Subsystem A (4E-IMP-01): Research Opportunity Intelligence:** Converts validated gaps into prioritized research opportunities using intrinsic scientific scoring ($V_{scientific}$), completely decoupled from researcher resources, with discrete qualification indicators.
2. **Subsystem B (4E-IMP-02): Falsifiable Hypothesis Engine:** Synthesizes empirically refutable scientific hypotheses conforming to 6 accepted paradigms and the 27-field schema, audited via a 10-point deterministic falsifiability rubric.
3. **Subsystem C (4E-IMP-03): Experiment Protocol Synthesizer:** Designs executable, reproducible experimental protocols spanning 11 scientific paradigms with verified literature baselines ($BAR = 100\%$), explicit statistical power planning, and four-quadrant validity audits.
4. **Subsystem D (4E-IMP-04): Resource Suitability & Strategic Recommendations:** Evaluates lab-specific execution feasibility ($E_{suitability}$) based on discrete typed evidence records, mapping opportunities into the 2D Strategic Research Decision Matrix without scalar dimensional collapse.
5. **Subsystem E (4E-IMP-05): Evaluation & Scientific Review:** Formalizes multi-rater evaluation ($HFI, BAR, \tau_b, UCR, PCI, RUS$) using a $(v=12, b=220, r=55, k=3, \lambda=10)$ Balanced Incomplete Block Design (BIBD) with non-parametric bootstrap inference and triple-blinded arbitration.
6. **Subsystem F (4E-IMP-06): Integration & End-to-End Acceptance:** Orchestrates the complete pipeline from paper ingestion to researcher-approved execution plans with strict relational provenance, soft-invalidation staleness, and security-definer persistence.

> [!IMPORTANT]
> **STRICT EXECUTION BOUNDARY:**
> Implementation authorization is **strictly NOT granted**. This document defines the exact technical blueprint, interfaces, algorithms, and dependencies. No application code, test files, database migrations, or live Supabase mutations are authorized.

---

# 2. Repository Inspection Findings

A comprehensive inspection of the existing Anvīkṣā codebase was conducted across frontend, backend, AI adapters, Supabase infrastructure, and testing suites.

### 2.1 Backend Architecture & Service Inventory

The backend is located in `server/` and operates as an Express/Node.js service layer communicating with Supabase PostgreSQL via `@supabase/supabase-js` (service-role client) and Google Gemini/Gemma models via `@google/genai`:

| Service Name | Exact File Path | Existing Functionality & Role | Reusability in Stage 4E | Integration Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `openAlexService` | `server/openAlexService.ts` | OpenAlex API client, DOI resolution, citation graph fetching, author institution extraction. | **100% Reusable.** Provides baseline paper lookup and literature velocity tracking. | External OpenAlex REST API. |
| `fullTextService` | `server/fullTextService.ts` | PDF extraction, open-access full-text harvesting, section segmentation. | **100% Reusable.** Provides source chunk retrieval for verifying baseline numbers. | External PDF repositories / Unpaywall. |
| `evidenceAnalysisService` | `server/evidenceAnalysisService.ts` | Text chunking, sentence splitting, exact code-point offset indexing. | **100% Reusable.** Foundation for hypothesis evidence citation and baseline provenance. | `textProvenanceUtils.ts`. |
| `multiPaperIngestionService` | `server/multiPaperIngestionService.ts` | Coordinates multi-paper literature discovery, metadata ingestion, deduplication. | **100% Reusable.** Supplies corpus for cross-literature background in opportunity evaluation. | `openAlexService`, `fullTextService`. |
| `researchGapExtractionService`| `server/researchGapExtractionService.ts`| Stage 4C gap extraction, 12 categories, epistemic classification, whitespace mapping. | **100% Reusable.** Input provider: generates candidate gaps that enter Stage 4D validation. | `modelAdapter`, `supabase.ts`. |
| `methodologicalComparabilityEngine`| `server/methodologicalComparabilityEngine.ts` | Stage 4D comparability classifier across 5 epistemic dimensions. | **100% Reusable.** Used to assess baseline comparability across hardware and task domains. | `modelAdapter.ts`. |
| `sourceIndependenceService` | `server/sourceIndependenceService.ts` | Stage 4D.1 hardened institutional identity, author overlap, co-author graph distance. | **100% Reusable.** Validates whether cited baselines originate from truly independent labs. | OpenAlex author metadata. |
| `contradictionDetectionService`| `server/contradictionDetectionService.ts` | Stage 4D contradiction classifier and relationship builder. | **100% Reusable.** Crucial input for Subsystem A discrete contradiction qualification. | `methodologicalComparabilityEngine.ts`. |
| `crossLiteratureValidationService`| `server/crossLiteratureValidationService.ts`| Master Stage 4D orchestrator; produces validation runs and outcomes. | **100% Reusable.** Primary upstream trigger for Stage 4E opportunity synthesis. | All Stage 4D services. |
| `provisionalValidationStrengthService`| `server/provisionalValidationStrengthService.ts`| Retrospective consensus heuristic ($S_{val}$). | **Reference Only.** Immutable rule: $S_{val}$ must **never** be used as $V_{scientific}$. | `crossLiteratureValidationService.ts`. |
| `textProvenanceUtils` | `server/textProvenanceUtils.ts` | SHA-256 chunk hashing, UTF-8 code-point offsets, scholarly text normalization. | **100% Reusable.** Enforces exact offset verification for hypothesis rationales. | Pure utility. |
| `ssrfValidator` | `server/ssrfValidator.ts` | URL and IP validation preventing SSRF during external paper/repo fetching. | **100% Reusable.** Secures external baseline repository checking. | Pure utility. |

### 2.2 Frontend Architecture & Views

The frontend is built with React 18, TypeScript, TailwindCSS, and Lucide icons in `src/`:
- **Existing Relevant Components:**
  - `src/components/CrossLiteratureValidationPanel.tsx`: Displays Stage 4D validation runs, outcomes, and relationship matrices.
  - `src/components/ReviewAndExperimentModal.tsx`: Legacy prototype modal for experimental parameters; to be superseded by Stage 4E components.
  - `src/components/EndToEndLifecycleRunner.tsx`: Multi-stage verification runner executing full pipeline runs.
  - `src/views/ChallengesView.tsx`: Displays open research questions and limitations.
  - `src/views/ResearchGraphView.tsx`: Interactive graph visualizer for literature relationships.
- **Missing Frontend Capabilities for Stage 4E:**
  - Dedicated Opportunity Intelligence Dashboard with 2D Strategic Decision Matrix visualizer.
  - Falsifiable Hypothesis Review & Version History Inspector with 10-point rubric breakdown.
  - Experiment Protocol Synthesizer with 11 paradigm schemas, power calculator, and baseline verifier.
  - Researcher Resource Profile Editor with discrete evidence status badges (`VERIFIED_AVAILABLE`, `DECLARED_AVAILABLE`, etc.).

### 2.3 AI Model Execution & Adapter Truth

Model inference is centralized in `src/lib/ai/modelAdapter.ts`:
- **Primary Model:** `OFFICIAL_GEMMA4_26B = 'gemma-4-26b-a4b-it'` (Gemma 4 Mixture-of-Experts).
- **Secondary Model:** `OFFICIAL_GEMMA4_31B = 'gemma-4-31b-it'` (Gemma 4 Dense).
- **Configured Fallback:** `process.env.GEMINI_FALLBACK_MODEL || 'gemini-3-flash-preview'`.
- **Supported Cascade:** `'gemini-2.5-flash'`, `'gemini-2.5-pro'`, `'gemma-2-27b-it'`.
- **Truthful Attribution Guarantee:** Every inference call records `requestedModel`, `resolvedModel`, `isFallback`, and `fallbackReason`. AI output provenance in Stage 4E must record these exact fields in `generation_provenance` JSONB columns.

### 2.4 Existing Supabase Database Schema

Inspected `supabase/migrations/`:
- **Canonical Tables Implemented:**
  - `public.research_papers`: `id UUID PK`, `doi TEXT UNIQUE`, `openalex_id TEXT UNIQUE`, `title TEXT`, `authors TEXT[]`, `year INT`, `abstract TEXT`.
  - `public.paper_chunks`: `id UUID PK`, `paper_id UUID FK`, `chunk_hash TEXT`, `clean_text TEXT`, `start_char INT`, `end_char INT`.
  - `public.research_gaps`: `id UUID PK`, `paper_id UUID FK`, `category public.research_gap_category`, `epistemic_classification public.epistemic_classification`, `status TEXT`, `is_archived BOOLEAN`.
  - `public.research_gap_validations`: `id UUID PK`, `gap_id UUID FK`, `validation_run_id TEXT`, `validation_outcome TEXT`, `composite unique (gap_id, validation_run_id)`.
  - `public.research_gap_relationships`: `id UUID PK`, `gap_id UUID`, `validation_run_id TEXT`, composite FK `(gap_id, validation_run_id)`, explicit foreign keys `source_gap_id`, `source_paper_id`, `target_gap_id`, `target_paper_id`.
- **Security & RLS:** All tables have RLS enabled with strict policies (public read-only access for validated records; service-role write access via server RPCs).

### 2.5 Existing Test Infrastructure

Inspected `tests/`:
- **Test Runner:** Custom TypeScript execution scripts executed via `npx tsx tests/<test_file>.ts`.
- **Current Coverage:** 207 automated platform checks across 6 suites:
  - `tests/stage4a_database_security.ts` (28 checks)
  - `tests/stage4b_discovery_ingestion.ts` (37 checks)
  - `tests/stage4c_extraction_verification.ts` (40 checks)
  - `tests/stage4d_validation_verification.ts` (56 checks)
  - `tests/stage4d_1_adversarial_verification.ts` (44 checks)
  - `tests/run-gemma-acceptance-tests.ts` (2 checks)
- **Convention:** Tests use strict assert invariants, adversarial edge cases, mock payloads, and live database query checks where permitted. Stage 4E will follow this exact pattern.

---

# 3. Work Package 4E-IMP-01: Research Opportunity Intelligence

### 3.1 Objective & Scope
Transforms cross-literature validated research gaps into prioritized, actionable scientific research opportunities. Evaluates intrinsic scientific opportunity value ($V_{scientific}$) completely decoupled from researcher resources, ensuring high-value questions are preserved regardless of institutional wealth.

```
[Validated Gap (Stage 4D)]
          │
          ▼
┌───────────────────────────────────────┐
│ 1. Eligibility & Exclusion Filter    │ ──► Outcome in {CONFIRMED_UNRESOLVED, PARTIALLY_ADDRESSED}
└───────────────────────────────────────┘
          │ (Eligible)
          ▼
┌───────────────────────────────────────┐
│ 2. Residual Scope Extractor          │ ──► Deterministically isolates unresolved scope for PARTIAL
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 3. Four-Dimensional Intrinsic Value   │ ──► Confidence (w_c), Novelty (w_n), Significance (w_s),
│    Calculation (V_scientific)         │     Methodological Tractability (w_t)
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 4. Discrete Scientific Qualifications │ ──► Contradiction Status & Literature Density Classification
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 5. Trusted Server Persistence         │ ──► public.research_opportunities (ON DELETE RESTRICT)
└───────────────────────────────────────┘
```

### 3.2 Detailed Functional Specifications
1. **Gap Eligibility Filtering:**
   - Evaluates Stage 4D outcome:
     - `CONFIRMED_UNRESOLVED` $\implies$ Automatically eligible.
     - `PARTIALLY_ADDRESSED` $\implies$ Eligible **only if** residual scope is extracted.
     - `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE` $\implies$ Disqualified (`STATUS = INELIGIBLE`).
2. **Residual Scope Isolation:**
   - For `PARTIALLY_ADDRESSED` gaps, extracts the structured JSONB payload:
     - `resolved_components`: List of sub-problems resolved by existing literature.
     - `unresolved_scope`: Exact remaining unsolved challenge.
     - `active_tradeoffs`: Competing objectives identified in literature (e.g. latency vs accuracy).
3. **Four-Dimensional Intrinsic Value Formulation:**
   $$V_{scientific} = w_c S_{confidence} + w_n S_{novelty} + w_s S_{significance} + w_t S_{tractability\_methodological}$$
   - *Weights:* $w_c = 0.30, \; w_n = 0.25, \; w_s = 0.30, \; w_t = 0.15$ (Sum = $1.00$).
   - *Methodological Tractability ($S_{tractability\_methodological}$):* Measures whether the question is methodologically well-posed (metrics, baselines, and falsification rules definable in principle). Does **not** penalize computational expense or difficulty!
   - *Missing Data Semantics:* If metrics are undefined in literature, tagged `STATUS: METRIC_UNSPECIFIED`. No arbitrary numerical penalty applied.
4. **Discrete Scientific Qualification Indicators:**
   - *Contradiction Qualification:*
     - `NO_CONTRADICTIONS_DETECTED`: Fully supported.
     - `PREMISE_FALSIFIED`: Foundation contradicted $\implies$ Disqualification gate (`INELIGIBLE_FALSIFIED_PREMISE`).
     - `SCOPE_NARROWED`: Contradiction restricts operational domain $\implies$ Emits `QUALIFICATION: BOUNDARY_CONDITION_RESTRICTED` without reducing $V_{scientific}$.
     - `CONTRADICTION_STATUS_UNKNOWN`: Literature comparison unperformed $\implies$ Tagged neutral (zero penalty).
   - *Literature Density Status:*
     - `SPARSE_FRONTIER`: Pioneer area.
     - `ACTIVE_COMPETITIVE`: Ongoing competitive exploration.
     - `SATURATED_EXACT_REPETITION`: High volume of near-identical tweaks $\implies$ Continuous $S_{novelty}$ reflects distance from literature; emits `TOPIC_SATURATION_WARNING`.
     - `DIFFICULT_OPEN_DIRECTION`: High significance, low published success rate $\implies$ Breakthrough target.
5. **Sensitivity Reporting:**
   - Computes rank stability across 4 profiles (Balanced, Theory, Exploration, Rigor). Flags rank volatility if delta $> 10$ positions.
6. **Staleness Propagation:**
   - If upstream gap is re-validated in Stage 4D, marks dependent opportunity records `is_stale = true` with reason `UPSTREAM_VALIDATION_UPDATED`.

---

# 4. Work Package 4E-IMP-02: Falsifiable Hypothesis Engine

### 4.1 Objective & Scope
Synthesizes candidate scientific hypotheses addressing eligible research opportunities. Hypotheses are structured across 6 scientific paradigms, represented in a 27-field schema, and verified against a 10-point automated falsifiability rubric. Generated hypotheses are strictly labeled as unproven candidate proposals.

```
[Eligible Research Opportunity]
          │
          ▼
┌───────────────────────────────────────┐
│ 1. Paradigm Selection (1 of 6)        │ ──► Causal Empirical, Algorithmic Superiority, Ablation,
└───────────────────────────────────────┘     Scaling Law, Distributional Invariance, Formal Theorem
          │
          ▼
┌───────────────────────────────────────┐
│ 2. Schema Synthesis (27-Field Schema) │ ──► IVs, DVs, Controls, Boundary Conditions, Null & Alt
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 3. Deterministic Falsifiability Gates │ ──► Gates 1-5: Variable Isolation, Units, Directionality
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 4. AI-Assisted Evaluation (Rubric)    │ ──► Gates 6-10: Causal Plausibility, Novelty, Feasibility
└───────────────────────────────────────┘
          │ (Pass HFI >= 90%)
          ▼
┌───────────────────────────────────────┐
│ 5. Versioned Persistence & Review     │ ──► public.research_hypotheses & hypothesis_versions
└───────────────────────────────────────┘
```

### 4.2 The Six Accepted Hypothesis Paradigms
1. **Causal Empirical:** Asserts that intervention $X$ causes measurable change in outcome $Y$ under control conditions $Z$.
2. **Algorithmic Superiority:** Asserts that algorithm $A$ outperforms baseline $B$ on metric $M$ by at least margin $\delta$ on task $T$.
3. **Component Necessity (Ablation):** Asserts that module $C$ is necessary for capability $K$ (removing $C$ drops performance by $\ge \Delta$).
4. **Asymptotic Scaling Law:** Asserts power-law relationship $L(N) \propto N^{-\alpha}$ holds across compute/data horizon $[N_{min}, N_{max}]$.
5. **Distributional Invariance:** Asserts that metric $M$ remains invariant under distribution shift $P(X) \neq Q(X)$ within tolerance $\epsilon$.
6. **Formal Mathematical Invariant:** Conjectures an exact mathematical property or bound verifiable via deductive proof.

### 4.3 The 10-Point Automated Falsifiability Rubric
| Gate # | Gate Name | Evaluation Mechanism | Failure Condition & Action |
| :-: | :--- | :--- | :--- |
| **G1** | **Variable Isolation** | Deterministic Regex & AST | IV, DV, and Control sets are empty or unparseable $\implies$ `REJECT`. |
| **G2** | **Unit & Metric Grounding** | Dimensional Catalog Match | Dependent variable lacks explicit physical/mathematical units $\implies$ `REJECT`. |
| **G3** | **Directional Quantifiability** | Deterministic Inequality Parser | Falsification condition lacks measurable operator ($<, >, \le, \ge, \neq$) $\implies$ `REJECT`. |
| **G4** | **Boundary Condition Specification** | Schema Completeness | Operating assumptions (context length, hardware, precision) missing $\implies$ `REJECT`. |
| **G5** | **Null / Alternative Disjunction** | Logical Inversion Check | $H_0$ and $H_1$ are not mutually exclusive and exhaustive $\implies$ `REJECT`. |
| **G6** | **Tautology Suppression** | Semantic Redundancy Embeddings | Statement is true by definition or mathematically trivial $\implies$ `REJECT`. |
| **G7** | **Physical & Domain Law Compliance**| Knowledge Graph Violation Check | Violates information theory, conservation laws, or domain axioms $\implies$ `REJECT`. |
| **G8** | **Literature Evidence Grounding** | Chunk Offset Verifier | Mechanistic rationale lacks supporting citation in `paper_chunks` $\implies$ Flag `UCR`. |
| **G9** | **Refutable Effect Size** | Literature Context Range Check | Claimed effect is smaller than baseline standard deviation $\implies$ `REVISE`. |
| **G10**| **Discriminative Baseline Linkage** | Canonical Baseline Matcher | Falsification does not contrast against state-of-the-art baseline $\implies$ `REVISE`. |

- **Scoring:** Hypothesis Falsifiability Index ($HFI$) requires passing all 10 gates. Target: $\mathbf{\ge 90.0\%}$.

---

# 5. Work Package 4E-IMP-03: Experiment Protocol Synthesizer

### 5.1 Objective & Scope
Translates falsifiable hypotheses into complete, reproducible, executable experimental protocols. Covers all 11 accepted scientific paradigms, verifies literature baselines ($BAR = 100\%$), plans statistical power, and audits threats to validity. Generates experimental designs only; **zero fabricated measurements or experimental outcomes**.

```
[Falsifiable Hypothesis]
          │
          ▼
┌───────────────────────────────────────┐
│ 1. Paradigm Mapping (1 of 11)         │ ──► RCT, Benchmark, Ablation, Scaling, Simulation,
└───────────────────────────────────────┘     Formal Proof, Bias Audit, Adversarial, Replication, etc.
          │
          ▼
┌───────────────────────────────────────┐
│ 2. Verified Baseline Harvester        │ ──► Matches OpenAlex/DOI & extracts published table figures
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 3. Execution Environment Specification│ ──► Compute architecture, VRAM, dependencies, wall-clock
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 4. Statistical Power & Seed Schedule  │ ──► Sample size for (1-beta >= 0.80, alpha <= 0.05)
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 5. Four-Quadrant Validity Audit       │ ──► Internal, External, Construct, Conclusion Threats
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ 6. Protocol Persistence & Review      │ ──► public.research_experiments (STATUS: GENERATED)
└───────────────────────────────────────┘
```

### 5.2 Implementation across 11 Experimental Paradigms
Each protocol implements a paradigm-specific sub-schema:
1. **Randomized Controlled Trial (RCT):** Randomization seed schedule, blinding procedure, primary endpoint effect size, ethical/IRB disclosure.
2. **Paired Comparative Benchmark:** Paired t-test / Wilcoxon signed-rank power plan, hardware thermal throttle controls, compiler flags.
3. **Systematic Component Ablation:** Combinatorial ablation matrix ($2^k$), frozen seed controls, degradation delta thresholds.
4. **Scaling & Complexity Analysis:** Horizon bounds ($N \in [10^3, 10^7]$), log-log linear regression fit criteria ($R^2 \ge 0.95$), peak memory profiling.
5. **Stochastic Simulation:** Monte Carlo seed schedule ($N \ge 1,000$), distribution divergence metrics (Wasserstein distance $W_1$, KL), convergence criteria.
6. **Formal Proof & Counter-Example:** Formal specification in Lean 4 / Isabelle syntax, proof obligations, axiom declarations.
7. **Dataset Bias & Distribution Audit:** Stratified demographic/domain slices, intersectional fairness metrics (Demographic Parity, Equalized Odds).
8. **Adversarial Robustness Stress-Test:** Perturbation budget ($\ell_\infty \le 8/255$), white-box/black-box attack schedules, robust accuracy bounds.
9. **Empirical Replication Study:** Dockerfile / container image specification, exact hyperparameter grid from original publication, replication delta tolerance.
10. **Qualitative Systems Architecture:** Chaos engineering fault injection schedule (packet loss, node kill, partition), tail latency SLA (p99).
11. **Parameter-Efficiency Adaptation:** Rank schedules ($r \in \{4, 8, 16, 64\}$), quantization bit-width, trainable parameter percentage delta.

### 5.3 Baseline Authenticity & Zero Hallucination Controls
- **Baseline Authenticity Rate ($BAR = 100\%$):**
  - Cites only papers verified in `public.research_papers` with valid DOI.
  - Baseline metric values must match exact numbers extracted from paper chunks.
  - If a metric was not reported by original authors, the system explicitly marks: `UNREPORTED_IN_ORIGINAL_PUBLICATION (Must be empirically measured during experiment execution)`. Never fabricates numbers!
- **Handling Uncalibrated Thresholds:**
  - If a falsification threshold cannot be algorithmically deduced from literature, labeled: `REQUIRES_RESEARCHER_SPECIFICATION`.

---

# 6. Work Package 4E-IMP-04: Resource Suitability & Strategic Recommendations

### 6.1 Objective & Scope
Evaluates whether a specific researcher, lab, or organization can execute a proposed experiment, without conflating feasibility with intrinsic scientific value. Manages researcher resource profiles using discrete typed evidence states and maps opportunities into the 2D Strategic Research Decision Matrix.

### 6.2 Discrete Resource Evidence State Architecture
Eliminates all arbitrary numerical discount multipliers. Represents each resource claim as a typed evidence record:

```typescript
export type ResourceEvidenceStatus = 
  | 'VERIFIED_AVAILABLE'     // Confirmed via cloud API or institutional SSO
  | 'DECLARED_AVAILABLE'     // Researcher self-declared capacity
  | 'VERIFIED_UNAVAILABLE'   // Verified hardware absence or access denied
  | 'UNKNOWN'                // Incomplete or unentered profile data
  | 'EXPIRED_EVIDENCE';      // Token or credential exceeded TTL

export interface ResourceClaimRecord {
  resourceType: 'GPU_COMPUTE' | 'DATASET_ACCESS' | 'FACILITY_LAB' | 'FINANCIAL_BUDGET';
  requiredSpecification: string;
  claimedAvailability: number | string | boolean;
  evidenceSource: 'CLOUD_PROVIDER_API' | 'INSTITUTIONAL_SSO' | 'USER_SELF_DECLARATION' | 'NONE';
  verificationStatus: ResourceEvidenceStatus;
  verificationTimestamp: string;
  evidenceFreshnessTtlDays: number;
  confidenceOrUncertainty: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  researcherOverrideFlag: boolean;
  overrideRationale?: string;
}
```

### 6.3 Suitability Formulation & Missing-Data Invariant
$$E_{raw} = \alpha_{comp} E_{compute} + \alpha_{data} E_{data} + \alpha_{fac} E_{facility} + \alpha_{bud} E_{budget}$$
- *Weights:* $\alpha_{comp} = 0.40, \; \alpha_{data} = 0.30, \; \alpha_{fac} = 0.15, \; \alpha_{bud} = 0.15$.
- **Hard Exclusion Gate (`RESOURCE_BLOCKED`):** If any required resource is `VERIFIED_UNAVAILABLE`, $E_{suitability} = 0.00$.
- **Missing Data Rule (`SUITABILITY_UNDETERMINED`):** If a resource is `UNKNOWN` or `EXPIRED_EVIDENCE`, the system emits $E_{suitability} = \text{null}$. Missing evidence **never** implies unavailability!

### 6.4 The 2D Strategic Research Decision Matrix
Discrete categorical mapping preserves the two independent vectors:
$$\text{StrategicQuadrant}(V_{scientific}, E_{suitability}) = \begin{cases}
\text{SUITABILITY\_UNDETERMINED} & \text{if } E_{suitability} \text{ is null} \\
\text{IMMEDIATE\_HIGH\_PRIORITY} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} \ge 6.0 \\
\text{GRANT\_OR\_COLLABORATION\_TARGET} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} < 6.0 \\
\text{FEASIBLE\_RESEARCH\_OPPORTUNITY} & \text{if } V_{scientific} < 6.0 \land E_{suitability} \ge 6.0 \\
\text{DEPRIORITIZED} & \text{if } V_{scientific} < 6.0 \land E_{suitability} < 6.0
\end{cases}$$

---

# 7. Work Package 4E-IMP-05: Evaluation and Scientific Review

### 7.1 Objective & Scope
Establishes the empirical validation and multi-rater annotation methodology for Stage 4E artifacts. Deploys non-parametric statistical inference, Balanced Incomplete Block Design (BIBD) rater allocation, strict double-blinding, and formal arbitration.

### 7.2 Six Benchmark Evaluation Metrics
1. **Hypothesis Falsifiability Index ($HFI \ge 90.0\%$):** Proportion of synthesized hypotheses passing all 10 falsifiability gates. Evaluated via Wilson score binomial interval.
2. **Baseline Authenticity Rate ($BAR = 100.0\%$):** Proportion of cited baselines with verified DOI and exact published performance figures. Zero tolerance for hallucinations (Clopper-Pearson exact interval).
3. **Ranking Concordance ($\tau_b \ge 0.70$):** Tie-corrected Kendall's rank correlation between algorithmic $V_{scientific}$ and human expert median rankings. Evaluated via Non-Parametric Paired Stratified Bootstrap ($B = 2,000$, BCa 95% CI) and exact permutation testing ($B = 10,000$).
4. **Unsupported Claim Rate ($UCR \le 5.0\%$):** Proportion of ungrounded causal assertions in rationales. Evaluated via **Cluster-Aware Block Bootstrap** ($G = 100$ gap clusters) to account for intra-hypothesis correlation.
5. **Protocol Completeness Index ($PCI \ge 8.5/10.0$):** Weighted operational completeness score. Evaluated via **Bounded Non-Parametric BCa Bootstrap directly on $[0.0, 10.0]$**, with Bayesian Beta Squeezing ($p^* = \frac{p(N-1)+0.5}{N}$, Smithson & Verkuilen 2006) as principled parametric alternative for endpoint handling.
6. **Researcher Utility Score ($RUS \ge 4.2/5.0$):** External researcher willingness-to-adopt score on 5-point Likert scale. Evaluated via Linear Mixed-Effects Model with rater random effects.

### 7.3 Multi-Rater BIBD Allocation Schedule
- **Design Parameters:** $(v=12, \; b=220, \; r=55, \; k=3, \; \lambda=10)$.
  - $v=12$ Ph.D. raters (4 ML Systems, 4 Computational Biology, 4 NLP).
  - $b=220$ evaluation artifact blocks.
  - $r=55$ reviews per rater.
  - $k=3$ independent raters per artifact.
  - $\lambda=10$ shared artifacts per rater pair.
- **Conflict of Interest (COI) Permutation:** Pre-assignment filtering removes raters with co-authorships or institutional ties within 48 months; swaps with unconflicted domain peer preserving $\lambda$.
- **Adjudication:** Score delta $> 1.5$ on 5-point scale or split falsifiability vote ($2-1$) triggers review by Senior Scientific Arbitrator with binding written rationale logged in `public.researcher_reviews`.

---

# 8. Work Package 4E-IMP-06: Integration and Acceptance

### 8.1 Objective & Scope
Connects all Stage 4E subsystems into an automated, idempotent, transactional end-to-end pipeline and validates the complete scientific lifecycle.

### 8.2 End-to-End Scientific Lifecycle Architecture
```
[Research Paper Ingestion (4A-4B)]
                │
                ▼
[Research Gap Extraction & Classification (4C)]
                │
                ▼
[Cross-Literature Validation & Contradiction Detection (4D-4D.1)]
                │
                ▼ (Outcome: CONFIRMED_UNRESOLVED / PARTIALLY_ADDRESSED)
[Research Opportunity Intelligence (4E-IMP-01)] ──► V_scientific, Discrete Qualifications
                │
                ▼
[Falsifiable Hypothesis Synthesis (4E-IMP-02)]   ──► 10-Point Rubric Verification (HFI >= 90%)
                │
                ▼
[Experiment Protocol Design (4E-IMP-03)]         ──► Verified Baselines (BAR = 100%), Power Plan
                │
                ▼
[Researcher Resource Matching (4E-IMP-04)]       ──► 2D Strategic Quadrant (V, E)
                │
                ▼
[Human Researcher Review & Approval]             ──► Explicit Audit Event in public.researcher_reviews
                │
                ▼
[Approved Research Plan Artifact]               ──► Ready for Execution (Execution outside 4E)
```

### 8.3 Invalidation & Staleness Propagation
- **Event:** A new paper is ingested and validated in Stage 4D, altering the validation outcome of Gap $G_1$ from `CONFIRMED_UNRESOLVED` to `CONTRADICTED`.
- **Cascade Reaction:**
  1. Server trigger identifies all active opportunities referencing $(G_1, \text{run\_id})$.
  2. Updates `public.research_opportunities.is_stale = true` with reason `UPSTREAM_GAP_CONTRADICTED`.
  3. Updates all child hypotheses and experiment protocols: `is_stale = true`.
  4. Blocks any pending approval actions on stale artifacts with error `CANNOT_APPROVE_STALE_ARTIFACT`.
  5. Preserves historical records immutably for scientific audit.

---

# 9. Implementation Boundary Confirmation

The blueprint execution affirms:
- **No code changes** have been made to `server/`, `src/`, or `tests/`.
- **No database migrations** or Supabase mutations have been performed.
- **Accepted Milestones (4A–4D.1)** remain 100% intact and passing.
- **Stage 4F** components remain completely excluded.

```
═══════════════════════════════════════════════════════════════════════════════
  STAGE 4E IMPLEMENTATION BLUEPRINT: RATIFIED & FROZEN
  AWAITING EXPLICIT USER IMPLEMENTATION AUTHORIZATION
═══════════════════════════════════════════════════════════════════════════════
```
