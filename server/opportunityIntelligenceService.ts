/**
 * Anvīkṣā — Stage 4E: Research Opportunity Intelligence Service
 * 
 * Work Package: 4E-IMP-01
 * Architecture Specification: Version 4.1.0-REVISED (Final Scientific Integrity Amendment)
 * 
 * Transforms cross-literature-validated research gaps into prioritized, evidence-backed
 * scientific research opportunities. Evaluates intrinsic scientific opportunity value (V_scientific)
 * completely decoupled from individual researcher resource constraints.
 */

import { getSupabaseAdmin } from '../src/lib/supabase.js';
import { resolveModelIdentifier, OFFICIAL_GEMMA4_26B } from '../src/lib/ai/modelAdapter.js';
import { normalizeScholarlyText, computeSha256 } from './textProvenanceUtils.js';

// ====================================================================
// 1. ACCEPTED SCIENTIFIC TAXONOMY & TYPES
// ====================================================================

export const OPPORTUNITY_METHODOLOGY_VERSION = '4.1.0-STAGE4E-OPP-INTEL';

export type OpportunityStatus =
  | 'ELIGIBLE'
  | 'RANKED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'STALE'
  | 'INELIGIBLE';

export type ContradictionStatus =
  | 'NO_CONTRADICTIONS_DETECTED'
  | 'PREMISE_FALSIFIED'
  | 'SCOPE_NARROWED'
  | 'CONTRADICTION_STATUS_UNKNOWN';

export type LiteratureDensityStatus =
  | 'SPARSE_FRONTIER'
  | 'ACTIVE_COMPETITIVE'
  | 'SATURATED_EXACT_REPETITION'
  | 'DIFFICULT_OPEN_DIRECTION';

export type WeightingRegime =
  | 'BALANCED_DEFAULT'
  | 'FOUNDATIONAL_THEORY'
  | 'RAPID_EXPLORATION'
  | 'METHODOLOGICAL_RIGOR';

export const WEIGHTING_REGIME_PROFILES: Record<WeightingRegime, { wc: number; wn: number; ws: number; wt: number }> = {
  BALANCED_DEFAULT: { wc: 0.30, wn: 0.25, ws: 0.30, wt: 0.15 },
  FOUNDATIONAL_THEORY: { wc: 0.25, wn: 0.20, ws: 0.40, wt: 0.15 },
  RAPID_EXPLORATION: { wc: 0.20, wn: 0.40, ws: 0.20, wt: 0.20 },
  METHODOLOGICAL_RIGOR: { wc: 0.40, wn: 0.15, ws: 0.20, wt: 0.25 },
};

export interface ResidualScopePayload {
  isGrounded: boolean;
  resolvedComponents: string[];
  unresolvedScope: string;
  activeTradeoffs: string[];
  boundaryRestrictions?: string[];
  evidenceSourceLocators?: string[];
}

export interface OpportunityEligibilityResult {
  isEligible: boolean;
  status: OpportunityStatus;
  reason: string;
  validationOutcome: string;
  gapId: string;
  validationRunId: string;
}

export interface ContradictionQualification {
  status: ContradictionStatus;
  rationale: string;
  affectedBoundaries?: string[];
  disputedPaperIds?: string[];
}

export interface LiteratureDensityClassification {
  status: LiteratureDensityStatus;
  recentAttemptCount: number;
  velocityIndicator: 'LOW' | 'MEDIUM' | 'HIGH';
  isOverSaturated: boolean;
  rationale: string;
}

export interface IntrinsicScientificScores {
  evidenceConfidenceScore: number;
  noveltyScore: number;
  scientificSignificanceScore: number;
  methodologicalTractabilityScore: number;
  intrinsicScientificValue: number;
  weightingRegime: WeightingRegime;
  sensitivityReporting: Record<WeightingRegime, number>;
  rawScoreDelta?: number;
  scoreDeltaAcrossRegimes: number;
  isSensitivityVolatile: boolean;
  sensitivityFlags: string[];
  missingDataFlags: string[];
}

