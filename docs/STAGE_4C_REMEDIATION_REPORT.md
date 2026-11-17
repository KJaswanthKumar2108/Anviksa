# Anvīkṣā — Stage 4C Post-Audit Remediation Report
## Evidence Integrity, Extraction Completeness & Persistence Idempotency
### Architecture Specification: Version 4.1.0-REVISED

**Document Version:** 4.1.0-REMEDIATION  
**Date:** 2026-11-17T22:18:00+05:30  
**Target Milestone:** Stage 4C — AI Research Gap Extraction & Epistemic Classification  
**Status:** `REMEDIATION IMPLEMENTED AND TESTED — PENDING RE-AUDIT`  
**Engineer:** Principal Supabase PostgreSQL Architect & AI Safety Systems Engineer  

---

## Executive Summary

Following the formal read-only audit documented in [`docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md), targeted remediations were authorized and implemented to address all five identified findings:

1. **Truthful Extraction Status Disambiguation:** Eliminated conflation of missing/insufficient source text with `NO_LIMITATIONS_FOUND`. Implemented truthful status transitions across seven distinct states.
2. **Zero-Drift Whitespace Normalization & Exact Raw Slice Recovery:** Built deterministic bidirectional position mapping (`findWhitespaceNormalizedOffsets`, `buildWhitespaceNormalizedMap`) from collapsed matches back to canonical uncollapsed NFC text, guaranteeing 0 code-point offset drift while preserving exact raw quotations with tabs and newlines. Enforced mandatory epistemic demotion of `AUTHOR_STATED_LIMITATION` to `PAPER_SUPPORTED_OBSERVATION` when matching only under whitespace normalization.
3. **Ambiguous Quotation Disambiguation & Cross-Chunk Relocation:** Replaced greedy first-match relocation with multi-candidate collection, contextual section disambiguation, and explicit rejection with `AMBIGUOUS_EVIDENCE_LOCATION` under `FAILED_VERIFICATION`.
4. **Database-Level Concurrency-Safe Idempotency:** Implemented deterministic SHA-256 idempotency key generation and updated PostgreSQL RPC `insert_server_verified_gap()` with `ON CONFLICT (idempotency_key) DO UPDATE`, guaranteeing deduplication under sequential retries and simultaneous concurrent requests.
5. **Extraction Coverage Metadata Recording:** Calculated and persisted comprehensive corpus coverage metrics (`totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated`, `selectedSectionDistribution`) in `scoring_metadata.coverage`.

All 40 automated tests in the expanded Stage 4C test suite passed with 0 failures, alongside 37/37 passing in Stage 4B, 28/28 passing in Stage 4A, clean TypeScript compilation (`tsc --noEmit`), and successful Vite production build.

---

## 1. Remediation 1: Empty-Source Classification & Extraction Completeness

### Defect Identified in Audit
The original implementation returned `extractionStatus: 'NO_LIMITATIONS_FOUND'` whenever `paper.chunks` was empty or missing. This untruthfully reported that an unreadable, paywalled, or failed retrieval was analyzed and contained zero limitations.

### Remediation Implemented
In [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts), seven distinct extraction statuses were formalized and strictly partitioned:

| Extraction Status | Invariant Condition |
| :--- | :--- |
| `SOURCE_UNAVAILABLE` | Ingested paper contains 0 chunks, or `retrievalStatus` is `RETRIEVAL_FAILED` or `METADATA_ONLY`. No synthetic claims are generated or persisted. |
| `INSUFFICIENT_SOURCE_CHUNKS` | Total non-whitespace character count across available chunks is $< 100$ characters for full-text ($< 30$ for abstracts). |
| `ABSTRACT_ONLY_ANALYSIS` | Source text is strictly limited to paper abstract (`ABSTRACT_ONLY_GROUNDING`). All extracted limitations are constrained to abstract scope. |
| `NO_LIMITATIONS_FOUND` | Source material was fully eligible and analyzed ($\ge 100$ chars), and the model found zero defensible limitations. |
| `MALFORMED_MODEL_OUTPUT` | Provider returned invalid JSON or non-schema-compliant output that could not be parsed or repaired. |
| `PARTIAL_EXTRACTION` | Model extracted candidate claims, but some (or all) failed evidence grounding verification. |
| `SUCCESS` | Model extracted candidate claims and 100% passed strict evidence grounding verification. |

---

## 2. Remediation 2: Whitespace Normalization & Deterministic Position Mapping

### Defect Identified in Audit
In `VERIFIED_NORMALIZED_MATCH`, the offset was calculated relative to a collapsed string (`replace(/\s+/g, ' ')`), resulting in positive offset drift relative to the uncollapsed canonical chunk text whenever tabs, multiple spaces, or newlines preceded the match.

### Remediation Implemented
Implemented deterministic whitespace-normalized offset mapping in [`server/textProvenanceUtils.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/textProvenanceUtils.ts):

