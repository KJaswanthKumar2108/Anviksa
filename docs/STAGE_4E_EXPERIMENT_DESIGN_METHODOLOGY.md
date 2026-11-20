# Anvīkṣā — Stage 4E Experiment Protocol Design Methodology
## Reproducible Experimental Protocols, Verified Literature Baselines & Falsification Thresholds
### Revision 1: 11-Paradigm Formal Audit, Non-Statistical Falsification & Threshold Rigor

**Document Version:** 4.1.0-STAGE4E-EXPERIMENT-REV1  
**Status:** REVISED METHODOLOGY SPECIFICATION ONLY (Implementation Strictly Prohibited)  
**Milestone:** Stage 4E — Subsystem C  
**Baseline:** Version 4.1.0-REVISED (Stage 4E Revision 1)  
**Date:** 2026-11-20  

---

## 1. Executive Objective: Executable Protocols over Speculative Suggestions

A common flaw in automated research assistants is outputting generic bulleted suggestions such as: *"Train a model on ImageNet and measure accuracy."* This does not constitute an experimental design.

Subsystem C translates verified scientific hypotheses into **comprehensive, reproducible experimental protocols**. A scientific protocol must provide sufficient operational detail that an independent researcher or laboratory can execute the experiment, replicate the measurements, and unambiguously determine whether the hypothesis has been supported or falsified:

$$\text{Hypothesis } \mathcal{H} \quad \xrightarrow{\text{Subsystem C}} \quad \text{Protocol } \mathcal{P} = \langle \text{DesignType}, \text{Baselines}, \text{Metrics}, \text{Hardware}, \text{Ablations}, \text{FalsificationCriteria} \rangle$$

---

## 2. In-Depth Audit of the 11 Experimental Design Paradigms

To avoid forcing machine learning benchmark conventions onto non-ML or theoretical research domains, Subsystem C provides explicit structural specifications for 11 distinct research paradigms:

| # | Experimental Paradigm | Hypothesis Type | Required Variables / Formal Assumptions | Relevant Literature Baselines | Primary Evaluation Metrics | Formal Falsification / Rejection Criteria | Reproducibility Requirements | Required Researcher Inputs |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Randomized Controlled Trial (RCT)** | Empirical causal effect | Independent manipulation, dependent outcomes, control confounders | Standard treatment / placebo control | Effect size, relative risk, statistical p-value / Bayes Factor | Observed effect $p \ge 0.05$ or $95\%$ CI overlaps zero | Randomization seed schedule, double-blind protocol | Target population, ethical IRB approval |
| **2** | **Paired Comparative Benchmark** | Directional algorithmic superiority | Parameter count, sequence length, input distributions | Published SOTA implementations with verified DOIs | Perplexity, task accuracy, throughput (tokens/sec), latency | Candidate fails to outperform baseline on primary metric ($p \ge 0.05$) | Pinned compiler flags, matching GPU architecture | Target benchmark selection, split configuration |
| **3** | **Systematic Component Ablation** | Causal component necessity | Component removal/knockout, replacement modules | Full unablated system | Delta accuracy, degradation magnitude | Performance is invariant to component removal ($\Delta \le \epsilon$) | Exact ablation schedule, frozen weights | Component boundary definitions |
| **4** | **Scaling & Complexity Analysis** | Asymptotic scaling law | Sequence length $N$, model scale $P$, dataset tokens $D$ | Canonical reference architectures ($O(N)$, $O(N^2)$) | Wall-clock time, peak VRAM (MB), FLOPs scaling curve | Empirical curve violates predicted complexity (e.g. $O(N)$ diverges) | Log-log regression fit, multi-scale runs | Scaling horizon ($N \in [1\text{K}, 128\text{K}]$) |
| **5** | **Stochastic Simulation** | Emergent distribution properties | Initial distribution parameters, agent interaction rules | Established analytical or Monte Carlo approximations | Distribution divergence (KL, Wasserstein), steady-state reach | Simulation output diverges significantly from target empirical distribution | $N \ge 1,000$ seeds, pseudorandom generator seed logs | Parameter priors, stopping conditions |
| **6** | **Formal Proof & Counter-Example** | Mathematical conjecture / invariant | Axiomatic system, formal proof obligations | Published theoretical bounds / lemmas | Proof completeness, automated theorem prover verification | Existence of a single verified counter-example or proof contradiction | Complete proof script (Lean 4, Coq, Isabelle) | Axiom selection, target lemma |
| **7** | **Dataset Bias & Distribution Audit** | Invariance across distributions | Stratified demographic, sensor, or domain partitions | Standard benchmark distributions | Demographic parity, slice disparity, out-of-distribution drop | Performance degradation exceeds fairness or drift threshold | Fixed dataset checksums (SHA-256), split manifests | Domain slice definition, error threshold |
| **8** | **Adversarial Robustness Stress-Test** | Adversarial invariance | Perturbation budget $\epsilon$, attack method | Non-perturbed baseline, standard defense baselines | Robust accuracy under attack, perturbation norm | Robust accuracy drops below chance or safety ceiling | Attack generation scripts, deterministic perturbation | Attack budget ($\ell_\infty \le 8/255$) |
| **9** | **Empirical Replication Study** | Empirical reproducibility | Re-execution of published hyperparameter schedules | Original authors' reported numbers in published paper | Replication delta ($\|Y_{rep} - Y_{orig}\|$), confidence overlap | Replication result lies outside published $95\%$ confidence interval | Exact Docker container, identical seeds | Hardware matching, hyperparameter config |
| **10**| **Qualitative Systems Architecture** | Operational robustness | Failure injection (packet loss, node crash, latency spike) | Monolithic / unoptimized system baseline | Recovery time objective (RTO), tail latency (p99) | Tail latency exceeds SLA under simulated fault injection | Chaos engineering test scripts, network traces | Fault injection schedule, SLA target |
| **11**| **Parameter-Efficiency Adaptation** | Capacity-efficiency Pareto | Rank $r$, quantized bit-width, trainable parameters | Full parameter fine-tuning, standard LoRA baseline | Parameter delta %, task accuracy delta %, VRAM savings | Accuracy drop exceeds acceptable tolerance band | Fixed base model checkpoint, frozen weights | Allowable degradation tolerance |

