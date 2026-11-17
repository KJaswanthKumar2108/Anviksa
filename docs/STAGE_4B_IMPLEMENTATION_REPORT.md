# Anvīkṣā — Stage 4B Implementation Report
## Literature Corpus Discovery & Multi-Paper Ingestion Pipeline

**Document Version:** 4.1.0-STAGE-4B  
**Milestone:** Stage 4B — Literature Corpus Discovery & Multi-Paper Ingestion  
**Execution Date:** 2026-11-17T21:14:15+05:30  
**Implementation Status:** FULLY IMPLEMENTED & TESTED  

---

## 1. Executive Summary

In accordance with the Stage 4B authorization and strict scope boundaries, the **Literature Corpus Discovery & Multi-Paper Ingestion Pipeline** has been implemented, integrated, and verified against real scholarly records.

### Strictly Respected Scope Boundaries:
- **Stage 4C is NOT implemented:** No Gemma gap extraction or 12-category mining.
- **Stage 4D is NOT implemented:** No cross-literature validation or contradiction classification.
- **Stage 4E is NOT implemented:** No opportunity scoring, hypothesis, or experiment generation.
- **Stage 4F is NOT implemented:** No Research Gap Workbench UI built.
- **Zero Mock Research Data:** No fabricated papers, synthetic citations, or fake authors were created.
- **Stage 3 & Stage 4A Security Preserved:** Intact SSRF validation, model attribution, and PostgreSQL RLS policies.

---

## 2. Deliverables & Implementation Status Matrix

| Component | Module Location | Status | Implementation Summary |
| :--- | :--- | :---: | :--- |
| **Multi-Vector Discovery** | `server/literatureDiscoveryService.ts` | **IMPLEMENTED** | Supports 5 orthogonal vectors: keyword search, backward citations (`referenced_works`), forward citations (`cites:W...`), concept/topic expansion, and targeted counter-evidence queries. |
| **Coverage Metadata** | `server/literatureDiscoveryService.ts` | **IMPLEMENTED** | Generates explicit coverage reporting: strategy contributions, queries executed, pagination states, rejection reasons, period distribution, and non-exhaustive disclaimer. |
| **Paper Deduplication** | `server/literatureDiscoveryService.ts` | **IMPLEMENTED** | Idempotent canonical DOI normalization (stripping URL/case prefixes) and canonical OpenAlex ID indexing (`W...`). |
| **Cryptographic Provenance** | `server/textProvenanceUtils.ts` | **IMPLEMENTED** | Computes runtime SHA-256 for source document and normalized text; extracts and verifies exact quotes using 0-based Unicode code-point offsets. |
| **Unicode Codepoint Offsets** | `server/textProvenanceUtils.ts` | **IMPLEMENTED** | Adheres strictly to `offset_unit = 'codepoints'` and `text_normalization_version = 'v1.0-nfc-normalized'`. Survives surrogate pair emoji boundaries without offset drift. |
| **Batch Ingestion Pipeline** | `server/multiPaperIngestionService.ts` | **IMPLEMENTED** | Bounded parallel worker pool (3 to 12 papers/batch) with complete failure isolation. Failed papers do not halt batch processing. |
| **Abstract-Only Evidence Policy**| `server/multiPaperIngestionService.ts` | **IMPLEMENTED** | Papers lacking accessible full-text PDFs fall back gracefully to structured abstracts with status `ABSTRACT_ONLY` and label `ABSTRACT_ONLY_GROUNDING`. |
| **REST API Endpoints** | `server.ts` | **IMPLEMENTED** | `POST /api/research/literature/discover` and `POST /api/research/literature/ingest-batch`. |
| **Automated Test Suite** | `tests/stage4b_discovery_ingestion.ts` | **TESTED** | 37 automated tests covering identity, offsets, SSRF, multi-vector discovery, batch ingestion, and regression. |
| **Stage 3 & 4A Regression** | `tests/stage4a_database_security.ts` | **VERIFIED** | All 28 Stage 4A database security tests and Stage 3 RPC insertion tests pass without regression. |

---

## 3. Detailed Verification Results

### 3.1 Automated Test Execution (`tests/stage4b_discovery_ingestion.ts`)
Executed against live OpenAlex API and live Supabase PostgreSQL database:

