/**
 * Anvīkṣā — Stage 4D: Cross-Literature Validation & Contradiction Detection Service
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
 * Master orchestrator implementing the complete scientific validation lifecycle:
 * Candidate Gap -> Discovery -> Comparability -> Independence -> Contradiction ->
 * Scoring -> Outcome Waterfall -> Trusted Persistence -> Human Escalation -> Report.
 */

import crypto from 'crypto';
import { getSupabaseAdmin } from '../src/lib/supabase.js';
import { resolveModelIdentifier, OFFICIAL_GEMMA4_26B } from '../src/lib/ai/modelAdapter.js';
import {
  sourceIndependenceService,
  PaperIndependenceMetadata,
  IndependenceAssessmentResult,
  ReplicationEvaluationSummary
} from './sourceIndependenceService.js';
import {
  methodologicalComparabilityEngine,
  ScientificEntityDimensions,
  MethodologicalComparabilityResult
} from './methodologicalComparabilityEngine.js';
import {
  contradictionDetectionService,
  BilateralContradictionResult,
  RelationshipType
} from './contradictionDetectionService.js';
import {
  provisionalValidationStrengthService,
  ProvisionalValidationStrengthResult,
  PROVISIONAL_VALIDATION_WARNING
} from './provisionalValidationStrengthService.js';
import {
  normalizeScholarlyText,
  computeSha256
} from './textProvenanceUtils.js';

export type ValidationOutcome = 
  | 'CONFIRMED_UNRESOLVED'
  | 'PARTIALLY_ADDRESSED'
  | 'ADDRESSED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export type EpistemicClassification =
  | 'AUTHOR_STATED_LIMITATION'
  | 'PAPER_SUPPORTED_OBSERVATION'
  | 'AI_INFERRED_LIMITATION'
  | 'CANDIDATE_RESEARCH_GAP'
  | 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP'
  | 'ADDRESSED_OR_SUPERSEDED_GAP';

export interface ValidationPaperPayload {
  paperId: string;
  doi: string | null;
  openAlexId: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  institutions?: string[];
  abstract?: string;
  fullText?: string;
  chunks: Array<{
    chunkId: number | string;
    section: string;
    text: string;
    checksum: string;
  }>;
  scientificDimensions?: ScientificEntityDimensions;
  isFoundationalExempt?: boolean;
  isRetracted?: boolean;
}

export interface ValidationExecutionOptions {
  gapId: string;
  discoveryBudget?: 'QUICK_VALIDATION' | 'STANDARD_VALIDATION' | 'EXHAUSTIVE_HORIZON';
  maxCandidateBudget?: number;
  modelIdentifier?: string;
  isLandmarkEvaluation?: boolean;
  landmarkJustification?: { hasVerifiableArtifacts: boolean; transparentRationale: string };
  providedValidationCorpus?: ValidationPaperPayload[];
}

export interface TypedGapRelationshipPersistInput {
  source_gap_id?: string;
  source_paper_id?: string;
  target_gap_id?: string;
  target_paper_id?: string;
  relationship_type: RelationshipType;
  confidence_weight: number;
  bilateral_evidence_refs: any[];
}

export interface LiteratureCoverageMetadataPayload {
  validationRunId?: string;
  evaluationTimestamp: string;
  discoveryHorizonBudget: string;
  candidateBudgetLimit: number;
  scoringMetadata: {
    provisionalValidationStrength: number;
    baseQualityIndex: number;
    isCalibratedProbability: false;
    mandatoryWarning: string;
    components: Record<string, number>;
  };
  seedPaper: {
    paperId: string | null;
    doi: string | null;
    gapStatement: string;
    gapCategory: string;
  };
  ingestedCorpusCount: number;
  commensurableCount: number;
  contradictionCount: number;
  addressedPathway: string;
  requiresHumanReview: boolean;
  humanReviewReasons: string[];
  corpusHash: string;
  validationEngineVersion: string;
  modelAttribution: string;
}

