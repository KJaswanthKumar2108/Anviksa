# Anvīkṣā — Stage 4D Post-Implementation Adversarial Verification Report
## Cross-Literature Validation & Contradiction Detection Engine

**Execution Mode:** STRICTLY READ-ONLY AUDIT  
**Architecture Baseline:** Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)  
**Database Project Under Audit:** Supabase Live `dtlvtpntmtdmdawupylv`  
**Audit Timestamp:** 2026-11-19T20:15:00+05:30  
**Audit Scope:** Full repository implementation, live Supabase schema, RLS, cryptographic hashing, scoring mathematics, benchmark validity, and regression safety.

---

## 1. Verification of Actual Implementation Files

The repository was inspected to map each architectural requirement to its exact concrete implementation file:

| Architecture Requirement | Exact Concrete Implementation File | Verification Status | Implementation Concordance Notes |
| :--- | :--- | :---: | :--- |
| **Methodological Comparability** | `server/methodologicalComparabilityEngine.ts` | **VERIFIED** | Implements 4 comparison classes, critical compatibility gates, and 5-valued dimension evaluations. |
| **Source Independence** | `server/sourceIndependenceService.ts` | **VERIFIED** | Evaluates author Jaccard, institutions, lineages, codebases across 4 states; implements strict 2-partial $\neq$ independent rule. |
| **Contradiction Detection** | `server/contradictionDetectionService.ts` | **VERIFIED** | Slices exact 0-based Unicode codepoints; bifurcates empirical disputes from gap-premise falsifications. |
| **Provisional Validation Strength** | `server/provisionalValidationStrengthService.ts` | **VERIFIED** | Deterministic $S_{val}$ formula with $\lambda=0.12$ recency decay, foundational baseline exemption, and contradiction dampener. |
| **Cross-Literature Orchestration** | `server/crossLiteratureValidationService.ts` | **VERIFIED** | Orchestrates discovery, comparability, independence, scoring, cryptographic `corpusHash`, and human review flags. |
| **Validation Persistence & RPC** | `supabase/migrations/20261119_stage4d_validation_infrastructure.sql` | **VERIFIED** | Deployed `insert_server_verified_validation()` (`SECURITY DEFINER`, service-role restricted, row-level locking). |
| **API Endpoints** | `server.ts` (lines 1140–1335) | **VERIFIED** | Exposes `POST /api/research/gaps/validate`, `GET .../validations`, `GET .../relationships`, `POST .../archive`, `POST .../purge`. |
| **Frontend UI Components** | `src/components/CrossLiteratureValidationPanel.tsx`<br>`src/views/AiAssistantView.tsx` | **VERIFIED** | Warm beige/orange palette (`#FAEDCD`, `#CCD5AE`, `#8B5E34`); uncalibrated warning banner; bilateral quote inspection. |
| **Administrative Archival & Purge** | `archive_research_gap()` & `purge_archived_research_gap()` in PostgreSQL | **VERIFIED** | Soft-archival with audit log; restricted purge prohibiting deletion of gaps with active evidence dependents. |

---

## 2. Adversarial Scientific Verification

### A. Methodological Comparability

#### 1. Comparison Classes
The implementation in `server/methodologicalComparabilityEngine.ts` (lines 9–13, 287–310) defines and enforces all four required comparison classes:
- `DIRECTLY_COMPARABLE`: Activated **only** when all four Tier 1 critical compatibility gates (`taskAlignment`, `operationalQuestion`, `metricFormulation`, `datasetDomain`) evaluate to `VERIFIED_COMPATIBLE`. Sets `isEligibleForDirectContradiction = true`.
- `RELATED_RESEARCH_QUESTIONS`: Activated when core task and operational question are aligned, but empirical metrics or dataset domains diverge. Blocked from direct empirical contradiction decisions (`isEligibleForDirectContradiction = false`).
- `CONTEXTUAL_EVIDENCE`: Activated when candidate work is theoretical, asymptotic complexity proof, or operates on distinct functional tasks. Blocked from direct contradiction.
- `INCOMMENSURABLE_CONTEXT`: Activated when `candidate.isOrthogonalParadigm = true`. Retained strictly in knowledge graphs for negative audit lineage and scope boundaries; disqualified from contradiction decisions.