```
===============================================================
Anvīkṣā — Stage 4B Automated Discovery & Ingestion Test Suite
===============================================================

[Group 1] Canonical Paper Identity & Deduplication...
  [PASS] Normalized standard URL DOI: 10.1038/s41586-021-03819-2
  [PASS] Case and dx.doi.org protocol normalization matches: 10.1038/s41586-021-03819-2
  [PASS] Prefix 'doi:' normalization matches: 10.1038/s41586-021-03819-2
  [PASS] Normalized OpenAlex URL ID: W2963403868
  [PASS] Case insensitive OpenAlex ID matches: W2963403868

[Group 2] Unicode Code-Point Offsets & Cryptographic Integrity...
  [PASS] NFC normalization combined decomposed accents
  [PASS] SHA-256 computed: sha256:8bf2019a4b9b5...
  [PASS] Found codepoint offsets for substring across emoji boundary
  [PASS] Offset unit is codepoints: codepoints
  [PASS] Normalization version recorded: v1.0-nfc-normalized
  [PASS] Extracted substring matches target quote exactly: '🚀 and multi-head'
  [PASS] verifyQuoteAtCodepointOffsets evaluates true

[Group 3] SSRF Perimeter Defense Guard Tests...
  [PASS] Blocked IPv4 loopback (127.0.0.1): Access to private or reserved IP address (127.0.0.1) is blocked.
  [PASS] Blocked cloud metadata IP (169.254.169.254): Access to private or reserved IP address (169.254.169.254) is blocked.
  [PASS] Blocked localhost hostname: Access to localhost and internal domain names is blocked for security.
  [PASS] Blocked non-standard port 22: Port 22 is not permitted. Only standard web ports (80/443) are allowed.
  [PASS] Permitted legitimate arXiv public HTTPS endpoint: https://arxiv.org/pdf/1706.03762.pdf

[Group 4] Multi-Vector Literature Discovery (Live OpenAlex)...
  [PASS] Discovered candidate papers pool count: 25
  [PASS] Selected batch size bounded (3 to 12): 4
  [PASS] Executed multiple discovery strategies: keyword_search, backward_citation, forward_citation, counter_evidence, concept_expansion
  [PASS] Retrieved candidates >= selected candidates (25 >= 4)
  [PASS] Truthful coverage reporting: isExhaustive is false
  [PASS] Coverage note provided: Discovery bounded by configured sampling budget. Literature horizon remains expandable via pagination.
  [PASS] Targeted counter-evidence strategy registered in strategy contributions

[Group 5] Multi-Paper Batch Ingestion & Failure Isolation...
  [PASS] Requested batch count: 2
  [PASS] Batch items returned: 2
  [PASS] Found valid paper in batch results
  [PASS] Valid paper retrieval status: FULL_TEXT_RETRIEVED
  [PASS] Extracted text checksum generated: sha256:fcf2919d78e79...
  [PASS] Normalization version verified: v1.0-nfc-normalized
  [PASS] Offset unit verified: codepoints
  [PASS] Chunk SHA-256 hash verified: sha256:d4480e02b0b58...
  [PASS] Found invalid paper in batch results
  [PASS] Invalid paper failed safely with status: RETRIEVAL_FAILED
  [PASS] Failure error message captured: Requested research publication was not found on OpenAlex.
  [PASS] Batch count partition adds up completely

[Group 6] Stage 3 & Stage 4A Regression Safety Check...
  [PASS] Stage 3 RPC executes without regression (HTTP 200)

===============================================================
Test Results: 37 PASSED, 0 FAILED
===============================================================
```

### 3.2 Stage 4A Regression Verification (`tests/stage4a_database_security.ts`)
Re-executed full Stage 4A test suite post-implementation:
- **Result:** **28 PASSED, 0 FAILED**.
- Provenance triggers, RLS privacy rules, and service-role barriers remain active and unweakened.

### 3.3 TypeScript & Build Integrity
- `npm run lint` (`tsc --noEmit`): **Exited with code 0 (zero errors)**.
- `npm run build` (`vite build`): **Built in 835ms with zero errors**.

---

## 4. Definition of Done Compliance Matrix

| Requirement | Status | Evidence |
| :--- | :---: | :--- |
| Multi-vector discovery works | **VERIFIED** | Group 4 test verified all 5 discovery vectors on live OpenAlex. |
| Expandable beyond one batch | **VERIFIED** | Bounded candidate pool (e.g. 25 candidates) preserved separately from batch selection (4 papers). |
| Traceable citation expansion | **VERIFIED** | Tracks `seedPaper`, `referencedBySeedId`, and `citesSeedId` in candidate metadata. |
| Idempotent candidate deduplication | **VERIFIED** | Group 1 test verified standard, URL, dx.doi.org, and lowercase DOI matching. |
| Counter-evidence candidate discovery | **VERIFIED** | Group 4 verified `counter_evidence` strategy discovery and contribution. |
| Discovery coverage metadata recorded | **VERIFIED** | Coverage object returns strategies, queries, distribution, and non-exhaustive notes. |
| SSRF controls remain effective | **VERIFIED** | Group 3 verified blocking of 127.0.0.1, 169.254.169.254, localhost, and port 22. |
| Truthful retrieval status | **VERIFIED** | Distinguishes `FULL_TEXT_RETRIEVED`, `ABSTRACT_ONLY`, and `RETRIEVAL_FAILED`. |
| Runtime source and text hashes | **VERIFIED** | Group 2 & Group 5 verified runtime SHA-256 computation. |
| Unicode code-point offsets verified | **VERIFIED** | Group 2 verified codepoint offsets across emoji boundaries and combining marks. |
| Failure-isolated ingestion | **VERIFIED** | Group 5 verified that invalid paper `10.9999/...` fails without aborting valid paper. |
| Stage 3 & 4A regressions pass | **VERIFIED** | Group 6 and Stage 4A suite all pass (28/28). |
| Zero mock research data | **VERIFIED** | Integration tests ran against authentic works (`10.48550/arxiv.1706.03762` and `10.48550/arxiv.2312.00752`). |

---

## 5. Next Steps
Sub-stage 4B is complete. As instructed:
- **Work has stopped after Stage 4B.**
- Sub-stage 4C (Gemma 4 Epistemic Gap Extraction) has NOT been started and awaits explicit authorization.
