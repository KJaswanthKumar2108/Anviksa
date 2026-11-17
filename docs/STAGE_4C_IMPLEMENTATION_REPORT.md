# Anvīkṣā — Stage 4C Implementation Report
## AI Research Gap Extraction & Epistemic Classification

**Document Version:** 4.1.0-REVISED  
**Date:** 2026-11-17T21:44:00+05:30  
**Milestone:** Sub-stage 4C — AI Research Gap Extraction & Epistemic Classification  
**Status:** REMEDIATION IMPLEMENTED AND TESTED — PENDING RE-AUDIT  
**Scope Boundary Enforcement:** Sub-stage 4C ONLY. Sub-stages 4D, 4E, and 4F are NOT implemented.

---

## 1. Executive Summary & Architecture Overview

Sub-stage 4C transforms the scholarly literature corpus ingested during Sub-stage 4B into a scientifically traceable collection of research limitations, empirical constraints, and candidate research gaps. Rather than providing generic summaries or unbounded extrapolations, the extraction engine grounds every claim in verified source text chunks using deterministic 0-based Unicode code-point offset verification and enforces strict epistemic boundaries.

### Core Data Flow Architecture

```
[Ingested Paper Chunks (4B)]
             │
             ▼
[Chunk Prioritization & Selection] (Limitations, Discussion, Methods, Results, Abstract)
             │
             ▼
[Untrusted Academic Data Delimitation] (<<<START_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>>)
             │
             ▼
[Structured Gemma 4 MoE Inference] (Primary: gemma-4-26b-a4b-it, Fallback Hierarchy)
             │
             ▼
[JSON Schema Validation & Defensive Sanitization]
             │
             ▼
[Deterministic Evidence Grounding]
  ├── Locate Stated Chunk (or Cross-Chunk Relocation)
  ├── 0-Based Unicode Code-Point Offsets ([...text.normalize('NFC')])
  ├── Verbatim Slicing Check (extractByCodepointOffsets(haystack, start, end) === quote)
  ├── Normalized Whitespace Fallback (Resolving PDF line breaks)
  └── Hallucination & Paraphrase Rejection (status: FAILED_VERIFICATION)
             │
             ▼
[Strict Epistemic Classification Enforcement]
  ├── AUTHOR_STATED_LIMITATION (Demoted to AI_INFERRED if exact quote unverified)
  ├── PAPER_SUPPORTED_OBSERVATION (Empirical results & method constraints)
  ├── AI_INFERRED_LIMITATION (Extrapolated mechanism; never labeled author admission)
  ├── CANDIDATE_RESEARCH_GAP (Single-paper opportunity; always INSUFFICIENT_EVIDENCE)
  └── REJECT / DEMOTE CROSS_LITERATURE_VALIDATED or ADDRESSED_OR_SUPERSEDED
             │
             ▼
[Trusted Server-Side Persistence]
  └── SECURITY DEFINER RPC: insert_server_verified_gap() (Only verified claims persisted)
```

---

## 2. Ingestion-to-Extraction Pipeline