#### 2. Five-Valued Dimension Semantics
The type `DimensionStatus` (lines 15–20) defines:
`'VERIFIED_COMPATIBLE' | 'INCOMPATIBLE' | 'NOT_REPORTED' | 'UNKNOWN' | 'NOT_APPLICABLE'`.

- **Denominator Exclusion for `NOT_APPLICABLE`:** Verified in `server/methodologicalComparabilityEngine.ts` (lines 258–285):
  ```typescript
  const weights = { base: 0.35, scale: 0.25, threat: 0.20, hard: 0.20 };
  let activeNumerator = 0;
  let applicableDenominator = 0;
  ...
  if (hardwareEval.status !== 'NOT_APPLICABLE') {
    activeNumerator += hardwareEval.score * weights.hard;
    applicableDenominator += weights.hard;
  }
  const overallComparabilityScore = applicableDenominator > 0 
    ? Math.max(0.0, Math.min(1.0, activeNumerator / applicableDenominator))
    : 0.0;
  ```
  When `candidate.isTheoreticalOrComplexityPaper = true`, `hardwareEval.status` is set to `'NOT_APPLICABLE'` with score `NaN`. The calculation strictly avoids adding `weights.hard` to `applicableDenominator`, correctly normalizing $R_{meth}$ over the remaining active dimensions (sum of weights = 0.80) without NaN corruption.
- **Missing Information Handling:** If `task`, `operationalQuestion`, `metricFormulation`, or `datasetDomain` is absent, the gate evaluates to `'NOT_REPORTED'` with `score = 0.0`. Because `allCriticalGatesPassed` strictly requires `VERIFIED_COMPATIBLE`, missing data cannot silently become compatible.
- **Adversarial Limitation Identified:** In `evaluateOperationalAlignment` (lines 96–114), question alignment is computed via bag-of-words token overlap:
  ```typescript
  const seedTerms = new Set(cleanSeed.split(/\s+/).filter(w => w.length > 3));
  const candTerms = new Set(cleanCand.split(/\s+/).filter(w => w.length > 3));
  ...
  if (overlapRatio >= 0.4 || variableAligned) -> VERIFIED_COMPATIBLE
  ```
  *Finding:* If two disparate papers share generic technical terms exceeding 3 characters (e.g., "optimization", "evaluation", "transformer", "network", "performance"), an overlap ratio of $\ge 0.40$ can occur without domain stop-word filtering or semantic embedding cosine verification. While mitigated by Tier 1 metric and dataset gates, this token heuristic is a non-critical limitation.

---

### B. Source Independence

#### 1. Author and Institutional Analysis
Inspected in `server/sourceIndependenceService.ts` (lines 79–125, 131–252):
- Authors are normalized to `"lastname firstinitial"` (e.g., "Tri Dao" $\rightarrow$ `"dao t"`).
- Jaccard similarity is computed over author sets. Jaccard $\ge 0.25$ triggers `DEPENDENT` (`SAME_LAB_LINEAGE`); Jaccard $> 0$ triggers `PARTIALLY_DEPENDENT`.
- Exact string matches on normalized pre-print titles (> 15 chars) trigger `DEPENDENT` (`PREPRINT_TO_JOURNAL`).
- Shared repository URLs trigger `DEPENDENT` (`SHARED_PI`).

#### 2. Strict Replication & Pathway Semantics
Inspected in `evaluateReplicationSufficiency` (lines 261–334):
- **Strict Rule Enforced:**
  ```typescript
  const satisfiesStandardReplication = independentCount >= 2;
  const satisfiesHybridReplication = independentCount === 1 && partiallyDependentCount >= 1;
  ```
  If `independentCount === 0`, having multiple `PARTIALLY_DEPENDENT` sources yields `satisfiesStandardReplication = false`, `satisfiesHybridReplication = false`, and `effectivePathway = 'NOT_ADDRESSED'`. Two partially dependent sources **never** qualify as independent replication.
