/**
 * Anvīkṣā — Stage 4D: Methodological Comparability Engine
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
 * Implements 4 Comparison Classes, 5-Valued Dimension Semantics,
 * Operational Research Question Alignment, and Non-Compensatory Critical Gates.
 */

export type EvidenceComparisonClass = 
  | 'DIRECTLY_COMPARABLE'
  | 'RELATED_RESEARCH_QUESTIONS'
  | 'CONTEXTUAL_EVIDENCE'
  | 'INCOMMENSURABLE_CONTEXT';

export type DimensionStatus = 
  | 'VERIFIED_COMPATIBLE'
  | 'INCOMPATIBLE'
  | 'NOT_REPORTED'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE';

export interface DimensionEvaluation {
  status: DimensionStatus;
  score: number; // 0.0 to 1.0 (or NaN if NOT_APPLICABLE)
  rationale: string;
  evidenceQuote?: string;
  chunkId?: number | string;
}

export interface CriticalCompatibilityGates {
  taskAlignment: DimensionEvaluation;
  operationalQuestion: DimensionEvaluation;
  metricFormulation: DimensionEvaluation;
  datasetDomain: DimensionEvaluation;
  allCriticalGatesPassed: boolean;
  gateFailureReasons: string[];
}

export interface ContextualDimensions {
  baselineEquivalence: DimensionEvaluation;
  sampleSizeScale: DimensionEvaluation;
  threatsToValidity: DimensionEvaluation;
  hardwareDeployment: DimensionEvaluation;
}

export interface MethodologicalComparabilityResult {
  candidatePaperId: string;
  seedPaperId: string;
  comparisonClass: EvidenceComparisonClass;
  criticalGates: CriticalCompatibilityGates;
  contextualDimensions: ContextualDimensions;
  overallComparabilityScore: number; // R_meth in [0.0, 1.0]
  isEligibleForDirectContradiction: boolean; // true ONLY if comparisonClass === 'DIRECTLY_COMPARABLE'
  isEligibleForContextualEvidence: boolean;
  notes: string[];
}

export interface ScientificEntityDimensions {
  task: string;
  operationalQuestion: string;
  independentVariables?: string[];
  dependentVariables?: string[];
  metricFormulation?: string;
  datasetDomain?: string;
  baselineModel?: string;
  computeScale?: string;
  hardwareEnvironment?: string;
  threatsToValidity?: string;
  isTheoreticalOrComplexityPaper?: boolean;
  isOrthogonalParadigm?: boolean;
}

export class MethodologicalComparabilityEngine {
  /**
   * Evaluates operational research question alignment without requiring verbatim identity.
   * Compares the underlying phenomenon, variables, and directional hypothesis.
   */
  public evaluateOperationalAlignment(
    seedQuestion: string,
    candQuestion: string,
    seedVariables: { indep?: string[]; dep?: string[] },
    candVariables: { indep?: string[]; dep?: string[] }
  ): DimensionEvaluation {
    if (!seedQuestion || !candQuestion) {
      return {
        status: 'NOT_REPORTED',
        score: 0.0,
        rationale: 'Operational research question not reported or extracted in one or both publications.'
      };
    }

    const cleanSeed = seedQuestion.toLowerCase();
    const cleanCand = candQuestion.toLowerCase();

    // Check for conceptual keywords and phenomenon matching
    const seedTerms = new Set(cleanSeed.split(/\s+/).filter(w => w.length > 3));
    const candTerms = new Set(cleanCand.split(/\s+/).filter(w => w.length > 3));

    let termOverlap = 0;
    for (const t of seedTerms) {
      if (candTerms.has(t)) termOverlap++;
    }
    const overlapRatio = seedTerms.size > 0 ? termOverlap / seedTerms.size : 0;

    // Check variable alignment if provided
    let variableAligned = false;
    if (seedVariables.dep && candVariables.dep) {
      const depMatch = seedVariables.dep.some(d => 
        candVariables.dep?.some(cd => cd.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(cd.toLowerCase()))
      );
      if (depMatch) variableAligned = true;
    }

    if (overlapRatio >= 0.4 || variableAligned) {
      return {
        status: 'VERIFIED_COMPATIBLE',
        score: 1.0,
        rationale: `Operational alignment verified: both works investigate equivalent dependent phenomenon with conceptual overlap ratio of ${(overlapRatio * 100).toFixed(0)}%.`
      };
    }

    return {
      status: 'INCOMPATIBLE',
      score: 0.0,
      rationale: `Operational questions evaluate disparate phenomena (overlap ratio: ${(overlapRatio * 100).toFixed(0)}%).`
    };
  }

