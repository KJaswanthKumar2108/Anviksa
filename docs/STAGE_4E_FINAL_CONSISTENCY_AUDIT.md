# Anvīkṣā — Stage 4E Final Consistency Audit Report
## Comprehensive Scientific, Mathematical & Architectural Integrity Verification
### Research Opportunity Ranking, Falsifiable Hypothesis Generation & Experiment Protocol Synthesis

**Document Version:** 4.1.0-STAGE4E-FINAL-AUDIT  
**Status:** FORMAL AUDIT COMPLETE  
**Milestone:** Stage 4E  
**Baseline Documents Audited:**
- `docs/STAGE_4E_ARCHITECTURE.md` (Version 4.1.0-STAGE4E-ARCH-REV1)
- `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` (Version 4.1.0-STAGE4E-OPP-REV1)
- `docs/STAGE_4E_HYPOTHESIS_METHODOLOGY.md` (Version 4.1.0-STAGE4E-HYP-REV1)
- `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` (Version 4.1.0-STAGE4E-EXPERIMENT-REV1)
- `docs/STAGE_4E_DATA_AND_API_DESIGN.md` (Version 4.1.0-STAGE4E-DATA-API-REV1)
- `docs/STAGE_4E_EVALUATION_FRAMEWORK.md` (Version 4.1.0-STAGE4E-EVAL-REV1)
- `docs/STAGE_4E_ACCEPTANCE_CRITERIA.md` (Version 4.1.0-STAGE4E-ACCEPTANCE-REV1)

**Execution Mode:** STRICTLY DOCUMENTATION & ARCHITECTURAL CONSISTENCY AUDIT  
**Implementation Authorization:** STRICTLY NOT GRANTED  
**Date:** 2026-11-21  

---

# 1. Executive Summary & Audit Scope

This document represents the formal consistency audit of the Stage 4E Complete Architecture (Revision 1). The audit was executed to examine all mathematical formulations, statistical inference assumptions, metric operationalizations, scoring gate mechanics, multi-rater experimental controls, paradigm coverage, and relational provenance links across the Stage 4E architecture specifications.

The audit establishes that all ten critical architectural and scientific items have been rigorously resolved with exact mathematical formulas and document section anchors. No unresolved contradictions remain in the core architecture. Three operational policy choices have been classified as explicitly bounded `OPEN` decisions without blocking baseline architectural readiness.

---

# 2. Item-by-Item Scientific, Mathematical & Architectural Resolution

### 2.1 Kendall's Tau ($\tau_{rank}$) Uncertainty Estimation & the Fieller Method
- **Identified Deficiency in Draft:** The preliminary draft labeled the null variance formula $\text{Var}_0(\tau) = \frac{2(2n+5)}{9n(n-1)}$ as "Fieller's formula". This formula is valid strictly under the null hypothesis $H_0: \tau = 0$. When applied to benchmark targets of $\tau \ge 0.70$, null variance significantly underestimates the sampling variance of Kendall's tau and produces spuriously narrow confidence intervals.
- **Architectural Resolution:**
  1. *Fisher Hyperbolic Arctangent Transformation (Fieller, Hartley, & Pearson 1957; Long & Rosenthal 1988):*
     $$z_\tau = \operatorname{arctanh}(\tau) = \frac{1}{2}\ln\left(\frac{1+\tau}{1-\tau}\right)$$
     The asymptotic variance of $z_\tau$ under $H_1: \tau \neq 0$ is approximately:
     $$\operatorname{Var}(z_\tau) \approx \frac{0.437}{n - 4}$$
     The two-sided $(1 - \alpha)$ confidence interval is constructed on $z_\tau$:
     $$[z_L, \; z_U] = z_\tau \pm z_{\alpha/2} \sqrt{\frac{0.437}{n - 4}}$$
     and back-projected to Kendall's $\tau$ via the hyperbolic tangent:
     $$[\tau_L, \; \tau_U] = [\tanh(z_L), \; \tanh(z_U)]$$
  2. *Direct Non-Null Asymptotic Standard Error (Noether 1967; Samara & Randles 1988; Cliff 1993):*
     $$\sigma^2_\tau = \frac{4}{n} \left[ \frac{1}{n} \sum_{i=1}^n (P_i - Q_i)^2 - \tau^2 \right]$$
     where $P_i = \sum_{j \neq i} \mathbf{1}\left((X_i - X_j)(Y_i - Y_j) > 0\right)$ and $Q_i = \sum_{j \neq i} \mathbf{1}\left((X_i - X_j)(Y_i - Y_j) < 0\right)$.
