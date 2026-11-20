/**
 * Anvīkṣā — Stage 4D.1 Adversarial Verification Test Suite
 * 
 * Verifies all 17 Required Adversarial Scenarios for Source Independence & Verification Integrity:
 * 1.  Exact institution-name matches
 * 2.  Verified aliases (UC Berkeley / UC Berkeley, MIT, Oxford)
 * 3.  Unverified abbreviations (guaranteed non-collision)
 * 4.  Institution punctuation, diacritics, and whitespace differences
 * 5.  Unrelated institutions with similar names (UW vs GWU vs WashU, UCB vs UCLA)
 * 6.  Multiple affiliations (papers with 2+ institutions)
 * 7.  Missing affiliations (safe fallback to INDEPENDENCE_UNKNOWN)
 * 8.  Conflicting institution metadata (name vs ROR ID conflict detection)
 * 9.  Shared affiliation with disjoint author groups (PARTIALLY_DEPENDENT)
 * 10. Different institution strings resolving to the same verified ROR ID
 * 11. Missing ROR identifiers falling back to alias registry
 * 12. Author-name collision protection (East Asian names: Wang, Wei vs Wang, Wen)
 * 13. Missing author metadata (safe fallback to INDEPENDENCE_UNKNOWN)
 * 14. Replication rule: Two partially dependent studies cannot satisfy standard replication
 * 15. Replication rule: Two genuinely independent groups satisfy standard replication
 * 16. Replication rule: Hybrid replication strictly requires human review
 * 17. Replication rule: Landmark evidence strictly requires verified artifacts & human review
 */

import {
  sourceIndependenceService,
  resolveInstitutionIdentity,
  normalizeAuthorName,
  calculateAuthorJaccard,
  INSTITUTION_ALIAS_REGISTRY_VERSION,
  PaperIndependenceMetadata,
  IndependenceAssessmentResult
} from '../server/sourceIndependenceService.js';

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

