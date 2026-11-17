import crypto from 'crypto';

/**
 * Text Normalization Version Contract
 * Stage 4.1.0-REVISED standardized specification.
 */
export const TEXT_NORMALIZATION_VERSION = 'v1.0-nfc-normalized';
export const OFFSET_UNIT = 'codepoints';

/**
 * Normalizes text to canonical Unicode NFC form and strips disruptive control characters.
 * Null bytes (\0) and non-printable control characters that crash PostgreSQL / JSON are sanitized.
 */
export function normalizeScholarlyText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .normalize('NFC')
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Computes SHA-256 hash of a binary buffer or string.
 */
export function computeSha256(data: Buffer | string): string {
  const hash = crypto.createHash('sha256');
  if (typeof data === 'string') {
    hash.update(data, 'utf8');
  } else {
    hash.update(data);
  }
  return `sha256:${hash.digest('hex')}`;
}

export interface CodepointOffsetResult {
  start: number;
  end: number;
  offsetUnit: 'codepoints';
  normalizationVersion: string;
}

/**
 * Finds exact 0-based Unicode code-point offsets for a needle inside a normalized haystack.
 * Note: Uses [...string] spreading to strictly adhere to Unicode code points,
 * preventing Javascript UTF-16 surrogate-pair offset drift (e.g. emojis or astral plane symbols).
 * End offset is exclusive (start <= offset < end).
 */
export function findCodepointOffsets(
  normalizedHaystack: string,
  targetQuote: string
): CodepointOffsetResult | null {
  const hCps = [...normalizedHaystack.normalize('NFC')];
  const nCps = [...targetQuote.normalize('NFC')];

  if (nCps.length === 0) {
    return {
      start: 0,
      end: 0,
      offsetUnit: OFFSET_UNIT,
      normalizationVersion: TEXT_NORMALIZATION_VERSION
    };
  }

  if (nCps.length > hCps.length) {
    return null;
  }

  for (let i = 0; i <= hCps.length - nCps.length; i++) {
    let match = true;
    for (let j = 0; j < nCps.length; j++) {
      if (hCps[i + j] !== nCps[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return {
        start: i,
        end: i + nCps.length,
        offsetUnit: OFFSET_UNIT,
        normalizationVersion: TEXT_NORMALIZATION_VERSION
      };
    }
  }

  return null;
}

/**
 * Extracts a substring from a normalized text given 0-based Unicode code-point offsets.
 */
export function extractByCodepointOffsets(
  normalizedHaystack: string,
  start: number,
  end: number
): string {
  const hCps = [...normalizedHaystack.normalize('NFC')];
  return hCps.slice(start, end).join('');
}

/**
 * Validates whether an exact quote corresponds with the normalized text at given offsets.
 */
export function verifyQuoteAtCodepointOffsets(
  normalizedHaystack: string,
  quote: string,
  start: number,
  end: number
): boolean {
  const extracted = extractByCodepointOffsets(normalizedHaystack, start, end);
  return extracted === quote.normalize('NFC');
}

export interface WhitespaceNormalizedMap {
  collapsedText: string;
  collapsedToSourceMap: number[]; // Index in collapsedText -> Index in raw canonical code-points
  sourceToCollapsedMap: number[];
}

/**
 * Builds a deterministic character-level coordinate mapper between
 * uncollapsed canonical NFC text and single-space collapsed text.
 */
export function buildWhitespaceNormalizedMap(rawCanonicalText: string): WhitespaceNormalizedMap {
  const rawCps = [...rawCanonicalText.normalize('NFC')];
  const collapsedCps: string[] = [];
  const collapsedToSourceMap: number[] = [];
  const sourceToCollapsedMap: number[] = new Array(rawCps.length);

  let inWhitespace = false;

  for (let i = 0; i < rawCps.length; i++) {
    const cp = rawCps[i];
    const isWs = /\s/.test(cp);

    if (isWs) {
      if (!inWhitespace) {
        // First whitespace character in run maps to single space
        collapsedToSourceMap.push(i);
        collapsedCps.push(' ');
        inWhitespace = true;
      }
      sourceToCollapsedMap[i] = collapsedCps.length - 1;
    } else {
      inWhitespace = false;
      collapsedToSourceMap.push(i);
      collapsedCps.push(cp);
      sourceToCollapsedMap[i] = collapsedCps.length - 1;
    }
  }

  return {
    collapsedText: collapsedCps.join(''),
    collapsedToSourceMap,
    sourceToCollapsedMap
  };
}

export interface WhitespaceNormalizedOffsetResult {
  rawStart: number; // Exact 0-based code-point offset in uncollapsed canonical text
  rawEnd: number;   // Exact exclusive 0-based code-point offset in uncollapsed canonical text
  exactOriginalSlice: string; // The exact text sliced from canonical source at [rawStart, rawEnd)
  normalizedMatchQuote: string; // The collapsed quote that matched
  offsetUnit: 'codepoints';
  normalizationVersion: string;
}

/**
 * Deterministically locates a quotation under whitespace normalization and maps its
 * boundaries back to exact 0-based Unicode code-point offsets in the uncollapsed source text.
 */
export function findWhitespaceNormalizedOffsets(
  rawCanonicalText: string,
  targetQuote: string
): WhitespaceNormalizedOffsetResult | null {
  if (!rawCanonicalText || !targetQuote) return null;

  const cleanQuote = normalizeScholarlyText(targetQuote);
  const collapsedNeedle = cleanQuote.replace(/\s+/g, ' ').trim();
  if (collapsedNeedle.length === 0) return null;

  const map = buildWhitespaceNormalizedMap(rawCanonicalText);
  const collapsedMatch = findCodepointOffsets(map.collapsedText, collapsedNeedle);

  if (!collapsedMatch) return null;

  const rawStart = map.collapsedToSourceMap[collapsedMatch.start];
  const lastCollapsedIdx = collapsedMatch.end - 1;
  const lastRawCharIdx = map.collapsedToSourceMap[lastCollapsedIdx];
  const rawEnd = lastRawCharIdx + 1;

  // Extract the true uncollapsed slice from canonical source text
  const exactOriginalSlice = extractByCodepointOffsets(rawCanonicalText, rawStart, rawEnd);

  // Verification invariant: uncollapsed slice collapsed MUST strictly equal the needle
  if (exactOriginalSlice.replace(/\s+/g, ' ').trim() !== collapsedNeedle) {
    return null;
  }

  return {
    rawStart,
    rawEnd,
    exactOriginalSlice,
    normalizedMatchQuote: collapsedNeedle,
    offsetUnit: OFFSET_UNIT,
    normalizationVersion: TEXT_NORMALIZATION_VERSION
  };
}