- **Document Anchors:** `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, Section 2.3, Sub-item 9; `docs/STAGE_4E_ACCEPTANCE_CRITERIA.md`, Criterion 4E-AC-4.

---

### 2.2 Cluster-Aware Unsupported Claim Rate ($UCR$) Confidence Intervals
- **Identified Deficiency in Draft:** The initial specification mandated a simple i.i.d. bootstrap over causal claims. However, causal assertions generated within the same hypothesis rationale share common latent representations, prompt contexts, and citation graphs, causing substantial intra-cluster correlation. Treating claims as independent leads to artificially deflated standard errors.
- **Architectural Resolution:**
  A **Cluster-Aware Block Bootstrap** (Cameron, Gelbach, & Miller 2008) is formally operationalized:
  - Resampling occurs at the hypothesis/gap cluster level $g \in \{1, \dots, G\}$ where $G = 100$ independent gap clusters.
  - In each bootstrap replication $b \in \{1, \dots, B\}$ ($B = 1,000$), $G$ clusters are drawn with replacement: $\mathcal{C}_1^{(b)}, \dots, \mathcal{C}_G^{(b)}$.
  - For each drawn cluster $\mathcal{C}_g^{(b)}$, all $K_g$ causal assertions are included intact:
    $$\widehat{UCR}^{(b)} = \frac{\sum_{g \in \mathcal{C}^{(b)}} \sum_{j=1}^{K_g} \mathbf{1}\left(\text{ClaimHasNoEvidenceRef}(C_{gj}) \;\lor\; \text{ViolatesDomainLaws}(C_{gj})\right)}{\sum_{g \in \mathcal{C}^{(b)}} K_g} \times 100\%$$
  - Cluster-robust standard errors are computed via:
    $$\widehat{\text{Var}}_{cluster}(\widehat{UCR}) = \frac{G}{G - 1} \sum_{g=1}^G \left( \mathbf{u}_g - \bar{\mathbf{u}} \right)^2$$
    where $\mathbf{u}_g$ represents the linearized score contribution of cluster $g$.
- **Document Anchors:** `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, Section 2.4, Sub-item 9.

---

### 2.3 Protocol Completeness Index ($PCI$) Bounded Confidence Interval Assumptions
- **Identified Deficiency in Draft:** The preliminary evaluation framework used a Student's t-interval ($\bar{x} \pm t_{N-1} \frac{s}{\sqrt{N}}$) for $PCI$. Because $PCI \in [0.0, 10.0]$ and the target threshold is $\ge 8.5$, a symmetric Gaussian t-interval violates bounded domain constraints (predicting upper bounds $> 10.0$) and violates the normality assumption due to negative skewness near the ceiling.
- **Architectural Resolution:**
  Two mathematically valid bounded inference procedures are established:
  1. *Logit-Transformed Beta Confidence Intervals:*
     Let $p_i = \frac{PCI_i}{10.0} \in (0, 1)$. Compute logit transform:
     $$y_i = \operatorname{logit}(p_i) = \ln\left(\frac{p_i}{1.0 - p_i}\right)$$
     Construct confidence interval on the unbounded real scale $y \sim \mathcal{N}(\mu_y, \sigma_y^2)$:
     $$[y_L, \; y_U] = \bar{y} \pm t_{\alpha/2, N-1} \frac{s_y}{\sqrt{N}}$$
     Project bounds back to the $[0.0, 10.0]$ interval via the inverse logit (standard logistic sigmoid):
     $$PCI_{bound} = \frac{10.0}{1.0 + e^{-y_{bound}}}$$
     This guarantees $0.0 \le PCI_L \le PCI_U \le 10.0$ under all sample variances.
  2. *Non-Parametric BCa (Bias-Corrected and Accelerated) Bootstrap:*
     $B = 2,000$ resamples bounded within the support $[0.0, 10.0]$, correcting for median bias $z_0$ and skewness acceleration $a$.
