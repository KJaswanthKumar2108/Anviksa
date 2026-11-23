# Anvīkṣā — Stage 4E-IMP-03 Final Scientific Integrity Audit

**Document Version:** 1.0.0-STAGE4E-IMP03-INTEGRITY  
**Milestone:** Stage 4E — Research Opportunity Intelligence  
**Work Package:** 4E-IMP-03 — Experiment Protocol Synthesizer  
**Status:** **AUDITED, CORRECTED & VERIFIED**  
**Architecture:** Frozen Stage 4E Architecture + Final Scientific Integrity Amendment  

---

## 1. Executive Summary

This document establishes the final, authoritative scientific-integrity audit for Stage 4E-IMP-03 (Experiment Protocol Synthesizer). Following targeted adversarial inspection and verification against frozen architectural invariants, all statistical decision procedures, baseline provenance claims, and calibration semantics have been reconciled and verified against the live codebase, database, and API perimeter.

---

## 2. Statistical Confidence-Level & Alpha Contract

### 2.1 Formal Statistical Contract
In `server/experimentProtocolService.ts`, `evaluateStatisticalFalsification()` enforces an explicit mathematical contract binding the hypothesis criterion, significance level $\alpha$, tails (one-sided vs two-sided), confidence level $1 - \alpha$ (or $1 - 2\alpha$), and confidence interval bounds:

```typescript
export interface EvaluateStatisticalParams {
  pValue: number;
  observedEffect: number;
  ciLower: number;
  ciUpper: number;
  minimumMeaningfulEffect?: number;
  alpha?: number;
  tails?: 1 | 2;
  confidenceLevel?: number;
  ciMethod?: string;
  comparator?: string;
  hypothesisCriterion?: HypothesisCriterion;
  tostEquivalenceBound?: number;
  tostPLower?: number;
  tostPUpper?: number;
  nonInferiorityMargin?: number;
  directionOfImprovement?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
}
```

### 2.2 Criterion-Specific Invariants & Decision Hierarchy

1. **`SUPERIORITY_MINIMUM_EFFECT` ($\Delta \ge \Delta_{min}$):**
   - **Supported:** Lower confidence bound strictly exceeds minimum meaningful effect ($\text{ciLower} > \Delta_{min}$). An observed point estimate exceeding $\Delta_{min}$ does **not** suffice if the lower confidence bound falls at or below $\Delta_{min}$.
   - **Falsified:** Upper confidence bound is strictly below minimum meaningful effect ($\text{ciUpper} < \Delta_{min}$).
   - **Inconclusive:** Confidence interval overlaps or touches the boundary ($\text{ciLower} \le \Delta_{min} \land \text{ciUpper} \ge \Delta_{min}$).
   - **Confidence Level:** Bounded by nominal two-sided $1 - \alpha$ (e.g. 95% at $\alpha = 0.05$) or one-sided $1 - \alpha$.

2. **`SUPERIORITY_POSITIVE_EFFECT` ($\Delta > 0$):**
   - **Supported:** $\text{ciLower} > 0 \land \text{observedEffect} > 0 \land p < \alpha$.
   - **Falsified:** Statistically significant adverse effect strictly in opposing direction ($\text{ciUpper} < 0 \land \text{observedEffect} < 0 \land p < \alpha$).
   - **Inconclusive:** Non-significant result ($p \ge \alpha$ or interval crosses zero). Crucially, non-significance does not affirm the null (Altman & Bland, 1995).

3. **`EQUIVALENCE` (Two One-Sided Tests — TOST):**
   - **Practical Equivalence:** Requires prespecified equivalence bounds $[-\delta_{eq}, +\delta_{eq}]$. Under Schuirmann (1987) and Berger & Hsu (1996), rejecting both one-sided null hypotheses ($H_{01}: \Delta \le -\delta_{eq}$ and $H_{02}: \Delta \ge +\delta_{eq}$) at level $\alpha$ corresponds strictly to containment of the $(1 - 2\alpha)$ two-sided confidence interval! For $\alpha = 0.05$, the equivalent two-sided interval has confidence level $1 - 2(0.05) = 0.90$ (90% CI).
   - If two one-sided p-values ($p_{lower}, p_{upper}$) are supplied, both must satisfy $p < \alpha$. A single generic p-value cannot prove equivalence.
   - If CI touches the boundary ($\text{ciLower} = -\delta_{eq}$ or $\text{ciUpper} = +\delta_{eq}$), the outcome is `INCONCLUSIVE`.

