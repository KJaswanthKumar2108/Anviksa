-- ====================================================================
-- Anvīkṣā — Stage 4C Additive Migration: Evidence Taxonomy Enhancement
-- Version: 4.1.0-REVISED
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING RECORDS & RLS
-- ====================================================================

ALTER TABLE public.research_gap_evidence 
    DROP CONSTRAINT IF EXISTS research_gap_evidence_evidence_classification_check;

ALTER TABLE public.research_gap_evidence 
    ADD CONSTRAINT research_gap_evidence_evidence_classification_check 
    CHECK (evidence_classification = ANY (ARRAY[
        'AUTHOR_CONCESSION'::text, 
        'EMPIRICAL_TABLE'::text, 
        'METHODOLOGICAL_DETAIL'::text, 
        'AI_DEDUCTION'::text,
        'EXPLICIT_AUTHOR_STATEMENT'::text,
        'METHODOLOGICAL_OBSERVATION'::text,
        'EMPIRICAL_OBSERVATION'::text,
        'INFERRED_EVIDENCE_CONTEXT'::text
    ]));