---

## 3. Literature Baseline Verification & Anti-Hallucination Invariants

A critical scientific integrity failure is fabricating baseline performance numbers or citing phantom GitHub repositories. Subsystem C enforces five strict baseline invariants:

1. **Mandatory Published Source Citation:** Every baseline must link directly to an existing, verified record in `public.research_papers` with an authentic DOI or OpenAlex ID.
2. **Zero Fabricated Baseline Measurements:** If a baseline paper does not report a metric on a given dataset, the system must **never invent a number**. The metric must be explicitly labeled `UNREPORTED_IN_ORIGINAL_PUBLICATION (Must be empirically measured during experiment execution)`.
3. **Comparability Boundary Disclosure:** If Baseline $B_1$ was evaluated on hardware $H_1$ (e.g. TPU v4) and the proposed experiment targets $H_2$ (e.g. NVIDIA H100), the protocol must flag `HARDWARE_COMPARABILITY_MISMATCH` and mandate re-running the baseline on matching hardware.
4. **Codebase License Verification:** For every referenced baseline implementation, the open-source license (MIT, Apache 2.0, GPL, Non-Commercial) must be recorded.
5. **Version Pinning:** Protocols must record exact commit hashes or release tags for baseline implementations (e.g. `FlashAttention v2.5.8 @ commit 7a8b9c...`).

---

## 4. Falsification Decision Rules & Threshold Semantics

An experiment without a clear failure criterion is scientifically meaningless. Subsystem C requires every metric to define a quantitative falsification condition:

```
[Target Hypothesis]: "Selective state spaces reduce training memory by >= 3x without loss of associative recall."
                                      │
                                      ▼
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
[Success Acceptance Criterion]                [Critical Falsification Boundary]
Throughput >= 3.0x AND Multi-Query             Throughput < 1.5x OR Recall Score < 85.0%
Associative Recall Score >= 95.0%              on MQAR Benchmark (p < 0.05)
```

### Distinction Between Missing and Zero Thresholds
Subsystem C strictly distinguishes:
- `THRESHOLD = 0.0`: A deliberate empirical threshold of zero (e.g. zero allowed memory leaks or zero permissible invariant violations).
- `REQUIRES_RESEARCHER_SPECIFICATION`: A threshold that cannot be derived algorithmically from literature and requires domain-specific researcher calibration (e.g. acceptable clinical error tolerance).
- `NOT_OPERATIONALIZED`: A critical measurement that cannot be defined due to absence of measurement instruments.

---

## 5. Comprehensive Threats to Validity Framework

Every protocol includes an automated threats-to-validity analysis across four epistemological quadrants:

```mermaid
quadrantChart
    title Threats to Scientific Validity Framework
    x-axis Internal Validity (Causal Isolation) --> External Validity (Generalizability)
    y-axis Conclusion Validity (Statistical Rigor) --> Construct Validity (Metric Alignment)
    "Confounder Leakage; Hardware Throttling": [0.2, 0.3]
    "Proxy Metric Divergence; Label Noise": [0.3, 0.8]
    "Distribution Shift; Dataset Homogeneity": [0.8, 0.4]
    "Underpowered Trials; Multiple Testing": [0.7, 0.9]
```

1. **Internal Validity:** Confounding variables, non-deterministic CUDA thread scheduling, thermal throttling altering runtimes, data leakage between train/test splits.
2. **External Validity:** Synthetic dataset bias failing to generalize to clinical or production workloads, architecture specificity.
3. **Construct Validity:** Proxy metrics (BLEU, perplexity) failing to capture actual semantic reasoning or clinical utility.
4. **Conclusion Validity:** Insufficient sample size leading to Type II errors, p-hacking, lack of correction for multiple hypothesis testing (Bonferroni / FDR).