The extraction service is encapsulated in [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts) and exposed via REST endpoints in [`server.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server.ts):
- `POST /api/research/gaps/extract`: Extracts grounded limitations from a single ingested paper.
- `POST /api/research/gaps/extract-batch`: Orchestrates batch extraction with failure isolation.

### 2.1 Chunk Prioritization Strategy
Academic papers frequently exceed effective context lengths when passed entirely. The engine prioritizes chunks containing dialectical, limitation, and experimental passages:
1. Discussion, Limitations, Bottlenecks, and Threats to Validity.
2. Conclusion and Future Work.
3. Abstract and Core Research Question.
4. Methodology, Experimental Setup, and Ablation Benchmarks.
5. Remainder filled sequentially up to the configured budget (default 12 chunks).

### 2.2 Prompt Injection Defense & Delimitation
Academic papers are untrusted data that may intentionally or inadvertently contain adversarial directives (e.g., `"IGNORE ALL PREVIOUS INSTRUCTIONS..."`). Each chunk is explicitly quarantined:
```text
<<<START_UNTRUSTED_ACADEMIC_SOURCE_CHUNK id="0" section="Discussion" checksum="sha256:...">>>
[Normalized Chunk Text]
<<<END_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>>
```
System instructions enforce that content within these boundaries cannot alter system behavior, tools, or validation outcomes.

---

## 3. Configured Model Hierarchy & Actual Runtime Routing

The extraction pipeline leverages the project's verified `modelAdapter.ts` routing architecture:

| Tier | Configured Model Identifier | Architecture / Provider | Fallback Trigger Condition |
| :---: | :--- | :--- | :--- |
| **Tier 1 (Primary)** | `gemma-4-26b-a4b-it` | Google Gemma 4 Mixture-of-Experts (MoE) | Primary requested target. |
| **Tier 2 (Secondary)** | `gemma-4-31b-it` | Google Gemma 4 Dense 31B | Primary returns HTTP 503 / 429 / congestion. |
| **Tier 3 (Default Fallback)** | `gemini-3-flash-preview` | Google Gemini 3 Flash Preview | Both Gemma models unavailable. |
| **Tier 4 (Resilient Cascade)** | `gemini-2.5-flash` | Google Gemini 2.5 Flash | Upstream preview models return HTTP 503 overloaded. |

**Truthful Model Attribution:** In all extraction results and persisted database records, `model_requested`, `model_used`, `is_fallback`, and `fallback_reason` reflect the actual executed model byte-for-byte.

---

## 4. Epistemic Classification Rules

Stage 4C enforces strict epistemic discipline across 4 permitted single-paper classifications:

1. **`AUTHOR_STATED_LIMITATION`:**
   - The authors explicitly concede a constraint, boundary, or failure mode.
   - **Grounding Requirement:** MUST be verified against an exact, verbatim passage in the paper (`VERIFIED_EXACT_MATCH`).
   - If the quotation cannot be located verbatim, the claim is strictly downgraded to `AI_INFERRED_LIMITATION` (or rejected).
2. **`PAPER_SUPPORTED_OBSERVATION`:**
   - An empirical observation, benchmark score, or methodological boundary documented in the text, tables, or ablations.
   - Grounded in reported findings rather than subjective speculation.
3. **`AI_INFERRED_LIMITATION`:**
   - An extrapolation or deduction synthesized by the AI model from reported evidence.
   - Must explain the mechanistic reasoning; never attributed to the authors.
4. **`CANDIDATE_RESEARCH_GAP`:**
   - An unresolved research opportunity identified within the paper's scope.
   - In Stage 4C, the validation outcome is deterministically set to `INSUFFICIENT_EVIDENCE` because a single paper cannot establish cross-literature consensus.
5. **Strict Scope Prohibition:**
   - `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` and `ADDRESSED_OR_SUPERSEDED_GAP` are strictly forbidden. If an AI response claims these statuses, the engine automatically intercepts and demotes them to `CANDIDATE_RESEARCH_GAP`.

---

## 5. Deterministic Evidence Grounding & Verification

The verification algorithm in `verifyEvidenceGrounding()` performs five deterministic checks:
1. **Chunk Resolution:** Matches the claim to its source chunk by `chunkIndex`. If the quotation exists in another chunk of the paper, it relocates and anchors to the actual chunk.
2. **Unicode 0-Based Codepoint Offsets:** Uses `[...text.normalize('NFC')]` codepoint spreading to avoid JavaScript UTF-16 surrogate drift with mathematical notation and emojis (e.g. 🚀).
3. **Verbatim Slicing Check:**
   $$\text{extractByCodepointOffsets}(\text{chunkText}, start, end) \equiv \text{quotation.normalize('NFC')}$$
4. **Normalized Whitespace Fallback:** If exact matching fails due to PDF newline wraps, whitespace is collapsed and matched (`VERIFIED_NORMALIZED_MATCH`).
5. **Paraphrase Rejection:** If the passage cannot be located in any chunk of the paper, it receives `verificationStatus: 'FAILED_VERIFICATION'` and is **strictly blocked from database persistence**.

---

## 6. Persistence & Security Architecture

### 6.1 Database Persistence Boundary
- Persistence uses the existing `insert_server_verified_gap()` `SECURITY DEFINER` RPC with strict `service_role` authorization.
- Only verified claims (`VERIFIED_EXACT_MATCH` or `VERIFIED_NORMALIZED_MATCH`) are submitted to the database.
- Captures `source_document_checksum`, `extracted_text_checksum`, `chunk_identifier`, `start_offset`, `end_offset`, `offset_unit: 'codepoints'`, and `text_normalization_version: 'v1.0-nfc-normalized'`.
- Initial audit log record is automatically created in `public.research_gap_audit_log`.

### 6.2 Additive Migration
- Migration [`supabase/migrations/20261118_stage4c_evidence_taxonomy_enhancement.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_evidence_taxonomy_enhancement.sql) was applied to expand `research_gap_evidence.evidence_classification` to support modern, clean evidence types (`EXPLICIT_AUTHOR_STATEMENT`, `METHODOLOGICAL_OBSERVATION`, `EMPIRICAL_OBSERVATION`, `INFERRED_EVIDENCE_CONTEXT`) while maintaining 100% backward compatibility with legacy labels.

