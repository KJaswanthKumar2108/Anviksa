import type { NormalizedOpenAlexPaper } from '../src/types/openalex.js';
import { openAlexService } from './openAlexService.js';

export interface DiscoveryStrategyContribution {
  strategy: 'keyword_search' | 'backward_citation' | 'forward_citation' | 'concept_expansion' | 'counter_evidence';
  queryOrFilter: string;
  totalReportedCount: number;
  retrievedCount: number;
  deduplicatedCount: number;
  selectedCount: number;
}

export interface DiscoveryCoverageMetadata {
  executedStrategies: string[];
  queriesExecuted: string[];
  paginationStates: Record<string, { page: number; perPage: number; hasMore: boolean }>;
  candidatesRetrievedCount: number;
  candidatesDeduplicatedCount: number;
  candidatesSelectedCount: number;
  candidatesRejectedCount: number;
  rejectionReasonsSummary: Record<string, number>;
  publicationPeriodDistribution: Record<string, number>; // e.g. "2020-2022": 4, "2023-2025": 8
  strategyContributions: DiscoveryStrategyContribution[];
  unresolvedApiFailures: string[];
  discoveryTimestamp: string;
  isExhaustive: boolean;
  coverageNote: string;
}

export interface DiscoveredCandidatePaper {
  paper: NormalizedOpenAlexPaper;
  canonicalDoi: string | null;
  openAlexId: string;
  discoverySourceStrategy: 'keyword_search' | 'backward_citation' | 'forward_citation' | 'concept_expansion' | 'counter_evidence';
  discoveryPath: string; // e.g. "seed:W2963403868 -> cites -> counter_evidence"
  referencedBySeedId?: string;
  citesSeedId?: string;
  matchedKeywordsOrConcepts?: string[];
  selectionScore: number;
  selectedForBatch: boolean;
  rejectionReason?: string;
}

export interface MultiVectorDiscoveryOptions {
  topicQuery?: string;
  seedDoiOrOpenAlexId?: string;
  maxCandidatesBudget?: number; // Overall candidate retrieval ceiling (default 50)
  perStrategyLimit?: number; // Per strategy fetch limit (default 15)
  targetBatchSize?: number; // Execution batch size (3 to 12 papers)
  includeBackwardCitations?: boolean;
  includeForwardCitations?: boolean;
  includeConceptExpansion?: boolean;
  includeCounterEvidence?: boolean;
  minYear?: number;
  maxYear?: number;
}

export interface MultiVectorDiscoveryResult {
  query: string;
  seedPaper: NormalizedOpenAlexPaper | null;
  candidates: DiscoveredCandidatePaper[];
  selectedBatch: DiscoveredCandidatePaper[];
  coverageMetadata: DiscoveryCoverageMetadata;
}

/**
 * Normalizes DOI strings into canonical lowercase format without protocol or URL wrappers.
 */
export function normalizeCanonicalDoi(rawDoi?: string | null): string | null {
  if (!rawDoi || typeof rawDoi !== 'string') return null;
  const trimmed = rawDoi.trim().toLowerCase();
  const cleaned = trimmed
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();

  // Basic format sanity check for DOI: starts with 10.
  if (/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(cleaned)) {
    return cleaned;
  }
  return cleaned.startsWith('10.') ? cleaned : null;
}

/**
 * Normalizes OpenAlex ID into canonical 'W...' identifier.
 */