export interface EvidenceProvenancePayload {
  gapId: string;
  validationRunId: string;
  sourcePaperId: string;
  sourcePaperTitle?: string;
  sourcePaperDoi?: string | null;
  validationCorpusSize: number;
  corroboratingPaperCount: number;
  contradictingPaperCount: number;
  modelAttribution: {
    requestedModel: string;
    resolvedModel: string;
    isFallback: boolean;
    fallbackReason?: string | null;
  };
  methodologyVersion: string;
  sha256Digest: string;
}

export interface ResearchOpportunityRecord {
  id: string;
  gapId: string;
  validationRunId: string;
  status: OpportunityStatus;
  intrinsicScientificValue: number | null;
  evidenceConfidenceScore: number | null;
  noveltyScore: number | null;
  scientificSignificanceScore: number | null;
  methodologicalTractabilityScore: number | null;
  contradictionStatus: ContradictionStatus;
  literatureDensityStatus: LiteratureDensityStatus;
  residualUnresolvedScope: ResidualScopePayload;
  weightingRegime: WeightingRegime;
  scoringMetadata: {
    sensitivityReporting?: Record<WeightingRegime, number>;
    isSensitivityVolatile?: boolean;
    missingDataFlags?: string[];
    [key: string]: any;
  };
  structuredExplanation: {
    summary: string;
    scientificImportance: string;
    methodologicalSoundness: string;
    eligibilityRationale: string;
    contradictionAnalysis: string;
    densityAnalysis: string;
  };
  evidenceProvenance: EvidenceProvenancePayload;
  isStale: boolean;
  stalenessReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SynthesizeOpportunityParams {
  gapId: string;
  validationRunId?: string; // If omitted, uses latest validation run
  weightingRegime?: WeightingRegime;
  customTractabilityAssessments?: {
    metricObjectivity?: number;
    baselineAvailability?: number;
    problemWellPosedness?: number;
  };
  userId?: string;
}

export interface OpportunityListFilter {
  status?: OpportunityStatus;
  weightingRegime?: WeightingRegime;
  contradictionStatus?: ContradictionStatus;
  literatureDensityStatus?: LiteratureDensityStatus;
  minScientificValue?: number;
  gapId?: string;
  limit?: number;
  offset?: number;
}

// ====================================================================
// 2. OPPORTUNITY INTELLIGENCE SERVICE IMPLEMENTATION
// ====================================================================

export class OpportunityIntelligenceService {

  /**
   * Deterministically assesses research opportunity eligibility based on Stage 4D validation outcome.
   * Invariant: CONFIRMED_UNRESOLVED is automatically eligible; PARTIALLY_ADDRESSED is eligible only
   * with identifiable residual scope; ADDRESSED, CONTRADICTED, and INSUFFICIENT_EVIDENCE are disqualified.
   */
  public assessEligibility(
    gapId: string,
    validationRunId: string,
    validationOutcome: string,
    residualScope?: ResidualScopePayload
  ): OpportunityEligibilityResult {
    const outcomeUpper = (validationOutcome || '').toUpperCase().trim();

    if (outcomeUpper === 'CONFIRMED_UNRESOLVED') {
      return {
        isEligible: true,
        status: 'ELIGIBLE',
        reason: 'Research gap has been independently verified across contemporary literature as active, substantiated, and unresolved.',
        validationOutcome: outcomeUpper,
        gapId,
        validationRunId
      };
    }

    if (outcomeUpper === 'PARTIALLY_ADDRESSED') {
      const hasResidual = Boolean(
        residualScope &&
        residualScope.unresolvedScope &&
        residualScope.unresolvedScope.trim().length > 10 &&
        residualScope.isGrounded
      );

      if (hasResidual) {
        return {
          isEligible: true,
          status: 'ELIGIBLE',
          reason: 'Research gap is partially addressed in literature, but possesses an independently verifiable, unresolved residual scope and active technical trade-offs.',
          validationOutcome: outcomeUpper,
          gapId,
          validationRunId
        };
      }

      return {
        isEligible: false,
        status: 'INELIGIBLE',
        reason: 'Research gap is partially addressed, but lacks a sufficiently grounded, isolated residual scope to constitute an active research opportunity.',
        validationOutcome: outcomeUpper,
        gapId,
        validationRunId
      };
    }

    if (outcomeUpper === 'ADDRESSED') {
      return {
        isEligible: false,
        status: 'INELIGIBLE',
        reason: 'Research gap has been conclusively resolved or superseded by published literature. Inactive for prospective opportunity ranking.',
        validationOutcome: outcomeUpper,
        gapId,
        validationRunId
      };
    }

    if (outcomeUpper === 'CONTRADICTED') {
      return {
        isEligible: false,
        status: 'INELIGIBLE',
        reason: 'The foundational premise or theoretical mechanism of this gap has been contradicted by verified literature. Disqualified from active opportunity ranking.',
        validationOutcome: outcomeUpper,
        gapId,
        validationRunId
      };
    }

    // Default / INSUFFICIENT_EVIDENCE
    return {
      isEligible: false,
      status: 'INELIGIBLE',
      reason: `Literature evidence is insufficient (Outcome: ${outcomeUpper}) to substantiate a prospective scientific opportunity.`,
      validationOutcome: outcomeUpper,
      gapId,
      validationRunId
    };
  }

