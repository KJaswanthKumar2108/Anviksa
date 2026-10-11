/**
 * OpenResearch DOI & Record Deduplication Utility
 * 
 * Provides strict normalization for DOIs, Titles, and Research Records to prevent duplicates
 * and ensure clean data provenance.
 */

export function normalizeDoi(doiInput?: string): string {
  if (!doiInput) return '';
  let cleaned = doiInput.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  cleaned = cleaned.replace(/^doi:\s*/, '');
  return cleaned;
}

export function normalizeTitle(titleInput?: string): string {
  if (!titleInput) return '';
  return titleInput
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
}

export function deduplicatePapers<T extends { id: string; doi?: string; title: string }>(papers: T[]): T[] {
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();
  const result: T[] = [];

  for (const paper of papers) {
    const normalizedDoi = normalizeDoi(paper.doi);
    const normTitle = normalizeTitle(paper.title);

    if (normalizedDoi && seenDois.has(normalizedDoi)) {
      continue; // Skip duplicate DOI
    }
    if (normTitle && seenTitles.has(normTitle)) {
      continue; // Skip duplicate Title
    }

    if (normalizedDoi) seenDois.add(normalizedDoi);
    if (normTitle) seenTitles.add(normTitle);
    result.push(paper);
  }

  return result;
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}
