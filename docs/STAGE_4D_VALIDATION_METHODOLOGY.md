# Anvīkṣā — Stage 4D Validation Methodology (Revised)
## Comparison-Specific Compatibility Gates, Strict Independent-Replication Semantics, Refined Class Routing & Non-Tautological Outcome Definitions
### Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)

**Document Version:** 4.1.0-STAGE4D-METH-FINAL  
**Status:** ARCHITECTURE FROZEN — IMPLEMENTATION STRICTLY PROHIBITED  
**Milestone:** Stage 4D — Cross-Literature Validation & Contradiction Detection  
**Author:** Principal Supabase PostgreSQL Architect & AI Systems Safety Engineer  
**Date:** 2026-11-18  

---

## 1. Epistemological Foundations & Scientific Principles

Scientific validation in literature intelligence requires operationalizing **Popperian falsification**, **epistemic fallibilism**, and **methodological commensurability** (Popper, 1959; Kuhn, 1962).

A candidate research gap represents an empirical or theoretical proposition. Testing it across independent literature requires navigating four core epistemological challenges:
1. **The Fallacy of Asymmetric Closure:** Authors frequently claim to have "solved", "eliminated", or "surpassed" a fundamental limitation. Automated systems that accept abstract claims without verifying experimental scope inevitably generate false closures.
2. **The Incommensurability Problem:** Two studies reporting divergent empirical results (e.g. accuracy, latency, memory consumption) cannot be compared as a "contradiction" if they test different hypotheses, evaluate on non-overlapping data distributions, or use non-equivalent mathematical metrics.
3. **Citation Echo Chambers & Correlated Noise:** Corroboration from papers sharing co-authors, laboratories, or pre-packaged benchmark splits does not represent independent empirical confirmation.
4. **The Negative Proof Fallacy ("Absence of Evidence is Not Evidence of Absence"):** The absence of discovered counter-evidence in a retrieved corpus must **never** be presented as mathematical proof that no counter-evidence exists. Publication age is contextual evidence, not an epistemic proof of resolution.

---

## 2. Five-Valued Methodological Data Semantics & Nuanced Class Routing

### 2.1 Refined Comparability Data Taxonomy
Earlier specifications risked conflating missing experimental information with demonstrated empirical incompatibility, or treating every setup difference as total incommensurability. Stage 4D establishes a **Five-Valued Semantics** for all comparability dimensions:

| Status Value | Formal Epistemic Definition | Impact on Class 1 (Direct Empirical) | Impact on Class 2 / Class 3 (Related / Contextual) |
| :--- | :--- | :--- | :--- |
| **`VERIFIED_COMPATIBLE`** | Bilateral textual evidence confirms identical or operationally aligned parameters, metrics, or domains. | Satisfies gate / earns full dimension weight ($1.0$). | Contributes full corroboration weight. |
| **`INCOMPATIBLE`** | Bilateral evidence confirms conflicting or divergent setups. | **Fails Class 1 Gate.** Study cannot assert direct empirical contradiction. Downgrades to Class 2 or Class 3 if addressing related questions; routed to Class 4 only if genuinely disjoint. | Evaluated within bounded scope (e.g. scope boundary edge or theoretical baseline). |
| **`NOT_REPORTED`** | The authors omitted the specific parameter, hardware configuration, or metric nuance from the published paper text. | **Blocks Class 1** if in critical gates (Task, Question, Metric, Dataset). Downgraded to Class 2/3. **NOT equated with incompatibility.** | Evaluated with conservative score ($0.0$), depressing $R_{meth}$ due to uncertainty without asserting negative findings. |
| **`UNKNOWN`** | External metadata or affiliations cannot be extracted or resolved via scholarly APIs (e.g. OpenAlex missing affiliation data). | Cannot satisfy independent replication criteria. Assigned `INDEPENDENCE_UNKNOWN` ($w = 0.3$). | Tolerated with uncertainty discount. |
| **`NOT_APPLICABLE`** | The dimension is structurally irrelevant to the scientific paradigm (e.g. sequence length $N$ for a non-sequential graph model, or GPU SRAM tiling for pure CPU algorithms). | Dimension is **excluded from the denominator** in scoring rather than penalized as a failure. | Excluded from denominator in dimensional scoring. |

