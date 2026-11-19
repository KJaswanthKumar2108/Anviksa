# Anvīkṣā — Stage 4D Evidence Model & Validation Scoring Architecture
## Three-Tier Admissibility, Five-Valued Missing Data, Evaluation-Date Recency, Provisional Scoring & Rigorous Phase 5 Calibration
### Architecture Specification: Version 4.1.0-REVISED (Stage 4D Revision 4)

**Document Version:** 4.1.0-STAGE4D-EVID-REV4  
**Status:** ARCHITECTURE CORRECTION ONLY — IMPLEMENTATION STRICTLY PROHIBITED  
**Milestone:** Stage 4D — Cross-Literature Validation & Contradiction Detection  
**Author:** Principal Supabase PostgreSQL Architect & AI Systems Safety Engineer  
**Date:** 2026-11-18  

---

## 1. Resolution of Architectural Inconsistencies & Calibration Distinctions

During critical scientific review across Revisions 2, 3, and 4, key methodological and mathematical distinctions were formalized:
1. **Scoring vs. Calibration Distinction:** Deterministic heuristic formulas must NEVER be conflated with empirically calibrated probabilities. The validation engine computes a **Provisional Validation Strength** score ($S_{val} \in [0.0, 10.0]$), clearly labeled as a deterministic index rather than a calibrated probability of truth.
2. **UI / API Warning Requirement:** A score of $8.0 / 10.0$ must NEVER be interpreted or displayed to users as an "80% probability of correctness." It represents a multi-vector heuristic evidence strength index.
3. **Five-Valued Missing Data Semantics:** Missing parameters (`NOT_REPORTED` or `UNKNOWN`) are distinguished from empirical conflict (`INCOMPATIBLE`). Dimension scoring handles `NOT_APPLICABLE` by normalizing over active dimensions.
4. **The Anti-Compensatory Epistemic Multiplier:** High literature coverage ($\Omega_{cov}$) or publication recency ($T_{rec}$) cannot compensate for poor evidence grounding ($Q_{evid}$) or incommensurable experimental conditions ($R_{meth}$).
5. **Evaluation-Date Recency Formulation:** Evidence age is strictly evaluated relative to the evaluation timestamp ($T_{eval}$), not the time span between papers.
6. **Handling Retracted, Corrected, and Foundational Works:** Retracted papers are disqualified ($0.0$ weight, status `DISQUALIFIED_RETRACTED`), while foundational baseline papers are granted temporal decay exemptions when establishing historical reference points.

---

## 2. Three-Tier Admissibility & Validation Scoring Architecture

Validation evaluation is structured into three non-compensatory tiers:

```
                            Raw Ingested Evidence
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Tier A: Admissibility Eligibility Gates    │
             │   (Non-Compensatory Hard Boolean Preconditions)  │
             ├──────────────────────────────────────────────────┤
             │ • Gate A1: Grounding Verification (Exact/Norm)   │
             │ • Gate A2: Comparison-Specific Admissibility     │
             │ • Gate A3: Independence Admissibility            │
             │ • Gate A4: Publication Validity (Not Retracted)  │
             └──────────────────────────────────────────────────┘
                                      │
                         All Admissibility Gates Passed?
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
                 [YES]                                 [NO]
                   │                                     │
                   ▼                                     ▼
      ┌──────────────────────────────┐        ┌─────────────────────────┐
      │     Tier B: Multi-Vector     │        │  Disqualified from      │
      │    Evidence-Quality Profile  │        │  Validation Decisions   │
      ├──────────────────────────────┤        ├─────────────────────────┤
      │ • Grounding Precision (Q_ev) │        │ Retained for contextual │
      │ • Commensurability (R_meth)  │        │ theoretical reference   │
      │ • Independence (I_src)       │        │ only. Admissibility = 0 │
      │ • Evaluation Recency (T_rec) │        └─────────────────────────┘
      │ • Horizon Completeness (Ω)   │
      └──────────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────┐
      │     Tier C: Provisional      │
      │ Validation Strength (S_val)  │
      ├──────────────────────────────┤
      │ • Epistemic multiplier base  │
      │ • Contradiction dampening    │
      │ • Scale: [0.0, 10.0] index   │
      │ • NOT a probability          │
      └──────────────────────────────┘
                   │
                   ▼ (Requires Phase 5 Benchmark Calibration)
      ┌──────────────────────────────┐
      │   Calibrated Confidence P    │
      │  (Platt Scaling / Isotonic)  │
      ├──────────────────────────────┤
      │ • Target: ECE <= 0.08, Brier │
      │ • Labeled as Calibrated P    │
      │ • Fallback to S_val if fails │
      └──────────────────────────────┘
```

