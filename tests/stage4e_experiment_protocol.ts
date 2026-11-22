/**
 * Anvīkṣā — Stage 4E Work Package 4E-IMP-03 Verification & Acceptance Test Suite
 * Experiment Protocol Synthesizer Acceptance Suite
 * 
 * Verifies all 10 Acceptance Gates:
 * Gate 1:  Live Relational Schema & Integrity Constraints
 * Gate 2:  Coverage across All 11 Experimental Paradigms
 * Gate 3:  Zero-Fabricated-Baselines (BAR = 100%) & Non-Invented-Thresholds
 * Gate 4:  Analytical Statistical Power & Sample Size Planning
 * Gate 5:  Four-Quadrant Threats-to-Validity Framework
 * Gate 6:  Version Immutability & Monotonic Revision History
 * Gate 7:  Database Row-Level Security (RLS) & Privileged RPC ACL Security
 * Gate 8:  Authentication & Authorization Controls for Revisions
 * Gate 9:  Staleness & Invalidation Cascades
 * Gate 10: Standalone Read-Only Protocol Validation Endpoint
 */

process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../src/lib/supabase.js';
import {
  experimentProtocolService,
  ExperimentalDesignType,
  calculatePowerAndSampleSize,
  evaluateStatisticalFalsification
} from '../server/experimentProtocolService.js';
import { hypothesisSynthesisService } from '../server/hypothesisSynthesisService.js';
import { opportunityIntelligenceService } from '../server/opportunityIntelligenceService.js';
import { app } from '../server.js';

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