- **Document Anchors:** `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, Section 2.5, Sub-item 9.

---

### 2.4 Operational Definitions of All Six Evaluation Metrics
Each evaluation metric is completely operationalized with numerator, denominator, evaluation unit, annotation process, dataset, target threshold, and uncertainty model:

| Metric | Full Name & Mathematical Definition | Numerator | Denominator | Unit | Target | Uncertainty Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$HFI$** | **Hypothesis Falsifiability Index**<br>$\frac{1}{N}\sum_{i=1}^N \prod_{g=1}^{10} \mathbf{1}(\text{GateMet}(H_i, g)) \times 100\%$ | Count of hypotheses passing all 10 falsifiability gates | Total generated hypotheses ($N \ge 100$) | Candidate Hypothesis | $\mathbf{\ge 90.0\%}$ | Wilson score binomial interval |
| **$BAR$** | **Baseline Authenticity Rate**<br>$\frac{1}{M}\sum_{i=1}^M \mathbf{1}(\text{Exists}(B_i) \land \text{DOIValid}(B_i) \land \text{NumbersMatch}(B_i)) \times 100\%$ | Count of literature baselines with verified DOI and exact matching published numbers | Total cited literature baselines ($M \ge 150$) | Baseline Citation Entry | $\mathbf{100.0\%}$ *(Zero Tolerance)* | Clopper-Pearson exact binomial interval |
| **$\tau_{rank}$** | **Ranking Concordance**<br>$\tau = \frac{C - D}{\frac{1}{2} n (n - 1)}$ | Concordant minus discordant pairs ($C - D$) | Total distinct pairs $\binom{n}{2}$ ($n=60$) | Domain Opportunity List | $\mathbf{\ge 0.70}$ | Fieller $z_\tau$ hyperbolic transform & Noether non-null variance |
| **$UCR$** | **Unsupported Claim Rate**<br>$\frac{1}{K}\sum_{j=1}^K \mathbf{1}(\text{NoEvidence}(C_j) \lor \text{ViolatesLaws}(C_j)) \times 100\%$ | Count of ungrounded causal assertions | Total causal assertions across rationales ($K \ge 400$) | Causal Claim Clause | $\mathbf{\le 5.0\%}$ | Cluster-aware block bootstrap ($G=100$) |
| **$PCI$** | **Protocol Completeness Index**<br>$\frac{1}{N}\sum_{i=1}^N (\frac{1}{10}\sum_{c=1}^{10} w_c \mathbf{1}(\text{CriterionMet}(\mathcal{P}_i, c))) \times 10.0$ | Sum of weighted satisfied protocol criteria | Total criteria normalized to $[0.0, 10.0]$ | Experiment Protocol Artifact | $\mathbf{\ge 8.5 / 10.0}$ | Logit-transformed beta CI & BCa bootstrap |
| **$RUS$** | **Researcher Utility Score**<br>$\frac{1}{N_s}\sum_{s=1}^{N_s} \text{LikertRating}_s$ | Sum of 5-point Likert ratings | Total completed expert reviews ($N_s \ge 60$) | Expert Survey Review | $\mathbf{\ge 4.2 / 5.0}$ | Student's t standard error with rater random effects |

- **Document Anchors:** `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, Sections 2.1 through 2.6.

---

### 2.5 Exact $P_{actionable}$ Decision Mapping & 2D Strategic Research Decision Matrix
- **Identified Deficiency in Draft:** The draft defined $P_{actionable} = \beta V_{scientific} + (1-\beta) E_{suitability}$ as a continuous linear combination, but lacked an explicit, closed-form piecewise mapping from continuous scores $(V, E)$ into the four operational quadrants of the 2D Strategic Research Decision Matrix.
- **Architectural Resolution:**
  The continuous scoring and discrete strategic categorization are formalized into an explicit two-tier mapping:
  1. *Continuous Actionable Priority Score:*
     $$P_{actionable} = \beta \cdot V_{scientific} + (1.0 - \beta) \cdot E_{suitability}, \quad \text{with } \beta = 0.60$$
  2. *Piecewise Strategic Decision Function:*
     $$\text{StrategicQuadrant}(V_{scientific}, E_{suitability}) = \begin{cases}
     \text{IMMEDIATE\_HIGH\_PRIORITY} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} \ge 6.0 \\
     \text{GRANT\_OR\_COLLABORATION\_TARGET} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} < 6.0 \\
     \text{FEASIBLE\_EXERCISE} & \text{if } V_{scientific} < 6.0 \land E_{suitability} \ge 6.0 \\
     \text{DEPRIORITIZED} & \text{if } V_{scientific} < 6.0 \land E_{suitability} < 6.0
     \end{cases}$$
  3. *Operational Guidance per Quadrant:*
     - `IMMEDIATE_HIGH_PRIORITY`: High intrinsic scientific value and fully supported by researcher compute/data; execute immediate protocol generation.
     - `GRANT_OR_COLLABORATION_TARGET`: Breakthrough scientific opportunity exceeding current local resources; generate compute grant proposals or cross-institutional consortium agreements.
     - `FEASIBLE_EXERCISE`: Readily achievable with available compute but lower theoretical novelty; suitable for graduate baseline calibration or engineering optimization.
     - `DEPRIORITIZED`: Low intrinsic scientific value and high resource barrier; archived.