1. **Deterministic Index Mapping Function (`buildWhitespaceNormalizedMap`):**
   Iterates through canonical NFC source text code-points and maps each non-whitespace character to its collapsed target index while recording the exact inverse source position:
   ```typescript
   export function buildWhitespaceNormalizedMap(sourceText: string): {
     collapsedText: string;
     collapsedToSourceMap: number[];
   }
   ```
2. **Exact Raw Interval Recovery (`findWhitespaceNormalizedOffsets`):**
   Searches the collapsed target quotation within `collapsedText`. The match range $[c_{start}, c_{end}]$ is mapped back to canonical source code-points $[rawStart, rawEnd]$ using `collapsedToSourceMap`.
3. **Exact Original Slice Preservation:**
   The exact uncollapsed raw text from `[rawStart, rawEnd]`—including original newlines (`\n\n`) and tabs (`\t\t`)—is extracted via `extractByCodepointOffsets` and preserved in `exactOriginalSlice`.
4. **Mandatory Epistemic Demotion:**
   If a claim matches under whitespace normalization but does NOT match verbatim letter-for-letter, it is assigned `VERIFIED_NORMALIZED_MATCH` and any claim marked `AUTHOR_STATED_LIMITATION` is strictly downgraded to `PAPER_SUPPORTED_OBSERVATION` to preserve authorial fidelity.

---

## 3. Remediation 3: Ambiguous Quotation Relocation Across Chunks

### Defect Identified in Audit
When an exact quotation did not match the model's declared `chunkIndex`, the engine iterated through chunks and relocated to the very first chunk containing the substring, risking false attribution if a common phrase appeared in multiple sections.

### Remediation Implemented
In `verifyEvidenceGrounding` in [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts):

1. **Exhaustive Candidate Match Collection:**
   The engine iterates across all eligible chunks and compiles an array of candidate matches:
   ```typescript
   const candidateMatches: Array<{ chunk: IngestionChunk; start: number; end: number; exactSlice: string }> = [];
   ```
2. **Deterministic Disambiguation Rules:**
   - **Case A (Unique Match):** Exactly one chunk contains the quotation. The claim is relocated to that chunk (`isRelocated: true`), offsets are anchored to the target chunk's global boundaries, and verified.
   - **Case B (Multiple Matches with Section Match):** Multiple chunks contain the phrase. If `declaredSectionName` is provided and exactly one candidate chunk matches that section, the claim is disambiguated to that section.
   - **Case C (Ambiguous Matches without Disambiguation):** If multiple chunks contain the phrase and section matching does not resolve ambiguity, the quotation is strictly rejected:
     - `verificationStatus: 'FAILED_VERIFICATION'`
     - `verificationNotes: 'Quotation appears in multiple chunks; unable to disambiguate exact provenance (AMBIGUOUS_EVIDENCE_LOCATION).'`
     - Demoted to `AI_INFERRED_LIMITATION` and `INFERRED_EVIDENCE_CONTEXT`.

---

## 4. Remediation 4: Database-Level Idempotency & Concurrency Safety

### Defect Identified in Audit
`public.research_gaps` lacked a unique constraint or deduplication key. Reprocessing a paper or concurrent worker retries created duplicate research gap rows and redundant audit log entries.

### Remediation Implemented

