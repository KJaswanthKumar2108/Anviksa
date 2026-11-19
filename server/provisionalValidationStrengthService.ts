/**
 * Anvīkṣā — Stage 4D: Provisional Validation Strength Scoring Service
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
 * Implements deterministic three-tier scoring, non-linear contradiction dampening,
 * evaluation-date recency decay (lambda = 0.12), and foundational baseline exemptions.
 */

export const PROVISIONAL_VALIDATION_WARNING = 
  'PROVISIONAL_VALIDATION_STRENGTH is a deterministic heuristic index. It is NOT a calibrated probability of empirical correctness. A score of 8.0/10.0 does NOT denote an 80% probability of truth.';

export const SCORING_ALGORITHM_VERSION = '4.1.0-REVISED-REV4';
export const RECENCY_LAMBDA = 0.12;
export const UNKNOWN_INDEPENDENCE_WEIGHT = 0.3;
export const CONTRADICTION_GAMMA = 0.6;

export interface PaperTemporalMetadata {
  paperId: string;
  publicationYear: number | null;
  isFoundationalExempt?: boolean;
  isRetracted?: boolean;
}

export interface ProvisionalValidationStrengthInputs {
  groundingExactCount: number;
  groundingNormalizedCount: number;
  methodologicalCommensurability: number; // R_meth in [0.0, 1.0]
  admissibleIndependenceWeights: number[]; // Array of weights in [0.0, 1.0]
  validationPapers: PaperTemporalMetadata[];
  evaluationDate?: Date;
  candidateBudget: number;
  availableHorizonCount: number;
  commensurableIngestedCount: number;
  unresolvedContradictionCount: number;
}

export interface ProvisionalValidationStrengthResult {
  score: number; // S_val in [0.0, 10.0]
  baseQualityIndex: number; // B_qual in [0.0, 1.0]
  contradictionDampener: number;
  components: {
    q_evid: number;
    r_meth: number;
    i_src: number;
    t_rec: number;
    omega_cov: number;
    n_unresolved: number;
  };
  scoringAlgorithmVersion: string;
  evaluationTimestamp: string;
  mandatoryWarning: string;
  isCalibratedProbability: false; // Strictly false in Stage 4D
}

export class ProvisionalValidationStrengthService {
  /**
   * Computes temporal decay tau for a paper relative to evaluation year.
   */
  public computePaperRecency(
    paper: PaperTemporalMetadata,
    evalYear: number
  ): number {
    if (paper.isRetracted) {
      return 0.0;
    }

    if (paper.isFoundationalExempt) {
      return 1.0;
    }

    if (paper.publicationYear === null || paper.publicationYear === undefined) {
      return 0.3; // RECENCY_UNKNOWN
    }

    const deltaYears = Math.max(0, evalYear - paper.publicationYear);
    if (deltaYears <= 1) {
      return 1.0;
    }

    return Math.exp(-RECENCY_LAMBDA * (deltaYears - 1));
  }

  /**
   * Calculates the deterministic Provisional Validation Strength score.
   */
  public calculateProvisionalStrength(
    inputs: ProvisionalValidationStrengthInputs
  ): ProvisionalValidationStrengthResult {
    const evalDate = inputs.evaluationDate || new Date();
    const evalYear = evalDate.getUTCFullYear();

    // 1. Grounding Fidelity (Q_evid in [0.0, 1.0])
    const totalGrounding = inputs.groundingExactCount + inputs.groundingNormalizedCount;
    const q_evid = totalGrounding > 0
      ? (1.0 * inputs.groundingExactCount + 0.75 * inputs.groundingNormalizedCount) / totalGrounding
      : 0.0;

    // 2. Methodological Commensurability (R_meth in [0.0, 1.0])
    const r_meth = Math.max(0.0, Math.min(1.0, inputs.methodologicalCommensurability));

    // 3. Source Independence (I_src in [0.0, 1.0])
    const indepWeights = inputs.admissibleIndependenceWeights;
    const i_src = indepWeights.length > 0
      ? indepWeights.reduce((sum, w) => sum + w, 0) / indepWeights.length
      : 0.0;

    // 4. Temporal Recency (T_rec in [0.0, 1.0])
    const activePapers = inputs.validationPapers.filter(p => !p.isRetracted);
    const t_rec = activePapers.length > 0
      ? activePapers.map(p => this.computePaperRecency(p, evalYear)).reduce((sum, r) => sum + r, 0) / activePapers.length
      : 0.3;

    // 5. Horizon Coverage Completeness (Omega_cov in [0.0, 1.0])
    const effectiveTarget = Math.max(1, Math.min(inputs.candidateBudget, inputs.availableHorizonCount));
    const omega_cov = Math.max(0.0, Math.min(1.0, inputs.commensurableIngestedCount / effectiveTarget));

    // 6. Base Quality Index with Epistemic Multiplier
    // B_qual = (Q_evid * R_meth)^0.5 * (0.45 * I_src + 0.30 * T_rec + 0.25 * Omega_cov)
    const epistemicMultiplier = Math.sqrt(q_evid * r_meth);
    const weightedSum = 0.45 * i_src + 0.30 * t_rec + 0.25 * omega_cov;
    const baseQualityIndex = epistemicMultiplier * weightedSum;

    // 7. Contradiction Dampening & Final Score S_val
    const n_unresolved = Math.max(0, inputs.unresolvedContradictionCount);
    const contradictionDampener = 1.0 / (1.0 + CONTRADICTION_GAMMA * n_unresolved);
    const rawScore = 10.0 * baseQualityIndex * contradictionDampener;
    const score = Number(Math.max(0.0, Math.min(10.0, rawScore)).toFixed(2));

    return {
      score,
      baseQualityIndex: Number(baseQualityIndex.toFixed(4)),
      contradictionDampener: Number(contradictionDampener.toFixed(4)),
      components: {
        q_evid: Number(q_evid.toFixed(4)),
        r_meth: Number(r_meth.toFixed(4)),
        i_src: Number(i_src.toFixed(4)),
        t_rec: Number(t_rec.toFixed(4)),
        omega_cov: Number(omega_cov.toFixed(4)),
        n_unresolved
      },
      scoringAlgorithmVersion: SCORING_ALGORITHM_VERSION,
      evaluationTimestamp: evalDate.toISOString(),
      mandatoryWarning: PROVISIONAL_VALIDATION_WARNING,
      isCalibratedProbability: false
    };
  }
}

export const provisionalValidationStrengthService = new ProvisionalValidationStrengthService();