async function runStage4D1AdversarialSuite() {
  console.log('========================================================================');
  console.log('Anvīkṣā — Stage 4D.1 Adversarial Source Independence Verification Suite');
  console.log(`Alias Registry Version: ${INSTITUTION_ALIAS_REGISTRY_VERSION}`);
  console.log('========================================================================\n');

  // Baseline Seed Paper
  const baseSeed: PaperIndependenceMetadata = {
    paperId: 'seed-paper-alpha',
    doi: '10.1000/seed-alpha',
    title: 'Self-Attention Mechanisms in Transformer Networks',
    authors: ['Vaswani, Ashish', 'Parmar, Niki'],
    institutions: ['Google Research'],
    publicationYear: 2021
  };

  // -------------------------------------------------------------------------
  // Scenario 1: Exact institution-name matches
  // -------------------------------------------------------------------------
  console.log('[Scenario 1] Exact institution-name matches...');
  const candExactInst: PaperIndependenceMetadata = {
    paperId: 'cand-1',
    doi: '10.1000/c1',
    title: 'Scaling Laws for Neural Language Models',
    authors: ['Kaplan, Jared', 'McCandlish, Sam'],
    institutions: ['Google Research'],
    publicationYear: 2022
  };
  const res1 = sourceIndependenceService.evaluatePairwiseIndependence(baseSeed, candExactInst);
  assert(res1.state === 'PARTIALLY_DEPENDENT', 'Exact institution match with disjoint authors yields PARTIALLY_DEPENDENT');
  assert(res1.sharedInstitutions.length > 0, 'Shared institution detected in sharedInstitutions array');

  // -------------------------------------------------------------------------
  // Scenario 2: Verified aliases (UC Berkeley, MIT, Oxford)
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 2] Verified aliases in curated registry...');
  const seedBerkeley: PaperIndependenceMetadata = {
    paperId: 'seed-ucb',
    doi: '10.1000/ucb-1',
    title: 'RL with Contrastive Representations',
    authors: ['Laskin, Michael', 'Srinivas, Aravind'],
    institutions: ['UC Berkeley'],
    publicationYear: 2020
  };
  const candBerkeleyAlias: PaperIndependenceMetadata = {
    paperId: 'cand-ucb-2',
    doi: '10.1000/ucb-2',
    title: 'CURL: Contrastive Unsupervised Representations',
    authors: ['Lee, Kimin', 'Abbeel, Pieter'],
    institutions: ['University of California, Berkeley'],
    publicationYear: 2021
  };
  const res2Berkeley = sourceIndependenceService.evaluatePairwiseIndependence(seedBerkeley, candBerkeleyAlias);
  assert(res2Berkeley.state === 'PARTIALLY_DEPENDENT', 'Alias "UC Berkeley" matches "University of California, Berkeley" via registry');

  const seedMit: PaperIndependenceMetadata = {
    paperId: 'seed-mit',
    doi: '10.1000/mit-1',
    title: 'Synthetic Data Scaling',
    authors: ['Smith, John'],
    institutions: ['MIT'],
    publicationYear: 2022
  };
  const candMitAlias: PaperIndependenceMetadata = {
    paperId: 'cand-mit-2',
    doi: '10.1000/mit-2',
    title: 'Data Curation at Scale',
    authors: ['Johnson, Mary'],
    institutions: ['Massachusetts Institute of Technology'],
    publicationYear: 2023
  };
  const res2Mit = sourceIndependenceService.evaluatePairwiseIndependence(seedMit, candMitAlias);
  assert(res2Mit.state === 'PARTIALLY_DEPENDENT', 'Alias "MIT" matches "Massachusetts Institute of Technology"');

  const seedOxford: PaperIndependenceMetadata = {
    paperId: 'seed-oxf',
    doi: '10.1000/oxf-1',
    title: 'Bayesian Optimization',
    authors: ['Roberts, Stephen'],
    institutions: ['Oxford University'],
    publicationYear: 2021
  };
  const candOxfordAlias: PaperIndependenceMetadata = {
    paperId: 'cand-oxf-2',
    doi: '10.1000/oxf-2',
    title: 'Gaussian Process Regression',
    authors: ['Osborne, Michael'],
    institutions: ['University of Oxford'],
    publicationYear: 2022
  };
  const res2Oxford = sourceIndependenceService.evaluatePairwiseIndependence(seedOxford, candOxfordAlias);
  assert(res2Oxford.state === 'PARTIALLY_DEPENDENT', 'Alias "Oxford University" matches "University of Oxford"');

  // -------------------------------------------------------------------------
  // Scenario 3: Unverified abbreviations (no false collisions)
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 3] Unverified abbreviations do not falsely collide...');
  const stanfordPaper: PaperIndependenceMetadata = {
    paperId: 'seed-stanford',
    doi: '10.1000/stan-1',
    title: 'Foundation Models',
    authors: ['Bommasani, Rishi', 'Liang, Percy'],
    institutions: ['Stanford University'],
    publicationYear: 2021
  };
  const unverifiedAbbrPaper: PaperIndependenceMetadata = {
    paperId: 'cand-abbr',
    doi: '10.1000/abbr-1',
    title: 'State Estimation Algorithms',
    authors: ['Adams, Thomas', 'Baker, Charles'],
    institutions: ['SU'], // Unverified abbreviation, should not collide with Stanford University
    publicationYear: 2022
  };
  const res3 = sourceIndependenceService.evaluatePairwiseIndependence(stanfordPaper, unverifiedAbbrPaper);
  assert(res3.state === 'INDEPENDENT', 'Unverified abbreviation "SU" does not falsely collide with "Stanford University"');
  assert(res3.sharedInstitutions.length === 0, 'No shared institutions between Stanford University and ambiguous "SU"');

  // -------------------------------------------------------------------------
  // Scenario 4: Institution punctuation, diacritics, and whitespace
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 4] Punctuation, diacritics, and whitespace variations...');
  const ethClean: PaperIndependenceMetadata = {
    paperId: 'seed-eth',
    doi: '10.1000/eth-1',
    title: 'Robotic Locomotion',
    authors: ['Hutter, Marco'],
    institutions: ['ETH Zurich'],
    publicationYear: 2021
  };
  const ethDiacritic: PaperIndependenceMetadata = {
    paperId: 'cand-eth',
    doi: '10.1000/eth-2',
    title: 'Quadruped Navigation',
    authors: ['Miki, Takahiro'],
    institutions: ['  ETH Zürich - Swiss Federal Institute  '],
    publicationYear: 2022
  };
  const res4 = sourceIndependenceService.evaluatePairwiseIndependence(ethClean, ethDiacritic);
  assert(res4.state === 'PARTIALLY_DEPENDENT', 'Diacritic "ETH Zürich" matches "ETH Zurich" with punctuation and padding');

  // -------------------------------------------------------------------------
  // Scenario 5: Unrelated institutions with similar names
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 5] Unrelated institutions with similar names (zero collisions)...');
  const uwPaper: PaperIndependenceMetadata = {
    paperId: 'p-uw',
    doi: '10.1000/uw',
    title: 'NLP at UW',
    authors: ['Zettlemoyer, Luke'],
    institutions: ['University of Washington'],
    publicationYear: 2021
  };
  const gwuPaper: PaperIndependenceMetadata = {
    paperId: 'p-gwu',
    doi: '10.1000/gwu',
    title: 'Biomedical Informatics',
    authors: ['Feldman, Ronald'],
    institutions: ['George Washington University'],
    publicationYear: 2022
  };
  const washuPaper: PaperIndependenceMetadata = {
    paperId: 'p-washu',
    doi: '10.1000/washu',
    title: 'Genomics in Medicine',
    authors: ['Mardis, Elaine'],
    institutions: ['Washington University in St. Louis'],
    publicationYear: 2023
  };
  const res5_1 = sourceIndependenceService.evaluatePairwiseIndependence(uwPaper, gwuPaper);
  assert(res5_1.state === 'INDEPENDENT', 'University of Washington does NOT collide with George Washington University');

  const res5_2 = sourceIndependenceService.evaluatePairwiseIndependence(uwPaper, washuPaper);
  assert(res5_2.state === 'INDEPENDENT', 'University of Washington does NOT collide with Washington University in St. Louis');

  const ucbPaper: PaperIndependenceMetadata = {
    paperId: 'p-ucb',
    doi: '10.1000/ucb',
    title: 'Berkeley Vision',
    authors: ['Malik, Jitendra'],
    institutions: ['University of California, Berkeley'],
    publicationYear: 2021
  };
  const uclaPaper: PaperIndependenceMetadata = {
    paperId: 'p-ucla',
    doi: '10.1000/ucla',
    title: 'UCLA Graphics',
    authors: ['Terzopoulos, Demetri'],
    institutions: ['University of California, Los Angeles'],
    publicationYear: 2022
  };
  const res5_3 = sourceIndependenceService.evaluatePairwiseIndependence(ucbPaper, uclaPaper);
  assert(res5_3.state === 'INDEPENDENT', 'UC Berkeley does NOT collide with UC Los Angeles');

  // -------------------------------------------------------------------------
  // Scenario 6: Multiple affiliations (papers with 2+ institutions)
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 6] Multiple affiliations handling...');
  const multiAffilSeed: PaperIndependenceMetadata = {
    paperId: 'seed-multi',
    doi: '10.1000/m1',
    title: 'Joint Academic-Industry Research',
    authors: ['Author A', 'Author B'],
    institutions: ['Stanford University', 'Google Research'],
    publicationYear: 2022
  };
  const multiAffilCand: PaperIndependenceMetadata = {
    paperId: 'cand-multi',
    doi: '10.1000/m2',
    title: 'Downstream Transfer Studies',
    authors: ['Author C', 'Author D'],
    institutions: ['MIT', 'Google Research'],
    publicationYear: 2023
  };
  const res6 = sourceIndependenceService.evaluatePairwiseIndependence(multiAffilSeed, multiAffilCand);
  assert(res6.state === 'PARTIALLY_DEPENDENT', 'Detects overlap in multi-institution papers via shared "Google Research"');
  assert(res6.sharedInstitutions.includes('Google Research'), 'sharedInstitutions correctly isolates the overlapping institution');

  // -------------------------------------------------------------------------
  // Scenario 7: Missing affiliations fallback
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 7] Missing affiliations fallback...');
  const missingAffilPaper: PaperIndependenceMetadata = {
    paperId: 'p-no-affil',
    doi: '10.1000/noaffil',
    title: 'Preprint with Missing Metadata',
    authors: ['Unknown, Author'],
    institutions: [], // completely missing affiliations
    publicationYear: 2023
  };
  const res7 = sourceIndependenceService.evaluatePairwiseIndependence(baseSeed, missingAffilPaper);
  assert(res7.state === 'INDEPENDENCE_UNKNOWN', 'Missing affiliations safely defaults to INDEPENDENCE_UNKNOWN (not false INDEPENDENT)');
  assert(res7.satisfiesIndependentReplication === false, 'INDEPENDENCE_UNKNOWN does not satisfy independent replication');

  // -------------------------------------------------------------------------
  // Scenario 8: Conflicting institution metadata
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 8] Conflicting institution metadata...');
  const conflictingCand: PaperIndependenceMetadata = {
    paperId: 'cand-conflict',
    doi: '10.1000/conflict',
    title: 'Conflicting Affiliations Test',
    authors: ['Researcher, Alice'],
    institutionEntities: [
      {
        name: 'Stanford University', // String says Stanford
        rorId: 'https://ror.org/05x2bcf40' // ROR ID says Carnegie Mellon University!
      }
    ],
    publicationYear: 2023
  };
  const res8 = sourceIndependenceService.evaluatePairwiseIndependence(baseSeed, conflictingCand);
  assert(res8.institutionMetadataConflict === true, 'Flags institutionMetadataConflict: true on name vs ROR ID mismatch');
  assert(res8.state === 'INDEPENDENCE_UNKNOWN', 'Conflicting metadata blocks unverified INDEPENDENT classification');

  // -------------------------------------------------------------------------
  // Scenario 9: Shared affiliation with disjoint author groups
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 9] Shared affiliation with disjoint author groups...');
  const stanfordGroupA: PaperIndependenceMetadata = {
    paperId: 'p-stan-a',
    doi: '10.1000/st-a',
    title: 'Stanford CS Lab A',
    authors: ['Manning, Christopher'],
    institutions: ['Stanford University'],
    publicationYear: 2021
  };
  const stanfordGroupB: PaperIndependenceMetadata = {
    paperId: 'p-stan-b',
    doi: '10.1000/st-b',
    title: 'Stanford CS Lab B',
    authors: ['Ousterhout, John'],
    institutions: ['Stanford University'],
    publicationYear: 2022
  };
  const res9 = sourceIndependenceService.evaluatePairwiseIndependence(stanfordGroupA, stanfordGroupB);
  assert(res9.authorJaccard === 0, 'Authors are completely disjoint (Jaccard = 0)');
  assert(res9.state === 'PARTIALLY_DEPENDENT', 'Shared institution without author overlap yields PARTIALLY_DEPENDENT, NOT INDEPENDENT');

  // -------------------------------------------------------------------------
  // Scenario 10: Different strings resolving to the same verified ROR ID
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 10] Different strings resolving to the same ROR ID...');
  const rorRes1 = resolveInstitutionIdentity('Leland Stanford Junior University');
  const rorRes2 = resolveInstitutionIdentity('Stanford');
  assert(rorRes1.rorId === 'https://ror.org/00f54p054', 'Leland Stanford Junior University resolves to Stanford ROR ID');
  assert(rorRes2.rorId === 'https://ror.org/00f54p054', 'Stanford resolves to Stanford ROR ID');
  assert(rorRes1.canonicalId === rorRes2.canonicalId, 'Both strings map to identical canonicalId');

  // -------------------------------------------------------------------------
  // Scenario 11: Missing ROR identifiers falling back to alias registry
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 11] Missing ROR identifiers falling back to alias registry...');
  const aliasRes = resolveInstitutionIdentity({ name: 'Carnegie Mellon University' }); // No ROR passed
  assert(aliasRes.resolutionMethod === 'ALIAS_REGISTRY', 'Resolves via ALIAS_REGISTRY when ROR ID is absent');
  assert(aliasRes.canonicalId === 'carnegie-mellon-university', 'Correct canonicalId assigned');
  assert(aliasRes.rorId === 'https://ror.org/05x2bcf40', 'Canonical ROR ID retrieved from registry');

  // -------------------------------------------------------------------------
  // Scenario 12: Author-name collision protection (East Asian names)
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 12] Author-name collision protection (Wang, Wei vs Wang, Wen)...');
  const authorNorm1 = normalizeAuthorName('Wang, Wei');
  const authorNorm2 = normalizeAuthorName('Wang, Wen');
  assert(authorNorm1 === 'wang, wei', 'Wang, Wei normalizes to "wang, wei"');
  assert(authorNorm2 === 'wang, wen', 'Wang, Wen normalizes to "wang, wen"');
  assert(authorNorm1 !== authorNorm2, 'Wang, Wei does NOT collide with Wang, Wen');

  // Inverted Western format: "Wei Wang" vs "Wen Wang"
  const western1 = normalizeAuthorName('Wei Wang');
  const western2 = normalizeAuthorName('Wen Wang');
  assert(western1 === 'wang, wei', 'Wei Wang normalizes to "wang, wei"');
  assert(western2 === 'wang, wen', 'Wen Wang normalizes to "wang, wen"');

  const jaccardCollision = calculateAuthorJaccard(['Wang, Wei'], ['Wang, Wen']);
  assert(jaccardCollision.jaccard === 0, 'Jaccard similarity between Wang, Wei and Wang, Wen is exactly 0.0');

  // -------------------------------------------------------------------------
  // Scenario 13: Missing author metadata safe fallback
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 13] Missing author metadata safe fallback...');
  const missingAuthorsCand: PaperIndependenceMetadata = {
    paperId: 'p-no-authors',
    doi: '10.1000/noauthors',
    title: 'Anonymous Whitepaper',
    authors: [],
    institutions: ['Google Research'],
    publicationYear: 2022
  };
  const res13 = sourceIndependenceService.evaluatePairwiseIndependence(baseSeed, missingAuthorsCand);
  assert(res13.state === 'INDEPENDENCE_UNKNOWN', 'Missing author array returns INDEPENDENCE_UNKNOWN');

  // -------------------------------------------------------------------------
  // Scenario 14: Two partially dependent studies cannot satisfy standard replication
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 14] Strict Rule: Two PARTIALLY_DEPENDENT != Standard Replication...');
  const partialAssessments: IndependenceAssessmentResult[] = [
    {
      candidatePaperId: 'c1',
      seedPaperId: 's',
      state: 'PARTIALLY_DEPENDENT',
      weight: 0.5,
      authorJaccard: 0,
      sharedAuthors: [],
      sharedInstitutions: ['Google Research'],
      sharedDatasetsOrBenchmarks: [],
      lineageType: 'DISTINCT_PUBLICATION',
      sharedCodebaseDetected: false,
      notes: [],
      satisfiesIndependentReplication: false
    },
    {
      candidatePaperId: 'c2',
      seedPaperId: 's',
      state: 'PARTIALLY_DEPENDENT',
      weight: 0.5,
      authorJaccard: 0.1,
      sharedAuthors: ['Author X'],
      sharedInstitutions: [],
      sharedDatasetsOrBenchmarks: [],
      lineageType: 'DISTINCT_PUBLICATION',
      sharedCodebaseDetected: false,
      notes: [],
      satisfiesIndependentReplication: false
    }
  ];
  const summary14 = sourceIndependenceService.evaluateReplicationSufficiency(partialAssessments);
  assert(summary14.satisfiesStandardReplication === false, 'Two partially dependent studies DO NOT satisfy standard replication');
  assert(summary14.satisfiesHybridReplication === false, 'Two partially dependent studies DO NOT satisfy hybrid replication (0 independent)');
  assert(summary14.effectivePathway === 'NOT_ADDRESSED', 'Pathway is NOT_ADDRESSED');

  // -------------------------------------------------------------------------
  // Scenario 15: Two genuinely independent groups satisfy standard replication
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 15] Two genuinely independent groups satisfy standard replication...');
  const indepAssessments: IndependenceAssessmentResult[] = [
    {
      candidatePaperId: 'i1',
      seedPaperId: 's',
      state: 'INDEPENDENT',
      weight: 1.0,
      authorJaccard: 0,
      sharedAuthors: [],
      sharedInstitutions: [],
      sharedDatasetsOrBenchmarks: [],
      lineageType: 'DISTINCT_PUBLICATION',
      sharedCodebaseDetected: false,
      notes: [],
      satisfiesIndependentReplication: true
    },
    {
      candidatePaperId: 'i2',
      seedPaperId: 's',
      state: 'INDEPENDENT',
      weight: 1.0,
      authorJaccard: 0,
      sharedAuthors: [],
      sharedInstitutions: [],
      sharedDatasetsOrBenchmarks: [],
      lineageType: 'DISTINCT_PUBLICATION',
      sharedCodebaseDetected: false,
      notes: [],
      satisfiesIndependentReplication: true
    }
  ];
  const summary15 = sourceIndependenceService.evaluateReplicationSufficiency(indepAssessments);
  assert(summary15.satisfiesStandardReplication === true, 'Two independent studies satisfy standard replication');
  assert(summary15.effectivePathway === 'STANDARD_MULTI_GROUP', 'Pathway is STANDARD_MULTI_GROUP');
  assert(summary15.requiresHumanReview === false, 'Standard independent multi-group replication does NOT require human review');

  // -------------------------------------------------------------------------
  // Scenario 16: Hybrid replication strictly requires human review
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 16] Hybrid replication strictly requires human review...');
  const hybridAssessments: IndependenceAssessmentResult[] = [
    indepAssessments[0], // 1 strictly independent
    partialAssessments[0] // 1 partially dependent
  ];
  const summary16 = sourceIndependenceService.evaluateReplicationSufficiency(hybridAssessments);
  assert(summary16.satisfiesHybridReplication === true, '1 independent + 1 partially dependent satisfies hybrid replication');
  assert(summary16.effectivePathway === 'HYBRID_EVIDENCE_PATH', 'Pathway is HYBRID_EVIDENCE_PATH');
  assert(summary16.requiresHumanReview === true, 'Hybrid replication strictly sets requiresHumanReview: true');

  // -------------------------------------------------------------------------
  // Scenario 17: Landmark evidence strictly requires verified artifacts & human review
  // -------------------------------------------------------------------------
  console.log('\n[Scenario 17] Landmark evidence strictly requires verified artifacts...');
  const singleIndepAssessment = [indepAssessments[0]];

  // Case A: With verified artifacts
  const landmarkSummaryWithArtifacts = sourceIndependenceService.evaluateReplicationSufficiency(
    singleIndepAssessment,
    true, // isLandmarkCandidate
    {
      hasVerifiableArtifacts: true,
      transparentRationale: 'Open-source verified repository with public reproducible benchmark suite.'
    }
  );
  assert(landmarkSummaryWithArtifacts.effectivePathway === 'LANDMARK_RESULT', 'Landmark pathway accepted with verified artifacts');
  assert(landmarkSummaryWithArtifacts.requiresHumanReview === true, 'Landmark pathway strictly requires human review');

  // Case B: Without verified artifacts (e.g. claims of popularity or adoption only)
  const landmarkSummaryWithoutArtifacts = sourceIndependenceService.evaluateReplicationSufficiency(
    singleIndepAssessment,
    true, // isLandmarkCandidate
    {
      hasVerifiableArtifacts: false,
      transparentRationale: 'Widely cited in industry but closed source.'
    }
  );
  assert(landmarkSummaryWithoutArtifacts.effectivePathway === 'NOT_ADDRESSED', 'Landmark pathway rejected without verifiable artifacts');

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`Anvīkṣā — Stage 4D.1 Adversarial Test Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage4D1AdversarialSuite().catch(err => {
  console.error('Fatal error running Stage 4D.1 adversarial verification suite:', err);
  process.exit(1);
});
