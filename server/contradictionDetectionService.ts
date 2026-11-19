/**
 * Anvīkṣā — Stage 4D: Contradiction Detection & Bilateral Grounding Service
 * 
 * Architecture Specification: Version 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
 * Implements deterministic bilateral quote verification, divergence classification,
 * and disentangles inter-paper empirical disputes from gap-premise falsification.
 */

import {
  extractByCodepointOffsets,
  findCodepointOffsets,
  findWhitespaceNormalizedOffsets,
  TEXT_NORMALIZATION_VERSION,
  OFFSET_UNIT
} from './textProvenanceUtils.js';

export type RelationshipType = 
  | 'identifies_limitation'
  | 'addresses'
  | 'partially_addresses'
  | 'corroborates'
  | 'contradicts'
  | 'supersedes'
  | 'tests'
  | 'incommensurable_context';

export type DivergenceClassification = 
  | 'DIRECT_EMPIRICAL_CONTRADICTION' // Inter-paper empirical disagreement under commensurable conditions
  | 'GAP_PREMISE_FALSIFICATION'      // Candidate gap itself was based on flawed baseline or data leakage
  | 'SCOPE_RESTRICTION'              // Different conditions / operational boundary
  | 'METHODOLOGICAL_INCOMMENSURABILITY' // Different metrics / setups
  | 'CORROBORATIVE_CONFIRMATION'     // Both observe same limitation
  | 'INDEPENDENT_RESOLUTION';        // Validation paper resolves the limitation

export interface VerifiedQuoteReference {
  paperId: string;
  chunkId: number | string;
  sectionName: string;
  exactQuote: string;
  startOffset: number;
  endOffset: number;
  verificationStatus: 'VERIFIED_EXACT_MATCH' | 'VERIFIED_NORMALIZED_MATCH' | 'FAILED_VERIFICATION';
}

export interface BilateralContradictionResult {
  hasContradiction: boolean;
  divergenceType: DivergenceClassification;
  relationshipType: RelationshipType;
  confidenceWeight: number; // 0.0 to 1.0
  seedEvidence: VerifiedQuoteReference;
  validationEvidence: VerifiedQuoteReference;
  isBilateralVerified: boolean;
  isInterPaperDisputeOnly: boolean;
  invalidatesGapPremise: boolean;
  requiresHumanReview: boolean;
  rationale: string;
}

export class ContradictionDetectionService {
  /**
   * Deterministically verifies a quotation against the normalized text of a source chunk.
   */
  public verifyQuoteAgainstChunk(
    chunkText: string,
    quote: string,
    paperId: string,
    chunkId: number | string,
    sectionName: string,
    providedStart?: number,
    providedEnd?: number
  ): VerifiedQuoteReference {
    if (!chunkText || !quote) {
      return {
        paperId,
        chunkId,
        sectionName,
        exactQuote: quote || '',
        startOffset: 0,
        endOffset: 0,
        verificationStatus: 'FAILED_VERIFICATION'
      };
    }

    // 1. Try provided offsets if specified
    if (providedStart !== undefined && providedEnd !== undefined && providedEnd > providedStart) {
      const extracted = extractByCodepointOffsets(chunkText, providedStart, providedEnd);
      if (extracted === quote) {
        return {
          paperId,
          chunkId,
          sectionName,
          exactQuote: quote,
          startOffset: providedStart,
          endOffset: providedEnd,
          verificationStatus: 'VERIFIED_EXACT_MATCH'
        };
      }
    }

    // 2. Try exact codepoint substring search
    const exactMatch = findCodepointOffsets(chunkText, quote);
    if (exactMatch) {
      return {
        paperId,
        chunkId,
        sectionName,
        exactQuote: quote,
        startOffset: exactMatch.start,
        endOffset: exactMatch.end,
        verificationStatus: 'VERIFIED_EXACT_MATCH'
      };
    }

    // 3. Try whitespace-normalized matching
    const normMatch = findWhitespaceNormalizedOffsets(chunkText, quote);
    if (normMatch) {
      return {
        paperId,
        chunkId,
        sectionName,
        exactQuote: quote,
        startOffset: normMatch.rawStart,
        endOffset: normMatch.rawEnd,
        verificationStatus: 'VERIFIED_NORMALIZED_MATCH'
      };
    }

    // Quotation could not be found deterministically in the source chunk
    return {
      paperId,
      chunkId,
      sectionName,
      exactQuote: quote,
      startOffset: 0,
      endOffset: 0,
      verificationStatus: 'FAILED_VERIFICATION'
    };
  }