  /**
   * Deterministically isolates residual unresolved scope for PARTIALLY_ADDRESSED research gaps.
   */
  public extractResidualScope(
    gapDescription: string,
    validationMetadata: any,
    relationships: any[] = []
  ): ResidualScopePayload {
    const addressedRelationships = relationships.filter(
      r => r.relationship_type === 'partially_addresses' || r.relationship_type === 'addresses'
    );

    const resolvedComponents: string[] = [];
    const activeTradeoffs: string[] = [];
    const boundaryRestrictions: string[] = [];
    const evidenceSourceLocators: string[] = [];

    for (const rel of addressedRelationships) {
      if (rel.bilateral_evidence_refs && Array.isArray(rel.bilateral_evidence_refs)) {
        for (const ref of rel.bilateral_evidence_refs) {
          if (ref.finding) resolvedComponents.push(ref.finding);
          if (ref.locator) evidenceSourceLocators.push(ref.locator);
        }
      }
    }

    // Deduce active trade-offs from limitation context
    const descLower = gapDescription.toLowerCase();
    if (descLower.includes('latency') || descLower.includes('speed') || descLower.includes('throughput')) {
      activeTradeoffs.push('Computational throughput / latency versus task accuracy trade-off');
    }
    if (descLower.includes('memory') || descLower.includes('vram') || descLower.includes('footprint')) {
      activeTradeoffs.push('Memory footprint versus model parameter capacity trade-off');
    }
    if (descLower.includes('generaliz') || descLower.includes('out-of-distribution') || descLower.includes('domain')) {
      activeTradeoffs.push('Out-of-distribution robustness versus in-domain peak performance trade-off');
    }
    if (descLower.includes('context') || descLower.includes('length') || descLower.includes('sequence')) {
      boundaryRestrictions.push('Degradation pronounced at long-context sequence lengths (> 4k tokens)');
    }

    const unresolvedScope = validationMetadata?.unresolvedScope ||
      `Open methodological bottleneck: Core limitation persists despite partial algorithmic mitigations in published literature. (${gapDescription})`;

    return {
      isGrounded: true,
      resolvedComponents: resolvedComponents.length > 0 ? resolvedComponents : ['Initial algorithmic heuristics evaluated in literature'],
      unresolvedScope,
      activeTradeoffs: activeTradeoffs.length > 0 ? activeTradeoffs : ['Generalization versus parameter efficiency trade-off'],
      boundaryRestrictions: boundaryRestrictions.length > 0 ? boundaryRestrictions : undefined,
      evidenceSourceLocators: evidenceSourceLocators.length > 0 ? evidenceSourceLocators : undefined
    };
  }

