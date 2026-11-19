# Anvīkṣā — Stage 4D Implementation & Acceptance Report
## Cross-Literature Validation & Contradiction Detection Engine

**Architecture Baseline:** Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)  
**Execution Milestone:** Sub-stage 4D — Cross-Literature Validation & Contradiction Detection  
**Status:** **IMPLEMENTATION COMPLETE — ACCEPTANCE PASSED**  
**Execution Date:** 2026-11-19  
**Live Supabase Project:** `dtlvtpntmtdmdawupylv`  
**Total Test Suite Execution:** 161 Passed, 0 Failed (56/56 Stage 4D, 40/40 Stage 4C, 37/37 Stage 4B, 28/28 Stage 4A)  
**TypeScript Lint & Production Build:** Clean (0 errors, 711ms Vite bundle)

---

## 1. Executive Summary

Sub-stage 4D has been fully implemented, deployed live to Supabase, and verified against all 11 architectural acceptance gates. Stage 4D transitions single-paper candidate research gaps (extracted during Stage 4C) into scientifically defensible, cross-literature validated gaps by evaluating them against independently discovered academic literature.

The engine implements:
1. **Methodological Comparability Engine:** 4 comparison classes (`DIRECTLY_COMPARABLE`, `RELATED_RESEARCH_QUESTIONS`, `CONTEXTUAL_EVIDENCE`, `INCOMMENSURABLE_CONTEXT`) with 5-valued dimension semantics (`VERIFIED_COMPATIBLE`, `INCOMPATIBLE`, `NOT_REPORTED`, `UNKNOWN`, `NOT_APPLICABLE` excluded from denominator) and operational research question alignment grounded in bilateral quotes.
2. **Source Independence Evaluator:** Evaluates author networks, institutional affiliations, pre-print lineages, and shared codebases across 4 mutually exclusive states. Enforces the strict scientific rule: *two partially dependent replications do NOT equal an independent replication*. Validates 3 explicit resolution pathways: Standard ( $\ge 2$ independent), Hybrid (1 independent + partially dependent + mandatory human review), and Landmark (1 landmark paper + verified artifacts + transparent rationale + mandatory human review).
3. **Bilateral Contradiction Detection:** Bifurcates inter-paper empirical dispute (graph edge `'contradicts'`) from fundamental gap premise falsification (outcome `CONTRADICTED`). Enforces deterministic 0-based Unicode codepoint quote verification against raw source chunks.
4. **Deterministic Provisional Validation Strength ($S_{val}$):** Three-tier heuristic scoring on a $[0.0, 10.0]$ scale incorporating evidence quality ($Q_{evid}$), methodological comparability ($R_{meth}$), source independence ($I_{src}$), recency decay ($T_{rec}$ with $\lambda = 0.12$ and foundational baseline exemption), coverage breadth ($\Omega_{cov}$), and non-linear contradiction dampening ($1 / (1 + 0.6 N_{unresolved})$). Explicitly labeled as an uncalibrated deterministic index with mandatory UI/API warning banners.
5. **Live Supabase Persistence & Security Infrastructure:** Migration `20261119_stage4d_validation_infrastructure.sql` applied live to Supabase project `dtlvtpntmtdmdawupylv`. Deployed `public.research_gap_relationships` with composite foreign key `(gap_id, validation_run_id) ON DELETE RESTRICT`, 4 partial unique indexes eliminating duplicate edges and sentinel collisions, nil UUID prohibition, and master `SECURITY DEFINER` RPC `insert_server_verified_validation()` with service-role security and `app.trusted_server_context` verification.
6. **Frontend Visualization & Interaction:** `CrossLiteratureValidationPanel.tsx` in warm academic palette (`#FAEDCD`, `#CCD5AE`, `#8B5E34`) integrated into `AiAssistantView.tsx` (Tab 6 + gap card integration).

---

## 2. Master Schema & Live Database Verification (Project: `dtlvtpntmtdmdawupylv`)

Migration `supabase/migrations/20261119_stage4d_validation_infrastructure.sql` was executed and verified live on Supabase project `dtlvtpntmtdmdawupylv`:

| Object Name | Object Type | Verified Properties |
| :--- | :--- | :--- |
| `public.research_gaps` | Table Columns | Added `last_validated_at TIMESTAMPTZ`, `is_archived BOOLEAN DEFAULT false`, `archived_at TIMESTAMPTZ`. |
| `public.research_gap_validations` | Table Columns & Constraints | Added `confidence_score NUMERIC(5,2)`, `literature_coverage_metadata JSONB`. Unique constraint `uq_gap_validations_gap_run` on `(gap_id, validation_run_id)`. |
| `public.research_gap_relationships` | Table | Strongly typed graph edges referencing `public.research_papers(id UUID)` and `public.research_gaps(id UUID)` with `ON DELETE RESTRICT`. |
| `fk_gap_relationships_validation_run` | Composite Foreign Key | `(gap_id, validation_run_id)` referencing `research_gap_validations(gap_id, validation_run_id) ON DELETE RESTRICT`. |
| `chk_source_entity` & `chk_target_entity` | Check Constraints | `num_nonnulls(source_gap_id, source_paper_id) = 1` and `num_nonnulls(target_gap_id, target_paper_id) = 1`. |
| `chk_no_nil_uuid_*` | Check Constraints | Prohibits `00000000-0000-0000-0000-000000000000` across all entity foreign keys. |
| `chk_no_self_relationship` | Check Constraints | Prohibits self-loops (`source_gap_id <> target_gap_id` and `source_paper_id <> target_paper_id`). |
| `idx_uniq_gap_rel_gap_gap` | Partial Unique Index | Prevents duplicate relationships between gap $\rightarrow$ gap per validation run. |
| `idx_uniq_gap_rel_gap_paper` | Partial Unique Index | Prevents duplicate relationships between gap $\rightarrow$ paper per validation run. |
| `idx_uniq_gap_rel_paper_gap` | Partial Unique Index | Prevents duplicate relationships between paper $\rightarrow$ gap per validation run. |
| `idx_uniq_gap_rel_paper_paper` | Partial Unique Index | Prevents duplicate relationships between paper $\rightarrow$ paper per validation run. |
| `insert_server_verified_validation()` | RPC Function | Atomic master persistence function (`SECURITY DEFINER`, service-role restricted, `app.trusted_server_context = 'true'`). |
| `archive_research_gap()` | Administrative RPC | Soft-archival procedure setting `is_archived = true`, `archived_at = now()`. |
| `purge_archived_research_gap()` | Administrative RPC | Restricted purge procedure; strictly blocks purging active or depended-upon research gaps. |

---

## 3. Realized Architecture & Service Components

```
                                      Candidate Research Gap (Stage 4C)
                                                     │
                                                     ▼
                                      Literature Horizon Discovery
                               (Keyword, Citations, Counter-Evidence Queries)
                                                     │
                                                     ▼
                                      Multi-Paper Evidence Ingestion
                                 (SSRF Guard, Full-Text, IMRAD Chunking)
                                                     │
                     ┌───────────────────────────────┴───────────────────────────────┐
                     ▼                                                               ▼
        Methodological Comparability                                   Source Independence
         (4 Classes, 5-Valued Dims)                                  (4 States, Overlap, Jaccard)
                     │                                                               │
                     └───────────────────────────────┬───────────────────────────────┘
                                                     ▼
                                       Bilateral Contradiction Engine
                              (Exact Codepoint Slices, Dispute vs Falsification)
                                                     │
                                                     ▼
                                   Provisional Validation Strength (S_val)
                                (Epistemic Multiplier, Recency, Contradiction Dampener)
                                                     │
                                                     ▼
                                       Epistemic State Transition
                             (CONFIRMED_UNRESOLVED, PARTIALLY_ADDRESSED, ADDRESSED,
                                      CONTRADICTED, INSUFFICIENT_EVIDENCE)
                                                     │
                                                     ▼
                               Atomic Master Persistence RPC (Supabase Live)
```

