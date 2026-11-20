# Anvīkṣā — Stage 4: Implementation Roadmap
## Phased Sub-Stage Engineering Plan, Module Breakdown & Dependency Graph

**Document Version:** 4.1.0-REVISED  
**Status:** Engineering Roadmap & Execution Plan (Implementation Prohibited in this Phase)  
**Author:** Principal Software Engineer & Delivery Lead  
**Target Milestone:** Stage 4 — Research Gap Discovery & Validation Engine  

---

## 1. Revised Sub-Stage Ordering & Dependency Graph

To respect logical dependencies—specifically ensuring literature discovery and ingestion precede extraction, and extraction precedes cross-validation—the execution sequence is structured as follows:

```mermaid
graph TD
    S4A["Sub-stage 4A: Evidence Graph, Schema & Provenance Infrastructure"] --> S4B["Sub-stage 4B: Literature Corpus Discovery & Multi-Paper Ingestion"]
    S4B --> S4C["Sub-stage 4C: Gap Extraction & Epistemic Classification"]
    S4C --> S4D["Sub-stage 4D: Cross-Literature Validation & Contradiction Detection"]
    S4D --> S4E["Sub-stage 4E: Opportunity Ranking, Hypothesis & Experiment Generation"]
    S4E --> S4F["Sub-stage 4F: Research Gap Discovery Workbench & Integration"]
```

---

## 2. Detailed Sub-Stage Specifications

---

### Sub-stage 4A: Evidence Graph, Schema & Provenance Infrastructure
- **Objective:** Establish the relational knowledge graph in Supabase PostgreSQL, create supporting evidence link tables with SHA-256 chunk hashes, implement epistemic audit logs, and enforce provenance protection triggers and RLS policies.
- **Files & Modules:**
  - `supabase/migrations/20261118_stage4_knowledge_graph.sql`
  - `src/types/researchGaps.ts`
  - `src/utils/researchGraphStore.ts`
- **Database Changes:**
  - Create tables: `public.research_gaps`, `public.research_gap_evidence`, `public.research_gap_validations`, `public.research_gap_audit_log`.
  - Create trigger: `protect_research_gaps_provenance()`.
  - Create RPC: `insert_server_verified_gap()`.
  - Implement RLS: private candidate gaps viewable only by creator; public/community gaps viewable by all.
- **API Endpoints:**
  - `GET /api/research/gaps` (list/filter gaps with RLS enforcement)
  - `GET /api/research/gaps/:id` (fetch gap with evidence and audit history)
- **Tests & Verification:**
  - `tests/stage4a_schema_rls.test.ts` (verify anon vs auth vs service-role security boundaries and RLS isolation).
- **Dependencies:** Stage 3 PostgreSQL configuration & `SUPABASE_SERVICE_ROLE_KEY`.

---

### Sub-stage 4B: Literature Corpus Discovery & Multi-Paper Ingestion
- **Objective:** Build an expandable literature discovery engine using OpenAlex keyword search, forward/backward citation traversal, targeted counter-evidence queries, and batch-bounded full-text retrieval with SSRF defense.
- **Files & Modules:**
  - `server/literatureDiscoveryService.ts`
  - `server/fullTextService.ts`
  - `server.ts`
- **Database Changes:** None.
- **API Endpoints:**
  - `POST /api/research/literature/discover` (searches, expands citations, deduplicates, and retrieves candidate papers)
  - `POST /api/research/literature/ingest-batch` (fetches full text, computes SHA-256 checksums, and partitions into IMRAD chunks)
- **Deterministic Responsibilities:** OpenAlex API requests, DOI deduplication, citation graph traversal, SSRF validation, text hash generation, and character offset mapping.
- **AI Responsibilities:** None (pure factual retrieval).
- **Tests & Verification:**
  - `tests/stage4b_literature_discovery.test.ts` (test forward/backward expansion, deduplication, and SSRF blocking).
- **Dependencies:** Sub-stage 4A schema.

---

### Sub-stage 4C: Gap Extraction & Epistemic Classification
- **Objective:** Implement the 12-category research gap extraction pipeline leveraging Gemma 4 MoE (`gemma-4-26b-a4b-it`) with exact substring verification, character offsets, and epistemic labeling (`AUTHOR_CONCESSION`, `EMPIRICAL_TABLE`, `AI_DEDUCTION`).
- **Files & Modules:**
  - `server/gapExtractionService.ts`
  - `server/evidenceGroundingValidator.ts`
  - `server.ts`
- **Database Changes:** None.
- **API Endpoints:**
  - `POST /api/research/gaps/extract-paper` (extracts candidate gaps from single paper)
  - `POST /api/research/gaps/extract-batch` (extracts across bounded batch of 3–12 papers)