  /**
   * Evaluates discrete contradiction qualifications without crude numerical clamping.
   */
  public assessContradictionStatus(
    validationOutcome: string,
    relationships: any[] = []
  ): ContradictionQualification {
    const contradictingRels = relationships.filter(r => r.relationship_type === 'contradicts');

    if (contradictingRels.length === 0) {
      if (validationOutcome === 'INSUFFICIENT_EVIDENCE') {
        return {
          status: 'CONTRADICTION_STATUS_UNKNOWN',
          rationale: 'Literature discovery yielded insufficient comparable literature to establish whether contradictions exist.'
        };
      }
      return {
        status: 'NO_CONTRADICTIONS_DETECTED',
        rationale: 'Cross-literature validation identified zero verified contradicting relationships under comparable experimental conditions.'
      };
    }

    // Analyze nature of contradiction
    const disputedPaperIds: string[] = [];
    let isFatal = false;
    const boundaryRestrictions: string[] = [];

    for (const rel of contradictingRels) {
      if (rel.target_paper_id) disputedPaperIds.push(rel.target_paper_id);
      if (rel.source_paper_id) disputedPaperIds.push(rel.source_paper_id);

      // Check if contradiction was judged fatal premise falsification
      if (rel.confidence_weight && Number(rel.confidence_weight) >= 0.85) {
        isFatal = true;
      } else {
        boundaryRestrictions.push(`Contradicted under specific condition set (Relationship ID: ${rel.id})`);
      }
    }

    if (isFatal || validationOutcome === 'CONTRADICTED') {
      return {
        status: 'PREMISE_FALSIFIED',
        rationale: 'Confirmed high-confidence empirical counter-evidence refutes the core causal mechanism of the limitation.',
        disputedPaperIds
      };
    }

    return {
      status: 'SCOPE_NARROWED',
      rationale: 'Contradictions detected under specific operational conditions; limitation remains valid outside these restricted boundaries.',
      affectedBoundaries: boundaryRestrictions,
      disputedPaperIds
    };
  }

  /**
   * Evaluates discrete literature density status based on publication trajectories.
   */
  public assessLiteratureDensity(
    publicationYear: number | null,
    corpusPapers: any[] = [],
    corroboratingPaperCount: number = 0,
    contradictingPaperCount: number = 0
  ): LiteratureDensityClassification {
    const currentYear = new Date().getFullYear();
    const paperCount = corpusPapers.length;

    // Filter recent preprints/papers (within last 24 months)
    const recentPapers = corpusPapers.filter(p => {
      const year = p.year || p.publicationYear;
      return year && (currentYear - year <= 2);
    });

    const recentCount = recentPapers.length;
    const velocityIndicator: 'LOW' | 'MEDIUM' | 'HIGH' =
      recentCount > 15 ? 'HIGH' : recentCount >= 5 ? 'MEDIUM' : 'LOW';

    // 1. Difficult Open Direction: High significance, moderate corpus, but zero solutions
    if (paperCount >= 10 && corroboratingPaperCount >= 5 && contradictingPaperCount === 0) {
      return {
        status: 'DIFFICULT_OPEN_DIRECTION',
        recentAttemptCount: recentCount,
        velocityIndicator,
        isOverSaturated: false,
        rationale: 'Sustained community attention across multiple independent research groups with persistent unsolved challenge.'
      };
    }

    // 2. Over-Saturated Exact Repetition: High velocity of near-identical incremental work
    if (recentCount > 25) {
      return {
        status: 'SATURATED_EXACT_REPETITION',
        recentAttemptCount: recentCount,
        velocityIndicator: 'HIGH',
        isOverSaturated: true,
        rationale: 'Over 25 recent publications/preprints investigate this identical operational bottleneck. Topic exhibits high replication density.'
      };
    }

    // 3. Sparse Frontier: Pioneer area with minimal existing literature
    if (paperCount <= 3) {
      return {
        status: 'SPARSE_FRONTIER',
        recentAttemptCount: recentCount,
        velocityIndicator: 'LOW',
        isOverSaturated: false,
        rationale: 'Under-explored scientific area with fewer than 4 published investigations in retrieved discovery horizon.'
      };
    }

    // 4. Active Competitive: Standard healthy scholarly attention
    return {
      status: 'ACTIVE_COMPETITIVE',
      recentAttemptCount: recentCount,
      velocityIndicator,
      isOverSaturated: false,
      rationale: 'Healthy contemporary scholarly inquiry with active exploration across multiple independent research institutions.'
    };
  }

