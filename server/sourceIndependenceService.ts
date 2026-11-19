/**
 * Anvīkṣā — Stage 4D: Source Independence Assessment Service
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
 * Evaluates author overlap, institutional overlap, lineage, shared codebases/benchmarks,
 * and classifies independence across 4 mutually exclusive states.
 */

export type IndependenceState = 
  | 'INDEPENDENT' 
  | 'PARTIALLY_DEPENDENT' 
  | 'DEPENDENT' 
  | 'INDEPENDENCE_UNKNOWN';

export const INDEPENDENCE_WEIGHTS: Record<IndependenceState, number> = {
  INDEPENDENT: 1.0,
  PARTIALLY_DEPENDENT: 0.5,
  DEPENDENT: 0.2,
  INDEPENDENCE_UNKNOWN: 0.3
};

export type AddressedPathway = 
  | 'STANDARD_MULTI_GROUP'
  | 'HYBRID_EVIDENCE_PATH'
  | 'LANDMARK_RESULT'
  | 'NOT_ADDRESSED';

export interface AuthorEntity {
  name: string;
  normalizedName: string;
  institution?: string;
  institutionId?: string;
}

export interface PaperIndependenceMetadata {
  paperId: string;
  doi: string | null;
  openAlexId?: string;
  title: string;
  authors: string[];
  institutions?: string[];
  publicationYear?: number | null;
  codeRepositoryUrl?: string | null;
  benchmarkSplitsUsed?: string[];
  isPreprint?: boolean;
}

export interface IndependenceAssessmentResult {
  candidatePaperId: string;
  seedPaperId: string;
  state: IndependenceState;
  weight: number;
  authorJaccard: number;
  sharedAuthors: string[];
  sharedInstitutions: string[];
  sharedDatasetsOrBenchmarks: string[];
  lineageType: 'DISTINCT_PUBLICATION' | 'PREPRINT_TO_JOURNAL' | 'SAME_LAB_LINEAGE' | 'SHARED_PI';
  sharedCodebaseDetected: boolean;
  notes: string[];
  satisfiesIndependentReplication: boolean;
}

export interface ReplicationEvaluationSummary {
  independentCount: number;
  partiallyDependentCount: number;
  dependentCount: number;
  unknownCount: number;
  satisfiesStandardReplication: boolean;
  satisfiesHybridReplication: boolean;
  effectivePathway: AddressedPathway;
  pathwayLabel: string;
  requiresHumanReview: boolean;
  rationale: string;
}

/**
 * Normalizes author name for robust string matching (e.g. "Vaswani, Ashish" -> "vaswani a").
 */