---

## 3. Tier A: Admissibility Eligibility Gates

Before any evidence item $\mathcal{E}$ can be aggregated into a validation decision, it must pass four non-negotiable admissibility gates:

1. **Gate A1: Grounding Admissibility (`isGroundingAdmissible`)**
   - *Requirement:* Evidence quote must evaluate to `VERIFIED_EXACT_MATCH` or `VERIFIED_NORMALIZED_MATCH` against canonical source chunk text via 0-based code-point slicing.
   - *Rejection:* Any claim with `FAILED_VERIFICATION` is strictly excluded from contributing to gap outcomes.
2. **Gate A2: Comparison-Specific Admissibility (`isComparisonAdmissible`)**
   - *Requirement:* Must meet the specific comparability gate required for the intended inference:
     - Direct Empirical Contradiction / Resolution: Requires passing all Tier 1 Critical Compatibility Gates (Task, Operational Question, Metric Formulation, Dataset Domain) with status `VERIFIED_COMPATIBLE`.
     - Related Research Questions / Directional Support: Requires passing Task Alignment and Operational Question Alignment; allows partial metric/domain variance.
     - Contextual / Theoretical Scaffolding: Retained in evidence graph as background; blocked from direct contradiction.
3. **Gate A3: Independence Admissibility (`isIndependenceAdmissible`)**
   - *Requirement:* Evidence used to assert independent replication must strictly evaluate to `INDEPENDENT` (disjoint authors, disjoint institutions, independent codebases, independent datasets).
   - *Rejection:* `DEPENDENT`, `PARTIALLY_DEPENDENT`, and `INDEPENDENCE_UNKNOWN` studies cannot count toward the independent replication requirement.
4. **Gate A4: Publication Validity (`isPublicationValid`)**
   - *Requirement:* Paper must not be retracted, withdrawn, or marked fraudulent in Crossref, OpenAlex, or Retraction Watch metadata.
   - *Rejection:* Retracted papers are assigned status `DISQUALIFIED_RETRACTED` and purged from validation consideration. Corrected papers are evaluated against their latest errata/version.

---

## 4. Tier B: Multi-Vector Evidence-Quality Profile (Exact Scales & Normalization)

### 4.1 Grounding Fidelity Vector ($Q_{evid} \in [0.0, 1.0]$)
Measures the proportion of verbatim letter-for-letter evidence versus normalized evidence across all cited claims:
$$Q_{evid} = \frac{1.0 \cdot N_{exact} + 0.75 \cdot N_{normalized}}{N_{exact} + N_{normalized}}$$
- **Scale & Range:** Real number in $[0.0, 1.0]$.
- **Normalization:** Directly normalized by total verified claims.
- **Missing Data Handling:** If zero verified claims exist ($N_{exact} + N_{normalized} = 0$), $Q_{evid} = 0.0$, causing Tier A failure and epistemic abstention (`INSUFFICIENT_EVIDENCE`).

