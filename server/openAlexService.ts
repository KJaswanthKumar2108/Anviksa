/**
 * OpenAlex API Backend Service
 * 
 * Server-only service providing live scholarly literature search, DOI resolution,
 * and normalized metadata retrieval from OpenAlex (https://api.openalex.org)
 * using server-side credentials and Authorization: Bearer headers.
 * 
 * Exclusively executed in Node.js / Express backend context.
 */

import type { NormalizedOpenAlexPaper, OpenAccessInfo, OpenAlexSearchResult, CandidateLocation } from '../src/types/openalex.js';

export type { NormalizedOpenAlexPaper, OpenAccessInfo, OpenAlexSearchResult, CandidateLocation };

/**
 * Reconstructs continuous human-readable abstract text from OpenAlex's abstract_inverted_index.
 */
export function reconstructAbstract(invertedIndex?: Record<string, number[]> | null): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';

  const wordPositionPairs: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        if (typeof pos === 'number') {
          wordPositionPairs.push({ word, pos });
        }
      }
    }
  }

  if (wordPositionPairs.length === 0) return '';

  wordPositionPairs.sort((a, b) => a.pos - b.pos);
  return wordPositionPairs.map(p => p.word).join(' ');
}

/**
 * Normalizes a raw OpenAlex work object into a clean, strongly-typed paper record.
 * Missing metadata is handled with explicit fallbacks without fabricating scientific data.
 */
export function normalizeOpenAlexWork(raw: any): NormalizedOpenAlexPaper {
  const openAlexId = String(raw?.id || '').replace('https://openalex.org/', '');
  
  // Format DOI cleanly
  let doi = raw?.doi || null;
  if (doi && typeof doi === 'string') {
    doi = doi.replace(/^https?:\/\/doi\.org\//i, '').trim();
  }

  // Extract author display names
  const authors: string[] = Array.isArray(raw?.authorships)
    ? raw.authorships
        .map((a: any) => a?.author?.display_name)
        .filter((name: any): name is string => typeof name === 'string' && name.trim().length > 0)
    : [];

  // Extract primary host / journal / venue
  const primaryLocation = raw?.primary_location || {};
  const source = primaryLocation?.source || {};
  const journal =
    source?.display_name ||
    raw?.host_venue?.display_name ||
    raw?.biblio?.journal ||
    (raw?.type === 'preprint' ? 'Preprint Server / arXiv' : 'Scholarly Publication');

  // Extract primary field / domain
  const primaryTopic = raw?.primary_topic || {};
  const field =
    primaryTopic?.field?.display_name ||
    primaryTopic?.domain?.display_name ||
    primaryTopic?.subfield?.display_name ||
    'Multidisciplinary Science';

  // Extract subtopics
  const topics: string[] = Array.isArray(raw?.topics)
    ? raw.topics
        .map((t: any) => t?.display_name)
        .filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 5)
    : [];

  // Open Access metadata
  const openAccessRaw = raw?.open_access || {};
  const openAccess: OpenAccessInfo = {
    isOa: Boolean(openAccessRaw?.is_oa ?? primaryLocation?.is_oa ?? false),
    oaStatus: String(openAccessRaw?.oa_status || 'closed'),
    oaUrl: openAccessRaw?.oa_url || primaryLocation?.pdf_url || null,
    anyRepositoryHasFulltext: Boolean(openAccessRaw?.any_repository_has_fulltext ?? false)
  };

  const pdfUrl = raw?.best_oa_location?.pdf_url || primaryLocation?.pdf_url || openAccess.oaUrl || null;
  const landingPageUrl = raw?.best_oa_location?.landing_page_url || primaryLocation?.landing_page_url || raw?.doi || null;
  const license = raw?.best_oa_location?.license || primaryLocation?.license || null;

  const candidateLocations: CandidateLocation[] = Array.isArray(raw?.locations)
    ? raw.locations.map((loc: any) => ({
        source: loc?.source?.display_name || loc?.source?.host_organization_name || 'Repository / Publisher',
        pdfUrl: loc?.pdf_url || null,
        landingPageUrl: loc?.landing_page_url || null,
        license: loc?.license || null,
        version: loc?.version || null,
        isOa: Boolean(loc?.is_oa ?? false)
      }))
    : [];

  const abstract = reconstructAbstract(raw?.abstract_inverted_index) || raw?.abstract || 'No abstract preview available for this publication.';

  return {
    id: raw?.id || `https://openalex.org/${openAlexId}`,
    openAlexId,
    doi,
    title: raw?.title || 'Untitled Publication',
    authors: authors.length > 0 ? authors : ['Unknown Author(s)'],
    publicationYear: typeof raw?.publication_year === 'number' ? raw.publication_year : null,
    publicationDate: raw?.publication_date || null,
    journal,
    citationsCount: typeof raw?.cited_by_count === 'number' ? raw.cited_by_count : 0,
    openAccess,
    abstract,
    field,
    topics,
    landingPageUrl,
    pdfUrl,
    type: raw?.type || 'article',
    license,
    locations: candidateLocations
  };
}

export interface OpenAlexServiceConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * OpenAlex Service class handling HTTP requests, bearer authentication,
 * rate limit detection, and structured error responses.
 */
export class OpenAlexService {
  private explicitApiKey?: string;
  private explicitBaseUrl?: string;

  constructor(config?: OpenAlexServiceConfig) {
    this.explicitApiKey = config?.apiKey;
    this.explicitBaseUrl = config?.baseUrl;
  }