4. **`NON_INFERIORITY`:**
   - One-sided evaluation against an explicit positive margin $\delta_{NI} > 0$. Distinct from equivalence (does not bound the upper effect).
   - For `HIGHER_IS_BETTER`:
     - $\mathbf{SUPPORTED} \iff \text{ciLower} > -\delta_{NI}$
     - $\mathbf{FALSIFIED} \iff \text{ciUpper} < -\delta_{NI}$
     - $\mathbf{INCONCLUSIVE} \iff \text{ciLower} \le -\delta_{NI} \land \text{ciUpper} \ge -\delta_{NI}$
   - For `LOWER_IS_BETTER` (e.g., latency, error rate):
     - $\mathbf{SUPPORTED} \iff \text{ciUpper} < +\delta_{NI}$
     - $\mathbf{FALSIFIED} \iff \text{ciLower} > +\delta_{NI}$
     - $\mathbf{INCONCLUSIVE} \iff \text{ciLower} \le +\delta_{NI} \land \text{ciUpper} \ge +\delta_{NI}$

### 2.3 Strict Rejection of Malformed Inputs (`INVALID_INPUT`)
Malformed, missing, or mathematically incompatible statistical inputs return `decision: 'INVALID_INPUT'`, rather than being silently converted into scientific `INCONCLUSIVE` findings:
- Missing, NaN, or infinite values in parameters.
- Probabilities out of range ($p < 0 \lor p > 1 \lor \alpha \le 0 \lor \alpha \ge 1$).
- Inverted confidence interval bounds ($\text{ciLower} > \text{ciUpper}$).
- Point estimate outside confidence interval bounds ($\text{observedEffect} \notin [\text{ciLower}, \text{ciUpper}]$).
- Confidence level mismatch ($|confidenceLevel - (1 - \alpha)| > 10^{-3}$ for two-sided tests, or $|confidenceLevel - (1 - 2\alpha)| > 10^{-3}$ for TOST).
- Missing or non-positive non-inferiority margin ($\delta_{NI} \le 0$ or undefined under `NON_INFERIORITY`).
- Missing or non-positive equivalence bound ($\delta_{eq} \le 0$ or undefined under `EQUIVALENCE`).

---

## 3. Disambiguation of Minimum-Effect Falsification (Case F)

### 3.1 Case F Analysis
In Case F:
- **Observed Effect:** -0.10
- **95% Confidence Interval:** [-0.35, 0.15]
- **Minimum Meaningful Effect ($\Delta_{min}$):** 0.50
- **Decision:** `FALSIFIED`

### 3.2 Scientific Distinction
Because the upper confidence limit $0.15 < 0.50$, the experimental data definitively falsifies the hypothesis that the true effect meets or exceeds the minimum meaningful threshold ($\Delta \ge 0.50$).

However, because the interval $[-0.35, 0.15]$ encompasses zero:
- **Minimum-effect hypothesis falsified:** `true` (rules out $\Delta \ge 0.50$).
- **Statistically established adverse effect:** `false` (does not prove $\Delta < 0$, because the true effect could be +0.05).
- **Positive effect established:** `false`.

The system persists these distinct attributes in `metadata`:
```typescript
metadata: {
  isMinimumEffectFalsified: true,
  isStatisticallyAdverseEffectEstablished: false,
  isPositiveEffectEstablished: false
}
```
And formats the explanation:
> *"The upper confidence limit (ciUpper = 0.150) is strictly less than the declared minimum meaningful effect size Delta_min = 0.50. The experimental data definitively rules out the claimed effect magnitude with statistical confidence. Note: Because the confidence interval [-0.350, 0.150] encompasses zero, this falsification does NOT establish a statistically significant adverse/negative effect, nor does it establish a positive effect; it strictly establishes that any true effect is below the declared threshold of practical significance."*