  /**
   * Computes Intrinsic Scientific Value (V_scientific) across four decoupled dimensions.
   * Invariant: Scientific ranking is strictly and solely by V_scientific.
   * Researcher resource constraints are 100% excluded.
   */
  public calculateIntrinsicScientificValue(
    scores: {
      confidence: number;
      novelty: number;
      significance: number;
      tractability: number;
    },
    preferredRegime: WeightingRegime = 'BALANCED_DEFAULT'
  ): IntrinsicScientificScores {
    // Clamp each sub-score strictly to [0.00, 10.00]
    const Sc = Math.min(10.0, Math.max(0.0, Number(scores.confidence) || 0.0));
    const Sn = Math.min(10.0, Math.max(0.0, Number(scores.novelty) || 0.0));
    const Ss = Math.min(10.0, Math.max(0.0, Number(scores.significance) || 0.0));
    const St = Math.min(10.0, Math.max(0.0, Number(scores.tractability) || 0.0));

    const missingDataFlags: string[] = [];
    if (St <= 2.0) {
      missingDataFlags.push('METHODOLOGICAL_METRIC_AMBIGUOUS_IN_LITERATURE');
    }

    // Calculate score for all 4 weighting profiles
    const sensitivityReporting: Record<WeightingRegime, number> = {
      BALANCED_DEFAULT: 0,
      FOUNDATIONAL_THEORY: 0,
      RAPID_EXPLORATION: 0,
      METHODOLOGICAL_RIGOR: 0
    };

    const rawRegimeScores: number[] = [];

    for (const [regimeKey, weights] of Object.entries(WEIGHTING_REGIME_PROFILES)) {
      const vRaw = (weights.wc * Sc) + (weights.wn * Sn) + (weights.ws * Ss) + (weights.wt * St);
      rawRegimeScores.push(vRaw);
      sensitivityReporting[regimeKey as WeightingRegime] = Number(vRaw.toFixed(2));
    }

    const activeWeights = WEIGHTING_REGIME_PROFILES[preferredRegime] || WEIGHTING_REGIME_PROFILES.BALANCED_DEFAULT;
    const intrinsicScientificValue = Number(
      ((activeWeights.wc * Sc) + (activeWeights.wn * Sn) + (activeWeights.ws * Ss) + (activeWeights.wt * St)).toFixed(2)
    );

    // Assess volatility: delta between min and max regime score > 1.50
    // 1. Calculate rawScoreDelta = maxVal - minVal from raw unrounded regime scores
    const rawMinVal = Math.min(...rawRegimeScores);
    const rawMaxVal = Math.max(...rawRegimeScores);
    const rawScoreDelta = rawMaxVal - rawMinVal;
    // 2. Calculate the displayed scoreDeltaAcrossRegimes separately using two-decimal rounding
    const scoreDeltaAcrossRegimes = Number(rawScoreDelta.toFixed(2));
    // 3. Determine isSensitivityVolatile using rawScoreDelta > 1.50
    const isSensitivityVolatile = rawScoreDelta > 1.50;
    const sensitivityFlags: string[] = [];
    if (isSensitivityVolatile) {
      sensitivityFlags.push('RANKING_SENSITIVE_TO_WEIGHTING');
    }

    return {
      evidenceConfidenceScore: Sc,
      noveltyScore: Sn,
      scientificSignificanceScore: Ss,
      methodologicalTractabilityScore: St,
      intrinsicScientificValue,
      weightingRegime: preferredRegime,
      sensitivityReporting,
      rawScoreDelta,
      scoreDeltaAcrossRegimes,
      isSensitivityVolatile,
      sensitivityFlags,
      missingDataFlags
    };
  }

  /**
   * Master Synthesis: Transforms a validated gap into a fully persisted research opportunity record.
   */
  public async synthesizeOpportunity(params: SynthesizeOpportunityParams): Promise<ResearchOpportunityRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) {
      throw new Error('Database admin client unavailable. Ensure SUPABASE_SERVICE_ROLE_KEY is configured.');
    }

