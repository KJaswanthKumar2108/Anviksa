# Anvīkṣā — Project Build Plan & Stage Status

**Document Version:** 4.1.0-REVISED (Stage 4E Architecture Designed)  
**Status:** Stage 3 Completed & Accepted; Stage 4 Architecture Approved; Sub-stage 4A Accepted (with Non-Blocking Limitations); Sub-stage 4B Accepted (with Non-Blocking Limitations); Sub-stage 4C Accepted (with Non-Blocking Limitations); Sub-stage 4D Implemented & Accepted; Sub-stage 4D.1 Hardened & Accepted; Sub-stage 4E Architecture Designed & Audited (Implementation Prohibited); Sub-stage 4F Planned (Not Implemented); Stages 5–7 Planned  

---

## 1. Stage Progress & Master Roadmap

| Stage | Focus Area | Status | Deliverables & Milestones |
| :--- | :--- | :---: | :--- |
| **1** | OpenAlex Integration & Architecture Audit | **COMPLETED & AUDITED** | OpenAlex search service, DOI resolution, bearer authentication, security audit. |
| **2** | Open-Access Full-Text Retrieval & SSRF Defense | **COMPLETED & AUDITED** | Source-aware PDF/HTML retrieval, SSRF validation, IMRAD chunking, section extraction. |
| **3** | Gemma 4 AI Analysis & Comparative Synthesis | **COMPLETED & ACCEPTED** | Gemma 4 MoE inference, multi-paper comparison, truthful model attribution, PostgreSQL provenance RPC, RLS regression. |
| **4** | Research Gap Discovery & Validation Engine | **STAGE 4A–4D.1 ACCEPTED; 4E ARCHITECTURE DESIGNED; 4F PLANNED** | Stage 4 Architecture Approved; 4A Accepted with Non-Blocking Limitations; 4B Accepted with Non-Blocking Limitations; 4C Accepted with Non-Blocking Limitations; 4D/4D.1 Implemented & Accepted; 4E Architecture Designed & Audited (Implementation Prohibited); 4F Planned. |
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

- **Sub-stage 4D.1: Source Independence & Verification Integrity Hardening** *(IMPLEMENTED & ACCEPTED)*
  - Institutional Identity Resolution Hierarchy: Implemented conservative 5-tier resolution (ROR ID direct match -> OpenAlex authoritative ID -> Versioned explicit alias registry v1.0.0 -> Conservative normalized-name comparison -> INDEPENDENCE_UNKNOWN fallback).
  - Versioned Explicit Alias Registry (`INSTITUTION_ALIAS_REGISTRY_VERSION = '1.0.0'`): Pre-indexed canonical mappings for premier universities and labs (UC Berkeley, UCLA, MIT, Stanford, Oxford, Cambridge, CMU, UW, GWU, WashU, Princeton, Harvard, ETH Zurich, Toronto, Google Research, Microsoft Research, Meta AI, OpenAI).
  - Institutional Non-Collision Guarantees: Provable isolation between homonymous or token-sharing institutions (`University of Washington` vs `George Washington University` vs `Washington University in St. Louis`; `UC Berkeley` vs `UCLA`).
  - Author Identity Safeguards: Preserved full given-name keys in `parseAuthorName()` to prevent collisions on East Asian authors sharing common surnames (`Wang, Wei` vs `Wang, Wen` yields Jaccard 0.0).
  - Affiliation Completeness & Metadata Conflict Detection: Missing affiliations safely fallback to `INDEPENDENCE_UNKNOWN`; conflicting name vs ROR ID pairs flag `institutionMetadataConflict: true` and block unverified independent status.
  - Multi-Affiliation & Delimited Segment Support: Accurate resolution of multi-institution author lists and complex department/institute string formats.
  - Verification Report Reconciled: Resolved reporting discrepancy in Stage 4D verification report (161 automated tests + 2 build/typecheck checks = 163 total distinct checks).
  - Adversarial Verification: 44/44 tests passed in `tests/stage4d_1_adversarial_verification.ts` across all 17 adversarial categories with 0 regressions across Stage 4A (28/28), Stage 4B (37/37), Stage 4C (40/40), and Stage 4D (56/56). Total platform verification tally: 207 checks (205 tests + 2 build checks).
  - Implementation Report: `docs/STAGE_4D_1_IMPLEMENTATION_REPORT.md`.

