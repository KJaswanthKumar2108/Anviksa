/**
 * Anvīkṣā — Stage 4E Resource Suitability and Strategic Recommendations Service
 * Work Package: 4E-IMP-04
 * 
 * Implements:
 * 1. Researcher Resource Inventory & Evidence Management (5 Discrete States:
 *    VERIFIED_AVAILABLE, DECLARED_AVAILABLE, VERIFIED_UNAVAILABLE, UNKNOWN, EXPIRED_EVIDENCE).
 * 2. Experiment Requirement Extraction across compute, software, dataset, facility, budget, expertise.
 * 3. Traceable Requirement-to-Resource Matching with honest unknown/expired handling.
 * 4. Researcher Execution Suitability Assessment (E_suitability in [0.00, 10.00] or SUITABILITY_UNDETERMINED).
 * 5. 2D Strategic Research Decision Matrix: StrategicQuadrant(V_scientific, E_suitability).
 *    - Strict separation of V_scientific and E_suitability (No P_actionable scalar collapse!).
 * 6. Evidence-grounded Resource Acquisition & Improvement Recommendations.
 * 7. Staleness propagation and atomic persistence via rpc_persist_strategic_recommendation.
 */

import { getSupabaseAdmin } from '../src/lib/supabase.js';

export const RESOURCE_SUITABILITY_METHODOLOGY_VERSION = '4.1.0-STAGE4E-RESOURCE-SUITABILITY-REV1';

// Discrete Resource Evidence States (Frozen Architecture Invariant)
export type ResourceEvidenceState =
  | 'VERIFIED_AVAILABLE'
  | 'DECLARED_AVAILABLE'
  | 'VERIFIED_UNAVAILABLE'
  | 'UNKNOWN'
  | 'EXPIRED_EVIDENCE';

// Resource Categories
export type ResourceCategory =
  | 'COMPUTE_HARDWARE'
  | 'SOFTWARE_FRAMEWORK'
  | 'DATASET_ACCESS'
  | 'LAB_EQUIPMENT'
  | 'FINANCIAL_BUDGET'
  | 'HUMAN_EXPERTISE'
  | 'COLLABORATOR_ACCESS'
  | 'TIME_AVAILABILITY'
  | 'EXTERNAL_SERVICE';

export type EvidenceSource =
  | 'CLOUD_PROVIDER_API'
  | 'INSTITUTIONAL_SSO'
  | 'BENCHMARK_PROBE'
  | 'CRYPTO_ATTESTATION'
  | 'PEER_CONFIRMED'
  | 'USER_SELF_DECLARATION'
  | 'NONE';

// Strategic Quadrants (Piecewise mapping of V_scientific and E_suitability)
export type StrategicQuadrantType =
  | 'IMMEDIATE_HIGH_PRIORITY'
  | 'GRANT_OR_COLLABORATION_TARGET'
  | 'FEASIBLE_RESEARCH_OPPORTUNITY'
  | 'DEPRIORITIZED'
  | 'SUITABILITY_UNDETERMINED';

export type SuitabilityStatus =
  | 'SUITABILITY_EVALUATED'
  | 'SUITABILITY_UNDETERMINED'
  | 'RESOURCE_BLOCKED';

export interface ResearcherResourceItem {
  id?: string;
  userId: string;
  resourceCategory: ResourceCategory;
  resourceName: string;
  description?: string;
  specifications: Record<string, any>;
  evidenceState: ResourceEvidenceState;
  evidenceSource: EvidenceSource;
  verificationSourceRef?: string;
  verificationTimestamp?: string;
  expiresAt?: string;
  evidenceFreshnessTtlDays?: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  researcherOverrideFlag?: boolean;
  overrideJustification?: string;
}

export interface ExtractedRequirement {
  category: ResourceCategory;
  requirementName: string;
  requiredSpecification: string;
  quantitativeDemands?: {
    gpuCount?: number;
    minVramGb?: number;
    computeArchitecture?: string;
    estimatedWallClockHours?: number;
    budgetUsd?: number;
    datasetTier?: string;
    datasetLicense?: string;
    datasetIdentifier?: string;
  };
  criticality: 'CRITICAL_BLOCKER' | 'RECOMMENDED' | 'OPTIONAL';
}

export interface RequirementMatchResult {
  requirement: ExtractedRequirement;
  matchedResource?: ResearcherResourceItem;
  matchStatus: 
    | 'SATISFIED_VERIFIED'
    | 'SATISFIED_DECLARED'
    | 'PARTIALLY_SATISFIED'
    | 'VERIFIED_UNAVAILABLE'
    | 'UNKNOWN_AVAILABILITY'
    | 'EXPIRED_EVIDENCE'
    | 'UNMATCHED_NO_RECORD';
  compatibilityScore: number; // 0.0 to 1.0 (or undefined for unknown)
  rationale: string;
  unresolvedGaps?: string[];
}