---

## 7. Created and Modified Files

| File Path | Action | Description |
| :--- | :---: | :--- |
| [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts) | **CREATED** | Core Stage 4C AI extraction service, chunk selector, Gemma 4 inference, deterministic grounding, and persistence. |
| [`tests/stage4c_extraction_verification.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4c_extraction_verification.ts) | **CREATED** | Automated test suite covering 42 test assertions across unit, grounding, security, live inference, and regression. |
| [`supabase/migrations/20261118_stage4c_evidence_taxonomy_enhancement.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_evidence_taxonomy_enhancement.sql) | **CREATED** | Additive migration expanding evidence classification check constraint. |
| [`server.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server.ts) | **MODIFIED** | Added `/api/research/gaps/extract` and `/api/research/gaps/extract-batch` routes. |
| [`BUILD_PLAN.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/BUILD_PLAN.md) | **MODIFIED** | Updated status (4B Accepted, 4C In Progress, 4D–4F Planned) and reconciled taxonomy. |
| [`docs/BUILD_PLAN.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/BUILD_PLAN.md) | **CREATED** | Synchronized copy in `docs/` matching root `BUILD_PLAN.md`. |
| [`docs/STAGE_4C_IMPLEMENTATION_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_IMPLEMENTATION_REPORT.md) | **CREATED** | Formal Stage 4C implementation report. |
| [`docs/STAGE_4C_TEST_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_TEST_REPORT.md) | **CREATED** | Comprehensive empirical test report. |

| [`server/textProvenanceUtils.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/textProvenanceUtils.ts) | **MODIFIED** | Added deterministic whitespace position mapping and exact raw slice recovery. |
| [`supabase/migrations/20261118_stage4c_idempotency_coverage.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_idempotency_coverage.sql) | **CREATED** | Additive migration for `idempotency_key`, unique constraint, and updated `insert_server_verified_gap()`. |
| [`docs/STAGE_4C_REMEDIATION_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_REPORT.md) | **CREATED** | Formal Stage 4C remediation report addressing all five audit findings. |
| [`docs/STAGE_4C_REMEDIATION_TEST_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_TEST_REPORT.md) | **CREATED** | Automated test report documenting 40/40 passing tests across all remediation categories. |

---

## 8. Post-Audit Targeted Remediations

Following the acceptance audit in [`docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md), five targeted remediations were implemented:
1. **Empty-Source Status Disambiguation:** 7 distinct statuses (`SOURCE_UNAVAILABLE`, `INSUFFICIENT_SOURCE_CHUNKS`, `ABSTRACT_ONLY_ANALYSIS`, `NO_LIMITATIONS_FOUND`, `MALFORMED_MODEL_OUTPUT`, `PARTIAL_EXTRACTION`, `SUCCESS`).
2. **Deterministic Whitespace Mapping:** Zero-drift code-point offset recovery from collapsed matches back to canonical uncollapsed text, exact raw quotation preservation with tabs/newlines, and mandatory demotion of `AUTHOR_STATED_LIMITATION` to `PAPER_SUPPORTED_OBSERVATION` on normalized match.
3. **Ambiguous Quotation Disambiguation:** Multi-candidate collection, contextual section disambiguation, and rejection as `FAILED_VERIFICATION` with `AMBIGUOUS_EVIDENCE_LOCATION`.
4. **Database-Level Idempotency:** Deterministic SHA-256 key and PostgreSQL `ON CONFLICT (idempotency_key) DO UPDATE` in `insert_server_verified_gap()`.
5. **Coverage Metadata Persistence:** Persistent corpus metrics (`totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated`) stored in `scoring_metadata.coverage`.

---

## 9. Explicit Boundary Statement

**Sub-stages 4D, 4E, and 4F are NOT implemented.**
- No cross-literature contradiction resolution has been implemented.
- No automated transition to `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` or `ADDRESSED_OR_SUPERSEDED_GAP` has occurred.
- No 6-dimension opportunity ranking, Popperian hypothesis generation, or experiment protocol synthesis has been built.
- No UI workbench features have been created.

---

## 10. Final Milestone Verdict

$$\mathbf{REMEDIATION \ IMPLEMENTED \ AND \ TESTED \ — \ PENDING \ RE-AUDIT}$$