async function runStage4E3TestSuite() {
  console.log('========================================================================');
  console.log('Anvīkṣā — Stage 4E-IMP-03 Experiment Protocol Synthesizer Test Suite');
  console.log('Target: Frozen Stage 4E Architecture + Final Scientific Integrity Amendment');
  console.log('========================================================================\n');

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    throw new Error('Supabase admin client unavailable.');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const anonClient = createClient(supabaseUrl, anonKey);

  // Setup test papers, gaps, validations, opportunities, and hypotheses
  const testDoi = `10.1000/anviksa-exp-test-${Date.now()}`;
  const { data: testPaper } = await adminClient
    .from('research_papers')
    .insert({
      title: 'Selective State Spaces with Dynamic Routing Bounds',
      doi: testDoi,
      publication_date: '2024-06-01',
      authors: ['Dao, T.', 'Gu, A.', 'Ruder, S.'],
      abstract: 'Investigating architectural limits of associative retrieval and state-space throughput.',
      field: 'Computer Science'
    })
    .select('id')
    .single();

  if (!testPaper) throw new Error('Failed to create testPaper');

  const { data: testGap, error: gapErr } = await adminClient
    .from('research_gaps')
    .insert({
      gap_statement: 'Dynamic recurrent routing degrades throughput by >= 35% on multi-query associative recall.',
      gap_category: 'COMPUTATIONAL_SCALABILITY',
      current_epistemic_classification: 'CANDIDATE_RESEARCH_GAP',
      current_validation_outcome: 'CONFIRMED_UNRESOLVED',
      model_used: 'gemma-4-26b-a4b-it',
      model_requested: 'gemma-4-26b-a4b-it',
      visibility: 'public',
      is_published: true
    })
    .select('id')
    .single();

  if (gapErr || !testGap) {
    console.error('Gap creation error:', gapErr);
    throw new Error('Failed to create testGap');
  }

  const valRunId = `val-exp-${Date.now()}`;
  const { data: valId, error: valErr } = await adminClient.rpc('insert_server_verified_validation', {
    p_gap_id: testGap.id,
    p_validation_outcome: 'CONFIRMED_UNRESOLVED',
    p_new_epistemic_classification: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
    p_confidence_score: 9.1,
    p_reasoning_summary: 'Verified unresolved across benchmark trials.',
    p_model_attribution: 'gemma-4-26b-a4b-it',
    p_search_methodology_version: '4.1.0-multi-vector-discovery',
    p_literature_coverage_timestamp: new Date().toISOString(),
    p_supporting_evidence_references: [],
    p_contradictory_evidence_references: [],
    p_previously_addressed_research_references: [],
    p_literature_coverage_metadata: { validationRunId: valRunId },
    p_gap_relationships: [],
    p_new_evidence_items: []
  });

  if (valErr || !valId) throw new Error(`Failed to create validation: ${valErr?.message}`);

  const { data: valRecord } = await adminClient
    .from('research_gap_validations')
    .select('validation_run_id')
    .eq('id', valId)
    .single();

  if (!valRecord) throw new Error('Failed to fetch valRecord');
  const actualValidationRunId = valRecord.validation_run_id;

  const { data: eligibleOppId, error: oppErr } = await adminClient.rpc('rpc_persist_research_opportunity', {
    p_gap_id: testGap.id,
    p_validation_run_id: actualValidationRunId,
    p_status: 'ELIGIBLE',
    p_intrinsic_value: 8.95,
    p_confidence: 9.1,
    p_novelty: 8.8,
    p_significance: 9.2,
    p_tractability: 8.7,
    p_contradiction_status: 'NO_CONTRADICTIONS_DETECTED',
    p_density_status: 'ACTIVE_COMPETITIVE',
    p_residual_scope: { unresolved_scope: 'Dynamic recurrent routing beyond 16k context' }
  });

  if (oppErr || !eligibleOppId) {
    console.error('Opp creation error:', oppErr);
    throw new Error('Failed to create testOpp');
  }

  const { data: testOpp } = await adminClient
    .from('research_opportunities')
    .select('*')
    .eq('id', eligibleOppId)
    .single();

  if (!testOpp) throw new Error('Failed to fetch testOpp');

  const [hypA] = await hypothesisSynthesisService.generateCandidateHypotheses({
    opportunityId: testOpp.id,
    preferredParadigm: 'COMPARATIVE_BENCHMARK',
    candidateCount: 1
  });

  if (!hypA) throw new Error('Failed to create test hypothesis');

  // -------------------------------------------------------------------------
  // GATE 1: Live Relational Schema & Integrity Constraints
  // -------------------------------------------------------------------------
  console.log('\n[Gate 1] Live Relational Schema & Integrity Constraints...');

  const { data: expTable } = await adminClient
    .from('research_experiments')
    .select('id')
    .limit(1);
  assert(Array.isArray(expTable), 'public.research_experiments table exists and is queryable');

  const { data: metricsTable } = await adminClient
    .from('research_experiment_metrics')
    .select('id')
    .limit(1);
  assert(Array.isArray(metricsTable), 'public.research_experiment_metrics table exists and is queryable');

  const { data: versionsTable } = await adminClient
    .from('research_experiment_versions')
    .select('id')
    .limit(1);
  assert(Array.isArray(versionsTable), 'public.research_experiment_versions table exists and is queryable');

  // Nil UUID Sentinel Rejection Check
  let nilRejected = false;
  const { error: nilErr } = await adminClient.from('research_experiments').insert({
    hypothesis_id: '00000000-0000-0000-0000-000000000000',
    opportunity_id: testOpp.id,
    gap_id: testGap.id,
    validation_run_id: actualValidationRunId,
    title: 'Invalid Nil Sentinel Test',
    objective: 'Must fail',
    experimental_design_type: 'PAIRED_COMPARATIVE_BENCHMARK'
  });
  if (nilErr) nilRejected = true;
  assert(nilRejected, 'Constraint prohibits nil UUID sentinels in research_experiments');

  // -------------------------------------------------------------------------
  // GATE 2: Coverage across All 11 Experimental Paradigms
  // -------------------------------------------------------------------------
  console.log('\n[Gate 2] Coverage across All 11 Experimental Paradigms...');

  const all11Paradigms: ExperimentalDesignType[] = [
    'RANDOMIZED_CONTROLLED_TRIAL',
    'PAIRED_COMPARATIVE_BENCHMARK',
    'SYSTEMATIC_COMPONENT_ABLATION',
    'SCALING_AND_COMPLEXITY_ANALYSIS',
    'STOCHASTIC_SIMULATION',
    'FORMAL_PROOF_AND_COUNTER_EXAMPLE',
    'DATASET_BIAS_AND_DISTRIBUTION_AUDIT',
    'ADVERSARIAL_ROBUSTNESS_STRESS_TEST',
    'EMPIRICAL_REPLICATION_STUDY',
    'QUALITATIVE_SYSTEMS_ARCHITECTURE',
    'PARAMETER_EFFICIENCY_ADAPTATION'
  ];

  const generatedProtocols: Record<ExperimentalDesignType, any> = {} as any;

  for (const paradigm of all11Paradigms) {
    const proto = await experimentProtocolService.generateExperimentProtocol({
      hypothesisId: hypA.hypothesis_id,
      preferredDesignType: paradigm
    });

    assert(
      proto.experimental_design_type === paradigm,
      `Paradigm Synthesized: ${paradigm} successfully matches requested design type`
    );

    assert(
      proto.execution_environment && typeof proto.execution_environment.estimated_wall_clock_hours === 'number',
      `Paradigm ${paradigm} specifies hardware execution environment and wall-clock estimation`
    );

    assert(
      proto.execution_environment?.hardware_availability_status === 'REQUIRED_SPECIFICATION_ONLY',
      `Paradigm ${paradigm} classifies hardware as REQUIRED_SPECIFICATION_ONLY (not lab verified)`
    );

    assert(
      proto.execution_environment?.runtime_estimation_status === 'PREDICTED_ESTIMATE_ONLY',
      `Paradigm ${paradigm} classifies runtime as PREDICTED_ESTIMATE_ONLY`
    );

    assert(
      proto.metrics && proto.metrics.length > 0,
      `Paradigm ${paradigm} specifies operationalized evaluation metrics`
    );

    for (const m of proto.metrics) {
      assert(
        Boolean(m.threshold_provenance_type && m.provenance_justification),
        `Paradigm ${paradigm} metric "${m.metric_name}" has explicit threshold provenance: ${m.threshold_provenance_type}`
      );
    }

    assert(
      proto.reproducibility_package && proto.reproducibility_package.dockerfile_spec.includes('ENTRYPOINT'),
      `Paradigm ${paradigm} includes reproducible Docker specification and seed schedules`
    );

    generatedProtocols[paradigm] = proto;
  }

  assert(
    Object.keys(generatedProtocols).length === 11,
    'All 11 accepted experimental paradigms successfully synthesized and persisted'
  );

  // -------------------------------------------------------------------------
  // GATE 3: Zero-Fabricated-Baselines (BAR = 100%) & Non-Invented-Thresholds
  // -------------------------------------------------------------------------
  console.log('\n[Gate 3] Zero-Fabricated-Baselines (BAR = 100%) & Non-Invented-Thresholds...');

  const protoBenchmark = generatedProtocols['PAIRED_COMPARATIVE_BENCHMARK'];
  assert(
    protoBenchmark.verified_baselines && protoBenchmark.verified_baselines.length > 0,
    'Protocols maintain structured verified literature baselines'
  );

  const baseline = protoBenchmark.verified_baselines[0];
  assert(
    baseline.citation_title && (baseline.doi || baseline.source_paper_id !== undefined),
    'Baseline links to authentic published citation or DOI'
  );

  if (!baseline.is_reported_in_paper) {
    assert(
      baseline.reported_metric_value.includes('UNREPORTED_IN_ORIGINAL_PUBLICATION'),
      'Zero-Fabricated-Baselines: Unreported metrics are explicitly marked as requiring empirical measurement'
    );
  }

  // Non-Invented-Thresholds check
  const allMetrics = protoBenchmark.metrics;
  const primaryMetric = allMetrics.find((m: any) => m.metric_type === 'PRIMARY');
  assert(
    Boolean(primaryMetric && primaryMetric.falsification_threshold && primaryMetric.falsification_threshold.length > 5),
    'Non-Invented-Thresholds: Metric defines non-empty quantitative falsification threshold'
  );

  assert(
    primaryMetric?.threshold_provenance_type === 'REQUIRES_RESEARCHER_SPECIFICATION' && primaryMetric?.is_uncalibrated === true,
    'Non-Invented-Thresholds: Benchmark primary metric without literature grounding is explicitly flagged REQUIRES_RESEARCHER_SPECIFICATION'
  );

  // -------------------------------------------------------------------------
  // GATE 4: Analytical Statistical Power & Sample Size Planning
  // -------------------------------------------------------------------------
  console.log('\n[Gate 4] Analytical Statistical Power & Sample Size Planning...');

  // Two-sample independent design reference verification (Audit E)
  const powerSingle = calculatePowerAndSampleSize(0.05, 0.80, 0.50, 1, 'TWO_SAMPLE_INDEPENDENT');
  assert(
    powerSingle.recommended_sample_size_per_group === 63 && powerSingle.total_sample_size === 126,
    `Analytical Power: Standard medium effect (d=0.50, alpha=0.05, 1-beta=0.80) yields exactly N=63 per arm, Total N=126 (observed ${powerSingle.recommended_sample_size_per_group}, total N=${powerSingle.total_sample_size})`
  );
  assert(
    powerSingle.model_assumptions.includes('Two independent cohorts'),
    'Analytical Power: Documents model assumptions for independent two-sample design'
  );

  // Bonferroni adjustment for m=4 endpoints
  const powerMultiple = calculatePowerAndSampleSize(0.05, 0.80, 0.50, 4, 'TWO_SAMPLE_INDEPENDENT');
  assert(
    powerMultiple.multiple_comparison_correction === 'BONFERRONI' &&
    powerMultiple.adjusted_alpha === 0.0125 &&
    powerMultiple.recommended_sample_size_per_group === 90 &&
    powerMultiple.total_sample_size === 180,
    `Bonferroni Correction: Multiple comparisons (m=4) adjust alpha to 0.0125 and yields exactly N=90 per arm, Total N=180 (observed ${powerMultiple.recommended_sample_size_per_group}, total ${powerMultiple.total_sample_size})`
  );

  // Paired difference design
  const powerPaired = calculatePowerAndSampleSize(0.05, 0.80, 0.50, 1, 'PAIRED_OR_SINGLE_SAMPLE');
  assert(
    powerPaired.recommended_sample_size_per_group === 32 && powerPaired.total_sample_size === 32,
    `Paired Design Power: Matched paired design yields N=32 pairs (observed ${powerPaired.recommended_sample_size_per_group})`
  );

  // -------------------------------------------------------------------------
  // GATE 4B: Audit B Statistical Decision Logic (Preventing Affirming the Null Fallacy)
  // -------------------------------------------------------------------------
  console.log('\n[Gate 4B] Statistical Decision Logic & Affirming the Null Prevention...');

  // Test Case A: Statistically significant effect in hypothesized direction -> SUPPORTED
  const resSupported = evaluateStatisticalFalsification({
    pValue: 0.008,
    observedEffect: 0.55,
    ciLower: 0.20,
    ciUpper: 0.90,
    minimumMeaningfulEffect: 0.50
  });
  assert(resSupported.decision === 'SUPPORTED', 'Decision Logic A: p < 0.05, d=0.55 > 0, CI excluding 0 -> SUPPORTED');

  // Test Case B: Statistically significant contrary effect -> FALSIFIED
  const resContrary = evaluateStatisticalFalsification({
    pValue: 0.015,
    observedEffect: -0.40,
    ciLower: -0.75,
    ciUpper: -0.05,
    minimumMeaningfulEffect: 0.50
  });
  assert(resContrary.decision === 'FALSIFIED', 'Decision Logic B: p < 0.05, contrary effect d=-0.40, CI strictly negative -> FALSIFIED');

  // Test Case C: High variance / underpowered result (p >= 0.05, but CI still overlaps Delta_min) -> INCONCLUSIVE
  // CRITICAL: Must NOT be classified as FALSIFIED (fallacy of affirming the null)
  const resInconclusive = evaluateStatisticalFalsification({
    pValue: 0.12,
    observedEffect: 0.35,
    ciLower: -0.08,
    ciUpper: 0.78,
    minimumMeaningfulEffect: 0.50
  });
  assert(
    resInconclusive.decision === 'INCONCLUSIVE',
    'Decision Logic C (Affirming Null Prevention): p=0.12 >= 0.05 with CI [-0.08, 0.78] overlapping Delta_min=0.50 is INCONCLUSIVE (NOT falsified!)'
  );
  assert(
    resInconclusive.fallacyAvoidanceNote.includes('affirming the null'),
    'Decision Logic C: Justification explicitly notes avoidance of the affirming-the-null fallacy'
  );

  // Test Case D: Equivalence testing (TOST) upper bound strictly below Delta_min -> PRACTICALLY_EQUIVALENT / FALSIFIED
  const resEquivalent = evaluateStatisticalFalsification({
    pValue: 0.04,
    observedEffect: 0.08,
    ciLower: 0.02,
    ciUpper: 0.14,
    minimumMeaningfulEffect: 0.50,
    tostEquivalenceBound: 0.20
  });
  assert(
    resEquivalent.decision === 'PRACTICALLY_EQUIVALENT',
    'Decision Logic D (TOST Equivalence): CI [0.02, 0.14] strictly bounded below Delta_min=0.50 and within [-0.20, +0.20] -> PRACTICALLY_EQUIVALENT'
  );

  // -------------------------------------------------------------------------
  // GATE 5: Four-Quadrant Threats-to-Validity Framework
  // -------------------------------------------------------------------------
  console.log('\n[Gate 5] Four-Quadrant Threats-to-Validity Framework...');

  const threats = protoBenchmark.threats_to_validity;
  assert(
    threats.internal_validity && threats.internal_validity.threats.length > 0 && threats.internal_validity.mitigations.length > 0,
    'Quadrant 1: Internal Validity specifies causal threats and thermal/seed mitigations'
  );

  assert(
    threats.external_validity && threats.external_validity.threats.length > 0 && threats.external_validity.mitigations.length > 0,
    'Quadrant 2: External Validity specifies distribution shift threats and multi-domain mitigations'
  );

  assert(
    threats.construct_validity && threats.construct_validity.threats.length > 0 && threats.construct_validity.mitigations.length > 0,
    'Quadrant 3: Construct Validity specifies proxy metric divergence threats and mitigations'
  );

  assert(
    threats.conclusion_validity && threats.conclusion_validity.threats.length > 0 && threats.conclusion_validity.mitigations.length > 0,
    'Quadrant 4: Conclusion Validity specifies statistical power threats and seed mitigations'
  );

  // -------------------------------------------------------------------------
  // GATE 6: Version Immutability & Monotonic Revision History
  // -------------------------------------------------------------------------
  console.log('\n[Gate 6] Version Immutability & Monotonic Revision History...');

  // 1. Fetch initial version 1
  const { data: ver1 } = await adminClient
    .from('research_experiment_versions')
    .select('*')
    .eq('experiment_id', protoBenchmark.id)
    .eq('version_number', 1)
    .single();

  assert(Boolean(ver1 && ver1.version_number === 1), 'Initial synthesized protocol has version 1 in audit log');

  // 2. Attempt direct UPDATE on research_experiment_versions (Must fail due to trigger)
  let updateBlocked = false;
  const { error: updErr } = await adminClient
    .from('research_experiment_versions')
    .update({ modification_rationale: 'Hacked rationale' })
    .eq('id', ver1.id);
  if (updErr) {
    updateBlocked = true;
  }
  assert(updateBlocked, 'Trigger trg_experiment_version_immutable strictly blocks direct UPDATE');

  // 3. Attempt direct DELETE on research_experiment_versions (Must fail due to trigger)
  let deleteBlocked = false;
  const { error: delErr } = await adminClient
    .from('research_experiment_versions')
    .delete()
    .eq('id', ver1.id);
  if (delErr) {
    deleteBlocked = true;
  }
  assert(deleteBlocked, 'Trigger trg_experiment_version_immutable strictly blocks direct DELETE');

  // -------------------------------------------------------------------------
  // GATE 7: Database Row-Level Security (RLS) & Privileged RPC ACL Security
  // -------------------------------------------------------------------------
  console.log('\n[Gate 7] Database Row-Level Security (RLS) & Privileged RPC ACL Security...');

  // Anonymous client cannot directly insert experiments
  let anonInsertBlocked = false;
  try {
    const { error: anonErr } = await anonClient
      .from('research_experiments')
      .insert({
        hypothesis_id: hypA.hypothesis_id,
        opportunity_id: testOpp.id,
        gap_id: testGap.id,
        validation_run_id: actualValidationRunId,
        title: 'Unauthorized Anon Experiment Insertion',
        objective: 'Must fail',
        experimental_design_type: 'PAIRED_COMPARATIVE_BENCHMARK'
      });
    if (anonErr) anonInsertBlocked = true;
  } catch (err) {
    anonInsertBlocked = true;
  }
  assert(anonInsertBlocked, 'RLS Policy blocks unprivileged direct INSERT on public.research_experiments');

  // Anonymous client cannot execute privileged RPC rpc_persist_research_experiment
  let rpcDenied = false;
  try {
    const { error: rpcErr } = await anonClient.rpc('rpc_persist_research_experiment', {
      p_hypothesis_id: hypA.hypothesis_id,
      p_opportunity_id: testOpp.id,
      p_gap_id: testGap.id,
      p_validation_run_id: actualValidationRunId,
      p_hypothesis_version: 1,
      p_title: 'Anon RPC Attempt',
      p_objective: 'Fail',
      p_experimental_design_type: 'PAIRED_COMPARATIVE_BENCHMARK'
    });
    if (rpcErr) rpcDenied = true;
  } catch (err) {
    rpcDenied = true;
  }
  assert(rpcDenied, 'ACL Lockdown: public/anon execution of rpc_persist_research_experiment is denied');

  // -------------------------------------------------------------------------
  // GATE 8: Authentication & Authorization Controls for Revisions
  // -------------------------------------------------------------------------
  console.log('\n[Gate 8] Authentication & Authorization Controls for Revisions...');

  // Setup test researchers in auth.users
  const userAId = '66d6ac55-9803-48fa-b35d-b05dd278c777';
  const userBId = '11111111-2222-3333-4444-555555555555';

  await adminClient.auth.admin.updateUserById(userAId, { password: 'TestPassword123!' });
  await adminClient.auth.admin.updateUserById(userBId, { password: 'TestPassword123!' });

  const { data: authA } = await anonClient.auth.signInWithPassword({
    email: 'jaswanth_kondameeda@srmap.edu.in',
    password: 'TestPassword123!'
  });
  const { data: authB } = await anonClient.auth.signInWithPassword({
    email: 'test_user_b@anviksa.internal',
    password: 'TestPassword123!'
  });

  const tokenA = authA?.session?.access_token || '';
  const tokenB = authB?.session?.access_token || '';
  if (!tokenA || !tokenB) throw new Error('Failed to acquire test JWT tokens.');

  // Bind initial gap ownership to userA
  await adminClient
    .from('research_gaps')
    .update({ created_by: userAId })
    .eq('id', testGap.id);

  // Start ephemeral HTTP test server
  const testServer = app.listen(0);
  const testPort = (testServer.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const reviseUrl = `${baseUrl}/api/research/experiments/${protoBenchmark.id}/revise`;

  // 1. Adversarial: No token, no userId -> 401
  const res1 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      revisionPayload: { title: 'Unauthenticated title' },
      modificationRationale: 'Testing no auth'
    })
  });
  assert(res1.status === 401, 'Revision Auth 1: No token, no userId -> 401 Unauthorized');

  // 2. Adversarial: No token, fabricated userId in body -> 401
  const res2 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userAId,
      revisionPayload: { title: 'Unauthenticated with fabricated userId' },
      modificationRationale: 'Testing fabricated userId bypass'
    })
  });
  assert(res2.status === 401, 'Revision Auth 2: No token, fabricated userId in body -> 401 Unauthorized');

  // 3. Adversarial: Invalid or fake token -> 401
  const res3 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fake.jwt.token' },
    body: JSON.stringify({
      revisionPayload: { title: 'Fake token title' },
      modificationRationale: 'Testing fake token'
    })
  });
  assert(res3.status === 401, 'Revision Auth 3: Invalid token -> 401 Unauthorized');

  // 4. Adversarial: Token userA with mismatched body userId (userB) -> 403 Impersonation Prohibited
  const res4 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      userId: userBId,
      revisionPayload: { title: 'Impersonated title' },
      modificationRationale: 'Testing user impersonation'
    })
  });
  assert(res4.status === 403, 'Revision Auth 4: Token userA with body userId userB -> 403 Impersonation Prohibited');

  // 5. Adversarial: Non-owner revises private gap protocol -> 403 Forbidden
  await adminClient
    .from('research_gaps')
    .update({ visibility: 'private', created_by: userAId })
    .eq('id', testGap.id);

  const res5 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      revisionPayload: { title: 'Tampering on private gap protocol' },
      modificationRationale: 'Testing private non-owner revision'
    })
  });
  assert(res5.status === 403, 'Revision Auth 5: Authenticated non-owner revises private protocol -> 403 Forbidden');

  // 6. Authorized researcher revises protocol -> 200 OK
  await adminClient
    .from('research_gaps')
    .update({ visibility: 'public', created_by: userAId })
    .eq('id', testGap.id);

  const res6 = await fetch(reviseUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      revisionPayload: {
        title: 'Calibrated Protocol: SRAM Tiled State Space Benchmarks',
        status: 'RESEARCHER_APPROVED'
      },
      modificationRationale: 'Researcher calibration of SRAM tiling bounds and power schedule'
    })
  });
  const data6 = await res6.json();
  assert(
    res6.status === 200 && data6.protocol?.current_version === 2 && data6.protocol?.status === 'RESEARCHER_APPROVED',
    'Revision Auth 6: Authorized researcher successfully revises protocol to version 2 (200 OK)'
  );

  testServer.close();

  // -------------------------------------------------------------------------
  // GATE 9: Staleness & Invalidation Cascades
  // -------------------------------------------------------------------------
  console.log('\n[Gate 9] Staleness & Invalidation Cascades...');

  // 1. Cascading from Hypothesis to Experiment
  await adminClient
    .from('research_hypotheses')
    .update({ is_stale: true })
    .eq('id', hypA.hypothesis_id);

  const { data: staleChildExp } = await adminClient
    .from('research_experiments')
    .select('is_stale, staleness_reason')
    .eq('hypothesis_id', hypA.hypothesis_id)
    .limit(1)
    .single();

  assert(
    Boolean(staleChildExp?.is_stale && staleChildExp?.staleness_reason === 'UPSTREAM_HYPOTHESIS_STALE'),
    'Staleness Cascade: Marking hypothesis stale automatically marks child experiment stale with UPSTREAM_HYPOTHESIS_STALE'
  );

  // 2. Deterministic Abstention on Stale Hypothesis
  let abstained = false;
  try {
    await experimentProtocolService.generateExperimentProtocol({
      hypothesisId: hypA.hypothesis_id
    });
  } catch (err: any) {
    if (err.message.includes('SYNTHESIS_ABSTAINED') || err.message.includes('stale')) {
      abstained = true;
    }
  }
  assert(abstained, 'Deterministic Abstention: Cannot generate experiment protocol from stale parent hypothesis');

  // -------------------------------------------------------------------------
  // GATE 10: Standalone Read-Only Protocol Validation Endpoint
  // -------------------------------------------------------------------------
  console.log('\n[Gate 10] Standalone Read-Only Protocol Validation Endpoint...');

  const validProtocolPayload = {
    verified_baselines: [
      { baseline_name: 'Baseline SOTA', citation_title: 'Paper Title 2024', doi: '10.1000/123' }
    ],
    metrics: [
      {
        metric_name: 'Throughput',
        metric_type: 'PRIMARY',
        operational_definition: 'Tokens per second',
        measurement_unit: 'tokens/s',
        falsification_threshold: 'Throughput < 1000 tokens/s'
      }
    ],
    threats_to_validity: {
      internal_validity: { threats: ['T1'], mitigations: ['M1'] },
      external_validity: { threats: ['T2'], mitigations: ['M2'] },
      construct_validity: { threats: ['T3'], mitigations: ['M3'] },
      conclusion_validity: { threats: ['T4'], mitigations: ['M4'] }
    },
    statistical_analysis_plan: {
      recommended_sample_size_per_group: 64,
      significance_level_alpha: 0.05,
      target_power_one_minus_beta: 0.80
    }
  };

  const validationResult = experimentProtocolService.validateProtocol(validProtocolPayload as any);
  assert(
    validationResult.valid === true && validationResult.barAuthenticityRate === 100 && validationResult.fourQuadrantsCovered === true,
    'Standalone Protocol Validation: Correctly certifies complete, high-integrity protocol payload'
  );

  const invalidProtocolPayload = {
    verified_baselines: [],
    metrics: [],
    threats_to_validity: {}
  };

  const invalidResult = experimentProtocolService.validateProtocol(invalidProtocolPayload as any);
  assert(
    invalidResult.valid === false && invalidResult.issues.length >= 3,
    'Standalone Protocol Validation: Correctly identifies missing baselines, missing metrics, and missing validity quadrants'
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`Stage 4E-IMP-03 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runStage4E3TestSuite().catch(err => {
  console.error('Fatal error during Stage 4E-IMP-03 test suite execution:', err);
  process.exit(1);
});