---

## 4. Experimental Paradigm Parity Audit

The 11 experimental paradigms are audited across all five system layers to guarantee 100% enum parity:

| # | Paradigm Name | Architecture Doc | TypeScript Enum | Supabase DB Schema | Runtime Validator | Frontend Options | Parity Status |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `RANDOMIZED_CONTROLLED_TRIAL` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 2 | `PAIRED_COMPARATIVE_BENCHMARK` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 3 | `SYSTEMATIC_COMPONENT_ABLATION` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 4 | `SCALING_AND_COMPLEXITY_ANALYSIS` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 5 | `STOCHASTIC_SIMULATION` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 6 | `FORMAL_PROOF_AND_COUNTER_EXAMPLE` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 7 | `DATASET_BIAS_AND_DISTRIBUTION_AUDIT` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 8 | `ADVERSARIAL_ROBUSTNESS_STRESS_TEST` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 9 | `EMPIRICAL_REPLICATION_STUDY` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 10 | `QUALITATIVE_SYSTEMS_ARCHITECTURE` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |
| 11 | `PARAMETER_EFFICIENCY_ADAPTATION` | Section 2 | `ExperimentalDesignType` | CHECK Constraint | `validateProtocol()` | Verified | **PERFECT MATCH** |

**Clarification on Reported Drift:** Non-architectural labels such as `LONGITUDINAL_COHORT_STUDY` and `CROSS_SECTIONAL_MULTI_COHORT` that appeared in previous conversational summaries were conversational artifacts. They do not exist in the frozen architecture, SQL schema, or TypeScript types. The 11 paradigms above are preserved identically across all system layers.

---

## 5. Threshold Provenance & Calibration Semantics

All hard-coded numerical values in experimental configurations are categorized according to their empirical and calibration reality:

1. **50.0 ms Latency Target (`PAIRED_COMPARATIVE_BENCHMARK`):**
   - Classification: `REQUIRES_RESEARCHER_SPECIFICATION` (`is_uncalibrated: true`).
   - Rationale: Dependent on deployment model scale, batch size, and inference engine.
2. **200.0 ms p99 Latency & 1,500 ms RTO (`QUALITATIVE_SYSTEMS_ARCHITECTURE`):**
   - Classification: `REQUIRES_RESEARCHER_SPECIFICATION` (`is_uncalibrated: true`).
   - Rationale: Reclassified from `ENGINEERING_REQUIREMENT`. Because Anvīkṣā has no fixed hardware cluster or production SLA contract, these interactive service heuristics require explicit calibration by the researcher.
3. **0.50% Parameter Budget Target (`PARAMETER_EFFICIENCY_ADAPTATION`):**
   - Classification: `REQUIRES_RESEARCHER_SPECIFICATION` (`is_uncalibrated: true`).
   - Rationale: Removed false attribution to Hu et al. (2021). The LoRA publication reports varying parameter ratios across model architectures and does not declare 0.50% as a universal bound.
4. **1.05 Peak Memory Scaling Exponent (`SCALING_AND_COMPLEXITY_ANALYSIS`):**
   - Classification: `ENGINEERING_REQUIREMENT` (`is_uncalibrated: false`).
   - Rationale: Prespecified engineering tolerance bound accommodating asymptotic linear complexity $O(N^{1.00})$ with 5% allocation padding. Explicitly not an empirical physical law.

---

## 6. Live Database Security & Integrity Invariants

The live Supabase instance (`dtlvtpntmtdmdawupylv`) was verified:
- **`public.research_experiments`:** Table active with RLS enabled; non-nil UUID sentinel check constraint verified.
- **`public.research_experiment_metrics`:** Composite foreign key to parent experiment with CASCADE delete verified.
- **`public.research_experiment_versions`:** Audit log table active with RLS enabled; protected by trigger `trg_experiment_version_immutable` prohibiting client-side UPDATE and DELETE.
- **Service-Role Privileged RPC:** `rpc_persist_research_experiment` revoked from `anon` and `public`; executable only via authenticated service-role client.
- **Staleness Propagation Trigger:** Updates to parent `research_hypotheses.is_stale` automatically propagate to child experiments with reason `UPSTREAM_HYPOTHESIS_STALE`.
- **API Perimeter:** `/api/research/experiments/:id/revise` and `/api/research/experiments/validate` strictly enforce Bearer token verification, user impersonation checks, and parent-gap visibility isolation. Anonymous or cross-tenant forged requests are rejected with 401 Unauthorized or 403 Forbidden.