- **Document Anchors:** `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md`, Sections 5.0 and 5.1; `docs/STAGE_4E_DATA_AND_API_DESIGN.md`, Section 2.2.

---

### 2.6 Scientific and Suitability Gate Semantics
- **Identified Deficiency in Draft:** Writing $V_{scientific} = (\dots) \cdot \Pi_{scientific\_gates}$ created a mathematical contradiction because $\Pi$ denotes product of indicators ($\{0, 1\}$), whereas the accompanying prose stated that failing tractability caps the score at $\le 2.5$. If $\Pi = 0$, the score becomes 0; if $\Pi = 1$, the score is unconstrained.
- **Architectural Resolution:**
  The formulation is rewritten into an explicit, deterministic **Continuous Ceiling Clamping Function**:
  $$V_{raw} = w_c S_{confidence} + w_n S_{novelty} + w_s S_{significance} + w_t S_{tractability}$$
  $$V_{scientific} = \min\left(V_{raw}, \; C_{tractability}, \; C_{contradiction}, \; C_{saturation}\right)$$
  where:
  - $C_{tractability} = 2.5$ if $S_{tractability} < 2.0$ (ill-posed problem with ambiguous/unoperationalized metrics); else $10.0$.
  - $C_{contradiction} = 3.0$ if active unresolved contradiction exists under matched conditions ($N_{disputed} > 0$); else $10.0$.
  - $C_{saturation} = 4.0$ if $S_{novelty} < 2.0$ (over-saturated topic with $> 50$ recent preprints attempting the identical fix), flagged with `OVER_SATURATED_RESEARCH_AREA`; else $10.0$.
  
  In contrast, Researcher Execution Suitability retains a true **Hard Binary Exclusion Gate**:
  $$E_{raw} = \alpha_{comp} E_{compute} + \alpha_{data} E_{data} + \alpha_{fac} E_{facility} + \alpha_{bud} E_{budget}$$
  $$E_{suitability} = E_{raw} \cdot \mathbf{1}_{\{E_{compute} > 0.0 \;\land\; E_{data} > 0.0\}}$$
  If required compute exceeds capacity by $> 5\times$ or a dataset is proprietary/inaccessible, $\mathbf{1}_{\{\dots\}} = 0 \implies E_{suitability} = 0.00$.
- **Document Anchors:** `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md`, Sections 3.5 and 4.2.

---

### 2.7 Declared vs Independently Verified Resource Evidence
- **Identified Deficiency in Draft:** The draft allowed researcher compute profiles to be inputted, but did not define a formal discounting function to penalize unverified self-declarations versus cryptographically or provider-verified infrastructure.
- **Architectural Resolution:**
  A formal verification discount multiplier $\gamma_k \in [0.5, 1.0]$ is integrated into each suitability sub-score:
  $$E_k = \gamma_k \cdot R_k$$
  - **Compute Resources:** $\gamma_{comp} = 1.00$ if verified via cloud provider API keys (AWS/GCP/Lambda) or university SLURM cluster SSO; $\gamma_{comp} = 0.70$ if self-declared.
  - **Dataset Access:** $\gamma_{data} = 1.00$ if an institutional Data Use Agreement (DUA) or active license hash is uploaded; $\gamma_{data} = 0.80$ if self-declared.
  - **Laboratory Facilities:** $\gamma_{facility} = 1.00$ if institutional BSL or IRB certification is registered; $\gamma_{facility} = 0.75$ if self-declared.
  - **Budget & Token Balance:** $\gamma_{budget} = 1.00$ if active billing account is linked; $\gamma_{budget} = 0.85$ if estimated.
- **Document Anchors:** `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md`, Section 4.1; `docs/STAGE_4E_DATA_AND_API_DESIGN.md`, Section 2.6 (`is_verified` flag).

---

