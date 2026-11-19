# Anvīkṣā — Project Build Plan & Stage Status

**Document Version:** 4.1.0-REVISED (Stage 4D Completed & Accepted)  
**Status:** Stage 3 Completed & Accepted; Stage 4 Architecture Approved; Sub-stage 4A Accepted (with Non-Blocking Limitations); Sub-stage 4B Accepted (with Non-Blocking Limitations); Sub-stage 4C Accepted (with Non-Blocking Limitations); Sub-stage 4D Implemented & Accepted; Sub-stages 4E–4F Planned (Not Implemented); Stages 5–7 Planned  

---

## 1. Stage Progress & Master Roadmap

| Stage | Focus Area | Status | Deliverables & Milestones |
| :--- | :--- | :---: | :--- |
| **1** | OpenAlex Integration & Architecture Audit | **COMPLETED & AUDITED** | OpenAlex search service, DOI resolution, bearer authentication, security audit. |
| **2** | Open-Access Full-Text Retrieval & SSRF Defense | **COMPLETED & AUDITED** | Source-aware PDF/HTML retrieval, SSRF validation, IMRAD chunking, section extraction. |
| **3** | Gemma 4 AI Analysis & Comparative Synthesis | **COMPLETED & ACCEPTED** | Gemma 4 MoE inference, multi-paper comparison, truthful model attribution, PostgreSQL provenance RPC, RLS regression. |
| **4** | Research Gap Discovery & Validation Engine | **STAGE 4A, 4B, 4C & 4D ACCEPTED; 4E–4F PLANNED** | Stage 4 Architecture Approved; 4A Accepted with Non-Blocking Limitations; 4B Accepted with Non-Blocking Limitations; 4C Accepted with Non-Blocking Limitations; 4D Implemented & Accepted; 4E–4F Planned (Not Implemented). |
| **5** | Community Challenge & Proposal Workspace | *PLANNED* | Challenge publishing, proposal workflow, reviewer assignment, bounties. |
| **6** | Experiment Trials & Peer Review Lifecycle | *PLANNED* | Trial logging, metrics reporting, peer review decisions, validation status transitions. |
| **7** | Full Research Graph & Platform Productionization | *PLANNED* | Global research graph visualization, institutional dashboards, production deployment. |

---

## 2. Stage 4 Execution Breakdown (Revised Sub-Stage Ordering)

- **Sub-stage 4A: Evidence Graph, Schema & Provenance Infrastructure** *(ACCEPTED WITH NON-BLOCKING LIMITATIONS)*
  - Database schema: `research_gaps`, `research_gap_evidence`, `research_gap_validations`, `research_gap_audit_log`.
  - RPC: `insert_server_verified_gap()`.
  - Trigger: `protect_research_gaps_provenance()`.
  - RLS policies enforcing private vs public gap isolation.

- **Sub-stage 4B: Literature Corpus Discovery & Multi-Paper Ingestion** *(ACCEPTED WITH NON-BLOCKING LIMITATIONS)*
  - Multi-vector OpenAlex expansion (forward/backward citations, concept expansion, targeted counter-evidence).
  - DOI deduplication and SSRF-hardened batch PDF ingestion (3–12 papers/batch).
  - IMRAD section chunking, Unicode codepoint offset mapping, and SHA-256 binary/text hashing.

