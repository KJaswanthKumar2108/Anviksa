import { fullTextService } from './fullTextService.js';
import { openAlexService, NormalizedOpenAlexPaper } from './openAlexService.js';
import { getSupabaseAdmin } from '../src/lib/supabase.js';
import {
  normalizeScholarlyText,
  computeSha256,
  findCodepointOffsets,
  TEXT_NORMALIZATION_VERSION,
  OFFSET_UNIT
} from './textProvenanceUtils.js';
import { normalizeCanonicalDoi, normalizeCanonicalOpenAlexId } from './literatureDiscoveryService.js';

export type IngestionRetrievalStatus =
  | 'FULL_TEXT_RETRIEVED'
  | 'ABSTRACT_ONLY'
  | 'METADATA_ONLY'
  | 'ACCESS_RESTRICTED'
  | 'UNSUPPORTED_FORMAT'
  | 'RETRIEVAL_FAILED'
  | 'INTEGRITY_VERIFICATION_FAILED';

export interface IngestionChunk {
  chunkIndex: number;
  section: string;
  pageStart: number;
  pageEnd: number;
  startOffsetCodepoints: number;
  endOffsetCodepoints: number;
  chunkChecksum: string; // SHA-256 of canonical normalized chunk text
  citationLocator: string;
  normalizedText: string;
}

export interface IngestionPaperResult {
  paperId?: string; // Supabase research_papers UUID if persisted
  doi: string | null;
  openAlexId: string;
  title: string;
  authors: string[];
  publicationDate: string | null;
  journal: string | null;
  retrievalStatus: IngestionRetrievalStatus;
  evidenceCompleteness: 'FULL_TEXT' | 'ABSTRACT_ONLY_GROUNDING' | 'METADATA_ONLY';
  sourceUrl: string | null;
  sourceDocumentChecksum: string | null; // SHA-256 of raw bytes
  extractedTextChecksum: string | null;   // SHA-256 of full normalized text
  textNormalizationVersion: string;
  offsetUnit: string;
  sectionsDetected: string[];
  chunks: IngestionChunk[];
  totalCharacterCount: number;
  errorMessage?: string;
  isPersisted: boolean;
}

export interface BatchIngestionResult {
  batchId: string;
  requestedCount: number;
  succeededCount: number;
  abstractOnlyCount: number;
  failedCount: number;
  items: IngestionPaperResult[];
  startedAt: string;
  completedAt: string;
  executionDurationMs: number;
}