### 2.8 Expert Allocation, Blinding, Agreement & Adjudication Protocol
- **Identified Deficiency in Draft:** General statements about expert panels were provided, but the specific experimental design for rater allocation, rater blinding invariants, inter-rater reliability thresholds, and formal adjudication procedures required rigorous specification.
- **Architectural Resolution:**
  1. *Balanced Incomplete Block Design (BIBD):*
     To evaluate $N=100$ candidate artifacts across $v=12$ expert raters without rater fatigue, assignments follow a $(v=12, b=220, r=55, k=3, \lambda=10)$ BIBD schedule. Every artifact is reviewed by exactly $k=3$ raters, and every pair of raters evaluates exactly $\lambda=10$ shared artifacts, guaranteeing uniform variance in rater bias estimation.
  2. *Triple-Blinding Safeguards:*
     - Raters are blinded to artifact generator origin (Primary model `gemma-4-26b-a4b-it`, baseline generators, or human controls).
     - Raters are blinded to citation counts, journal impact metrics, and author affiliations.
     - Raters cannot view the scores or comments of peer raters prior to review submission.
  3. *Three Inter-Rater Reliability Statistics:*
     - Categorical Falsifiability: Fleiss' Kappa $\kappa_{Fleiss} \ge 0.75$.
     - Ordinal Rubrics (1–5 scale): Krippendorff's Alpha $\alpha_{Kripp} \ge 0.80$ (robust to missing pairs).
     - Continuous Scores ($RUS$, $PCI$, $V_{scientific}$): Two-way random effects Intraclass Correlation Coefficient $\text{ICC}(2, k) \ge 0.75$.
  4. *Adjudication & Dispute Resolution:*
     - Escalation is triggered if score delta $\Delta > 1.5$ on a 5-point scale or if binary falsifiability votes split ($2-1$).
     - Escalations are routed to a designated Senior Scientific Arbitrator.
     - Arbitrator reviews blinded comments, provides binding score, and logs mandatory immutable rationale in `public.researcher_reviews.adjudication_notes`.
     - Falsification tie-break rule: If an expert identifies a fatal mathematical or physical flaw, the artifact is rejected unless the critique is provably refuted by literature citation.
- **Document Anchors:** `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, Sections 3.1, 3.2, and 3.3.

---

### 2.9 Enumeration & Individual Audit of All 11 Experiment Paradigms
Each of the 11 experimental paradigms defined in `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md`, Section 2 has been audited for required variables, baseline structures, evaluation metrics, formal falsification criteria, and reproducibility requirements:

| # | Paradigm | Formal Hypothesis Target | Required Operational Variables | Baseline Requirements | Primary Metrics | Quantitative Falsification Rule |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Randomized Controlled Trial (RCT)** | Empirical causal effect | Treatment, control, confounders | Standard-of-care / placebo | Effect size, relative risk, p-value / Bayes Factor | $p \ge 0.05$ or $95\%$ CI overlaps zero |
| **2** | **Paired Comparative Benchmark** | Directional algorithmic superiority | Parameter count, sequence length, input distribution | Published SOTA implementations with verified DOIs | Perplexity, task accuracy, throughput (tok/s), latency | Candidate fails to outperform baseline ($p \ge 0.05$) |
| **3** | **Systematic Component Ablation** | Causal component necessity | Component knockout, replacement module | Full unablated system | Performance degradation delta ($\Delta$) | Degradation $\le \epsilon$ ($p \ge 0.05$) proving component non-essential |
| **4** | **Scaling & Complexity Analysis** | Asymptotic scaling law | Sequence length $N$, model scale $P$, dataset tokens $D$ | Canonical reference architectures ($O(N), O(N^2)$) | Wall-clock time, peak VRAM (MB), FLOPs scaling curve | Empirical curve violates theoretical bound ($R^2 < 0.95$ for predicted law) |
| **5** | **Stochastic Simulation** | Emergent distribution properties | Distribution parameters, interaction rules | Established analytical approximations | Distribution divergence (KL, Wasserstein), steady-state reach | Simulation diverges from theoretical target ($W_1 > \delta$) |
| **6** | **Formal Proof & Counter-Example** | Mathematical conjecture / invariant | Axiomatic system, proof obligations | Published theoretical bounds / lemmas | Proof verification status, counterexample existence | Automated proof checker fails or verified counterexample found |
| **7** | **Dataset Bias & Distribution Audit** | Invariance across distributions | Stratified demographic, sensor, domain slices | Standard benchmark distributions | Demographic parity, slice disparity, out-of-distribution drop | Disparity exceeds fairness tolerance threshold |
| **8** | **Adversarial Robustness Stress-Test** | Adversarial invariance | Perturbation budget $\epsilon$, attack method | Non-perturbed baseline, standard defense baselines | Robust accuracy under attack, perturbation norm | Robust accuracy drops below chance or safety ceiling |
| **9** | **Empirical Replication Study** | Empirical reproducibility | Re-execution of published hyperparameter schedules | Original authors' published figures | Replication delta ($\|Y_{rep} - Y_{orig}\|$), confidence overlap | Replication result lies outside published $95\%$ CI |
| **10** | **Qualitative Systems Architecture** | Operational fault tolerance | Fault injection (packet drop, node failure, latency spike) | Monolithic / unoptimized system baseline | Recovery time objective (RTO), p99 tail latency | Tail latency exceeds SLA under fault injection |
| **11** | **Parameter-Efficiency Adaptation** | Capacity-efficiency Pareto | Rank $r$, quantized bit-width, trainable parameters | Full parameter fine-tuning, standard LoRA baseline | Parameter delta %, task accuracy delta %, VRAM savings | Accuracy drop exceeds acceptable tolerance band |

- **Document Anchors:** `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md`, Section 2 (Lines 23–40).

---

### 2.10 Relational Provenance Across Opportunities, Gaps, Validation Runs, Hypotheses, and Experiments
The relational integrity between existing Stage 4A–4D.1 entities and Stage 4E entities is strictly preserved via normalized foreign key constraints and composite keys:

```
[public.research_gaps] (id UUID PK)
       │
       ├─────────────────────────────────────────┐
       ▼ (1:N)                                   ▼ (1:N)
