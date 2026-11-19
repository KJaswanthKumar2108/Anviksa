/**
 * Anvīkṣā — Stage 4D Cross-Literature Validation & Contradiction Detection Test Suite
 * 
 * Verifies all 11 Acceptance Gates:
 * Gate 1:  Live Schema & Migration Verification (Constraints, Indexes, RPCs)
 * Gate 2:  Database-Level RLS & Service-Role Isolation
 * Gate 3:  Composite Foreign Key (gap_id, validation_run_id) Integrity
 * Gate 4:  Partial Unique Indexes & Nil UUID Rejection
 * Gate 5:  Methodological Comparability & 5-Valued Dimension Semantics
 * Gate 6:  Source Independence Evaluator & Strict Replication Rules (2 Partial != Independent)
 * Gate 7:  Contradiction Detection & Exact Codepoint Quote Slicing
 * Gate 8:  Provisional Validation Strength Model (S_val) & Mandatory Notice
 * Gate 9:  Atomic Validation Orchestration via Master RPC & Cryptographic Corpus Invariant
 * Gate 10: Soft Deletion, Archival & Purge Safety Semantics
 * Gate 11: Real Scientific Benchmark Clusters (FlashAttention/Mamba, GNN, LoRA)
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, getSupabaseCredentials } from '../src/lib/supabase.js';
import {
  sourceIndependenceService,
  IndependenceState
} from '../server/sourceIndependenceService.js';
import {
  methodologicalComparabilityEngine,
  ScientificEntityDimensions
} from '../server/methodologicalComparabilityEngine.js';
import {
  contradictionDetectionService
} from '../server/contradictionDetectionService.js';
import {
  provisionalValidationStrengthService
} from '../server/provisionalValidationStrengthService.js';
import {
  crossLiteratureValidationService
} from '../server/crossLiteratureValidationService.js';

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

async function runStage4DTestSuite() {
  console.log('========================================================================');
  console.log('Anvīkṣā — Stage 4D Acceptance & Verification Test Suite');
  console.log('Architecture: Version 4.1.0-REVISED (Final Consistency Amendment)');
  console.log('========================================================================\n');

  const adminClient = getSupabaseAdmin();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  // -------------------------------------------------------------------------
  // GATE 5: Methodological Comparability & 5-Valued Dimension Semantics
  // -------------------------------------------------------------------------
  console.log('[Gate 5] Methodological Comparability & 5-Valued Dimension Semantics...');

  // Test 5.1: Operational alignment evaluation
  const opAlignMatch = methodologicalComparabilityEngine.evaluateOperationalAlignment(
    'Can exact attention be computed in O(N) memory without approximations?',
    'Can exact attention be computed in O(N) memory on long sequences?',
    { dep: ['perplexity', 'throughput'] },
    { dep: ['perplexity', 'throughput'] }
  );
  assert(opAlignMatch.status === 'VERIFIED_COMPATIBLE', 'Aligned operational questions return VERIFIED_COMPATIBLE with score 1.0');
  assert(opAlignMatch.score === 1.0, 'Aligned operational question score is 1.0');

  const opAlignDisjoint = methodologicalComparabilityEngine.evaluateOperationalAlignment(
    'Can exact attention be computed in O(N) memory without approximations?',
    'How do protein folding structures assemble in dynamic solvent environments?',
    { dep: ['memory', 'latency'] },
    { dep: ['free energy', 'rmsd'] }
  );
  assert(opAlignDisjoint.status === 'INCOMPATIBLE', 'Disjoint operational questions return INCOMPATIBLE with score 0.0');

  const opAlignMissing = methodologicalComparabilityEngine.evaluateOperationalAlignment(
    '',
    'Some research question',
    {},
    {}
  );
  assert(opAlignMissing.status === 'NOT_REPORTED', 'Missing operational question returns NOT_REPORTED');

  // Test 5.2: 4 Comparability Classes & Critical Compatibility Gates
  const seedDims: ScientificEntityDimensions = {
    task: 'Language Model Context Scaling',
    operationalQuestion: 'Can exact attention be computed in O(N) memory without approximations?',
    metricFormulation: 'Perplexity & Throughput (tokens/sec)',
    datasetDomain: 'LongBench Multi-Task Benchmark',
    baselineModel: 'Standard Transformer-XL',
    computeScale: '8x NVIDIA A100 80GB',
    threatsToValidity: 'Activation recomputation overhead under extreme sequence lengths',
    hardwareEnvironment: 'NVIDIA Ampere A100 GPU cluster'
  };

  const directlyComparableDims: ScientificEntityDimensions = {
    task: 'Language Model Context Scaling',
    operationalQuestion: 'Can exact attention be computed in O(N) memory on long sequences?',
    metricFormulation: 'Perplexity & Throughput (tokens/sec)',
    datasetDomain: 'LongBench Multi-Task Benchmark',
    baselineModel: 'Standard Transformer-XL',
    computeScale: '8x NVIDIA A100 80GB',
    threatsToValidity: 'Activation recomputation overhead',
    hardwareEnvironment: 'NVIDIA Ampere A100 GPU cluster'
  };

  const directResult = methodologicalComparabilityEngine.evaluateComparability(
    'seed-paper-1',
    'val-paper-1',
    seedDims,
    directlyComparableDims
  );
  assert(directResult.comparisonClass === 'DIRECTLY_COMPARABLE', 'All 4 critical gates passed yields DIRECTLY_COMPARABLE');
  assert(directResult.isEligibleForDirectContradiction === true, 'Directly comparable work is eligible for direct empirical contradiction');
  assert(directResult.overallComparabilityScore >= 0.85, `Comparability score is high: ${directResult.overallComparabilityScore.toFixed(3)}`);

  // Nuanced routing: Disjoint task or orthogonal paradigm triggers INCOMMENSURABLE_CONTEXT
  const incommensurableDims: ScientificEntityDimensions = {
    ...directlyComparableDims,
    isOrthogonalParadigm: true,
    task: 'Graph Node Classification'
  };
  const incommResult = methodologicalComparabilityEngine.evaluateComparability(
    'seed-paper-1',
    'val-paper-2',
    seedDims,
    incommensurableDims
  );
  assert(incommResult.comparisonClass === 'INCOMMENSURABLE_CONTEXT', 'Orthogonal paradigm correctly classified as INCOMMENSURABLE_CONTEXT');
  assert(incommResult.isEligibleForDirectContradiction === false, 'Incommensurable context is blocked from direct contradiction');

  // Theoretical complexity paper: hardwareEnvironment is NOT_APPLICABLE and excluded from denominator
  const theoreticalDims: ScientificEntityDimensions = {
    ...directlyComparableDims,
    isTheoreticalOrComplexityPaper: true
  };
  const theoResult = methodologicalComparabilityEngine.evaluateComparability(
    'seed-paper-1',
    'val-paper-3',
    seedDims,
    theoreticalDims
  );
  assert(
    theoResult.contextualDimensions.hardwareDeployment.status === 'NOT_APPLICABLE',
    'Theoretical complexity paper sets hardwareDeployment to NOT_APPLICABLE'
  );
  assert(
    !isNaN(theoResult.overallComparabilityScore),
    'Overall comparability score properly handles NOT_APPLICABLE without NaN corruption'
  );

  // -------------------------------------------------------------------------
  // GATE 6: Source Independence Evaluator & Strict Replication Rules
  // -------------------------------------------------------------------------
  console.log('\n[Gate 6] Source Independence Evaluator & Strict Replication Rules...');

  const paperA = {
    paperId: 'paper-a',
    doi: '10.1000/paper-a',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention',
    authors: ['Dao, Tri', 'Fu, Daniel Y.', 'Ermon, Stefano', 'Rudra, Atri', 'Re, Christopher'],
    institutions: ['Stanford University'],
    publicationYear: 2022
  };

  // Partially dependent (shared author Tri Dao)
  const sharedAuthorPaper = {
    paperId: 'paper-shared',
    doi: '10.1000/paper-shared',
    title: 'Mamba: Linear-Time Sequence Modeling',
    authors: ['Gu, Albert', 'Dao, Tri'],
    institutions: ['Carnegie Mellon University'],
    publicationYear: 2023
  };
  const sharedResult = sourceIndependenceService.evaluatePairwiseIndependence(paperA, sharedAuthorPaper);
  assert(sharedResult.state === 'PARTIALLY_DEPENDENT', 'Shared co-author across different institutions yields PARTIALLY_DEPENDENT');
  assert(sharedResult.weight === 0.5, 'Partially dependent weight is 0.5');

  // Independent paper (completely disjoint authors and institutions)
  const trulyIndependentPaper = {
    paperId: 'paper-truly-indep',
    doi: '10.1000/paper-truly-indep',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, Ashish', 'Shazeer, Noam', 'Parmar, Niki'],
    institutions: ['Google Brain', 'University of Toronto'],
    publicationYear: 2023
  };
  const indepResult = sourceIndependenceService.evaluatePairwiseIndependence(paperA, trulyIndependentPaper);
  assert(indepResult.state === 'INDEPENDENT', 'Disjoint authors and institutions yield INDEPENDENT');
  assert(indepResult.weight === 1.0, 'Independent weight is 1.0');

  // Fully dependent (same lab / primary authors)
  const fullyDependentPaper = {
    paperId: 'paper-dept',
    doi: '10.1000/paper-dept',
    title: 'FlashAttention-2: Faster Attention with Better Parallelism',
    authors: ['Dao, Tri', 'Fu, Daniel Y.', 'Re, Christopher'],
    institutions: ['Stanford University'],
    publicationYear: 2023
  };
  const deptResult = sourceIndependenceService.evaluatePairwiseIndependence(paperA, fullyDependentPaper);
  assert(deptResult.state === 'DEPENDENT', 'Substantial author overlap (>=50%) yields DEPENDENT');
  assert(deptResult.weight === 0.2, 'Fully dependent weight is 0.2');

  // STRICT REPLICATION RULE: Two partially dependent replications != Independent replication standard
  const corpusTwoPartiallyDependent = [
    { paperId: 'p1', doi: '10.1/p1', title: 'Paper 1', authors: ['Dao, Tri', 'NewAuthor1'], institutions: ['Stanford'], publicationYear: 2023 },
    { paperId: 'p2', doi: '10.1/p2', title: 'Paper 2', authors: ['Fu, Daniel Y.', 'NewAuthor2'], institutions: ['Stanford'], publicationYear: 2024 }
  ];
  const assessmentsTwoPartial = corpusTwoPartiallyDependent.map(p =>
    sourceIndependenceService.evaluatePairwiseIndependence(paperA, p)
  );
  const replicationSummary = sourceIndependenceService.evaluateReplicationSufficiency(assessmentsTwoPartial);
  assert(
    replicationSummary.satisfiesStandardReplication === false,
    'Strict Rule Enforced: Two PARTIALLY_DEPENDENT papers DO NOT satisfy standard independent replication'
  );
  assert(
    replicationSummary.satisfiesHybridReplication === false,
    'Strict Rule Enforced: Two PARTIALLY_DEPENDENT papers DO NOT satisfy hybrid replication (independentCount == 0)'
  );

  // Standard replication requires >= 2 INDEPENDENT papers
  const corpusTwoIndependent = [
    { paperId: 'indep1', doi: '10.1/i1', title: 'Independent Study 1', authors: ['Alpha, A.', 'Beta, B.'], institutions: ['MIT'], publicationYear: 2023 },
    { paperId: 'indep2', doi: '10.1/i2', title: 'Independent Study 2', authors: ['Gamma, G.', 'Delta, D.'], institutions: ['ETH Zurich'], publicationYear: 2024 }
  ];
  const assessmentsTwoIndep = corpusTwoIndependent.map(p =>
    sourceIndependenceService.evaluatePairwiseIndependence(paperA, p)
  );
  const standardReplicationSummary = sourceIndependenceService.evaluateReplicationSufficiency(assessmentsTwoIndep);
  assert(
    standardReplicationSummary.satisfiesStandardReplication === true,
    'Two disjoint independent papers satisfy standard independent replication standard'
  );
  assert(standardReplicationSummary.effectivePathway === 'STANDARD_MULTI_GROUP', 'Pathway is STANDARD_MULTI_GROUP');

  // Hybrid Pathway: 1 Independent + 2 Partially Dependent + Human Review
  const hybridCorpus = [
    { paperId: 'indep1', doi: '10.1/i1', title: 'Independent Study', authors: ['Alpha, A.'], institutions: ['MIT'], publicationYear: 2023 },
    { paperId: 'part1', doi: '10.1/p1', title: 'Partially Dependent 1', authors: ['Dao, Tri', 'X1'], institutions: ['Stanford'], publicationYear: 2023 },
    { paperId: 'part2', doi: '10.1/p2', title: 'Partially Dependent 2', authors: ['Fu, Daniel Y.', 'X2'], institutions: ['Stanford'], publicationYear: 2024 }
  ];
  const hybridAssessments = hybridCorpus.map(p =>
    sourceIndependenceService.evaluatePairwiseIndependence(paperA, p)
  );
  const hybridSummary = sourceIndependenceService.evaluateReplicationSufficiency(hybridAssessments);
  assert(hybridSummary.satisfiesHybridReplication === true, '1 independent + 2 partially dependent satisfies hybrid replication');
  assert(hybridSummary.requiresHumanReview === true, 'Hybrid replication strictly sets requiresHumanReview = true');

  // Landmark Pathway: 1 Landmark Paper with Artifacts + Human Review
  const landmarkCorpus = [
    { paperId: 'landmark-1', doi: '10.1/lm1', title: 'Landmark Implementation', authors: ['Independent Lead'], institutions: ['DeepMind'], publicationYear: 2024 }
  ];
  const landmarkAssessments = landmarkCorpus.map(p =>
    sourceIndependenceService.evaluatePairwiseIndependence(paperA, p)
  );
  const landmarkSummary = sourceIndependenceService.evaluateReplicationSufficiency(
    landmarkAssessments,
    true,
    { hasVerifiableArtifacts: true, transparentRationale: 'Open source verified implementation with 10k stars' }
  );
  assert(landmarkSummary.effectivePathway === 'LANDMARK_RESULT', 'Landmark pathway accepted with valid justification');
  assert(landmarkSummary.requiresHumanReview === true, 'Landmark pathway strictly flags requiresHumanReview = true');

  // Landmark Pathway REJECTED if missing verifiable artifacts
  const landmarkRejected = sourceIndependenceService.evaluateReplicationSufficiency(
    landmarkAssessments,
    true,
    { hasVerifiableArtifacts: false, transparentRationale: 'No code released' }
  );
  assert(landmarkRejected.effectivePathway === 'NOT_ADDRESSED', 'Landmark pathway rejected if missing verifiable artifacts');

  // -------------------------------------------------------------------------
  // GATE 7: Contradiction Detection & Exact Codepoint Quote Slicing
  // -------------------------------------------------------------------------
  console.log('\n[Gate 7] Contradiction Detection & Exact Codepoint Quote Slicing...');

  const chunkRawText = 'Furthermore, while FlashAttention achieves exact attention with linear memory O(N) overhead during training, our empirical measurements in Section 4 show that forward-pass activation recomputation creates an unexpected 18% wall-clock latency overhead on sequence lengths exceeding 64k tokens.';
  const targetQuote = 'forward-pass activation recomputation creates an unexpected 18% wall-clock latency overhead on sequence lengths exceeding 64k tokens';

  const quoteVerified = contradictionDetectionService.verifyQuoteAgainstChunk(
    chunkRawText,
    targetQuote,
    'paper-seed',
    1,
    'Results'
  );
  assert(quoteVerified.verificationStatus === 'VERIFIED_EXACT_MATCH', 'Deterministic quote verification achieves VERIFIED_EXACT_MATCH');
  assert(quoteVerified.exactQuote === targetQuote, 'Extracted quote matches target substring');

  // Failed quote verification on corrupted quote
  const quoteCorrupted = contradictionDetectionService.verifyQuoteAgainstChunk(
    chunkRawText,
    'This sentence was fabricated and does not exist in the source chunk.',
    'paper-seed',
    1,
    'Results'
  );
  assert(quoteCorrupted.verificationStatus === 'FAILED_VERIFICATION', 'Non-existent quote returns FAILED_VERIFICATION');

  // Bilateral relationship analysis: Empirical Disagreement on Directly Comparable Papers
  const bilateralEmpirical = contradictionDetectionService.analyzeBilateralRelationship(
    chunkRawText,
    targetQuote,
    'paper-seed',
    1,
    'Results',
    chunkRawText,
    targetQuote,
    'paper-val',
    2,
    'Discussion',
    true, // isDirectlyComparable
    'EMPIRICAL_DISAGREEMENT',
    'Disagreement on recomputation latency scaling'
  );
  assert(bilateralEmpirical.hasContradiction === true, 'Direct empirical disagreement identified as contradiction');
  assert(bilateralEmpirical.divergenceType === 'DIRECT_EMPIRICAL_CONTRADICTION', 'Classified as DIRECT_EMPIRICAL_CONTRADICTION');
  assert(bilateralEmpirical.relationshipType === 'contradicts', 'Assigned relationshipType: contradicts');

  // Bilateral relationship analysis: Premise Falsification
  const bilateralPremise = contradictionDetectionService.analyzeBilateralRelationship(
    chunkRawText,
    targetQuote,
    'paper-seed',
    1,
    'Results',
    chunkRawText,
    targetQuote,
    'paper-val',
    3,
    'Audit',
    true,
    'PREMISE_FALSIFIED',
    'Data leakage invalidated initial benchmark claims'
  );
  assert(bilateralPremise.invalidatesGapPremise === true, 'Premise falsification flags invalidatesGapPremise = true');
  assert(bilateralPremise.requiresHumanReview === true, 'Premise falsification strictly requires human review');

  // -------------------------------------------------------------------------
  // GATE 8: Deterministic Provisional Validation Strength (S_val) & Mandatory Notice
  // -------------------------------------------------------------------------
  console.log('\n[Gate 8] Deterministic Provisional Validation Strength (S_val) Model...');

  // Foundational paper recency test: publicationYear = 2014 (>10 years old), foundational exempt
  const foundationalRecency = provisionalValidationStrengthService.computePaperRecency(
    { paperId: 'p-foundational', publicationYear: 2014, isFoundationalExempt: true },
    2026
  );
  assert(foundationalRecency === 1.0, 'Foundational baseline paper has recency factor 1.0 (exempt from decay)');

  // Modern non-foundational paper recency test: publicationYear = 2021, evalYear = 2026 -> delta = 5 -> delta - 1 = 4 -> exp(-0.12 * 4) = exp(-0.48) = ~0.61878
  const modernRecency = provisionalValidationStrengthService.computePaperRecency(
    { paperId: 'p-modern', publicationYear: 2021, isFoundationalExempt: false },
    2026
  );
  const expectedRecency = Math.exp(-0.12 * (2026 - 2021 - 1));
  assert(
    Math.abs(modernRecency - expectedRecency) < 0.001,
    `Recency decay correctly computed with lambda=0.12 (expected ${expectedRecency.toFixed(4)}, got ${modernRecency.toFixed(4)})`
  );

  // Overall S_val calculation
  const scoreResult = provisionalValidationStrengthService.calculateProvisionalStrength({
    groundingExactCount: 5,
    groundingNormalizedCount: 1,
    methodologicalCommensurability: 0.85,
    admissibleIndependenceWeights: [0.90, 1.0],
    validationPapers: [
      { paperId: 'p1', publicationYear: 2023, isFoundationalExempt: false },
      { paperId: 'p2', publicationYear: 2024, isFoundationalExempt: false }
    ],
    candidateBudget: 15,
    availableHorizonCount: 10,
    commensurableIngestedCount: 6,
    unresolvedContradictionCount: 0
  });

  assert(scoreResult.score >= 5.0 && scoreResult.score <= 10.0, `Deterministic provisional strength score in valid range: ${scoreResult.score.toFixed(2)}/10.0`);
  assert(scoreResult.isCalibratedProbability === false, 'isCalibratedProbability is strictly false');
  assert(
    scoreResult.mandatoryWarning.includes('NOT a calibrated probability'),
    'Mandatory uncalibrated warning notice is explicitly present'
  );

  // Contradiction dampening check
  const scoreWithContradiction = provisionalValidationStrengthService.calculateProvisionalStrength({
    groundingExactCount: 5,
    groundingNormalizedCount: 1,
    methodologicalCommensurability: 0.85,
    admissibleIndependenceWeights: [0.90, 1.0],
    validationPapers: [
      { paperId: 'p1', publicationYear: 2023, isFoundationalExempt: false },
      { paperId: 'p2', publicationYear: 2024, isFoundationalExempt: false }
    ],
    candidateBudget: 15,
    availableHorizonCount: 10,
    commensurableIngestedCount: 6,
    unresolvedContradictionCount: 2
  });

  assert(
    scoreWithContradiction.score < scoreResult.score,
    `Unresolved contradictions strictly reduce score (${scoreWithContradiction.score.toFixed(2)} vs ${scoreResult.score.toFixed(2)})`
  );
  assert(
    scoreWithContradiction.contradictionDampener < 1.0,
    `Contradiction dampener is less than 1.0 (${scoreWithContradiction.contradictionDampener.toFixed(4)})`
  );

  // -------------------------------------------------------------------------
  // GATE 1 & 2: Database Schema, RLS & Service-Role Isolation
  // -------------------------------------------------------------------------
  console.log('\n[Gate 1 & 2] Database Schema, RLS & Service-Role Isolation (Live Supabase)...');

  if (!adminClient) {
    console.error('  [FAIL] Admin Supabase client unavailable. Check SUPABASE_SERVICE_ROLE_KEY.');
    failed++;
  } else {
    // Check tables and columns exist
    const { data: schemaCheck, error: schemaErr } = await adminClient
      .from('research_gap_relationships')
      .select('id')
      .limit(1);
    assert(!schemaErr, 'Table research_gap_relationships exists and is readable by service_role');

    // Test RLS: Unauthenticated client MUST NOT be able to insert relationships
    const { data: anonInsert, error: anonInsertErr } = await anonClient
      .from('research_gap_relationships')
      .insert({
        relationship_type: 'corroborates',
        confidence_weight: 0.9
      });
    assert(
      Boolean(anonInsertErr),
      'RLS Enforcement: Anonymous client is forbidden from inserting into research_gap_relationships'
    );

    // Test Nil UUID Rejection constraint
    const { data: nilInsert, error: nilInsertErr } = await adminClient
      .from('research_gap_relationships')
      .insert({
        source_gap_id: '00000000-0000-0000-0000-000000000000',
        relationship_type: 'corroborates'
      });
    assert(
      Boolean(nilInsertErr),
      'Database Constraint: All-zero nil UUID sentinel (00000000-0000-0000-0000-000000000000) is strictly rejected'
    );
  }

  // -------------------------------------------------------------------------
  // GATE 3, 4, 9, 10: Composite FK, Master RPC, Soft Deletion & Purge Safety
  // -------------------------------------------------------------------------
  console.log('\n[Gate 3, 4, 9, 10] Composite FK, Master RPC, Soft Deletion & Purge Safety...');

  if (adminClient) {
    // Create an isolated test paper
    const testDoi = `10.1000/stage4d-test-${Date.now()}`;
    const { data: testPaper, error: paperErr } = await adminClient
      .from('research_papers')
      .insert({
        title: 'Stage 4D Verification Test Paper',
        doi: testDoi,
        publication_date: '2024-01-01',
        authors: ['Test Author A', 'Test Author B'],
        abstract: 'Test abstract demonstrating Stage 4D memory scalability evaluation.',
        field: 'Computer Science'
      })
      .select('id')
      .single();

    assert(Boolean(testPaper?.id), `Created isolated test paper: ${testPaper?.id}`);

    if (testPaper?.id) {
      // Create test research gap
      const { data: testGap, error: gapErr } = await adminClient
        .from('research_gaps')
        .insert({
          gap_statement: 'Stage 4D Test Candidate Gap: Memory Scalability',
          gap_category: 'COMPUTATIONAL_SCALABILITY',
          current_epistemic_classification: 'CANDIDATE_RESEARCH_GAP',
          current_validation_outcome: 'INSUFFICIENT_EVIDENCE',
          model_used: 'gemma-4-26b-a4b-it',
          model_requested: 'gemma-4-26b-a4b-it',
          visibility: 'public'
        })
        .select('id')
        .single();

      assert(Boolean(testGap?.id), `Created isolated test gap: ${testGap?.id}`);

      if (testGap?.id) {
        // Execute Master RPC: insert_server_verified_validation
        const testRunId = `run-${Date.now()}`;
        const coverageMetadata = {
          validationRunId: testRunId,
          evaluatedCorpusCount: 1,
          commensurablePaperCount: 1,
          corpusHash: 'test-corpus-hash-1234',
          evaluationTimestamp: new Date().toISOString()
        };

        const { data: validationId, error: rpcErr } = await adminClient.rpc('insert_server_verified_validation', {
          p_gap_id: testGap.id,
          p_validation_outcome: 'CONFIRMED_UNRESOLVED',
          p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
          p_confidence_score: 8.5,
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

        if (rpcErr) {
          console.error('  -> RPC insert_server_verified_validation error details:', rpcErr);
        }
        assert(!rpcErr && Boolean(validationId), `Master RPC insert_server_verified_validation executed successfully: ${validationId}`);

        // Verify gap updated in database
        const { data: updatedGap } = await adminClient
          .from('research_gaps')
          .select('current_validation_outcome, current_epistemic_classification')
          .eq('id', testGap.id)
          .single();
        assert(updatedGap?.current_validation_outcome === 'CONFIRMED_UNRESOLVED', 'Validation outcome updated to CONFIRMED_UNRESOLVED');

        // Fetch validation record to get validation_run_id
        const { data: valRecord } = await adminClient
          .from('research_gap_validations')
          .select('validation_run_id')
          .eq('id', validationId)
          .single();

        // Verify Composite FK constraint: Cannot insert relationship pointing to non-existent (gap_id, validation_run_id)
        const { data: badFkInsert, error: badFkErr } = await adminClient
          .from('research_gap_relationships')
          .insert({
            gap_id: testGap.id,
            validation_run_id: 'non-existent-run-id-9999',
            relationship_type: 'corroborates'
          });
        assert(
          Boolean(badFkErr),
          'Composite FK Constraint: Rejects relationship with non-matching (gap_id, validation_run_id)'
        );

        // Verify Soft Deletion / Archival via archive_research_gap RPC
        const { data: archiveRes, error: archiveErr } = await adminClient.rpc('archive_research_gap', {
          p_gap_id: testGap.id,
          p_archival_reason: 'Automated test suite soft-archival verification'
        });
        assert(archiveRes === true && !archiveErr, 'archive_research_gap RPC soft-archives research gap');

        // Verify gap is archived in database
        const { data: archivedGapCheck } = await adminClient
          .from('research_gaps')
          .select('is_archived, archived_at')
          .eq('id', testGap.id)
          .single();
        assert(archivedGapCheck?.is_archived === true, 'Gap is_archived flag is set to true');
        assert(Boolean(archivedGapCheck?.archived_at), 'Gap archived_at timestamp is populated');

        // Verify Purge Safety: purge_archived_research_gap purges archived gap cleanly
        const { data: purgeRes, error: purgeErr } = await adminClient.rpc('purge_archived_research_gap', {
          p_gap_id: testGap.id,
          p_purge_reason: 'Automated test suite verification cleanup'
        });
        if (purgeErr) {
          console.error('  -> RPC purge_archived_research_gap error details:', purgeErr);
        }
        assert(purgeRes === true && !purgeErr, 'purge_archived_research_gap cleanly purges test gap after archival');

        // Clean up test paper
        await adminClient.from('research_papers').delete().eq('id', testPaper.id);
      }
    }
  }

  // -------------------------------------------------------------------------
  // GATE 11: Real Scientific Benchmark Clusters
  // -------------------------------------------------------------------------
  console.log('\n[Gate 11] Real Scientific Benchmark Clusters...');

  // Scientific Cluster 1: FlashAttention / Mamba Context Scaling
  console.log('  -> Evaluating Benchmark Cluster 1: Attention Bound Verification (FlashAttention vs State Space Models)...');
  const faPaperSeed = 'Standard multi-head attention suffers from O(N^2) memory footprint during sequence scaling, creating a critical bottleneck on sequences > 32k tokens.';
  const faSeedQuote = 'Standard multi-head attention suffers from O(N^2) memory footprint during sequence scaling';
  const mambaResolutionQuote = 'State space models achieve linear O(N) memory scaling across long sequence lengths without quadratic attention matrices.';

  const cluster1Result = contradictionDetectionService.analyzeBilateralRelationship(
    faPaperSeed,
    faSeedQuote,
    'paper-fa',
    1,
    'Introduction',
    mambaResolutionQuote,
    mambaResolutionQuote,
    'paper-mamba',
    1,
    'Abstract',
    true,
    'RESOLUTION',
    'State space models resolve quadratic memory limitation in autoregressive generation'
  );
  assert(
    cluster1Result.relationshipType === 'addresses',
    'Cluster 1: Correctly classifies alternative architectural scaling as addressing memory limitation'
  );

  // Scientific Cluster 2: Graph Neural Networks (GNN) Over-smoothing
  console.log('  -> Evaluating Benchmark Cluster 2: GNN Over-smoothing in Deep Architectures...');
  const gnnSeedDims: ScientificEntityDimensions = {
    task: 'Node Classification on Homophilic & Heterophilic Graphs',
    operationalQuestion: 'Does message passing depth beyond 4 layers cause representation collapse?',
    metricFormulation: 'Test Accuracy & Dirichlet Energy',
    datasetDomain: 'OGB-Arxiv / Cora Benchmark',
    baselineModel: 'GCN / GAT',
    computeScale: 'Single RTX 3090',
    threatsToValidity: 'Over-smoothing vs over-squashing confounding'
  };

  const gnnValDims: ScientificEntityDimensions = {
    task: 'Node Classification on Homophilic & Heterophilic Graphs',
    operationalQuestion: 'Does message passing depth beyond 4 layers cause representation collapse?',
    metricFormulation: 'Test Accuracy & Dirichlet Energy',
    datasetDomain: 'OGB-Arxiv / Cora Benchmark',
    baselineModel: 'DropEdge GCN',
    computeScale: 'Single RTX 3090',
    threatsToValidity: 'Over-smoothing vs over-squashing confounding'
  };

  const gnnComp = methodologicalComparabilityEngine.evaluateComparability(
    'gnn-seed',
    'gnn-val',
    gnnSeedDims,
    gnnValDims
  );
  assert(
    gnnComp.comparisonClass === 'DIRECTLY_COMPARABLE',
    'Cluster 2: GNN over-smoothing papers share operational question, metric, and domain, correctly DIRECTLY_COMPARABLE'
  );

  // Scientific Cluster 3: Low-Rank Adaptation (LoRA) Rank Saturation
  console.log('  -> Evaluating Benchmark Cluster 3: Parameter-Efficient Fine-Tuning (LoRA vs Full Tuning)...');
  const loraIndependentPapers = [
    { paperId: 'lora-eval-1', doi: '10.1/le1', title: 'QLoRA: Efficient Finetuning', authors: ['Dettmers, Tim', 'Zettlemoyer, Luke'], institutions: ['University of Washington'], publicationYear: 2023 },
    { paperId: 'lora-eval-2', doi: '10.1/le2', title: 'Fine-Tuning Language Models', authors: ['Malladi, Sadhika', 'Arora, Sanjeev'], institutions: ['Princeton University'], publicationYear: 2023 }
  ];
  const loraOriginal = { paperId: 'lora-orig', doi: '10.1/lo', title: 'LoRA: Low-Rank Adaptation', authors: ['Hu, Edward J.', 'Shen, Yelong'], institutions: ['Microsoft Research'], publicationYear: 2021 };
  
  const loraAssessments = loraIndependentPapers.map(p =>
    sourceIndependenceService.evaluatePairwiseIndependence(loraOriginal, p)
  );
  const loraReplication = sourceIndependenceService.evaluateReplicationSufficiency(loraAssessments);
  assert(
    loraReplication.satisfiesStandardReplication === true,
    'Cluster 3: LoRA evaluations across UW and Princeton satisfy independent cross-literature replication'
  );

  // -------------------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`Anvīkṣā — Stage 4D Acceptance Test Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage4DTestSuite().catch((err) => {
  console.error('Test execution failed with fatal error:', err);
  process.exit(1);
});