---

## 7. Baseline Mapping Consistency & Documented Limitations

### 7.1 Baseline Consistency & Reconciled BAR Arithmetic
All 11 approved experimental paradigms have been mapped to primary published citations without forced or synthetic attributions:
- **9 paradigms possess directly reported / verified empirical evidence (Tier 1: 81.8%):**
  1. RCT: Ouyang et al. (2022) [Figure 3: 37.4% win-rate on 175B labeler distribution]
  2. Paired Benchmark: Dao et al. (2022) [Table 2: 3.0x speedup on GPT-2]
  3. Component Ablation: Vaswani et al. (2017) [Table 4: 0.9 BLEU degradation]
  4. Scaling Analysis: Kaplan et al. (2020) [Section 1.2: alpha_N = 0.076 exponent]
  5. Formal Proof: Gonthier (2008) [Mechanized Coq elaboration without unproven axioms]
  6. Bias Audit: Buolamwini & Gebru (2018) [Table 4: 34.4 pp error disparity]
  7. Adversarial Robustness: Gowal et al. (2020) defense evaluated via Croce & Hein (2020) AutoAttack ensemble [62.80% robust accuracy / 62.76% defense-reported]
  8. Replication Study: Gu & Dao (2023) Mamba-1.4B on The Pile [Table 3: 6.80 validation perplexity, LAMBADA ppl 5.04, acc 64.9%, HellaSwag 59.1%]
  9. Parameter Efficiency: Hu et al. (2021) LoRA [Table 2: 0.35% params, 87.5% MNLI accuracy]
- **2 paradigms possess qualified evidence (Tier 2: 18.2%):**
  10. Stochastic Simulation: Arjovsky et al. (2017) WGAN [W1 Earth Mover distance convergence bounded strictly to generative modeling; simulator priors, Markov kernels, and iterations require researcher specification]
  11. Qualitative Systems Architecture: Ongaro & Ousterhout (2014) Raft [150-300 ms election timeout; commit latency requires researcher specification]
- **0 unsupported baseline paradigms (Tier 3: 0.0%):**
  All 11 approved paradigms possess either direct published empirical verification or bounded qualified evidence.
- **Metric-Level Isolation for Unreported Values:**
  Raft commit latency (12.5 ms), ODE trajectory MSE (0.0142), and derived FlashAttention-2 forward latency (7.3 ms removed in favor of 225 TFLOPs/s) are strictly tracked in a separate metric-level register marked REQUIRES_RESEARCHER_SPECIFICATION.
- Extraneous ad-hoc entries (LONGITUDINAL_COHORT_STUDY, etc.) from previous exploratory drafts were verified as non-architectural conversational artifacts and are excluded from the codebase.

### 7.2 Documented Scientific Limitations
1. **Simulation Bounds:** Stochastic simulation algorithms evaluating Wasserstein divergence ($W_1$) rely on asymptotic convergence ($O(1/\sqrt{N})$); exact metric thresholds are task-specific and require researcher calibration.
2. **Systems Architecture Latency:** Interactive commit latency under network fault injection (e.g. 200 ms p99, 1,500 ms RTO) reflects interactive service heuristics rather than immutable physical constants; they are correctly marked `is_uncalibrated: true` requiring researcher environment specification.
3. **Hardware Comparability Warning:** When synthesized protocols target hardware differing from the canonical baseline (e.g. NVIDIA H100 vs NVIDIA V100), automated comparability warnings mandate local baseline re-execution.

---

## 8. Audit Verdict

```
================================================================================
VERDICT: 4E-IMP-03 VERIFIED WITH DOCUMENTED LIMITATIONS — CLOSED
================================================================================
```