- **Sub-stage 4E: Opportunity Ranking, Hypothesis & Experiment Generation** *(ARCHITECTURE REVISED & AUDITED — IMPLEMENTATION PROHIBITED)*
  - Four Connected Subsystems: Subsystem A (Opportunity Intelligence & Ranking), Subsystem B (Falsifiable Hypothesis Synthesis), Subsystem C (Experiment Design & Protocol Synthesis), Subsystem D (Resource-Aware Research Planning).
  - Revision 1 Decoupled Scoring: Separated Intrinsic Scientific Opportunity Value ($V_{scientific}$) from Researcher Execution Suitability ($E_{suitability}$), eliminating priority circularity. Actionable priority ($P_{actionable}$) maps to a 2D Strategic Research Decision Matrix. Researcher compute constraints never downgrade intrinsic scientific value.
  - Strict Eligibility Waterfall: Non-compensatory eligibility gates derived from Stage 4D outcomes (`CONFIRMED_UNRESOLVED` eligible; `PARTIALLY_ADDRESSED` requires explicit residual unresolved scope; `ADDRESSED`, `CONTRADICTED`, and `INSUFFICIENT_EVIDENCE` disqualified from active ranking).
  - Structured Falsifiable Hypotheses: 27-field typed schema with operational independent, dependent, and control variables, directional predictions, explicit boundary conditions, and statistical null/alternative formulations where appropriate. Supports 6 methodological paradigms.
  - 10-Point Falsifiability & Quality Rubric: Automated dual-phase verification (deterministic check + AI logical audit) rejecting tautological statements and ungrounded causal claims.
  - Reproducible Experiment Protocols: 11 experimental design paradigms (RCT, comparative benchmarks, ablations, simulations, proofs, complexity, etc.) with verified published literature baselines (zero fabricated measurements), quantitative falsification thresholds, power analysis, and threats to validity.
  - Evaluation Framework: Formalized all 6 metrics across 10 architectural criteria ($HFI \ge 90\%$, $BAR = 100\%$ boolean audit, $\tau_{rank} \ge 0.70$, $UCR \le 5\%$, $PCI \ge 8.5/10$, $RUS \ge 4.2/5$). Replaced Cohen's kappa with Fleiss' kappa ($\ge 0.75$), Krippendorff's alpha ($\ge 0.80$), and ICC ($\ge 0.75$) with pre-evaluation pilot calibration ($N=20$).
  - Temporal Leakage Guards: Retrospective back-testing freezes literature at $T_0$, strictly blocking post-$T_0$ citations and publications from input discovery features.
  - Model Adapter Verification: Verified repository multi-tier fallback chain (primary `gemma-4-26b-a4b-it`, secondary `gemma-4-31b-it`, fallback `gemini-3-flash-preview` / `gemini-2.5-flash`).
  - Provenance & Staleness Invariants: Re-validation in Stage 4D automatically marks dependent opportunities/hypotheses as stale (`is_stale = true`). Immutable revision tracking preserves human and AI history.
  - Human Review Lifecycle: Explicit researcher review states (`RESEARCHER_APPROVED` != executed; `READY_FOR_EXECUTION` != executed).
  - Specifications: `docs/STAGE_4E_ARCHITECTURE.md`, `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md`, `docs/STAGE_4E_HYPOTHESIS_METHODOLOGY.md`, `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md`, `docs/STAGE_4E_DATA_AND_API_DESIGN.md`, `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`, `docs/STAGE_4E_ACCEPTANCE_CRITERIA.md`, `docs/STAGE_4E_ARCHITECTURE_REVISION_1_REPORT.md`.
  - Implementation Status: Strictly prohibited. Zero code changes, zero database mutations, zero Stage 4F implementation.

- **Sub-stage 4F: Research Gap Discovery Workbench & UI Integration** *(PLANNED — NOT IMPLEMENTED)*
  - Dedicated Workbench view (`ResearchGapWorkbenchView.tsx`) in beige/orange palette (`#FAEDCD`, `#CCD5AE`, `#8B5E34`).
  - Multi-paper gap matrix and interactive knowledge graph canvas.
  - Evidence inspection drawers with side-by-side contradictory quotes.
  - One-click challenge creation from validated gaps.
  - Production build and regression verification.

---