- **Unknown Independence:** If author metadata is missing (`!hasAuthorInfo || !hasSeedAuthorInfo`), the state defaults to `'INDEPENDENCE_UNKNOWN'` with weight 0.3. It never increments `independentCount` and cannot satisfy replication.
- **Human Review Enforcement:**
  - Hybrid Pathway (`HYBRID_EVIDENCE_PATH`): strictly sets `requiresHumanReview = true`.
  - Landmark Pathway (`LANDMARK_RESULT`): requires `isLandmarkCandidate = true`, `independentCount >= 1`, and `hasVerifiableArtifacts = true`. It strictly sets `requiresHumanReview = true`.
  - A single landmark paper **cannot** satisfy the standard independent replication pathway; it routes to `LANDMARK_RESULT` with mandatory review.
- **Adversarial Limitations Identified:**
  1. *Author Name Collision:* Normalizing to `"lastname firstinitial"` creates false co-authorship collisions on common East Asian names (e.g., "Wei Wang" and "Wen Wang" both normalize to `"wang w"`). This causes false dependency, biasing toward conservative safety, but is technically an author disambiguation limitation.
  2. *Literal Institution Matching:* `seedInst.has(inst)` uses exact string matching. Typographical or institutional naming variations ("Stanford University" vs "Stanford Univ.") without ROR ID resolution will fail to match, potentially classifying same-institution researchers as independent if author lists are disjoint.

---

### C. Contradiction Detection

#### 1. Exact Codepoint Quote Provenance
Inspected in `server/contradictionDetectionService.ts` (lines 63–138):
- Quotes are verified against raw chunk text using 0-based Unicode codepoints:
  1. Primary check: `extractByCodepointOffsets(chunkText, providedStart, providedEnd)` checks whether the exact slice matches verbatim (`VERIFIED_EXACT_MATCH`).
  2. Secondary check: `findCodepointOffsets(chunkText, quote)` scans for exact substring match.
  3. Tertiary check: `findWhitespaceNormalizedOffsets(chunkText, quote)` tests normalized matches (`VERIFIED_NORMALIZED_MATCH`).
- If none match, `verificationStatus` is `'FAILED_VERIFICATION'`.
- If either seed or validation quote fails verification, `isBilateralVerified = false`, `hasContradiction = false`, and `relationshipType = 'tests'` (lines 181–195). An unverified or corrupted quote **cannot** produce a contradiction.

#### 2. Disentangling Disputes vs Premise Falsification
Inspected in `analyzeBilateralRelationship` (lines 198–250):
- `EMPIRICAL_DISAGREEMENT` on `DIRECTLY_COMPARABLE` papers:
  `hasContradiction = true`, `divergenceType = 'DIRECT_EMPIRICAL_CONTRADICTION'`, `relationshipType = 'contradicts'`, `isInterPaperDisputeOnly = true`, `invalidatesGapPremise = false`.
  *Confirmation:* A paper reporting a different empirical result is treated as an inter-paper dispute edge; it does **not** automatically invalidate or falsify the candidate research gap's premise.
- `PREMISE_FALSIFIED` (e.g., benchmark data leakage or flawed baseline):
  `hasContradiction = true`, `divergenceType = 'GAP_PREMISE_FALSIFICATION'`, `relationshipType = 'contradicts'`, `invalidatesGapPremise = true`, `isInterPaperDisputeOnly = false`, `requiresHumanReview = true`.
- Differing conditions / non-comparable papers:
  When `isDirectlyComparable = false`, empirical disagreements route to `SCOPE_RESTRICTION` and `incommensurable_context` with `hasContradiction = false`. Differing results under different operational regimes are correctly barred from becoming contradictions.

---

### D. Provisional Validation Strength ($S_{val}$)

#### 1. Exact Mathematical Formula
The complete formula implemented in `server/provisionalValidationStrengthService.ts` (lines 86–128) is:

$$S_{val} = \text{clip}_{[0.0, 10.0]}\left( 10.0 \times B_{qual} \times \frac{1}{1 + \gamma N_{unresolved}} \right)$$

where:

$$B_{qual} = \sqrt{Q_{evid} \times R_{meth}} \times \left( 0.45 I_{src} + 0.30 T_{rec} + 0.25 \Omega_{cov} \right)$$

with $\gamma = 0.60$.

#### 2. Complete Variable Specification Table

