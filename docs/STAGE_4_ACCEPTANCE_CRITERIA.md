# Anvīkṣā — Stage 4: Acceptance Criteria & Verification Protocol
## Explicit Quality Gates, Non-Negotiable Invariants & Stage 4 Definition of Done

**Document Version:** 4.1.0-REVISED  
**Status:** Acceptance Criteria & Verification Gates (Implementation Prohibited in this Phase)  
**Author:** Principal Quality Auditor & Systems Architect  
**Target Milestone:** Stage 4 — Research Gap Discovery & Validation Engine  

---

## 1. Epistemic Integrity Invariants (Non-Negotiable)

Any implementation that violates any of the following invariants will fail acceptance immediately:

1. **The Single-Paper Invariant:**
   *A candidate research gap extracted from a single research paper can NEVER be designated as a cross-literature validated gap.* It must remain `CANDIDATE_RESEARCH_GAP` until corroborated across at least two independent publications from distinct research groups.

2. **The Non-Automatic Superseding Invariant:**
   *Publication chronology alone ($Date_B > Date_A$) must NEVER automatically mark an earlier limitation as resolved.* Resolution requires explicit, reproducible benchmark evidence proving that Paper B resolved the specific limitation under comparable experimental conditions without introducing prohibitive regressions.

3. **The Absence-of-Evidence Rule:**
   *The absence of a topic or mention in a publication must never be asserted as an unaddressed scientific research gap.* Gaps must be anchored in demonstrated empirical failure, active measurement limits, or explicit author concessions, corroborated against broader literature coverage.

4. **The Provenance Truthfulness & Verifiable Attribution Invariant:**
   Every gap, evidence quote, and limitation must carry verifiable provenance (exact character offsets, SHA-256 chunk hash, exact section locators). AI-generated deductions must never be falsely attributed to the source authors.

5. **The Zero-Mock Invariant:**
   All papers, DOIs, citations, and evidence snippets displayed in Stage 4 must originate from authentic OpenAlex records or user-uploaded PDFs. No fabricated papers, simulated citation counts, or phantom benchmarks are permitted.

---

## 2. Sub-Stage Acceptance Gates

---

### Gate 4A: Knowledge Representation & Database Security
- [ ] `public.research_gaps`, `public.research_gap_evidence`, `public.research_gap_validations`, and `public.research_gap_audit_log` tables created in Supabase with foreign keys, compound indexes, and audit constraints.
- [ ] RLS policies enabled: public/community gaps viewable anonymously; private drafts strictly restricted to `auth.uid() = created_by`.
- [ ] Trigger `protect_research_gaps_provenance()` rejects any client attempt to insert or update `verified_by_server = true`.
- [ ] RPC `insert_server_verified_gap` grants `EXECUTE` exclusively to `service_role`. Execution by `anon` or `authenticated` throws access denied exception.
- [ ] Service-role verification test successfully inserts, retrieves, and cleans up an auditable test gap record.

---

### Gate 4B: Literature Corpus Discovery & Multi-Paper Ingestion
- [ ] Literature discovery engine successfully executes OpenAlex keyword searches, forward citation lookups, and targeted counter-evidence queries.
- [ ] DOI and OpenAlex ID deduplication ensures zero redundant paper ingests.
- [ ] Full-text retrieval pipeline downloads OA PDFs via SSRF-hardened validator (`server/ssrfValidator.ts`).
- [ ] Text parser partitions papers into IMRAD sections, generates character offset maps, and attaches SHA-256 content hashes to every chunk.
- [ ] Batch execution cap (3–12 papers per batch) protects against server resource exhaustion.

---

### Gate 4C: Gap Extraction & Epistemic Classification
- [ ] Extracted gaps are categorized into one of the 12 defined dimensions without forcing irrelevant categories.
- [ ] Every extracted candidate includes non-empty `unexplored_condition`, exact `character_offsets`, and verified `epistemic_class`.
- [ ] Verbatim quotation validator verifies quotes against stored chunk text; non-matching quotes are flagged as `FAILED_VERIFICATION`.
- [ ] Prompt injection defense: untrusted paper text wrapped in structural delimiters; zero tool access granted to extraction prompt.

---

### Gate 4D: Cross-Literature Validation & Contradiction Detection
- [ ] Multi-paper cross-validation correctly classifies evidence into the 5 explicit outcomes: `CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`.
- [ ] Chronology check alone does not supersede gaps; side-by-side benchmark comparison evaluates actual resolution.
- [ ] Benchmark Validation: Evaluated on *FlashAttention-1* vs *FlashAttention-2*, the work-partitioning limitation is correctly marked `ADDRESSED`. Evaluated on *FlashAttention* vs *Mamba*, Mamba is marked `PARTIALLY_ADDRESSED` with active trade-offs on associative recall.
- [ ] Every epistemic transition creates an immutable record in `public.research_gap_audit_log`.

---

### Gate 4E: Opportunity Ranking, Hypothesis & Experiment Generation
- [ ] Explainable multi-factor opportunity scores calculated across all 6 dimensions ($S_{confidence}, S_{novelty}, S_{significance}, S_{feasibility}, S_{tractability}, S_{priority}$).
- [ ] Gaps with active contradictions receive non-linear penalties capping confidence at $\le 3.0$.
- [ ] Hypothesis synthesis adheres strictly to the Popperian conditional format (*"If [manipulation], then [observation] compared to [baseline], because [mechanism]"*).
- [ ] Variable specification includes explicit `independent`, `dependent`, and `control` attributes with verifiable failure thresholds.

---

### Gate 4F: Research Gap Discovery Workbench & UI Integration
- [ ] Interactive workbench seamlessly adopts Anvīkṣā's beige/orange design aesthetic (`#FAEDCD`, `#CCD5AE`, `#8B5E34`).
- [ ] Multi-Paper Gap Matrix displays real-time epistemic badges, multi-factor scores, and evidence counts.
- [ ] Evidence inspection drawer displays exact quotes, character offsets, SHA-256 hashes, and side-by-side contradictory snippets.
- [ ] One-click conversion allows validated gaps to transition into public community `Challenges`.
- [ ] Clean TypeScript compile (`npx tsc --noEmit`) and Vite production build (`npm run build`).

---

## 3. Definition of Done for Stage 4

Stage 4 will be formally accepted only when:
1. All 6 sub-stage acceptance gates (4A–4F) are verified against the live application and connected database.
2. The benchmark evaluation suite passes against all three literature clusters without simulated data.
3. Regression suite confirms zero secret leakage, intact Stage 3 capabilities, and strict RLS enforcement across public and private research records.