export class MultiPaperIngestionService {
  /**
   * Ingests a single scholarly publication with end-to-end evidence hashing,
   * Unicode codepoint offset mapping, IMRAD chunking, and database persistence.
   */
  public async ingestSinglePaper(
    paperInput: NormalizedOpenAlexPaper | string,
    options: { persistToDatabase?: boolean; uploaderId?: string | null; visibility?: string } = {}
  ): Promise<IngestionPaperResult> {
    let paper: NormalizedOpenAlexPaper;

    if (typeof paperInput === 'string') {
      paper = await openAlexService.getWorkByDoiOrId(paperInput);
    } else {
      paper = paperInput;
    }

    const canonicalDoi = normalizeCanonicalDoi(paper.doi);
    const openAlexId = normalizeCanonicalOpenAlexId(paper.openAlexId);
    const persist = options.persistToDatabase !== false;

    // 1. Attempt Full-Text Retrieval via Source-Aware OA Pipeline
    let retrievalStatus: IngestionRetrievalStatus = 'METADATA_ONLY';
    let evidenceCompleteness: IngestionPaperResult['evidenceCompleteness'] = 'METADATA_ONLY';
    let sourceUrl: string | null = null;
    let sourceChecksum: string | null = null;
    let extractedChecksum: string | null = null;
    let rawExtractedText = '';
    let errorMessage: string | undefined = undefined;
    const pages: { num: number; text: string }[] = [];

    const oaInfo = fullTextService.prioritizeOaLocations(paper);

    if (oaInfo.pdfUrl) {
      sourceUrl = oaInfo.pdfUrl;
      try {
        const download = await fullTextService.fetchAndValidateDocument(oaInfo.pdfUrl);
        sourceChecksum = `sha256:${download.checksum}`;

        if (download.isPdf) {
          const mod = await import('pdf-parse');
          const PDFParseClass: any = (mod as any).PDFParse || (mod as any).default?.PDFParse || (mod as any).default || mod;
          const parser = typeof PDFParseClass === 'function' ? new PDFParseClass({ data: download.buffer }) : null;
          
          let parsedData: any;
          if (parser && typeof parser.getText === 'function') {
            parsedData = await parser.getText();
            if (typeof parser.destroy === 'function') {
              await parser.destroy();
            }
          } else if (typeof PDFParseClass === 'function') {
            parsedData = await PDFParseClass(download.buffer);
          }

          rawExtractedText = parsedData?.text || '';
          const numPages = parsedData?.numpages || 1;
          
          if (rawExtractedText.trim().length > 100) {
            retrievalStatus = 'FULL_TEXT_RETRIEVED';
            evidenceCompleteness = 'FULL_TEXT';
            // If page markers aren't explicit, segment roughly across pages
            pages.push({ num: 1, text: rawExtractedText });
          } else {
            retrievalStatus = 'UNSUPPORTED_FORMAT';
            errorMessage = 'PDF text extraction returned empty or image-only content';
          }
        }
      } catch (dlErr: any) {
        if (dlErr.code === 'DOCUMENT_TOO_LARGE' || dlErr.status === 413) {
          retrievalStatus = 'UNSUPPORTED_FORMAT';
        } else if (dlErr.code === 'SSRF_VALIDATION_FAILED') {
          retrievalStatus = 'ACCESS_RESTRICTED';
        } else {
          retrievalStatus = 'RETRIEVAL_FAILED';
        }
        errorMessage = dlErr.message || String(dlErr);
      }
    }

    // 2. Fallback to Abstract-Only Evidence Policy if full text was not retrieved
    if (retrievalStatus !== 'FULL_TEXT_RETRIEVED') {
      if (paper.abstract && paper.abstract.trim().length > 20 && !paper.abstract.includes('No abstract preview')) {
        retrievalStatus = 'ABSTRACT_ONLY';
        evidenceCompleteness = 'ABSTRACT_ONLY_GROUNDING';
        rawExtractedText = paper.abstract;
        pages.push({ num: 1, text: paper.abstract });
        sourceUrl = paper.landingPageUrl || (canonicalDoi ? `https://doi.org/${canonicalDoi}` : null);
        sourceChecksum = computeSha256(paper.abstract); // Source is the scholarly abstract
      }
    }

    // 3. Normalize Extracted Text using Unicode NFC and Compute Checksums
    const normalizedFullText = normalizeScholarlyText(rawExtractedText);
    extractedChecksum = computeSha256(normalizedFullText);

    // 4. IMRAD Section Segmentation & Stable Chunks with Unicode Codepoint Offsets
    const chunks: IngestionChunk[] = [];
    const sectionsDetected: string[] = [];

    if (normalizedFullText.length > 0) {
      const { sections, gemmaChunks } = fullTextService.segmentSectionsAndChunks(
        pages.length > 0 ? pages : [{ num: 1, text: normalizedFullText }],
        {
          title: paper.title,
          doi: canonicalDoi,
          license: paper.license,
          sourceUrl: sourceUrl || '',
          checksum: extractedChecksum
        }
      );

      for (const [sName, sData] of Object.entries(sections)) {
        if (sData.characterCount > 0) {
          sectionsDetected.push(sName);
        }
      }

      for (const gChunk of gemmaChunks) {
        const normChunkText = normalizeScholarlyText(gChunk.text);
        const chunkHash = computeSha256(normChunkText);

        // Calculate exact 0-based Unicode codepoint offsets within the normalized document text
        const offsets = findCodepointOffsets(normalizedFullText, normChunkText);

        chunks.push({
          chunkIndex: gChunk.chunkIndex,
          section: gChunk.section,
          pageStart: gChunk.pageStart,
          pageEnd: gChunk.pageEnd,
          startOffsetCodepoints: offsets ? offsets.start : 0,
          endOffsetCodepoints: offsets ? offsets.end : [...normChunkText].length,
          chunkChecksum: chunkHash,
          citationLocator: gChunk.citationRef,
          normalizedText: normChunkText
        });
      }
    }

    // 5. Database Persistence (Idempotent upsert into public.research_papers)
    let persistedPaperId: string | undefined = undefined;
    let isPersisted = false;

    if (persist) {
      const admin = getSupabaseAdmin();
      if (admin) {
        try {
          // Check for existing paper by canonical DOI or title to ensure idempotence
          let existingId: string | null = null;
          if (canonicalDoi) {
            const { data: existing } = await admin
              .from('research_papers')
              .select('id')
              .ilike('doi', `%${canonicalDoi}%`)
              .maybeSingle();
            if (existing) existingId = existing.id;
          }

          if (!existingId) {
            const { data: existingTitle } = await admin
              .from('research_papers')
              .select('id')
              .eq('title', paper.title)
              .maybeSingle();
            if (existingTitle) existingId = existingTitle.id;
          }

          const paperRecordPayload = {
            doi: canonicalDoi || null,
            title: paper.title,
            authors: paper.authors,
            publication_date: paper.publicationDate || null,
            journal: paper.journal || null,
            citations_count: paper.citationsCount || 0,
            open_access: paper.openAccess?.isOa || false,
            abstract: paper.abstract || 'No abstract available.',
            field: paper.field || 'Multidisciplinary',
            subject_tags: paper.topics || [],
            pdf_url: sourceUrl,
            visibility: options.visibility || 'public',
            fulltext_status: retrievalStatus === 'FULL_TEXT_RETRIEVED' ? 'available' : 'unavailable',
            fulltext_source_url: sourceUrl,
            fulltext_source_type: retrievalStatus === 'FULL_TEXT_RETRIEVED' ? 'pdf' : 'abstract',
            access_status: paper.openAccess?.oaStatus || 'unknown',
            license: paper.license || null,
            extraction_status: chunks.length > 0 ? 'completed' : 'failed',
            extracted_at: new Date().toISOString(),
            document_checksum: sourceChecksum,
            extraction_error: errorMessage || null,
            extracted_sections: sectionsDetected,
            extracted_chunks: chunks.map(c => ({
              chunkIndex: c.chunkIndex,
              section: c.section,
              pageStart: c.pageStart,
              pageEnd: c.pageEnd,
              startOffset: c.startOffsetCodepoints,
              endOffset: c.endOffsetCodepoints,
              chunkChecksum: c.chunkChecksum,
              citationLocator: c.citationLocator
            }))
          };

          if (existingId) {
            const { data: updated, error: updateErr } = await admin
              .from('research_papers')
              .update(paperRecordPayload)
              .eq('id', existingId)
              .select('id')
              .single();

            if (!updateErr && updated) {
              persistedPaperId = updated.id;
              isPersisted = true;
            }
          } else {
            const { data: inserted, error: insertErr } = await admin
              .from('research_papers')
              .insert(paperRecordPayload)
              .select('id')
              .single();

            if (!insertErr && inserted) {
              persistedPaperId = inserted.id;
              isPersisted = true;
            }
          }
        } catch (dbErr: any) {
          // Non-blocking persistence warning
          console.warn('[MultiPaperIngestionService] Database persistence warning:', dbErr.message);
        }
      }
    }

    return {
      paperId: persistedPaperId,
      doi: canonicalDoi,
      openAlexId,
      title: paper.title,
      authors: paper.authors,
      publicationDate: paper.publicationDate,
      journal: paper.journal,
      retrievalStatus,
      evidenceCompleteness,
      sourceUrl,
      sourceDocumentChecksum: sourceChecksum,
      extractedTextChecksum: extractedChecksum,
      textNormalizationVersion: TEXT_NORMALIZATION_VERSION,
      offsetUnit: OFFSET_UNIT,
      sectionsDetected,
      chunks,
      totalCharacterCount: normalizedFullText.length,
      errorMessage,
      isPersisted
    };
  }

