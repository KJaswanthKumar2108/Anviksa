/**
 * Strongly-typed definitions for OpenAlex scholarly literature data
 * and Full-Text Retrieval / Extraction.
 * Pure TypeScript interfaces safe for frontend and backend consumption.
 */

export interface OpenAccessInfo {
  isOa: boolean;
  oaStatus: string; // 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed'
  oaUrl: string | null;
  anyRepositoryHasFulltext: boolean;
}

export interface CandidateLocation {
  source: string;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  license: string | null;
  version: string | null;
  isOa: boolean;
}

export interface NormalizedOpenAlexPaper {
  id: string; // e.g. "https://openalex.org/W2559394418" or "W2559394418"
  openAlexId: string;
  doi: string | null;
  title: string;
  authors: string[];
  publicationYear: number | null;
  publicationDate: string | null;
  journal: string;
  citationsCount: number;
  openAccess: OpenAccessInfo;
  abstract: string;
  field: string;
  topics: string[];
  landingPageUrl: string | null;
  pdfUrl: string | null;
  type: string;
  license?: string | null;
  locations?: CandidateLocation[];
}

export interface OpenAlexSearchResult {
  query: string;
  page: number;
  perPage: number;
  totalCount: number;
  results: NormalizedOpenAlexPaper[];
}

export type FullTextStatus =
  | 'unattempted'
  | 'metadata_only'
  | 'retrieving'
  | 'pdf_available'
  | 'html_available'
  | 'extracted'
  | 'restricted'
  | 'failed';

export type ExtractionStatus = 'pending' | 'success' | 'failed' | 'skipped';

export interface ExtractedSection {
  name: string; // e.g. 'Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Limitations', 'Conclusion', 'References'
  heading?: string;
  content: string;
  pageStart?: number;
  pageEnd?: number;
  characterCount: number;
}

export interface GemmaChunk {
  chunkIndex: number;
  section: string;
  pageStart: number;
  pageEnd: number;
  citationRef: string;
  text: string;
  tokenEstimate: number;
}

export interface ExtractedDocument {
  title: string;
  authors?: string[];
  doi?: string | null;
  pageCount: number;
  characterCount: number;
  checksumSha256: string;
  sourceUrl: string;
  sourceType: 'pdf' | 'html' | 'repository' | 'publisher';
  license: string | null;
  sections: Record<string, ExtractedSection>;
  gemmaChunks: GemmaChunk[];
  extractedAt: string;
}

export interface FullTextRetrievalResult {
  paperId?: string;
  doi?: string | null;
  openAlexId?: string | null;
  status: FullTextStatus;
  extractionStatus: ExtractionStatus;
  hasAccessiblePdf: boolean;
  hasAccessibleHtml: boolean;
  sourceUrl: string | null;
  sourceType: 'pdf' | 'html' | 'repository' | 'publisher' | null;
  license: string | null;
  documentChecksum: string | null;
  document?: ExtractedDocument | null;
  error?: string | null;
  retrievedAt: string;
}