| Variable | Name | Allowed Range | Normalization & Formula | Missing-Data Behavior | Directionality | Clipping / Boundary Behavior |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| **$Q_{evid}$** | Grounding Fidelity | $[0.0, 1.0]$ | $\frac{1.0 N_{exact} + 0.75 N_{norm}}{N_{exact} + N_{norm}}$ | If $N_{total}=0$, defaults to $0.0$ | Higher improves score | Bounds $[0.0, 1.0]$. Zero evidence drives $B_{qual}=0.0$. |
| **$R_{meth}$** | Methodological Commensurability | $[0.0, 1.0]$ | Average comparability score of commensurable papers | Defaults to $0.0$ | Higher improves score | Clipped strictly via `Math.max(0.0, Math.min(1.0, val))`. |
| **$\sqrt{Q_{evid} R_{meth}}$** | Epistemic Multiplier | $[0.0, 1.0]$ | Geometric mean of grounding and comparability | If either is $0$, whole multiplier is $0.0$ | Multiplicative gate | Compulsory non-compensatory gate. |
| **$I_{src}$** | Source Independence | $[0.0, 1.0]$ | $\frac{1}{K}\sum w_k$ where $w \in \{1.0, 0.5, 0.2, 0.3\}$ | If empty, defaults to $0.0$ | Higher improves score | Average across evaluated papers. |
| **$T_{rec}$** | Temporal Recency | $[0.0, 1.0]$ | If retracted: $0.0$<br>If foundational: $1.0$<br>If $\Delta t \le 1$: $1.0$<br>If $\Delta t > 1$: $e^{-\lambda(\Delta t - 1)}$, $\lambda=0.12$ | If year missing: defaults to $0.30$ | Higher improves score | Foundational baseline papers are exempt from decay ($T_{rec}=1.0$). |
| **$\Omega_{cov}$** | Coverage Breadth | $[0.0, 1.0]$ | $\frac{N_{commensurable}}{\min(B_{candidate}, N_{horizon})}$ | Defaults to $0.0$ if no commensurable papers | Higher improves score | Clipped via `Math.max(0.0, Math.min(1.0, val))`. |
| **$N_{unresolved}$** | Unresolved Contradictions | $[0, \infty)$ | Non-negative integer count | Defaults to $0$ | Higher reduces score | Enters via non-linear dampener $\frac{1}{1 + 0.6 N_{unresolved}} \in (0, 1]$. |
| **$S_{val}$** | Final Score | $[0.0, 10.0]$ | Scaled by $10.0$ | $0.0$ on zero evidence | Higher indicates stronger provisional validation | Clipped to $[0.0, 10.0]$ and rounded to 2 decimal places. |

#### 3. Warning Notice & Probability Integrity
- In `server/provisionalValidationStrengthService.ts` (lines 9–10, 52, 144):
  `isCalibratedProbability: false` is strictly hardcoded.
  `mandatoryWarning: 'PROVISIONAL_VALIDATION_STRENGTH is a deterministic heuristic index. It is NOT a calibrated probability of empirical correctness. A score of 8.0/10.0 does NOT denote an 80% probability of truth.'`
- In `src/components/CrossLiteratureValidationPanel.tsx` (lines 354–366):
  The UI explicitly renders the warning banner: `"MANDATORY SCIENTIFIC NOTICE — PROVISIONAL UNCALIBRATED METRIC: This score represents a provisional, uncalibrated algorithmic evaluation index calculated strictly via deterministic heuristic aggregation. It is NOT an empirical posterior probability, Bayesian confidence interval, or real-world truth estimate."`

---

## 3. Benchmark Validity & Real-World Grounding

The test fixtures in `tests/stage4d_validation_verification.ts` were audited:

| Benchmark Cluster | Modeled Topic & Problem | Papers / Identifiers Used | Provenance & Evidence Passages | Expected Conclusion | Actual Engine Conclusion | True Dataset Classification |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **Cluster 1** | FlashAttention vs SSMs (Memory Context Scaling) | Seed: `paper-fa`<br>Validation: `paper-mamba` | Excerpt: "Standard multi-head attention suffers from O(N^2) memory footprint..." vs "State space models achieve linear O(N) memory scaling..." | Alternative architecture addresses autoregressive memory scaling | `relationshipType: 'addresses'` | **Synthetic Integration Fixture** |
| **Cluster 2** | GNN Over-smoothing in Deep Architectures | Seed: `gnn-seed`<br>Validation: `gnn-val` | Simulated dimensions: Node classification, Cora/OGB-Arxiv, test accuracy & Dirichlet energy, DropEdge GCN | Shared task, metric, and domain evaluate directly | `comparisonClass: 'DIRECTLY_COMPARABLE'` | **Synthetic Integration Fixture** |
| **Cluster 3** | LoRA vs Full Fine-Tuning Rank Saturation | Seed: `lora-orig` (Hu et al.)<br>Val 1: `lora-eval-1` (Dettmers et al.)<br>Val 2: `lora-eval-2` (Malladi et al.) | Simulated author arrays from UW and Princeton with dummy DOIs (`10.1/lo`, `10.1/le1`, `10.1/le2`) | Disjoint multi-group studies replicate findings | `satisfiesStandardReplication: true` | **Synthetic Integration Fixture** |

### Benchmark Validity Assessment:
1. **Functional Correctness Only:** The benchmark cases demonstrate that the engine's gate logic, Jaccard thresholds, comparability routing, and relationship classifiers function correctly according to the code specification.
2. **Not an Empirical Benchmark Corpus:** None of these three clusters constitute a pre-collected, double-blind, human-annotated gold-standard dataset. They are handcrafted in-code integration fixtures designed to verify logical branch coverage.
3. **Statistical Calibration Status:** **UNPERFORMED.** Because no empirical evaluation on an annotated corpus of $N \ge 100$ papers has been executed, empirical calibration (e.g. Expected Calibration Error / Platt scaling) does not exist. Labeling $S_{val}$ as `PROVISIONAL_VALIDATION_STRENGTH` with explicit uncalibrated caveats is verified to be accurate and required.

---

## 4. Live Supabase Verification (Project: `dtlvtpntmtdmdawupylv`)

Read-only database queries against the live Supabase project confirmed:

### 1. Schema Migration Status
- Query: `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;`
- Result: Recorded `version: '20261119000000'`, `name: '20261119_stage4d_validation_infrastructure'`.

### 2. Table `public.research_gap_relationships`
- Table exists with 11 columns matching specification (`id`, `gap_id`, `validation_run_id`, `source_gap_id`, `source_paper_id`, `target_gap_id`, `target_paper_id`, `relationship_type`, `confidence_weight`, `bilateral_evidence_refs`, `created_at`).
- Foreign Keys:
  - `fk_gap_rel_validation_run`: `FOREIGN KEY (gap_id, validation_run_id) REFERENCES research_gap_validations(gap_id, validation_run_id) ON DELETE RESTRICT`.
  - `research_gap_relationships_source_paper_id_fkey`: `ON DELETE RESTRICT` to `research_papers(id)`.
  - `research_gap_relationships_target_paper_id_fkey`: `ON DELETE RESTRICT` to `research_papers(id)`.
  - `research_gap_relationships_source_gap_id_fkey`: `ON DELETE RESTRICT` to `research_gaps(id)`.
  - `research_gap_relationships_target_gap_id_fkey`: `ON DELETE RESTRICT` to `research_gaps(id)`.
- Constraints:
  - `chk_source_entity`: `num_nonnulls(source_gap_id, source_paper_id) = 1`.
  - `chk_target_entity`: `num_nonnulls(target_gap_id, target_paper_id) = 1`.
  - `chk_source_gap_not_nil`, `chk_source_paper_not_nil`, `chk_target_gap_not_nil`, `chk_target_paper_not_nil`: Prohibit `00000000-0000-0000-0000-000000000000`.
  - `chk_no_self_gap_relationship` & `chk_no_self_paper_relationship`: Prohibit self-loops.
- Partial Unique Indexes:
  - `idx_uniq_gap_rel_gap_gap`: `(gap_id, validation_run_id, source_gap_id, target_gap_id, relationship_type) WHERE source_gap_id IS NOT NULL AND target_gap_id IS NOT NULL`.
  - `idx_uniq_gap_rel_gap_paper`: `WHERE source_gap_id IS NOT NULL AND target_paper_id IS NOT NULL`.
  - `idx_uniq_gap_rel_paper_gap`: `WHERE source_paper_id IS NOT NULL AND target_gap_id IS NOT NULL`.
  - `idx_uniq_gap_rel_paper_paper`: `WHERE source_paper_id IS NOT NULL AND target_paper_id IS NOT NULL`.