### 2.2 Nuanced Comparability-Class Routing Rules
A failed Class 1 critical gate does **not** automatically dump evidence into Class 4. Routing is guided by scientific relevance:

```
                            Candidate Paper Comparison
                                        │
                                        ▼
             ┌─────────────────────────────────────────────────────┐
             │       Tier 1: Critical Compatibility Assessment     │
             ├─────────────────────────────────────────────────────┤
             │  • Gate 1: Research Task & Objective                │
             │  • Gate 2: Operational Research Question            │
             │  • Gate 3: Metric Formulation Mathematical Identity │
             │  • Gate 4: Dataset Modality & Distributional Domain │
             └─────────────────────────────────────────────────────┘
                                        │
                         All 4 Critical Gates Passed?
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
                   [YES]                                 [NO]
                     │                                     │
                     ▼                                     ▼
       ┌───────────────────────────┐         Is Task/Question Aligned,
       │          Class 1          │         or Theoretical Context?
       │     Direct Empirical      │                       │
       │        Comparison         │         ┌─────────────┴─────────────┐
       └───────────────────────────┘         ▼                           ▼
                                           [YES]                       [NO]
                                             │                           │
                               ┌─────────────┴─────────────┐             ▼
                               ▼                           ▼    ┌─────────────────┐
                      ┌─────────────────┐ ┌─────────────────┐   │     Class 4     │
                      │     Class 2     │ │     Class 3     │   │ Incommensurable │
                      │ Related Research│ │   Contextual /  │   │     Context     │
                      │    Questions    │ │   Theoretical   │   │(Genuinely       │
                      │(Metric/dataset  │ │(Complexity,     │   │ disjoint tasks/ │
                      │ variance; trend │ │ historical base,│   │ paradigms;      │
                      │ support only)   │ │ scope bounds)   │   │ negative audit) │
                      └─────────────────┘ └─────────────────┘   └─────────────────┘
```

1. **Class 1 (Directly Comparable Empirical Evidence):**
   - Requires `VERIFIED_COMPATIBLE` across Task, Operational Question, Metric Formulation, and Dataset Domain.
   - Eligible for direct empirical contradiction, corroboration, or gap resolution.
2. **Class 2 (Related Research Questions with Partial Comparability):**
   - Applies when the paper investigates the same operational research question or task, but exhibits metric formulation variance (e.g. BLEU vs ROUGE) or domain variance (e.g. news text vs biomedical text).
   - Provides directional trend corroboration; **cannot** substantiate direct empirical refutation.
3. **Class 3 (Contextual, Theoretical, or Scope Evidence):**
   - Applies to theoretical proofs, asymptotic complexity bounds, historical baseline architectures, or application scope boundaries.
   - Retained in graph with `'extends'`, `'tests'`, or `'supersedes'` edges.
4. **Class 4 (Incommensurable Context):**
   - **Strictly reserved for genuinely disjoint tasks, orthogonal paradigms, or literature that cannot meaningfully inform the candidate gap.**
   - Retained with `'incommensurable_context'` relationship edge for an explicit, transparent negative audit trail.

---

## 3. Operational Research Question Alignment (No Verbatim Requirement)

Stage 4D does **NOT** require verbatim textual identity between research hypotheses. Instead, it enforces **Operational Research Question Alignment**, defined by four mandatory invariants:
1. **Equivalence of the Dependent Phenomenon:** Both works investigate the same operational failure mode, physical constraint, or performance bottleneck (e.g. sequence-length memory consumption during attention computation).
2. **Equivalence of the Independent Variable:** Both works manipulate or measure the same operational parameter (e.g. sequence length $N$ or batch size $B$).
3. **Equivalence of Directional Hypothesis:** Both works evaluate the same functional relationship (e.g. memory grows quadratically with sequence length).
4. **Verifiable Bilateral Textual Grounding:** Operational alignment must be grounded in bilateral extracted verbatim quotations from both papers, mapped to explicit conceptual tokens in the validation payload.

---

## 4. Strict Independent-Replication Semantics

