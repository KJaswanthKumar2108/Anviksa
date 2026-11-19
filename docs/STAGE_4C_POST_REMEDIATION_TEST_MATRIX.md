# Anvīkṣā — Stage 4C Post-Remediation Test Matrix
## Detailed Assertion-Level Verification & Execution Matrix
### Architecture Specification: Version 4.1.0-REVISED

**Document Version:** 4.1.0-MATRIX  
**Date:** 2026-11-18T00:18:00+05:30  
**Test Suite:** [`tests/stage4c_extraction_verification.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4c_extraction_verification.ts)  
**Environment:** Live Node.js runtime, live Supabase PostgreSQL (`dtlvtpntmtdmdawupylv`), live Google GenAI API  

---

## 1. Test Classification Legend

- **Unit Test (UT):** Pure in-memory deterministic algorithm or math validation (e.g. Unicode slicing, coordinate translation).
- **Mocked Integration Test (MIT):** End-to-end service workflow with controlled in-memory input fixtures and mocked model JSON responses.
- **Live Database Integration Test (LDB):** Real transactional RPC executions and catalog queries against the live Supabase PostgreSQL cluster using service-role credentials.
- **Live Concurrency Test (LCT):** Concurrent asynchronous promises dispatched simultaneously across parallel network connections to verify database transaction and lock handling.
- **Live Model Inference Test (LMI):** Real API calls to Google GenAI for Gemma 4 MoE or Gemini fallback inference.

---

## 2. Stage 4C Test Execution Matrix (40 Assertions)

| Test Group | Test ID | Description | Type | Target Function / Boundary | Expected Result | Actual Result | Status |
| :---: | :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **Group 1** | **1.1a** | Exact quote accepted | UT | `verifyEvidenceGrounding()` | Status = `VERIFIED_EXACT_MATCH` | `VERIFIED_EXACT_MATCH` | **PASS** |
| | **1.1b** | Global start offset | UT | `verifyEvidenceGrounding()` | `startOffset = 1216` | `1216` | **PASS** |
| | **1.1c** | Global end offset | UT | `verifyEvidenceGrounding()` | `endOffset = 1286` | `1286` | **PASS** |
| | **1.2** | Exact slice reconstruction | UT | `extractByCodepointOffsets()` | Sliced text === exact target quote | Identical verbatim match | **PASS** |
| | **1.3a** | Semantic paraphrase rejected | UT | `verifyEvidenceGrounding()` | Status = `FAILED_VERIFICATION` | `FAILED_VERIFICATION` | **PASS** |
| | **1.3b** | Paraphrase epistemic downgrade | UT | `verifyEvidenceGrounding()` | Downgraded to `AI_INFERRED_LIMITATION` | `AI_INFERRED_LIMITATION` | **PASS** |
| | **1.4** | Empty quotation rejection | UT | `verifyEvidenceGrounding()` | Status = `FAILED_VERIFICATION` | `FAILED_VERIFICATION` | **PASS** |
| | **1.5** | NFC accent equivalence | UT | `normalizeScholarlyText()` | Decomposed `M\u0061\u0300mba` === composed `M\u00E0mba` | `VERIFIED_EXACT_MATCH` | **PASS** |
| **Group 2** | **2.1** | Normalized match found | UT | `findWhitespaceNormalizedOffsets()` | Result !== null | Returned offset object | **PASS** |
| | **2.2** | Original tabs/newlines preserved | UT | `extractByCodepointOffsets()` | Slice includes `\n\n` and `\t\t` | Preserved original formatting | **PASS** |
| | **2.3** | Collapsed slice equals target | UT | `extractByCodepointOffsets()` | `slice.replace(/\s+/g, ' ').trim() === target` | Identical collapsed string | **PASS** |
| | **2.4** | Verification status recorded | UT | `verifyEvidenceGrounding()` | Status = `VERIFIED_NORMALIZED_MATCH` | `VERIFIED_NORMALIZED_MATCH` | **PASS** |
| | **2.5** | Author limitation demoted | UT | `verifyEvidenceGrounding()` | Downgraded to `PAPER_SUPPORTED_OBSERVATION` | `PAPER_SUPPORTED_OBSERVATION` | **PASS** |
| | **2.6** | Exact raw slice preserved | UT | `verifyEvidenceGrounding()` | `exactOriginalSlice === recoveredSlice` | Exact match | **PASS** |
| | **2.7** | Global offset anchors to raw text | UT | `verifyEvidenceGrounding()` | `startOffset === 5000 + normRes.rawStart` | Exact raw offset anchor | **PASS** |
| **Group 3** | **3.1a** | Unique quote relocated | UT | `verifyEvidenceGrounding()` | Status = `VERIFIED_EXACT_MATCH` | `VERIFIED_EXACT_MATCH` | **PASS** |
| | **3.1b** | Relocation flag set | UT | `verifyEvidenceGrounding()` | `isRelocated === true` | `true` | **PASS** |
| | **3.1c** | Relocated to correct chunk | UT | `verifyEvidenceGrounding()` | `matchedChunk.chunkIndex === 12` | `12` | **PASS** |
| | **3.1d** | Global offset updated to chunk 12 | UT | `verifyEvidenceGrounding()` | `startOffset === 4000` | `4000` | **PASS** |
| | **3.2a** | Ambiguous multi-chunk rejected | UT | `verifyEvidenceGrounding()` | Status = `FAILED_VERIFICATION` | `FAILED_VERIFICATION` | **PASS** |
| | **3.2b** | Ambiguity notes recorded | UT | `verifyEvidenceGrounding()` | Notes contain `AMBIGUOUS_EVIDENCE_LOCATION` | Explicit note present | **PASS** |
| | **3.3a** | Multi-chunk section resolved | UT | `verifyEvidenceGrounding()` | Status = `VERIFIED_EXACT_MATCH` | `VERIFIED_EXACT_MATCH` | **PASS** |
| | **3.3b** | Resolved to matching section | UT | `verifyEvidenceGrounding()` | `matchedChunk.chunkIndex === 11` | `11` | **PASS** |
| **Group 4** | **4.1a** | Missing chunks returns unavailable | MIT | `extractFromPaper()` | `extractionStatus === 'SOURCE_UNAVAILABLE'` | `SOURCE_UNAVAILABLE` | **PASS** |
| | **4.1b** | Zero synthetic claims on missing | MIT | `extractFromPaper()` | `extractedClaims.length === 0` | `0` | **PASS** |
| | **4.2** | Short snippet returns insufficient | MIT | `extractFromPaper()` | `extractionStatus === 'INSUFFICIENT_SOURCE_CHUNKS'` | `INSUFFICIENT_SOURCE_CHUNKS` | **PASS** |
| | **4.3** | Abstract paper returns abstract status | MIT | `extractFromPaper()` | `extractionStatus === 'ABSTRACT_ONLY_ANALYSIS'` | `ABSTRACT_ONLY_ANALYSIS` | **PASS** |
| **Group 5** | **5.1** | Coverage metadata object exists | MIT | `extractFromPaper()` | `Boolean(coverage) === true` | `true` | **PASS** |
| | **5.2** | Total eligible chunks recorded | MIT | `extractFromPaper()` | `totalEligibleChunks === 20` | `20` | **PASS** |
| | **5.3** | Selected chunks bounded to 12 | MIT | `extractFromPaper()` | `selectedChunkCount === 12` | `12` | **PASS** |
| | **5.4** | Omitted chunks calculated | MIT | `extractFromPaper()` | `omittedChunkCount === 8` | `8` | **PASS** |
| | **5.5** | Truncation flag true | MIT | `extractFromPaper()` | `isTruncated === true` | `true` | **PASS** |
| | **5.6** | Coverage ratio deterministic | MIT | `extractFromPaper()` | `coverageRatio === 0.6` | `0.6` | **PASS** |
| | **5.7** | Evidence completeness preserved | MIT | `extractFromPaper()` | `evidenceCompleteness === 'FULL_TEXT'` | `FULL_TEXT` | **PASS** |
| **Group 6** | **6.1** | Initial gap inserted in database | LDB | `insert_server_verified_gap` | Returns valid UUID | `6b41659e-10cc-469b-8edd-eae0d5180238` | **PASS** |
| | **6.2** | Sequential retry deduplicated | LDB | `insert_server_verified_gap` | Returns identical UUID | `6b41659e-10cc-469b-8edd-eae0d5180238` | **PASS** |
| | **6.3** | Row count in database is 1 | LDB | `public.research_gaps` | Count = 1 (no duplicate rows) | Exactly 1 row | **PASS** |
| | **6.4** | Simultaneous concurrency deduplicated | LCT | `Promise.all` + RPC | Both parallel requests resolve to identical UUID | Both returned same UUID | **PASS** |
| | **6.5** | Distinct claim creates distinct row | LDB | `insert_server_verified_gap` | Returns distinct UUID | `24339e23-9e6e-44c6-ae8b-0b727cea8467` | **PASS** |
| | **6.6** | Test row cleanup completed | LDB | `DELETE FROM research_gaps` | Test rows removed cleanly | 0 orphan records | **PASS** |
| **Group 7** | **7.1** | Stage 3 RPC regression intact | LDB | `insert_server_verified_analysis` | HTTP 200, valid analysis UUID | Valid UUID returned | **PASS** |

---

## 3. Original Findings vs Final Post-Audit Disposition

| Audit Finding # | Finding Class | Original Limitation Description | Implemented Remediation | Independent Verification Method | Final Post-Audit Disposition |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | Defect | Empty source text returned `NO_LIMITATIONS_FOUND` | Partitioned into 7 distinct statuses (`SOURCE_UNAVAILABLE`, `INSUFFICIENT_SOURCE_CHUNKS`, `ABSTRACT_ONLY_ANALYSIS`, `NO_LIMITATIONS_FOUND`, `MALFORMED_MODEL_OUTPUT`, `PARTIAL_EXTRACTION`, `SUCCESS`). | Source code branch inspection & automated tests 4.1–4.3. | **RESOLVED & VERIFIED** |
| **2** | Limitation | Offset drift in `VERIFIED_NORMALIZED_MATCH` | Bidirectional coordinate mapper (`buildWhitespaceNormalizedMap`, `findWhitespaceNormalizedOffsets`) mapping to uncollapsed NFC source code-points. Raw slice preserved; author limitations downgraded. | Adversarial offset testing across 8 edge cases & automated tests 2.1–2.7. | **RESOLVED & VERIFIED** |
| **3** | Limitation | Ambiguous cross-chunk quotation relocation | Multi-candidate chunk collection, case-insensitive section disambiguation, and rejection as `FAILED_VERIFICATION` with `AMBIGUOUS_EVIDENCE_LOCATION`. | Multi-chunk synthetic tests (3.1–3.3) and RPC payload inspection. | **RESOLVED & VERIFIED** |
| **4** | Limitation | Duplicate gap rows created on retry | `idempotency_key` column, unique constraint `uq_research_gaps_idempotency_key`, and `ON CONFLICT (idempotency_key) DO UPDATE` in `insert_server_verified_gap()`. | Live database catalog audit, adversarial overwrite test, and tests 6.1–6.6. | **RESOLVED & VERIFIED** |
| **5** | Limitation | Unrecorded context truncation | Calculated `totalEligibleChunks`, `selectedChunkCount`, `omittedChunkCount`, `coverageRatio`, `isTruncated` and persisted in `scoring_metadata.coverage`. | Math invariant inspection and automated tests 5.1–5.7. | **RESOLVED & VERIFIED** |

---

## 4. Multi-Stage Master Regression Summary

| Milestone | Test Suite Script | Assertions | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Stage 4C (Remediated)** | [`tests/stage4c_extraction_verification.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4c_extraction_verification.ts) | 40 | 40 | 0 | **PASSED** |
| **Stage 4B (Corpus Ingestion)** | [`tests/stage4b_discovery_ingestion.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4b_discovery_ingestion.ts) | 37 | 37 | 0 | **PASSED** |
| **Stage 4A (Schema & Security)** | [`tests/stage4a_database_security.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4a_database_security.ts) | 28 | 28 | 0 | **PASSED** |
| **Typecheck** | `npm run lint` (`tsc --noEmit`) | Full repo | 0 errors | 0 | **PASSED** |
| **Production Build** | `npm run build` (`vite build`) | 1739 modules | 0 errors | 0 | **PASSED** |
| **Total Test Count** | — | **105** | **105** | **0** | **100% PASS** |