- **Deterministic Responsibilities:** Exact substring matching, byte/character offset extraction, SHA-256 hash checking against source chunk, and Zod output schema enforcement.
- **AI Responsibilities:** Semantic extraction of subtle limitations across 12 dimensions via Gemma 4 MoE.
- **Tests & Verification:**
  - `tests/stage4c_gap_extraction.test.ts` (verifies extraction accuracy and exact quote verification).
- **Dependencies:** Sub-stage 4B ingestion.

---

### Sub-stage 4D: Cross-Literature Validation & Contradiction Detection *(ACCEPTED & IMPLEMENTED)*
- **Objective:** Validate candidate gaps across independent scholarly works, detect contradictory evidence under matched conditions, evaluate 5 explicit validation outcomes (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`), enforce composite foreign keys and partial unique indexes, and record transitions in `research_gap_audit_log`.
- **Files & Modules:**
  - `server/crossLiteratureValidationService.ts`
  - `server/methodologicalComparabilityEngine.ts`
  - `server/contradictionDetectionService.ts`
  - `server/provisionalValidationStrengthService.ts`
  - `server/sourceIndependenceService.ts`
  - `server.ts`
- **Database Tables & Constraints:**
  - `public.research_gap_validations`, `public.research_gap_relationships`, `public.research_gap_audit_log`.
  - Composite FK `(gap_id, validation_run_id)` with `ON DELETE RESTRICT`.
  - Four discrete partial unique indexes preventing nil UUIDs and duplicate relationships.
- **Tests & Verification:**
  - `tests/stage4d_validation_verification.ts` (56/56 passed with zero failures).

---

### Sub-stage 4D.1: Source Independence & Verification Integrity Hardening *(ACCEPTED & IMPLEMENTED)*
- **Objective:** Implement 5-tier conservative institutional identity resolution hierarchy, curated versioned alias registry v1.0.0, author full given-name parsing preventing East Asian surname collisions, multi-affiliation support, and adversarial regression verification.
- **Files & Modules:**
  - `server/sourceIndependenceService.ts`
  - `tests/stage4d_1_adversarial_verification.ts`
- **Tests & Verification:**
  - 44/44 passed across all 17 adversarial categories. Total platform tally: 207 checks (205 tests + 2 build checks).

---

### Sub-stage 4E: Opportunity Ranking, Hypothesis & Experiment Generation *(ARCHITECTURE DESIGN COMPLETE — IMPLEMENTATION PROHIBITED)*
- **Objective:** Transform validated literature gaps into prioritized research opportunities, Popperian falsifiable hypotheses, reproducible experiment protocols, and resource-aware research plans.
- **Architecture Specifications:**
  - `docs/STAGE_4E_ARCHITECTURE.md`
  - `docs/STAGE_4E_OPPORTUNITY_RANKING_METHODOLOGY.md`
  - `docs/STAGE_4E_HYPOTHESIS_METHODOLOGY.md`
  - `docs/STAGE_4E_EXPERIMENT_DESIGN_METHODOLOGY.md`
  - `docs/STAGE_4E_DATA_AND_API_DESIGN.md`
  - `docs/STAGE_4E_EVALUATION_FRAMEWORK.md`
  - `docs/STAGE_4E_ACCEPTANCE_CRITERIA.md`
- **Subsystems Designed:**
  - *Subsystem A:* Opportunity Intelligence & 6-Dimension Ranking ($S_{confidence}, S_{novelty}, S_{significance}, S_{feasibility}, S_{tractability}, S_{priority}$) with non-compensatory gates.
  - *Subsystem B:* Falsifiable Hypothesis Synthesis with 10-point rubric, operational variables, boundary conditions, and competing mechanism diversity.
  - *Subsystem C:* Reproducible Experiment Protocol Design across 11 paradigms with verified published baselines and quantitative falsification thresholds.
  - *Subsystem D:* Resource-Aware Research Planning modeling verified, declared, estimated, and unknown compute/data constraints.
  - *Workflow:* Researcher Review, Revision & Approval lifecycle preserving immutable provenance and audit history.
- **Status:** Architecture frozen and documented. Implementation strictly prohibited pending user authorization.

---

### Sub-stage 4F: Research Gap Discovery Workbench & Integration *(PLANNED — NOT IMPLEMENTED)*
- **Objective:** Deliver the interactive frontend workbench in Anvīkṣā's beige/orange design aesthetic, featuring the multi-paper gap matrix, evidence inspection drawers, contradiction side-by-side comparators, and one-click challenge publishing.
- **Files & Modules:**
  - `src/views/ResearchGapWorkbenchView.tsx`
  - `src/components/research/ResearchGapMatrix.tsx`
  - `src/components/research/EvidenceInspectionDrawer.tsx`
  - `src/components/research/ContradictionComparator.tsx`
  - `src/App.tsx`
- **Database Changes:** None.
- **Tests & Verification:**
  - End-to-end user walkthrough test; TypeScript validation (`npx tsc --noEmit`); Vite production build (`npm run build`).
- **Dependencies:** Sub-stages 4A–4E.
