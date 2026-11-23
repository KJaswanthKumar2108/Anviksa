# Anvīkṣā — Stage 4E-IMP-04 Implementation Report
## Resource Suitability and Strategic Recommendations

**Work Package:** Stage 4E-IMP-04  
**Milestone:** Stage 4E — Research Opportunity Intelligence  
**Status:** **IMPLEMENTED, TESTED, AUDITED & VERIFIED**  
**Architecture Baseline:** Frozen Stage 4E Architecture + Final Scientific Integrity Amendment  

---

## 1. Executive Summary

Stage 4E-IMP-04 introduces the Resource Suitability and Strategic Recommendations subsystem into Anvīkṣā. The system enables researchers to assess whether an existing scientifically grounded research opportunity and its derived experimental protocol can realistically be executed given their available resources, computing hardware, software environment, datasets, budget, and laboratory equipment.

Crucially, **the subsystem strictly enforces the Value-Suitability Decoupling Invariant**:
- $V_{scientific} \in [0.00, 10.00]$ measures the intrinsic scientific value, novelty, evidence confidence, significance, and methodological tractability of a research opportunity. It is **completely independent of researcher resource wealth**.
- $E_{suitability} \in [0.00, 10.00]$ (or `null` when `SUITABILITY_UNDETERMINED`) measures researcher-specific execution suitability.
- **The $P_{actionable}$ scalar collapse is permanently eliminated**: The platform never computes a composite scalar (such as $\beta V + (1-\beta)E$).
- Strategic categorization is governed strictly by the 2D piecewise decision function `StrategicQuadrant(V_scientific, E_suitability)`.

---

## 2. Architecture & Discrete Evidence States

### 2.1 Five Discrete Resource Evidence States
Arbitrary numerical discount multipliers (e.g., multiplying self-declared resources by 0.70 or 0.80) are completely eliminated. The system evaluates every resource against five explicit, verifiable evidence states:

| Evidence State | Epistemic Meaning |
|---|---|
| `VERIFIED_AVAILABLE` | Availability is confirmed via API integration, cryptographic attestation, or institutional SSO. |
| `DECLARED_AVAILABLE` | Researcher has self-declared availability without independent verification. Honest badge displayed. |
| `VERIFIED_UNAVAILABLE` | Non-availability is proven by access rejection, insufficient quota, or physical absence. |
| `UNKNOWN` | Availability cannot currently be established due to incomplete profile data. |
| `EXPIRED_EVIDENCE` | Previously verified credential exceeded freshness TTL. Dynamically classified as expired. |

> [!IMPORTANT]
> **The Unknown Evidence Invariant:**  
> A status of `UNKNOWN` or `EXPIRED_EVIDENCE` is **never treated as unavailable**. Missing evidence represents an absence of knowledge, not an absence of capability, and emits `SUITABILITY_UNDETERMINED` without inflicting artificial penalties.

---

## 3. The 2D Strategic Research Decision Matrix

Each evaluated opportunity is mapped into exactly one operational category via:

$$\text{StrategicQuadrant}(V_{scientific}, E_{suitability}) = \begin{cases}
\text{SUITABILITY\_UNDETERMINED} & \text{if } E_{suitability} \text{ is null or UNKNOWN} \\
\text{IMMEDIATE\_HIGH\_PRIORITY} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} \ge 6.0 \\
\text{GRANT\_OR\_COLLABORATION\_TARGET} & \text{if } V_{scientific} \ge 6.0 \land E_{suitability} < 6.0 \\
\text{FEASIBLE\_RESEARCH\_OPPORTUNITY} & \text{if } V_{scientific} < 6.0 \land E_{suitability} \ge 6.0 \\
\text{DEPRIORITIZED} & \text{if } V_{scientific} < 6.0 \land E_{suitability} < 6.0
\end{cases}$$

---

## 4. Implementation Components

1. **Database Schema & Migrations (`supabase/migrations/20261123_stage4e_4_resource_suitability.sql`):**
   - `public.researcher_resource_profiles`
   - `public.researcher_resources`
   - `public.research_strategic_recommendations`
   - `public.researcher_reviews`
   - Atomic RPCs: `rpc_upsert_researcher_resource`, `rpc_persist_strategic_recommendation`
   - Staleness propagation triggers
2. **Backend Domain Service (`server/resourceSuitabilityService.ts`):**
   - Protocol requirement extraction (`extractRequirementsFromExperiment`)
   - Traceable requirement-to-resource matching (`matchRequirement`)
   - Composite suitability assessment (`evaluateExecutionSuitability`)
   - Strategic recommendation generator (`generateRecommendations`)
3. **API Perimeter (`server.ts`):**
   - `GET /api/research/resources`
   - `POST /api/research/resources`
   - `POST /api/research/suitability/evaluate`
   - `GET /api/research/recommendations`
4. **Frontend Workbench (`src/components/ResourceSuitabilityWorkbench.tsx`):**
   - Integrated into main navigation via `Sidebar.tsx` and `App.tsx`
   - Supports resource registration, evidence state selection, and 2D strategic categorization.