export interface SuitabilityBreakdown {
  computeSuitability?: number | null; // alpha_comp = 0.40
  datasetSuitability?: number | null; // alpha_data = 0.30
  facilitySuitability?: number | null; // alpha_fac = 0.15
  budgetSuitability?: number | null; // alpha_bud = 0.15
  dimensionWeights: {
    compute: number;
    dataset: number;
    facility: number;
    budget: number;
  };
  hasUnverifiedDeclarations: boolean;
  hasExpiredEvidence: boolean;
  hasUnknowns: boolean;
}

export interface StrategicRecommendationItem {
  requirementCategory: ResourceCategory;
  targetDemand: string;
  actionType: 
    | 'ACQUIRE_COMPUTE_ACCESS'
    | 'APPLY_INSTITUTIONAL_DATASET_DUA'
    | 'IDENTIFY_METHODOLOGICAL_ALTERNATIVE'
    | 'SEEK_RESEARCH_COLLABORATION'
    | 'APPLY_RESEARCH_GRANT'
    | 'INSTALL_AND_VERIFY_SOFTWARE';
  recommendationTitle: string;
  detailedAction: string;
  traceableRequirement: string;
  qualification: 'VERIFIED_PATH' | 'CANDIDATE_ALTERNATIVE' | 'INVESTIGATION_REQUIRED';
}

export interface ExecutionSuitabilityAssessment {
  opportunityId: string;
  experimentId?: string;
  userId: string;
  intrinsicScientificValue: number; // V_scientific from 4E-IMP-01
  executionSuitability: number | null; // E_suitability in [0.00, 10.00] or null
  suitabilityStatus: SuitabilityStatus;
  strategicQuadrant: StrategicQuadrantType;
  suitabilityBreakdown: SuitabilityBreakdown;
  requirementMatches: RequirementMatchResult[];
  unmatchedRequirements: ExtractedRequirement[];
  recommendations: StrategicRecommendationItem[];
  evidenceBasis: {
    totalRequirements: number;
    satisfiedVerifiedCount: number;
    satisfiedDeclaredCount: number;
    partiallySatisfiedCount: number;
    unavailableCount: number;
    unknownCount: number;
    expiredCount: number;
    unmatchedCount: number;
    methodologyVersion: string;
    evaluatedAt: string;
  };
}

/**
 * 2D Strategic Research Decision Matrix
 * StrategicQuadrant(V_scientific, E_suitability)
 * 
 * Invariants:
 * - If E_suitability is null or UNKNOWN -> SUITABILITY_UNDETERMINED
 * - V >= 6.0 && E >= 6.0 -> IMMEDIATE_HIGH_PRIORITY
 * - V >= 6.0 && E < 6.0 -> GRANT_OR_COLLABORATION_TARGET
 * - V < 6.0 && E >= 6.0 -> FEASIBLE_RESEARCH_OPPORTUNITY
 * - V < 6.0 && E < 6.0 -> DEPRIORITIZED
 */
export function determineStrategicQuadrant(
  vScientific: number,
  eSuitability: number | null
): StrategicQuadrantType {
  if (eSuitability === null || Number.isNaN(eSuitability)) {
    return 'SUITABILITY_UNDETERMINED';
  }

  if (vScientific >= 6.0) {
    return eSuitability >= 6.0
      ? 'IMMEDIATE_HIGH_PRIORITY'
      : 'GRANT_OR_COLLABORATION_TARGET';
  } else {
    return eSuitability >= 6.0
      ? 'FEASIBLE_RESEARCH_OPPORTUNITY'
      : 'DEPRIORITIZED';
  }
}

export class ResourceSuitabilityService {
  /**
   * Upsert a researcher resource into the inventory
   */
  async upsertResource(
    userId: string,
    resource: Partial<ResearcherResourceItem>
  ): Promise<string> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin unavailable');

    const expiresAt = resource.expiresAt ? new Date(resource.expiresAt).toISOString() : null;
    let effectiveState = resource.evidenceState || 'DECLARED_AVAILABLE';

    // Check expiration
    if (expiresAt && new Date(expiresAt) < new Date()) {
      if (effectiveState === 'VERIFIED_AVAILABLE') {
        effectiveState = 'EXPIRED_EVIDENCE';
      }
    }