  /**
   * Orchestrates batch ingestion for a collection of candidate papers (3 to 12 papers).
   * Enforces failure isolation: a failure in paper A will never abort processing of paper B.
   */
  public async ingestBatch(
    papers: (NormalizedOpenAlexPaper | string)[],
    options: { concurrency?: number; persistToDatabase?: boolean } = {}
  ): Promise<BatchIngestionResult> {
    const startedAt = new Date().toISOString();
    const startTimeMs = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const concurrency = Math.max(1, Math.min(5, options.concurrency || 3));

    // Limit batch size to 12 maximum as per architectural resource constraints
    const boundedList = papers.slice(0, 12);
    const results: IngestionPaperResult[] = [];

    // Parallel bounded worker pool
    let cursor = 0;
    const worker = async () => {
      while (cursor < boundedList.length) {
        const index = cursor++;
        const target = boundedList[index];
        try {
          const itemRes = await this.ingestSinglePaper(target, {
            persistToDatabase: options.persistToDatabase
          });
          results.push(itemRes);
        } catch (err: any) {
          // Failure isolation: record failed item without halting batch
          results.push({
            doi: typeof target === 'string' && target.startsWith('10.') ? target : null,
            openAlexId: typeof target === 'string' ? target : (target as any).openAlexId || 'unknown',
            title: typeof target === 'string' ? `Target: ${target}` : (target as any).title || 'Unknown',
            authors: [],
            publicationDate: null,
            journal: null,
            retrievalStatus: 'RETRIEVAL_FAILED',
            evidenceCompleteness: 'METADATA_ONLY',
            sourceUrl: null,
            sourceDocumentChecksum: null,
            extractedTextChecksum: null,
            textNormalizationVersion: TEXT_NORMALIZATION_VERSION,
            offsetUnit: OFFSET_UNIT,
            sectionsDetected: [],
            chunks: [],
            totalCharacterCount: 0,
            errorMessage: err.message || String(err),
            isPersisted: false
          });
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    const completedAt = new Date().toISOString();
    const executionDurationMs = Date.now() - startTimeMs;

    const succeededCount = results.filter(r => r.retrievalStatus === 'FULL_TEXT_RETRIEVED').length;
    const abstractOnlyCount = results.filter(r => r.retrievalStatus === 'ABSTRACT_ONLY').length;
    const failedCount = results.filter(r => r.retrievalStatus !== 'FULL_TEXT_RETRIEVED' && r.retrievalStatus !== 'ABSTRACT_ONLY').length;

    return {
      batchId,
      requestedCount: boundedList.length,
      succeededCount,
      abstractOnlyCount,
      failedCount,
      items: results,
      startedAt,
      completedAt,
      executionDurationMs
    };
  }
}

export const multiPaperIngestionService = new MultiPaperIngestionService();
