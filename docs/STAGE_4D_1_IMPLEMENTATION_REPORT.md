# Anvīkṣā — Stage 4D.1 Implementation & Hardening Report
## Source Independence & Verification Integrity Hardening

**Milestone:** Stage 4D.1  
**Architecture Baseline:** Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)  
**Execution Mode:** Targeted Hardening, Adversarial Verification & Report Reconciliation  
**Live Supabase Project:** `dtlvtpntmtdmdawupylv` (Read-only verification; zero DDL or migrations)  
**Date:** 2026-11-19  

---

## 1. Executive Summary

Stage 4D.1 delivers targeted hardening to the **Source Independence Assessment Engine** (`server/sourceIndependenceService.ts`), implements a comprehensive 17-scenario adversarial regression suite (`tests/stage4d_1_adversarial_verification.ts`), and resolves the verification-count discrepancy in the Stage 4D post-implementation verification report.

All accepted Stage 4A–4D schemas, composite foreign keys, RLS policies, service-role isolation, and scoring models have been strictly preserved with zero regressions across all test suites. No database migrations were executed, and Sub-stages 4E–4F remain strictly unimplemented.

---

## 2. Deliverable 1: Institutional Identity Resolution & Author Safeguards

### 2.1 Five-Tier Conservative Institutional Resolution Hierarchy

In accordance with Stage 4D.1 requirements, `server/sourceIndependenceService.ts` replaces naive literal string matching with a deterministic 5-tier resolution hierarchy:

```
Raw Affiliation String / Entity
               │
               ▼
[Tier 1] ROR ID Direct Matching (https://ror.org/*)
         ├─ Matched in Curated Registry ──► Canonical ID & ROR (Certainty: HIGH)
         └─ Valid Extracted ROR ─────────► Normalized ror:{id} (Certainty: HIGH)
               │ (if no ROR ID)
               ▼
[Tier 2] Authoritative ID (OpenAlex institution ID)
         ├─ Matched in Curated Registry ──► Canonical ID & Name (Certainty: HIGH)
         └─ Clean OpenAlex ID ───────────► auth:{id} (Certainty: HIGH)
               │ (if no Authoritative ID)
               ▼
[Tier 3] Versioned Explicit Alias Registry (v1.0.0)
         ├─ Exact Normalized Match ──────► Canonical Registry Entry (Certainty: HIGH)
         └─ Delimited Segment Match ─────► Canonical Registry Entry (Certainty: HIGH)
               │ (if no Alias Match)
               ▼
[Tier 4] Conservative Normalized Name Comparison
         ├─ Length >= 4 chars ──────────► norm:{normalized_string} (Certainty: MEDIUM)
         └─ Short / Ambiguous Abbr ──────► unverified-abbr:{abbr} (Certainty: LOW, Zero Loose Match)
               │ (if empty / missing)
               ▼
[Tier 5] Missing / Unresolved Fallback ──► INDEPENDENCE_UNKNOWN (Certainty: LOW, isUnresolved: true)
```

### 2.2 Curated Versioned Alias Registry (`INSTITUTION_ALIAS_REGISTRY_VERSION = '1.0.0'`)

An explicit, pre-indexed registry was introduced for canonical research institutions and labs. Key entries include:
- `uc-berkeley` (`https://ror.org/01an7q238`): "UC Berkeley", "University of California, Berkeley", "UCB", etc.
- `ucla` (`https://ror.org/046rm7j60`): "University of California, Los Angeles", "UCLA", etc.
- `mit` (`https://ror.org/0420pxx49`): "Massachusetts Institute of Technology", "MIT", etc.
- `stanford-university` (`https://ror.org/00f54p054`): "Stanford University", "Stanford", "Leland Stanford Junior University", etc.
- `oxford-university` (`https://ror.org/052gg0110`): "University of Oxford", "Oxford University", etc.
- `carnegie-mellon-university` (`https://ror.org/05x2bcf40`): "Carnegie Mellon University", "CMU", etc.
- `university-of-washington` (`https://ror.org/00cvxb145`): "University of Washington", "UW", etc.
- `george-washington-university` (`https://ror.org/00y49b775`): "George Washington University", "GWU", etc.
- `washington-university-in-st-louis` (`https://ror.org/01yc7t268`): "Washington University in St. Louis", "WashU", "WUSTL", etc.
- `eth-zurich` (`https://ror.org/05a28rw58`): "ETH Zurich", "ETH Zürich", "Swiss Federal Institute of Technology Zurich", etc.
- `google-research` (`https://ror.org/0446vsg51`): "Google Research", "Google Brain", "Google DeepMind", etc.
- `microsoft-research` (`https://ror.org/0064kty71`): "Microsoft Research", "MSR", etc.
- `meta-ai` (`https://ror.org/03ad39j10`): "Meta AI", "FAIR", "Facebook AI Research", etc.
- `openai` (`https://ror.org/03snvf060`): "OpenAI", etc.