### 4.2 Methodological Commensurability Profile ($R_{meth} \in [0.0, 1.0]$)
Computed across Tier 2 contextual dimensions for admissible papers, normalizing over applicable dimensions:
$$R_{meth} = \frac{1}{|\mathcal{P}_{admiss}|} \sum_{p \in \mathcal{P}_{admiss}} \frac{0.35 S_{base}(p) + 0.25 S_{scale}(p) + 0.20 S_{threat}(p) + 0.20 S_{hard}(p)}{\sum_{d \in \mathcal{D}_{active}(p)} w_d}$$
- **Five-Valued Dimension Scoring:**
  - `VERIFIED_COMPATIBLE`: Dimension scores $1.0$.
  - `NOT_APPLICABLE`: Excluded from both numerator and denominator $\sum w_d$.
  - `NOT_REPORTED`: Dimension scores $0.0$, depressing $R_{meth}$ due to documentation uncertainty without asserting negative findings.
  - `UNKNOWN`: Dimension scores $0.0$, reflecting unindexed metadata uncertainty.
  - `INCOMPATIBLE`: Fails Class 1 gate. Downgraded to Class 2 (Related Questions) or Class 3 (Contextual Evidence) when investigating related phenomena; routed to Class 4 (`INCOMMENSURABLE_CONTEXT`) only if tasks or research paradigms are genuinely disjoint.
- **Missing Data Handling:** Omitting baseline or hardware details depresses $R_{meth}$, capping confidence and preventing unwarranted high-confidence closure.

### 4.3 Source Independence Profile ($I_{src} \in [0.0, 1.0]$)
Reflects the weighted contribution of independent investigations:
$$I_{src} = \frac{\sum_{p \in \mathcal{P}_{admiss}} w_{indep}(p)}{|\mathcal{P}_{admiss}|}$$
Where $w_{indep}(p)$ is assigned according to the multi-factor independence state:
- $1.0$ for `INDEPENDENT` (disjoint authors, disjoint institutions, independent codebases).
- $0.5$ for `PARTIALLY_DEPENDENT` (disjoint authors but shared standard benchmark splits or historical co-authorship $> 3$ years prior).
- $0.2$ for `DEPENDENT` (same lab/PI, preprint duplicate, author Jaccard $\ge 0.25$, or forked codebase).
- $0.3$ for `INDEPENDENCE_UNKNOWN` (author or institutional affiliation metadata missing or incomplete).
- **Provisional Parameter Justification ($w = 0.3$ for `INDEPENDENCE_UNKNOWN`):** The value $0.3$ serves as a conservative uncertainty penalty. It deliberately scores below partial dependence ($0.5$) to disincentivize relying on unverified provenance, but remains strictly above zero ($0.0$) so that valid scientific papers with unindexed metadata can still provide exploratory evidence without falsely masquerading as confirmed independent replications.

### 4.4 Revised Temporal Recency Model ($T_{rec} \in [0.0, 1.0]$)

#### Evaluation-Date Recency Formulation
Evidence age is evaluated **strictly relative to the validation execution timestamp ($T_{eval}$)**, distinguishing **Validation Literature** from **Foundational Baselines**:

$$\Delta t_{val} = \text{Year}(T_{eval}) - \text{Year}(p_{val})$$

$$\tau(p_{val}) = \begin{cases} 
1.0 & \text{if } \Delta t_{val} \le 1 \text{ year (Cutting-edge evidence)} \\
\exp\left(-\lambda \cdot (\Delta t_{val} - 1)\right) & \text{if } \Delta t_{val} > 1 \text{ year} \\
0.3 & \text{if } \text{Year}(p_{val}) \text{ is missing (`RECENCY_UNKNOWN`)}
\end{cases}$$

- **Provisional Parameter Justification ($\lambda = 0.12$):** A decay constant of $\lambda = 0.12$ yields an evidence half-life of approximately $5.8$ years ($\ln(2)/0.12 \approx 5.78$). Under this rate:
  - 3-year-old evidence retains $\tau = \exp(-0.12 \times 2) \approx 0.787$.
  - 5-year-old evidence retains $\tau = \exp(-0.12 \times 4) \approx 0.619$.
  - 10-year-old evidence retains $\tau = \exp(-0.12 \times 9) \approx 0.340$.
  This reflects empirical half-life dynamics in computational and AI literature where algorithmic state-of-the-art evolves rapidly.
- **Foundational Paper Exemption Criteria:**
  A paper is granted an exemption from temporal decay ($\tau = 1.0$) if it meets **all** of the following criteria:
  1. It is explicitly cited by the seed or validation paper as establishing the baseline architecture, paradigm, or mathematical formulation under evaluation (e.g. *Vaswani et al., 2017* for Transformer attention).
  2. It was published $\ge 5$ years prior to $T_{eval}$.
  3. It is used exclusively to establish historical baseline definitions, theoretical bounds, or foundational problem formulations, rather than asserting current empirical state-of-the-art.