    // Audit Section 6: Provenance and Verification Integrity
    // A resource cannot be marked VERIFIED_AVAILABLE unless backed by an authentic independent verification source
    // (CLOUD_PROVIDER_API, INSTITUTIONAL_SSO, BENCHMARK_PROBE, CRYPTO_ATTESTATION, or PEER_CONFIRMED) with a non-empty source reference.
    // If declared as VERIFIED_AVAILABLE without an authentic independent verification source or reference,
    // downgrade honestly to DECLARED_AVAILABLE.
    const independentSources: EvidenceSource[] = [
      'CLOUD_PROVIDER_API',
      'INSTITUTIONAL_SSO',
      'BENCHMARK_PROBE',
      'CRYPTO_ATTESTATION',
      'PEER_CONFIRMED'
    ];
    if (effectiveState === 'VERIFIED_AVAILABLE') {
      const hasIndependentSource = resource.evidenceSource && independentSources.includes(resource.evidenceSource);
      const hasVerificationRef = Boolean(resource.verificationSourceRef && resource.verificationSourceRef.trim().length > 0);
      if (!hasIndependentSource || !hasVerificationRef) {
        effectiveState = 'DECLARED_AVAILABLE';
      }
    }

    const { data: resId, error } = await admin.rpc('rpc_upsert_researcher_resource', {
      p_user_id: userId,
      p_resource_id: resource.id || null,
      p_resource_category: resource.resourceCategory || 'COMPUTE_HARDWARE',
      p_resource_name: resource.resourceName || 'Untitled Resource',
      p_description: resource.description || null,
      p_specifications: resource.specifications || {},
      p_evidence_state: effectiveState,
      p_evidence_source: resource.evidenceSource || 'USER_SELF_DECLARATION',
      p_verification_source_ref: resource.verificationSourceRef || null,
      p_expires_at: expiresAt,
      p_evidence_freshness_ttl_days: resource.evidenceFreshnessTtlDays ?? 90,
      p_confidence_level: resource.confidenceLevel || 'MEDIUM',
      p_researcher_override_flag: resource.researcherOverrideFlag || false,
      p_override_justification: resource.overrideJustification || null
    });

    if (error) {
      throw new Error(`Failed to upsert researcher resource: ${error.message}`);
    }