  public getApiKey(): string {
    return this.explicitApiKey || process.env.OPENALEX_API_KEY || '';
  }

  public getBaseUrl(): string {
    const raw = this.explicitBaseUrl || process.env.OPENALEX_BASE_URL || 'https://api.openalex.org';
    return raw.replace(/\/+$/, '');
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Anviksa-Research-Platform/1.0',
      'Accept': 'application/json'
    };
    const key = this.getApiKey();
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
    }
    return headers;
  }

  /**
   * Performs live keyword/semantic literature search over OpenAlex Works.
   */
  public async searchWorks(
    query: string,
    options: { page?: number; perPage?: number; filter?: string; sort?: string; searchField?: 'default' | 'title' } = {}
  ): Promise<OpenAlexSearchResult> {
    if (!query || !query.trim()) {
      const err: any = new Error('Search query is required and cannot be empty.');
      err.status = 400;
      err.code = 'INVALID_QUERY';
      throw err;
    }

    if (!this.isConfigured()) {
      const err: any = new Error('OPENALEX_API_KEY is not configured on the server environment.');
      err.status = 503;
      err.code = 'OPENALEX_KEY_MISSING';
      throw err;
    }

    const page = Math.max(1, options.page || 1);
    const perPage = Math.min(100, Math.max(1, options.perPage || 10));

    const params = new URLSearchParams();
    if (options.searchField === 'title') {
      params.set('filter', `title.search:${query.trim()}${options.filter ? `,${options.filter}` : ''}`);
    } else {
      params.set('search', query.trim());
      if (options.filter) {
        params.set('filter', options.filter);
      }
    }
    params.set('page', String(page));
    params.set('per-page', String(perPage));

    if (options.sort) {
      params.set('sort', options.sort);
    }

    const targetUrl = `${this.getBaseUrl()}/works?${params.toString()}`;
    const response = await this.executeFetch(targetUrl);
    const data = await response.json();

    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const normalizedResults = rawResults.map(normalizeOpenAlexWork);

    return {
      query: query.trim(),
      page,
      perPage,
      totalCount: Number(data?.meta?.count || 0),
      results: normalizedResults
    };
  }

  /**
   * Resolves a work by clean DOI, URL DOI, or OpenAlex ID.
   */
  public async getWorkByDoiOrId(identifier: string): Promise<NormalizedOpenAlexPaper> {
    if (!identifier || !identifier.trim()) {
      const err: any = new Error('Identifier (DOI or OpenAlex ID) is required.');
      err.status = 400;
      err.code = 'INVALID_IDENTIFIER';
      throw err;
    }

    if (!this.isConfigured()) {
      const err: any = new Error('OPENALEX_API_KEY is not configured on the server environment.');
      err.status = 503;
      err.code = 'OPENALEX_KEY_MISSING';
      throw err;
    }

    let cleanId = identifier.trim();
    let targetUrl: string;

    const baseUrl = this.getBaseUrl();
    if (cleanId.startsWith('10.') || cleanId.includes('doi.org/')) {
      const doi = cleanId.replace(/^https?:\/\/doi\.org\//i, '').trim();
      targetUrl = `${baseUrl}/works/https://doi.org/${doi}`;
    } else if (cleanId.includes('openalex.org/')) {
      const oaId = cleanId.replace(/^https?:\/\/openalex\.org\//i, '').trim();
      targetUrl = `${baseUrl}/works/${oaId}`;
    } else if (cleanId.startsWith('W') || cleanId.startsWith('w')) {
      targetUrl = `${baseUrl}/works/${cleanId}`;
    } else {
      targetUrl = `${baseUrl}/works/${encodeURIComponent(cleanId)}`;
    }

    const response = await this.executeFetch(targetUrl);
    const data = await response.json();
    return normalizeOpenAlexWork(data);
  }

  /**
   * Executes fetch with centralized rate limit handling, timeouts, and provider error extraction.
   */
  private async executeFetch(url: string, timeoutMs: number = 15000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorBody = '';
        try {
          const rawText = await response.text();
          try {
            const jsonBody = JSON.parse(rawText);
            errorBody = jsonBody?.message || jsonBody?.error || jsonBody?.error_description || JSON.stringify(jsonBody);
          } catch {
            errorBody = rawText;
          }
        } catch {
          errorBody = response.statusText;
        }

        const err: any = new Error(
          response.status === 429
            ? 'OpenAlex rate limit exceeded. Please retry after a brief moment.'
            : response.status === 404
            ? 'Requested research publication was not found on OpenAlex.'
            : `OpenAlex provider returned error (${response.status}): ${errorBody || response.statusText}`
        );
        err.status = response.status;
        err.providerStatus = response.status;
        err.providerBody = errorBody;
        throw err;
      }

      return response;
    } catch (networkError: any) {
      if (networkError.status) throw networkError;
      if (networkError.name === 'AbortError') {
        const timeoutErr: any = new Error(`OpenAlex API request timed out after ${timeoutMs}ms.`);
        timeoutErr.status = 504;
        timeoutErr.code = 'PROVIDER_TIMEOUT';
        throw timeoutErr;
      }
      const wrapped: any = new Error(`Network failure communicating with OpenAlex API: ${networkError.message || networkError}`);
      wrapped.status = 502;
      throw wrapped;
    } finally {
      clearTimeout(timer);
    }
  }
}

// Default singleton export
export const openAlexService = new OpenAlexService();