### Module Responsibilities:
- `server/methodologicalComparabilityEngine.ts`: Evaluates critical gates (task alignment, operational question, metric formulation, dataset domain) and contextual dimensions (baseline model, compute scale, threats to validity, hardware environment). Properly excludes theoretical/complexity papers from hardware deployment requirements without NaN propagation.
- `server/sourceIndependenceService.ts`: Evaluates pairwise author Jaccard similarity, institutional affiliations, pre-print-to-journal titles, and code repository URLs. Implements strict replication rules and flags human review escalation on hybrid or landmark evidence.
- `server/contradictionDetectionService.ts`: Deterministically slices and verifies citations from raw paper chunks using 0-based Unicode codepoint offsets. Disentangles direct empirical disagreements from premise falsifications.
- `server/provisionalValidationStrengthService.ts`: Calculates $S_{val} = 10 \times \sqrt{Q_{evid} \times R_{meth}} \times (0.45 I_{src} + 0.30 T_{rec} + 0.25 \Omega_{cov}) \times \frac{1}{1 + 0.6 N_{unresolved}}$. Exempts foundational baseline papers older than 10 years from decay ($\tau = 1.0$).
- `server/crossLiteratureValidationService.ts`: End-to-end orchestrator that discovers cross-literature context, calculates the deterministic cryptographic invariant `corpusHash`, manages human review escalations, and persists results via the database RPC.

---

## 4. Acceptance Gate Verification Matrix

All 11 acceptance gates were tested using `tests/stage4d_validation_verification.ts` against the live Supabase database and local runtime:

| Gate | Requirement | Implementation & Evidence | Result |
| :---: | :--- | :--- | :---: |
| **Gate 1** | Live Schema & Migration Deployment | Migration `20261119_stage4d_validation_infrastructure.sql` applied live to Supabase. Verified tables, columns, constraints, and RPC definitions exist in `information_schema`. | **PASSED** |
| **Gate 2** | Database-Level RLS & Service-Role Isolation | Anonymous client cannot insert, update, or delete in `research_gap_relationships` (RLS blocks write). Service-role write permitted. Anonymous select allowed only for public, non-archived gaps. | **PASSED** |
| **Gate 3** | Composite Foreign Key Integrity | `(gap_id, validation_run_id)` on `research_gap_relationships` strictly references `research_gap_validations(gap_id, validation_run_id) ON DELETE RESTRICT`. Mismatched run IDs rejected by database. | **PASSED** |
| **Gate 4** | Partial Unique Indexes & Nil UUID Rejection | Four discrete partial unique indexes prevent duplicate relationships. Check constraint `chk_no_nil_uuid` strictly rejects `00000000-0000-0000-0000-000000000000`. | **PASSED** |
| **Gate 5** | Methodological Comparability & 5-Valued Semantics | 4 comparison classes verified. 5-valued dimension states (`VERIFIED_COMPATIBLE`, `INCOMPATIBLE`, `NOT_REPORTED`, `UNKNOWN`, `NOT_APPLICABLE`) verified. Theoretical papers exclude hardware from denominator without NaN. | **PASSED** |
| **Gate 6** | Source Independence & Replication Rules | 4 states verified with weights (1.0, 0.45, 0.05, 0.20). Two `PARTIALLY_DEPENDENT` papers strictly fail standard replication. Hybrid and Landmark pathways strictly flag `requiresHumanReview = true`. Landmark without artifacts rejected. | **PASSED** |
| **Gate 7** | Contradiction Detection & Exact Codepoint Slices | Exact 0-based Unicode codepoint slicing verified (`VERIFIED_EXACT_MATCH`). Corrupted quotes rejected (`FAILED_VERIFICATION`). Inter-paper empirical disputes classified as `'contradicts'`, while premise falsification invalidates gap premise and triggers human review. | **PASSED** |
| **Gate 8** | Deterministic Provisional Strength ($S_{val}$) Model | Formula verified with recency decay ($\lambda = 0.12$). Foundational papers exempt from decay ($T_{rec} = 1.0$). Contradiction dampening verified. Mandatory uncalibrated heuristic notice verified. | **PASSED** |
| **Gate 9** | Atomic Persistence via Master RPC & Corpus Hash | `insert_server_verified_validation()` atomically updates gap outcome, classification, and inserts validation run and relationships. Cryptographic `corpusHash` verified. | **PASSED** |
| **Gate 10** | Soft Deletion, Archival & Purge Safety | `archive_research_gap()` soft-archives research gaps. `purge_archived_research_gap()` rejects purging non-archived gaps or gaps with active dependencies, while preserving immutable audit logs. | **PASSED** |
| **Gate 11** | Real Scientific Benchmark Clusters | Evaluated 3 benchmark clusters: 1) FlashAttention vs Mamba context scaling; 2) GNN over-smoothing multi-hop collapse; 3) LoRA parameter-efficient fine-tuning independent replication across UW and Princeton. | **PASSED** |

---

## 5. API Endpoints Registered (`server.ts`)

The following Stage 4D endpoints are exposed and operational:

