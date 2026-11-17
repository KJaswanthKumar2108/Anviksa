# Anvīkṣā — Stage 4A Implementation Report
## Literature Knowledge Graph & Provenance Infrastructure

**Document Version:** 4.1.0-REVISED  
**Target Milestone:** Stage 4A — Schema, Provenance, RLS & Trusted Persistence  
**Date of Audit & Execution:** 2026-11-17T20:21:30+05:30  
**Status:** FULLY VERIFIED & ACCEPTED  

---

## 1. Executive Summary

Stage 4A has been implemented and tested against the live Supabase PostgreSQL database (`dtlvtpntmtdmdawupylv`). 

The scope of this milestone was strictly limited to establishing the **Relational Literature Knowledge Graph (LKG)** database foundations:
1. Created additive, non-destructive schema tables (`research_gaps`, `research_gap_evidence`, `research_gap_validations`, `research_gap_audit_log`).
2. Implemented strict database-level separation between **Epistemic Classification** and **Validation Outcome**.
3. Established a versioned, normalized text offset convention (`start_offset`, `end_offset`, `offset_unit: 'codepoints'`, `text_normalization_version: 'v1.0-nfc-normalized'`) with dual SHA-256 checksums (`source_document_checksum`, `extracted_text_checksum`).
4. Hardened `research_relationships` against self-references (`chk_no_self_relationship`) and relationship duplicates (`idx_unique_research_relationship`).
5. Implemented `protect_research_gaps_provenance()` trigger and `protect_gap_audit_log_immutability()` trigger.
6. Implemented trusted `insert_server_verified_gap()` RPC with locked `search_path`, strict `service_role` check, and restricted execute privileges.
7. Enforced Row Level Security (RLS) across all 4 new tables.
8. Verified that Stage 3 functionality and provenance mechanisms remain fully intact.

---

## 2. Status Categorization

