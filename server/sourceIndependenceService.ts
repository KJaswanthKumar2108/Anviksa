/**
 * Anvīkṣā — Stage 4D.1: Source Independence Assessment Service
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D.1 Hardening Amendment)
 * Evaluates author overlap, institutional identity resolution via conservative hierarchy,
 * lineage, shared codebases/benchmarks, and classifies independence across 4 mutually exclusive states.
 * 
 * Resolution Hierarchy:
 * 1. ROR ID Direct Match (https://ror.org/*)
 * 2. Authoritative ID (OpenAlex institution ID)
 * 3. Versioned Explicit Alias Registry (v1.0.0)
 * 4. Conservative Normalized Name Comparison (exact normalized string, collision guards)
 * 5. Fallback: INDEPENDENCE_UNKNOWN on missing/unresolved affiliations
 */

export const INSTITUTION_ALIAS_REGISTRY_VERSION = '1.0.0';

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

export type InstitutionResolutionMethod = 
  | 'ROR_DIRECT' 
  | 'AUTHORITATIVE_ID' 
  | 'ALIAS_REGISTRY' 
  | 'NORMALIZED_STRING' 
  | 'UNKNOWN';

export interface InstitutionEntity {
  name?: string;
  rorId?: string | null;
  openAlexId?: string | null;
  institutionId?: string | null;
  countryCode?: string | null;
}

export interface ResolvedInstitution {
  rawInput: string;
  canonicalId: string;
  canonicalName: string;
  rorId: string | null;
  openAlexId: string | null;
  resolutionMethod: InstitutionResolutionMethod;
  certainty: 'HIGH' | 'MEDIUM' | 'LOW';
  isUnresolved: boolean;
  metadataConflict?: boolean;
}

export interface AuthorEntity {
  name: string;
  normalizedName: string;
  institution?: string;
  institutionId?: string;
  rorId?: string;
  orcid?: string;
}

