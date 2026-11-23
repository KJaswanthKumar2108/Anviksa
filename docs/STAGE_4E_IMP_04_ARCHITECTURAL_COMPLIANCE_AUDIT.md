# Anvīkṣā — Stage 4E-IMP-04 Architectural Compliance Audit
## Comprehensive Audit of Resource Suitability & Strategic Recommendations

**Document Version:** 1.0.0-STAGE4E-IMP04-COMPLIANCE  
**Milestone:** Stage 4E — Research Opportunity Intelligence  
**Work Package:** 4E-IMP-04 — Resource Suitability and Strategic Recommendations  
**Status:** **AUDITED, RECONCILED & ARCHITECTURALLY VERIFIED**  
**Architecture Baseline:** Frozen Stage 4E Architecture + Final Scientific Integrity Amendment  

---

## 1. Compliance Audit Matrix

| Area | Frozen Architecture Reference | Initial Implementation | Correction / Remediation | Final Verdict |
|---|---|---|---|:---:|
| **Suitability Formula** | `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.2 | $E_{raw} = \sum \alpha_i E_i$ ($[0.0, 10.0]$) | Preserved authorized composite formulation across compute, dataset, facility, budget. Decoupled from $V_{scientific}$. | **VERIFIED** |
| **Suitability Weights** | `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.2 | $\alpha_{comp} = 0.40, \alpha_{data} = 0.30, \alpha_{fac} = 0.15, \alpha_{bud} = 0.15$ | Documented authoritative source. All weights sum to $1.00$. Arbitrary sub-multipliers eliminated. | **VERIFIED** |
| **Hard Exclusion Gate** | `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.2 Rule 1 | `VERIFIED_UNAVAILABLE` on critical blocker sets $E = 0.00$ (`RESOURCE_BLOCKED`) | Verified directly against architecture Rule 1. Disallows soft penalty; emits explicit `RESOURCE_BLOCKED` without lowering $V_{scientific}$. | **VERIFIED** |
| **Quadrant Boundaries** | `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §5.1 | Piecewise mapping at threshold $6.0$ ($V \ge 6.0, E \ge 6.0$) | Documented authoritative derivation in §5.1. Preserved exact boundaries and `SUITABILITY_UNDETERMINED`. | **VERIFIED** |
| **Evidence States** | `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md` §4.1 | 5 states: `VERIFIED_AVAILABLE`, `DECLARED_AVAILABLE`, `VERIFIED_UNAVAILABLE`, `UNKNOWN`, `EXPIRED_EVIDENCE` | Enforced at SQL check constraint, RPC, backend service, and frontend. Honest display of `DECLARED_AVAILABLE`. | **VERIFIED** |
| **Verification Provenance** | `docs/STAGE_4E_DATA_AND_API_DESIGN.md` §2.6, `OPPORTUNITY_RANKING` §4.1 | Permitted self-declared claims to pass as verified | Hardened: `VERIFIED_AVAILABLE` requires authentic independent source and non-empty `verificationSourceRef`; otherwise downgraded to `DECLARED_AVAILABLE`. | **VERIFIED** |
| **Resource Matching** | `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md` §3 | Quantitative matching against `execution_environment` | Matches exact GPU count, VRAM, and dataset licenses. Unlisted resources marked unmatched without false unavailability. | **VERIFIED** |
| **Strategic Recommendations** | `docs/STAGE_4E_ARCHITECTURE.md` §4, `OPPORTUNITY_RANKING` §5.1 | Generated actionable next steps | Grounded in deficit requirements (hardware, DUA, grant funding) without modifying parent hypotheses or protocols. | **VERIFIED** |
| **Security & Ownership** | `docs/STAGE_4E_DATA_AND_API_DESIGN.md` §2.6 & §3 | RLS on 4 tables; Bearer auth; actor check | Public direct inserts blocked; actor identity derived from verified JWT token; `userId` mismatch rejected with 403. | **VERIFIED** |

---

## 2. Epistemic Guarantees

1. **Orthogonality of Scientific Value:**
   - Under no circumstances does a researcher's lack of compute (e.g. holding an RTX 4090 instead of an 8-GPU A100 cluster) downgrade an opportunity's intrinsic scientific value ($V_{scientific}$).
   - High-$V$ + Low-$E$ correctly maps to **`GRANT_OR_COLLABORATION_TARGET`**.
2. **Permanent Elimination of $P_{actionable}$:**
   - No blended score exists in the database, API, service, or frontend.
3. **Honest Incomplete Information:**
   - Missing inventory records or `UNKNOWN`/`EXPIRED_EVIDENCE` claims emit $E = \text{null}$ and `SUITABILITY_UNDETERMINED`.