### 2.3 Explicit Non-Collision Guarantees

Homonymous or token-sharing institutions are provably isolated:
1. `University of Washington` vs. `George Washington University`: Normalized strings and registry keys are distinct; token overlap does not trigger false match.
2. `University of Washington` vs. `Washington University in St. Louis`: Canonical IDs `university-of-washington` vs `washington-university-in-st-louis` prevent false overlap.
3. `University of California, Berkeley` vs. `University of California, Los Angeles`: Segment isolation and distinct canonical entries prevent regional campus collisions.
4. Ambiguous unverified abbreviations (e.g. `SU`, `BU`): Assigned `Certainty: LOW`, preventing false collisions with Stanford University, Boston University, etc.

### 2.4 Author Identity Safeguards & East Asian Name Collisions

The author normalization engine was upgraded from single-initial mapping to full-name decomposition via `parseAuthorName()`:
- Correctly parses Western format (`"Wei Wang"`) and Eastern/Citation format (`"Wang, Wei"`).
- Retains the full given name in the canonical key (`"wang, wei"` vs `"wang, wen"`).
- Guarantees that East Asian authors sharing common surnames (e.g., `Wang, Wei` vs `Wang, Wen`) produce an author Jaccard similarity of exactly `0.0`.
- Protects against accidental conflation while maintaining backwards compatibility for existing single-author and initial-based formats.

### 2.5 Incomplete & Conflicting Affiliation Handling

- **Missing Affiliations Safe Fallback:** If one or both papers lack affiliation data and author lists are disjoint, the engine strictly outputs `INDEPENDENCE_UNKNOWN`. Missing data is never converted into false independence (`satisfiesIndependentReplication: false`).
- **Metadata Conflict Detection:** When a paper's raw institution name resolves to one canonical institution while its supplied ROR ID points to another, the engine flags `institutionMetadataConflict: true` and downgrades the assessment to `INDEPENDENCE_UNKNOWN`.

---

## 3. Deliverable 2: Adversarial Regression Test Suite

The new test suite `tests/stage4d_1_adversarial_verification.ts` was implemented and executed, covering all 17 required adversarial scenarios with zero failures:

| Scenario | Tested Invariant | Implementation Mechanism | Result |
| :---: | :--- | :--- | :---: |
| **1** | Exact institution-name match | Direct canonical ID & string equivalence | **PASS** |
| **2** | Verified aliases in curated registry | Resolves "UC Berkeley", "MIT", "Oxford" via registry | **PASS** |
| **3** | Unverified abbreviations | "SU" does not falsely collide with "Stanford University" | **PASS** |
| **4** | Punctuation, diacritics & whitespace | "ETH Zürich - Swiss Federal Institute" matches "ETH Zurich" | **PASS** |
| **5** | Unrelated institutions with similar names | UW vs GWU vs WashU, UCB vs UCLA are distinct | **PASS** |
| **6** | Multiple affiliations (2+ institutions) | Detects shared institution in multi-institutional papers | **PASS** |
| **7** | Missing affiliations fallback | Empty affiliations safely return `INDEPENDENCE_UNKNOWN` | **PASS** |
| **8** | Conflicting institution metadata | Name vs ROR ID mismatch flags conflict & returns unknown | **PASS** |
| **9** | Shared affiliation with disjoint authors | Disjoint authors at same institution yield `PARTIALLY_DEPENDENT` | **PASS** |
| **10** | Multiple strings resolving to same ROR | "Stanford" and "Leland Stanford Jr Univ" map to same ROR | **PASS** |
| **11** | Missing ROR identifiers | Clean fallback to alias registry without ROR ID | **PASS** |
| **12** | Author collision protection | East Asian names "Wang, Wei" vs "Wang, Wen" yield Jaccard 0.0 | **PASS** |
| **13** | Missing author metadata | Empty author list safely returns `INDEPENDENCE_UNKNOWN` | **PASS** |
| **14** | Two partially dependent studies | Two `PARTIALLY_DEPENDENT` studies cannot satisfy standard replication | **PASS** |
| **15** | Two genuinely independent groups | Two disjoint independent groups satisfy standard replication | **PASS** |
| **16** | Hybrid replication pathway | 1 independent + 1 partially dependent strictly requires human review | **PASS** |
| **17** | Landmark evidence pathway | Landmark claims without verifiable artifacts are rejected | **PASS** |