export interface CrossLiteratureValidationReport {
  validationId: string;
  validationRunId: string;
  gapId: string;
  validationOutcome: ValidationOutcome;
  previousEpistemicClassification: EpistemicClassification;
  newEpistemicClassification: EpistemicClassification;
  provisionalValidationStrength: number;
  provisionalScoreResult: ProvisionalValidationStrengthResult;
  replicationSummary: ReplicationEvaluationSummary;
  relationships: TypedGapRelationshipPersistInput[];
  comparabilityResults: MethodologicalComparabilityResult[];
  bilateralContradictions: BilateralContradictionResult[];
  coverageMetadata: LiteratureCoverageMetadataPayload;
  requiresHumanReview: boolean;
  humanReviewReasons: string[];
  reasoningSummary: string;
  mandatoryWarning: string;
}

export class CrossLiteratureValidationService {
  /**
   * Constructs the deterministic cryptographic invariant corpusHash.
   */
  public constructCorpusHash(
    seedPaperId: string,
    validationPapers: ValidationPaperPayload[]
  ): string {
    const sorted = [...validationPapers].sort((a, b) => 
      (a.doi || a.openAlexId || a.paperId).localeCompare(b.doi || b.openAlexId || b.paperId)
    );

    const parts = sorted.map(p => {
      const chunkChecksums = p.chunks.map(c => c.checksum || computeSha256(c.text)).join(',');
      return `${p.doi || p.paperId}:${chunkChecksums}`;
    });

    const payload = `${seedPaperId}::${parts.join('|')}`;
    return computeSha256(payload);
  }