- **Handling Retracted, Withdrawn, and Corrected Publications:**
  - *Retracted Publications:* Immediately assigned `DISQUALIFIED_RETRACTED` with weight $0.0$. Retracted papers are strictly prohibited from contributing to $T_{rec}$, $Q_{evid}$, $R_{meth}$, or any validation decision. They are flagged in `unresolvedApiFailures` and logged in the audit trail.
  - *Corrected / Errata Publications:* When an erratum or corrigendum is indexed, the paper is evaluated solely against its corrected text. If the correction invalidates key empirical claims, the pre-correction version is treated as superseded ($w = 0.0$).
- **Aggregate Recency:**
  $$T_{rec} = \frac{1}{|\mathcal{P}_{val}|} \sum_{p \in \mathcal{P}_{val}} \tau(p)$$

### 4.5 Horizon Coverage Completeness ($\Omega_{cov} \in [0.0, 1.0]$)
Evaluates the execution of the planned discovery budget:
$$\Omega_{cov} = \frac{N_{ingested\_commensurable}}{\min(N_{candidate\_budget}, N_{available\_in\_horizon})}$$
- **Scale & Range:** Real number in $[0.0, 1.0]$.
- **Missing Data Handling:** If zero candidates are available or ingested, $\Omega_{cov} = 0.0$.

---

## 5. Tier C: Provisional Validation Strength Scoring (Non-Calibrated)

### 5.1 Base Quality Index ($B_{qual} \in [0.0, 1.0]$)
The base quality index $B_{qual}$ integrates Tier B vectors using the non-compensatory **epistemic multiplier**:

$$B_{qual} = \left( Q_{evid} \times R_{meth} \right)^{0.5} \times \left[ 0.45 I_{src} + 0.30 T_{rec} + 0.25 \Omega_{cov} \right]$$

*Epistemic Invariant:* Multiplying by $(Q_{evid} \times R_{meth})^{0.5}$ guarantees that if either evidence grounding ($Q_{evid}$) or methodological commensurability ($R_{meth}$) is zero, $B_{qual}$ collapses to zero regardless of how high recency, independence, or coverage may be.

### 5.2 Contradiction Dampening & Provisional Validation Strength
The provisional validation strength score $S_{val} \in [0.0, 10.0]$ applies non-linear contradiction dampening:

$$\Large S_{val} = 10.0 \times B_{qual} \times \frac{1.0}{1.0 + 0.6 \cdot N_{unresolved\_contradictions}}$$

- **Label:** `PROVISIONAL_VALIDATION_STRENGTH`.
- **Scale:** Heuristic index from $0.0$ to $10.0$.
- **Contradiction Penalty:** Each unresolved direct empirical contradiction dampens the score:
  - 0 contradictions: Dampener $= 1.0$ (no reduction).
  - 1 contradiction: Dampener $= 1 / (1 + 0.6) = 0.625$ ($37.5\%$ reduction).
  - 2 contradictions: Dampener $= 1 / (1 + 1.2) = 0.455$ ($54.5\%$ reduction).
  - 3 contradictions: Dampener $= 1 / (1 + 1.8) = 0.357$ ($64.3\%$ reduction).

### 5.3 Mandatory UI & API Warning
All UI components and API response schemas must include the following explicit caveat:
> **CAVEAT:** `PROVISIONAL_VALIDATION_STRENGTH` is a deterministic heuristic index reflecting evidence grounding, methodological comparability, and corpus coverage. It is **NOT** a calibrated probability of empirical correctness. A score of 8.0/10.0 does NOT denote an 80% probability of truth.

---

## 6. Phase 5 Rigorous Calibration Protocol Specification

### 6.1 Exact Calibration Target & Event Definition
Calibration does not operate on subjective impressions. The exact event being calibrated is the **empirical truth of the automated validation decision**:
$$Y = \mathbf{1}(\text{Assigned Validation Outcome} = \text{Ground Truth Consensus Outcome})$$
- **Primary Binary Targets (One-vs-Rest):**
  1. $P(\text{Resolved} \mid S_{val})$: Probability that a gap classified as `ADDRESSED` is truly resolved.
  2. $P(\text{Unresolved} \mid S_{val})$: Probability that a gap classified as `CONFIRMED_UNRESOLVED` is genuinely an open scientific limitation.