### 4.1 What Constitutes an Independent Replication
To qualify as an **Independent Replication** (`INDEPENDENT`), a study must satisfy **all four** structural criteria:
1. **Disjoint Author Network:** Author Jaccard similarity $< 0.05$ with zero shared co-authors in the preceding 3 years.
2. **Disjoint Institutional Affiliation:** Zero shared university departments, corporate research divisions, or principal investigator affiliations.
3. **Independent Implementation Codebase:** Clean-room re-implementation or independently developed codebase; not a cloned or forked repository sharing script pipelines.
4. **Independent or Re-Collected Datasets:** Evaluated on independent real-world datasets or newly generated test splits, eliminating shared benchmark-split contamination.

### 4.2 Disqualifying Dependencies (Why Two Partially Dependent Studies Do Not Equal an Independent Replication)
The following dependencies disqualify a study from being considered independent:
- Shared co-authorship within 3 years.
- Same research laboratory, academic department, or corporate research group.
- Preprint-to-journal duplicate or extended version.
- Forked repository with shared data-loader scripts.
- Evaluation exclusively on identical, pre-packaged public benchmark test splits (which produces correlated benchmark-overfitting noise).

> [!IMPORTANT]
> **CRITICAL REPLICATION RULE:**
> `PARTIALLY_DEPENDENT` evidence (e.g. disjoint authors using identical public benchmark splits) provides valuable directional corroboration, but **CANNOT count toward the independent replication requirement**.
> **Two `PARTIALLY_DEPENDENT` studies DO NOT satisfy an independent-replication requirement.** Correlated test-set biases in public benchmarks cannot substitute for independent scientific replication.

### 4.3 Handling Unknown Information (`INDEPENDENCE_UNKNOWN`)
- If author affiliations, institutional metadata, or dataset origins are unindexed or omitted, the study is classified as `INDEPENDENCE_UNKNOWN`.
- Studies with `INDEPENDENCE_UNKNOWN` **CANNOT** satisfy independent replication requirements. They are discounted in provisional scoring ($w = 0.3$), preventing unindexed studies from masquerading as confirmed independent replications.

---

## 5. Operational Validation Outcome Semantics & Hybrid-Path Constraints

### 5.1 `CONFIRMED_UNRESOLVED` (Horizon-Bounded Empirical Confirmation)
- **Scientific Meaning:** The candidate limitation has been independently tested and observed to persist across multiple independent investigations within the evaluated literature horizon.
- **Operational Invariant:** This outcome **does not assert** that the gap is universally unsolvable across all human knowledge. It explicitly states:
  > *"Within the evaluated literature horizon $\mathcal{H}_{val}$ through date $T_{eval}$, the limitation is independently confirmed to persist with zero commensurable published resolutions."*
- **Criteria:**
  - $\ge 2$ strictly `INDEPENDENT` papers reproducing the constraint under Class 1 comparability (or 1 `INDEPENDENT` + supporting `PARTIALLY_DEPENDENT`).
  - Zero verified commensurable refutations.
  - Provisional validation strength $S_{val} \ge 7.0 / 10.0$.
- **Epistemic Action:** Promotes gap to `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP`.

### 5.2 `PARTIALLY_ADDRESSED` (Restricted Domain Resolution)
- **Scientific Meaning:** A subsequent work has resolved the limitation under specific operational, architectural, or domain conditions, but the fundamental constraint remains open in the general case.
- **Criteria:**
  - $\ge 1$ Class 1 commensurable study demonstrating empirical resolution in domain subset $D_{resolved}$.
  - Bilateral evidence documenting the exact conditions where the gap persists ($D_{unresolved}$).
- **Epistemic Action:** Transitions gap to `ADDRESSED_OR_SUPERSEDED_GAP`, recording both the addressing evidence and the remaining unaddressed scope in audit metadata.

### 5.3 `ADDRESSED` (Methodologically Verified Resolution — Strict Pathway Separation)
- **Scientific Meaning:** The limitation has been systematically resolved across the primary benchmarks of the field within clearly characterized operational boundaries.
- **Removal of Arbitrary Time Proof:** The previous requirement demanding "3 or more years with zero counter-evidence" is **formally eliminated**.
- **Three Distinct Evidential Pathways for `ADDRESSED`:**