**Total Suite Result:** 44 PASSED, 0 FAILED.

---

## 4. Deliverable 3: Verification Count Reconciliation

### 4.1 Root Cause of Discrepancy in Stage 4D Verification Report

The Stage 4D post-implementation verification report (`STAGE_4D_POST_IMPLEMENTATION_VERIFICATION.md` and `docs/STAGE_4D_POST_IMPLEMENTATION_VERIFICATION.md`) previously displayed a master total of `164` tests. 

An arithmetic audit of the individual test suites revealed:
- Stage 4A (Database & Security): 28 assertions
- Stage 4B (Discovery & Ingestion): 37 assertions
- Stage 4C (AI Extraction & Remediation): 40 assertions
- Stage 4D (Validation & Verification): 56 assertions
- **Subtotal of Automated Test Assertions:** $28 + 37 + 40 + 56 = 161$ assertions
- **System Verification Steps:** TypeScript typecheck (`tsc --noEmit`, 1 check) + Vite client build (`vite build`, 1 check) = 2 checks
- **True Total Distinct Checks:** $161 + 2 = 163$ checks

The prior reported count of `164` was an arithmetic addition error ($161 + 2$ erroneously transcribed as $164$).

### 4.2 Reconciled Reporting

Both `STAGE_4D_POST_IMPLEMENTATION_VERIFICATION.md` and `docs/STAGE_4D_POST_IMPLEMENTATION_VERIFICATION.md` have been updated and reconciled to explicitly separate:
1. **Automated Test Assertions:** 161 tests across 4 suites (100% pass rate).
2. **System Build & Compiler Checks:** 2 checks (TypeScript typecheck & Vite production build, 0 errors).
3. **Master Platform Total:** 163 distinct checks (100% pass rate).

---

## 5. Master Regression & Platform Verification Execution

All platform test suites and compilation checks were executed sequentially:

| Suite / Step | Command | Assertions / Checks | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Stage 4A Database & Security** | `npx tsx tests/stage4a_database_security.ts` | 28 | 28 | 0 | **PASS** |
| **Stage 4B Discovery & Ingestion** | `npx tsx tests/stage4b_discovery_ingestion.ts` | 37 | 37 | 0 | **PASS** |
| **Stage 4C AI Extraction & Remediation** | `npx tsx tests/stage4c_extraction_verification.ts` | 40 | 40 | 0 | **PASS** |
| **Stage 4D Validation & Verification** | `npx tsx tests/stage4d_validation_verification.ts` | 56 | 56 | 0 | **PASS** |
| **Stage 4D.1 Adversarial Verification** | `npx tsx tests/stage4d_1_adversarial_verification.ts` | 44 | 44 | 0 | **PASS** |
| **TypeScript Typecheck** | `npm run lint` (`tsc --noEmit`) | 1 | 1 | 0 | **PASS** |
| **Vite Client Production Build** | `npm run build` (`vite build`) | 1 | 1 | 0 | **PASS** |
| **PLATFORM TOTAL** | — | **207** | **207** | **0** | **100% PASS** |

---

## 6. Scope Boundaries & Invariants

1. **Database Schema & Migrations:** Strictly zero DDL migrations applied. No live database mutations or schema adjustments were performed during Stage 4D.1.
2. **Sub-stages 4E–4F:** Strictly unexecuted. Hypothesis generation, opportunity ranking, and dedicated Workbench UI remain planned for their respective authorized milestones.
3. **Mathematical Formulation:** The provisional validation strength model ($S_{val}$) and its mandatory uncalibrated caveat notices remain preserved without alteration.
4. **Security & Access Control:** RLS policies, service-role isolation, composite foreign keys, and relationship uniqueness constraints remain 100% enforced.

---

## 7. Implementation Verdict

```
================================================================================
STAGE 4D.1 VERDICT:
STAGE 4D.1 COMPLETE — ACCEPTANCE WITH NON-BLOCKING LIMITATIONS
================================================================================
```

### Substantiation of Limitations:
1. **Curated Registry Coverage (Non-Blocking):** The explicit alias registry covers major international research universities and premier industrial AI labs (v1.0.0). Institutions outside this registry rely on normalized string matching and external ROR IDs provided by upstream indexing APIs (e.g., OpenAlex).
2. **Uncalibrated Provisional Validation Strength (Non-Blocking):** As documented in Stage 4D, empirical calibration (ECE calculation) requires an annotated gold-standard literature corpus, planned for Phase 5.