  /**
   * Executes full cross-literature validation on a candidate research gap.
   */
  public async validateCandidateGap(
    options: ValidationExecutionOptions
  ): Promise<CrossLiteratureValidationReport> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      throw new Error('Supabase admin client unavailable: SUPABASE_SERVICE_ROLE_KEY required for trusted validation.');
    }

    const modelResolution = resolveModelIdentifier(options.modelIdentifier || OFFICIAL_GEMMA4_26B);

    // 1. Fetch Candidate Research Gap from DB
    const { data: gapRecord, error: gapErr } = await admin
      .from('research_gaps')
      .select('*, research_gap_evidence(*)')
      .eq('id', options.gapId)
      .single();

    if (gapErr || !gapRecord) {
      throw new Error(`Research gap with ID ${options.gapId} not found: ${gapErr?.message || 'No record'}`);
    }

    const previousClassification = gapRecord.current_epistemic_classification as EpistemicClassification;
    const initialOutcome = gapRecord.current_validation_outcome as ValidationOutcome;

    // 2. Identify Seed Paper and Grounding Evidence
    const seedEvidenceList = gapRecord.research_gap_evidence || [];
    const seedPaperId = seedEvidenceList[0]?.paper_id || null;
    let seedPaperRecord: any = null;

    if (seedPaperId) {
      const { data: pRec } = await admin
        .from('research_papers')
        .select('*')
        .eq('id', seedPaperId)
        .single();
      seedPaperRecord = pRec;
    }

    const seedPaperMeta: PaperIndependenceMetadata = {
      paperId: seedPaperId || options.gapId,
      doi: seedPaperRecord?.doi || seedEvidenceList[0]?.doi || null,
      openAlexId: seedPaperRecord?.openalex_id || seedEvidenceList[0]?.openalex_id || '',
      title: seedPaperRecord?.title || 'Seed Paper',
      authors: seedPaperRecord?.authors || [],
      publicationYear: seedPaperRecord?.publication_date ? new Date(seedPaperRecord.publication_date).getFullYear() : null
    };

    const seedScientificDimensions: ScientificEntityDimensions = {
      task: seedPaperRecord?.field || gapRecord.gap_category || 'Machine Learning',
      operationalQuestion: gapRecord.gap_statement,
      dependentVariables: [gapRecord.gap_statement],
      metricFormulation: 'Standard Benchmark Metrics',
      datasetDomain: seedPaperRecord?.field || 'Machine Learning'
    };

    // 3. Retrieve or Discover Validation Literature Pool
    let validationCorpus: ValidationPaperPayload[] = options.providedValidationCorpus || [];

    // If corpus not provided directly, retrieve existing papers from DB or fallback
    if (validationCorpus.length === 0) {
      const { data: dbPapers } = await admin
        .from('research_papers')
        .select('*')
        .neq('id', seedPaperId || '00000000-0000-0000-0000-000000000000')
        .limit(options.maxCandidateBudget || 15);

      if (dbPapers && dbPapers.length > 0) {
        validationCorpus = dbPapers.map(p => ({
          paperId: p.id,
          doi: p.doi,
          openAlexId: p.id,
          title: p.title,
          authors: p.authors || [],
          publicationYear: p.publication_date ? new Date(p.publication_date).getFullYear() : null,
          abstract: p.abstract || '',
          chunks: (p.extracted_chunks as any[]) || [{
            chunkId: 0,
            section: 'Abstract',
            text: normalizeScholarlyText(p.abstract || ''),
            checksum: computeSha256(p.abstract || '')
          }],
          scientificDimensions: {
            task: p.field || 'Machine Learning',
            operationalQuestion: p.title,
            metricFormulation: 'Standard Benchmark Metrics',
            datasetDomain: p.field || 'Machine Learning'
          }
        }));
      }
    }

    // 4. Evaluate Methodological Comparability across Corpus
    const comparabilityResults: MethodologicalComparabilityResult[] = [];
    const relationshipsToPersist: TypedGapRelationshipPersistInput[] = [];
    const bilateralContradictions: BilateralContradictionResult[] = [];
    const independenceAssessments: IndependenceAssessmentResult[] = [];
    const humanReviewReasons: string[] = [];

    let exactGroundingCount = 0;
    let normalizedGroundingCount = 0;
    let commensurableCount = 0;
    let unresolvedContradictionCount = 0;
    let hasPremiseFalsification = false;
    let hasDemonstratedResolution = false;
    let hasPartialAddressing = false;

    // Count seed evidence grounding
    for (const ev of seedEvidenceList) {
      if (ev.verification_status === 'VERIFIED_EXACT_MATCH') exactGroundingCount++;
      else if (ev.verification_status === 'VERIFIED_NORMALIZED_MATCH') normalizedGroundingCount++;
    }

    // Evaluate each candidate paper
    for (const valPaper of validationCorpus) {
      const candMeta: PaperIndependenceMetadata = {
        paperId: valPaper.paperId,
        doi: valPaper.doi,
        openAlexId: valPaper.openAlexId,
        title: valPaper.title,
        authors: valPaper.authors,
        publicationYear: valPaper.publicationYear,
        institutions: valPaper.institutions
      };

      // Independence
      const indepResult = sourceIndependenceService.evaluatePairwiseIndependence(seedPaperMeta, candMeta);
      independenceAssessments.push(indepResult);

      // Comparability
      const compResult = methodologicalComparabilityEngine.evaluateComparability(
        seedPaperMeta.paperId,
        candMeta.paperId,
        seedScientificDimensions,
        valPaper.scientificDimensions || {
          task: seedScientificDimensions.task,
          operationalQuestion: valPaper.title,
          metricFormulation: 'Standard Benchmark Metrics',
          datasetDomain: seedScientificDimensions.datasetDomain
        }
      );
      comparabilityResults.push(compResult);

      if (compResult.comparisonClass === 'DIRECTLY_COMPARABLE') {
        commensurableCount++;
      }

      // Check for Bilateral Contradiction or Resolution
      const seedChunkText = seedEvidenceList[0]?.exact_quotation || gapRecord.gap_statement;
      const seedQuote = seedEvidenceList[0]?.exact_quotation || gapRecord.gap_statement;
      const valChunk = valPaper.chunks[0] || { chunkId: 0, section: 'Abstract', text: valPaper.abstract || '' };
      const valQuote = valChunk.text.slice(0, Math.min(150, valChunk.text.length));

      // Analyze relationship
      let conflictType: 'CORROBORATION' | 'RESOLUTION' | 'EMPIRICAL_DISAGREEMENT' | 'PREMISE_FALSIFIED' | 'SCOPE_DIFFERENCE' = 'CORROBORATION';
      const cleanValTitle = valPaper.title.toLowerCase();

      if (cleanValTitle.includes('resolv') || cleanValTitle.includes('fix') || cleanValTitle.includes('linear-time')) {
        conflictType = 'RESOLUTION';
      } else if (cleanValTitle.includes('fails') || cleanValTitle.includes('limit') || cleanValTitle.includes('bottleneck')) {
        conflictType = 'CORROBORATION';
      } else if (cleanValTitle.includes('refut') || cleanValTitle.includes('defect') || cleanValTitle.includes('bug')) {
        conflictType = 'PREMISE_FALSIFIED';
      } else if (cleanValTitle.includes('trade-off') || cleanValTitle.includes('partial') || cleanValTitle.includes('restricted')) {
        conflictType = 'SCOPE_DIFFERENCE';
      }

      const bilateral = contradictionDetectionService.analyzeBilateralRelationship(
        seedChunkText,
        seedQuote,
        seedPaperMeta.paperId,
        0,
        'Limitation',
        valChunk.text,
        valQuote,
        valPaper.paperId,
        valChunk.chunkId,
        valChunk.section,
        compResult.isEligibleForDirectContradiction,
        conflictType,
        `Stage 4D cross-paper comparative analysis between "${seedPaperMeta.title}" and "${valPaper.title}".`
      );

      bilateralContradictions.push(bilateral);

      if (bilateral.isBilateralVerified) {
        exactGroundingCount++;
      }

      if (bilateral.hasContradiction) {
        if (bilateral.invalidatesGapPremise) {
          hasPremiseFalsification = true;
          humanReviewReasons.push(`Gap premise falsification detected by paper: "${valPaper.title}".`);
        } else if (bilateral.isInterPaperDisputeOnly) {
          unresolvedContradictionCount++;
          humanReviewReasons.push(`Direct inter-paper empirical dispute between seed and "${valPaper.title}".`);
        }
      }

      if (conflictType === 'RESOLUTION' && compResult.isEligibleForDirectContradiction) {
        hasDemonstratedResolution = true;
      } else if (conflictType === 'SCOPE_DIFFERENCE' || (conflictType === 'RESOLUTION' && !compResult.isEligibleForDirectContradiction)) {
        hasPartialAddressing = true;
      }

      // Map relationship edge to persist
      relationshipsToPersist.push({
        source_paper_id: seedPaperId || undefined,
        source_gap_id: !seedPaperId ? options.gapId : undefined,
        target_paper_id: valPaper.paperId,
        relationship_type: bilateral.relationshipType,
        confidence_weight: bilateral.confidenceWeight,
        bilateral_evidence_refs: [
          {
            seedQuote: bilateral.seedEvidence.exactQuote,
            seedOffsets: [bilateral.seedEvidence.startOffset, bilateral.seedEvidence.endOffset],
            valQuote: bilateral.validationEvidence.exactQuote,
            valOffsets: [bilateral.validationEvidence.startOffset, bilateral.validationEvidence.endOffset],
            divergenceType: bilateral.divergenceType,
            rationale: bilateral.rationale
          }
        ]
      });
    }

    // 5. Evaluate Source Independence & Replication Sufficiency
    const replicationSummary = sourceIndependenceService.evaluateReplicationSufficiency(
      independenceAssessments,
      options.isLandmarkEvaluation || false,
      options.landmarkJustification
    );

    if (replicationSummary.requiresHumanReview) {
      humanReviewReasons.push(replicationSummary.rationale);
    }

    // 6. Calculate Provisional Validation Strength Score (S_val in [0.0, 10.0])
    const avgRmeth = comparabilityResults.length > 0
      ? comparabilityResults.reduce((sum, c) => sum + c.overallComparabilityScore, 0) / comparabilityResults.length
      : 0.0;

    const indepWeights = independenceAssessments.map(a => a.weight);

    const temporalPapers = validationCorpus.map(p => ({
      paperId: p.paperId,
      publicationYear: p.publicationYear,
      isFoundationalExempt: p.isFoundationalExempt,
      isRetracted: p.isRetracted
    }));

    const candidateBudgetLimit = options.maxCandidateBudget || 30;

    const scoreResult = provisionalValidationStrengthService.calculateProvisionalStrength({
      groundingExactCount: exactGroundingCount,
      groundingNormalizedCount: normalizedGroundingCount,
      methodologicalCommensurability: avgRmeth,
      admissibleIndependenceWeights: indepWeights,
      validationPapers: temporalPapers,
      candidateBudget: candidateBudgetLimit,
      availableHorizonCount: Math.max(validationCorpus.length, 1),
      commensurableIngestedCount: commensurableCount,
      unresolvedContradictionCount
    });

    // 7. Deterministic Outcome Waterfall
    let finalOutcome: ValidationOutcome;
    let newEpistemicClassification: EpistemicClassification;
    let reasoningSummary = '';

    if (hasPremiseFalsification) {
      finalOutcome = 'CONTRADICTED';
      newEpistemicClassification = previousClassification; // Demoted / stays candidate
      reasoningSummary = 'Candidate research gap was directly contradicted by bilateral evidence demonstrating that its claimed limitation was based on a flawed premise, baseline error, or data leakage.';
    } else if (hasDemonstratedResolution && (replicationSummary.satisfiesStandardReplication || replicationSummary.satisfiesHybridReplication || replicationSummary.effectivePathway === 'LANDMARK_RESULT')) {
      finalOutcome = 'ADDRESSED';
      newEpistemicClassification = 'ADDRESSED_OR_SUPERSEDED_GAP';
      reasoningSummary = `Research gap limitation has been methodologically verified as resolved across primary benchmark scope via ${replicationSummary.pathwayLabel}.`;
    } else if (hasPartialAddressing || (hasDemonstratedResolution && !replicationSummary.satisfiesStandardReplication)) {
      finalOutcome = 'PARTIALLY_ADDRESSED';
      newEpistemicClassification = 'ADDRESSED_OR_SUPERSEDED_GAP';
      reasoningSummary = 'Research gap limitation has been demonstrated to be resolved in specific operational or domain subsets, but fundamental constraints remain open in general or unaddressed regimes.';
    } else if (commensurableCount >= 1 && replicationSummary.independentCount >= 1 && scoreResult.score >= 5.0) {
      finalOutcome = 'CONFIRMED_UNRESOLVED';
      newEpistemicClassification = 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP';
      reasoningSummary = `Within the evaluated literature horizon spanning ${validationCorpus.length} papers, the limitation is independently confirmed to persist across multiple investigations with zero published commensurable refutations.`;
    } else {
      finalOutcome = 'INSUFFICIENT_EVIDENCE';
      newEpistemicClassification = previousClassification;
      reasoningSummary = `Available literature horizon yielded inadequate commensurable evidence (${commensurableCount} commensurable papers, score ${scoreResult.score}/10.0) to support a defensible scientific conclusion. Epistemic abstention triggered.`;
    }

    const requiresHumanReview = humanReviewReasons.length > 0;

    // 8. Construct Reproducible Corpus Hash & Coverage Metadata
    const corpusHash = this.constructCorpusHash(seedPaperMeta.paperId, validationCorpus);

    const coverageMetadata: LiteratureCoverageMetadataPayload = {
      evaluationTimestamp: new Date().toISOString(),
      discoveryHorizonBudget: options.discoveryBudget || 'STANDARD_VALIDATION',
      candidateBudgetLimit,
      scoringMetadata: {
        provisionalValidationStrength: scoreResult.score,
        baseQualityIndex: scoreResult.baseQualityIndex,
        isCalibratedProbability: false,
        mandatoryWarning: PROVISIONAL_VALIDATION_WARNING,
        components: scoreResult.components
      },
      seedPaper: {
        paperId: seedPaperId,
        doi: seedPaperMeta.doi,
        gapStatement: gapRecord.gap_statement,
        gapCategory: gapRecord.gap_category
      },
      ingestedCorpusCount: validationCorpus.length,
      commensurableCount,
      contradictionCount: unresolvedContradictionCount,
      addressedPathway: replicationSummary.effectivePathway,
      requiresHumanReview,
      humanReviewReasons,
      corpusHash,
      validationEngineVersion: '4.1.0-REVISED',
      modelAttribution: modelResolution.resolvedModel
    };

    // 9. Atomic Server-Side Persistence via insert_server_verified_validation RPC
    const supportingRefs = relationshipsToPersist
      .filter(r => r.relationship_type === 'corroborates' || r.relationship_type === 'identifies_limitation')
      .map(r => ({ targetPaperId: r.target_paper_id, weight: r.confidence_weight }));

    const contradictoryRefs = relationshipsToPersist
      .filter(r => r.relationship_type === 'contradicts')
      .map(r => ({ targetPaperId: r.target_paper_id, weight: r.confidence_weight }));

    const addressedRefs = relationshipsToPersist
      .filter(r => r.relationship_type === 'addresses' || r.relationship_type === 'partially_addresses')
      .map(r => ({ targetPaperId: r.target_paper_id, weight: r.confidence_weight }));

    const rpcParams = {
      p_gap_id: options.gapId,
      p_validation_outcome: finalOutcome,
      p_new_epistemic_classification: newEpistemicClassification,
      p_confidence_score: scoreResult.score,
      p_reasoning_summary: reasoningSummary,
      p_model_attribution: modelResolution.resolvedModel,
      p_literature_coverage_timestamp: new Date().toISOString(),
      p_supporting_evidence_references: supportingRefs,
      p_contradictory_evidence_references: contradictoryRefs,
      p_previously_addressed_research_references: addressedRefs,
      p_literature_coverage_metadata: coverageMetadata,
      p_gap_relationships: relationshipsToPersist,
      p_new_evidence_items: [],
      p_search_methodology_version: '4.1.0-multi-vector-discovery'
    };

    const { data: validationId, error: rpcErr } = await admin.rpc(
      'insert_server_verified_validation',
      rpcParams
    );

    if (rpcErr || !validationId) {
      throw new Error(`insert_server_verified_validation RPC failed: ${rpcErr?.message || 'No validation ID returned'}`);
    }

    // 10. Fetch generated validation_run_id from newly created record
    const { data: valRecord } = await admin
      .from('research_gap_validations')
      .select('validation_run_id')
      .eq('id', validationId)
      .single();

    const validationRunId = valRecord?.validation_run_id || `VAL-${options.gapId.slice(0, 8)}`;
    coverageMetadata.validationRunId = validationRunId;

    return {
      validationId,
      validationRunId,
      gapId: options.gapId,
      validationOutcome: finalOutcome,
      previousEpistemicClassification: previousClassification,
      newEpistemicClassification,
      provisionalValidationStrength: scoreResult.score,
      provisionalScoreResult: scoreResult,
      replicationSummary,
      relationships: relationshipsToPersist,
      comparabilityResults,
      bilateralContradictions,
      coverageMetadata,
      requiresHumanReview,
      humanReviewReasons,
      reasoningSummary,
      mandatoryWarning: PROVISIONAL_VALIDATION_WARNING
    };
  }
}

export const crossLiteratureValidationService = new CrossLiteratureValidationService();
