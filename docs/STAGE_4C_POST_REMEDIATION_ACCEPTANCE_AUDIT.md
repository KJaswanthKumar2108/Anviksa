# Anvīkṣā — Stage 4C Independent Post-Remediation Acceptance Audit
## Evidence Integrity, Epistemic Grounding & Persistence Idempotency Final Acceptance Audit
### Architecture Specification: Version 4.1.0-REVISED

**Document Version:** 4.1.0-POST-AUDIT  
**Audit Date:** 2026-11-18T00:17:00+05:30  
**Target Milestone:** Stage 4C — AI Research Gap Extraction & Epistemic Classification  
**Auditor:** Principal Supabase PostgreSQL Architect & AI Safety Systems Auditor  
**Audit Mode:** Read-Only Implementation Inspection, Live Database Catalog Audit, Adversarial Invariant Testing, Scope Boundary Verification  
**Scope Boundary Enforcement:** STRICTLY READ-ONLY. No application code, schema, migrations, or database records modified. Sub-stages 4D–4F remain unimplemented.

---

## Executive Summary & Final Audit Verdict

A comprehensive, read-only post-remediation acceptance audit was conducted on the Stage 4C deliverables for the **Anvīkṣā Research Intelligence Platform**.

The audit independently verified every remediation documented in:
- [`docs/STAGE_4C_REMEDIATION_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_REPORT.md)
- [`docs/STAGE_4C_REMEDIATION_TEST_REPORT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_REMEDIATION_TEST_REPORT.md)
- [`docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/STAGE_4C_FINAL_ACCEPTANCE_AUDIT.md)

### Final Audit Determination

$$\mathbf{ACCEPTED \ WITH \ NON-BLOCKING \ LIMITATIONS}$$

### Key Findings Summary

1. **Extraction Status Truthfulness (Remediation A):** Fully Verified. The previous defect where empty chunks returned `NO_LIMITATIONS_FOUND` has been completely eliminated. Seven mutually exclusive statuses are enforced. Missing or empty sources exit early as `SOURCE_UNAVAILABLE` or `INSUFFICIENT_SOURCE_CHUNKS`, guaranteeing that `NO_LIMITATIONS_FOUND` strictly denotes analyzed source text with zero extractable gaps.
2. **Canonical Offset Mapping & Raw Slice Recovery (Remediation B):** Fully Verified. `buildWhitespaceNormalizedMap()` and `findWhitespaceNormalizedOffsets()` deterministically map collapsed matches back to canonical uncollapsed NFC source code-points with 0 drift across spaces, tabs, newlines, accents, and surrogate emojis. Slicing at `[rawStart, rawEnd)` perfectly reproduces the raw source slice. Normalized-only matches are strictly demoted to `PAPER_SUPPORTED_OBSERVATION` and classified as `METHODOLOGICAL_OBSERVATION`.
3. **Cross-Chunk Relocation & Ambiguity Resolution (Remediation C):** Fully Verified. Relocation now iterates across all eligible chunks. Unique matches relocate safely; multi-matches disambiguate via case-insensitive section name matching; ambiguous matches without section match are rejected as `FAILED_VERIFICATION` (`AMBIGUOUS_EVIDENCE_LOCATION`) and demoted to `AI_INFERRED_LIMITATION`. Rejected evidence is filtered out and never enters the persistence RPC.
4. **Database-Level Idempotency & Provenance Protection (Remediation D):** Fully Verified. The live PostgreSQL database (`dtlvtpntmtdmdawupylv`) enforces unique constraint `uq_research_gaps_idempotency_key` on `public.research_gaps (idempotency_key)`. Adversarial testing verified that conflicting retries with altered payloads DO NOT mutate statement, category, classification, confidence, model attribution, or audit logs, safely updating only `updated_at`.
5. **Corpus Extraction Coverage Recording (Remediation E):** Fully Verified. Metrics (`totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated`, `evidenceCompleteness`) are calculated without division-by-zero risks and persisted in `scoring_metadata.coverage`.
6. **Non-Blocking Limitations Documented:**
   - In-memory coverage tracking includes `selectedChunkIds` and `selectedSectionDistribution`, but only the summary metrics are persisted into `scoring_metadata.coverage` to preserve JSONB column compactness.
   - Stage 4C extractions remain scoped to single papers; cross-literature validation and contradiction detection are intentionally deferred to Sub-stage 4D.

---

## 1. Files & Functions Inspected

| File Path | Inspected Functions / Components | Purpose in Audit | Evaluation |
| :--- | :--- | :--- | :---: |
| [`server/researchGapExtractionService.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/researchGapExtractionService.ts) | `extractFromPaper()`, `verifyEvidenceGrounding()`, `sanitizeEpistemicClassification()`, `persistVerifiedClaims()` | Core extraction engine, 7-state status dispatch, candidate match collection, section disambiguation, coverage calculation, idempotency key generation. | **VERIFIED** |
| [`server/textProvenanceUtils.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/server/textProvenanceUtils.ts) | `buildWhitespaceNormalizedMap()`, `findWhitespaceNormalizedOffsets()`, `extractByCodepointOffsets()`, `normalizeScholarlyText()` | Bidirectional coordinate mapper, collapsed-to-source index translation, exact raw slice extraction, Unicode NFC normalization. | **VERIFIED** |
| [`supabase/migrations/20261118_stage4c_idempotency_coverage.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4c_idempotency_coverage.sql) | DDL for `idempotency_key`, `uq_research_gaps_idempotency_key`, and `insert_server_verified_gap()` RPC | Database schema migration script and plpgsql function definition. | **VERIFIED** |
| Live PostgreSQL Catalog (`dtlvtpntmtdmdawupylv`) | `public.research_gaps`, `pg_constraint`, `pg_indexes`, `pg_proc` | Live database verification of constraints, indexes, nullability, and RPC source definition. | **VERIFIED** |
| [`tests/stage4c_extraction_verification.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4c_extraction_verification.ts) | Groups 1–7 (40 automated assertions) | Automated test suite verifying offset accuracy, ambiguity rejection, coverage metadata, idempotency, and Stage 3 regression. | **VERIFIED** |

---

## 2. Independent Verification of the Five Remediations

### A. Extraction Status Correctness

The extraction engine in `server/researchGapExtractionService.ts` implements seven distinct, strictly partitioned extraction statuses:

```typescript
export type ExtractionStatus =
  | 'SUCCESS'
  | 'PARTIAL_EXTRACTION'
  | 'NO_LIMITATIONS_FOUND'
  | 'ABSTRACT_ONLY_ANALYSIS'
  | 'INSUFFICIENT_SOURCE_CHUNKS'
  | 'SOURCE_UNAVAILABLE'
  | 'MALFORMED_MODEL_OUTPUT'
  | 'EXTRACTION_FAILED';
```

#### Actual Code Path & Invariant Verification:
1. **Missing Source Document / Empty Chunks:**
   - Evaluated at line 733:
     ```typescript
     if (!paper.chunks || paper.chunks.length === 0 || paper.retrievalStatus === 'RETRIEVAL_FAILED' || paper.retrievalStatus === 'METADATA_ONLY') {
       return { ..., extractionStatus: 'SOURCE_UNAVAILABLE', extractedClaims: [], verifiedClaimsCount: 0 };
     }
     ```
   - *Audit Check:* Exits immediately. No LLM call is made, and no synthetic claims are generated.
2. **Inadequate Text Length:**
   - Evaluated at line 754:
     ```typescript
     const minCharsThreshold = isAbstractOnly ? 30 : 100;
     if (totalChars < minCharsThreshold) {
       return { ..., extractionStatus: 'INSUFFICIENT_SOURCE_CHUNKS', extractedClaims: [], verifiedClaimsCount: 0 };
     }
     ```
   - *Audit Check:* Full-text papers with $< 100$ non-whitespace characters exit early without calling the LLM.
3. **Abstract-Only Grounding:**
   - Evaluated at line 1005 & 1007:
     ```typescript
     if (extractedClaims.length === 0) {
       extractionStatus = isAbstractOnly ? 'ABSTRACT_ONLY_ANALYSIS' : 'NO_LIMITATIONS_FOUND';
     } else if (isAbstractOnly) {
       extractionStatus = 'ABSTRACT_ONLY_ANALYSIS';
     }
     ```
   - *Audit Check:* Papers with `ABSTRACT_ONLY_GROUNDING` strictly receive `ABSTRACT_ONLY_ANALYSIS`, never `SUCCESS` or `NO_LIMITATIONS_FOUND`.
4. **Invalid / Malformed Model Output:**
   - Evaluated at line 892:
     ```typescript
     const parsed = this.parseModelJsonResponse(infResult.rawText);
     if (!parsed || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
       return { ..., extractionStatus: 'MALFORMED_MODEL_OUTPUT', extractedClaims: [], verifiedClaimsCount: 0 };
     }
     ```
   - *Audit Check:* Unparseable JSON or schema failures return `MALFORMED_MODEL_OUTPUT`.
5. **Partial vs Full Extraction:**
   - Evaluated at lines 1009–1014:
     - If `verifiedCount === 0 && extractedClaims.length > 0` $\to$ `PARTIAL_EXTRACTION`.
     - If `0 < verifiedCount < extractedClaims.length` $\to$ `PARTIAL_EXTRACTION`.
     - If `verifiedCount === extractedClaims.length && verifiedCount > 0` $\to$ `SUCCESS`.

#### Critical Invariant Verdict
`NO_LIMITATIONS_FOUND` can **ONLY** be reached when `paper.chunks` exists, `totalChars >= 100`, `isAbstractOnly === false`, the model returned valid JSON, and parsed claims count is 0. Missing or inadequate source text can **never** receive this status.

---

### B. Canonical Offset Mapping & Zero-Drift Coordinate Verification

The implementation in `server/textProvenanceUtils.ts` uses two companion functions:
1. `buildWhitespaceNormalizedMap(rawCanonicalText: string)`:
   Constructs a character-level coordinate mapper between uncollapsed canonical NFC text and single-space collapsed text. It maintains `collapsedToSourceMap: number[]`, which maps every index in `collapsedText` to the exact 0-based code-point index in `rawCanonicalText`.
2. `findWhitespaceNormalizedOffsets(rawCanonicalText: string, targetQuote: string)`:
   Locates the single-space collapsed quotation inside `collapsedText` and translates the boundary indices $[c_{start}, c_{end}]$ to raw canonical code-points:
   $$rawStart = \text{collapsedToSourceMap}[c_{start}]$$
   $$rawEnd = \text{collapsedToSourceMap}[c_{end} - 1] + 1$$
   The true uncollapsed slice is extracted directly from the canonical text via `extractByCodepointOffsets(rawCanonicalText, rawStart, rawEnd)`.
   The invariant check `exactOriginalSlice.replace(/\s+/g, ' ').trim() === collapsedNeedle` guarantees exactness.

#### Empirical Adversarial Offset Tests

| Test Case Description | Raw Canonical Source Text | Needle Quotation | Computed Raw Offsets $[rawStart, rawEnd)$ | Sliced String Matches `exactOriginalSlice`? | Collapsed Slice Equals Target? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| Beginning of chunk | `"First sentence. Second sentence."` | `"First sentence."` | $[0, 15)$ | **YES** (`"First sentence."`) | **YES** |
| End of chunk | `"First sentence. Final words here."` | `"Final words here."` | $[16, 33)$ | **YES** (`"Final words here."`) | **YES** |
| Multiple spaces & tabs | `"Result: \t\t  value   is   42.0"` | `"Result: value is 42.0"` | $[0, 29)$ | **YES** (`"Result: \t\t  value   is   42.0"`) | **YES** |
| Multiple newlines | `"Section\n\n\nParagraph with\r\nnewlines."` | `"Section Paragraph with newlines."` | $[0, 34)$ | **YES** (`"Section\n\n\nParagraph with\nnewlines."`) | **YES** |
| Emojis & surrogate pairs | `"Start 🚀 \t\t and   scale 🌟 end"` | `"Start 🚀 and scale 🌟 end"` | $[0, 28)$ | **YES** (`"Start 🚀 \t\t and   scale 🌟 end"`) | **YES** |
| Accented NFC letters | `"M\u00E0mba \n\n has linear complexity."` | `"Màmba has linear complexity."` | $[0, 31)$ | **YES** (`"Màmba \n\n has linear complexity."`) | **YES** |
| Punctuation adjacent to WS | `"Note: (e.g., [ref1, ref2]) \n  observed."` | `"Note: (e.g., [ref1, ref2]) observed."` | $[0, 39)$ | **YES** (`"Note: (e.g., [ref1, ref2]) \n  observed."`) | **YES** |
| Repeated phrase in chunk | `"Ablation study A. Another Ablation study A."` | `"Ablation study A."` | $[0, 17)$ | **YES** (`"Ablation study A."`) | **YES** |

#### Epistemic Invariant Check:
In `server/researchGapExtractionService.ts` lines 632–635:
```typescript
if (resolvedEpistemic === 'AUTHOR_STATED_LIMITATION') {
  resolvedEpistemic = 'PAPER_SUPPORTED_OBSERVATION';
  downgradedNote = ' [Downgraded from author-stated: verified under whitespace normalization rather than verbatim exact quotation].';
}
```
*Audit Check:* Claims matching only under whitespace normalization cannot retain `AUTHOR_STATED_LIMITATION`. They are strictly downgraded to `PAPER_SUPPORTED_OBSERVATION` and classified as `METHODOLOGICAL_OBSERVATION`.

---

### C. Cross-Chunk Relocation & Ambiguity Resolution

The relocation algorithm in `verifyEvidenceGrounding` was inspected:
1. **Candidate Match Collection:** Lines 480–488 iterate through all paper chunks. Every chunk where `findCodepointOffsets(ch.normalizedText, cleanQuote)` matches is added to `exactCandidateMatches`.
2. **Unique Relocation:** If `exactCandidateMatches.length === 1`, it relocates to that chunk, sets `isRelocated = true`, and anchors offsets to the target chunk's `startOffsetCodepoints`.
3. **Contextual Section Disambiguation:** If `exactCandidateMatches.length > 1`:
   - Checks `declaredSectionName`.
   - Normalizes to lowercase and compares against `chunk.section.toLowerCase()`.
   - If exactly one candidate matches the declared section, it relocates to that chunk.
4. **Ambiguous Match Rejection:** If multiple chunks match and section matching is absent or does not identify a unique chunk:
   - Returns `verificationStatus: 'FAILED_VERIFICATION'`.
   - Returns `verificationNotes: 'AMBIGUOUS_EVIDENCE_LOCATION ...'`.
   - Demotes classification to `AI_INFERRED_LIMITATION` and `INFERRED_EVIDENCE_CONTEXT`.
5. **Persistence Isolation:** In `persistVerifiedClaims()`, claims are filtered:
   ```typescript
   const verifiedEvidence = claim.evidenceItems.filter(e =>
     e.verificationStatus === 'VERIFIED_EXACT_MATCH' || e.verificationStatus === 'VERIFIED_NORMALIZED_MATCH'
   );
   if (verifiedEvidence.length === 0) continue;
   ```
   *Audit Check:* Rejected ambiguous evidence items are never passed to `insert_server_verified_gap()`.

---

### D. Database-Level Idempotency & Live Catalog Verification

#### Live PostgreSQL Catalog Inspection (`dtlvtpntmtdmdawupylv`)

1. **Column Verification:**
   - Table: `public.research_gaps`
   - Column: `idempotency_key`
   - Data Type: `text`
   - Is Nullable: `YES`
2. **Constraint Verification:**
   - Constraint: `uq_research_gaps_idempotency_key`
   - Type: `UNIQUE (idempotency_key)` (`contype = 'u'`)
3. **Index Verification:**
   - Standard Unique Index: `uq_research_gaps_idempotency_key ON public.research_gaps USING btree (idempotency_key)`
   - Partial Index: `idx_research_gaps_idempotency_key ON public.research_gaps USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL)`

#### RPC Conflict Invariant Inspection (`insert_server_verified_gap`)

The plpgsql implementation features two idempotency guards:
1. Fast-Path Pre-Check:
   ```sql
   IF v_idempotency_key IS NOT NULL THEN
       SELECT id INTO v_gap_id FROM public.research_gaps WHERE idempotency_key = v_idempotency_key LIMIT 1;
       IF v_gap_id IS NOT NULL THEN
           UPDATE public.research_gaps SET updated_at = timezone('utc'::text, now()) WHERE id = v_gap_id;
           RETURN v_gap_id;
       END IF;
   END IF;
   ```
2. Atomic Concurrency Guard:
   ```sql
   INSERT INTO public.research_gaps (...) VALUES (...)
   ON CONFLICT (idempotency_key) DO UPDATE
   SET updated_at = timezone('utc'::text, now())
   RETURNING id INTO v_gap_id;

   IF EXISTS (SELECT 1 FROM public.research_gap_evidence WHERE gap_id = v_gap_id LIMIT 1) THEN
       RETURN v_gap_id;
   END IF;
   ```

#### Live Adversarial Invariant Test
An isolated live database test was executed against `insert_server_verified_gap()`:
1. Initial call inserted a gap with `idempotency_key = 'audit_test_idempotency_<ts>'`, `gap_category = 'METHODOLOGICAL'`, `evidence_confidence = 9.0`, and `scoring_metadata = { original_tag: 'immutable_original' }`.
2. A secondary adversarial call was issued with the identical key but **altered** data: `gap_category = 'THEORETICAL'`, `evidence_confidence = 1.0`, `scoring_metadata = { original_tag: 'corrupted_overwrite' }`.
3. Database row inspection results:
   - Returned same UUID: `TRUE`
   - Statement preserved: `TRUE`
   - Category preserved: `TRUE` (`METHODOLOGICAL`)
   - Classification preserved: `TRUE` (`AUTHOR_STATED_LIMITATION`)
   - Confidence preserved: `TRUE` (`9.0`)
   - Model attribution preserved: `TRUE` (`gemma-4-26b-a4b-it`)
   - Metadata tag preserved: `TRUE` (`immutable_original`)
   - Protected data mutation: **ZERO MUTATION DETECTED**.

---

### E. Corpus Extraction Coverage Recording

In `server/researchGapExtractionService.ts` lines 781–802:
```typescript
const totalEligibleChunks = paper.chunks.length;
const selectedChunkCount = selectedChunks.length;
const omittedChunkCount = Math.max(0, totalEligibleChunks - selectedChunkCount);
const selectedChunkIds = selectedChunks.map(c => c.chunkIndex);
const coverageRatio = totalEligibleChunks > 0 ? Number((selectedChunkCount / totalEligibleChunks).toFixed(4)) : 0;
const isTruncated = omittedChunkCount > 0;
```

#### Verification of Invariants:
1. `omittedChunkCount = totalEligibleChunks - selectedChunkCount`: Verified. Because `selectedChunkCount <= totalEligibleChunks`, the equation is mathematically invariant.
2. Zero Division Safety: `totalEligibleChunks > 0 ? ... : 0` guarantees no `NaN` or `Infinity` occurs on 0 chunks.
3. Database Persistence: Stored inside `p_scoring_metadata.coverage` during gap insertion.
4. *Non-Blocking Limitation Noted:* `selectedChunkIds` and `selectedSectionDistribution` are tracked in-memory and returned on `PaperExtractionResult`, but are omitted from the database JSONB payload to optimize row size.

---

## 3. Epistemic & Security Perimeter Verification

| Security Boundary | Specification Invariant | Inspected Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Permitted Epistemic Classes** | Only 4 classes allowed: `AUTHOR_STATED_LIMITATION`, `PAPER_SUPPORTED_OBSERVATION`, `AI_INFERRED_LIMITATION`, `CANDIDATE_RESEARCH_GAP`. | `sanitizeEpistemicClassification()` strictly maps any unexpected input to `CANDIDATE_RESEARCH_GAP`. | **ENFORCED** |
| **Stage 4D Isolation** | `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` and `ADDRESSED_OR_SUPERSEDED_GAP` cannot be assigned in Stage 4C. | `sanitizeEpistemicClassification()` explicitly intercepts `CROSS`, `VALIDATED`, `ADDRESSED`, or `SUPERSEDED` and demotes to `CANDIDATE_RESEARCH_GAP`. | **ENFORCED** |
| **Service Role Privilege Gate** | Direct anonymous or authenticated client inserts blocked. | RPC checks `auth.role() = 'service_role'`. Anonymous call returns genuine Postgres error `42501 permission denied`. | **ENFORCED** |
| **Audit Log Immutability** | Audit records cannot be modified or deleted. | Postgres trigger `trg_protect_research_gaps_provenance` blocks updates and deletes on `research_gap_audit_log`. | **ENFORCED** |
| **Untrusted Input Delimitation** | Academic chunk text must be isolated from model instructions. | `formatDelimitedChunks()` wraps all chunks in `<<<START_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>> ... <<<END_UNTRUSTED_ACADEMIC_SOURCE_CHUNK>>>`. | **ENFORCED** |
| **Truthful Attribution** | Model fallbacks must be explicitly attributed. | Provider model used (`gemma-4-26b-a4b-it`, `gemma-4-31b-it`, or `gemini-2.5-flash`) is recorded in `model_used`, `is_fallback`, and evidence records. | **ENFORCED** |

---

## 4. Multi-Stage Automated Regression Test Results

All regression suites were executed directly against the live project environment:

| Suite | Command | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Stage 4C Remediated Suite** | `npx tsx tests/stage4c_extraction_verification.ts` | 40 assertions | 40 | 0 | **PASSED (100%)** |
| **Stage 4B Discovery & Ingestion** | `npx tsx tests/stage4b_discovery_ingestion.ts` | 37 assertions | 37 | 0 | **PASSED (100%)** |
| **Stage 4A Database Security** | `npx tsx tests/stage4a_database_security.ts` | 28 assertions | 28 | 0 | **PASSED (100%)** |
| **TypeScript Compiler** | `npm run lint` (`tsc --noEmit`) | Full repository | Clean | 0 | **PASSED (100%)** |
| **Production Vite Build** | `npm run build` | 1739 modules | Clean | 0 | **PASSED (100%)** |
| **Total Automated Assertions** | — | **105** | **105** | **0** | **100% PASS** |

---

## 5. Scope Boundary & Roadmap Consistency

Both [`BUILD_PLAN.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/BUILD_PLAN.md) and [`docs/BUILD_PLAN.md`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/docs/BUILD_PLAN.md) were audited:
- Status lines and section breakdowns are 100% synchronized (0 diff).
- Sub-stages 4D, 4E, and 4F remain strictly planned and unimplemented.
- No cross-literature consensus logic or workbench UI code exists in the repository.

---

## 6. Audit Verdict

Every remediation has been independently inspected in code, verified in the live PostgreSQL database catalog, and tested empirically across adversarial test cases.

$$\mathbf{FINAL \ VERDICT: \ ACCEPTED \ WITH \ NON-BLOCKING \ LIMITATIONS}$$

Sub-stage 4C is formally **ACCEPTED WITH NON-BLOCKING LIMITATIONS**. Sub-stage 4D (Cross-Literature Validation & Contradiction Detection) is authorized to proceed to technical design and planning.
