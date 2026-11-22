
/**
 * Anvīkṣā — Stage 4E Work Package 4E-IMP-01 Verification & Adversarial Audit Test Suite
  * 
 * Verifies all 9 Acceptance Gates for Research Opportunity Intelligence:
 * Gate 1:  Eligibility Filtering & Epistemic Gate Invariants
  * Gate 2:  Residual Scope Extraction & Active Trade - Off Isolation
    * Gate 3:  Discrete Contradiction Qualification(4 mutually exclusive states)
      * Gate 4:  Literature Density Classification(4 discrete archetypes)
        * Gate 5:  Decoupled Scientific Opportunity Scoring(V_scientific linear weighted sum)
          * Gate 6:  Sensitivity Analysis across 4 Weighting Regimes & Strict Threshold Testing(Below, Exact, Above, Identical)
            * Gate 7:  Live Database Schema, Composite FK(gap_id, validation_run_id), & RPC Persistence
              * Gate 8:  Automatic Transactional Staleness Propagation(Database Triggers & Unrelated Isolation)
                * Gate 9:  Adversarial Row - Level Security(RLS) Isolation(Private Parent Leakage Prevention, Mutation & RPC ACLs)
                  */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, getSupabaseCredentials } from '../src/lib/supabase.js';
import {
  opportunityIntelligenceService,
  ResidualScopePayload,
  WEIGHTING_REGIME_PROFILES,
  WeightingRegime
} from '../server/opportunityIntelligenceService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runStage4ETestSuite() {
  console.log('========================================================================');
  console.log('Anvīkṣā — Stage 4E-IMP-01 Research Opportunity Intelligence Test Suite');
  console.log('Target: Frozen Stage 4E Architecture + Final Scientific Integrity Amendment');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // GATE 1: Eligibility Filtering & Epistemic Gate Invariants
  // -------------------------------------------------------------------------
  console.log('[Gate 1] Eligibility Filtering & Epistemic Gate Invariants...');

  // 1.1 CONFIRMED_UNRESOLVED -> Eligible
  const res1 = opportunityIntelligenceService.assessEligibility(
    'gap-001',
    'run-001',
    'CONFIRMED_UNRESOLVED'
  );
  assert(res1.isEligible === true, 'CONFIRMED_UNRESOLVED is automatically eligible for opportunity synthesis');
  assert(res1.status === 'ELIGIBLE', 'Eligible status is ELIGIBLE');

  // 1.2 PARTIALLY_ADDRESSED with Residual Scope -> Eligible
  const groundedResidual: ResidualScopePayload = {
    isGrounded: true,
    resolvedComponents: ['Exact attention for N <= 16k sequence length'],
    unresolvedScope: 'Quadratic memory scaling remains unresolved for context lengths exceeding 64k tokens.',
    activeTradeoffs: ['Memory footprint vs throughput']
  };
  const res2 = opportunityIntelligenceService.assessEligibility(
    'gap-002',
    'run-002',
    'PARTIALLY_ADDRESSED',
    groundedResidual
  );
  assert(res2.isEligible === true, 'PARTIALLY_ADDRESSED with grounded residual scope is eligible');
  assert(res2.status === 'ELIGIBLE', 'Status is ELIGIBLE with residual scope');

  // 1.3 PARTIALLY_ADDRESSED without Residual Scope -> Ineligible
  const emptyResidual: ResidualScopePayload = {
    isGrounded: false,
    resolvedComponents: [],
    unresolvedScope: '',
    activeTradeoffs: []
  };
  const res3 = opportunityIntelligenceService.assessEligibility(
    'gap-003',
    'run-003',
    'PARTIALLY_ADDRESSED',
    emptyResidual
  );
  assert(res3.isEligible === false, 'PARTIALLY_ADDRESSED without residual scope is strictly ineligible');
  assert(res3.status === 'INELIGIBLE', 'Returns INELIGIBLE status');

  // 1.4 Fully ADDRESSED -> Ineligible
  const res4 = opportunityIntelligenceService.assessEligibility(
    'gap-004',
    'run-004',
    'ADDRESSED'
  );
  assert(res4.isEligible === false, 'ADDRESSED gap is disqualified from prospective opportunity ranking');
  assert(res4.status === 'INELIGIBLE', 'Returns INELIGIBLE for ADDRESSED');

  // 1.5 CONTRADICTED -> Ineligible
  const res5 = opportunityIntelligenceService.assessEligibility(
    'gap-005',
    'run-005',
    'CONTRADICTED'
  );
  assert(res5.isEligible === false, 'CONTRADICTED gap is disqualified from synthesis');
  assert(res5.status === 'INELIGIBLE', 'Returns INELIGIBLE for CONTRADICTED');

  // 1.6 INSUFFICIENT_EVIDENCE -> Ineligible
  const res6 = opportunityIntelligenceService.assessEligibility(
    'gap-006',
    'run-006',
    'INSUFFICIENT_EVIDENCE'
  );
  assert(res6.isEligible === false, 'INSUFFICIENT_EVIDENCE gap is ineligible');
  assert(res6.status === 'INELIGIBLE', 'Returns INELIGIBLE for INSUFFICIENT_EVIDENCE');

  // -------------------------------------------------------------------------
  // GATE 2: Residual Scope Extraction & Active Trade-Off Isolation
  // -------------------------------------------------------------------------
  console.log('\n[Gate 2] Residual Scope Extraction & Active Trade-Off Isolation...');

  const gapLimitationText = 'Exact attention mechanisms experience high memory overhead and latency under long context sequences.';
  const mockRelationships = [
    {
      relationship_type: 'partially_addresses',
      bilateral_evidence_refs: [
        { finding: 'Tiled SRAM reduction successful for sequence lengths up to 8k', locator: 'Section 4.1' }
      ]
    }
  ];

  const residualResult = opportunityIntelligenceService.extractResidualScope(
    gapLimitationText,
    { unresolvedScope: 'O(N^2) memory footprint persists beyond 32k tokens.' },
    mockRelationships
  );

  assert(residualResult.isGrounded === true, 'Residual scope is grounded');
  assert(residualResult.resolvedComponents.length > 0, 'Extracted resolved components from addressed relationships');
  assert(residualResult.activeTradeoffs.length > 0, 'Extracted active technical trade-offs (memory / latency)');
  assert(Boolean(residualResult.boundaryRestrictions), 'Extracted long-context boundary restrictions');

  // -------------------------------------------------------------------------
  // GATE 3: Discrete Contradiction Qualification
  // -------------------------------------------------------------------------
  console.log('\n[Gate 3] Discrete Contradiction Qualification (4 Mutually Exclusive States)...');

  // 3.1 Clean validation with zero contradictions
  const qualClean = opportunityIntelligenceService.assessContradictionStatus('CONFIRMED_UNRESOLVED', []);
  assert(qualClean.status === 'NO_CONTRADICTIONS_DETECTED', 'Zero contradictions yields NO_CONTRADICTIONS_DETECTED');

  // 3.2 Insufficient evidence -> CONTRADICTION_STATUS_UNKNOWN
  const qualUnknown = opportunityIntelligenceService.assessContradictionStatus('INSUFFICIENT_EVIDENCE', []);
  assert(qualUnknown.status === 'CONTRADICTION_STATUS_UNKNOWN', 'INSUFFICIENT_EVIDENCE yields CONTRADICTION_STATUS_UNKNOWN');

  // 3.3 Fatal contradiction refutes causal premise -> PREMISE_FALSIFIED
  const fatalRelationships = [
    {
      id: 'rel-fatal-1',
      relationship_type: 'contradicts',
      confidence_weight: 0.92,
      target_paper_id: 'paper-x',
      source_paper_id: 'paper-seed'
    }
  ];
  const qualFalsified = opportunityIntelligenceService.assessContradictionStatus('CONFIRMED_UNRESOLVED', fatalRelationships);
  assert(qualFalsified.status === 'PREMISE_FALSIFIED', 'High-confidence contradiction yields PREMISE_FALSIFIED');

  // 3.4 Boundary contradiction -> SCOPE_NARROWED
  const boundaryRelationships = [
    {
      id: 'rel-bound-1',
      relationship_type: 'contradicts',
      confidence_weight: 0.60,
      target_paper_id: 'paper-y',
      source_paper_id: 'paper-seed'
    }
  ];
  const qualNarrowed = opportunityIntelligenceService.assessContradictionStatus('CONFIRMED_UNRESOLVED', boundaryRelationships);
  assert(qualNarrowed.status === 'SCOPE_NARROWED', 'Low-confidence/boundary contradiction yields SCOPE_NARROWED');
  assert(Boolean(qualNarrowed.affectedBoundaries && qualNarrowed.affectedBoundaries.length > 0), 'SCOPE_NARROWED records affected boundaries');

  // -------------------------------------------------------------------------
  // GATE 4: Literature Density Classification (4 Discrete Archetypes)
  // -------------------------------------------------------------------------
  console.log('\n[Gate 4] Literature Density Classification (4 Discrete Archetypes)...');

  const curYear = new Date().getFullYear();

  // 4.1 SPARSE_FRONTIER: <= 3 papers
  const sparsePapers = [{ year: curYear }, { year: curYear - 1 }];
  const denseSparse = opportunityIntelligenceService.assessLiteratureDensity(curYear, sparsePapers, 1, 0);
  assert(denseSparse.status === 'SPARSE_FRONTIER', '<= 3 papers classified as SPARSE_FRONTIER');

  // 4.2 SATURATED_EXACT_REPETITION: > 25 recent papers
  const saturatedPapers = Array.from({ length: 28 }, () => ({ year: curYear }));
  const denseSaturated = opportunityIntelligenceService.assessLiteratureDensity(curYear, saturatedPapers, 15, 2);
  assert(denseSaturated.status === 'SATURATED_EXACT_REPETITION', '> 25 recent papers classified as SATURATED_EXACT_REPETITION');
  assert(denseSaturated.isOverSaturated === true, 'Marked isOverSaturated = true');

  // 4.3 DIFFICULT_OPEN_DIRECTION: >= 10 papers, >= 5 corroborating, 0 contradicting
  const difficultPapers = Array.from({ length: 12 }, (_, i) => ({ year: curYear - 1 }));
  const denseDifficult = opportunityIntelligenceService.assessLiteratureDensity(curYear - 1, difficultPapers, 6, 0);
  assert(denseDifficult.status === 'DIFFICULT_OPEN_DIRECTION', 'High corroboration without solution classified as DIFFICULT_OPEN_DIRECTION');

  // 4.4 ACTIVE_COMPETITIVE: Standard healthy volume
  const activePapers = Array.from({ length: 8 }, () => ({ year: curYear }));
  const denseActive = opportunityIntelligenceService.assessLiteratureDensity(curYear, activePapers, 3, 1);
  assert(denseActive.status === 'ACTIVE_COMPETITIVE', 'Moderate contemporary papers classified as ACTIVE_COMPETITIVE');

  // -------------------------------------------------------------------------
  // GATE 5: Decoupled Scientific Opportunity Scoring (V_scientific)
  // -------------------------------------------------------------------------
  console.log('\n[Gate 5] Decoupled Scientific Opportunity Scoring (V_scientific Linear Weighted Sum)...');

  const Sc = 9.0;
  const Sn = 8.0;
  const Ss = 8.5;
  const St = 7.0;

  // BALANCED_DEFAULT: 0.30*Sc + 0.25*Sn + 0.30*Ss + 0.15*St
  // = 0.30*9.0 + 0.25*8.0 + 0.30*8.5 + 0.15*7.0
  // = 2.70 + 2.00 + 2.55 + 1.05 = 8.30
  const scoresResult = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: Sc,
    novelty: Sn,
    significance: Ss,
    tractability: St
  }, 'BALANCED_DEFAULT');

  const expectedVSci = Number((0.30 * Sc + 0.25 * Sn + 0.30 * Ss + 0.15 * St).toFixed(2));
  assert(
    scoresResult.intrinsicScientificValue === expectedVSci,
    `V_scientific matches linear weighted formula: ${scoresResult.intrinsicScientificValue} === ${expectedVSci}`
  );
  assert(
    scoresResult.intrinsicScientificValue >= 0.0 && scoresResult.intrinsicScientificValue <= 10.0,
    'V_scientific is strictly clamped to [0.0, 10.0]'
  );

  // Decoupled integrity: researcher resource constraints are 100% excluded
  assert(
    !('researcherBudget' in scoresResult || 'hardwareTier' in scoresResult || 'institutionAffiliation' in scoresResult),
    'Strict Decoupling: Zero researcher resource variables or institution proxies present in intrinsic scoring'
  );

  // -------------------------------------------------------------------------
  // GATE 6: Sensitivity Analysis across 4 Weighting Regimes & Strict Threshold Testing
  // -------------------------------------------------------------------------
  console.log('\n[Gate 6] Sensitivity Analysis across 4 Weighting Regimes & Strict Threshold Testing...');

  const regimes: WeightingRegime[] = [
    'BALANCED_DEFAULT',
    'FOUNDATIONAL_THEORY',
    'RAPID_EXPLORATION',
    'METHODOLOGICAL_RIGOR'
  ];

  for (const reg of regimes) {
    const weights = WEIGHTING_REGIME_PROFILES[reg];
    const sumW = Number((weights.wc + weights.wn + weights.ws + weights.wt).toFixed(4));
    assert(sumW === 1.0, `Weighting regime ${reg} weights sum exactly to 1.0000 (Actual: ${sumW})`);

    const regScore = scoresResult.sensitivityReporting[reg];
    assert(
      typeof regScore === 'number' && regScore >= 0.0 && regScore <= 10.0,
      `Sensitivity score for ${reg} is valid numeric value (${regScore})`
    );
  }

  // 6.1 Test Case: Identical Scores Across All Regimes (Delta = 0.00)
  const identicalScores = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 8.0,
    novelty: 8.0,
    significance: 8.0,
    tractability: 8.0
  });
  assert(identicalScores.scoreDeltaAcrossRegimes === 0.00, `Identical inputs yield exact delta 0.00 (Actual: ${identicalScores.scoreDeltaAcrossRegimes})`);
  assert(identicalScores.isSensitivityVolatile === false, 'Identical scores across regimes strictly classified as NOT volatile (isSensitivityVolatile = false)');
  assert(identicalScores.sensitivityFlags.length === 0, 'No sensitivity flags raised for delta 0.00');

  // 6.2 Test Case: Score Delta Below Threshold (Delta = 0.20 <= 1.50)
  // Sc=9.0, Sn=8.0, Ss=8.5, St=7.0
  // BALANCED: 8.30, FOUNDATIONAL: 8.30, RAPID: 8.10, RIGOR: 8.25
  assert(scoresResult.scoreDeltaAcrossRegimes === 0.20, `Standard inputs yield exact delta 0.20 (Actual: ${scoresResult.scoreDeltaAcrossRegimes})`);
  assert(scoresResult.scoreDeltaAcrossRegimes <= 1.5, `Delta 0.20 is below volatility threshold 1.50 (${scoresResult.scoreDeltaAcrossRegimes} <= 1.5)`);
  assert(scoresResult.isSensitivityVolatile === false, 'Delta 0.20 is correctly classified as NOT volatile (isSensitivityVolatile = false)');

  // 6.3 Five-Point Precision Regression Tests for Boundary & Sub-Centile Deltas:
  // Mathematical derivation: Sc = 5 * (targetDelta - 0.25) with Sn=0.0, Ss=5.0, St=5.0
  // Required test points: 1.499 (false), 1.500 (false), 1.501 (true), 1.504 (true), 1.506 (true)

  // 6.3.1 Delta = 1.499: false (Sc = 6.245)
  const delta1499 = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 6.245,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(Math.abs((delta1499.rawScoreDelta ?? 0) - 1.499) < 1e-9, `Delta 1.499 rawScoreDelta verified: ${delta1499.rawScoreDelta}`);
  assert(delta1499.isSensitivityVolatile === false, 'Regression test 1.499: isSensitivityVolatile === false');
  assert(!delta1499.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'), 'Regression test 1.499: no sensitivity flag raised');

  // 6.3.2 Delta = 1.500: false (Sc = 6.250)
  const delta1500 = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 6.250,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(Math.abs((delta1500.rawScoreDelta ?? 0) - 1.500) < 1e-9, `Delta 1.500 rawScoreDelta verified: ${delta1500.rawScoreDelta}`);
  assert(delta1500.scoreDeltaAcrossRegimes === 1.50, `Delta 1.500 scoreDeltaAcrossRegimes === 1.50`);
  assert(delta1500.isSensitivityVolatile === false, 'Regression test 1.500: isSensitivityVolatile === false (strict > 1.50 invariant)');
  assert(!delta1500.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'), 'Regression test 1.500: no sensitivity flag raised');

  // 6.3.3 Delta = 1.501: true (Sc = 6.255)
  const delta1501 = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 6.255,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(Math.abs((delta1501.rawScoreDelta ?? 0) - 1.501) < 1e-9, `Delta 1.501 rawScoreDelta verified: ${delta1501.rawScoreDelta}`);
  assert(delta1501.isSensitivityVolatile === true, 'Regression test 1.501: isSensitivityVolatile === true');
  assert(delta1501.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'), 'Regression test 1.501: sensitivity flag raised');

  // 6.3.4 Delta = 1.504: true (Sc = 6.270)
  // Sub-centile rounding defect elimination: Number(1.504.toFixed(2)) === 1.50, but rawScoreDelta > 1.50
  const delta1504 = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 6.270,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(Math.abs((delta1504.rawScoreDelta ?? 0) - 1.504) < 1e-9, `Delta 1.504 rawScoreDelta verified: ${delta1504.rawScoreDelta}`);
  assert(delta1504.scoreDeltaAcrossRegimes === 1.50, `Delta 1.504 displayed scoreDeltaAcrossRegimes is 1.50`);
  assert(delta1504.isSensitivityVolatile === true, 'Regression test 1.504: isSensitivityVolatile === true (sub-centile rounding defect eliminated)');
  assert(delta1504.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'), 'Regression test 1.504: sensitivity flag raised');

  // 6.3.5 Delta = 1.506: true (Sc = 6.280)
  const delta1506 = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 6.280,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(Math.abs((delta1506.rawScoreDelta ?? 0) - 1.506) < 1e-9, `Delta 1.506 rawScoreDelta verified: ${delta1506.rawScoreDelta}`);
  assert(delta1506.isSensitivityVolatile === true, 'Regression test 1.506: isSensitivityVolatile === true');
  assert(delta1506.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'), 'Regression test 1.506: sensitivity flag raised');

  // 6.4 Test Case: Score Delta Well Above Threshold (Delta = 2.25 > 1.50)
  // Sc=10.0, Sn=0.0, Ss=5.0, St=5.0
  // BALANCED: 5.25, FOUNDATIONAL: 5.25, RAPID: 4.00, RIGOR: 6.25 -> Max(6.25) - Min(4.00) = 2.25
  const aboveThresholdScores = opportunityIntelligenceService.calculateIntrinsicScientificValue({
    confidence: 10.0,
    novelty: 0.0,
    significance: 5.0,
    tractability: 5.0
  });
  assert(aboveThresholdScores.scoreDeltaAcrossRegimes === 2.25, `High variance inputs yield delta 2.25 (Actual: ${aboveThresholdScores.scoreDeltaAcrossRegimes})`);
  assert(aboveThresholdScores.isSensitivityVolatile === true, 'Delta 2.25 strictly triggers volatility (isSensitivityVolatile = true)');
  assert(
    aboveThresholdScores.sensitivityFlags.includes('RANKING_SENSITIVE_TO_WEIGHTING'),
    'Volatility flags RANKING_SENSITIVE_TO_WEIGHTING in scoring metadata'
  );

  // -------------------------------------------------------------------------
  // GATE 7: Live Database Schema, Composite FK & RPC Persistence
  // -------------------------------------------------------------------------
  console.log('\n[Gate 7] Live Database Schema, Composite FK & RPC Persistence...');

  const adminClient = getSupabaseAdmin();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  if (adminClient) {
    // 7.1 Setup test paper, gap, and validation run
    const testDoi = `10.1000/stage4e-test-${Date.now()}`;
    const { data: testPaper, error: paperErr } = await adminClient
      .from('research_papers')
      .insert({
        title: 'Stage 4E Opportunity Intelligence Seed Paper',
        doi: testDoi,
        publication_date: '2024-02-01',
        authors: ['Dao, Tri', 'Gu, Albert'],
        abstract: 'Investigation of subquadratic recurrent sequence architectures.',
        field: 'Computer Science'
      })
      .select('id')
      .single();

    assert(Boolean(testPaper?.id), `Created isolated test paper: ${testPaper?.id}`);

    if (testPaper?.id) {
      const { data: testGap, error: gapErr } = await adminClient
        .from('research_gaps')
        .insert({
          gap_statement: 'High training throughput degrades on long multi-head associative recall tasks.',
          gap_category: 'COMPUTATIONAL_SCALABILITY',
          current_epistemic_classification: 'CANDIDATE_RESEARCH_GAP',
          current_validation_outcome: 'INSUFFICIENT_EVIDENCE',
          model_used: 'gemma-4-26b-a4b-it',
          model_requested: 'gemma-4-26b-a4b-it',
          visibility: 'public',
          is_published: true
        })
        .select('id')
        .single();

      assert(Boolean(testGap?.id), `Created test research gap: ${testGap?.id}`);

      if (testGap?.id) {
        const testRunId = `run-4e-${Date.now()}`;
        const coverageMetadata = {
          validationRunId: testRunId,
          evaluatedCorpusCount: 6,
          commensurablePaperCount: 5,
          corpusHash: 'test-corpus-hash-4e',
          evaluationTimestamp: new Date().toISOString()
        };

        const { data: validationId, error: valErr } = await adminClient.rpc('insert_server_verified_validation', {
          p_gap_id: testGap.id,
          p_validation_outcome: 'CONFIRMED_UNRESOLVED',
          p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
          p_confidence_score: 9.1,
          p_reasoning_summary: 'Verified unresolved across independent literature with zero refutations.',
          p_model_attribution: 'gemma-4-26b-a4b-it',
          p_search_methodology_version: '4.1.0-multi-vector-discovery',
          p_literature_coverage_timestamp: new Date().toISOString(),
          p_supporting_evidence_references: [{ targetPaperId: testPaper.id, weight: 0.95 }],
          p_contradictory_evidence_references: [],
          p_previously_addressed_research_references: [],
          p_literature_coverage_metadata: coverageMetadata,
          p_gap_relationships: [
            {
              source_gap_id: testGap.id,
              target_paper_id: testPaper.id,
              relationship_type: 'identifies_limitation',
              confidence_weight: 0.95,
              verifiable_quote: 'Memory scalability remains an unsolved constraint in full attention.',
              source_locator: 'Section 4, Page 6'
            }
          ],
          p_new_evidence_items: []
        });

        assert(!valErr && Boolean(validationId), `Created verified cross-literature validation run: ${validationId}`);

        // Fetch validation record to get exact validation_run_id
        const { data: valRecord } = await adminClient
          .from('research_gap_validations')
          .select('validation_run_id')
          .eq('id', validationId)
          .single();

        const actualRunId = valRecord?.validation_run_id || testRunId;

        // 7.2 Composite FK Verification: Attempt persist with invalid validation_run_id -> Must Fail
        const invalidFkPayload = {
          p_gap_id: testGap.id,
          p_validation_run_id: 'non-existent-run-id-9999',
          p_status: 'ELIGIBLE',
          p_intrinsic_value: 8.30,
          p_confidence: Sc,
          p_novelty: Sn,
          p_significance: Ss,
          p_tractability: St,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER',
          p_residual_scope: groundedResidual,
          p_weighting_regime: 'BALANCED_DEFAULT'
        };

        const { data: badFkResult, error: badFkErr } = await adminClient.rpc('rpc_persist_research_opportunity', invalidFkPayload);
        assert(
          Boolean(badFkErr),
          'Database Constraint: Composite Foreign Key (gap_id, validation_run_id) strictly rejects mismatched/unregistered validation_run_id'
        );

        // 7.3 Valid Persistence via rpc_persist_research_opportunity
        const validPayload = {
          p_gap_id: testGap.id,
          p_validation_run_id: actualRunId,
          p_status: 'ELIGIBLE',
          p_intrinsic_value: scoresResult.intrinsicScientificValue,
          p_confidence: Sc,
          p_novelty: Sn,
          p_significance: Ss,
          p_tractability: St,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER',
          p_residual_scope: groundedResidual,
          p_weighting_regime: 'BALANCED_DEFAULT',
          p_scoring_metadata: {
            sensitivityReporting: scoresResult.sensitivityReporting,
            scoreDeltaAcrossRegimes: scoresResult.scoreDeltaAcrossRegimes,
            isSensitivityVolatile: scoresResult.isSensitivityVolatile,
            sensitivityFlags: scoresResult.sensitivityFlags
          },
          p_structured_explanation: {
            summary: 'Develop subquadratic associative recall state-space models.'
          },
          p_evidence_provenance: {
            modelAttribution: 'gemma-4-26b-a4b-it',
            seedGapId: testGap.id,
            validationRunId: actualRunId
          }
        };

        const { data: oppId, error: persistErr } = await adminClient.rpc('rpc_persist_research_opportunity', validPayload);
        assert(!persistErr && Boolean(oppId), `Successfully persisted research opportunity UUID: ${oppId}`);

        // Fetch inserted record
        const { data: oppRecord } = await adminClient
          .from('research_opportunities')
          .select('*')
          .eq('id', oppId)
          .single();

        assert(Boolean(oppRecord), 'Retrieved persisted opportunity record from database');
        assert(
          Number(oppRecord?.intrinsic_scientific_value) === scoresResult.intrinsicScientificValue,
          `Persisted V_scientific matches computed score (${oppRecord?.intrinsic_scientific_value} === ${scoresResult.intrinsicScientificValue})`
        );
        assert(oppRecord?.status === 'ELIGIBLE', 'Persisted opportunity status is ELIGIBLE');
        assert(oppRecord?.is_stale === false, 'Persisted opportunity starts with is_stale = false');

        // -------------------------------------------------------------------------
        // GATE 8: Automatic Transactional Staleness Propagation (Database Triggers)
        // -------------------------------------------------------------------------
        console.log('\n[Gate 8] Automatic Transactional Staleness Propagation (Database Triggers)...');

        // 8.1 Setup second independent gap C to verify it remains unaffected
        const { data: gapC } = await adminClient
          .from('research_gaps')
          .insert({
            gap_statement: 'Unrelated gap for isolation verification.',
            gap_category: 'THEORETICAL',
            current_epistemic_classification: 'CANDIDATE_RESEARCH_GAP',
            current_validation_outcome: 'INSUFFICIENT_EVIDENCE',
            model_used: 'gemma-4-26b-a4b-it',
            model_requested: 'gemma-4-26b-a4b-it',
            visibility: 'public',
            is_published: true
          })
          .select('id')
          .single();

        if (!gapC) throw new Error('Failed to create gapC');

        const runCId = `run-c-${Date.now()}`;
        const { data: valCId } = await adminClient.rpc('insert_server_verified_validation', {
          p_gap_id: gapC.id,
          p_validation_outcome: 'CONFIRMED_UNRESOLVED',
          p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
          p_confidence_score: 8.8,
          p_reasoning_summary: 'Gap C verification',
          p_model_attribution: 'gemma-4-26b-a4b-it',
          p_search_methodology_version: '4.1.0-multi-vector-discovery',
          p_literature_coverage_timestamp: new Date().toISOString(),
          p_supporting_evidence_references: [],
          p_contradictory_evidence_references: [],
          p_previously_addressed_research_references: [],
          p_literature_coverage_metadata: { validationRunId: runCId },
          p_gap_relationships: [],
          p_new_evidence_items: []
        });

        const { data: valCRecord } = await adminClient
          .from('research_gap_validations')
          .select('validation_run_id')
          .eq('id', valCId)
          .single();

        if (!valCRecord) throw new Error('Failed to fetch valCRecord');

        const { data: oppCId } = await adminClient.rpc('rpc_persist_research_opportunity', {
          p_gap_id: gapC.id,
          p_validation_run_id: valCRecord.validation_run_id,
          p_status: 'ELIGIBLE',
          p_intrinsic_value: 8.50,
          p_confidence: 8.8,
          p_novelty: 8.0,
          p_significance: 8.5,
          p_tractability: 8.0,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER'
        });

        assert(Boolean(oppCId), `Created control opportunity C: ${oppCId}`);

        // 8.2 Trigger Test 1: Insert new validation run for testGap -> Trigger must automatically mark oppRecord as stale
        const newRunId = `run-new-superseding-${Date.now()}`;
        const { data: newValidationId } = await adminClient.rpc('insert_server_verified_validation', {
          p_gap_id: testGap.id,
          p_validation_outcome: 'CONFIRMED_UNRESOLVED',
          p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
          p_confidence_score: 9.3,
          p_reasoning_summary: 'New superseding validation run',
          p_model_attribution: 'gemma-4-26b-a4b-it',
          p_search_methodology_version: '4.1.0-multi-vector-discovery',
          p_literature_coverage_timestamp: new Date().toISOString(),
          p_supporting_evidence_references: [],
          p_contradictory_evidence_references: [],
          p_previously_addressed_research_references: [],
          p_literature_coverage_metadata: { validationRunId: newRunId },
          p_gap_relationships: [],
          p_new_evidence_items: []
        });

        assert(Boolean(newValidationId), 'Inserted new validation run into research_gap_validations');

        // Check original opportunity oppRecord: must be automatically is_stale = true via trigger
        const { data: autoStaleOpp } = await adminClient
          .from('research_opportunities')
          .select('is_stale, staleness_reason')
          .eq('id', oppId)
          .single();

        assert(autoStaleOpp?.is_stale === true, 'Database Trigger: Existing opportunity automatically marked is_stale = true upon new validation run insert');
        assert(
          autoStaleOpp?.staleness_reason === 'SUPERSEDED_BY_NEW_VALIDATION_RUN',
          `Database Trigger: Staleness reason recorded as '${autoStaleOpp?.staleness_reason}'`
        );

        // 8.3 Trigger Test 2: Update gap outcome on gapC -> Trigger must automatically mark oppCId as stale
        const { error: gapUpdateErr } = await adminClient
          .from('research_gaps')
          .update({ current_validation_outcome: 'CONTRADICTED' })
          .eq('id', gapC.id);

        assert(!gapUpdateErr, 'Updated gapC current_validation_outcome to CONTRADICTED');

        const { data: autoStaleOppC } = await adminClient
          .from('research_opportunities')
          .select('is_stale, staleness_reason')
          .eq('id', oppCId)
          .single();

        assert(autoStaleOppC?.is_stale === true, 'Database Trigger: Opportunity C automatically marked is_stale = true upon gap validation outcome change');
        assert(
          autoStaleOppC?.staleness_reason === 'UPSTREAM_GAP_VALIDATION_OUTCOME_MUTATED',
          `Database Trigger: Staleness reason recorded as '${autoStaleOppC?.staleness_reason}'`
        );

        // 8.4 Isolation Test: Unrelated opportunity on another gap is not affected by independent changes
        // Create Opportunity D on testGap with new validation run
        const { data: valNewRecord } = await adminClient
          .from('research_gap_validations')
          .select('validation_run_id')
          .eq('id', newValidationId)
          .single();

        if (!valNewRecord) throw new Error('Failed to fetch valNewRecord');

        const { data: oppDId } = await adminClient.rpc('rpc_persist_research_opportunity', {
          p_gap_id: testGap.id,
          p_validation_run_id: valNewRecord.validation_run_id,
          p_status: 'ELIGIBLE',
          p_intrinsic_value: 8.90,
          p_confidence: 9.3,
          p_novelty: 8.5,
          p_significance: 9.0,
          p_tractability: 8.5,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER'
        });

        const { data: freshOppD } = await adminClient
          .from('research_opportunities')
          .select('is_stale')
          .eq('id', oppDId)
          .single();

        assert(freshOppD?.is_stale === false, 'Isolation Invariant: Freshly persisted opportunity for active run starts non-stale (is_stale = false)');

        // -------------------------------------------------------------------------
        // GATE 9: Adversarial Row-Level Security (RLS) Isolation
        // -------------------------------------------------------------------------
        console.log('\n[Gate 9] Adversarial Row-Level Security (RLS) Isolation...');

        // 9.1 Private Parent Gap Leakage Prevention
        // Create private, unpublished gap E
        const { data: privateGap } = await adminClient
          .from('research_gaps')
          .insert({
            gap_statement: 'Private research gap with sensitive unpublished proprietary findings.',
            gap_category: 'COMPUTATIONAL_SCALABILITY',
            current_epistemic_classification: 'CANDIDATE_RESEARCH_GAP',
            current_validation_outcome: 'INSUFFICIENT_EVIDENCE',
            model_used: 'gemma-4-26b-a4b-it',
            model_requested: 'gemma-4-26b-a4b-it',
            visibility: 'private',
            is_published: false
          })
          .select('id')
          .single();

        if (!privateGap) throw new Error('Failed to create privateGap');

        const runPrivId = `run-priv-${Date.now()}`;
        const { data: valPrivId } = await adminClient.rpc('insert_server_verified_validation', {
          p_gap_id: privateGap.id,
          p_validation_outcome: 'CONFIRMED_UNRESOLVED',
          p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
          p_confidence_score: 9.0,
          p_reasoning_summary: 'Private gap validation',
          p_model_attribution: 'gemma-4-26b-a4b-it',
          p_search_methodology_version: '4.1.0-multi-vector-discovery',
          p_literature_coverage_timestamp: new Date().toISOString(),
          p_supporting_evidence_references: [],
          p_contradictory_evidence_references: [],
          p_previously_addressed_research_references: [],
          p_literature_coverage_metadata: { validationRunId: runPrivId },
          p_gap_relationships: [],
          p_new_evidence_items: []
        });

        const { data: valPrivRecord } = await adminClient
          .from('research_gap_validations')
          .select('validation_run_id')
          .eq('id', valPrivId)
          .single();

        if (!valPrivRecord) throw new Error('Failed to fetch valPrivRecord');

        const { data: privOppId } = await adminClient.rpc('rpc_persist_research_opportunity', {
          p_gap_id: privateGap.id,
          p_validation_run_id: valPrivRecord.validation_run_id,
          p_status: 'ELIGIBLE',
          p_intrinsic_value: 9.50,
          p_confidence: 9.0,
          p_novelty: 9.5,
          p_significance: 9.5,
          p_tractability: 9.0,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER'
        });

        assert(Boolean(privOppId), `Created private opportunity: ${privOppId}`);

        // Anonymous query attempt on private opportunity
        const { data: leakCheck, error: leakErr } = await anonClient
          .from('research_opportunities')
          .select('id, intrinsic_scientific_value')
          .eq('id', privOppId);

        if (leakErr) {
          console.error('Anonymous private opportunity query error:', leakErr);
        }

        assert(!leakErr, 'Anonymous query executed without server error');
        assert(
          Boolean(leakCheck && leakCheck.length === 0),
          'Adversarial RLS Protection: Anonymous client CANNOT view opportunity linked to private/unpublished gap (0 records returned)'
        );

        // 9.2 Anonymous client can read public, published opportunities
        const { data: publicRead } = await anonClient
          .from('research_opportunities')
          .select('id')
          .eq('id', oppDId);

        assert(
          Boolean(publicRead && publicRead.length === 1),
          'RLS Verification: Anonymous client can view opportunity linked to public, published research gap'
        );

        // 9.3 Anonymous client cannot directly mutate/insert opportunities
        const { error: anonInsertErr } = await anonClient
          .from('research_opportunities')
          .insert({
            gap_id: testGap.id,
            validation_run_id: valNewRecord.validation_run_id,
            status: 'ELIGIBLE',
            intrinsic_scientific_value: 9.99
          });

        assert(Boolean(anonInsertErr), 'Direct anon INSERT is strictly rejected by Row-Level Security (RLS)');

        // 9.4 Anonymous client cannot directly update opportunities
        const { data: anonUpdate, error: anonUpdateErr } = await anonClient
          .from('research_opportunities')
          .update({ intrinsic_scientific_value: 0.01 })
          .eq('id', oppDId)
          .select();

        assert(
          !anonUpdate || anonUpdate.length === 0,
          'Direct anon UPDATE impacts 0 rows under Row-Level Security (RLS)'
        );

        // 9.5 Anonymous client cannot directly delete opportunities
        const { data: anonDelete } = await anonClient
          .from('research_opportunities')
          .delete()
          .eq('id', oppDId)
          .select();

        assert(
          !anonDelete || anonDelete.length === 0,
          'Direct anon DELETE impacts 0 rows under Row-Level Security (RLS)'
        );

        // 9.6 Privileged RPCs execution rights restricted to service_role
        const { error: anonPersistRpcErr } = await anonClient.rpc('rpc_persist_research_opportunity', {
          p_gap_id: testGap.id,
          p_validation_run_id: valNewRecord.validation_run_id,
          p_status: 'ELIGIBLE',
          p_intrinsic_value: 9.99,
          p_confidence: 9.0,
          p_novelty: 9.0,
          p_significance: 9.0,
          p_tractability: 9.0,
          p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
          p_density_status: 'SPARSE_FRONTIER'
        });

        assert(
          Boolean(anonPersistRpcErr),
          'Privileged RPC rpc_persist_research_opportunity strictly rejects execution from anonymous client (42501 ACL)'
        );

        const { error: anonStaleRpcErr } = await anonClient.rpc('rpc_propagate_gap_staleness', {
          p_gap_id: testGap.id,
          p_reason: 'Malicious anon staleness attempt'
        });

        assert(
          Boolean(anonStaleRpcErr),
          'Privileged RPC rpc_propagate_gap_staleness strictly rejects execution from anonymous client (42501 ACL)'
        );

        // Cleanup test records
        await adminClient.from('research_opportunities').delete().in('gap_id', [testGap.id, gapC.id, privateGap.id]);
        await adminClient.from('research_gap_validations').delete().in('gap_id', [testGap.id, gapC.id, privateGap.id]);
        await adminClient.from('research_gaps').delete().in('id', [testGap.id, gapC.id, privateGap.id]);
        await adminClient.from('research_papers').delete().eq('id', testPaper.id);
      }
    }
  }

  // -------------------------------------------------------------------------
  // FINAL TEST SUITE REPORT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`Stage 4E Test Suite Complete: ${passed} passed, ${failed} failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage4ETestSuite().catch((err) => {
  console.error('Fatal error in Stage 4E test suite:', err);
  process.exit(1);
});