### IMPLEMENTED
- **Database Migration:** [`supabase/migrations/20261118_stage4a_literature_knowledge_graph.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4a_literature_knowledge_graph.sql)
- **Rollback Script:** [`supabase/migrations/20261118_stage4a_rollback.sql`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/supabase/migrations/20261118_stage4a_rollback.sql)
- **Enum Types:**
  - `public.research_gap_category` (12 categories)
  - `public.epistemic_classification` (6 tiers)
  - `public.validation_outcome` (5 outcomes)
  - `public.gap_visibility` (`private`, `community`, `public`)
- **Tables & Indexes:**
  - `public.research_gaps` with compound indexes on category/tier and priority.
  - `public.research_gap_evidence` with foreign keys, byte offsets, and SHA-256 checksums.
  - `public.research_gap_validations` with traceable JSONB evidence reference arrays.
  - `public.research_gap_audit_log` with immutable append-only constraints.
- **Constraints & Triggers:**
  - `chk_no_self_relationship` on `public.research_relationships`.
  - `idx_unique_research_relationship` unique index.
  - `trg_protect_research_gaps_provenance` trigger.
  - `trg_protect_gap_audit_log_immutability` trigger.
- **RPC Function:**
  - `public.insert_server_verified_gap()` (`SECURITY DEFINER`, search path locked to `public, pg_temp`, execution granted strictly to `service_role`).
- **Row Level Security Policies:**
  - Public/community published gaps viewable anonymously; private drafts strictly isolated to owner.
  - Evidence, validations, and audit logs restricted in alignment with parent gap visibility.
  - Direct unauthorized client inserts/updates rejected.

### TESTED
- Automated test script: [`tests/stage4a_database_security.ts`](file:///c:/Users/jaswa/Downloads/Anvīkṣā/tests/stage4a_database_security.ts).
- Executed via Node.js / esbuild against the live Supabase project.

| Test # | Test Description | Result | Output Details |
| :---: | :--- | :---: | :--- |
| **1** | Valid Gap Insertion via RPC (`insert_server_verified_gap`) | **PASS** | HTTP 200, returned UUID `9bf2bb67-21ae-4f30-b369-f4cfa01b5a90`. |
| **2** | Invalid Epistemic Classification Rejection | **PASS** | Database rejected invalid enum with HTTP 400. |
| **3** | Invalid Validation Outcome Rejection | **PASS** | Database rejected invalid outcome enum with HTTP 400. |
| **4** | Single-Paper Direct Cross-Literature Validation Rejection | **PASS** | Direct client insert of `CROSS_LITERATURE_VALIDATED_RESEARCH_GAP` rejected (HTTP 400). |
| **5** | Evidence Provenance Consistency & Checksums | **PASS** | Preserved exact offsets [1420, 1511], SHA-256 hashes, and normalization version. |
| **6** | Immutable Audit History Verification | **PASS** | Initial audit record verified; modification attempt rejected by immutability trigger (HTTP 400). |
| **7** | Duplicate Relationship Rejection & Self-Reference Prevention | **PASS** | Self-reference rejected (HTTP 400); duplicate rejected (HTTP 409). |
| **8** | Direct Unauthorized Client Insertion Blocked | **PASS** | Client insert with `verified_by_server = true` rejected (HTTP 400). |
| **9** | Unauthorized RPC Execution Blocked (Genuine Auth Failure) | **PASS** | Anon call rejected with HTTP 401 (`permission denied for function insert_server_verified_gap`). |
| **10** | Private vs Published Visibility (RLS Isolation) | **PASS** | Anonymous fetch returned 0 records; Service role fetch returned 1 record. |
| **11** | Client Update Denial by RLS (Zero Row Impact) | **PASS** | Anonymous PATCH impacted 0 rows; database record remained untampered. |
| **12** | Trigger Blocks Provenance Tampering on Verified Rows | **PASS** | Verified row provenance locked; updates to non-provenance fields permitted. |
| **13** | Stage 3 Functionality Regression Verification | **PASS** | `insert_server_verified_analysis` executed with HTTP 200; UUID returned and verified. |

### VERIFIED
- **ACL Verification:**
  - `insert_server_verified_gap`: Granted to `service_role` and `postgres`. Denied to `PUBLIC`, `anon`, and `authenticated`.
  - Direct call with anon key produces authentic `42501 permission denied for function insert_server_verified_gap`.
- **Clean TypeScript Compilation:** `npm run lint` (`tsc --noEmit`) exited with code 0.
- **Clean Production Build:** `npm run build` (`vite build`) completed in 1.18s without errors.
- **Zero Mock Records:** All test records were transient and cleaned up immediately post-verification.

### BLOCKED
- *None.* All Stage 4A database, security, and verification requirements are satisfied.

### NOT IMPLEMENTED (Out of Scope for Stage 4A)
- In accordance with strict sub-stage isolation rules, the following modules are deferred to future sub-stages:
  - Sub-stage 4B: Literature Corpus Discovery & Multi-Paper Ingestion
  - Sub-stage 4C: Gap Extraction & Epistemic Classification Service
  - Sub-stage 4D: Cross-Literature Validation & Contradiction Detection Subsystem
  - Sub-stage 4E: Opportunity Ranking, Hypothesis & Experiment Protocol Synthesis
  - Sub-stage 4F: Research Gap Discovery Workbench & UI Integration

---

## 3. Database Migration Details

- **File:** `supabase/migrations/20261118_stage4a_literature_knowledge_graph.sql`
- **Rollback File:** `supabase/migrations/20261118_stage4a_rollback.sql`
- **Execution Summary:**
  ```sql
  -- Tables created:
  public.research_gaps
  public.research_gap_evidence
  public.research_gap_validations
  public.research_gap_audit_log

  -- Triggers created:
  trg_protect_research_gaps_provenance
  trg_protect_gap_audit_log_immutability

  -- Functions created:
  public.protect_research_gaps_provenance()
  public.protect_research_gap_audit_log_immutability()
  public.insert_server_verified_gap(...)
  ```

---

## 4. Definition of Done Compliance Matrix

| Requirement | Audit Status | Evidence |
| :--- | :---: | :--- |
| Schema implemented | **COMPLETED** | Tables, indexes, and enums active on live database. |
| Trusted insertion works | **COMPLETED** | Verified via `tests/stage4a_database_security.ts` (Test 1). |
| Unauthorized writes rejected | **COMPLETED** | Verified via Tests 4, 8, 9, and 11. |
| RLS privacy tests pass | **COMPLETED** | Verified via Test 10 (anonymous 0 rows, admin 1 row). |
| Historical audit integrity | **COMPLETED** | Verified via Test 6 (trigger aborts UPDATE/DELETE). |
| Stage 3 regression tests pass | **COMPLETED** | Verified via Test 13 (`insert_server_verified_analysis` HTTP 200). |
| Migration safety documented | **COMPLETED** | Additive migration + complete rollback script provided. |
| No fake research data introduced | **COMPLETED** | Transient test records purged; zero synthetic records seeded. |