    return resId as string;
  }

  /**
   * Get all resources owned by a researcher
   */
  async getResearcherResources(userId: string): Promise<ResearcherResourceItem[]> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin unavailable');

    const { data, error } = await admin
      .from('researcher_resources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get researcher resources: ${error.message}`);

    return (data || []).map(row => {
      // Check freshness dynamically
      let effectiveState = row.evidence_state as ResourceEvidenceState;
      if (row.expires_at && new Date(row.expires_at) < new Date() && effectiveState === 'VERIFIED_AVAILABLE') {
        effectiveState = 'EXPIRED_EVIDENCE';
      }

      return {
        id: row.id,
        userId: row.user_id,
        resourceCategory: row.resource_category as ResourceCategory,
        resourceName: row.resource_name,
        description: row.description,
        specifications: row.specifications || {},
        evidenceState: effectiveState,
        evidenceSource: row.evidence_source as EvidenceSource,
        verificationSourceRef: row.verification_source_ref,
        verificationTimestamp: row.verification_timestamp,
        expiresAt: row.expires_at,
        evidenceFreshnessTtlDays: row.evidence_freshness_ttl_days,
        confidenceLevel: row.confidence_level,
        researcherOverrideFlag: row.researcher_override_flag,
        overrideJustification: row.override_justification
      };
    });
  }

  /**
   * Extract quantitative and qualitative requirements from a research experiment protocol
   */
  extractRequirementsFromExperiment(experiment: Record<string, any>): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];

    // 1. Compute & Hardware requirements
    const env = experiment.execution_environment || {};
    const minGpus = env.minimum_gpu_count || 1;
    const minVram = env.minimum_vram_gb || 24;
    const computeArch = env.compute_architecture || 'GPU_CUDA_COMPATIBLE';
    const estHours = env.estimated_wall_clock_hours || 10;

    requirements.push({
      category: 'COMPUTE_HARDWARE',
      requirementName: `Compute Cluster: ${minGpus}x GPU (${minVram}GB VRAM minimum)`,
      requiredSpecification: `${computeArch} with >= ${minVram}GB VRAM, ${minGpus} device(s)`,
      quantitativeDemands: {
        gpuCount: minGpus,
        minVramGb: minVram,
        computeArchitecture: computeArch,
        estimatedWallClockHours: estHours
      },
      criticality: 'CRITICAL_BLOCKER'
    });

    // 2. Software dependencies
    const swDeps = env.software_dependencies || ['Python 3.10+', 'PyTorch 2.1+'];
    for (const sw of swDeps) {
      requirements.push({
        category: 'SOFTWARE_FRAMEWORK',
        requirementName: `Software Environment: ${sw}`,
        requiredSpecification: sw,
        criticality: 'RECOMMENDED'
      });
    }

    // 3. Datasets and Materials
    const datasets = Array.isArray(experiment.datasets_and_materials)
      ? experiment.datasets_and_materials
      : [];
    for (const ds of datasets) {
      requirements.push({
        category: 'DATASET_ACCESS',
        requirementName: `Dataset Access: ${ds.name || 'Benchmark Dataset'}`,
        requiredSpecification: `Split: ${ds.data_split || 'Standard'}, License: ${ds.license || 'Open'}`,
        quantitativeDemands: {
          datasetIdentifier: ds.source_url_or_identifier,
          datasetLicense: ds.license,
          datasetTier: ds.license === 'Open Access' || ds.license === 'MIT' || ds.license === 'Apache 2.0' ? 'PUBLIC_OPEN' : 'RESTRICTED_ACADEMIC'
        },
        criticality: 'CRITICAL_BLOCKER'
      });
    }

    // 4. Financial budget (estimated compute runtime cost: ~$2.50/hr per 80GB GPU)
    const estimatedCostUsd = Math.round(minGpus * estHours * 2.50);
    requirements.push({
      category: 'FINANCIAL_BUDGET',
      requirementName: `Experiment Compute Budget ($${estimatedCostUsd} USD)`,
      requiredSpecification: `Direct cloud compute budget of at least $${estimatedCostUsd} USD`,
      quantitativeDemands: {
        budgetUsd: estimatedCostUsd
      },
      criticality: 'RECOMMENDED'
    });

    return requirements;
  }

  /**
   * Match an extracted requirement against a researcher's resources
   */
  matchRequirement(
    req: ExtractedRequirement,
    inventory: ResearcherResourceItem[]
  ): RequirementMatchResult {
    // Find candidate resources in matching category
    const candidates = inventory.filter(r => r.resourceCategory === req.category);

    if (candidates.length === 0) {
      return {
        requirement: req,
        matchStatus: 'UNMATCHED_NO_RECORD',
        compatibilityScore: 0.0,
        rationale: `No resource registered in category ${req.category} matching "${req.requirementName}".`,
        unresolvedGaps: [`Missing ${req.requirementName}`]
      };
    }

    // Specific category matching rules
    if (req.category === 'COMPUTE_HARDWARE') {
      const demandedVram = req.quantitativeDemands?.minVramGb || 24;
      const demandedGpus = req.quantitativeDemands?.gpuCount || 1;

      // Look for candidate meeting demands
      for (const cand of candidates) {
        const specs = cand.specifications || {};
        const candVram = specs.vramGb || specs.max_vram_gb || 0;
        const candGpuCount = specs.gpuCount || specs.gpu_count || 1;

        // Check verification state
        if (cand.evidenceState === 'VERIFIED_UNAVAILABLE') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'VERIFIED_UNAVAILABLE',
            compatibilityScore: 0.0,
            rationale: `Resource ${cand.resourceName} is verified unavailable.`,
            unresolvedGaps: ['Verified unavailable compute hardware']
          };
        }

        if (cand.evidenceState === 'EXPIRED_EVIDENCE') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'EXPIRED_EVIDENCE',
            compatibilityScore: 0.0,
            rationale: `Resource ${cand.resourceName} evidence has expired. Requires re-verification.`,
            unresolvedGaps: ['Expired compute credentials']
          };
        }

        if (cand.evidenceState === 'UNKNOWN') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'UNKNOWN_AVAILABILITY',
            compatibilityScore: 0.0,
            rationale: `Resource ${cand.resourceName} availability cannot currently be established.`,
            unresolvedGaps: ['Compute availability unknown']
          };
        }

        // Compare specs
        if (candVram >= demandedVram && candGpuCount >= demandedGpus) {
          const isVerified = cand.evidenceState === 'VERIFIED_AVAILABLE';
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: isVerified ? 'SATISFIED_VERIFIED' : 'SATISFIED_DECLARED',
            compatibilityScore: 1.0,
            rationale: `Matched ${cand.resourceName}: provides ${candGpuCount}x GPU with ${candVram}GB VRAM (meets requirement of ${demandedGpus}x >= ${demandedVram}GB).`,
          };
        } else if (candVram > 0) {
          // Partial capacity
          const vramRatio = Math.min(1.0, candVram / demandedVram);
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'PARTIALLY_SATISFIED',
            compatibilityScore: Math.round(vramRatio * 0.7 * 100) / 100,
            rationale: `Matched ${cand.resourceName} with ${candVram}GB VRAM, but experiment requires ${demandedVram}GB VRAM. Insufficient for full-scale execution.`,
            unresolvedGaps: [`VRAM deficit: have ${candVram}GB, require ${demandedVram}GB`]
          };
        }
      }
    }

    if (req.category === 'DATASET_ACCESS') {
      const demandedLicense = req.quantitativeDemands?.datasetLicense;
      const isPublic = demandedLicense === 'Open Access' || demandedLicense === 'MIT' || demandedLicense === 'Apache 2.0';

      for (const cand of candidates) {
        if (cand.evidenceState === 'VERIFIED_UNAVAILABLE') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'VERIFIED_UNAVAILABLE',
            compatibilityScore: 0.0,
            rationale: `Dataset access to ${cand.resourceName} is verified unavailable.`,
            unresolvedGaps: ['Verified unavailable dataset']
          };
        }

        if (cand.evidenceState === 'UNKNOWN') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'UNKNOWN_AVAILABILITY',
            compatibilityScore: 0.0,
            rationale: `Dataset access status is unknown.`,
            unresolvedGaps: ['Dataset access unconfirmed']
          };
        }

        if (cand.evidenceState === 'EXPIRED_EVIDENCE') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'EXPIRED_EVIDENCE',
            compatibilityScore: 0.0,
            rationale: `Dataset access credentials have expired.`,
            unresolvedGaps: ['Expired dataset DUA']
          };
        }

        const isVerified = cand.evidenceState === 'VERIFIED_AVAILABLE';
        return {
          requirement: req,
          matchedResource: cand,
          matchStatus: isVerified ? 'SATISFIED_VERIFIED' : 'SATISFIED_DECLARED',
          compatibilityScore: 1.0,
          rationale: `Dataset ${cand.resourceName} access confirmed via ${cand.evidenceSource}.`
        };
      }

      // If dataset is public open access and no explicit record exists, researcher can access publicly
      if (isPublic) {
        return {
          requirement: req,
          matchStatus: 'SATISFIED_DECLARED',
          compatibilityScore: 0.95,
          rationale: `Dataset "${req.requirementName}" has open access license (${demandedLicense}) accessible via public repository.`
        };
      }
    }

    if (req.category === 'FINANCIAL_BUDGET') {
      const demandedBudget = req.quantitativeDemands?.budgetUsd || 50;
      for (const cand of candidates) {
        const claimed = cand.specifications?.monthly_budget_usd || cand.specifications?.budgetUsd || 0;
        if (cand.evidenceState === 'VERIFIED_UNAVAILABLE') {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'VERIFIED_UNAVAILABLE',
            compatibilityScore: 0.0,
            rationale: 'Budget is verified unavailable.',
            unresolvedGaps: ['No compute budget']
          };
        }

        if (claimed >= demandedBudget) {
          const isVerified = cand.evidenceState === 'VERIFIED_AVAILABLE';
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: isVerified ? 'SATISFIED_VERIFIED' : 'SATISFIED_DECLARED',
            compatibilityScore: 1.0,
            rationale: `Available compute budget ($${claimed}) meets demanded $${demandedBudget}.`
          };
        } else {
          return {
            requirement: req,
            matchedResource: cand,
            matchStatus: 'PARTIALLY_SATISFIED',
            compatibilityScore: Math.round((claimed / demandedBudget) * 100) / 100,
            rationale: `Available compute budget ($${claimed}) is below demanded $${demandedBudget}.`,
            unresolvedGaps: [`Budget deficit: $${demandedBudget - claimed}`]
          };
        }
      }
    }

    // Default fallback matching
    const primary = candidates[0];
    const isVerified = primary.evidenceState === 'VERIFIED_AVAILABLE';
    return {
      requirement: req,
      matchedResource: primary,
      matchStatus: isVerified ? 'SATISFIED_VERIFIED' : 'SATISFIED_DECLARED',
      compatibilityScore: 1.0,
      rationale: `Matched ${primary.resourceName} in category ${req.category}.`
    };
  }

  /**
   * Evaluate execution suitability E_suitability
   * Invariants:
   * 1. Hard Exclusion Gate (RESOURCE_BLOCKED): If any critical requirement is VERIFIED_UNAVAILABLE, E = 0.00.
   * 2. Missing Profile Data (SUITABILITY_UNDETERMINED): If required resources have UNKNOWN or EXPIRED_EVIDENCE,
   *    or if inventory is empty, return null (SUITABILITY_UNDETERMINED).
   * 3. Composite formulation: E_raw = alpha_comp E_compute + alpha_data E_data + alpha_fac E_facility + alpha_bud E_budget.
   *    Scaled to [0.00, 10.00].
   */
  evaluateExecutionSuitability(
    vScientific: number,
    requirements: ExtractedRequirement[],
    inventory: ResearcherResourceItem[],
    opportunityId: string,
    experimentId?: string,
    userId: string = ''
  ): ExecutionSuitabilityAssessment {
    const matches: RequirementMatchResult[] = [];
    const unmatched: ExtractedRequirement[] = [];

    // If researcher has zero resources registered, cannot establish suitability
    if (inventory.length === 0) {
      return {
        opportunityId,
        experimentId,
        userId,
        intrinsicScientificValue: vScientific,
        executionSuitability: null,
        suitabilityStatus: 'SUITABILITY_UNDETERMINED',
        strategicQuadrant: 'SUITABILITY_UNDETERMINED',
        suitabilityBreakdown: {
          computeSuitability: null,
          datasetSuitability: null,
          facilitySuitability: null,
          budgetSuitability: null,
          dimensionWeights: { compute: 0.40, dataset: 0.30, facility: 0.15, budget: 0.15 },
          hasUnverifiedDeclarations: false,
          hasExpiredEvidence: false,
          hasUnknowns: true
        },
        requirementMatches: [],
        unmatchedRequirements: requirements,
        recommendations: this.generateRecommendations(requirements, []),
        evidenceBasis: {
          totalRequirements: requirements.length,
          satisfiedVerifiedCount: 0,
          satisfiedDeclaredCount: 0,
          partiallySatisfiedCount: 0,
          unavailableCount: 0,
          unknownCount: 0,
          expiredCount: 0,
          unmatchedCount: requirements.length,
          methodologyVersion: RESOURCE_SUITABILITY_METHODOLOGY_VERSION,
          evaluatedAt: new Date().toISOString()
        }
      };
    }

    let hasVerifiedUnavailable = false;
    let hasUnknown = false;
    let hasExpired = false;
    let hasUnverifiedDeclarations = false;

    let satisfiedVerifiedCount = 0;
    let satisfiedDeclaredCount = 0;
    let partiallySatisfiedCount = 0;
    let unavailableCount = 0;
    let unknownCount = 0;
    let expiredCount = 0;

    for (const req of requirements) {
      const match = this.matchRequirement(req, inventory);
      matches.push(match);

      switch (match.matchStatus) {
        case 'SATISFIED_VERIFIED':
          satisfiedVerifiedCount++;
          break;
        case 'SATISFIED_DECLARED':
          satisfiedDeclaredCount++;
          hasUnverifiedDeclarations = true;
          break;
        case 'PARTIALLY_SATISFIED':
          partiallySatisfiedCount++;
          break;
        case 'VERIFIED_UNAVAILABLE':
          unavailableCount++;
          if (req.criticality === 'CRITICAL_BLOCKER') {
            hasVerifiedUnavailable = true;
          }
          break;
        case 'UNKNOWN_AVAILABILITY':
          unknownCount++;
          hasUnknown = true;
          break;
        case 'EXPIRED_EVIDENCE':
          expiredCount++;
          hasExpired = true;
          break;
        case 'UNMATCHED_NO_RECORD':
          unmatched.push(req);
          // An unlisted resource defaults to zero compatibility for that requirement,
          // rather than marking the whole evaluation as unknown/undetermined, unless explicitly set to UNKNOWN.
          break;
      }
    }

    // Dimension aggregations
    const computeMatches = matches.filter(m => m.requirement.category === 'COMPUTE_HARDWARE');
    const dataMatches = matches.filter(m => m.requirement.category === 'DATASET_ACCESS');
    const facMatches = matches.filter(m => m.requirement.category === 'LAB_EQUIPMENT' || m.requirement.category === 'SOFTWARE_FRAMEWORK');
    const budMatches = matches.filter(m => m.requirement.category === 'FINANCIAL_BUDGET');

    const avgScore = (items: RequirementMatchResult[]) => {
      if (items.length === 0) return 1.0; // No requirement in this dimension
      const sum = items.reduce((acc, curr) => acc + curr.compatibilityScore, 0);
      return sum / items.length;
    };

    const eComp = computeMatches.length > 0 ? avgScore(computeMatches) : 1.0;
    const eData = dataMatches.length > 0 ? avgScore(dataMatches) : 1.0;
    const eFac = facMatches.length > 0 ? avgScore(facMatches) : 1.0;
    const eBud = budMatches.length > 0 ? avgScore(budMatches) : 1.0;

    // Invariant Check 1: Hard Exclusion Gate
    if (hasVerifiedUnavailable) {
      return {
        opportunityId,
        experimentId,
        userId,
        intrinsicScientificValue: vScientific,
        executionSuitability: 0.00,
        suitabilityStatus: 'RESOURCE_BLOCKED',
        strategicQuadrant: determineStrategicQuadrant(vScientific, 0.00),
        suitabilityBreakdown: {
          computeSuitability: Math.round(eComp * 100) / 10,
          datasetSuitability: Math.round(eData * 100) / 10,
          facilitySuitability: Math.round(eFac * 100) / 10,
          budgetSuitability: Math.round(eBud * 100) / 10,
          dimensionWeights: { compute: 0.40, dataset: 0.30, facility: 0.15, budget: 0.15 },
          hasUnverifiedDeclarations,
          hasExpiredEvidence: hasExpired,
          hasUnknowns: hasUnknown
        },
        requirementMatches: matches,
        unmatchedRequirements: unmatched,
        recommendations: this.generateRecommendations(requirements, matches),
        evidenceBasis: {
          totalRequirements: requirements.length,
          satisfiedVerifiedCount,
          satisfiedDeclaredCount,
          partiallySatisfiedCount,
          unavailableCount,
          unknownCount,
          expiredCount,
          unmatchedCount: unmatched.length,
          methodologyVersion: RESOURCE_SUITABILITY_METHODOLOGY_VERSION,
          evaluatedAt: new Date().toISOString()
        }
      };
    }

    // Invariant Check 2: Unknown / Expired Data -> SUITABILITY_UNDETERMINED
    if (hasUnknown || hasExpired) {
      return {
        opportunityId,
        experimentId,
        userId,
        intrinsicScientificValue: vScientific,
        executionSuitability: null,
        suitabilityStatus: 'SUITABILITY_UNDETERMINED',
        strategicQuadrant: 'SUITABILITY_UNDETERMINED',
        suitabilityBreakdown: {
          computeSuitability: hasUnknown && computeMatches.some(m => m.matchStatus === 'UNKNOWN_AVAILABILITY' || m.matchStatus === 'UNMATCHED_NO_RECORD') ? null : Math.round(eComp * 100) / 10,
          datasetSuitability: hasUnknown && dataMatches.some(m => m.matchStatus === 'UNKNOWN_AVAILABILITY' || m.matchStatus === 'UNMATCHED_NO_RECORD') ? null : Math.round(eData * 100) / 10,
          facilitySuitability: Math.round(eFac * 100) / 10,
          budgetSuitability: Math.round(eBud * 100) / 10,
          dimensionWeights: { compute: 0.40, dataset: 0.30, facility: 0.15, budget: 0.15 },
          hasUnverifiedDeclarations,
          hasExpiredEvidence: hasExpired,
          hasUnknowns: hasUnknown
        },
        requirementMatches: matches,
        unmatchedRequirements: unmatched,
        recommendations: this.generateRecommendations(requirements, matches),
        evidenceBasis: {
          totalRequirements: requirements.length,
          satisfiedVerifiedCount,
          satisfiedDeclaredCount,
          partiallySatisfiedCount,
          unavailableCount,
          unknownCount,
          expiredCount,
          unmatchedCount: unmatched.length,
          methodologyVersion: RESOURCE_SUITABILITY_METHODOLOGY_VERSION,
          evaluatedAt: new Date().toISOString()
        }
      };
    }

    // Normalized weighted composite suitability E_raw in [0.00, 10.00]
    const rawE = (0.40 * eComp + 0.30 * eData + 0.15 * eFac + 0.15 * eBud) * 10.0;
    const finalE = Math.round(Math.min(10.00, Math.max(0.00, rawE)) * 100) / 100;
    const quadrant = determineStrategicQuadrant(vScientific, finalE);

    return {
      opportunityId,
      experimentId,
      userId,
      intrinsicScientificValue: vScientific,
      executionSuitability: finalE,
      suitabilityStatus: 'SUITABILITY_EVALUATED',
      strategicQuadrant: quadrant,
      suitabilityBreakdown: {
        computeSuitability: Math.round(eComp * 100) / 10,
        datasetSuitability: Math.round(eData * 100) / 10,
        facilitySuitability: Math.round(eFac * 100) / 10,
        budgetSuitability: Math.round(eBud * 100) / 10,
        dimensionWeights: { compute: 0.40, dataset: 0.30, facility: 0.15, budget: 0.15 },
        hasUnverifiedDeclarations,
        hasExpiredEvidence: false,
        hasUnknowns: false
      },
      requirementMatches: matches,
      unmatchedRequirements: unmatched,
      recommendations: this.generateRecommendations(requirements, matches),
      evidenceBasis: {
        totalRequirements: requirements.length,
        satisfiedVerifiedCount,
        satisfiedDeclaredCount,
        partiallySatisfiedCount,
        unavailableCount: 0,
        unknownCount: 0,
        expiredCount: 0,
        unmatchedCount: unmatched.length,
        methodologyVersion: RESOURCE_SUITABILITY_METHODOLOGY_VERSION,
        evaluatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate actionable resource acquisition and improvement recommendations
   */
  generateRecommendations(
    requirements: ExtractedRequirement[],
    matches: RequirementMatchResult[]
  ): StrategicRecommendationItem[] {
    const recs: StrategicRecommendationItem[] = [];

    for (const req of requirements) {
      const match = matches.find(m => m.requirement.requirementName === req.requirementName);
      const status = match?.matchStatus || 'UNMATCHED_NO_RECORD';

      if (status === 'SATISFIED_VERIFIED') continue;

      if (req.category === 'COMPUTE_HARDWARE') {
        const vram = req.quantitativeDemands?.minVramGb || 24;
        const gpus = req.quantitativeDemands?.gpuCount || 1;
        if (status === 'PARTIALLY_SATISFIED') {
          recs.push({
            requirementCategory: 'COMPUTE_HARDWARE',
            targetDemand: `${gpus}x GPU >= ${vram}GB VRAM`,
            actionType: 'ACQUIRE_COMPUTE_ACCESS',
            recommendationTitle: `Upgrade Compute Hardware to ${vram}GB VRAM`,
            detailedAction: `Current hardware provides partial capacity. Allocate an instance with >= ${vram}GB VRAM (e.g. NVIDIA A100/H100 or cloud instance) to avoid out-of-memory errors on full batch scale.`,
            traceableRequirement: req.requirementName,
            qualification: 'CANDIDATE_ALTERNATIVE'
          });
        } else if (status === 'UNMATCHED_NO_RECORD' || status === 'UNKNOWN_AVAILABILITY') {
          recs.push({
            requirementCategory: 'COMPUTE_HARDWARE',
            targetDemand: `${gpus}x GPU >= ${vram}GB VRAM`,
            actionType: 'ACQUIRE_COMPUTE_ACCESS',
            recommendationTitle: `Provision Required Compute Cluster (${gpus}x GPU)`,
            detailedAction: `Register active cloud compute credentials or institutional cluster access supporting >= ${vram}GB VRAM.`,
            traceableRequirement: req.requirementName,
            qualification: 'INVESTIGATION_REQUIRED'
          });
        } else if (status === 'EXPIRED_EVIDENCE') {
          recs.push({
            requirementCategory: 'COMPUTE_HARDWARE',
            targetDemand: 'Active Compute Verification',
            actionType: 'ACQUIRE_COMPUTE_ACCESS',
            recommendationTitle: 'Re-authenticate Expired Compute Verification',
            detailedAction: 'Cloud provider API token or institutional SSO evidence has expired. Re-authenticate to confirm active compute quota.',
            traceableRequirement: req.requirementName,
            qualification: 'VERIFIED_PATH'
          });
        }
      }

      if (req.category === 'DATASET_ACCESS') {
        if (status === 'UNMATCHED_NO_RECORD' || status === 'UNKNOWN_AVAILABILITY') {
          recs.push({
            requirementCategory: 'DATASET_ACCESS',
            targetDemand: req.requirementName,
            actionType: 'APPLY_INSTITUTIONAL_DATASET_DUA',
            recommendationTitle: `Submit Data Use Agreement (DUA) for ${req.requirementName}`,
            detailedAction: `Request institutional access or verify credentialed researcher status to download and preprocess the required dataset partition.`,
            traceableRequirement: req.requirementName,
            qualification: 'INVESTIGATION_REQUIRED'
          });
        }
      }

      if (req.category === 'FINANCIAL_BUDGET') {
        const cost = req.quantitativeDemands?.budgetUsd || 50;
        if (status === 'PARTIALLY_SATISFIED' || status === 'UNMATCHED_NO_RECORD') {
          recs.push({
            requirementCategory: 'FINANCIAL_BUDGET',
            targetDemand: `$${cost} USD Compute Allocation`,
            actionType: 'APPLY_RESEARCH_GRANT',
            recommendationTitle: `Secure Compute Grant or Lab Allocation ($${cost} USD)`,
            detailedAction: `Apply for academic cloud credits (e.g. Google Cloud Research Credits, NSF ACCESS) to cover the estimated experiment runtime budget.`,
            traceableRequirement: req.requirementName,
            qualification: 'CANDIDATE_ALTERNATIVE'
          });
        }
      }

      if (req.category === 'SOFTWARE_FRAMEWORK') {
        if (status === 'UNMATCHED_NO_RECORD') {
          recs.push({
            requirementCategory: 'SOFTWARE_FRAMEWORK',
            targetDemand: req.requiredSpecification,
            actionType: 'INSTALL_AND_VERIFY_SOFTWARE',
            recommendationTitle: `Install Dependency: ${req.requiredSpecification}`,
            detailedAction: `Build container image or conda environment containing ${req.requiredSpecification}.`,
            traceableRequirement: req.requirementName,
            qualification: 'VERIFIED_PATH'
          });
        }
      }
    }

    return recs;
  }

  /**
   * Persist a strategic recommendation to the database
   */
  async persistStrategicRecommendation(
    assessment: ExecutionSuitabilityAssessment
  ): Promise<string> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin unavailable');

    const { data: recId, error } = await admin.rpc('rpc_persist_strategic_recommendation', {
      p_opportunity_id: assessment.opportunityId,
      p_experiment_id: assessment.experimentId || null,
      p_user_id: assessment.userId,
      p_intrinsic_scientific_value: assessment.intrinsicScientificValue,
      p_execution_suitability: assessment.executionSuitability,
      p_suitability_status: assessment.suitabilityStatus,
      p_strategic_quadrant: assessment.strategicQuadrant,
      p_suitability_breakdown: assessment.suitabilityBreakdown,
      p_unmatched_requirements: assessment.unmatchedRequirements,
      p_resource_recommendations: assessment.recommendations,
      p_evidence_basis: assessment.evidenceBasis
    });

    if (error) {
      throw new Error(`Failed to persist strategic recommendation: ${error.message}`);
    }

    return recId as string;
  }
}

export const resourceSuitabilityService = new ResourceSuitabilityService();
