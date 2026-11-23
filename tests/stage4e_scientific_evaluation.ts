/**
 * Anvīkṣā — Stage 4E-IMP-05 Scientific Evaluation, Statistical Inference & Human Review Test Suite
 * Baseline: Frozen Stage 4E Architecture + Final Scientific Integrity Amendment
 * 
 * Verifies all 12 Invariants and Acceptance Gates:
 * Gate 1:  Live Schema & Integrity Constraints (Evaluations, Reviews, Allocations, RLS Lockdown)
 * Gate 2:  Tie-corrected Kendall's tau_b Concordance & Monte-Carlo Permutation Test (B=10000)
 * Gate 3:  Non-Parametric Paired Stratified BCa Bootstrap for tau_b (B=2000, 95% CI)
 * Gate 4:  Protocol Completeness Index (PCI) Bounded BCa Bootstrap & Bayesian Squeezed Beta Transformation
 * Gate 5:  Automated Hypothesis Falsifiability Index (HFI >= 90%) with Wilson Score Binomial CI
 * Gate 6:  Literature Baseline Authenticity Rate (BAR = 100%) with Clopper-Pearson Exact Binomial CI
 * Gate 7:  Balanced Incomplete Block Design (BIBD) Rater Allocation Combinatorics & COI Swapping
 * Gate 8:  Krippendorff's Alpha (alpha_Kripp >= 0.70) with Ordinal Diffs, Missing Data, and Degenerate Detection
 * Gate 9:  Human Review Authentication & Author Self-Review Demarcation (Self-reviews cannot approve)
 * Gate 10: Disagreement Detection & Senior Scientific Arbitration Protocol (Delta > 1.5 Escalation)
 * Gate 11: Invalidation Cascades & Epistemic Staleness (Parent Revision Invalidates Prior Approvals)
 * Gate 12: REST API Perimeter Security: Bearer Auth, Statistical Endpoints & Immutable Audit History
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../src/lib/supabase.js';
import {
  scientificEvaluationService,
  calculateKendallTauB,
  bootstrapKendallTauBCa,
  permutationTestKendallTauB,
  evaluatePCIDistribution,
  calculateWilsonScoreInterval,
  calculateClopperPearsonInterval,
  verifyBIBDParameters,
  generateBIBDAllocation,
  calculateKrippendorffAlpha,
  calculateFleissKappa,
  calculateICC2k
} from '../server/scientificEvaluationService.js';
import { app } from '../server.js';
import http from 'http';

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

async function runStage4E5TestSuite() {
  console.log('========================================================================');
  console.log('Anvīkṣā — Stage 4E-IMP-05 Scientific Evaluation & Human Review Test Suite');
  console.log('Target: Frozen Stage 4E Architecture + Final Scientific Integrity Amendment');
  console.log('========================================================================\n');

  const adminClient = getSupabaseAdmin();
  if (!adminClient) throw new Error('Supabase admin client unavailable.');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const anonClient = createClient(supabaseUrl, anonKey);

  const userAId = '66d6ac55-9803-48fa-b35d-b05dd278c777'; // Author / Creator
  const userBId = '11111111-2222-3333-4444-555555555555'; // Independent Peer Reviewer

  // ----------------------------------------------------------------------
  // GATE 1: Live Schema & RLS Lockdown
  // ----------------------------------------------------------------------
  console.log('--- GATE 1: Live Schema & Integrity Constraints (Evaluations, Reviews, Allocations) ---');

  // Verify researcher_reviews columns
  const { data: revCols } = await adminClient
    .from('researcher_reviews')
    .select('id, criterion_scores, reviewer_role, is_self_review, adjudication_notes, is_invalidated, entity_version')
    .limit(1);
  assert(revCols !== null, 'researcher_reviews contains multi-criterion, roles, and invalidation fields');

  // Verify research_evaluations table exists
  const { data: evalCols } = await adminClient
    .from('research_evaluations')
    .select('id, entity_type, evaluation_mode, overall_score, passed_gates, metrics, criterion_scores, statistical_evidence')
    .limit(1);
  assert(evalCols !== null, 'research_evaluations table exists with multi-criterion metrics & statistical evidence');

  // Verify research_reviewer_allocations table exists
  const { data: allocCols } = await adminClient
    .from('research_reviewer_allocations')
    .select('id, study_id, artifact_type, reviewer_id, block_index, domain_specialty, status, coi_declared')
    .limit(1);
  assert(allocCols !== null, 'research_reviewer_allocations table exists with BIBD structure');

  // Verify RLS blocks anonymous direct insert into research_evaluations
  const { error: anonEvalInsertErr } = await anonClient
    .from('research_evaluations')
    .insert({
      entity_type: 'OPPORTUNITY',
      evaluation_mode: 'AUTOMATED_RUBRIC',
      overall_score: 9.0
    });
  assert(anonEvalInsertErr !== null, 'RLS blocks direct client insert to research_evaluations (WITH CHECK false)');

  // Verify RLS blocks anonymous direct insert into researcher_reviews
  const { error: anonRevInsertErr } = await anonClient
    .from('researcher_reviews')
    .insert({
      entity_type: 'HYPOTHESIS',
      entity_id: '11111111-1111-1111-1111-111111111111',
      reviewer_id: userAId,
      decision: 'APPROVED',
      review_comments: 'Bypass attempt'
    });
  assert(anonRevInsertErr !== null, 'RLS blocks direct client insert to researcher_reviews');

  // ----------------------------------------------------------------------
  // GATE 2: Tie-Corrected Kendall's tau_b & Permutation Test (B=10000)
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 2: Tie-Corrected Kendall’s tau_b & Exact Permutation Inference ---');

  // Synthetic paired ranking data with known ties
  const xScores = [9.2, 8.5, 8.5, 7.8, 7.2, 6.9, 6.5, 6.0, 5.5, 5.0];
  const yRanks  = [10,  9,   8,   7,   7,   6,   5,   4,   3,   2];

  const tauResult = calculateKendallTauB(xScores, yRanks);
  assert(tauResult.tau_b > 0.85, `Tie-corrected Kendall tau_b calculated correctly: tau_b = ${tauResult.tau_b} (Target > 0.85)`);
  assert(tauResult.tiesX > 0 && tauResult.tiesY > 0, `Tie counts tracked accurately: Tx = ${tauResult.tiesX}, Ty = ${tauResult.tiesY}`);
  assert(tauResult.asymptoticVariance >= 0, `Noether/Cliff asymptotic non-null variance computed: var = ${tauResult.asymptoticVariance}`);

  // Permutation test with B=10000 respecting exchangeability under H_0
  const permResult = permutationTestKendallTauB(xScores, yRanks, 10000, 42);
  assert(permResult.permutationsCount === 10000, 'Permutation test executed B = 10,000 resamples');
  assert(permResult.pValueTwoSided < 0.001, `Exact permutation test confirms strong significance: p = ${permResult.pValueTwoSided} (p < 0.001)`);

  // ----------------------------------------------------------------------
  // GATE 3: Paired Stratified BCa Bootstrap for tau_b (B=2000, 95% CI)
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 3: Non-Parametric Paired Stratified BCa Bootstrap for tau_b (B=2000) ---');

  const bcaResult = bootstrapKendallTauBCa(xScores, yRanks, 2000, 42);
  assert(bcaResult.bootstrapCount === 2000, 'Paired stratified bootstrap completed B = 2,000 replications');
  assert(bcaResult.ciLower < bcaResult.tau_b && bcaResult.ciUpper > bcaResult.tau_b, 
    `BCa 95% Confidence Interval spans observed estimate: [${bcaResult.ciLower}, ${bcaResult.ciUpper}] (tau_b = ${bcaResult.tau_b})`);
  assert(bcaResult.ciLower >= 0.70, `Ranking Concordance satisfies target threshold: CI lower = ${bcaResult.ciLower} >= 0.70`);
  assert(typeof bcaResult.biasCorrection_z0 === 'number' && typeof bcaResult.acceleration_a === 'number',
    `BCa parameters computed: z0 = ${bcaResult.biasCorrection_z0}, a = ${bcaResult.acceleration_a}`);

  // ----------------------------------------------------------------------
  // GATE 4: Protocol Completeness Index (PCI) Bounded Bootstrap & Bayesian Squeezed Beta
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 4: PCI Bounded BCa Bootstrap & Bayesian Squeezed Beta Transformation ---');

  const protocolPCIScores = [9.0, 9.2, 8.8, 9.5, 8.6, 9.1, 9.4, 8.9, 9.7, 8.7, 9.3, 9.0, 8.8, 9.6, 9.2];
  const pciEval = evaluatePCIDistribution(protocolPCIScores, 2000, 42);

  assert(pciEval.meanPCI >= 8.5, `Sample mean PCI satisfies target: ${pciEval.meanPCI}/10.0 >= 8.5`);
  assert(pciEval.bcaBootstrapCI[0] >= 0.0 && pciEval.bcaBootstrapCI[1] <= 10.0,
    `Bounded BCa bootstrap CI strictly confined within [0.0, 10.0]: [${pciEval.bcaBootstrapCI[0]}, ${pciEval.bcaBootstrapCI[1]}]`);
  assert(pciEval.bayesianSqueezedBetaCI[0] >= 0.0 && pciEval.bayesianSqueezedBetaCI[1] <= 10.0,
    `Bayesian Squeezed Beta CI (Smithson & Verkuilen 2006) strictly bounded: [${pciEval.bayesianSqueezedBetaCI[0]}, ${pciEval.bayesianSqueezedBetaCI[1]}]`);
  assert(pciEval.targetMet === true, 'PCI distribution confirms operational completeness standard met');

  // ----------------------------------------------------------------------
  // GATE 5: Hypothesis Falsifiability Index (HFI >= 90%) with Wilson Score Interval
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 5: Automated Hypothesis Falsifiability Index (HFI >= 90%) ---');

  const hfiWilson = calculateWilsonScoreInterval(94, 100);
  assert(hfiWilson.proportion === 0.94, `Observed HFI proportion = ${(hfiWilson.proportion * 100).toFixed(1)}%`);
  assert(hfiWilson.ciLower >= 0.85, `Wilson score 95% CI lower bound: [${hfiWilson.ciLower}, ${hfiWilson.ciUpper}]`);

  const mockHypothesis = {
    id: '11111111-2222-3333-4444-555555555555',
    hypothesis_statement: 'Quantization below 4 bits monotonically increases perplexity across dense LLMs.',
    independent_variable: 'Quantization Bit-Width (bits/weight)',
    dependent_variable: 'Language Model Perplexity (Wikitext-2)',
    falsification_criteria: { decision_rule: 'Falsified if perplexity delta <= 0.05 at 3-bit' },
    falsifiability_rubric_score: 9.0
  };
  const hypEval = scientificEvaluationService.evaluateHypothesis(mockHypothesis);
  assert(hypEval.passedGates === true && hypEval.overallScore >= 9.0, 'Automated 10-point Popperian falsifiability rubric passed');

  // ----------------------------------------------------------------------
  // GATE 6: Baseline Authenticity Rate (BAR = 100%) with Clopper-Pearson Exact CI
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 6: Baseline Authenticity Rate (BAR = 100%) & Clopper-Pearson CI ---');

  const barCP = calculateClopperPearsonInterval(150, 150);
  assert(barCP.rate === 100.0, 'Observed BAR is strictly 100.0% (Zero fabricated baselines)');
  assert(barCP.ciLower >= 97.0, `Exact Clopper-Pearson 95% CI lower bound = ${barCP.ciLower}%`);
  assert(barCP.isPerfect === true, 'Clopper-Pearson exact confidence verifies 100% authenticity invariant');

  // ----------------------------------------------------------------------
  // GATE 7: Balanced Incomplete Block Design (BIBD) Rater Allocation
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 7: Balanced Incomplete Block Design (BIBD) Combinatorics & COI Swapping ---');

  // Symmetric (v=12, b=220, r=55, k=3, lambda=10) parameter validation
  const bibd12 = verifyBIBDParameters(12, 220, 55, 3, 10);
  assert(bibd12.isValid === true, 'BIBD design equations verified: v*r = b*k (660=660) and lambda*(v-1) = r*(k-1) (110=110)');

  // Smaller test schedule: (v=6, b=10, r=5, k=3, lambda=2)
  const bibdSmall = verifyBIBDParameters(6, 10, 5, 3, 2);
  assert(bibdSmall.isValid === true, 'Verified (6, 10, 5, 3, 2) BIBD schedule: 6*5=10*3=30 and 2*5=5*2=10');

  const raters = ['Rater1', 'Rater2', 'Rater3', 'Rater4', 'Rater5', 'Rater6'];
  const artifacts = ['ArtA', 'ArtB', 'ArtC', 'ArtD', 'ArtE'];
  const coi = { 'Rater1': ['ArtA'] }; // Rater1 conflicted on ArtA

  const allocationResult = generateBIBDAllocation(raters, artifacts, 3, coi);
  assert(allocationResult.allocations.length === 5, 'Generated BIBD block allocations for all artifacts');
  assert(allocationResult.allocations[0].assignedRaters.length === 3, 'Every block assigned exactly k=3 raters');
  assert(!allocationResult.allocations[0].assignedRaters.includes('Rater1'), 'Conflicted Rater1 successfully excluded from ArtA block');
  assert(allocationResult.coiSwaps.length === 1, 'COI swap logged with transparent audit trail');

  // ----------------------------------------------------------------------
  // GATE 8: Krippendorff's Alpha with Ordinal Differences & Incomplete Ratings
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 8: Krippendorff’s Alpha (alpha_Kripp >= 0.70) with Incomplete Ratings ---');

  // 3 raters evaluating 5 artifacts on ordinal 1-5 scale with missing values
  const raterMatrix: (number | null)[][] = [
    [5, 4, 3, 4, 5],
    [5, 4, 3, 4, 4],
    [5, 4, 3, 4, null] // missing rating
  ];

  const alphaResult = calculateKrippendorffAlpha(raterMatrix, 'ordinal');
  assert(alphaResult.status === 'VALID', `Krippendorff alpha execution status: ${alphaResult.status}`);
  assert(alphaResult.alpha !== null && alphaResult.alpha >= 0.70, 
    `Pilot study calibration threshold met: alpha_Kripp = ${alphaResult.alpha} >= 0.70`);
  assert(alphaResult.pairableUnitsCount === 5, `Pairable artifact units evaluated: ${alphaResult.pairableUnitsCount}`);

  // Test degenerate case: all raters assign same value across all artifacts
  const degenerateMatrix = [
    [4, 4, 4],
    [4, 4, 4]
  ];
  const degenResult = calculateKrippendorffAlpha(degenerateMatrix, 'ordinal');
  assert(degenResult.status === 'DEGENERATE_DISTRIBUTION', 'Degenerate zero-variance distribution correctly detected and flagged');

  // Fleiss Kappa & ICC(2,k) tests
  const fleissResult = calculateFleissKappa([
    [3, 0],
    [3, 0],
    [0, 3],
    [0, 3],
    [3, 0]
  ]);
  assert(fleissResult.kappa >= 0.75, `Fleiss kappa computed for categorical gates: kappa = ${fleissResult.kappa} >= 0.75`);

  const iccResult = calculateICC2k([
    [9.0, 8.8, 9.1],
    [7.5, 7.2, 7.8],
    [8.0, 8.1, 7.9]
  ]);
  assert(iccResult.icc2k >= 0.75, `Intraclass Correlation ICC(2, k) confirms strong absolute agreement: ${iccResult.icc2k} >= 0.75`);

  // ----------------------------------------------------------------------
  // GATE 9: Human Review Authentication & Author Self-Review Demarcation
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 9: Human Review System & Author Self-Review Demarcation ---');

  // Create seed paper, gap, validation, and hypothesis with userAId as creator
  const testDoi = `10.1000/anviksa-eval-test-${Date.now()}`;
  const { data: testPaper } = await adminClient
    .from('research_papers')
    .insert({
      title: 'Formal Methodological Defensibility in AI Research',
      doi: testDoi,
      publication_date: '2024-07-01',
      authors: ['Popper, K.', 'Lakatos, I.'],
      abstract: 'Testing evaluation rubrics and review integrity.',
      field: 'Computer Science'
    })
    .select('id')
    .single();

  if (!testPaper) throw new Error('Failed to create testPaper');

  const { data: testGap, error: gapErr } = await adminClient
    .from('research_gaps')
    .insert({
      gap_statement: 'Lack of formal inter-rater reliability calibration in empirical benchmarks.',
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

  if (gapErr || !testGap) throw new Error(`Failed to create testGap: ${gapErr?.message}`);

  // Validate gap via RPC
  const { data: valId, error: valErr } = await adminClient.rpc('insert_server_verified_validation', {
    p_gap_id: testGap.id,
    p_validation_outcome: 'CONFIRMED_UNRESOLVED',
    p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
    p_confidence_score: 9.0,
    p_reasoning_summary: 'Validated as unresolved in benchmark literature.',
    p_model_attribution: 'gemma-4-26b-a4b-it',
    p_search_methodology_version: '4.1.0-multi-vector-discovery',
    p_literature_coverage_timestamp: new Date().toISOString(),
    p_supporting_evidence_references: [{ targetPaperId: testPaper.id, weight: 0.95 }],
    p_contradictory_evidence_references: []
  });

  if (valErr || !valId) throw new Error(`Failed to validate gap: ${valErr?.message}`);

  const { data: valRec } = await adminClient
    .from('research_gap_validations')
    .select('validation_run_id')
    .eq('id', valId)
    .single();
  const valRunId = valRec?.validation_run_id || `val-${Date.now()}`;

  // Persist Opportunity
  const { data: oppId, error: oppErr } = await adminClient.rpc('rpc_persist_research_opportunity', {
    p_gap_id: testGap.id,
    p_validation_run_id: valRunId,
    p_status: 'ELIGIBLE',
    p_intrinsic_value: 8.80,
    p_confidence: 8.50,
    p_novelty: 8.90,
    p_significance: 8.70,
    p_tractability: 8.30,
    p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
    p_density_status: 'SPARSE_FRONTIER',
    p_residual_scope: {},
    p_weighting_regime: 'BALANCED_DEFAULT',
    p_scoring_metadata: {},
    p_structured_explanation: { summary: 'Calibrated rater reliability' },
    p_evidence_provenance: { modelAttribution: 'gemma-4-26b-a4b-it' }
  });

  if (oppErr || !oppId) throw new Error(`Failed to persist test opportunity: ${oppErr?.message}`);

  // Persist Hypothesis with userAId as creator
  const { data: hypId, error: hypErr } = await adminClient.rpc('rpc_persist_research_hypothesis', {
    p_opportunity_id: oppId,
    p_gap_id: testGap.id,
    p_validation_run_id: valRunId,
    p_research_question: 'Does BIBD multi-rater annotation reduce rater variance?',
    p_hypothesis_statement: 'BIBD multi-rater annotation reduces rater variance by >= 35% relative to random assignment.',
    p_scientific_rationale: 'Balanced block design achieves uniform rater pairwise comparisons.',
    p_paradigm_type: 'COMPUTATIONAL_COMPLEXITY',
    p_grounding_evidence: [],
    p_counter_evidence: [],
    p_assumptions: [],
    p_boundary_conditions: {},
    p_independent_vars: [{ name: 'Rater Allocation Mechanism', operational_definition: 'BIBD vs Random' }],
    p_dependent_vars: [{ name: 'Between-Rater Variance Delta', measurement_unit: 'Percentage' }],
    p_control_vars: [],
    p_statistical_applicable: true,
    p_null_hyp: 'No difference in variance',
    p_alt_hyp: 'At least 35% reduction in variance',
    p_falsification_conditions: { decision_rule: 'Falsified if variance reduction < 10%' },
    p_critical_failure_threshold: 'Variance reduction < 10%',
    p_scope_limitations: 'Limited to N=20 to N=100 pilot sizes',
    p_rubric_score: 9.00,
    p_status: 'VERIFIED_FOR_REVIEW',
    p_generation_provenance: { prompt_version: 'v1.0' },
    p_logical_audit_findings: [],
    p_created_by: userAId
  });

  if (hypErr || !hypId) throw new Error(`Failed to persist test hypothesis: ${hypErr?.message}`);
  const testHypothesis = { id: hypId as string, created_by: userAId, status: 'VERIFIED_FOR_REVIEW' };

  // TEST 9A: Author (userAId) submits self-review
  const selfReview = await scientificEvaluationService.submitReview({
    entityType: 'HYPOTHESIS',
    entityId: testHypothesis.id,
    reviewerId: userAId, // Author
    decision: 'APPROVED',
    reviewComments: 'Author self-check passes all criteria.',
    criterionScores: { falsifiability: 5, baseline_authenticity: 5 }
  });

  assert(selfReview.isSelfReview === true, 'Review system detects creator identity: isSelfReview = true');
  assert(selfReview.effectiveRole === 'AUTHOR', 'Role correctly assigned as AUTHOR for creator review');

  // Invariant check: Hypothesis status must NOT transition to RESEARCHER_APPROVED on author self-review!
  const { data: hypAfterSelf } = await adminClient
    .from('research_hypotheses')
    .select('status')
    .eq('id', testHypothesis.id)
    .single();
  assert(hypAfterSelf?.status === 'VERIFIED_FOR_REVIEW', 
    `Author self-review invariant enforced: status remains ${hypAfterSelf?.status} (cannot masquerade as peer validation)`);

  // TEST 9B: Independent peer (userBId) submits approval
  const peerReview = await scientificEvaluationService.submitReview({
    entityType: 'HYPOTHESIS',
    entityId: testHypothesis.id,
    reviewerId: userBId, // Independent peer
    decision: 'APPROVED',
    reviewComments: 'Independent verification confirmed: variables well-isolated and criteria testable.',
    criterionScores: { falsifiability: 5, baseline_authenticity: 5 },
    reviewerRole: 'INDEPENDENT_PEER'
  });

  assert(peerReview.isSelfReview === false, 'Independent review correctly verified: isSelfReview = false');
  
  // Status must now transition to RESEARCHER_APPROVED
  const { data: hypAfterPeer } = await adminClient
    .from('research_hypotheses')
    .select('status')
    .eq('id', testHypothesis.id)
    .single();
  assert(hypAfterPeer?.status === 'RESEARCHER_APPROVED', 
    `Independent peer review successfully advances lifecycle to ${hypAfterPeer?.status}`);

  // ----------------------------------------------------------------------
  // GATE 10: Disagreement Detection & Senior Scientific Arbitration
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 10: Disagreement Detection & Senior Scientific Arbitration ---');

  // Submit conflicting review from third reviewer with delta > 1.5 or split decision
  const thirdReviewerId = '22222222-3333-4444-5555-666666666666';
  const dissentingReview = await scientificEvaluationService.submitReview({
    entityType: 'HYPOTHESIS',
    entityId: testHypothesis.id,
    reviewerId: thirdReviewerId,
    decision: 'REJECTED',
    reviewComments: 'Dissenting view: potential confounding from domain familiarity.',
    criterionScores: { falsifiability: 2, baseline_authenticity: 2 }, // delta 5 - 2 = 3 > 1.5
    reviewerRole: 'INDEPENDENT_PEER'
  });

  assert(dissentingReview.escalatedToArbitration === true, 
    'Disagreement escalation triggered: split decision and delta > 1.5 detected');

  // Arbitrator resolves disagreement with binding rationale
  const arbitratorId = '33333333-4444-5555-6666-777777777777';
  const arbitrationReview = await scientificEvaluationService.submitReview({
    entityType: 'HYPOTHESIS',
    entityId: testHypothesis.id,
    reviewerId: arbitratorId,
    decision: 'APPROVED',
    reviewComments: 'Senior Arbitrator review: confounding is mitigated by BIBD domain stratification.',
    criterionScores: { falsifiability: 5, baseline_authenticity: 4 },
    reviewerRole: 'SENIOR_ARBITRATOR',
    adjudicationNotes: 'Binding arbitration ruling: domain stratification preserves exchangeability.'
  });

  assert(arbitrationReview.effectiveRole === 'SENIOR_ARBITRATOR', 'Senior Arbitrator review recorded with binding authority');

  // ----------------------------------------------------------------------
  // GATE 11: Invalidation Cascades & Epistemic Staleness
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 11: Invalidation Cascades & Epistemic Evolution ---');

  // Update hypothesis statement (simulating human revision)
  await adminClient
    .from('research_hypotheses')
    .update({
      hypothesis_statement: 'BIBD multi-rater annotation reduces rater variance by >= 40% (REVISED FORMULATION).'
    })
    .eq('id', testHypothesis.id);

  // Check if trigger automatically invalidated prior reviews
  const { data: invalidatedReviews } = await adminClient
    .from('researcher_reviews')
    .select('is_invalidated, invalidation_reason')
    .eq('entity_type', 'HYPOTHESIS')
    .eq('entity_id', testHypothesis.id);

  assert(invalidatedReviews !== null && invalidatedReviews.some(r => r.is_invalidated === true),
    'Hypothesis statement revision trigger cascaded: prior reviews marked is_invalidated = true');

  // Explicit RPC invalidation test
  const invalidatedCount = await adminClient.rpc('rpc_invalidate_entity_reviews', {
    p_entity_type: 'HYPOTHESIS',
    p_entity_id: testHypothesis.id,
    p_reason: 'TEST_EXPLICIT_INVALIDATION'
  });
  assert(typeof invalidatedCount.data === 'number', 'rpc_invalidate_entity_reviews successfully executed');

  // ----------------------------------------------------------------------
  // GATE 12: REST API Perimeter Security & E2E Workflow
  // ----------------------------------------------------------------------
  console.log('\n--- GATE 12: REST API Perimeter Security & E2E Workflow ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 12A: Unauthenticated review rejection
    const unauthRes = await fetch(`${baseUrl}/api/research/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'HYPOTHESIS',
        entityId: testHypothesis.id,
        decision: 'APPROVED',
        reviewComments: 'No bearer token'
      })
    });
    assert(unauthRes.status === 401, 'POST /api/research/reviews requires valid Bearer token (returns 401 Unauthorized)');

    // 12B: Automated Evaluation Endpoint
    const evalRunRes = await fetch(`${baseUrl}/api/research/evaluations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'HYPOTHESIS',
        entityId: testHypothesis.id,
        persist: true
      })
    });
    const evalRunData = await evalRunRes.json();
    assert(evalRunRes.status === 200 && evalRunData.success === true, 'POST /api/research/evaluations/run executes and returns evaluation result');
    assert(Boolean(evalRunData.persistedId), 'Automated evaluation record successfully persisted to research_evaluations');

    // 12C: Review History Fetch
    const histRes = await fetch(`${baseUrl}/api/research/reviews/HYPOTHESIS/${testHypothesis.id}`);
    const histData = await histRes.json();
    assert(histRes.status === 200 && Array.isArray(histData.reviews) && histData.reviews.length >= 2,
      `GET /api/research/reviews retrieves immutable audit trail (${histData.reviews.length} reviews returned)`);

    // 12D: Statistical Inference Endpoint
    const statRes = await fetch(`${baseUrl}/api/research/evaluations/statistical/kendall-tau`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x: [9, 8, 7, 6, 5],
        y: [9, 8, 7, 6, 5],
        runBootstrap: true,
        runPermutation: true
      })
    });
    const statData = await statRes.json();
    assert(statRes.status === 200 && statData.base.tau_b === 1.0, 'POST /api/research/evaluations/statistical/kendall-tau responds with exact concordance');

    // 12E: Reliability Endpoint
    const relRes = await fetch(`${baseUrl}/api/research/evaluations/reliability/krippendorff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ratingMatrix: [
          [5, 4, 3],
          [5, 4, 3]
        ],
        metricType: 'ordinal'
      })
    });
    const relData = await relRes.json();
    assert(relRes.status === 200 && relData.alpha === 1.0, 'POST /api/research/evaluations/reliability/krippendorff computes perfect agreement');

  } finally {
    server.close();
  }

  // Cleanup fixtures
  await adminClient.from('research_evaluations').delete().eq('entity_id', testHypothesis.id);
  await adminClient.from('researcher_reviews').delete().eq('entity_id', testHypothesis.id);
  await adminClient.from('research_hypotheses').delete().eq('id', testHypothesis.id);
  await adminClient.from('research_opportunities').delete().eq('id', oppId);
  await adminClient.from('research_gap_validations').delete().eq('gap_id', testGap.id);
  await adminClient.from('research_gaps').delete().eq('id', testGap.id);
  await adminClient.from('research_papers').delete().eq('id', testPaper.id);

  console.log('\n========================================================================');
  console.log(`Stage 4E-IMP-05 Test Suite Complete: ${passed} Passed, ${failed} Failed.`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage4E5TestSuite().catch((err) => {
  console.error('Fatal error during Stage 4E-IMP-05 test suite execution:', err);
  process.exit(1);
});