- **Multiclass Calibration:** Temperature-scaled softmax mapping composite dimensional vectors to the 5 outcome categories.

### 6.2 Unit of Calibration & Cluster Independence
- **Unit of Calibration:** The **Validation Run on a Candidate Research Gap** ($\langle \mathcal{G}, \mathcal{H}_{val} \rangle$), NOT isolated papers or sentences.
- **Correlated Paper & Cluster Handling:** Papers sharing co-authors, lineages, or lab affiliations are grouped into **Lab Clusters**. During data splitting, entire clusters are assigned as an indivisible unit to either Train, Validation, or Test. This eliminates data leakage across partitions.

### 6.3 Double-Blind Expert Adjudication Protocol
Reference ground truth labels are established through a formalized protocol:
1. Two independent domain experts annotate each gap and its literature pool against a standardized rubric.
2. If experts agree, the label is confirmed.
3. If experts disagree, a third senior referee adjudicates the bilateral evidence quotes to establish a binding ground truth consensus label.

### 6.4 Dataset Size Adequacy & Benchmark Roadmap
- **Initial Development Benchmark (Phase 5):** 60+ disputes across FlashAttention/Mamba, GNNs, and LoRA serve as an **initial development testbed**, NOT proof of production-grade calibration.
- **Production Calibration Dataset Requirement:** Prior to enabling calibrated probability outputs in production, an expanded dataset of $\ge 200$ annotated historical gaps across diverse disciplines (computer science, computational biology, physics) must be assembled to provide sufficient statistical power.

### 6.5 Calibration Methods Rationale
1. **Platt Scaling (Logistic Sigmoid Mapping):**
   $$P(Y = 1 \mid S_{val}) = \frac{1}{1 + \exp(A \cdot S_{val} + B)}$$
   *Rationale:* Highly effective when the relationship between heuristic score and empirical log-odds is monotonic and smooth; avoids overfitting on moderate dataset sizes.
2. **Isotonic Regression:** Non-parametric piecewise step function; evaluated as a candidate if empirical calibration curves exhibit sharp non-linear plateaus, provided sample size $\ge 200$.

### 6.6 Leakage Prevention & Partitioning
- **Stratified Group k-Fold Partitioning:** Stratified by scientific domain and grouped by research laboratory. Seed papers, validation corpora, and authors from the same cluster are strictly forbidden from spanning train and test partitions.
- **Partition Splits:** 60% Calibration Training, 20% Hyperparameter Validation, 20% Held-Out Test.

### 6.7 Evaluation Metrics & Acceptance Targets (Not Guarantees)
- **Expected Calibration Error (ECE):**
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} |\text{acc}(B_m) - \text{conf}(B_m)|$$
  Evaluated across $M = 10$ equal-frequency bins.
- **Maximum Calibration Error (MCE):** $\max_{m=1 \dots M} |\text{acc}(B_m) - \text{conf}(B_m)|$.
- **Brier Score:** $\frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$.
- **Acceptance Target:** $\text{ECE} \le 0.08$ on the held-out test split is an **acceptance target**, not a guaranteed promise.

### 6.8 Fallback Mechanism on Calibration Failure
If the calibrated model fails to achieve $\text{ECE} \le 0.08$ on the held-out test split:
1. The engine **refuses to emit calibrated probabilities** in API responses.
2. The engine logs a calibration failure alert in the audit log.
3. The engine falls back to outputting `PROVISIONAL_VALIDATION_STRENGTH` with explicit uncalibrated heuristic warnings.

---

## 7. Reproducible Horizon Provenance & Metadata Schema

### 7.1 Schema Definition (`LiteratureCoverageMetadata`)

