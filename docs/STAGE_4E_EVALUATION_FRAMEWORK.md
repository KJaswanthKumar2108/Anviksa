# Anvīkṣā — Stage 4E Evaluation & Scientific Benchmark Framework
## Empirical Validation Metrics, Multi-Rater Annotation Methodology & Leakage-Free Temporal Benchmarks
### Revision 1: Rigorous Metric Formalization, Krippendorff's Alpha & Temporal Invariants

**Document Version:** 4.1.0-STAGE4E-EVAL-REV1  
**Status:** REVISED EVALUATION SPECIFICATION ONLY (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E  
**Baseline:** Version 4.1.0-REVISED (Stage 4E Revision 1)  
**Date:** 2026-11-20  

---

## 1. Executive Philosophy: Five Separate Evaluation Dimensions

A critical error in AI system evaluation is blending different dimensions into a single uninformative score. Stage 4E strictly separates **five distinct evaluation dimensions**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Functional Correctness (Software Engineering: APIs, RLS, Schemas)   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Evidence-Grounding Accuracy (Bibliometrics: Exact Quotes, Offsets)   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Scientific Quality (Methodology: Falsifiability, Variables, Controls)│
├────────────────────────────────────────────────────────────────────────┤
│ 4. Researcher Usefulness (Utility: Strategic Value, Feasibility Fit)   │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Statistical Calibration (Empirical Truth: ECE, Brier Score)         │
└────────────────────────────────────────────────────────────────────────┘
```

Synthetic integration fixtures evaluate Dimension 1 exclusively. Evaluating Dimensions 2 through 5 requires **authentic peer-reviewed literature**, **multi-rater expert panels**, and **temporal leakage-free back-testing**.

---

## 2. Rigorous Formalization of the Six Evaluation Metrics

Every proposed metric is formally specified below across all 10 required architectural criteria:

---

### 2.1 Metric 1: Hypothesis Falsifiability Index ($HFI$)
1. **Full Name:** Automated Hypothesis Falsifiability Index.
2. **Exact Measurement:** The proportion of generated scientific hypotheses that meet all 10 non-negotiable criteria of the Popperian falsifiability rubric.
3. **Mathematical Formula:**
   $$HFI = \frac{\sum_{i=1}^{N} \mathbf{1}\left(\text{RubricScore}(\mathcal{H}_i) \ge 8.0 \;\land\; \text{DeterministicGatesPassed}(\mathcal{H}_i) = \text{true}\right)}{N}$$
4. **Numerator & Denominator:**
   - *Numerator:* Count of generated hypotheses passing all deterministic gates (explicit independent/dependent variables, failure thresholds, anti-tautology check) and achieving AI audit $\ge 8.0/10.0$.
   - *Denominator:* Total count of synthesized hypotheses evaluated ($N$).
5. **Evaluation Unit:** Individual synthesized hypothesis artifact (`public.research_hypotheses`).
6. **Annotation Process:** Automated execution of the 10-point falsifiability pipeline followed by blind expert audit on a sample of $n=100$.
7. **Evaluation Dataset:** 100 candidate gaps across Benchmark Clusters A, B, and C.
8. **Target Threshold Justification:** $\mathbf{\ge 90.0\%}$ (Target). A production research tool cannot present unfalsifiable statements to investigators in more than 1 in 10 generations.
9. **Confidence Intervals & Uncertainty:** Reported as a Wilson score binomial confidence interval:
   $$\hat{p} \pm \frac{z}{1 + \frac{z^2}{N}}\sqrt{\frac{\hat{p}(1-\hat{p})}{N} + \frac{z^2}{4N^2}}$$
10. **Gaming & Failure Modes:** A model can game $HFI$ by appending trivial numeric clauses (*"...throughput will drop by >= 0.001%"*). Prevented by Gate 4 requiring realistic effect size justification.

---

### 2.2 Metric 2: Baseline Authenticity Rate ($BAR$)
1. **Full Name:** Literature Baseline Citation & Performance Authenticity Rate.
2. **Exact Measurement:** The percentage of experimental baselines in generated protocols that correspond to authentic, published scholarly literature with non-fabricated performance numbers.
3. **Mathematical Formula:**
   $$BAR = \frac{\sum_{i=1}^{M} \mathbf{1}\left(\text{PaperExistsInOpenAlex}(B_i) \;\land\; \text{DOIValid}(B_i) \;\land\; \text{NumbersMatchSourcePDF}(B_i)\right)}{M} \times 100\%$$
4. **Numerator & Denominator:**
   - *Numerator:* Count of baseline entries where the cited paper exists in OpenAlex/Crossref, the DOI resolves, and cited baseline performance numbers exactly match the published source PDF tables.
   - *Denominator:* Total count of cited baselines across all generated protocols ($M$).
5. **Evaluation Unit:** Individual baseline entry within an experiment protocol (`public.research_experiments.verified_baselines`).
6. **Annotation Process:** Automated verification against `public.research_papers` and DOI API, supplemented by human verification of extracted numbers against published tables.
7. **Evaluation Dataset:** All baseline references cited across benchmark evaluation runs ($M \ge 150$).
8. **Target Threshold Justification:** $\mathbf{100.0\%}$ (Mandatory Invariant). An automated scientific tool that invents baseline numbers or citations has zero scientific utility. Fabricated citations are a catastrophic failure mode; hence the target is strictly $100\%$.
9. **Confidence Intervals & Uncertainty:** Exact Clopper-Pearson binomial interval. A single verified hallucination triggers immediate acceptance failure.
10. **Gaming & Failure Modes:** A model might cite only well-known papers (e.g. BERT/ResNet) to ensure authenticity. Prevented by requiring baselines to match the specific task operational domain.

---

### 2.3 Metric 3: Ranking Concordance ($\tau_{rank}$)
1. **Full Name:** Kendall's Rank Correlation Concordance of Intrinsic Opportunity Value.
2. **Exact Measurement:** Rank-order agreement between the system's Intrinsic Scientific Opportunity Value ($V_{scientific}$) and the median ranking established by an independent expert panel.
3. **Mathematical Formula:**
   $$\tau_b = \frac{P - Q}{\sqrt{(P + Q + T_X)(P + Q + T_Y)}}$$
   where $P$ is concordant pairs, $Q$ is discordant pairs, and $T_X, T_Y$ are tie counts in algorithmic and human expert median rankings.
4. **Numerator & Denominator:**
   - *Numerator:* Excess of concordant pairs over discordant pairs ($P - Q$).
   - *Denominator:* Geometric mean of effective non-tied pairs: $\sqrt{(P + Q + T_X)(P + Q + T_Y)}$.
5. **Evaluation Unit:** Ordered list of research opportunities within a scientific domain.
6. **Annotation Process:** Expert panel ranks $n=20$ validated gaps in each domain from most to least promising independently.
7. **Evaluation Dataset:** 60 curated research gaps across Clusters A, B, and C.
8. **Target Threshold Justification:** $\mathbf{\tau \ge 0.70}$ (Target). Indicates strong positive monotonic association between algorithmic ranking and human expert consensus.
9. **Confidence Intervals, Uncertainty & Non-Parametric Inference:**
   - **Method Selection & Limitations of Asymptotic Normal Transforms:** While the Long & Rosenthal (1988) Fisher $z$-transform ($z_\tau = \operatorname{arctanh}(\tau)$, $\operatorname{Var}(z_\tau) \approx \frac{0.437}{n - 4}$) is frequently cited in psychological literature (often loosely referred to in historical literature in connection with Fieller, Hartley, & Pearson 1957 correlation studies), it strictly assumes underlying bivariate normality, independent observation pairs, and zero ties. In ranked benchmark evaluations ($n=20$ per domain), ranks exhibit ties and paired comparisons are statistically dependent.
   - **Primary Inference Standard: Non-Parametric Paired Bootstrap:** The primary confidence interval for $\tau_b$ is derived via **Non-Parametric Paired Stratified Bootstrap** resampling items $(X_i, Y_i)$ with replacement over $B = 2,000$ replications, computing $\tau_b$ on each resample and constructing the 95% BCa (bias-corrected and accelerated) confidence interval $[\tau_{b, L}, \tau_{b, U}]$.
   - **Hypothesis Testing ($H_0: \tau_b = 0$):** Conducted via exact Permutation Test shuffling the algorithmic ranking vector across 10,000 permutations.
   - **Asymptotic Reference:** Noether (1967) / Cliff (1993) non-null variance with tie corrections is reported as an asymptotic reference only:
     $$\sigma^2_{\tau_b} = \frac{4}{n} \left[ \frac{1}{n} \sum_{i=1}^n (P_i - Q_i)^2 - \tau_b^2 \right]$$
10. **Gaming & Failure Modes:** Susceptible to rater bias toward high-citation topics. Controlled by blinding annotators to citation counts and providing only the scientific problem statements.

---

### 2.4 Metric 4: Unsupported Claim Rate ($UCR$)
1. **Full Name:** Proportion of Unsupported Scientific Claims in Synthesized Rationale.
2. **Exact Measurement:** The proportion of causal assertions or mechanistic claims in a hypothesis rationale that lack empirical literature grounding or violate domain physics/mathematics.
3. **Mathematical Formula:**
   $$UCR = \frac{\sum_{j=1}^{K} \mathbf{1}\left(\text{ClaimHasNoEvidenceRef}(C_j) \;\lor\; \text{ViolatesDomainLaws}(C_j)\right)}{K} \times 100\%$$
4. **Numerator & Denominator:**
   - *Numerator:* Number of distinct causal assertions in the scientific rationale flagged as unsupported or ungrounded.
   - *Denominator:* Total number of causal assertions identified in the synthesized rationale text ($K$).
5. **Evaluation Unit:** Individual causal clause in hypothesis rationale statements.
6. **Annotation Process:** Double-blind expert panel labels each causal claim as: Grounded in Citation, Reasonable Extrapolation, or Unsupported Hallucination.
7. **Evaluation Dataset:** 100 randomly sampled generated hypotheses ($K \ge 400$ total causal assertions).
8. **Target Threshold Justification:** $\mathbf{\le 5.0\%}$ (Target). Guarantees that at least $95\%$ of all generated explanatory statements are verifiable.
9. **Confidence Intervals & Uncertainty:**
   - Simple i.i.d. bootstrap is invalid due to intra-hypothesis clustering of assertions.
   - Stage 4E mandates a **Cluster-Aware Block Bootstrap** (Cameron, Gelbach, & Miller 2008): Resampling occurs at the hypothesis/gap cluster level $G = 100$ with $B = 1,000$ resamples:
     $$\widehat{\text{Var}}_{cluster}(\widehat{UCR}) = \frac{G}{G - 1} \sum_{g=1}^G \left(\mathbf{u}_g - \bar{\mathbf{u}}\right)^2$$
     where $\mathbf{u}_g$ is the contribution of cluster $g$ to the overall rate.
10. **Gaming & Failure Modes:** A model might output vague or platitudinous claims (*"transformers process tokens"*). Prevented by pairing $UCR$ with $HFI$ and novelty evaluation.

---

### 2.5 Metric 5: Protocol Completeness Index ($PCI$)
1. **Full Name:** Structural & Operational Protocol Completeness Index.
2. **Exact Measurement:** Degree to which a generated experiment protocol provides all necessary technical parameters required for independent execution.
3. **Mathematical Formula:**
   $$PCI = \frac{1}{N} \sum_{i=1}^{N} \left(\frac{1}{10} \sum_{c=1}^{10} w_c \cdot \mathbf{1}(\text{CriterionMet}(\mathcal{P}_i, c))\right) \times 10.0$$
   Criteria: (1) Hardware specified, (2) VRAM estimated, (3) Software dependencies pinned, (4) Datasets with licenses, (5) Metrics with units, (6) Statistical power plan, (7) Random seed schedule, (8) Ablation plan, (9) Falsification threshold defined, (10) Threats to validity analyzed.
4. **Numerator & Denominator:** Sum of weighted satisfied criteria divided by 10, scaled to $[0.0, 10.0]$.
5. **Evaluation Unit:** Generated experiment protocol artifact (`public.research_experiments`).
6. **Annotation Process:** Automated structural schema validation combined with expert verification that parameters are realistic.
7. **Evaluation Dataset:** 50 synthesized experiment protocols.
8. **Target Threshold Justification:** $\mathbf{\ge 8.5 / 10.0}$ (Target). Ensures protocols are directly operationalizable.
9. **Confidence Intervals, Uncertainty & Principled Endpoint Handling:**
   - **Endpoint Singularities in Raw Logit Transforms:** The standard logit transform $\operatorname{logit}(p) = \ln(p / (1-p))$ has singularities at $p=0.0$ and $p=1.0$ ($PCI = 0.0$ or $10.0$). Relying on arbitrary $\epsilon$-adjustments lacks theoretical justification and distorts tail probabilities.
   - **Primary Standard: Bounded Non-Parametric BCa Bootstrap:** Stage 4E establishes the **Non-Parametric BCa Bootstrap directly on the support $[0.0, 10.0]$** as the primary inference method. Resampling protocols $\mathcal{P}_i$ ($B = 2,000$) preserves exact score distributions, corrects for skewness and acceleration near ceiling, and guarantees confidence bounds lie strictly within $[\min(\mathcal{P}), \max(\mathcal{P})] \subseteq [0.0, 10.0]$ without transforming scales or suffering boundary singularities.
   - **Principled Parametric Alternative: Bayesian Squeezed Beta Transformation (Smithson & Verkuilen 2006):** When a parametric interval is required, raw proportions $p = PCI / 10.0 \in [0, 1]$ are squeezed via Bayesian uniform prior shrinkage:
     $$p^* = \frac{p \cdot (N - 1) + 0.5}{N}$$
     This maps $[0, 1]$ strictly into $\left[\frac{0.5}{N}, 1 - \frac{0.5}{N}\right]$ using a mathematically grounded $Beta(0.5, 0.5)$ shrinkage prior. The unbounded variable $y = \operatorname{logit}(p^*)$ is then modeled via Student's t-interval and back-transformed to the $[0.0, 10.0]$ scale via the inverse logit function.
10. **Gaming & Failure Modes:** A protocol can fill fields with dummy text ("seed=42", "metric=accuracy"). Mitigated by checking semantic consistency between metrics and hypothesis variables.

---

### 2.6 Metric 6: Researcher Utility Score ($RUS$)
1. **Full Name:** Active Researcher Utility & Willingness-to-Adopt Score.
2. **Exact Measurement:** Subjective assessment by active PhD and postdoctoral researchers on a 5-point Likert scale: *"Would you consider executing this protocol or using it as the foundation for a research project?"*
3. **Mathematical Formula:**
   $$RUS = \frac{1}{N_{surveys}} \sum_{s=1}^{N_{surveys}} \text{LikertRating}_s \quad (\text{Range: } 1.0 - 5.0)$$
4. **Numerator & Denominator:** Sum of Likert ratings divided by total completed evaluations ($N_{surveys} \ge 60$).
5. **Evaluation Unit:** Completed researcher review survey per experiment protocol.
6. **Annotation Process:** Blind survey administered to external researchers provided with the gap, hypothesis, and protocol.
7. **Evaluation Dataset:** 30 protocols evaluated by at least 2 independent researchers each.
8. **Target Threshold Justification:** $\mathbf{\ge 4.2 / 5.0}$ (Target). Reflects strong positive endorsement from the scientific community.
9. **Confidence Intervals & Uncertainty:** Standard error of the mean with 95% Student's t-distribution interval.
10. **Gaming & Failure Modes:** Social desirability bias (raters being overly polite). Controlled by strictly anonymous review and including deliberately flawed control protocols to verify rater vigilance.

---

## 3. Multi-Rater Expert Annotation Methodology

### 3.1 Inter-Rater Reliability Statistics
Cohen's kappa ($\kappa$) is mathematically invalid for multi-rater panels ($>2$ annotators) or incomplete ratings. Stage 4E mandates three specific statistical measures based on data type:

1. **Fleiss' Kappa ($\kappa_{Fleiss}$):** Applied to categorical ratings across all annotators:
   - Evaluates inter-rater agreement on whether a hypothesis passes all deterministic falsifiability gates (Binary: Falsifiable vs Unfalsifiable).
   - Acceptance Standard: $\kappa_{Fleiss} \ge 0.75$.
2. **Krippendorff's Alpha ($\alpha_{Kripp}$):** Applied to ordinal rubric ratings (e.g. 1–5 quality scales) and datasets with missing ratings:
   - Robust to missing data when not all annotators evaluate all artifacts.
   - Acceptance Standard: $\alpha_{Kripp} \ge 0.80$.
3. **Intraclass Correlation Coefficient ($\text{ICC}(2, k)$):** Applied to continuous numerical scores ($RUS$, $PCI$, $V_{scientific}$):
   - Uses two-way random effects model measuring absolute agreement across $k$ raters:
     $$\text{ICC}(2, k) = \frac{\text{MS}_R - \text{MS}_E}{\text{MS}_R + \frac{\text{MS}_C - \text{MS}_E}{n}}$$
   - Acceptance Standard: $\text{ICC} \ge 0.75$.

### 3.2 Expert Panel Structure, Allocation (BIBD), Blinding & Adjudication
- **Panel Composition & Domain Expertise Allocation:**
  - 12 independent external researchers holding Ph.D. degrees, partitioned equally across 3 focal scientific domains: 4 Machine Learning Systems, 4 Computational Biology, and 4 Natural Language Processing.
  - **Expertise Boundary Rules:** Substantive domain claims (e.g. biological mechanism validity, mathematical proof steps) must be evaluated by experts qualified in that specific domain. Cross-domain evaluation is strictly restricted to general methodological criteria (e.g. statistical power, variable isolation).
- **Balanced Incomplete Block Design (BIBD) Combinatorics:**
  - Artifacts are allocated according to a symmetric $(v=12, b=220, r=55, k=3, \lambda=10)$ BIBD schedule.
  - *Design Equations Verified:* $v \cdot r = 12 \cdot 55 = 660$; $b \cdot k = 220 \cdot 3 = 660$; $\lambda(v - 1) = 10 \cdot 11 = 110 = r(k - 1) = 55 \cdot 2$.
  - *Invariant:* Every artifact receives exactly $k=3$ independent ratings. Every pair of raters evaluates exactly $\lambda=10$ shared artifacts, guaranteeing uniform variance in rater effect estimation.
- **Conflict of Interest (COI) Management:**
  - All raters declare institutional affiliations, direct collaborators, and co-authors within the preceding 48 months.
  - If a rater has a COI with any cited baseline or author in an artifact, an automated permutation of the block assignment replaces the conflicted rater with an unconflicted domain peer while preserving the $\lambda$ balance schedule.
- **Handling Incomplete or Missing Ratings:**
  - Missing ratings from rater dropouts violate strict BIBD orthogonality.
  - To prevent distortion, missing observations are analyzed using **Linear Mixed-Effects Models (LMM)** with rater random effects and artifact fixed effects, or Multiple Imputation via Chained Equations (MICE), rather than classical ANOVA which assumes complete balance.
- **Strict Double-Blinding:**
  - Raters cannot see whether an artifact was produced by the primary model (`gemma-4-26b-a4b-it`), human experts, or baseline generators.
  - Raters are blinded to citation counts, journal impact factors, author identities, and the ratings/comments of peer annotators.
- **Formal Disagreement Resolution & Adjudication Protocol:**
  - *Trigger 1 (Continuous Rating Delta):* If $\max_{i,j}(R_i - R_j) > 1.5$ on a 5-point Likert scale.
  - *Trigger 2 (Binary Falsifiability Discordance):* If rater votes on hypothesis falsifiability split ($2-1$).
  - *Adjudication Process:* The artifact and all blinded rater critiques are submitted to a Senior Scientific Arbitrator. The Arbitrator provides a binding adjudication accompanied by an immutable written rationale recorded in `public.researcher_reviews.adjudication_notes`.
  - *Tie-Breaking Policy:* If 2 raters pass and 1 fails, the fail critique must be explicitly refuted by the Arbitrator to approve; unresolved physical or mathematical counterexamples automatically reject the artifact.

> [!WARNING]
> **OPERATIONAL VALIDATION DISCLAIMER:**
> Satisfying the combinatorial algebraic equations of $(v=12, b=220, r=55, k=3, \lambda=10)$ confirms mathematical existence, but does **not** constitute empirical operational validation. Operational validity depends on the successful execution and calibration of the Pilot Annotation Study ($N=20$) to confirm rater reliability ($\alpha_{Kripp} \ge 0.70$) prior to full benchmark rollout.

### 3.3 Pilot Annotation Study Protocol
Prior to executing the full benchmark evaluation, a **Pilot Annotation Study** must be conducted:
- Sample: $N = 20$ artifacts evaluated by 3 raters.
- Objective: Measure baseline $\alpha_{Kripp}$, identify ambiguous rubric language, and calibrate rater scoring ranges.
- If pilot $\alpha_{Kripp} < 0.70$, the rubric definitions must be refined and annotators re-calibrated before launching the main evaluation.

---

## 4. Leakage-Free Temporal Benchmarking Protocol

Using retrospective literature trajectories (e.g. 2020–2022 papers) to validate opportunity ranking poses severe risks of **data leakage** (future citations and subsequent breakthroughs improperly informing past predictions).

Stage 4E establishes a **strict temporal freeze protocol**:

```mermaid
flowchart LR
    subgraph T_PRE["Historical Window: t <= T_0 (e.g. Dec 31, 2021)"]
        F1["Frozen Literature Corpus<br/>(Only papers published <= T_0)"]
        F2["Frozen Discovery Horizon<br/>(Citations & Metadata <= T_0)"]
        F3["Stage 4E Ranking Execution<br/>(Calculates V_scientific at T_0)"]
        F1 --> F2 --> F3
    end

    subgraph T_BARRIER["IMPERMEABLE TEMPORAL LEAKAGE BARRIER"]
        BARRIER["Zero future citations (t > T_0) permitted in input features"]
    end

    subgraph T_POST["Outcome Window: T_0 < t <= T_0 + 24 months"]
        OUT1["Ground Truth Tracking<br/>(Did follow-up literature resolve gap?)"]
        OUT2["Actual Experimental Replications<br/>(Published trials 2022-2023)"]
    end

    F3 --> BARRIER
    BARRIER --> OUT1 & OUT2
```

### 4.1 Strict Temporal Invariants
1. **Corpus Freezing ($t \le T_0$):** When evaluating a historical gap from date $T_0$, the literature discovery engine is restricted exclusively to OpenAlex records with `publication_date <= T_0`.
2. **Zero Future Feature Leakage:** Citation counts, forward citations, and related works published after $T_0$ are strictly excluded from $S_{novelty}$ and $S_{significance}$ calculations.
3. **Retrieval-Date Provenance:** Every query stores `temporal_cutoff_date = T_0`.
4. **Separation of Outcome Labels:** The future trajectory (citations and papers published in $t > T_0$) is used **exclusively as the target label** to measure whether high-ranked opportunities actually yielded breakthroughs, and never as an input feature.
5. **Four Distinct Ground-Truth Concepts:** The evaluation framework strictly distinguishes:
   - *Historical Prediction Accuracy:* Did the model identify what was open at $T_0$?
   - *Expert Assessment:* Did expert researchers agree it was an important problem?
   - *Citation Velocity:* Did the problem cluster attract subsequent publication volume?
   - *Actual Scientific Impact:* Did resolution of the gap yield lasting algorithmic or physical improvements?
