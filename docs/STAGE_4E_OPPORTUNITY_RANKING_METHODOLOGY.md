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

### 3.5 Composite Intrinsic Scientific Value Formulation
$$V_{scientific} = \left(w_c S_{confidence} + w_n S_{novelty} + w_s S_{significance} + w_t S_{tractability}\right) \cdot \Pi_{scientific\_gates}$$
- **Default Weights:** $w_c = 0.30, \; w_n = 0.25, \; w_s = 0.30, \; w_t = 0.15$ (Sum = $1.00$).
- **Non-Compensatory Gates ($\Pi_{scientific\_gates}$):**
  - If $S_{tractability} < 2.0$ (ill-posed problem with no definable metric), $V_{scientific}$ is capped at $\le 2.5$.
  - If active unresolved contradiction exists under matched conditions, $V_{scientific}$ is capped at $\le 3.0$.
  - If $S_{novelty} < 2.0$ (over-saturated topic with $> 50$ recent preprints attempting the identical fix), $V_{scientific}$ is capped at $\le 4.0$ with warning `OVER_SATURATED_RESEARCH_AREA`.

---

## 4. Assessment B: Researcher Execution Suitability ($E_{suitability}$)

The execution suitability evaluates whether a specific researcher, lab, or institution can realistically pursue the opportunity given their declared or verified constraints.

### 4.1 Sub-Dimensions of Suitability
1. **Compute & Accelerator Suitability ($E_{compute} \in [0.0, 10.0]$):**
   - Matches required GPU architecture (e.g. NVIDIA A100/H100), VRAM capacity, node count, and wall-clock hours against researcher's declared profile.
   - If required compute $\le$ verified capacity $\implies 10.0$.
   - If required compute exceeds capacity by $2\times \implies 5.0$.
   - If required compute exceeds capacity by $> 5\times \implies 0.0$ (Gate Triggered).
2. **Dataset & Asset Accessibility ($E_{data} \in [0.0, 10.0]$):**
   - Evaluates whether required datasets are Public Open ($10.0$), Gated Academic ($7.0$), Restricted Clinical ($3.0$), or Proprietary Closed ($0.0$).
3. **Domain Expertise & Facility Requirements ($E_{facility} \in [0.0, 10.0]$):**
   - Evaluates whether the experiment requires specialized wet-lab biosafety facilities, hardware testbenches, or institutional review board (IRB) ethical approvals.
4. **Budget & Timeline Feasibility ($E_{budget} \in [0.0, 10.0]$):**
   - Evaluates estimated API token costs, cloud compute billing, and execution timeline against the researcher's declared monthly constraints.

### 4.2 Composite Suitability Formulation
$$E_{suitability} = \left(\alpha_{comp} E_{compute} + \alpha_{data} E_{data} + \alpha_{fac} E_{facility} + \alpha_{bud} E_{budget}\right) \cdot \Pi_{suitability\_gates}$$
- **Default Weights:** $\alpha_{comp} = 0.40, \; \alpha_{data} = 0.30, \; \alpha_{fac} = 0.15, \; \alpha_{bud} = 0.15$.
- **Hard Exclusion Gate ($\Pi_{suitability\_gates}$):** If a dataset is proprietary/inaccessible or hardware requirement exceeds capacity by $> 5\times$, $E_{suitability} = 0.0$.

---

## 5. Decision Output: Actionable Research Priority ($P_{actionable}$)

The final recommendation combines intrinsic scientific value and execution suitability without conflating their meanings:

$$P_{actionable} = \beta \cdot V_{scientific} + (1.0 - \beta) \cdot E_{suitability}$$
- **Default Balance Factor:** $\beta = 0.60$ (prioritizing intrinsic scientific value while penalizing infeasible execution).

### 5.1 The 2D Strategic Research Decision Matrix

```
  Execution
 Suitability
(E_suitability)
   ▲
10 ┼───────────────────────────────┬───────────────────────────────┐
   │    FEASIBLE EXERCISE          │    IMMEDIATE HIGH PRIORITY    │
   │  Low Scientific Significance  │  High Scientific Significance │
   │  High Lab Suitability         │  High Lab Suitability         │
   │  (Pedagogical / Student Trial)│  (Pursue Immediately)         │
 5 ┼───────────────────────────────┼───────────────────────────────┤
   │    DEPRIORITIZED              │    GRANT / COLLABORATION      │
   │  Low Scientific Significance  │  High Scientific Significance │
   │  Low Lab Suitability          │  Low Lab Suitability          │
   │  (Do Not Pursue)              │  (Seek Compute / Partner Lab) │
 0 ┴───────────────────────────────┴───────────────────────────────►
   0                               5                              10
                         Intrinsic Scientific Value (V_scientific)
```

**Key Epistemic Guarantee:** An independent researcher with an RTX 4090 GPU evaluating FlashAttention quadratic scaling will see:
- $V_{scientific} = 9.20$ (Monumental open architectural problem).
- $E_{suitability} = 2.40$ (Requires multi-node A100 cluster).
- Strategic Recommendation: **`HIGH_VALUE_PARTNERSHIP_TARGET`** (Seek institutional compute grant or partner with a high-compute institution).
The intrinsic value remains untarnished at 9.20!

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