### 3. Row-Level Security (RLS)
- Query on `pg_policies`:
  - `research_gap_relationships.rls_gap_relationships_write`: Restricted strictly to `auth.role() = 'service_role'`. All write commands (`INSERT`, `UPDATE`, `DELETE`) by anonymous or regular authenticated users are denied.
  - `research_gap_relationships.rls_gap_relationships_select`: Permitted for `service_role` OR when parent gap is `is_archived = false` AND (`is_published = true` OR owner matches `auth.uid()`). Public cannot read relationships of archived or private gaps.

### 4. Credential & Context Security
- `src/lib/supabase.ts` throws an explicit runtime exception if `getSupabaseAdmin()` is invoked in browser contexts (`typeof window !== 'undefined'`).
- `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `VITE_`. Static inspection of `dist/assets/*.js` confirmed zero exposure in client bundles.
- The `app.trusted_server_context` configuration variable is set inside `SECURITY DEFINER` RPCs that enforce `auth.role() = 'service_role'`. Unauthenticated clients connecting via PostgREST cannot set session variables or bypass triggers.

---

## 5. Atomicity, Idempotency, and Reliability

1. **Transaction Atomicity:**
   Inside `insert_server_verified_validation()`, PostgreSQL executes all validation persistence operations in a single atomic transaction block:
   - Validates service-role permissions.
   - Acquires `FOR UPDATE` row lock on `public.research_gaps` to serialize concurrent validations on the same gap.
   - Inserts validation record into `public.research_gap_validations`.
   - Iterates through `p_gap_relationships` and inserts typed edges into `public.research_gap_relationships`.
   - Iterates through `p_new_evidence_items` and inserts into `public.research_gap_evidence`.
   - Updates `public.research_gaps` (`current_validation_outcome`, `current_epistemic_classification`, `evidence_confidence`, `last_validated_at`).
   - Inserts immutable transition record into `public.research_gap_audit_log`.
   *Finding:* If any operation or constraint fails, the entire transaction rolls back. Incomplete or partially updated states cannot persist.
2. **Duplicate Run Prevention:**
   Enforced via `uq_gap_validations_gap_run` on `(gap_id, validation_run_id)`. Re-submitting the same validation run ID raises a unique constraint violation.
3. **Corpus Hash Determinism:**
   `constructCorpusHash` in `server/crossLiteratureValidationService.ts` sorts papers alphabetically by canonical identifier (`doi || openAlexId || paperId`) and concatenates chunk checksums before generating a SHA-256 digest. This guarantees permutation invariance and deterministic reproducibility for identical evidence sets.

---

## 6. Archival and Purge Safety

### Cross-Gap Dependency Verification:
- **Scenario:** Gap A has relationships where Gap B is the source or target.
- **Enforcement Mechanism:**
  1. Administrative RPC `purge_archived_research_gap` inspects:
     ```sql
     SELECT count(*) INTO v_dep_count
     FROM public.research_gap_relationships r
     JOIN public.research_gaps g ON g.id = r.gap_id
     WHERE (r.source_gap_id = p_gap_id OR r.target_gap_id = p_gap_id)
       AND r.gap_id <> p_gap_id
       AND g.is_archived = false;
     IF v_dep_count > 0 THEN
         RAISE EXCEPTION 'Purge restricted: % active research gap relationship(s) depend on this gap...';
     END IF;
     ```
     If Gap B is active and linked, purging Gap A is aborted with error code `23001`.
  2. Database Constraint: Foreign keys on `source_gap_id` and `target_gap_id` are configured with `ON DELETE RESTRICT`. Direct deletion of Gap A through any SQL command is blocked by foreign key constraints.
  3. Active Gap Protection: `archive_research_gap` must be executed first (`is_archived = true`). Attempting to purge an active gap raises error `22000`.
  4. Audit Log Preservation: `research_gap_audit_log` records an `ARCHIVE` event. The table is append-only, and its provenance trigger blocks unauthorized deletion.

---

## 7. Regression and Reproducibility Execution

All test commands were executed directly from the terminal without source modification:

| Test Suite | Execution Command | Total Tests | Passed | Failed | Skipped | Mock vs. Live Details |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Stage 4A Database & Security** | `npx tsx tests/stage4a_database_security.ts` | 28 | 28 | 0 | 0 | Live Supabase queries against `dtlvtpntmtdmdawupylv` |
| **Stage 4B Discovery & Ingestion** | `npx tsx tests/stage4b_discovery_ingestion.ts` | 37 | 37 | 0 | 0 | Live OpenAlex API discovery + local SSRF guards |
| **Stage 4C AI Extraction & Remediation** | `npx tsx tests/stage4c_extraction_verification.ts` | 40 | 40 | 0 | 0 | Live Supabase idempotency + NFC Unicode slicing |
| **Stage 4D Validation & Verification** | `npx tsx tests/stage4d_validation_verification.ts` | 56 | 56 | 0 | 0 | Live Supabase RPC + unit engines + synthetic clusters |
| **Subtotal (Automated Test Suites)** | — | **161** | **161** | **0** | **0** | **100% Test Pass Rate** |
| **TypeScript Typecheck** | `npm run lint` (`tsc --noEmit`) | 1 | 1 | 0 | 0 | Local TypeScript compiler (0 errors) |
| **Vite Client Production Build** | `npm run build` (`vite build`) | 1 | 1 | 0 | 0 | Bundled 1740 modules in 691ms (0 errors) |
| **Master Platform Total** | — | **163** | **163** | **0** | **0** | **100% Pass Rate (161 tests + 2 build checks)** |

---

## 8. Summary of Findings & Non-Critical Limitations

1. **Finding 4D-1 (Non-Critical): Heuristic Question Alignment via Word Overlap**
   - *Detail:* `evaluateOperationalAlignment` uses a token overlap threshold ($\ge 0.40$ on words $>3$ chars). Disparate questions sharing domain jargon could pass Tier 1 Gate 2 if not mitigated by metric and dataset checks.
   - *Classification:* VERIFIED WITH NON-CRITICAL LIMITATION.
2. **Finding 4D-2 (Non-Critical): Literal String Institution Matching**
   - *Detail:* `evaluatePairwiseIndependence` matches institutions using literal string equality (`seedInst.has(inst)`). Abbreviations ("Univ." vs "University") without ROR ID resolution can fail to match, potentially classifying same-institution authors as independent if author lists are disjoint.
   - *Classification:* VERIFIED WITH NON-CRITICAL LIMITATION.
3. **Finding 4D-3 (Non-Critical): Synthetic Test Fixtures vs Expert Gold Standard**
   - *Detail:* The FlashAttention/Mamba, GNN, and LoRA benchmark clusters in `tests/stage4d_validation_verification.ts` are synthetic integration test fixtures rather than real double-blind expert-annotated literature corpora.
   - *Classification:* VERIFIED WITH NON-CRITICAL LIMITATION.
4. **Finding 4D-4 (Non-Critical): Uncalibrated Provisional Metric Status**
   - *Detail:* $S_{val}$ is mathematically deterministic and heuristic. Statistical calibration (ECE calculation) has not been performed due to the absence of an annotated empirical dataset. This is accurately documented and labeled in both the code and UI.
   - *Classification:* VERIFIED WITH NON-CRITICAL LIMITATION.

---

## 9. Final Audit Verdict

Based on direct source inspection, read-only live Supabase verification on project `dtlvtpntmtdmdawupylv`, and successful execution of 161 automated test assertions across 4 test suites plus 2 build/compiler checks (163 total checks) with zero failures:

### **VERDICT:**
```
================================================================================
FINAL AUDIT VERDICT:
2. STAGE 4D VERIFIED WITH NON-CRITICAL LIMITATIONS
================================================================================
```

*Substantiation:* All security gates, relational schemas, composite foreign keys, RLS policies, master RPC atomicity, contradiction classifications, and mathematical formulas operate as designed. The four documented non-critical limitations represent scientific metadata heuristics and the absence of a double-blind calibrated empirical corpus, which are appropriately disclosed and bounded without compromising production integrity or platform security. Stage 4E and Stage 4F remain strictly unimplemented.