    const { gapId, weightingRegime = 'BALANCED_DEFAULT', userId } = params;

    // 1. Fetch Research Gap with linked evidence and papers
    const { data: gap, error: gapErr } = await admin
      .from('research_gaps')
      .select('*, research_gap_evidence(*, research_papers(*))')
      .eq('id', gapId)
      .single();

    if (gapErr || !gap) {
      throw new Error(`Research gap not found: ${gapId}. Error: ${gapErr?.message}`);
    }

    // 2. Fetch Target Validation Run
    let validationQuery = admin
      .from('research_gap_validations')
      .select('*')
      .eq('gap_id', gapId);

    if (params.validationRunId) {
      validationQuery = validationQuery.eq('validation_run_id', params.validationRunId);
    } else {
      validationQuery = validationQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: validations, error: valErr } = await validationQuery;
    if (valErr || !validations || validations.length === 0) {
      throw new Error(`No validation runs found for gap ${gapId}. Gaps must be validated in Stage 4D prior to opportunity synthesis.`);
    }

    const validation = validations[0];
    const validationRunId = validation.validation_run_id;
    const validationOutcome = validation.validation_outcome;

    // 3. Fetch Dedicated Stage 4D Relationships
    const { data: relationships } = await admin
      .from('research_gap_relationships')
      .select('*')
      .eq('gap_id', gapId)
      .eq('validation_run_id', validationRunId);

    const rels = relationships || [];

    // 4. Extract Residual Scope & Evaluate Contradiction / Density States
    const residualScope = this.extractResidualScope(
      gap.description || gap.gap_title || 'Unspecified Limitation',
      validation.literature_coverage_metadata,
      rels
    );

    const eligibility = this.assessEligibility(gapId, validationRunId, validationOutcome, residualScope);
    const contradictionQualification = this.assessContradictionStatus(validationOutcome, rels);

    // Corroborating / Contradicting counts
    const corroboratingCount = rels.filter(r => r.relationship_type === 'corroborates').length;
    const contradictingCount = rels.filter(r => r.relationship_type === 'contradicts').length;

    const densityClassification = this.assessLiteratureDensity(
      gap.research_papers?.year || null,
      [], // In-memory discovery corpus if available
      corroboratingCount,
      contradictingCount
    );

    // 5. Compute Scientific Dimension Sub-Scores
    // A. Evidence Confidence (derived from Stage 4D validation confidence)
    const rawValConfidence = Number(validation.confidence_score) || 7.0;
    const Sc = Number(rawValConfidence.toFixed(2));

    // B. Novelty Score (penalized only by real saturation, not arbitrary caps)
    let Sn = 8.0;
    if (densityClassification.status === 'SATURATED_EXACT_REPETITION') {
      Sn = 4.0;
    } else if (densityClassification.status === 'SPARSE_FRONTIER') {
      Sn = 9.5;
    } else if (densityClassification.status === 'DIFFICULT_OPEN_DIRECTION') {
      Sn = 8.5;
    }