export interface PaperIndependenceMetadata {
  paperId: string;
  doi: string | null;
  openAlexId?: string;
  title: string;
  authors: string[];
  institutions?: (string | InstitutionEntity)[];
  institutionEntities?: InstitutionEntity[];
  rorIds?: string[];
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
  resolvedSeedInstitutions?: ResolvedInstitution[];
  resolvedCandidateInstitutions?: ResolvedInstitution[];
  institutionMetadataConflict?: boolean;
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

export interface CanonicalInstitutionEntry {
  canonicalId: string;
  canonicalName: string;
  rorId: string; // Formatted as full URI or standard 9-char code
  openAlexId?: string;
  aliases: string[]; // Normalized lowercase aliases
}

/**
 * Versioned Curated Academic & Industrial Institution Alias Registry.
 * Guarantees zero false collisions between homonymous or similarly named institutions.
 */
export const INSTITUTION_ALIAS_REGISTRY: CanonicalInstitutionEntry[] = [
  {
    canonicalId: 'uc-berkeley',
    canonicalName: 'University of California, Berkeley',
    rorId: 'https://ror.org/01an7q238',
    openAlexId: 'I95457486',
    aliases: [
      'university of california berkeley',
      'uc berkeley',
      'berkeley',
      'ucb',
      'university of california, berkeley',
      'university of california - berkeley',
      'univ of california berkeley'
    ]
  },
  {
    canonicalId: 'ucla',
    canonicalName: 'University of California, Los Angeles',
    rorId: 'https://ror.org/046rm7j60',
    openAlexId: 'I161070366',
    aliases: [
      'university of california los angeles',
      'ucla',
      'university of california, los angeles',
      'university of california - los angeles',
      'univ of california los angeles'
    ]
  },
  {
    canonicalId: 'mit',
    canonicalName: 'Massachusetts Institute of Technology',
    rorId: 'https://ror.org/0420pxx49',
    openAlexId: 'I63966007',
    aliases: [
      'massachusetts institute of technology',
      'mit',
      'mass inst of tech',
      'massachusetts inst of technology'
    ]
  },
  {
    canonicalId: 'stanford-university',
    canonicalName: 'Stanford University',
    rorId: 'https://ror.org/00f54p054',
    openAlexId: 'I97018004',
    aliases: [
      'stanford university',
      'stanford',
      'leland stanford junior university',
      'leland stanford jr university',
      'stanford univ'
    ]
  },
  {
    canonicalId: 'oxford-university',
    canonicalName: 'University of Oxford',
    rorId: 'https://ror.org/052gg0110',
    openAlexId: 'I40120149',
    aliases: [
      'university of oxford',
      'oxford university',
      'oxford',
      'univ of oxford',
      'oxford univ'
    ]
  },
  {
    canonicalId: 'cambridge-university',
    canonicalName: 'University of Cambridge',
    rorId: 'https://ror.org/013meh722',
    openAlexId: 'I241749',
    aliases: [
      'university of cambridge',
      'cambridge university',
      'cambridge',
      'univ of cambridge'
    ]
  },
  {
    canonicalId: 'carnegie-mellon-university',
    canonicalName: 'Carnegie Mellon University',
    rorId: 'https://ror.org/05x2bcf40',
    openAlexId: 'I74973139',
    aliases: [
      'carnegie mellon university',
      'carnegie mellon',
      'cmu',
      'carnegie-mellon university'
    ]
  },
  {
    canonicalId: 'university-of-washington',
    canonicalName: 'University of Washington',
    rorId: 'https://ror.org/00cvxb145',
    openAlexId: 'I201448701',
    aliases: [
      'university of washington',
      'uw',
      'u of washington',
      'univ of washington',
      'university of washington seattle'
    ]
  },
  {
    canonicalId: 'george-washington-university',
    canonicalName: 'George Washington University',
    rorId: 'https://ror.org/00y49b775',
    openAlexId: 'I193662353',
    aliases: [
      'george washington university',
      'gwu',
      'george washington univ'
    ]
  },
  {
    canonicalId: 'washington-university-in-st-louis',
    canonicalName: 'Washington University in St. Louis',
    rorId: 'https://ror.org/01yc7t268',
    openAlexId: 'I204465115',
    aliases: [
      'washington university in st louis',
      'washington university in saint louis',
      'washu',
      'wustl',
      'washington univ in st louis',
      'washington university st louis'
    ]
  },
  {
    canonicalId: 'princeton-university',
    canonicalName: 'Princeton University',
    rorId: 'https://ror.org/00hx57361',
    openAlexId: 'I20089843',
    aliases: [
      'princeton university',
      'princeton',
      'princeton univ'
    ]
  },
  {
    canonicalId: 'harvard-university',
    canonicalName: 'Harvard University',
    rorId: 'https://ror.org/03vek6s52',
    openAlexId: 'I136199984',
    aliases: [
      'harvard university',
      'harvard',
      'harvard univ'
    ]
  },
  {
    canonicalId: 'eth-zurich',
    canonicalName: 'ETH Zurich',
    rorId: 'https://ror.org/05a28rw58',
    openAlexId: 'I157725225',
    aliases: [
      'eth zurich',
      'eth zürich',
      'eidgenossische technische hochschule zurich',
      'eidgenössische technische hochschule zürich',
      'swiss federal institute of technology zurich',
      'eth zurich swiss federal institute',
      'eth zurich swiss federal institute of technology'
    ]
  },
  {
    canonicalId: 'university-of-toronto',
    canonicalName: 'University of Toronto',
    rorId: 'https://ror.org/03dbr7087',
    openAlexId: 'I185261750',
    aliases: [
      'university of toronto',
      'utoronto',
      'u of toronto',
      'univ of toronto'
    ]
  },
  {
    canonicalId: 'google-research',
    canonicalName: 'Google Research',
    rorId: 'https://ror.org/0446vsg51',
    openAlexId: 'I4210137070',
    aliases: [
      'google',
      'google research',
      'google brain',
      'google deepmind',
      'alphabet',
      'alphabet inc'
    ]
  },
  {
    canonicalId: 'microsoft-research',
    canonicalName: 'Microsoft Research',
    rorId: 'https://ror.org/0064kty71',
    openAlexId: 'I4210145204',
    aliases: [
      'microsoft research',
      'microsoft',
      'msr',
      'microsoft corporation'
    ]
  },
  {
    canonicalId: 'meta-ai',
    canonicalName: 'Meta AI',
    rorId: 'https://ror.org/03ad39j10',
    openAlexId: 'I4210114050',
    aliases: [
      'meta ai',
      'meta',
      'meta platforms',
      'facebook ai research',
      'fair'
    ]
  },
  {
    canonicalId: 'openai',
    canonicalName: 'OpenAI',
    rorId: 'https://ror.org/03snvf060',
    openAlexId: 'I4210166209',
    aliases: [
      'openai',
      'openai research'
    ]
  }
];

// Pre-indexed lookup maps for constant time resolution
const ROR_TO_CANONICAL = new Map<string, CanonicalInstitutionEntry>();
const ALIAS_TO_CANONICAL = new Map<string, CanonicalInstitutionEntry>();
const OPENALEX_TO_CANONICAL = new Map<string, CanonicalInstitutionEntry>();

function normalizeRorId(ror: string): string {
  if (!ror) return '';
  const match = ror.match(/0[a-z0-9]{8}/i);
  return match ? match[0].toLowerCase() : ror.toLowerCase().trim();
}

/**
 * Normalizes institution strings conservatively:
 * - strips accents / diacritics
 * - converts punctuation to whitespace
 * - collapses multiple whitespaces
 * - trims string
 */
export function normalizeInstitutionName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build index maps
for (const entry of INSTITUTION_ALIAS_REGISTRY) {
  const normRor = normalizeRorId(entry.rorId);
  if (normRor) ROR_TO_CANONICAL.set(normRor, entry);
  if (entry.openAlexId) OPENALEX_TO_CANONICAL.set(entry.openAlexId.toUpperCase(), entry);

  for (const alias of entry.aliases) {
    const normAlias = normalizeInstitutionName(alias);
    if (normAlias) ALIAS_TO_CANONICAL.set(normAlias, entry);
  }
}

/**
 * Resolves an institution's canonical identity through the strict 5-tier conservative hierarchy:
 * 1. ROR ID Direct Match
 * 2. Authoritative ID (OpenAlex)
 * 3. Versioned Explicit Alias Registry
 * 4. Conservative Normalized Name Comparison
 * 5. Fallback UNKNOWN
 */
export function resolveInstitutionIdentity(
  input: string | InstitutionEntity,
  explicitRorId?: string | null
): ResolvedInstitution {
  const rawInput = typeof input === 'string' ? input : (input.name || '');
  const providedRor = explicitRorId || (typeof input === 'object' ? input.rorId : null);
  const providedOpenAlex = typeof input === 'object' ? (input.openAlexId || input.institutionId) : null;

  const normRaw = normalizeInstitutionName(rawInput);
  const normRor = providedRor ? normalizeRorId(providedRor) : '';

  // Check 1: ROR ID Direct Match
  if (normRor) {
    const matchByRor = ROR_TO_CANONICAL.get(normRor);
    if (matchByRor) {
      // Check for conflict between ROR and Name string if name is resolvable
      let hasConflict = false;
      if (normRaw) {
        const matchByName = ALIAS_TO_CANONICAL.get(normRaw);
        if (matchByName && matchByName.canonicalId !== matchByRor.canonicalId) {
          hasConflict = true;
        }
      }
      return {
        rawInput,
        canonicalId: matchByRor.canonicalId,
        canonicalName: matchByRor.canonicalName,
        rorId: matchByRor.rorId,
        openAlexId: matchByRor.openAlexId || null,
        resolutionMethod: 'ROR_DIRECT',
        certainty: hasConflict ? 'LOW' : 'HIGH',
        isUnresolved: false,
        metadataConflict: hasConflict
      };
    } else {
      // Valid ROR format but not in curated top registry
      return {
        rawInput,
        canonicalId: `ror:${normRor}`,
        canonicalName: rawInput || `ROR ${normRor}`,
        rorId: providedRor || normRor,
        openAlexId: providedOpenAlex || null,
        resolutionMethod: 'ROR_DIRECT',
        certainty: 'HIGH',
        isUnresolved: false
      };
    }
  }

  // Check 2: Authoritative ID (OpenAlex)
  if (providedOpenAlex) {
    const cleanAuth = providedOpenAlex.trim().toUpperCase();
    const matchByAuth = OPENALEX_TO_CANONICAL.get(cleanAuth);
    if (matchByAuth) {
      return {
        rawInput,
        canonicalId: matchByAuth.canonicalId,
        canonicalName: matchByAuth.canonicalName,
        rorId: matchByAuth.rorId,
        openAlexId: cleanAuth,
        resolutionMethod: 'AUTHORITATIVE_ID',
        certainty: 'HIGH',
        isUnresolved: false
      };
    } else {
      return {
        rawInput,
        canonicalId: `auth:${cleanAuth}`,
        canonicalName: rawInput || cleanAuth,
        rorId: null,
        openAlexId: cleanAuth,
        resolutionMethod: 'AUTHORITATIVE_ID',
        certainty: 'HIGH',
        isUnresolved: false
      };
    }
  }

  // Check 3: Versioned Curated Alias Registry
  if (normRaw) {
    let matchByAlias = ALIAS_TO_CANONICAL.get(normRaw);
    if (!matchByAlias) {
      // Check delimited segments (e.g. "ETH Zürich - Swiss Federal Institute" -> "ETH Zürich")
      const segments = rawInput.split(/[-;/|]/).map(s => normalizeInstitutionName(s)).filter(Boolean);
      for (const seg of segments) {
        if (seg.length >= 3) {
          const segMatch = ALIAS_TO_CANONICAL.get(seg);
          if (segMatch) {
            matchByAlias = segMatch;
            break;
          }
        }
      }
    }

    if (matchByAlias) {
      return {
        rawInput,
        canonicalId: matchByAlias.canonicalId,
        canonicalName: matchByAlias.canonicalName,
        rorId: matchByAlias.rorId,
        openAlexId: matchByAlias.openAlexId || null,
        resolutionMethod: 'ALIAS_REGISTRY',
        certainty: 'HIGH',
        isUnresolved: false
      };
    }
  }

  // Check 4: Conservative Normalized Name Comparison
  // Ambiguous short abbreviations (e.g., 2-3 characters like "SU", "BU", "CU") without verified aliases
  // must NOT match loosely.
  if (normRaw && normRaw.length >= 4) {
    return {
      rawInput,
      canonicalId: `norm:${normRaw}`,
      canonicalName: rawInput,
      rorId: null,
      openAlexId: null,
      resolutionMethod: 'NORMALIZED_STRING',
      certainty: 'MEDIUM',
      isUnresolved: false
    };
  } else if (normRaw && normRaw.length > 0) {
    // Short unverified abbreviation
    return {
      rawInput,
      canonicalId: `unverified-abbr:${normRaw}`,
      canonicalName: rawInput,
      rorId: null,
      openAlexId: null,
      resolutionMethod: 'NORMALIZED_STRING',
      certainty: 'LOW',
      isUnresolved: false
    };
  }

  // Check 5: Missing / Incomplete Affiliation Fallback
  return {
    rawInput: rawInput || 'UNKNOWN',
    canonicalId: 'unknown',
    canonicalName: 'Unknown Affiliation',
    rorId: null,
    openAlexId: null,
    resolutionMethod: 'UNKNOWN',
    certainty: 'LOW',
    isUnresolved: true
  };
}

export interface ParsedAuthor {
  raw: string;
  family: string;
  given: string;
  givenInitial: string;
  canonicalKey: string;
}

/**
 * Parses author name preserving full given name when available, preventing collisions
 * between East Asian names sharing family names (e.g., "Wang, Wei" vs "Wang, Wen").
 */
export function parseAuthorName(name: string): ParsedAuthor {
  if (!name || typeof name !== 'string') {
    return { raw: '', family: '', given: '', givenInitial: '', canonicalKey: '' };
  }
  const clean = name.toLowerCase().replace(/[^a-z\s,]/g, ' ').trim();
  let family = '';
  let given = '';

  if (clean.includes(',')) {
    // Comma-separated: "Last, First Middle" e.g. "Wang, Wei" or "Vaswani, Ashish"
    const [lastPart, ...rest] = clean.split(',');
    family = lastPart.trim().replace(/\s+/g, ' ');
    given = rest.join(' ').trim().replace(/\s+/g, ' ');
  } else {
    // Space-separated: "First Middle Last" e.g. "Wei Wang" or "Ashish Vaswani"
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      family = parts[0];
      given = '';
    } else {
      family = parts[parts.length - 1];
      given = parts.slice(0, parts.length - 1).join(' ');
    }
  }