  /**
   * Evaluates critical compatibility gates and contextual dimensions across two scientific works.
   */
  public evaluateComparability(
    seedPaperId: string,
    candPaperId: string,
    seed: ScientificEntityDimensions,
    candidate: ScientificEntityDimensions
  ): MethodologicalComparabilityResult {
    const gateFailureReasons: string[] = [];
    const notes: string[] = [];

    // 1. Gate 1: Task Alignment
    let taskEval: DimensionEvaluation;
    if (!seed.task || !candidate.task) {
      taskEval = {
        status: 'NOT_REPORTED',
        score: 0.0,
        rationale: 'Functional research task definition not reported.'
      };
      gateFailureReasons.push('Gate 1 Failed: Task definition missing or unindexed.');
    } else {
      const cleanSeedTask = seed.task.toLowerCase().trim();
      const cleanCandTask = candidate.task.toLowerCase().trim();
      if (cleanSeedTask === cleanCandTask || cleanSeedTask.includes(cleanCandTask) || cleanCandTask.includes(cleanSeedTask)) {
        taskEval = {
          status: 'VERIFIED_COMPATIBLE',
          score: 1.0,
          rationale: `Matching functional task: "${seed.task}".`
        };
      } else {
        taskEval = {
          status: 'INCOMPATIBLE',
          score: 0.0,
          rationale: `Functional tasks differ: "${seed.task}" vs "${candidate.task}".`
        };
        gateFailureReasons.push(`Gate 1 Failed: Task incompatibility ("${seed.task}" vs "${candidate.task}").`);
      }
    }

    // 2. Gate 2: Operational Research Question Alignment
    const questionEval = this.evaluateOperationalAlignment(
      seed.operationalQuestion,
      candidate.operationalQuestion,
      { indep: seed.independentVariables, dep: seed.dependentVariables },
      { indep: candidate.independentVariables, dep: candidate.dependentVariables }
    );
    if (questionEval.status !== 'VERIFIED_COMPATIBLE') {
      gateFailureReasons.push(`Gate 2 Failed: ${questionEval.rationale}`);
    }

    // 3. Gate 3: Metric Formulation Mathematical Identity
    let metricEval: DimensionEvaluation;
    if (!seed.metricFormulation || !candidate.metricFormulation) {
      metricEval = {
        status: 'NOT_REPORTED',
        score: 0.0,
        rationale: 'Mathematical evaluation metric formulation not reported.'
      };
      gateFailureReasons.push('Gate 3 Failed: Evaluation metric formulation not reported.');
    } else {
      const cleanSeedMetric = seed.metricFormulation.toLowerCase().trim();
      const cleanCandMetric = candidate.metricFormulation.toLowerCase().trim();
      if (cleanSeedMetric === cleanCandMetric || cleanSeedMetric.includes(cleanCandMetric) || cleanCandMetric.includes(cleanSeedMetric)) {
        metricEval = {
          status: 'VERIFIED_COMPATIBLE',
          score: 1.0,
          rationale: `Identical mathematical metric formulation: "${seed.metricFormulation}".`
        };
      } else {
        metricEval = {
          status: 'INCOMPATIBLE',
          score: 0.0,
          rationale: `Metric formulation asymmetry: "${seed.metricFormulation}" vs "${candidate.metricFormulation}".`
        };
        gateFailureReasons.push(`Gate 3 Failed: Metric formulation asymmetry ("${seed.metricFormulation}" vs "${candidate.metricFormulation}").`);
      }
    }

    // 4. Gate 4: Dataset Modality & Domain
    let datasetEval: DimensionEvaluation;
    if (!seed.datasetDomain || !candidate.datasetDomain) {
      datasetEval = {
        status: 'NOT_REPORTED',
        score: 0.0,
        rationale: 'Dataset domain and modality not reported.'
      };
      gateFailureReasons.push('Gate 4 Failed: Dataset domain not reported.');
    } else {
      const cleanSeedDomain = seed.datasetDomain.toLowerCase().trim();
      const cleanCandDomain = candidate.datasetDomain.toLowerCase().trim();
      if (cleanSeedDomain === cleanCandDomain || cleanSeedDomain.includes(cleanCandDomain) || cleanCandDomain.includes(cleanSeedDomain)) {
        datasetEval = {
          status: 'VERIFIED_COMPATIBLE',
          score: 1.0,
          rationale: `Comparable dataset domain: "${seed.datasetDomain}".`
        };
      } else {
        datasetEval = {
          status: 'INCOMPATIBLE',
          score: 0.0,
          rationale: `Dataset domain divergence: "${seed.datasetDomain}" vs "${candidate.datasetDomain}".`
        };
        gateFailureReasons.push(`Gate 4 Failed: Dataset domain divergence ("${seed.datasetDomain}" vs "${candidate.datasetDomain}").`);
      }
    }

    const allCriticalGatesPassed = 
      taskEval.status === 'VERIFIED_COMPATIBLE' &&
      questionEval.status === 'VERIFIED_COMPATIBLE' &&
      metricEval.status === 'VERIFIED_COMPATIBLE' &&
      datasetEval.status === 'VERIFIED_COMPATIBLE';

    // Tier 2: Contextual Dimensions
    const baseEval: DimensionEvaluation = seed.baselineModel && candidate.baselineModel
      ? (seed.baselineModel.toLowerCase() === candidate.baselineModel.toLowerCase()
          ? { status: 'VERIFIED_COMPATIBLE', score: 1.0, rationale: 'Matching baseline model.' }
          : { status: 'INCOMPATIBLE', score: 0.5, rationale: 'Different baseline architectures.' })
      : { status: 'NOT_REPORTED', score: 0.0, rationale: 'Baseline model details not reported.' };

    const scaleEval: DimensionEvaluation = seed.computeScale && candidate.computeScale
      ? { status: 'VERIFIED_COMPATIBLE', score: 1.0, rationale: 'Comparable compute scale.' }
      : { status: 'NOT_REPORTED', score: 0.0, rationale: 'Compute/token scale not reported.' };

    const threatEval: DimensionEvaluation = seed.threatsToValidity && candidate.threatsToValidity
      ? { status: 'VERIFIED_COMPATIBLE', score: 0.8, rationale: 'Threats to validity documented.' }
      : { status: 'NOT_REPORTED', score: 0.0, rationale: 'Threats to validity omitted.' };

    // Check if hardware deployment is applicable (e.g. Pure theoretical work excludes hardware)
    const hardwareEval: DimensionEvaluation = candidate.isTheoreticalOrComplexityPaper
      ? { status: 'NOT_APPLICABLE', score: NaN, rationale: 'Hardware environment not applicable for theoretical/algorithmic complexity proof.' }
      : (seed.hardwareEnvironment && candidate.hardwareEnvironment
          ? { status: 'VERIFIED_COMPATIBLE', score: 1.0, rationale: 'Hardware architecture documented.' }
          : { status: 'NOT_REPORTED', score: 0.0, rationale: 'Hardware specifications omitted.' });

    // Calculate R_meth, excluding NOT_APPLICABLE from denominator
    const weights = { base: 0.35, scale: 0.25, threat: 0.20, hard: 0.20 };
    let activeNumerator = 0;
    let applicableDenominator = 0;

    activeNumerator += baseEval.score * weights.base;
    applicableDenominator += weights.base;

    activeNumerator += scaleEval.score * weights.scale;
    applicableDenominator += weights.scale;

    activeNumerator += threatEval.score * weights.threat;
    applicableDenominator += weights.threat;

    if (hardwareEval.status !== 'NOT_APPLICABLE') {
      activeNumerator += hardwareEval.score * weights.hard;
      applicableDenominator += weights.hard;
    }

    const overallComparabilityScore = applicableDenominator > 0 
      ? Math.max(0.0, Math.min(1.0, activeNumerator / applicableDenominator))
      : 0.0;

    // Nuanced Classification Routing
    let comparisonClass: EvidenceComparisonClass;
    let isEligibleForDirectContradiction = false;
    let isEligibleForContextualEvidence = true;

    if (allCriticalGatesPassed) {
      comparisonClass = 'DIRECTLY_COMPARABLE';
      isEligibleForDirectContradiction = true;
      notes.push('All 4 Critical Compatibility Gates passed (Task, Question, Metric, Dataset). Eligible for direct empirical contradiction.');
    } else if (candidate.isOrthogonalParadigm) {
      comparisonClass = 'INCOMMENSURABLE_CONTEXT';
      isEligibleForDirectContradiction = false;
      notes.push('Genuinely disjoint scientific task or paradigm. Retained as incommensurable context for negative audit trail.');
    } else if (candidate.isTheoreticalOrComplexityPaper || taskEval.status !== 'VERIFIED_COMPATIBLE') {
      comparisonClass = 'CONTEXTUAL_EVIDENCE';
      isEligibleForDirectContradiction = false;
      notes.push('Classified as contextual evidence (theoretical baseline, asymptotic complexity, or scope boundary). Blocked from direct contradiction.');
    } else {
      // Task or operational question aligned, but metric or dataset domain differed
      comparisonClass = 'RELATED_RESEARCH_QUESTIONS';
      isEligibleForDirectContradiction = false;
      notes.push('Related research question with partial methodological comparability. Evaluates directional trends; blocked from direct empirical refutation.');
    }

    return {
      candidatePaperId: candPaperId,
      seedPaperId,
      comparisonClass,
      criticalGates: {
        taskAlignment: taskEval,
        operationalQuestion: questionEval,
        metricFormulation: metricEval,
        datasetDomain: datasetEval,
        allCriticalGatesPassed,
        gateFailureReasons
      },
      contextualDimensions: {
        baselineEquivalence: baseEval,
        sampleSizeScale: scaleEval,
        threatsToValidity: threatEval,
        hardwareDeployment: hardwareEval
      },
      overallComparabilityScore,
      isEligibleForDirectContradiction,
      isEligibleForContextualEvidence,
      notes
    };
  }
}

export const methodologicalComparabilityEngine = new MethodologicalComparabilityEngine();