1. **Database Schema & Constraints:**
   Created additive migration [`supabase/migrations/20261118_stage4c_idempotency_coverage.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_idempotency_coverage.sql):
   - Added column `idempotency_key TEXT` to `public.research_gaps`.
   - Added unique constraint `uq_research_gaps_idempotency_key UNIQUE (idempotency_key)`.
   - Added index `idx_research_gaps_idempotency_key ON public.research_gaps (idempotency_key) WHERE idempotency_key IS NOT NULL`.
2. **Deterministic Key Generation:**
   In `persistVerifiedClaims`, each claim generates an invariant idempotency key:
   $$\text{idempotency\_key} = \text{sha256}(\text{paperIdentifier} + \text{":"} + \text{gapCategory} + \text{":"} + \text{normalizeScholarlyText}(\text{gapStatement}).\text{toLowerCase}().\text{trim}())$$
3. **Atomic PostgreSQL RPC Update (`insert_server_verified_gap`):**
   - Extracts `v_idempotency_key := NULLIF(trim(p_scoring_metadata->>'idempotency_key'), '')`.
   - Fast-path check: If existing gap has matching `idempotency_key`, updates `updated_at` and returns the existing `id`.
   - Atomic insert with conflict recovery:
     ```sql
     INSERT INTO public.research_gaps (...) VALUES (...)
     ON CONFLICT (idempotency_key) DO UPDATE
     SET updated_at = timezone('utc'::text, now())
     RETURNING id INTO v_gap_id;
     ```
   - Skips duplicate child evidence insertion if evidence for `v_gap_id` already exists.

---

## 5. Remediation 5: Extraction Coverage Metadata Recording

### Defect Identified in Audit
When papers exceeded 12 chunks, chunks were omitted from analysis, but the omitted chunk count, coverage ratio, and section distribution were not persisted in the database.

### Remediation Implemented

1. **Coverage Interface Defined:**
   ```typescript
   export interface ExtractionCoverageMetadata {
     totalEligibleChunks: number;
     selectedChunkCount: number;
     omittedChunkCount: number;
     selectedChunkIds: number[];
     selectedSectionDistribution: Record<string, number>;
     isTruncated: boolean;
     coverageRatio: number;
     evidenceCompleteness: string;
   }
   ```
2. **Deterministic Calculation:**
   Calculates metrics prior to model inference:
   - `totalEligibleChunks`: Total chunks available in ingested paper.
   - `selectedChunkCount`: Bounded by `maxChunksPerPaper` (default 12).
   - `omittedChunkCount`: $\max(0, \text{totalEligibleChunks} - \text{selectedChunkCount})$.
   - `isTruncated`: $\text{omittedChunkCount} > 0$.
   - `coverageRatio`: $\text{selectedChunkCount} / \text{totalEligibleChunks}$.
3. **Database Persistence:**
   Stored inside `scoring_metadata.coverage` during transactional gap insertion via `insert_server_verified_gap()`.

---

## 6. Summary of Modified & Created Files

| File | Type | Purpose |
| :--- | :--- | :--- |
| [`server/textProvenanceUtils.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/textProvenanceUtils.ts) | Modified | Added `buildWhitespaceNormalizedMap` and `findWhitespaceNormalizedOffsets` for zero-drift offset mapping. |
| [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts) | Modified | Implemented 7 truthful statuses, ambiguous cross-chunk relocation, exact raw slice recovery, epistemic downgrade on normalized match, coverage metadata, and idempotency key computation. |
| [`supabase/migrations/20261118_stage4c_idempotency_coverage.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_idempotency_coverage.sql) | Created | Applied additive migration adding `idempotency_key`, `uq_research_gaps_idempotency_key`, and updated `insert_server_verified_gap()` RPC. |
| [`tests/stage4c_extraction_verification.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4c_extraction_verification.ts) | Modified | Expanded verification suite with 40 automated tests covering all 5 remediations. |
| [`docs/STAGE_4C_REMEDIATION_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_REPORT.md) | Created | This architectural remediation report. |
| [`docs/STAGE_4C_REMEDIATION_TEST_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_TEST_REPORT.md) | Created | Comprehensive empirical test execution report. |