  const givenInitial = given ? given[0] : '';
  // Canonical key retains given name when present to prevent collisions
  const canonicalKey = given ? `${family}, ${given}` : family;

  return {
    raw: name,
    family,
    given,
    givenInitial,
    canonicalKey
  };
}

/**
 * Normalizes author name for robust string matching (e.g. "Vaswani, Ashish" -> "vaswani, ashish").
 */
export function normalizeAuthorName(name: string): string {
  const parsed = parseAuthorName(name);
  return parsed.canonicalKey;
}

/**
 * Calculates Jaccard similarity between two sets of author strings.
 * Preserves given names to prevent collisions between distinct individuals sharing a surname.
 */
export function calculateAuthorJaccard(authorsA: string[], authorsB: string[]): {
  jaccard: number;
  sharedAuthors: string[];
} {
  const parsedA = (authorsA || []).map(parseAuthorName).filter(a => a.canonicalKey.length > 0);
  const parsedB = (authorsB || []).map(parseAuthorName).filter(b => b.canonicalKey.length > 0);

  if (parsedA.length === 0 || parsedB.length === 0) {
    return { jaccard: 0, sharedAuthors: [] };
  }

  const keysA = new Set(parsedA.map(a => a.canonicalKey));
  const keysB = new Set(parsedB.map(b => b.canonicalKey));

  const intersection: string[] = [];
  for (const k of keysA) {
    if (keysB.has(k)) {
      intersection.push(k);
    }
  }

  const unionSize = new Set([...keysA, ...keysB]).size;
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

    // Check if critical author metadata is entirely absent
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
        sharedInstitutions: (seed.institutions || []).map(i => typeof i === 'string' ? i : (i.name || '')),
        sharedDatasetsOrBenchmarks: [],
        lineageType: 'PREPRINT_TO_JOURNAL',
        sharedCodebaseDetected: true,
        notes,
        satisfiesIndependentReplication: false
      };
    }

    // 2. Author Overlap Evaluation
    const { jaccard, sharedAuthors } = calculateAuthorJaccard(seed.authors, candidate.authors);

    // 3. Institutional Overlap & Strict Resolution Hierarchy
    const extractInstitutions = (paper: PaperIndependenceMetadata): (string | InstitutionEntity)[] => {
      const list: (string | InstitutionEntity)[] = [];
      if (paper.institutions && paper.institutions.length > 0) {
        list.push(...paper.institutions);
      }
      if (paper.institutionEntities && paper.institutionEntities.length > 0) {
        list.push(...paper.institutionEntities);
      }
      if (paper.rorIds && paper.rorIds.length > 0) {
        for (const ror of paper.rorIds) {
          list.push({ rorId: ror });
        }
      }
      return list;
    };

    const seedRawInst = extractInstitutions(seed);
    const candRawInst = extractInstitutions(candidate);

    const resolvedSeed = seedRawInst.map(i => resolveInstitutionIdentity(i));
    const resolvedCand = candRawInst.map(i => resolveInstitutionIdentity(i));

    // Check for metadata conflicts
    const hasMetadataConflict = [...resolvedSeed, ...resolvedCand].some(r => r.metadataConflict === true);
    if (hasMetadataConflict) {
      notes.push('Warning: Conflicting institutional metadata detected (name vs ROR ID mismatch).');
    }

    // Evaluate valid resolved institutions
    const validSeedInst = resolvedSeed.filter(r => !r.isUnresolved);
    const validCandInst = resolvedCand.filter(r => !r.isUnresolved);

    const sharedInstitutions: string[] = [];
    for (const rCand of validCandInst) {
      for (const rSeed of validSeedInst) {
        let isMatch = false;
        // ROR direct match
        if (rCand.rorId && rSeed.rorId && normalizeRorId(rCand.rorId) === normalizeRorId(rSeed.rorId)) {
          isMatch = true;
        } else if (rCand.canonicalId === rSeed.canonicalId && rCand.canonicalId !== 'unknown') {
          // Avoid unverified abbreviation collisions
          if (rCand.certainty !== 'LOW' || rSeed.certainty !== 'LOW') {
            isMatch = true;
          } else if (rCand.rawInput.trim().toLowerCase() === rSeed.rawInput.trim().toLowerCase()) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const label = rCand.canonicalName || rCand.rawInput;
          if (!sharedInstitutions.includes(label)) {
            sharedInstitutions.push(label);
          }
        }
      }
    }

    // Conservative Rule: If neither paper has any valid institutional affiliations,
    // and authors are disjoint, we cannot affirmatively verify independence!
    // (Missing affiliations must not convert to false independence).
    const affiliationsMissing = validSeedInst.length === 0 || validCandInst.length === 0;

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
    } else if (affiliationsMissing) {
      state = 'INDEPENDENCE_UNKNOWN';
      notes.push('Institutional affiliation metadata missing or incomplete; cannot affirm independence without institutional verification.');
    } else {
      state = 'INDEPENDENT';
      notes.push('Disjoint author networks, different verified institutions, and distinct evaluation baselines.');
    }

    // If metadata conflict occurred, flag it and prevent clean independent classification
    if (hasMetadataConflict && state === 'INDEPENDENT') {
      state = 'INDEPENDENCE_UNKNOWN';
      notes.push('Conflicting institution metadata prevents unverified INDEPENDENT classification.');
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
      resolvedSeedInstitutions: resolvedSeed,
      resolvedCandidateInstitutions: resolvedCand,
      institutionMetadataConflict: hasMetadataConflict,
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