```typescript
export interface LiteratureCoverageMetadata {
  validationRunId: string;
  evaluationTimestamp: string;
  discoveryHorizonBudget: 'QUICK_VALIDATION' | 'STANDARD_VALIDATION' | 'EXHAUSTIVE_HORIZON';
  candidateBudgetLimit: number;
  
  // Provisional Scoring vs Calibration State
  scoringMetadata: {
    provisionalValidationStrength: number; // 0.0 - 10.0 index
    isCalibratedProbability: boolean; // false until Phase 5 calibration
    calibrationModelVersion?: string; // e.g., 'v1.0.0-platt'
    calibratedProbability?: number; // 0.0 - 1.0 (only present if isCalibratedProbability = true)
    calibrationMetrics?: {
      ece: number;
      mce: number;
      brierScore: number;
    };
    provisionalParameters: {
      recencyDecayLambda: number; // 0.12
      unknownIndependenceWeight: number; // 0.3
      contradictionPenaltyGamma: number; // 0.6
    };
  };

  // Seed Paper Traceability (references public.research_papers)
  seedPaper: {
    paperId: string | null;
    doi: string | null;
    openAlexId: string;
    totalEligibleChunks: number;
    selectedChunkIds: number[];
    selectedSectionDistribution: Record<string, number>;
    omittedChunkCount: number;
    isTruncated: boolean;
    textNormalizationVersion: string;
  };

  // Discovery Search Logs
  discoveryAudit: {
    executedStrategies: string[];
    queriesExecuted: string[];
    totalCandidatesDiscovered: number;
    strategyYields: Record<string, number>;
    adaptiveExpansionTriggered: boolean;
    expansionReasons: string[];
  };

  // Ingested Corpus Traceability (references public.research_papers)
  ingestedCorpus: Array<{
    paperId: string | null;
    doi: string | null;
    openAlexId: string;
    publicationYear: number | null;
    retrievalStatus: string;
    evidenceCompleteness: string;
    sourceDocumentChecksum: string;
    extractedTextChecksum: string;
    totalEligibleChunks: number;
    selectedChunkIds: number[];
    selectedSectionDistribution: Record<string, number>;
    omittedChunkCount: number;
    isTruncated: boolean;
    independenceState: 'INDEPENDENT' | 'PARTIALLY_DEPENDENT' | 'DEPENDENT' | 'INDEPENDENCE_UNKNOWN';
    independenceWeight: number;
    authorJaccard: number;
    sharedInstitutions: string[];
    lineageType: string;
    isRetracted: boolean;
    isFoundationalExempt: boolean;
    criticalGatesPassed: boolean;
    comparisonClass: 'DIRECT_EMPIRICAL' | 'RELATED_QUESTION' | 'CONTEXTUAL_THEORETICAL' | 'INCOMMENSURABLE';
    tier2ComparabilityScore: number;
    dimensionalStatuses: Record<string, 'VERIFIED_COMPATIBLE' | 'INCOMPATIBLE' | 'NOT_REPORTED' | 'UNKNOWN' | 'NOT_APPLICABLE'>;
  }>;

  // Retrieval & Ingestion Failure Visibility
  unresolvedApiFailures: Array<{
    targetIdentifier: string;
    failureReason: 'PAYWALL_403' | 'PDF_CORRUPT' | 'NO_OA_URL' | 'TIMEOUT' | 'DISQUALIFIED_RETRACTED';
    rawErrorMessage: string;
  }>;

  // Cryptographic Invariant Hash
  corpusHash: string; // SHA-256 over canonical sorted paper identifiers + chunk checksums
  validationEngineVersion: string; // '4.1.0-REVISED'
  promptMethodologyVersion: string; // '4.1.0-REVISED'
  modelIdentifier: string;
}
```

### 7.2 Cryptographic Invariant Construction (`corpusHash`)

$$\text{corpusHash} = \text{SHA-256}\left( \text{seedDOI} + \text{"::"} + \bigoplus_{i=1}^M \left( \text{DOI}_i + \text{":"} + \text{ChunkChecksums}_i + \text{":"} + \text{SelectedChunkIDs}_i \right) \right)$$

Where papers are sorted alphabetically by canonical DOI/OpenAlex ID. Any alteration in chunk content, selection ordering, or text normalization results in a modified `corpusHash`, guaranteeing complete tamper evidence.
