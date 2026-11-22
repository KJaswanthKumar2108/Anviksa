# Anvīkṣā — Stage 4E Opportunity Intelligence & Ranking Methodology
## Decoupled Scientific Value, Execution Suitability & Transparent Multi-Factor Decision Formalism
### Revision 1: Mathematical Rigor, Circularity Elimination & Scoring Integrity

**Document Version:** 4.1.0-STAGE4E-RANKING-REV1  
**Status:** REVISED METHODOLOGY SPECIFICATION ONLY (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E — Subsystem A  
**Baseline:** Version 4.1.0-REVISED (Stage 4E Revision 1)  
**Date:** 2026-11-20  

---

## 1. Objective & Epistemic Grounding

Subsystem A evaluates which cross-literature-validated research gaps represent significant open frontiers for scientific discovery, and determines which researchers are realistically equipped to pursue them.

### 1.1 Resolution of Revision 1 Methodological Issues
In the initial Stage 4E draft, two critical methodological errors were identified:
1. **Conflation of Scientific Importance with Researcher Resources:** Feasibility was included directly in the opportunity score. Consequently, an intrinsically monumental open scientific problem (e.g. general orphan protein folding or exact sub-quadratic attention) was artificially downgraded simply because a student or single-GPU lab lacked compute.
2. **Priority Score Circularity:** `S_priority` was simultaneously defined as one of the "six dimensions" and as the final weighted aggregate output.

**Revision 1 resolves both issues decisively by establishing two strictly orthogonal assessments:**
- **Assessment A: Intrinsic Scientific Opportunity Value ($V_{scientific} \in [0.0, 10.0]$):** Independent of any specific researcher, lab, compute cluster, or financial budget.
- **Assessment B: Researcher Execution Suitability ($E_{suitability} \in [0.0, 10.0]$):** Dependent on an active researcher's declared or verified profile.
- **Decision Output: Actionable Research Priority ($P_{actionable} \in [0.0, 10.0]$):** A transparent, decoupled composite that explicitly displays the trade-off.

```
                                 Cross-Literature Validated Gap (Stage 4D)
                                                    │
                                                    ▼
                             ┌──────────────────────────────────────────────┐
                             │ Non-Compensatory Scientific Eligibility Gate │
                             └──────────────────────┬───────────────────────┘
                                                    │ (CONFIRMED_UNRESOLVED / PARTIALLY_ADDRESSED)
                                                    ▼
         ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
         ▼                                                                                     ▼
[Assessment A: Intrinsic Scientific Value]                           [Assessment B: Researcher Execution Suitability]
- Evaluates Opportunity Independent of Researcher                    - Evaluates Execution Viability for Specific Lab
- Evidence Confidence ($S_{confidence}$)                             - Compute & Hardware Suitability ($E_{compute}$)
- Theoretical & Empirical Novelty ($S_{novelty}$)                    - Dataset & Licensing Access ($E_{data}$)
- Scientific Significance ($S_{significance}$)                       - Domain Expertise & Facilities ($E_{facility}$)
- Problem Well-Posedness ($S_{tractability}$)                        - Budget & Time Feasibility ($E_{budget}$)
         │                                                                                     │
         └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                                    │
                                                    ▼
                              [Actionable Research Priority ($P_{actionable}$)]
                                                    │
                                                    ▼
                                  [2D Strategic Decision Matrix & Plan]
```

---

## 2. Non-Compensatory Opportunity Eligibility Gates

An unaddressed research gap must pass through non-compensatory eligibility gates derived from the Stage 4D validation outcome before entering the ranking engine. High potential significance or theoretical novelty **can never compensate for an invalid epistemic foundation**.

### 2.1 Explicit Outcome Eligibility Matrix

| Stage 4D Validation Outcome | Opportunity Eligibility | Operational Requirements & Handling |
| :--- | :---: | :--- |
| **`CONFIRMED_UNRESOLVED`** | **ELIGIBLE** | Fully eligible for opportunity ranking. If corroborated via Standard multi-group replication ($\ge 2$ independent groups), enters standard pipeline. If substantiated via Hybrid or Landmark pathway, inherits `requiresHumanReview = true`. |
| **`PARTIALLY_ADDRESSED`** | **CONDITIONALLY ELIGIBLE** | Eligible **only if** the residual unaddressed boundary is explicitly isolated: (1) conditions under which the problem was resolved, (2) conditions where it remains open, (3) trade-offs introduced. The opportunity is scoped strictly to the *residual bottleneck*. |
| **`ADDRESSED`** | **DISQUALIFIED** | Conclusively resolved by subsequent literature. Cannot enter active ranking. Retained in historical knowledge graph for bibliographic context. |
| **`CONTRADICTED`** | **DISQUALIFIED FROM STANDARD OPPORTUNITIES** | Direct empirical dispute or premise falsification. Disqualified from standard gap opportunity ranking. Routed to the *Contradiction Resolution & Replication Workbench* as an empirical replication trial. |
| **`INSUFFICIENT_EVIDENCE`** | **DISQUALIFIED** | Literature coverage, retrieval completeness, or source independence is insufficient to substantiate an open gap. Must not be promoted to a ranked opportunity. |

---

## 3. Assessment A: Intrinsic Scientific Opportunity Value ($V_{scientific}$)

The intrinsic value of a scientific opportunity measures its epistemic rigor, degree of unexploredness, downstream impact, and mathematical well-posedness. **It is completely independent of researcher resources.**

### 3.1 Dimension A.1: Evidence Confidence ($S_{confidence} \in [0.0, 10.0]$)
- **Scientific Meaning:** The empirical robustness, peer consensus, and methodological rigor of the literature demonstrating that the limitation exists and remains open.
- **Inputs:** Number of independent corroborating papers ($N_{indep}$), number of partially dependent supporting papers ($N_{partial}$), evidence extraction class ($B_{epistemic}$), and existence of unresolved empirical disputes ($N_{disputed}$).
- **Mathematical Formulation:**
  $$S_{confidence} = \min\left(10.0, \; 3.0 \cdot \ln(1 + N_{indep} + 0.5 N_{partial}) - 5.0 \cdot \frac{N_{disputed}}{1 + N_{indep}} + B_{epistemic}\right)$$
  where:
  - $B_{epistemic} = 4.0$ for explicit author concessions with ablation tables.
  - $B_{epistemic} = 2.5$ for quantitative benchmark tables without explicit author concession.
  - $B_{epistemic} = 1.0$ for AI-inferred deductions.
- **Non-Compensatory Gate:** If any unresolved empirical dispute exists under comparable experimental conditions ($N_{disputed} > 0$), $S_{confidence}$ is strictly capped at $\le 3.0$.
- **Missing Data:** If evidence classification is unindexed, defaults to $B_{epistemic} = 1.0$.

### 3.2 Dimension A.2: Novelty Assessment ($S_{novelty} \in [0.0, 10.0]$)
- **Scientific Meaning:** The degree to which the opportunity represents genuinely unexplored scientific territory rather than an overcrowded, heavily saturated problem.
- **Negative Rule:** *Novelty is never inferred from the absence of a keyword in a small retrieved corpus.* High publication volume indicates high saturation, not high opportunity.
- **Inputs:** OpenAlex forward citation velocity in the problem cluster, number of active preprints targeting this specific bottleneck in the last 24 months ($N_{recent\_attempts}$), and baseline availability count ($N_{related\_baselines}$).
- **Mathematical Formulation:**
  $$S_{novelty} = 10.0 \cdot \exp\left(-\lambda_{domain} \cdot \frac{N_{recent\_attempts}}{1 + N_{related\_baselines}}\right) \cdot \left(1.0 - \text{SaturationPenalty}\right)$$
  where:
  - $\lambda_{domain} = 0.25$ for fast-moving domains (e.g. LLM fine-tuning), $0.10$ for capital-intensive domains (e.g. Structural Biology).
  - $\text{SaturationPenalty} \in [0.0, 0.7]$ measures the proportion of top-tier conference publications in the last 2 years addressing the identical bottleneck.
- **Missing Data:** If temporal literature velocity cannot be determined due to missing indexing, assigned `UNCERTAINTY: HIGH`, and $S_{novelty}$ is set to default neutral score $5.0$ with an explicit caveat notice.

### 3.3 Dimension A.3: Scientific Significance ($S_{significance} \in [0.0, 10.0]$)
- **Scientific Meaning:** The structural impact on downstream scientific discovery or engineering capabilities if this opportunity is successfully resolved.
- **Negative Rule:** *Citation count is not scientific significance.* A heavily cited benchmark paper may highlight a minor limitation; conversely, an under-cited foundational paper may define an essential theoretical barrier.
- **Inputs:** Structural centrality of the affected system in the research domain, breadth of downstream methodologies blocked by this limitation ($M_{blocked}$), and theoretical foundationalness.
- **Mathematical Formulation:**
  $$S_{significance} = 2.5 \cdot \text{FoundationalLevel} + 1.5 \cdot \min(4.0, \ln(1 + M_{blocked})) + 1.0 \cdot \text{CrossDomainBreadth}$$
  where:
  - $\text{FoundationalLevel} \in \{1: \text{Narrow parameter tuning}, 2: \text{Algorithmic efficiency}, 3: \text{Architectural paradigm}, 4: \text{Fundamental theoretical bound}\}$.
  - $M_{blocked}$: Number of downstream papers/methods referencing this limitation as their primary operational constraint.
  - $\text{CrossDomainBreadth} \in [0.0, 2.0]$: Measures transferability to other disciplines.
- **Missing Data:** If downstream citations are unindexed, defaults to baseline algorithmic level ($\text{FoundationalLevel} = 2$).

### 3.4 Dimension A.4: Research Tractability / Well-Posedness ($S_{tractability} \in [0.0, 10.0]$)
- **Scientific Meaning:** The mathematical and procedural clarity of the research question, the existence of formal baselines, and whether objective, quantitative metrics exist to evaluate whether progress has been made.
- **Inputs:** Mathematical clarity of operational question, availability of standardized evaluation harnesses, metric objectivity, and historical progress gradient.
- **Mathematical Formulation:**
  $$S_{tractability} = 3.0 \cdot \text{MetricObjectivity} + 3.0 \cdot \text{BaselineAvailability} + 4.0 \cdot \text{ProblemWellPosedness}$$
  where:
  - $\text{MetricObjectivity} \in [0.0, 1.0]$: $1.0$ for exact deterministic/mathematical metrics; $0.5$ for proxy metrics; $0.1$ for purely subjective qualitative evaluation.
  - $\text{BaselineAvailability} \in [0.0, 1.0]$: $1.0$ if verified reproducible baseline code exists; $0.0$ if zero baselines exist.
  - $\text{ProblemWellPosedness} \in [0.0, 1.0]$: Evaluates whether success and failure criteria can be unambiguously operationalized.
- **Missing Data:** If metric definitions are ambiguous or undefined in the literature, marked `NOT_OPERATIONALIZED` with $S_{tractability} \le 3.0$.

### 3.5 Composite Intrinsic Scientific Value Formulation & Scientific Qualification
Intrinsic scientific opportunity value is calculated via linear weighted sum across the four intrinsic dimensions, completely decoupled from researcher feasibility:

$$V_{scientific} = w_c S_{confidence} + w_n S_{novelty} + w_s S_{significance} + w_t S_{tractability\_methodological}$$

- **Default Weights:** $w_c = 0.30, \; w_n = 0.25, \; w_s = 0.30, \; w_t = 0.15$ (Normalized sum: $\sum w_i = 1.00$).
- **Methodological Tractability ($S_{tractability\_methodological}$):** Strictly assesses whether the problem statement is *methodologically well-posed* (operational success/failure metrics, baseline references, and falsifiable boundaries definable in principle). It does **not** evaluate computational cost, resource scarcity, or labor intensity.
- **Missing Literature Data Semantics:** If operational metrics or baseline performance are missing from the literature, the dimension is marked `STATUS: METRIC_UNSPECIFIED` with clear qualitative explanation. Missing data never silently inflicts an arbitrary numerical penalty.

### 3.6 Explicit Scientific Eligibility Gates & Discrete Qualification Indicators
Arbitrary scalar clamps (e.g. min-capping formulas) conflate distinct epistemic signals. Subsystem A replaces arbitrary scalar capping with explicit eligibility gates and discrete qualification indicators:

1. **Contradiction Qualification & Premise Eligibility:**
   - **`NO_CONTRADICTIONS_DETECTED`:** Validation confirms supportive or unresolved evidence across literature.
   - **`PREMISE_FALSIFIED`:** The fundamental premise or theoretical mechanism of the research gap is directly contradicted and falsified by verified literature evidence. $\implies$ **Hard Disqualification Gate:** The opportunity is classified as `INELIGIBLE_FALSIFIED_PREMISE` and excluded from prospective scientific ranking.
   - **`SCOPE_NARROWED`:** Contradictions exist only under specific boundary conditions (e.g. invalid for long contexts, but valid for short contexts). $\implies$ Does **not** cap $V_{scientific}$; emits `QUALIFICATION: BOUNDARY_CONDITION_RESTRICTED` with explicit domain exclusions.
   - **`CONTRADICTION_STATUS_UNKNOWN`:** No directly comparable literature found. Retains neutral status with tag `CONTRADICTION_STATUS_UNKNOWN` (no penalty applied).
2. **Literature Density & Research Frontier Classification:**
   - **`SPARSE_FRONTIER`:** Low literature volume; pioneer exploratory area.
   - **`ACTIVE_COMPETITIVE`:** Moderate volume of active contemporary investigations.
   - **`SATURATED_EXACT_REPETITION`:** High density of preprints attempting identical incremental variations. Reflected continuously in $S_{novelty}$ (distance from existing literature) and flagged with advisory tag `TOPIC_SATURATION_WARNING`, but not crushed by arbitrary numerical caps.
   - **`DIFFICULT_OPEN_DIRECTION`:** High significance combined with low published success rate across multiple labs. Categorized as a high-value breakthrough target, never penalized for difficulty.

---

## 4. Assessment B: Researcher Execution Suitability ($E_{suitability}$)

The execution suitability evaluates whether a specific researcher, lab, or institution can realistically pursue the opportunity given their declared or verified constraints.

### 4.1 Discrete Resource Evidence Representation & Anti-Inflation Controls
Arbitrary discount multipliers (e.g. multiplying self-declared resources by 0.70 or 0.80) lack empirical calibration. Subsystem A eliminates all arbitrary multipliers and represents each resource requirement as an explicit, auditable **Evidence Record**:

- **Resource Claim Schema:**
  - `resource_type`: (`GPU_COMPUTE`, `DATASET_ACCESS`, `FACILITY_LAB`, `FINANCIAL_BUDGET`).
  - `required_specification`: Quantitative requirement (e.g. `>= 4x A100 80GB VRAM`, `PhysioNet Credentialed DUA`).
  - `claimed_availability`: Quantitative capacity declared by researcher.
  - `evidence_source`: (`CLOUD_PROVIDER_API`, `INSTITUTIONAL_SSO`, `USER_SELF_DECLARATION`, `NONE`).
  - `verification_status`: Exactly one of:
    - **`VERIFIED_AVAILABLE`:** Cryptographically or API-confirmed active access.
    - **`DECLARED_AVAILABLE`:** Researcher self-declared capacity.
    - **`VERIFIED_UNAVAILABLE`:** Verified absence of required hardware or access rejection.
    - **`UNKNOWN`:** Incomplete or unentered profile data.
    - **`EXPIRED_EVIDENCE`:** Previously verified credential exceeded freshness TTL.
  - `verification_timestamp`: ISO timestamp of verification check.
  - `evidence_freshness_ttl_days`: Pinned TTL (e.g. 90 days for API tokens; 365 days for academic DUAs).
  - `confidence_or_uncertainty`: Qualitative indicator (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`).
  - `researcher_override_flag`: Boolean enabling researcher annotation with mandatory justification.

> [!IMPORTANT]
> **THE UNKNOWN EVIDENCE INVARIANT:**
> A verification status of `UNKNOWN` or `EXPIRED_EVIDENCE` must **never** be interpreted or scored as unavailable. Missing evidence represents absence of knowledge, not absence of capability.

### 4.2 Composite Suitability Formulation & Missing-Data Handling
$$E_{raw} = \alpha_{comp} E_{compute} + \alpha_{data} E_{data} + \alpha_{fac} E_{facility} + \alpha_{bud} E_{budget}$$
- **Default Dimension Weights:** $\alpha_{comp} = 0.40, \; \alpha_{data} = 0.30, \; \alpha_{fac} = 0.15, \; \alpha_{bud} = 0.15$ (Normalized sum: $\sum \alpha_i = 1.00$).

**Explicit Suitability Evaluation Rules:**
1. **Hard Exclusion Gate (`RESOURCE_BLOCKED`):** If any required resource is `VERIFIED_UNAVAILABLE` (e.g. required compute exceeds verified capacity by $>5\times$ or required dataset is strictly proprietary closed), $E_{suitability} = 0.00$.
2. **Missing Profile Data (`SUITABILITY_UNDETERMINED`):** If a required resource has verification status `UNKNOWN` or `EXPIRED_EVIDENCE`, the system does **not** impute zero. The evaluation emits $E_{suitability} = \text{null}$ with status `SUITABILITY_UNDETERMINED`.
3. **Transparent Provenance:** When compute or data is `DECLARED_AVAILABLE`, $E_{suitability}$ is computed from the claimed capacity without arbitrary numerical discounts, but displays the badge `EVIDENCE: UNVERIFIED_SELF_DECLARATION` alongside the score.

---

## 5. Decision Output: Strategic Research Decision Matrix

The final recommendation strictly separates intrinsic scientific ranking from researcher-specific strategic categorization.

> [!CAUTION]
> **ELIMINATION OF THE $P_{actionable}$ SCALAR COLLAPSE:**
> The previous scalar formulation ($0.60 V_{scientific} + 0.40 E_{suitability}$) is **permanently eliminated**. Blending intrinsic scientific value with researcher execution constraints into a single scalar collapses orthogonal dimensions and reintroduces the conflation between objective scientific merit and institutional wealth.
> 
> - **Scientific Ranking:** Candidates are ranked across literature strictly and solely by $V_{scientific}$.
> - **Operational Categorization:** Categorization for a specific lab is strictly determined by the 2D decision function `StrategicQuadrant(V_scientific, E_suitability)`.

### 5.1 The 2D Strategic Research Decision Matrix & Discrete Mapping
Each evaluated opportunity is mapped into exactly one operational category via the piecewise decision function:

$$\text{StrategicQuadrant}(V_{scientific}, E_{suitability}) = \begin{cases}
\text{SUITABILITY\_UNDETERMINED} & \text{if } E_{suitability} \text{ is null or UNKNOWN} \\
\text{IMMEDIATE\_HIGH\_PRIORITY} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} \ge 6.0 \\
\text{GRANT\_OR\_COLLABORATION\_TARGET} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} < 6.0 \\
\text{FEASIBLE\_RESEARCH\_OPPORTUNITY} & \text{if } V_{scientific} < 6.0 \land E_{suitability} \ge 6.0 \\
\text{DEPRIORITIZED} & \text{if } V_{scientific} < 6.0 \land E_{suitability} < 6.0
\end{cases}$$

```
  Execution
 Suitability
(E_suitability)
   ▲
10 ┼───────────────────────────────┬───────────────────────────────┐
   │ FEASIBLE RESEARCH OPPORTUNITY │    IMMEDIATE HIGH PRIORITY    │
   │  Low Scientific Significance  │  High Scientific Significance │
   │  High Lab Suitability         │  High Lab Suitability         │
   │  (Pedagogical / Student Trial)│  (Pursue Immediately)         │
 5 ┼───────────────────────────────┼───────────────────────────────┤
   │    DEPRIORITIZED              │    GRANT / COLLABORATION      │
   │  Low Scientific Significance  │  High Scientific Significance │
   │  Low Lab Suitability          │  Low Lab Suitability          │
   │  (Do Not Pursue)              │  (Seek Compute / Partner Lab) │
 0 ┴───────────────────────────────┴───────────────────────────────►
   0                               6                              10
                         Intrinsic Scientific Value (V_scientific)
```

**Key Epistemic Guarantee:** An independent researcher with an RTX 4090 GPU evaluating FlashAttention quadratic scaling will see:
- $V_{scientific} = 9.20$ (Monumental open architectural problem).
- $E_{suitability} = 2.40$ (Requires multi-node A100 cluster).
- Strategic Recommendation: **`GRANT_OR_COLLABORATION_TARGET`** (Seek institutional compute grant or partner with a high-compute institution).
The intrinsic value remains untarnished at 9.20!
- If researcher profile data is missing or unverified, the system marks $E_{suitability} = \text{null}$ with category **`SUITABILITY_UNDETERMINED`**, preserving $V_{scientific} = 9.20$ without penalization.

---

## 6. Sensitivity Analysis across Weighting Regimes

Because different research organizations operate under different mandates, Subsystem A allows researchers to inspect sensitivity under 4 formal weighting profiles:

| Weighting Regime | $w_c$ (Conf) | $w_n$ (Nov) | $w_s$ (Sig) | $w_t$ (Trac) | Intended Decision Context |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Balanced (Default)** | $0.30$ | $0.25$ | $0.30$ | $0.15$ | General scholarly evaluation & peer review |
| **Foundational Theory**| $0.25$ | $0.20$ | **$0.40$** | $0.15$ | Long-term academic research programs |
| **Rapid Exploration**  | $0.20$ | **$0.40$** | $0.20$ | $0.20$ | High-velocity AI / exploratory workshops |
| **Methodological Rigor**| **$0.40$** | $0.15$ | $0.20$ | **$0.25$** | Benchmarking, replication & formal methods |

Ranking stability across profiles is quantified using Kendall's $\tau$ and Krippendorff's $\alpha$. If rank changes by $> 10$ positions under minor weight shifts ($\pm 0.05$), the opportunity is flagged as `RANKING_SENSITIVE_TO_WEIGHTING`.

---

## 7. Structured Explanation & Audit Payload

Every evaluated opportunity outputs a deterministic, decoupled explainability payload:

```json
{
  "opportunity_id": "opp-98a71c2b-4f32-4d1e-8a21-9e7b6c5a4d3f",
  "gap_id": "0f0139a1-76d2-4f4c-b530-f98da61a48c5",
  "validation_run_id": "val-run-20261120-001",
  "decision_summary": {
    "intrinsic_scientific_value": 8.85,
    "researcher_execution_suitability": 3.20,
    "actionable_priority_score": 6.59,
    "strategic_quadrant": "GRANT_OR_COLLABORATION_TARGET"
  },
  "intrinsic_value_breakdown": {
    "evidence_confidence": { "score": 8.50, "rationale": "Corroborated by 3 independent groups with explicit ablation tables." },
    "novelty_assessment": { "score": 8.80, "rationale": "Low literature saturation; only 2 preprints in past 24 months targeting this specific bottleneck." },
    "scientific_significance": { "score": 9.40, "rationale": "Foundational architectural scaling bottleneck affecting all sequence modeling." },
    "research_tractability": { "score": 8.20, "rationale": "Exact memory and perplexity metrics well-formulated with open baseline code." }
  },
  "execution_suitability_breakdown": {
    "compute_suitability": { "score": 2.00, "rationale": "Requires multi-node A100/H100 cluster; exceeds declared 1x RTX 4090 capacity." },
    "data_accessibility": { "score": 10.00, "rationale": "LongBench and MQAR datasets are fully public open access." },
    "facility_requirements": { "score": 10.00, "rationale": "No wet-lab or IRB ethical approvals required." },
    "budget_feasibility": { "score": 4.00, "rationale": "Cloud compute execution cost estimated at $2,400, exceeding monthly budget." }
  },
  "non_compensatory_gates_passed": true,
  "active_warnings": ["COMPUTE_RESOURCE_DEFICIT"],
  "provisional_status_notice": "PROVISIONAL UNCALIBRATED METRIC: Scores represent mathematical multi-criteria decision indices and require Phase 5 benchmark calibration."
}
```

---

## 8. Empirical Calibration Protocol (Phase 5 Roadmap)

All opportunity priority scores are explicitly marked as **`PROVISIONAL_UNCALIBRATED_RESEARCH_PRIORITY`** until formal empirical calibration:
1. **Target Calibration Event:** $Y = \mathbf{1}(\text{Opportunity leads to published peer-reviewed contribution within 24 months})$.
2. **Evaluation Metric:** Expected Calibration Error ($\text{ECE} \le 0.08$) and Brier Score against expert panel consensus.
3. **Double-Blind Gold Standard:** Panel of 12 senior researchers adjudicating 100 historical research opportunities from 2020–2022 literature with known historical trajectories.
4. **Mandatory Caveat Notice:**
   > *"PROVISIONAL RESEARCH OPPORTUNITY INDEX: This score reflects mathematical synthesis of literature metrics, declared resource constraints, and citation topologies. It does not constitute an empirical guarantee of scientific breakthrough or project success."*