export function normalizeAuthorName(name: string): string {
  if (!name) return '';
  const cleaned = name.toLowerCase().replace(/[^a-z\s]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const firstInitial = parts[0][0];
  return `${lastName} ${firstInitial}`;
}

/**
 * Calculates Jaccard similarity between two sets of author strings.
 */
export function calculateAuthorJaccard(authorsA: string[], authorsB: string[]): {
  jaccard: number;
  sharedAuthors: string[];
} {
  const normA = new Set(authorsA.map(normalizeAuthorName).filter(Boolean));
  const normB = new Set(authorsB.map(normalizeAuthorName).filter(Boolean));

  if (normA.size === 0 || normB.size === 0) {
    return { jaccard: 0, sharedAuthors: [] };
  }

  const intersection: string[] = [];
  for (const a of normA) {
    if (normB.has(a)) {
      intersection.push(a);
    }
  }

  const unionSize = new Set([...normA, ...normB]).size;
  const jaccard = unionSize > 0 ? intersection.length / unionSize : 0;
  return { jaccard, sharedAuthors: intersection };
}

/**
 * Normalizes paper title to identify preprint-to-journal lineage duplicates.
 */
export function normalizeTitleForLineage(title?: string | null): string {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export class SourceIndependenceService {
  /**
   * Evaluates pairwise independence between a candidate paper and the seed paper.
   */
  public evaluatePairwiseIndependence(
    seed: PaperIndependenceMetadata,
    candidate: PaperIndependenceMetadata
  ): IndependenceAssessmentResult {
    const notes: string[] = [];

    // Check if critical metadata is entirely absent
    const hasAuthorInfo = candidate.authors && candidate.authors.length > 0;
    const hasSeedAuthorInfo = seed.authors && seed.authors.length > 0;

    if (!hasAuthorInfo || !hasSeedAuthorInfo) {
      notes.push('Author metadata incomplete or unindexed; defaulting to INDEPENDENCE_UNKNOWN');
      return {
        candidatePaperId: candidate.paperId,
        seedPaperId: seed.paperId,
        state: 'INDEPENDENCE_UNKNOWN',
        weight: INDEPENDENCE_WEIGHTS.INDEPENDENCE_UNKNOWN,
        authorJaccard: 0,
        sharedAuthors: [],
        sharedInstitutions: [],
        sharedDatasetsOrBenchmarks: [],
        lineageType: 'DISTINCT_PUBLICATION',
        sharedCodebaseDetected: false,
        notes,
        satisfiesIndependentReplication: false
      };
    }

    // 1. Lineage & Preprint-to-Journal match
    const normSeedTitle = normalizeTitleForLineage(seed.title);
    const normCandTitle = normalizeTitleForLineage(candidate.title);
    const isLineageMatch = normSeedTitle.length > 15 && normSeedTitle === normCandTitle;

    if (isLineageMatch) {
      notes.push('Preprint-to-journal lineage or identical publication detected; classified as DEPENDENT');
      return {
        candidatePaperId: candidate.paperId,
        seedPaperId: seed.paperId,
        state: 'DEPENDENT',
        weight: INDEPENDENCE_WEIGHTS.DEPENDENT,
        authorJaccard: 1.0,
        sharedAuthors: seed.authors,
        sharedInstitutions: seed.institutions || [],
        sharedDatasetsOrBenchmarks: [],
        lineageType: 'PREPRINT_TO_JOURNAL',
        sharedCodebaseDetected: true,
        notes,
        satisfiesIndependentReplication: false
      };
    }

    // 2. Author Overlap Evaluation
    const { jaccard, sharedAuthors } = calculateAuthorJaccard(seed.authors, candidate.authors);

    // 3. Institutional Overlap
    const seedInst = new Set((seed.institutions || []).map(i => i.toLowerCase().trim()).filter(Boolean));
    const candInst = new Set((candidate.institutions || []).map(i => i.toLowerCase().trim()).filter(Boolean));
    const sharedInstitutions: string[] = [];
    for (const inst of candInst) {
      if (seedInst.has(inst)) {
        sharedInstitutions.push(inst);
      }
    }

    // 4. Shared Codebases
    let sharedCodebase = false;
    if (seed.codeRepositoryUrl && candidate.codeRepositoryUrl) {
      const cleanSeedRepo = seed.codeRepositoryUrl.toLowerCase().trim().replace(/\/$/, '');
      const cleanCandRepo = candidate.codeRepositoryUrl.toLowerCase().trim().replace(/\/$/, '');
      if (cleanSeedRepo === cleanCandRepo) {
        sharedCodebase = true;
        notes.push(`Shared code repository detected: ${cleanSeedRepo}`);
      }
    }

    // 5. Shared Benchmark Splits
    const seedSplits = new Set((seed.benchmarkSplitsUsed || []).map(s => s.toLowerCase().trim()).filter(Boolean));
    const candSplits = (candidate.benchmarkSplitsUsed || []).map(s => s.toLowerCase().trim()).filter(Boolean);
    const sharedDatasetsOrBenchmarks = candSplits.filter(s => seedSplits.has(s));

    // Decision Logic
    let state: IndependenceState;
    let lineageType: IndependenceAssessmentResult['lineageType'] = 'DISTINCT_PUBLICATION';

    if (jaccard >= 0.25 || sharedCodebase) {
      state = 'DEPENDENT';
      lineageType = sharedCodebase ? 'SHARED_PI' : 'SAME_LAB_LINEAGE';
      notes.push(`Substantial author overlap (Jaccard: ${jaccard.toFixed(2)}) or shared codebase.`);
    } else if (jaccard > 0 || sharedInstitutions.length > 0 || sharedDatasetsOrBenchmarks.length > 0) {
      state = 'PARTIALLY_DEPENDENT';
      if (jaccard > 0) {
        notes.push(`Loose co-authorship overlap (Jaccard: ${jaccard.toFixed(2)}).`);
      }
      if (sharedInstitutions.length > 0) {
        notes.push(`Shared institution: ${sharedInstitutions.join(', ')}.`);
      }
      if (sharedDatasetsOrBenchmarks.length > 0) {
        notes.push(`Shared benchmark split re-use: ${sharedDatasetsOrBenchmarks.join(', ')}.`);
      }
    } else {
      state = 'INDEPENDENT';
      notes.push('Disjoint author networks, different institutions, and distinct evaluation baselines.');
    }

    // Rule: PARTIALLY_DEPENDENT, DEPENDENT, and INDEPENDENCE_UNKNOWN CANNOT satisfy independent replication
    const satisfiesIndependentReplication = state === 'INDEPENDENT';

    return {
      candidatePaperId: candidate.paperId,
      seedPaperId: seed.paperId,
      state,
      weight: INDEPENDENCE_WEIGHTS[state],
      authorJaccard: jaccard,
      sharedAuthors,
      sharedInstitutions,
      sharedDatasetsOrBenchmarks,
      lineageType,
      sharedCodebaseDetected: sharedCodebase,
      notes,
      satisfiesIndependentReplication
    };
  }

  /**
   * Aggregates multiple assessments to determine the ADDRESSED evidential pathway.
   * Enforces:
   * 1. Standard: >= 2 strictly INDEPENDENT studies.
   * 2. Hybrid: 1 strictly INDEPENDENT + >= 1 PARTIALLY_DEPENDENT (weaker; requires human review; explicitly labeled).
   * 3. Two partially dependent studies DO NOT equal an independent replication.
   */
  public evaluateReplicationSufficiency(
    assessments: IndependenceAssessmentResult[],
    isLandmarkCandidate: boolean = false,
    landmarkJustification?: { hasVerifiableArtifacts: boolean; transparentRationale: string }
  ): ReplicationEvaluationSummary {
    let independentCount = 0;
    let partiallyDependentCount = 0;
    let dependentCount = 0;
    let unknownCount = 0;

    for (const a of assessments) {
      switch (a.state) {
        case 'INDEPENDENT':
          independentCount++;
          break;
        case 'PARTIALLY_DEPENDENT':
          partiallyDependentCount++;
          break;
        case 'DEPENDENT':
          dependentCount++;
          break;
        case 'INDEPENDENCE_UNKNOWN':
          unknownCount++;
          break;
      }
    }

    // Standard Path: At least 2 strictly independent studies
    const satisfiesStandardReplication = independentCount >= 2;

    // Hybrid Path: Exactly 1 strictly independent study + at least 1 partially dependent supporting study
    // Two partially dependent studies NEVER satisfy hybrid replication if independentCount == 0!
    const satisfiesHybridReplication = independentCount === 1 && partiallyDependentCount >= 1;

    let effectivePathway: AddressedPathway = 'NOT_ADDRESSED';
    let pathwayLabel = 'UNRESOLVED_INSUFFICIENT_INDEPENDENCE';
    let requiresHumanReview = false;
    let rationale = '';

    if (satisfiesStandardReplication) {
      effectivePathway = 'STANDARD_MULTI_GROUP';
      pathwayLabel = 'ADDRESSED (STANDARD_INDEPENDENT_REPLICATION)';
      requiresHumanReview = false;
      rationale = `Verified by ${independentCount} strictly independent research groups with disjoint author networks and distinct institutions.`;
    } else if (satisfiesHybridReplication) {
      effectivePathway = 'HYBRID_EVIDENCE_PATH';
      pathwayLabel = 'ADDRESSED (HYBRID_EVIDENCE_PATH)';
      requiresHumanReview = true;
      rationale = `Verified by 1 strictly independent study supported by ${partiallyDependentCount} partially dependent study(ies). Distinct weaker pathway; does NOT satisfy standard two-independent-replication requirement; requires mandatory human review.`;
    } else if (isLandmarkCandidate && landmarkJustification?.hasVerifiableArtifacts && independentCount >= 1) {
      effectivePathway = 'LANDMARK_RESULT';
      pathwayLabel = 'ADDRESSED (LANDMARK_VERIFIED_ARTIFACTS)';
      requiresHumanReview = true;
      rationale = `Substantiated via single landmark result with independently verifiable open-source code and public benchmarks. Widespread adoption alone is never proof. Requires mandatory human review. Rationale: ${landmarkJustification.transparentRationale}`;
    } else {
      effectivePathway = 'NOT_ADDRESSED';
      pathwayLabel = 'CANNOT_BE_ADDRESSED';
      requiresHumanReview = false;
      rationale = `Insufficient independent replication: Found ${independentCount} independent study(ies) and ${partiallyDependentCount} partially dependent study(ies). Two partially dependent studies do not equal independent replication.`;
    }

    return {
      independentCount,
      partiallyDependentCount,
      dependentCount,
      unknownCount,
      satisfiesStandardReplication,
      satisfiesHybridReplication,
      effectivePathway,
      pathwayLabel,
      requiresHumanReview,
      rationale
    };
  }
}

export const sourceIndependenceService = new SourceIndependenceService();