- **Sub-stage 4C: AI Research Gap Extraction & Epistemic Classification** *(ACCEPTED WITH NON-BLOCKING LIMITATIONS)*
  - Prompt engineering for Gemma 4 MoE (`gemma-4-26b-a4b-it`) across 12 gap dimensions.
  - Verbatim substring & 0-based codepoint offset grounding verification against NFC normalized text.
  - Truthful extraction status classification across 7 states (`SOURCE_UNAVAILABLE`, `INSUFFICIENT_SOURCE_CHUNKS`, `ABSTRACT_ONLY_ANALYSIS`, `NO_LIMITATIONS_FOUND`, `MALFORMED_MODEL_OUTPUT`, `PARTIAL_EXTRACTION`, `SUCCESS`).
  - Deterministic whitespace position mapping (`findWhitespaceNormalizedOffsets`) with zero offset drift, exact raw slice recovery, and mandatory authorial demotion to `PAPER_SUPPORTED_OBSERVATION` on normalized match.
  - Cross-chunk candidate match collection, contextual section disambiguation, and rejection of ambiguous quotes (`FAILED_VERIFICATION` / `AMBIGUOUS_EVIDENCE_LOCATION`).
  - Concurrency-safe database-level idempotency via `idempotency_key`, unique constraint `uq_research_gaps_idempotency_key`, and PostgreSQL `insert_server_verified_gap()` RPC with `ON CONFLICT (idempotency_key) DO UPDATE`.
  - Comprehensive extraction coverage metadata recording (`totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated`) persisted in `scoring_metadata.coverage`.
  - Strict 3-Concept Separation:
    1. **Evidence Type:** Nature of source passage grounding (`EXPLICIT_AUTHOR_STATEMENT`, `EMPIRICAL_BENCHMARK_RESULT`, `METHODOLOGICAL_CONSTRAINT`, `THEORETICAL_ASSUMPTION_OR_SCOPE`, `INTERPRETIVE_DISCUSSION_CLAIM`, `INFERRED_EVIDENCE_CONTEXT`).
    2. **Epistemic Classification:** Knowledge status of extracted claim (`AUTHOR_STATED_LIMITATION`, `PAPER_SUPPORTED_OBSERVATION`, `AI_INFERRED_LIMITATION`, `CANDIDATE_RESEARCH_GAP`).
    3. **Validation Outcome:** Cross-literature consensus status (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`).
  - Untrusted academic input delimitation (`<<<START_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>> ... <<<END_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>>`) & prompt injection defense.

- **Sub-stage 4D: Cross-Literature Validation & Contradiction Detection** *(IMPLEMENTED & ACCEPTED)*
  - Multi-paper validation across 5 explicit outcomes (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`).
  - Canonical Paper Referential Integrity: Verified and enforced that the canonical paper table in Anvīkṣā is `public.research_papers(id UUID)`.
  - Validation-Run Composite Referential Integrity: Enforced composite foreign key `(gap_id, validation_run_id)` referencing `public.research_gap_validations(gap_id, validation_run_id) ON DELETE RESTRICT`.
  - Exact Relationship Uniqueness: Four discrete partial unique indexes (Gap-to-Gap, Gap-to-Paper, Paper-to-Gap, Paper-to-Paper) and check constraints prohibiting nil UUIDs, eliminating sentinel collisions and NULL variation bypasses.
  - Provenance Preservation & Soft Deletion: Research gaps support archival via `is_archived = true`, removing cascading deletions that destroy historical evidence graphs.
  - Strict Independent-Replication & Hybrid-Path Semantics: Standard path requires $\ge 2$ strictly independent groups. Hybrid path (1 independent + partially dependent) is explicitly labeled as `ADDRESSED (HYBRID_EVIDENCE_PATH)` and requires human review (`requiresHumanReview = true`). Partially dependent evidence never counts as an independent replication.
  - Nuanced Comparability-Class Routing: Fails in Class 1 critical gates downgrade to Class 2 (Related Questions) or Class 3 (Contextual Evidence) when investigating related phenomena; Class 4 (`INCOMMENSURABLE_CONTEXT`) is strictly reserved for genuinely disjoint tasks or paradigms.
  - Non-Tautological `ADDRESSED` Semantics: Removed arbitrary 3-year requirement; defined resolution through scope, comparability, independent replication, and counter-evidence queries; single landmark result path requiring independently verifiable empirical artifacts (code, checkpoints, benchmark harness) and human review flag, clarifying that widespread adoption alone is never proof.
  - Five-Valued Missing Data Semantics: Formulated `VERIFIED_COMPATIBLE`, `INCOMPATIBLE`, `NOT_REPORTED`, `UNKNOWN`, and `NOT_APPLICABLE` (excluded from denominator), preventing missing data from being falsely equated with empirical conflict.
  - Scoring vs. Calibration Distinction: Deterministic `PROVISIONAL_VALIDATION_STRENGTH` on a $[0.0, 10.0]$ index clearly distinguished from calibrated probabilities; explicit Phase 5 benchmark calibration protocol (target event $Y = \mathbf{1}(\text{Assigned} = \text{Ground Truth})$, validation run unit, cluster-based split, double-blind adjudication, target ECE $\le 0.08$ with heuristic fallback) and mandatory UI/API caveats.
  - Comparison-Specific Comparability Architecture: Four explicit evidence classes (Direct Empirical, Related Questions, Contextual/Theoretical, Incommensurable) preventing metric asymmetry while allowing non-verbatim operational question alignment.
  - Operational Research Question Alignment grounded in bilateral quotes without requiring word-for-word identity.
  - Contextual evidence retention: incommensurable papers retained in knowledge graph for scope/theoretical context, but disqualified from direct contradiction decisions.
  - Bifurcated contradiction semantics: inter-paper empirical dispute (graph edge `'contradicts'`) vs direct gap premise falsification (validation outcome `CONTRADICTED`).
  - Bilateral evidence grounding invariant: mandatory exact 0-based code-point offset citations on both seed and validation sides for any contradiction.
  - Resource-bounded discovery horizons (`QUICK`: 10, `STANDARD`: 30, `EXHAUSTIVE`: 50) with adaptive expansion triggers and retrieval failure visibility.
  - Epistemic state machine governing promotion to `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` or transition to `ADDRESSED_OR_SUPERSEDED_GAP`.
  - Live Database Execution: Applied `supabase/migrations/20261119_stage4d_validation_infrastructure.sql` live to Supabase project `dtlvtpntmtdmdawupylv`. Verified all tables, constraints, partial unique indexes, RLS policies, and RPCs.
  - Server-side trusted validation RPC `insert_server_verified_validation()` with `service_role` security gate and advisory locking.
  - Administrative RPCs `archive_research_gap()` and `purge_archived_research_gap()`.
  - Immutable audit logging in `public.research_gap_audit_log` and comprehensive `literature_coverage_metadata` schema with cryptographic `corpusHash`.
  - Dynamic evaluation plan on 3 academic benchmark clusters (FlashAttention/Mamba, GNNs/Transformers, LoRA/Full Fine-Tuning) testing both validation and abstention (`INSUFFICIENT_EVIDENCE`) without hardcoded outcomes.
  - Acceptance Verification: Passed 56/56 automated tests in `tests/stage4d_validation_verification.ts` with 0 failures, and 0 regressions across Stage 4A (28/28), 4B (37/37), and 4C (40/40).
  - Implementation Report: `docs/STAGE_4D_IMPLEMENTATION_REPORT.md`.

- **Sub-stage 4E: Opportunity Ranking, Hypothesis & Experiment Generation** *(PLANNED — NOT IMPLEMENTED)*
  - 6-dimension opportunity scoring ($S_{confidence}, S_{novelty}, S_{significance}, S_{feasibility}, S_{tractability}, S_{priority}$).
  - Scores do not upgrade epistemic status; non-linear contradiction penalties applied.
  - Popperian falsifiable hypothesis synthesis (*"If [manipulation], then [observation] compared to [baseline], because [mechanism]"*).
  - Reproducible experiment protocol synthesis with failure criteria.

- **Sub-stage 4F: Research Gap Discovery Workbench & UI Integration** *(PLANNED — NOT IMPLEMENTED)*
  - Dedicated Workbench view (`ResearchGapWorkbenchView.tsx`) in beige/orange palette (`#FAEDCD`, `#CCD5AE`, `#8B5E34`).
  - Multi-paper gap matrix and interactive knowledge graph canvas.
  - Evidence inspection drawers with side-by-side contradictory quotes.
  - One-click challenge creation from validated gaps.
  - Production build and regression verification.

---