  /**
   * Evaluates bilateral evidence between a seed paper and validation paper to detect
   * empirical contradictions, resolutions, or scope differences.
   */
  public analyzeBilateralRelationship(
    seedChunkText: string,
    seedQuote: string,
    seedPaperId: string,
    seedChunkId: number | string,
    seedSection: string,
    valChunkText: string,
    valQuote: string,
    valPaperId: string,
    valChunkId: number | string,
    valSection: string,
    isDirectlyComparable: boolean,
    reportedConflictType: 'EMPIRICAL_DISAGREEMENT' | 'PREMISE_FALSIFIED' | 'SCOPE_DIFFERENCE' | 'RESOLUTION' | 'CORROBORATION',
    explanation: string
  ): BilateralContradictionResult {
    // 1. Deterministically verify both source quotes
    const seedVerified = this.verifyQuoteAgainstChunk(
      seedChunkText,
      seedQuote,
      seedPaperId,
      seedChunkId,
      seedSection
    );

    const valVerified = this.verifyQuoteAgainstChunk(
      valChunkText,
      valQuote,
      valPaperId,
      valChunkId,
      valSection
    );

    const isBilateralVerified = 
      seedVerified.verificationStatus !== 'FAILED_VERIFICATION' &&
      valVerified.verificationStatus !== 'FAILED_VERIFICATION';

    // If verification fails, bilateral evidence cannot support a contradiction
    if (!isBilateralVerified) {
      return {
        hasContradiction: false,
        divergenceType: 'METHODOLOGICAL_INCOMMENSURABILITY',
        relationshipType: 'tests',
        confidenceWeight: 0.1,
        seedEvidence: seedVerified,
        validationEvidence: valVerified,
        isBilateralVerified: false,
        isInterPaperDisputeOnly: false,
        invalidatesGapPremise: false,
        requiresHumanReview: false,
        rationale: 'Bilateral quote verification failed: one or both quotes could not be deterministically grounded in source chunk text.'
      };
    }

    // 2. Disentangle Disagreement Type
    let divergenceType: DivergenceClassification;
    let relationshipType: RelationshipType;
    let hasContradiction = false;
    let isInterPaperDisputeOnly = false;
    let invalidatesGapPremise = false;
    let requiresHumanReview = false;
    let confidenceWeight = isDirectlyComparable ? 0.9 : 0.5;

    switch (reportedConflictType) {
      case 'PREMISE_FALSIFIED':
        divergenceType = 'GAP_PREMISE_FALSIFICATION';
        relationshipType = 'contradicts';
        hasContradiction = true;
        invalidatesGapPremise = true;
        isInterPaperDisputeOnly = false;
        requiresHumanReview = true;
        break;

      case 'EMPIRICAL_DISAGREEMENT':
        if (isDirectlyComparable) {
          divergenceType = 'DIRECT_EMPIRICAL_CONTRADICTION';
          relationshipType = 'contradicts';
          hasContradiction = true;
          isInterPaperDisputeOnly = true;
          invalidatesGapPremise = false;
          requiresHumanReview = true;
        } else {
          divergenceType = 'SCOPE_RESTRICTION';
          relationshipType = 'incommensurable_context';
          hasContradiction = false;
          confidenceWeight = 0.3;
        }
        break;

      case 'RESOLUTION':
        divergenceType = 'INDEPENDENT_RESOLUTION';
        relationshipType = isDirectlyComparable ? 'addresses' : 'partially_addresses';
        hasContradiction = false;
        break;

      case 'SCOPE_DIFFERENCE':
        divergenceType = 'SCOPE_RESTRICTION';
        relationshipType = 'partially_addresses';
        hasContradiction = false;
        break;

      case 'CORROBORATION':
      default:
        divergenceType = 'CORROBORATIVE_CONFIRMATION';
        relationshipType = 'corroborates';
        hasContradiction = false;
        break;
    }

    return {
      hasContradiction,
      divergenceType,
      relationshipType,
      confidenceWeight,
      seedEvidence: seedVerified,
      validationEvidence: valVerified,
      isBilateralVerified: true,
      isInterPaperDisputeOnly,
      invalidatesGapPremise,
      requiresHumanReview,
      rationale: explanation
    };
  }
}

export const contradictionDetectionService = new ContradictionDetectionService();