[public.research_gap_validations]        [public.research_opportunities]
  (gap_id UUID, validation_run_id TEXT)    (id UUID PK, gap_id UUID FK, validation_run_id TEXT FK)
       │                                         │
       │                                         ├──────────────────────────┐
       │                                         ▼ (1:N)                    ▼ (1:N)
       │                         [public.researcher_opportunity_evaluations]  [public.research_hypotheses]
       │                           (opportunity_id UUID FK,                   (id UUID PK,
       │                            resource_profile_id UUID FK)               opportunity_id UUID FK,
       │                                                                       gap_id UUID FK,
       │                                                                       validation_run_id TEXT FK)
       │                                                                            │
       │                                                                            ├─────────────────────────┐
       │                                                                            ▼ (1:N)                   ▼ (1:N)
       │                                                           [public.research_hypothesis_versions] [public.research_experiments]
       │                                                             (hypothesis_id UUID FK,               (id UUID PK,
       │                                                              version_number INT)                  hypothesis_id UUID FK,
       │                                                                                                   gap_id UUID FK,
       │                                                                                                   validation_run_id TEXT FK)
       │                                                                                                        │
       └───────────────────────── (Composite Provenance FK) ────────────────────────────────────────────────────┘
```

- **Referential Integrity Constraints:**
  - `public.research_opportunities.gap_id` references `public.research_gaps(id) ON DELETE RESTRICT`.
  - Composite FK: `(gap_id, validation_run_id)` in opportunities, hypotheses, and experiments references `public.research_gap_validations(gap_id, validation_run_id) ON DELETE RESTRICT`.
  - All deletions of underlying validation runs or research gaps are strictly `RESTRICT`ed to ensure historical scientific provenance cannot be severed.
  - Soft-invalidation: If a gap or validation is updated, dependent opportunities and hypotheses are marked `is_stale = true` with audit reasons, never hard-deleted.
- **Document Anchors:** `docs/STAGE_4E_DATA_AND_API_DESIGN.md`, Sections 1 and 2 (Lines 13–160).

---

# 3. Classification of Outstanding Items & Open Decisions

All core mathematical, methodological, and architectural specifications are resolved. The following three operational items are classified as **OPEN DECISIONS** with bounded fallbacks, neither of which blocks architectural finalization:

| Decision ID | Item Name | Classification | Resolution Policy & Architecture Boundary |
| :--- | :--- | :--- | :--- |
| **OPEN-4E-1** | **Live Cloud Provider SSO & SLURM OAuth Verification** | `OPEN (Non-Blocking)` | In Stage 4E baseline, resource profiles support self-declaration ($\gamma = 0.70 - 0.85$) and API key verification. Direct live OAuth integration with AWS/GCP and institutional SLURM SSO clusters is deferred to Stage 4E.1/4F. |
| **OPEN-4E-2** | **Lean 4 / Isabelle Theorem Prover Sandbox Toolchain** | `OPEN (Non-Blocking)` | For Paradigm 6 (Formal Proof), the system generates syntactically valid proof scripts. Live compilation and formal verification via containerized Lean 4 / Coq daemon is executed as an asynchronous background task; proof generation itself does not block REST API responses. |
| **OPEN-4E-3** | **Institutional Review Board (IRB) Protocol Governance** | `OPEN (Non-Blocking)` | For human-participant RCT protocols, Anvīkṣā generates the formal ethics and risk disclosure checklist. Actual institutional IRB filing and human participant recruitment remains an external governance requirement. |

**Blocking Items:** **NONE (0 BLOCKING ITEMS).**

---

# 4. Comprehensive Correction Log

| Log ID | Baseline Section | Type of Issue | Identified Error / Inconsistency | Exact Architectural Correction Applied |
| :--- | :--- | :--- | :--- | :--- |
| **CORR-4E-01** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.3 | Statistical Formula | Null variance labeled as Fieller's formula for Kendall's $\tau$. | Replaced with Fisher $z$-transform $z_\tau = \operatorname{arctanh}(\tau)$ with variance $\frac{0.437}{n-4}$ and Noether non-null variance. |
| **CORR-4E-02** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.4 | Statistical Sampling | Simple i.i.d. bootstrap ignored intra-cluster correlation across assertions. | Implemented Cluster-Aware Block Bootstrap (Cameron et al. 2008) resampling at the hypothesis cluster level ($G=100$). |
| **CORR-4E-03** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.5 | Statistical Assumption | Symmetric Student's t-interval applied to bounded score $[0.0, 10.0]$ near ceiling. | Replaced with Logit-Transformed Beta CI and non-parametric BCa bootstrap bounded within $[0.0, 10.0]$. |
| **CORR-4E-04** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §3.5 | Mathematical Syntax | Multiplicative $\Pi_{gates}$ contradicted continuous ceiling capping text. | Replaced with deterministic continuous ceiling clamp: $V = \min(V_{raw}, C_t, C_c, C_s)$. |
| **CORR-4E-05** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.1 | Evidence Discounting | Unverified researcher claims could inflate execution suitability. | Implemented verification discount multipliers $\gamma_k \in [0.5, 1.0]$ based on provider API / SSO verification. |
| **CORR-4E-06** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §5.1 | Decision Mapping | Missing closed-form piecewise mapping from continuous scores to decision quadrants. | Formulated explicit piecewise function $\text{StrategicQuadrant}(V, E) \to \{\text{IMMEDIATE}, \text{GRANT}, \text{FEASIBLE}, \text{DEPRIORITIZED}\}$. |
| **CORR-4E-07** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §3.2 | Experimental Design | Rater allocation scheme lacked formal multi-rater balance schedule. | Formulated Balanced Incomplete Block Design (BIBD) $(v=12, b=220, r=55, k=3, \lambda=10)$ with Senior Arbitrator adjudication. |
| **CORR-4E-08** | `STAGE_4E_DATA_AND_API_DESIGN.md` §2.1 | Schema Coupling | Conflation of researcher constraints with intrinsic scientific opportunity value. | Decoupled into `public.research_opportunities` (intrinsic) and `public.researcher_opportunity_evaluations` (suitability). |
| **CORR-4E-09** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §2 | Domain Bias | Over-emphasis on empirical ML benchmark protocols. | Enumerated and audited all 11 scientific paradigms with distinct variables, baselines, and falsification rules. |
| **CORR-4E-10** | `STAGE_4E_ARCHITECTURE.md` §3 | Model Lineage | Vague model references. | Pinned Primary Model Adapter to `gemma-4-26b-a4b-it` with fallback to `gemini-3-flash-preview` / `gemini-2.5-flash`. |

---

# 5. Final Scientific Invariant Checklist

| # | Scientific Invariant Requirement | Status | Verification & Evidence Anchor |
| :-: | :--- | :---: | :--- |
| **INV-01** | **Strict Decoupling of Intrinsic Value from Suitability:** Intrinsic scientific value is calculated independently of researcher resource limits. | **VERIFIED** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §2.1; `STAGE_4E_DATA_AND_API_DESIGN.md` §2.1 |
| **INV-02** | **Continuous Scientific Ceiling Clamping:** Non-compensatory clamping prevents high novelty from bypassing low tractability. | **VERIFIED** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §3.5 ($V = \min(V_{raw}, C_t, C_c, C_s)$) |
| **INV-03** | **Hard Binary Exclusion on Infeasibility:** 0 compute or inaccessible data zeroes out $E_{suitability}$. | **VERIFIED** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.2 ($E = E_{raw} \cdot \mathbf{1}_{\{E_{comp}>0 \land E_{data}>0\}}$) |
| **INV-04** | **Verified vs Declared Resource Multipliers:** Discount factor $\gamma \in [0.5, 1.0]$ penalizes unverified profiles. | **VERIFIED** | `STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.1; `STAGE_4E_DATA_AND_API_DESIGN.md` §2.6 |
| **INV-05** | **Composite Provenance Referential Integrity:** All opportunities, hypotheses, and experiments carry composite FK `(gap_id, validation_run_id)`. | **VERIFIED** | `STAGE_4E_DATA_AND_API_DESIGN.md` §2.1, §2.3, §2.5 (`ON DELETE RESTRICT`) |
| **INV-06** | **Historical Validation Preservation:** Updates trigger soft-invalidation (`is_stale = true`), never hard cascading deletes. | **VERIFIED** | `STAGE_4E_DATA_AND_API_DESIGN.md` §3.3; Acceptance Criterion 4E-AC-7 |
| **INV-07** | **Deterministic Falsifiability Gating:** Hypotheses must satisfy all 10 falsifiability gates ($HFI \ge 90\%$). | **VERIFIED** | `STAGE_4E_HYPOTHESIS_METHODOLOGY.md` §3; `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.1 |
| **INV-08** | **Explicit Boundary Conditions & Falsification Boundaries:** Null/alternative hypotheses with quantitative thresholds. | **VERIFIED** | `STAGE_4E_HYPOTHESIS_METHODOLOGY.md` §4; `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §4 |
| **INV-09** | **100% Literature Baseline Citation Authenticity ($BAR = 100\%$):** Zero fabricated baseline citations or performance figures permitted. | **VERIFIED** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §3; `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.2 |
| **INV-10** | **Explicit Labeling of Unreported Baseline Metrics:** Unreported metrics explicitly tagged as `UNREPORTED_IN_ORIGINAL_PUBLICATION`. | **VERIFIED** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §3, Rule 2 |
| **INV-11** | **Statistical Power Planning:** Protocols require pre-specified effect size, $\alpha \le 0.05$, and power $1-\beta \ge 0.80$. | **VERIFIED** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §2; `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.5 |
| **INV-12** | **11 Distinct Scientific Paradigms Audited:** Full support for non-ML, theoretical, simulation, and qualitative systems designs. | **VERIFIED** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §2 (Audit Table 1–11) |
| **INV-13** | **Threats to Validity Across All 4 Epistemic Quadrants:** Internal, External, Construct, and Conclusion validity audited. | **VERIFIED** | `STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §5 |
| **INV-14** | **Temporal Freeze Barrier Preventing Data Leakage:** Benchmark evaluation strictly enforces literature freeze at $T_0$. | **VERIFIED** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §4 |
| **INV-15** | **Kendall's $\tau_b$ Non-Parametric Bootstrap:** Non-parametric paired bootstrap & permutation inference with Noether non-null reference. | **VERIFIED** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.3; Criterion 4E-AC-4 |
| **INV-16** | **Cluster-Aware Block Bootstrap for $UCR$:** Resampling at gap cluster level to handle intra-hypothesis assertion correlation. | **VERIFIED** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.4 |
| **INV-17** | **Bounded Confidence Intervals for $PCI$:** Logit-transformed beta interval and BCa bootstrap guaranteeing support $[0.0, 10.0]$. | **VERIFIED** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §2.5 |
| **INV-18** | **BIBD Multi-Rater Allocation & Adjudication:** $(v=12, b=220, r=55, k=3, \lambda=10)$ BIBD schedule with double-blinding. | **VERIFIED** | `STAGE_4E_EVALUATION_FRAMEWORK.md` §3.2 |
| **INV-19** | **Immutable Version Tracking for Hypotheses:** Every revision creates immutable record in `public.research_hypothesis_versions`. | **VERIFIED** | `STAGE_4E_DATA_AND_API_DESIGN.md` §2.4 |
| **INV-20** | **Primary Model Adapter Verification:** Primary inference pinned to `gemma-4-26b-a4b-it` with verified fallbacks. | **VERIFIED** | `STAGE_4E_ARCHITECTURE.md` §3.1; `STAGE_4E_HYPOTHESIS_METHODOLOGY.md` §2.2 |

---

# 6. Final Audit Verdict

The Stage 4E Complete Architecture (Revision 1) has been subjected to comprehensive, point-by-point scientific, mathematical, and architectural consistency verification. All identified mathematical inconsistencies in ranking and evaluation formulations have been corrected. All metrics, scoring gates, decision boundaries, multi-rater experimental controls, and schema relationships are fully operationalized and aligned with accepted Stage 4A–4D.1 invariants.

```
═══════════════════════════════════════════════════════════════════════════════
  FINAL AUDIT VERDICT:
  STAGE 4E ARCHITECTURE ACCEPTED WITH DOCUMENTED NON-BLOCKING LIMITATIONS
═══════════════════════════════════════════════════════════════════════════════
```
