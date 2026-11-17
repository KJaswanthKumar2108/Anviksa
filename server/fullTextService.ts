/**
 * Open-Access Research Full-Text Retrieval & Extraction Service
 * 
 * Performs legal, source-aware discovery, validation, and structured text extraction
 * from open-access scientific publications (PDF / HTML repositories).
 * Prepares structured sections and citation chunks for Gemma 4 synthesis.
 */

import crypto from 'crypto';
import { validateSafeHttpUrl } from './ssrfValidator.js';
import { openAlexService } from './openAlexService.js';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase.js';
import type {
  NormalizedOpenAlexPaper,
  FullTextRetrievalResult,
  ExtractedDocument,
  ExtractedSection,
  GemmaChunk,
  CandidateLocation
} from '../src/types/openalex.js';

// Dynamically load PDFParse to avoid top-level ESM/CJS binding quirks
async function getPdfParserClass(): Promise<any> {
  const mod = await import('pdf-parse');
  return mod.PDFParse || (mod as any).default?.PDFParse || (mod as any).default || mod;
}

const MAX_PDF_BYTES = 35 * 1024 * 1024; // 35 MB safety limit
const HTTP_TIMEOUT_MS = 15000; // 15 seconds request timeout

export class FullTextService {
  /**
   * Discovers and prioritizes open-access full text locations for a research paper.
   */
  public prioritizeOaLocations(paper: NormalizedOpenAlexPaper): {
    pdfUrl: string | null;
    landingUrl: string | null;
    sourceType: 'pdf' | 'html' | 'repository' | 'publisher' | null;
    license: string | null;
    isOa: boolean;
  } {
    if (!paper.openAccess?.isOa) {
      return {
        pdfUrl: null,
        landingUrl: paper.landingPageUrl || null,
        sourceType: null,
        license: paper.license || null,
        isOa: false
      };
    }

    // 1. Direct PDF check from best_oa_location or locations
    if (paper.pdfUrl) {
      return {
        pdfUrl: paper.pdfUrl,
        landingUrl: paper.landingPageUrl || null,
        sourceType: 'pdf',
        license: paper.license || null,
        isOa: true
      };
    }

    // 2. Iterate candidate locations for direct PDF links
    const locations = paper.locations || [];
    for (const loc of locations) {
      if (loc.isOa && loc.pdfUrl) {
        return {
          pdfUrl: loc.pdfUrl,
          landingUrl: loc.landingPageUrl || paper.landingPageUrl,
          sourceType: 'pdf',
          license: loc.license || paper.license || null,
          isOa: true
        };
      }
    }

    // 3. Look for legitimate repository landing pages (e.g. arXiv, PubMed Central, Zenodo)
    for (const loc of locations) {
      if (loc.isOa && loc.landingPageUrl) {
        // If landing page is on arXiv, we can resolve the direct open-access PDF
        if (loc.landingPageUrl.includes('arxiv.org/abs/')) {
          const arxivId = loc.landingPageUrl.split('arxiv.org/abs/')[1].split(/[#?]/)[0];
          return {
            pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
            landingUrl: loc.landingPageUrl,
            sourceType: 'repository',
            license: loc.license || paper.license || null,
            isOa: true
          };
        }

        return {
          pdfUrl: null,
          landingUrl: loc.landingPageUrl,
          sourceType: 'html',
          license: loc.license || paper.license || null,
          isOa: true
        };
      }
    }

    return {
      pdfUrl: null,
      landingUrl: paper.landingPageUrl || null,
      sourceType: null,
      license: paper.license || null,
      isOa: paper.openAccess.isOa
    };
  }

  /**
   * Safely downloads and validates a remote document buffer.
   * Performs SSRF prevention, Content-Type checking, magic byte inspection,
   * size limit enforcement, and SHA-256 checksum generation.
   */
  public async fetchAndValidateDocument(
    rawUrl: string,
    options: { maxBytes?: number; timeoutMs?: number } = {}
  ): Promise<{
    buffer: Buffer;
    checksum: string;
    contentType: string;
    isPdf: boolean;
    isHtml: boolean;
  }> {
    const maxBytes = options.maxBytes || MAX_PDF_BYTES;
    const timeoutMs = options.timeoutMs || HTTP_TIMEOUT_MS;

    // 1. SSRF and Protocol Validation
    const validation = await validateSafeHttpUrl(rawUrl);
    if (!validation.valid || !validation.sanitizedUrl) {
      const err: any = new Error(`SSRF / Network validation rejected target URL: ${validation.reason}`);
      err.status = 400;
      err.code = 'SSRF_VALIDATION_FAILED';
      throw err;
    }

    // 2. Fetch with Timeout and Size Guard
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validation.sanitizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Anviksa-OpenScience-Harvester/1.0 (mailto:openresearch@anviksa.org; OpenAlex Verified)',
          'Accept': 'application/pdf, text/html;q=0.9, */*;q=0.8'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const err: any = new Error(`Upstream source returned HTTP ${response.status} (${response.statusText}).`);
        err.status = response.status;
        err.code = 'UPSTREAM_HTTP_ERROR';
        throw err;
      }

      // Check Content-Length header if present
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const declaredSize = parseInt(contentLengthHeader, 10);
        if (!isNaN(declaredSize) && declaredSize > maxBytes) {
          const err: any = new Error(`Document declared size (${(declaredSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed limit (${(maxBytes / 1024 / 1024).toFixed(1)}MB).`);
          err.status = 413;
          err.code = 'DOCUMENT_TOO_LARGE';
          throw err;
        }
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      if (buffer.length > maxBytes) {
        const err: any = new Error(`Downloaded document payload (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed limit.`);
        err.status = 413;
        err.code = 'DOCUMENT_TOO_LARGE';
        throw err;
      }

      if (buffer.length === 0) {
        const err: any = new Error('Remote source returned an empty (0 byte) document.');
        err.status = 422;
        err.code = 'EMPTY_DOCUMENT';
        throw err;
      }

      // 3. Inspect Magic Bytes
      const magicPrefix = buffer.subarray(0, 10).toString('utf-8');
      const isPdf = magicPrefix.startsWith('%PDF-');
      const isHtml = /<!DOCTYPE|<html/i.test(buffer.subarray(0, 100).toString('utf-8')) || contentType.includes('text/html');

      // If declared as PDF or expected PDF but returned HTML, reject paywall/error disguise
      if (!isPdf && isHtml) {
        const err: any = new Error('Upstream server returned an HTML webpage or authentication gate rather than a valid PDF document.');
        err.status = 422;
        err.code = 'HTML_DISGUISED_AS_PDF';
        throw err;
      }

      // Compute SHA-256 Checksum
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        buffer,
        checksum,
        contentType,
        isPdf,
        isHtml
      };
    } catch (networkErr: any) {
      if (networkErr.status) throw networkErr;
      if (networkErr.name === 'AbortError') {
        const timeoutErr: any = new Error(`Document retrieval timed out after ${timeoutMs}ms.`);
        timeoutErr.status = 504;
        timeoutErr.code = 'RETRIEVAL_TIMEOUT';
        throw timeoutErr;
      }
      const wrapped: any = new Error(`Network failure during document retrieval: ${networkErr.message || networkErr}`);
      wrapped.status = 502;
      wrapped.code = 'NETWORK_FAILURE';
      throw wrapped;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Segments raw academic paper text into structured standard IMRAD sections
   * and builds citation-indexed chunks for Gemma 4.
   */
  public segmentSectionsAndChunks(
    pages: { num: number; text: string }[],
    metadata: { title: string; doi?: string | null; license?: string | null; sourceUrl: string; checksum: string }
  ): {
    sections: Record<string, ExtractedSection>;
    gemmaChunks: GemmaChunk[];
    characterCount: number;
  } {
    // Sanitize null bytes and non-printable control characters that break JSON/PostgreSQL UTF-8
    const cleanPages = pages.map(p => ({
      num: p.num,
      text: (p.text || '').replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    }));
    const fullText = cleanPages.map(p => `--- [Page ${p.num}] ---\n${p.text}`).join('\n\n');
    const characterCount = fullText.length;

    // Standard IMRAD Section Header Patterns
    const sectionPatterns: { key: string; regex: RegExp }[] = [
      { key: 'Abstract', regex: /(?:^|\n)(?:ABSTRACT|Abstract)(?:\r?\n|:|\s{2,})/ },
      { key: 'Introduction', regex: /(?:^|\n)(?:1\.?\s+)?(?:INTRODUCTION|Introduction)(?:\r?\n|:|\s{2,})/ },
      { key: 'Related Work', regex: /(?:^|\n)(?:2\.?\s+)?(?:RELATED WORK|Related Work|BACKGROUND|Background)(?:\r?\n|:|\s{2,})/ },
      { key: 'Methodology', regex: /(?:^|\n)(?:[3-4]\.?\s+)?(?:METHODOLOGY|Methodology|METHODS|Methods|APPROACH|Approach|SYSTEM ARCHITECTURE|Architecture)(?:\r?\n|:|\s{2,})/ },
      { key: 'Results', regex: /(?:^|\n)(?:[4-5]\.?\s+)?(?:RESULTS|Results|EXPERIMENTS|Experiments|EVALUATION|Evaluation)(?:\r?\n|:|\s{2,})/ },
      { key: 'Discussion', regex: /(?:^|\n)(?:[5-6]\.?\s+)?(?:DISCUSSION|Discussion|ANALYSIS|Analysis)(?:\r?\n|:|\s{2,})/ },
      { key: 'Limitations', regex: /(?:^|\n)(?:[6-7]\.?\s+)?(?:LIMITATIONS|Limitations|RISKS AND LIMITATIONS|Known Limitations)(?:\r?\n|:|\s{2,})/ },
      { key: 'Conclusion', regex: /(?:^|\n)(?:[7-8]\.?\s+)?(?:CONCLUSION|Conclusion|CONCLUSIONS|Conclusions|FUTURE WORK|Future Work)(?:\r?\n|:|\s{2,})/ },
      { key: 'References', regex: /(?:^|\n)(?:[8-9]\.?\s+)?(?:REFERENCES|References|BIBLIOGRAPHY|Bibliography)(?:\r?\n|:|\s{2,})/ }
    ];

    const detectedMatches: { key: string; index: number; length: number }[] = [];
    for (const pat of sectionPatterns) {
      const match = pat.regex.exec(fullText);
      if (match) {
        detectedMatches.push({
          key: pat.key,
          index: match.index,
          length: match[0].length
        });
      }
    }

    // Sort detected sections by their sequential position in the text
    detectedMatches.sort((a, b) => a.index - b.index);

    const sections: Record<string, ExtractedSection> = {};

    if (detectedMatches.length > 0) {
      for (let i = 0; i < detectedMatches.length; i++) {
        const curr = detectedMatches[i];
        const next = detectedMatches[i + 1];
        const start = curr.index + curr.length;
        const end = next ? next.index : fullText.length;
        const content = fullText.slice(start, end).trim();

        // Approximate page boundaries
        const pageMarkers = fullText.slice(curr.index, end).match(/--- \[Page (\d+)\] ---/g) || [];
        const pageNums = pageMarkers.map(m => parseInt(m.replace(/\D/g, ''), 10)).filter(Boolean);
        const pageStart = pageNums.length > 0 ? Math.min(...pageNums) : 1;
        const pageEnd = pageNums.length > 0 ? Math.max(...pageNums) : pageStart;

        sections[curr.key] = {
          name: curr.key,
          content: content.slice(0, 100000), // Safety cap per section
          pageStart,
          pageEnd,
          characterCount: content.length
        };
      }
    } else {
      // Fallback: If section headings aren't explicitly matched, divide into Overview and Body
      sections['Full Document Text'] = {
        name: 'Full Document Text',
        content: fullText.slice(0, 120000),
        pageStart: 1,
        pageEnd: pages.length,
        characterCount: fullText.length
      };
    }

    // 4. Build Gemma 4 safe citation chunks (~3,500 chars with 200 char overlap)
    const gemmaChunks: GemmaChunk[] = [];
    let chunkIndex = 0;
    const CHUNK_SIZE = 3500;
    const OVERLAP = 250;

    for (const [secName, sec] of Object.entries(sections)) {
      if (sec.content.length <= CHUNK_SIZE) {
        gemmaChunks.push({
          chunkIndex: chunkIndex++,
          section: secName,
          pageStart: sec.pageStart || 1,
          pageEnd: sec.pageEnd || 1,
          citationRef: `[${metadata.title}, Pages ${sec.pageStart}-${sec.pageEnd}, Section: ${secName}]`,
          text: sec.content,
          tokenEstimate: Math.round(sec.content.length / 4)
        });
      } else {
        let cursor = 0;
        while (cursor < sec.content.length) {
          const sliceEnd = Math.min(cursor + CHUNK_SIZE, sec.content.length);
          const chunkText = sec.content.slice(cursor, sliceEnd);
          gemmaChunks.push({
            chunkIndex: chunkIndex++,
            section: secName,
            pageStart: sec.pageStart || 1,
            pageEnd: sec.pageEnd || 1,
            citationRef: `[${metadata.title}, Pages ${sec.pageStart}-${sec.pageEnd}, Section: ${secName} (Part)]`,
            text: chunkText,
            tokenEstimate: Math.round(chunkText.length / 4)
          });
          cursor += CHUNK_SIZE - OVERLAP;
        }
      }
    }

    return {
      sections,
      gemmaChunks,
      characterCount
    };
  }

  /**
   * Main entrypoint: Retrieves, validates, and extracts full text for any given paper.
   */
  public async retrieveAndExtractForPaper(identifier: string): Promise<FullTextRetrievalResult> {
    const timestamp = new Date().toISOString();

    // 1. Resolve work metadata from OpenAlex
    const paper = await openAlexService.getWorkByDoiOrId(identifier);
    const oaInfo = this.prioritizeOaLocations(paper);

    // 2. Check if no accessible open-access full text exists
    if (!oaInfo.isOa || (!oaInfo.pdfUrl && !oaInfo.landingUrl)) {
      return {
        doi: paper.doi,
        openAlexId: paper.openAlexId,
        status: 'metadata_only',
        extractionStatus: 'skipped',
        hasAccessiblePdf: false,
        hasAccessibleHtml: false,
        sourceUrl: paper.landingPageUrl || null,
        sourceType: null,
        license: paper.license || null,
        documentChecksum: null,
        document: null,
        error: 'No open-access full-text link is available for this publication (publisher paywall or restricted access). Retaining metadata and abstract only.',
        retrievedAt: timestamp
      };
    }

    // 3. Process accessible PDF
    if (oaInfo.pdfUrl) {
      try {
        const download = await this.fetchAndValidateDocument(oaInfo.pdfUrl);

        if (!download.isPdf) {
          throw new Error('Received non-PDF content type from open-access URL.');
        }

        // Parse PDF using PDFParse
        const PDFParserClass = await getPdfParserClass();
        const parser = new PDFParserClass({ data: download.buffer });
        const parseResult = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }

        const pages = Array.isArray(parseResult.pages) ? parseResult.pages : [{ num: 1, text: parseResult.text || '' }];
        if (pages.length === 0 || !pages.some((p: any) => p.text && p.text.trim().length > 0)) {
          throw new Error('PDF document contains no selectable text (scanned bitmap or OCR required).');
        }

        const { sections, gemmaChunks, characterCount } = this.segmentSectionsAndChunks(pages, {
          title: paper.title,
          doi: paper.doi,
          license: oaInfo.license,
          sourceUrl: oaInfo.pdfUrl,
          checksum: download.checksum
        });

        const document: ExtractedDocument = {
          title: paper.title,
          authors: paper.authors,
          doi: paper.doi,
          pageCount: parseResult.total || pages.length,
          characterCount,
          checksumSha256: download.checksum,
          sourceUrl: oaInfo.pdfUrl,
          sourceType: 'pdf',
          license: oaInfo.license,
          sections,
          gemmaChunks,
          extractedAt: timestamp
        };

        // Persist structured extraction metadata to Supabase without storing massive copyrighted blobs
        const sectionSummary = Object.fromEntries(
          Object.entries(sections).map(([k, v]) => [
            k,
            { name: v.name, pageStart: v.pageStart, pageEnd: v.pageEnd, characterCount: v.characterCount }
          ])
        );

        await this.syncToSupabase(paper.doi, paper.title, identifier, {
          fulltext_status: 'extracted',
          fulltext_source_url: oaInfo.pdfUrl,
          fulltext_source_type: 'pdf',
          access_status: paper.openAccess.oaStatus || 'gold',
          license: oaInfo.license,
          extraction_status: 'success',
          extracted_at: timestamp,
          document_checksum: download.checksum,
          extraction_error: null,
          extracted_sections: sectionSummary
        });

        return {
          doi: paper.doi,
          openAlexId: paper.openAlexId,
          status: 'extracted',
          extractionStatus: 'success',
          hasAccessiblePdf: true,
          hasAccessibleHtml: false,
          sourceUrl: oaInfo.pdfUrl,
          sourceType: 'pdf',
          license: oaInfo.license,
          documentChecksum: download.checksum,
          document,
          error: null,
          retrievedAt: timestamp
        };
      } catch (pdfErr: any) {
        const errorMsg = pdfErr.message || 'Failed to extract text from PDF document.';
        
        await this.syncToSupabase(paper.doi, paper.title, identifier, {
          fulltext_status: 'failed',
          fulltext_source_url: oaInfo.pdfUrl,
          fulltext_source_type: 'pdf',
          access_status: paper.openAccess.oaStatus || 'unknown',
          license: oaInfo.license,
          extraction_status: 'failed',
          extracted_at: timestamp,
          extraction_error: errorMsg
        });

        return {
          doi: paper.doi,
          openAlexId: paper.openAlexId,
          status: 'failed',
          extractionStatus: 'failed',
          hasAccessiblePdf: true,
          hasAccessibleHtml: false,
          sourceUrl: oaInfo.pdfUrl,
          sourceType: 'pdf',
          license: oaInfo.license,
          documentChecksum: null,
          document: null,
          error: errorMsg,
          retrievedAt: timestamp
        };
      }
    }

    // 4. Open-Access HTML / Repository Landing Only
    return {
      doi: paper.doi,
      openAlexId: paper.openAlexId,
      status: 'html_available',
      extractionStatus: 'skipped',
      hasAccessiblePdf: false,
      hasAccessibleHtml: true,
      sourceUrl: oaInfo.landingUrl,
      sourceType: 'html',
      license: oaInfo.license,
      documentChecksum: null,
      document: null,
      error: 'Open-access landing page / repository is available, but no direct public PDF was provided. Abstract and landing page URL retained.',
      retrievedAt: timestamp
    };
  }

