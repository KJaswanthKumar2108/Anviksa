# Anvīkṣā — Project Build Plan & Stage Status

**Document Version:** 4.1.0-REVISED  
**Status:** Stage 3 Completed & Accepted; Stage 4 Architecture Approved; Sub-stage 4A Accepted (with Non-Blocking Limitations); Sub-stage 4B Accepted (with Non-Blocking Limitations); Sub-stage 4C Remediation Implemented & Tested (Pending Re-Audit); Sub-stages 4D–4F Planned (Not Implemented); Stages 5–7 Planned  

---

## 1. Stage Progress & Master Roadmap

| Stage | Focus Area | Status | Deliverables & Milestones |
| :---: | :--- | :---: | :--- |
| **1** | OpenAlex Integration & Architecture Audit | **COMPLETED & AUDITED** | OpenAlex search service, DOI resolution, bearer authentication, security audit. |
| **2** | Open-Access Full-Text Retrieval & SSRF Defense | **COMPLETED & AUDITED** | Source-aware PDF/HTML retrieval, SSRF validation, IMRAD chunking, section extraction. |
| **3** | Gemma 4 AI Analysis & Comparative Synthesis | **COMPLETED & ACCEPTED** | Gemma 4 MoE inference, multi-paper comparison, truthful model attribution, PostgreSQL provenance RPC, RLS regression. |
| **4** | Research Gap Discovery & Validation Engine | **STAGE 4A & 4B ACCEPTED; 4C IN PROGRESS** | Stage 4 Architecture Approved; 4A Accepted with Non-Blocking Limitations; 4B Accepted with Non-Blocking Limitations; 4C In Progress; 4D–4F Planned (Not Implemented). |
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

- **Sub-stage 4C: AI Research Gap Extraction & Epistemic Classification** *(REMEDIATION IMPLEMENTED AND TESTED — PENDING RE-AUDIT)*
  - Prompt engineering for Gemma 4 MoE (`gemma-4-26b-a4b-it`) across 12 gap dimensions.
  - Verbatim substring & 0-based codepoint offset grounding verification against NFC normalized text.
  - Truthful extraction status classification across 7 states (`SOURCE_UNAVAILABLE`, `INSUFFICIENT_SOURCE_CHUNKS`, `ABSTRACT_ONLY_ANALYSIS`, `NO_LIMITATIONS_FOUND`, `MALFORMED_MODEL_OUTPUT`, `PARTIAL_EXTRACTION`, `SUCCESS`).
  - Deterministic whitespace position mapping (`findWhitespaceNormalizedOffsets`) with zero offset drift, exact raw slice recovery, and mandatory authorial demotion to `PAPER_SUPPORTED_OBSERVATION` on normalized match.
  - Cross-chunk candidate match collection, contextual section disambiguation, and rejection of ambiguous quotes (`FAILED_VERIFICATION` / `AMBIGUOUS_EVIDENCE_LOCATION`).
  - Concurrency-safe database-level idempotency via `idempotency_key`, unique constraint `uq_research_gaps_idempotency_key`, and PostgreSQL `insert_server_verified_gap()` RPC with `ON CONFLICT (idempotency_key) DO UPDATE`.
  - Comprehensive extraction coverage metadata recording (`totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated`) persisted in `scoring_metadata.coverage`.
  - Strict 3-Concept Separation:
    1. **Evidence Type:** Nature of source passage grounding (`EXPLICIT_AUTHOR_STATEMENT`, `EMPIRICAL_BENCHMARK_RESULT`, `METHODOLOGICAL_CONSTRAINT`, `THEORETICAL_ASSUMPTION_OR_SCOPE`, `INTERPRETIVE_DISCUSSION_CLAIM`, `INFERRED_EVIDENCE_CONTEXT`).
    2. **Epistemic Classification:** Knowledge status of extracted claim (`AUTHOR_STATED_LIMITATION`, `PAPER_SUPPORTED_OBSERVATION`, `AI_INFERRED_LIMITATION`, `CANDIDATE_RESEARCH_GAP`). Note: `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` and `ADDRESSED_OR_SUPERSEDED_GAP` are strictly reserved for Stage 4D and cannot be assigned in Stage 4C.
    3. **Validation Outcome:** Cross-literature consensus status (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`).
  - Untrusted academic input delimitation (`<<<START_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>> ... <<<END_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>>`) & prompt injection defense.

- **Sub-stage 4D: Cross-Literature Validation & Contradiction Detection** *(PLANNED — NOT IMPLEMENTED)*
  - Multi-paper validation across 5 explicit outcomes (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`).
  - Chronology does not auto-supersede; requires side-by-side benchmark comparison.
  - Immutable epistemic transition logging in `research_gap_audit_log`.

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