| Pathway | Evidential Requirements | Independent Replication Met? | Labeling & Review Constraint |
| :--- | :--- | :---: | :--- |
| **Pathway A: Standard Multi-Group Path** | $\ge 2$ strictly `INDEPENDENT` research groups (disjoint authors, institutions, codebases, datasets); zero counter-evidence. | **YES (Fully Satisfied)** | Standard outcome `ADDRESSED`. Normal audit log recording. |
| **Pathway B: Hybrid Verification Path** | Exactly $1$ strictly `INDEPENDENT` study + supporting `PARTIALLY_DEPENDENT` evidence (e.g. shared benchmark splits); zero counter-evidence. | **NO (Partial Only)** | **Must be explicitly labeled as `ADDRESSED (HYBRID_EVIDENCE_PATH)`. Mandatory human review (`requiresHumanReview = true`). The system must NEVER describe the hybrid path as satisfying the standard two-independent-replication requirement.** |
| **Pathway C: Landmark Result Path** | Exactly $1$ landmark study of extraordinary methodological rigor; verified open-source code, public checkpoints, and standardized benchmark harness. | **NO (Single Source Exception)** | Requires transparent empirical justification. Mandatory human review (`requiresHumanReview = true`). **Widespread adoption alone must NEVER establish scientific resolution.** |

- **Mandatory Counter-Evidence Query Execution:** The discovery horizon must have executed explicit counter-evidence search strategies (e.g. failure modes, trade-offs, negative results) and discovered zero unresolved contradictory findings under commensurable conditions.
- **Epistemic Principle:** The validation report must explicitly state that absence of counter-evidence in the retrieved corpus does not prove universal absence.

### 5.4 `CONTRADICTED` (Bifurcated Semantics)
Stage 4D strictly disentangles inter-paper empirical dispute from direct gap falsification:
- *Inter-Paper Dispute:* Paper A and Paper B disagree under commensurable conditions $\to$ Recorded as graph edge `'contradicts'` between papers in `public.research_gap_relationships`. Gap outcome remains `CONFIRMED_UNRESOLVED` if the dispute proves the open problem!
- *Direct Gap Falsification:* Bilateral evidence demonstrates that the seed paper's claimed limitation was caused by implementation defect, unstandardized baseline tuning, or data leakage $\to$ Gap outcome evaluates to `CONTRADICTED`. Gap is demoted.

### 5.5 `INSUFFICIENT_EVIDENCE` (Epistemic Abstention)
- **Scientific Meaning:** Available literature is inadequate to support a defensible scientific conclusion.
- **Criteria Triggered If:**
  - Discovery horizon yielded $< 2$ commensurable papers.
  - Ingestion failed due to paywalls, corrupt PDFs, or unextractable text.
  - Papers failed Critical Compatibility Gates.
  - Evidence exhibits irreconcilable ambiguity or unverified citations.
- **Epistemic Action:** Retains `CANDIDATE_RESEARCH_GAP` with outcome `INSUFFICIENT_EVIDENCE`. Confidence is heavily discounted.

---

## 6. Contradiction Detection & Bilateral Grounding Invariant

### 6.1 Bilateral Grounding Rule
A contradiction CANNOT be asserted based on an AI model's summary. Every asserted contradiction requires **bilateral verbatim quotations**:
$$\text{Contradiction} \implies \langle \text{Quote}_{seed}, [s_{start}, s_{end}), \text{Quote}_{val}, [v_{start}, v_{end}), \text{Rationale} \rangle$$
Where both quotes are verified letter-for-letter against their respective source chunks using `verifyQuoteAtCodepointOffsets()`.

### 6.2 Human Review Escalation Protocol
When an empirical contradiction or resolution involves:
- Two landmark papers from major peer-reviewed venues with irreconcilable results, OR
- A candidate gap with high scientific significance score ($S_{signif} \ge 8.5$), OR
- An `ADDRESSED` outcome resolved via Pathway B (Hybrid Path) or Pathway C (Landmark Path),
the engine sets `requiresHumanReview = true` and records an escalation alert in `public.research_gap_audit_log`. The system presents contradictory or resolving evidence side-by-side for human expert review rather than forcing an automated resolution.