  /**
   * Helper to update Supabase records matching DOI or title.
   */
  private async syncToSupabase(
    doi: string | null | undefined,
    title: string | undefined,
    inputIdentifier: string | undefined,
    updateFields: Record<string, any>
  ) {
    try {
      const cleanDoi = (doi || '').replace(/^https?:\/\/doi\.org\//i, '').trim();
      
      // Sanitize JSON payload to eliminate any embedded null bytes from PDF streams
      const sanitizedFields = JSON.parse(
        JSON.stringify(updateFields).replace(/\\u0000/g, '')
      );

      const conditions: string[] = [];
      if (inputIdentifier && inputIdentifier.includes('.')) {
        const cleanInput = inputIdentifier.replace(/^https?:\/\/doi\.org\//i, '').trim();
        conditions.push(`doi.ilike.%${cleanInput}%`);
      }
      if (cleanDoi) {
        conditions.push(`doi.ilike.%${cleanDoi}%`);
      }
      if (title) {
        const cleanTitle = title.replace(/[^\w\s]/g, '').trim().slice(0, 30);
        if (cleanTitle.length > 5) {
          conditions.push(`title.ilike.%${cleanTitle}%`);
        }
      }

      if (conditions.length === 0) return;

      const { data, error } = await supabase
        .from('research_papers')
        .update(sanitizedFields)
        .or(conditions.join(','))
        .select();

      if (error) {
        console.warn('[FullTextService] Supabase sync error:', error);
      } else {
        console.log(`[FullTextService] Synced full-text status to Supabase for ${cleanDoi || title} (rows: ${data?.length || 0})`);
      }
    } catch (e) {
      console.warn('[FullTextService] Supabase sync warning:', e);
    }
  }
}

export const fullTextService = new FullTextService();