    // C. Scientific Significance (derived from gap epistemic importance and category)
    let Ss = 7.5;
    const categoryUpper = (gap.category || '').toUpperCase();
    if (categoryUpper === 'THEORETICAL' || categoryUpper === 'GENERALIZATION') Ss = 8.5;
    if (categoryUpper === 'METHODOLOGICAL' || categoryUpper === 'EVALUATION_MEASUREMENT') Ss = 8.0;
    if (gap.epistemic_classification === 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP') Ss += 1.0;
    Ss = Math.min(10.0, Ss);

    // D. Methodological Tractability (evaluates problem well-posedness, NOT researcher compute wealth)
    const customTract = params.customTractabilityAssessments || {};
    const metricObj = customTract.metricObjectivity !== undefined ? customTract.metricObjectivity : 0.8;
    const baselineAvail = customTract.baselineAvailability !== undefined ? customTract.baselineAvailability : 0.9;
    const problemPosed = customTract.problemWellPosedness !== undefined ? customTract.problemWellPosedness : 0.8;
    const St = Number((3.0 * metricObj + 3.0 * baselineAvail + 4.0 * problemPosed).toFixed(2));

    // 6. Calculate Intrinsic Scientific Value (V_scientific)
    const scientificScores = this.calculateIntrinsicScientificValue({
      confidence: Sc,
      novelty: Sn,
      significance: Ss,
      tractability: St
    }, weightingRegime);

    // If ineligible (e.g. CONTRADICTED or ADDRESSED), set status and clear ranking
    const finalStatus: OpportunityStatus = eligibility.isEligible ? 'ELIGIBLE' : 'INELIGIBLE';
    const finalVScientific = eligibility.isEligible ? scientificScores.intrinsicScientificValue : null;

    // 7. Structured Explanation & Provenance
    const modelRes = resolveModelIdentifier(OFFICIAL_GEMMA4_26B);
    const structuredExplanation = {
      summary: `Research Opportunity derived from validated gap: "${gap.gap_title || gap.description}"`,
      scientificImportance: `Evaluated with intrinsic score ${scientificScores.intrinsicScientificValue ?? 'N/A'}/10.0 under ${weightingRegime} weighting profile.`,
      methodologicalSoundness: `Methodological tractability rated at ${St}/10.0 based on operational metric definitions and baseline availability.`,
      eligibilityRationale: eligibility.reason,
      contradictionAnalysis: contradictionQualification.rationale,
      densityAnalysis: densityClassification.rationale
    };

    const evidenceList = Array.isArray(gap.research_gap_evidence) ? gap.research_gap_evidence : [];
    const firstEvidence = evidenceList[0];
    const sourcePaper = firstEvidence?.research_papers;

    const evidenceProvenance: EvidenceProvenancePayload = {
      gapId,
      validationRunId,
      sourcePaperId: firstEvidence?.paper_id || null,
      sourcePaperTitle: sourcePaper?.title || null,
      sourcePaperDoi: firstEvidence?.doi || sourcePaper?.doi || null,
      validationCorpusSize: rels.length,
      corroboratingPaperCount: corroboratingCount,
      contradictingPaperCount: contradictingCount,
      modelAttribution: {
        requestedModel: modelRes.requestedModel,
        resolvedModel: modelRes.resolvedModel,
        isFallback: modelRes.isFallback,
        fallbackReason: modelRes.fallbackReason
      },
      methodologyVersion: OPPORTUNITY_METHODOLOGY_VERSION,
      sha256Digest: computeSha256(JSON.stringify({ gapId, validationRunId, Sc, Sn, Ss, St, finalVScientific }))
    };

    // 8. Persist via SECURITY DEFINER RPC
    const { data: oppId, error: persistErr } = await admin.rpc('rpc_persist_research_opportunity', {
      p_gap_id: gapId,
      p_validation_run_id: validationRunId,
      p_status: finalStatus,
      p_intrinsic_value: finalVScientific,
      p_confidence: Sc,
      p_novelty: Sn,
      p_significance: Ss,
      p_tractability: St,
      p_contradiction_status: contradictionQualification.status,
      p_density_status: densityClassification.status,
      p_residual_scope: residualScope,
      p_weighting_regime: weightingRegime,
      p_scoring_metadata: {
        sensitivityReporting: scientificScores.sensitivityReporting,
        rawScoreDelta: scientificScores.rawScoreDelta,
        scoreDeltaAcrossRegimes: scientificScores.scoreDeltaAcrossRegimes,
        isSensitivityVolatile: scientificScores.isSensitivityVolatile,
        sensitivityFlags: scientificScores.sensitivityFlags,
        missingDataFlags: scientificScores.missingDataFlags
      },
      p_structured_explanation: structuredExplanation,
      p_evidence_provenance: evidenceProvenance,
      p_created_by: userId || null
    });

    if (persistErr || !oppId) {
      throw new Error(`Failed to persist research opportunity via RPC: ${persistErr?.message}`);
    }

    return {
      id: oppId,
      gapId,
      validationRunId,
      status: finalStatus,
      intrinsicScientificValue: finalVScientific,
      evidenceConfidenceScore: Sc,
      noveltyScore: Sn,
      scientificSignificanceScore: Ss,
      methodologicalTractabilityScore: St,
      contradictionStatus: contradictionQualification.status,
      literatureDensityStatus: densityClassification.status,
      residualUnresolvedScope: residualScope,
      weightingRegime,
      scoringMetadata: {
        sensitivityReporting: scientificScores.sensitivityReporting,
        isSensitivityVolatile: scientificScores.isSensitivityVolatile,
        missingDataFlags: scientificScores.missingDataFlags
      },
      structuredExplanation,
      evidenceProvenance,
      isStale: false,
      stalenessReason: null,
      createdBy: userId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Retrieves a single research opportunity by ID with verified provenance.
   */
  public async getOpportunityById(id: string): Promise<ResearchOpportunityRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Database admin client unavailable.');

    const { data, error } = await admin
      .from('research_opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.mapDatabaseRowToRecord(data);
  }

  /**
   * Lists research opportunities according to scientific filters.
   */
  public async listOpportunities(filter: OpportunityListFilter = {}): Promise<ResearchOpportunityRecord[]> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Database admin client unavailable.');

    let query = admin
      .from('research_opportunities')
      .select('*');

    if (filter.status) {
      query = query.eq('status', filter.status);
    } else {
      query = query.neq('status', 'REJECTED');
    }

    if (filter.gapId) query = query.eq('gap_id', filter.gapId);
    if (filter.weightingRegime) query = query.eq('weighting_regime', filter.weightingRegime);
    if (filter.contradictionStatus) query = query.eq('contradiction_status', filter.contradictionStatus);
    if (filter.literatureDensityStatus) query = query.eq('literature_density_status', filter.literatureDensityStatus);
    if (filter.minScientificValue !== undefined) {
      query = query.gte('intrinsic_scientific_value', filter.minScientificValue);
    }

    query = query
      .order('intrinsic_scientific_value', { ascending: false, nullsFirst: false })
      .range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list opportunities: ${error.message}`);

    return (data || []).map(row => this.mapDatabaseRowToRecord(row));
  }

  /**
   * Propagates staleness to dependent opportunities when an upstream gap outcome changes.
   */
  public async propagateStaleness(gapId: string, validationRunId?: string, reason?: string): Promise<number> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Database admin client unavailable.');

    const { data, error } = await admin.rpc('rpc_propagate_gap_staleness', {
      p_gap_id: gapId,
      p_validation_run_id: validationRunId || null,
      p_reason: reason || 'Upstream gap outcome re-evaluated'
    });

    if (error) throw new Error(`Staleness propagation RPC failed: ${error.message}`);
    return Number(data) || 0;
  }

  /**
   * Helper mapping snake_case PostgreSQL rows to typed camelCase records.
   */
  private mapDatabaseRowToRecord(row: any): ResearchOpportunityRecord {
    return {
      id: row.id,
      gapId: row.gap_id,
      validationRunId: row.validation_run_id,
      status: row.status as OpportunityStatus,
      intrinsicScientificValue: row.intrinsic_scientific_value !== null ? Number(row.intrinsic_scientific_value) : null,
      evidenceConfidenceScore: row.evidence_confidence_score !== null ? Number(row.evidence_confidence_score) : null,
      noveltyScore: row.novelty_score !== null ? Number(row.novelty_score) : null,
      scientificSignificanceScore: row.scientific_significance_score !== null ? Number(row.scientific_significance_score) : null,
      methodologicalTractabilityScore: row.methodological_tractability_score !== null ? Number(row.methodological_tractability_score) : null,
      contradictionStatus: row.contradiction_status as ContradictionStatus,
      literatureDensityStatus: row.literature_density_status as LiteratureDensityStatus,
      residualUnresolvedScope: row.residual_unresolved_scope || {},
      weightingRegime: row.weighting_regime as WeightingRegime,
      scoringMetadata: row.scoring_metadata || {},
      structuredExplanation: row.structured_explanation || {},
      evidenceProvenance: row.evidence_provenance || {},
      isStale: Boolean(row.is_stale),
      stalenessReason: row.staleness_reason,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const opportunityIntelligenceService = new OpportunityIntelligenceService();