```
POST /api/research/gaps/validate
  Request:  { gapId: string, discoveryBudget?: string, modelIdentifier?: string, ... }
  Response: { success: true, report: CrossLiteratureValidationReport }

GET  /api/research/gaps/:id/validations
  Response: { success: true, gapId: string, validations: ResearchGapValidation[] }

GET  /api/research/gaps/:id/relationships
  Response: { success: true, gapId: string, relationships: ResearchGapRelationship[] }

POST /api/research/gaps/:id/archive
  Request:  { archivalReason?: string }
  Response: { success: true, gapId: string, archived: true }

POST /api/research/gaps/:id/purge
  Request:  { purgeReason?: string }
  Response: { success: true, gapId: string, purged: true }
```

---

## 6. Frontend UI Components

1. `src/components/CrossLiteratureValidationPanel.tsx`:
   - Warm academic beige/orange aesthetic (`#FAEDCD`, `#CCD5AE`, `#8B5E34`, `#D4A373`).
   - Outcome Badges: `CONFIRMED_UNRESOLVED` (Green/Sage), `PARTIALLY_ADDRESSED` (Beige/Bronze), `ADDRESSED` (Rust/Orange), `CONTRADICTED` (Alert Rust), `INSUFFICIENT_EVIDENCE` (Muted Grey).
   - Provisional Scorecard: Displays $S_{val}$ ($0.0 - 10.0$) with expandable formula breakdown ($Q_{evid}, R_{meth}, I_{src}, T_{rec}, \Omega_{cov}, D_{contra}$).
   - Mandatory Scientific Warning Banner: Explicit notice informing researchers that $S_{val}$ is an uncalibrated deterministic index and not an empirical posterior probability.
   - Human Review Escalation Banner: Highlights reasons when landmark, hybrid, or premise falsification conditions occur.
   - Connected Bilateral Citations & Verifiable Quotes Drawer: Expandable bilateral source quotes with 0-based codepoint offsets and relationship types.
   - Soft-Archival Button: Integrates with `archive_research_gap`.
2. `src/views/AiAssistantView.tsx`:
   - Added Tab 6: `Stage 4D Cross-Literature Validation` in the AI Literature Analysis Workbench.
   - Added direct "Validate Against Literature (Stage 4D)" action buttons on each candidate gap card in Tab 1 (Structured Paper Analyzer).

---

## 7. Full Test Suite & Regression Audit Evidence

### 1. Stage 4D Dedicated Acceptance Suite (`tests/stage4d_validation_verification.ts`)
- **Status:** 56 PASSED, 0 FAILED (100% pass rate)
- **Execution Log:**
  ```
  Anvīkṣā — Stage 4D Acceptance Test Results: 56 PASSED | 0 FAILED
  ========================================================================
  ```

### 2. Stage 4A Regression Suite (`tests/stage4a_database_security.ts`)
- **Status:** 28 PASSED, 0 FAILED (100% pass rate)
- **Highlights:** RLS enforcement, enum constraints, self-relationship rejection, service-role isolation, Stage 3 RPC compatibility.

### 3. Stage 4B Regression Suite (`tests/stage4b_discovery_ingestion.ts`)
- **Status:** 37 PASSED, 0 FAILED (100% pass rate)
- **Highlights:** Canonical paper identity, Unicode codepoints, SSRF perimeter guards, multi-vector discovery (keyword, backward/forward citation, counter-evidence), failure isolation.

### 4. Stage 4C Regression Suite (`tests/stage4c_extraction_verification.ts`)
- **Status:** 40 PASSED, 0 FAILED (100% pass rate)
- **Highlights:** Verbatim quote grounding, whitespace normalization and position recovery, cross-chunk relocation, truthful status classification, database idempotency.

### 5. Build & Lint Verification
- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build` (`vite build`): **0 errors**, built client environment in 711ms.

---

## 8. Milestone Boundaries & Non-Authorized Scope

- **Sub-stage 4D:** **IMPLEMENTATION COMPLETE & ACCEPTED**.
- **Sub-stage 4E (Opportunity Ranking & Hypothesis Synthesis):** Strictly NOT implemented, planned for subsequent authorization.
- **Sub-stage 4F (Global Discovery Workbench & Interactive Graph):** Strictly NOT implemented, planned for subsequent authorization.
- **Stage 5–7:** Planned for future milestones.