export function normalizeCanonicalOpenAlexId(rawId?: string | null): string {
  if (!rawId || typeof rawId !== 'string') return '';
  return rawId.trim().replace(/^https?:\/\/openalex\.org\//i, '').toUpperCase();
}

export class LiteratureDiscoveryService {
  /**
   * Orchestrates multi-vector scholarly literature discovery across 5 distinct dimensions:
   * 1. Keyword & Semantic Topic Discovery
   * 2. Backward Citation Expansion (works referenced by seed)
   * 3. Forward Citation Expansion (works that cite seed)
   * 4. Concept & Related Topic Expansion
   * 5. Targeted Counter-Evidence Discovery (cites + limitation/trade-off queries)
   */
  public async discoverCorpus(options: MultiVectorDiscoveryOptions): Promise<MultiVectorDiscoveryResult> {
    const timestamp = new Date().toISOString();
    const query = (options.topicQuery || '').trim();
    const maxBudget = Math.max(10, Math.min(200, options.maxCandidatesBudget || 50));
    const perStrategyLimit = Math.max(5, Math.min(50, options.perStrategyLimit || 15));
    const targetBatchSize = Math.max(3, Math.min(12, options.targetBatchSize || 8));

    const candidatesMap = new Map<string, DiscoveredCandidatePaper>();
    const executedStrategies: string[] = [];
    const queriesExecuted: string[] = [];
    const strategyContributions: DiscoveryStrategyContribution[] = [];
    const unresolvedFailures: string[] = [];
    const paginationStates: Record<string, { page: number; perPage: number; hasMore: boolean }> = {};
    const rejectionReasonsSummary: Record<string, number> = {};

    let seedPaper: NormalizedOpenAlexPaper | null = null;

    // 0. Resolve Seed Paper if specified
    if (options.seedDoiOrOpenAlexId) {
      try {
        seedPaper = await openAlexService.getWorkByDoiOrId(options.seedDoiOrOpenAlexId);
      } catch (err: any) {
        unresolvedFailures.push(`Failed to resolve seed paper (${options.seedDoiOrOpenAlexId}): ${err.message}`);
      }
    }

    // Helper function to deduplicate and register candidate
    const registerCandidate = (
      paper: NormalizedOpenAlexPaper,
      strategy: DiscoveredCandidatePaper['discoverySourceStrategy'],
      path: string,
      meta?: { referencedBySeedId?: string; citesSeedId?: string; matched?: string[] }
    ): boolean => {
      const canonicalDoi = normalizeCanonicalDoi(paper.doi);
      const openAlexId = normalizeCanonicalOpenAlexId(paper.openAlexId);
      const primaryKey = canonicalDoi ? `doi:${canonicalDoi}` : `oa:${openAlexId}`;

      if (!primaryKey || primaryKey === 'oa:') return false;

      // Temporal filtering if specified
      const pubYear = paper.publicationYear || (paper.publicationDate ? parseInt(paper.publicationDate.slice(0, 4), 10) : null);
      if (options.minYear && pubYear && pubYear < options.minYear) {
        rejectionReasonsSummary['outside_min_year'] = (rejectionReasonsSummary['outside_min_year'] || 0) + 1;
        return false;
      }
      if (options.maxYear && pubYear && pubYear > options.maxYear) {
        rejectionReasonsSummary['outside_max_year'] = (rejectionReasonsSummary['outside_max_year'] || 0) + 1;
        return false;
      }

      if (candidatesMap.has(primaryKey)) {
        // Retain existing but enrich discovery path
        const existing = candidatesMap.get(primaryKey)!;
        existing.discoveryPath += ` | ${path}`;
        return false; // Deduplicated
      }

      // Compute initial diversity / relevance score
      // Balance citation count, open access presence, and recency
      const recencyBoost = pubYear ? Math.max(0, 10 - (2026 - pubYear)) : 0;
      const oaBoost = paper.openAccess?.isOa ? 5 : 0;
      const citationScore = Math.min(20, Math.log10(Math.max(1, paper.citationsCount || 0)) * 5);
      const strategyBoost = strategy === 'counter_evidence' ? 15 : strategy === 'forward_citation' ? 10 : 5;
      const selectionScore = strategyBoost + oaBoost + recencyBoost + citationScore;

      candidatesMap.set(primaryKey, {
        paper,
        canonicalDoi,
        openAlexId,
        discoverySourceStrategy: strategy,
        discoveryPath: path,
        referencedBySeedId: meta?.referencedBySeedId,
        citesSeedId: meta?.citesSeedId,
        matchedKeywordsOrConcepts: meta?.matched,
        selectionScore,
        selectedForBatch: false
      });

      return true;
    };

    // 1. STRATEGY 1: Keyword and Semantic Topic Discovery
    if (query) {
      executedStrategies.push('keyword_search');
      queriesExecuted.push(`searchWorks('${query}')`);
      try {
        const searchRes = await openAlexService.searchWorks(query, {
          page: 1,
          perPage: perStrategyLimit,
          sort: 'relevance_score:desc'
        });

        let newCount = 0;
        for (const item of searchRes.results) {
          if (registerCandidate(item, 'keyword_search', `query:${query}`)) {
            newCount++;
          }
        }

        strategyContributions.push({
          strategy: 'keyword_search',
          queryOrFilter: query,
          totalReportedCount: searchRes.totalCount,
          retrievedCount: searchRes.results.length,
          deduplicatedCount: searchRes.results.length - newCount,
          selectedCount: newCount
        });

        paginationStates['keyword_search'] = {
          page: 1,
          perPage: perStrategyLimit,
          hasMore: searchRes.totalCount > perStrategyLimit
        };
      } catch (err: any) {
        unresolvedFailures.push(`Keyword search error: ${err.message}`);
      }
    }

    // 2. STRATEGY 2: Backward Citation Expansion (referenced works of seed)
    if (seedPaper && (options.includeBackwardCitations !== false)) {
      executedStrategies.push('backward_citation');
      const seedOaId = normalizeCanonicalOpenAlexId(seedPaper.openAlexId);
      queriesExecuted.push(`backward_citations(seed:${seedOaId})`);

      try {
        // Fetch raw work to access referenced_works array
        const rawWorkRes = await fetch(`${openAlexService.getBaseUrl()}/works/${seedOaId}`, {
          headers: {
            'User-Agent': 'Anviksa-OpenScience-Harvester/1.0',
            'Accept': 'application/json',
            ...(openAlexService.getApiKey() ? { 'Authorization': `Bearer ${openAlexService.getApiKey()}` } : {})
          }
        });

        if (rawWorkRes.ok) {
          const rawWork = await rawWorkRes.json();
          const refIds: string[] = Array.isArray(rawWork?.referenced_works)
            ? rawWork.referenced_works.slice(0, perStrategyLimit)
            : [];

          let retrieved = 0;
          let newCount = 0;

          if (refIds.length > 0) {
            // Batch resolve referenced works using filter=openalex_id:W1|W2
            const cleanRefIds = refIds.map(id => id.replace('https://openalex.org/', '')).join('|');
            const batchRefsRes = await fetch(
              `${openAlexService.getBaseUrl()}/works?filter=openalex_id:${cleanRefIds}&per-page=${perStrategyLimit}`,
              {
                headers: {
                  'User-Agent': 'Anviksa-OpenScience-Harvester/1.0',
                  'Accept': 'application/json',
                  ...(openAlexService.getApiKey() ? { 'Authorization': `Bearer ${openAlexService.getApiKey()}` } : {})
                }
              }
            );

            if (batchRefsRes.ok) {
              const batchData = await batchRefsRes.json();
              for (const rw of batchData?.results || []) {
                retrieved++;
                const normPaper = await openAlexService.getWorkByDoiOrId(rw.id);
                if (registerCandidate(normPaper, 'backward_citation', `seed:${seedOaId} -> referenced`, {
                  referencedBySeedId: seedOaId
                })) {
                  newCount++;
                }
              }
            }
          }

          strategyContributions.push({
            strategy: 'backward_citation',
            queryOrFilter: `seed:${seedOaId}`,
            totalReportedCount: rawWork?.referenced_works?.length || 0,
            retrievedCount: retrieved,
            deduplicatedCount: retrieved - newCount,
            selectedCount: newCount
          });
        }
      } catch (err: any) {
        unresolvedFailures.push(`Backward citation expansion error: ${err.message}`);
      }
    }

    // 3. STRATEGY 3: Forward Citation Expansion (works citing seed)
    if (seedPaper && (options.includeForwardCitations !== false)) {
      executedStrategies.push('forward_citation');
      const seedOaId = normalizeCanonicalOpenAlexId(seedPaper.openAlexId);
      const filter = `cites:${seedOaId}`;
      queriesExecuted.push(`works?filter=${filter}`);

      try {
        const citingRes = await fetch(
          `${openAlexService.getBaseUrl()}/works?filter=${filter}&sort=cited_by_count:desc&per-page=${perStrategyLimit}&page=1`,
          {
            headers: {
              'User-Agent': 'Anviksa-OpenScience-Harvester/1.0',
              'Accept': 'application/json',
              ...(openAlexService.getApiKey() ? { 'Authorization': `Bearer ${openAlexService.getApiKey()}` } : {})
            }
          }
        );

        if (citingRes.ok) {
          const data = await citingRes.json();
          const results = data?.results || [];
          let newCount = 0;
          for (const item of results) {
            const normPaper = await openAlexService.getWorkByDoiOrId(item.id);
            if (registerCandidate(normPaper, 'forward_citation', `seed:${seedOaId} -> cited_by`, {
              citesSeedId: seedOaId
            })) {
              newCount++;
            }
          }

          strategyContributions.push({
            strategy: 'forward_citation',
            queryOrFilter: filter,
            totalReportedCount: Number(data?.meta?.count || 0),
            retrievedCount: results.length,
            deduplicatedCount: results.length - newCount,
            selectedCount: newCount
          });

          paginationStates['forward_citation'] = {
            page: 1,
            perPage: perStrategyLimit,
            hasMore: Number(data?.meta?.count || 0) > perStrategyLimit
          };
        }
      } catch (err: any) {
        unresolvedFailures.push(`Forward citation expansion error: ${err.message}`);
      }
    }

    // 4. STRATEGY 4: Targeted Counter-Evidence Discovery
    // Search papers citing the seed or matching the topic with keywords explicitly targeting limits/bottlenecks
    if (options.includeCounterEvidence !== false && (seedPaper || query)) {
      executedStrategies.push('counter_evidence');
      const seedOaId = seedPaper ? normalizeCanonicalOpenAlexId(seedPaper.openAlexId) : null;
      const counterKeywords = 'limitation OR bottleneck OR trade-off OR failure OR contradiction';
      
      let filterParam = '';
      if (seedOaId) {
        filterParam = `cites:${seedOaId}`;
      }

      queriesExecuted.push(`counter_evidence(${seedOaId ? `filter=${filterParam}&` : ''}search='${counterKeywords}')`);

      try {
        const urlParams = new URLSearchParams();
        if (filterParam) urlParams.set('filter', filterParam);
        urlParams.set('search', counterKeywords);
        urlParams.set('per-page', String(perStrategyLimit));
        urlParams.set('page', '1');

        const counterRes = await fetch(`${openAlexService.getBaseUrl()}/works?${urlParams.toString()}`, {
          headers: {
            'User-Agent': 'Anviksa-OpenScience-Harvester/1.0',
            'Accept': 'application/json',
            ...(openAlexService.getApiKey() ? { 'Authorization': `Bearer ${openAlexService.getApiKey()}` } : {})
          }
        });

        if (counterRes.ok) {
          const data = await counterRes.json();
          const results = data?.results || [];
          let newCount = 0;
          for (const item of results) {
            const normPaper = await openAlexService.getWorkByDoiOrId(item.id);
            if (registerCandidate(normPaper, 'counter_evidence', `counter_search:${counterKeywords}`, {
              citesSeedId: seedOaId || undefined,
              matched: ['limitation', 'bottleneck', 'counter_evidence']
            })) {
              newCount++;
            }
          }

          strategyContributions.push({
            strategy: 'counter_evidence',
            queryOrFilter: counterKeywords,
            totalReportedCount: Number(data?.meta?.count || 0),
            retrievedCount: results.length,
            deduplicatedCount: results.length - newCount,
            selectedCount: newCount
          });
        }
      } catch (err: any) {
        unresolvedFailures.push(`Counter-evidence search error: ${err.message}`);
      }
    }

    // 5. STRATEGY 5: Concept / Related Topic Expansion
    if (options.includeConceptExpansion !== false && (seedPaper?.topics?.length || query)) {
      executedStrategies.push('concept_expansion');
      const conceptToSearch = seedPaper?.topics?.[0] || query;
      queriesExecuted.push(`topic_expansion('${conceptToSearch}')`);

      try {
        const searchRes = await openAlexService.searchWorks(conceptToSearch, {
          page: 1,
          perPage: perStrategyLimit,
          sort: 'cited_by_count:desc'
        });

        let newCount = 0;
        for (const item of searchRes.results) {
          if (registerCandidate(item, 'concept_expansion', `concept:${conceptToSearch}`, {
            matched: [conceptToSearch]
          })) {
            newCount++;
          }
        }

        strategyContributions.push({
          strategy: 'concept_expansion',
          queryOrFilter: conceptToSearch,
          totalReportedCount: searchRes.totalCount,
          retrievedCount: searchRes.results.length,
          deduplicatedCount: searchRes.results.length - newCount,
          selectedCount: newCount
        });
      } catch (err: any) {
        unresolvedFailures.push(`Concept expansion error: ${err.message}`);
      }
    }

    // 6. Candidate Diversity Selection & Ingestion Batching
    // Sort all registered candidates by selection score (prioritizing counter-evidence and open-access)
    const allCandidates = Array.from(candidatesMap.values());
    allCandidates.sort((a, b) => b.selectionScore - a.selectionScore);

    // Enforce overall budget limit
    const budgetedCandidates = allCandidates.slice(0, maxBudget);

    // Select the ingestion batch (bounded between 3 and 12 papers)
    // Guarantee inclusion of at least 1 counter-evidence candidate if discovered
    const selectedBatch: DiscoveredCandidatePaper[] = [];
    const counterCandidate = budgetedCandidates.find(c => c.discoverySourceStrategy === 'counter_evidence');
    if (counterCandidate) {
      counterCandidate.selectedForBatch = true;
      selectedBatch.push(counterCandidate);
    }

    for (const cand of budgetedCandidates) {
      if (selectedBatch.length >= targetBatchSize) break;
      if (!cand.selectedForBatch) {
        cand.selectedForBatch = true;
        selectedBatch.push(cand);
      }
    }

    // Mark rejection reasons for candidates not selected into the execution batch
    for (const cand of allCandidates) {
      if (!cand.selectedForBatch) {
        cand.rejectionReason = 'Exceeded batch execution capacity (retained in corpus discovery pool)';
        rejectionReasonsSummary['batch_capacity_limit'] = (rejectionReasonsSummary['batch_capacity_limit'] || 0) + 1;
      }
    }

    // Compute publication period distribution
    const periodDist: Record<string, number> = {};
    for (const cand of budgetedCandidates) {
      const year = cand.paper.publicationYear;
      if (year) {
        const bin = year >= 2024 ? '2024-Present' : year >= 2020 ? '2020-2023' : year >= 2015 ? '2015-2019' : 'Pre-2015';
        periodDist[bin] = (periodDist[bin] || 0) + 1;
      } else {
        periodDist['Unknown'] = (periodDist['Unknown'] || 0) + 1;
      }
    }

    const coverageMetadata: DiscoveryCoverageMetadata = {
      executedStrategies,
      queriesExecuted,
      paginationStates,
      candidatesRetrievedCount: strategyContributions.reduce((acc, c) => acc + c.retrievedCount, 0),
      candidatesDeduplicatedCount: strategyContributions.reduce((acc, c) => acc + c.deduplicatedCount, 0),
      candidatesSelectedCount: selectedBatch.length,
      candidatesRejectedCount: allCandidates.length - selectedBatch.length,
      rejectionReasonsSummary,
      publicationPeriodDistribution: periodDist,
      strategyContributions,
      unresolvedApiFailures: unresolvedFailures,
      discoveryTimestamp: timestamp,
      isExhaustive: false,
      coverageNote: 'Discovery bounded by configured sampling budget. Literature horizon remains expandable via pagination.'
    };

    return {
      query,
      seedPaper,
      candidates: budgetedCandidates,
      selectedBatch,
      coverageMetadata
    };
  }
}

export const literatureDiscoveryService = new LiteratureDiscoveryService();
