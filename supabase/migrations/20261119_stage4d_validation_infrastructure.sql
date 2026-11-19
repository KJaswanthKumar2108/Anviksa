-- ====================================================================
-- Anvīkṣā — Stage 4D Additive Migration: Validation Infrastructure & Dedicated Relationships
-- Version: 4.1.0-REVISED (Stage 4D Final Consistency Amendment)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Add archival and validation tracking to public.research_gaps
ALTER TABLE public.research_gaps 
    ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Add literature_coverage_metadata and confidence_score to public.research_gap_validations
ALTER TABLE public.research_gap_validations 
    ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
    ADD COLUMN IF NOT EXISTS literature_coverage_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Add composite unique constraint to public.research_gap_validations
-- Required as target for composite foreign key from public.research_gap_relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_gap_validations_gap_run'
    ) THEN
        ALTER TABLE public.research_gap_validations 
            ADD CONSTRAINT uq_gap_validations_gap_run UNIQUE (gap_id, validation_run_id);
    END IF;
END $$;

-- 4. Dedicated Additive Table: public.research_gap_relationships
CREATE TABLE IF NOT EXISTS public.research_gap_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID NOT NULL,
    validation_run_id TEXT NOT NULL,
    
    -- Explicit typed foreign keys for Source Entity (RESTRICT on paper to preserve evidence)
    source_gap_id UUID REFERENCES public.research_gaps(id) ON DELETE RESTRICT,
    source_paper_id UUID REFERENCES public.research_papers(id) ON DELETE RESTRICT,
    
    -- Explicit typed foreign keys for Target Entity (RESTRICT on paper to preserve evidence)
    target_gap_id UUID REFERENCES public.research_gaps(id) ON DELETE RESTRICT,
    target_paper_id UUID REFERENCES public.research_papers(id) ON DELETE RESTRICT,
    
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'identifies_limitation',
        'addresses',
        'partially_addresses',
        'corroborates',
        'contradicts',
        'supersedes',
        'tests',
        'incommensurable_context'
    )),
    
    confidence_weight NUMERIC CHECK (confidence_weight >= 0.0 AND confidence_weight <= 1.0),
    bilateral_evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Composite Foreign Key to research_gap_validations:
    -- Guarantees validation_run_id belongs strictly to the associated gap_id.
    -- Uses ON DELETE RESTRICT to guarantee historical validation runs cannot be deleted while relationships exist!
    CONSTRAINT fk_gap_rel_validation_run 
        FOREIGN KEY (gap_id, validation_run_id) 
        REFERENCES public.research_gap_validations(gap_id, validation_run_id) 
        ON DELETE RESTRICT,

    -- Non-Compensatory Mutually Exclusive Entity Constraints
    CONSTRAINT chk_source_entity CHECK (num_nonnulls(source_gap_id, source_paper_id) = 1),
    CONSTRAINT chk_target_entity CHECK (num_nonnulls(target_gap_id, target_paper_id) = 1),

    -- Explicit Prohibition of Nil UUID Sentinel
    CONSTRAINT chk_source_gap_not_nil CHECK (source_gap_id IS NULL OR source_gap_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_source_paper_not_nil CHECK (source_paper_id IS NULL OR source_paper_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_target_gap_not_nil CHECK (target_gap_id IS NULL OR target_gap_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_target_paper_not_nil CHECK (target_paper_id IS NULL OR target_paper_id <> '00000000-0000-0000-0000-000000000000'::uuid),

    -- Self-Reference Prevention Constraints
    CONSTRAINT chk_no_self_gap_relationship CHECK (
        NOT (source_gap_id IS NOT NULL AND target_gap_id IS NOT NULL AND source_gap_id = target_gap_id)
    ),
    CONSTRAINT chk_no_self_paper_relationship CHECK (
        NOT (source_paper_id IS NOT NULL AND target_paper_id IS NOT NULL AND source_paper_id = target_paper_id)
    )
);

-- 5. Four Discrete Partial Unique Indexes (Guarantees zero NULL ambiguity / sentinel collisions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_gap_rel_gap_gap 
    ON public.research_gap_relationships (gap_id, validation_run_id, source_gap_id, target_gap_id, relationship_type)
    WHERE source_gap_id IS NOT NULL AND target_gap_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_gap_rel_gap_paper 
    ON public.research_gap_relationships (gap_id, validation_run_id, source_gap_id, target_paper_id, relationship_type)
    WHERE source_gap_id IS NOT NULL AND target_paper_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_gap_rel_paper_gap 
    ON public.research_gap_relationships (gap_id, validation_run_id, source_paper_id, target_gap_id, relationship_type)
    WHERE source_paper_id IS NOT NULL AND target_gap_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_gap_rel_paper_paper 
    ON public.research_gap_relationships (gap_id, validation_run_id, source_paper_id, target_paper_id, relationship_type)
    WHERE source_paper_id IS NOT NULL AND target_paper_id IS NOT NULL;

-- 6. Lookup & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gap_rel_gap_id ON public.research_gap_relationships (gap_id);
CREATE INDEX IF NOT EXISTS idx_gap_rel_composite_run ON public.research_gap_relationships (gap_id, validation_run_id);
CREATE INDEX IF NOT EXISTS idx_gap_rel_source_gap ON public.research_gap_relationships (source_gap_id) WHERE source_gap_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gap_rel_source_paper ON public.research_gap_relationships (source_paper_id) WHERE source_paper_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gap_rel_target_gap ON public.research_gap_relationships (target_gap_id) WHERE target_gap_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gap_rel_target_paper ON public.research_gap_relationships (target_paper_id) WHERE target_paper_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gap_validations_composite ON public.research_gap_validations (gap_id, validation_run_id);
CREATE INDEX IF NOT EXISTS idx_research_gaps_last_validated ON public.research_gaps (last_validated_at);
CREATE INDEX IF NOT EXISTS idx_research_gaps_is_archived ON public.research_gaps (is_archived);

-- 7. Row-Level Security for public.research_gap_relationships
ALTER TABLE public.research_gap_relationships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "rls_gap_relationships_select" ON public.research_gap_relationships;
    DROP POLICY IF EXISTS "rls_gap_relationships_write" ON public.research_gap_relationships;
END $$;

-- SELECT Policy: Inherits visibility from parent research gap (excludes archived gaps for non-owners)
CREATE POLICY "rls_gap_relationships_select" ON public.research_gap_relationships
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_relationships.gap_id
        AND g.is_archived = false
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

-- Mutation Policy: Strictly service_role ONLY (Direct client writes strictly rejected)
CREATE POLICY "rls_gap_relationships_write" ON public.research_gap_relationships
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 8. Master Server-Side Trusted RPC: insert_server_verified_validation
CREATE OR REPLACE FUNCTION public.insert_server_verified_validation(
    p_gap_id UUID,
    p_validation_outcome public.validation_outcome,
    p_new_epistemic_classification public.epistemic_classification,
    p_confidence_score NUMERIC,
    p_reasoning_summary TEXT,
    p_model_attribution TEXT,
    p_literature_coverage_timestamp TIMESTAMPTZ,
    p_supporting_evidence_references JSONB DEFAULT '[]'::jsonb,
    p_contradictory_evidence_references JSONB DEFAULT '[]'::jsonb,
    p_previously_addressed_research_references JSONB DEFAULT '[]'::jsonb,
    p_literature_coverage_metadata JSONB DEFAULT '{}'::jsonb,
    p_gap_relationships JSONB DEFAULT '[]'::jsonb,
    p_new_evidence_items JSONB DEFAULT '[]'::jsonb,
    p_search_methodology_version TEXT DEFAULT '4.1.0-multi-vector-discovery'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_validation_id UUID;
    v_prev_classification public.epistemic_classification;
    v_prev_outcome public.validation_outcome;
    v_val_run_id TEXT;
    v_rel RECORD;
    v_ev RECORD;
BEGIN
    -- 1. Security Check: Service Role Only
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: insert_server_verified_validation requires service_role'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Input Sanity Checks
    IF p_gap_id IS NULL THEN
        RAISE EXCEPTION 'p_gap_id cannot be null' USING ERRCODE = '23502';
    END IF;

    IF p_confidence_score < 0.0 OR p_confidence_score > 10.0 THEN
        RAISE EXCEPTION 'Confidence score must be between 0.0 and 10.0, received %', p_confidence_score
            USING ERRCODE = '22003';
    END IF;

    -- Set trusted server context for duration of transaction
    PERFORM set_config('app.trusted_server_context', 'true', true);

    -- 3. Lock Research Gap Row for Atomicity
    SELECT current_epistemic_classification, current_validation_outcome
    INTO v_prev_classification, v_prev_outcome
    FROM public.research_gaps
    WHERE id = p_gap_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Research gap with ID % does not exist', p_gap_id USING ERRCODE = 'P0002';
    END IF;

    -- 4. Generate Deterministic Validation Run ID
    v_val_run_id := 'VAL-' || to_char(timezone('utc'::text, now()), 'YYYYMMDD-HH24MISS') || '-' || substr(p_gap_id::text, 1, 8);

    -- 5. Insert Validation Run Record (Generates unique entry for composite FK)
    INSERT INTO public.research_gap_validations (
        gap_id,
        validation_outcome,
        confidence_score,
        reasoning_summary,
        model_attribution,
        supporting_evidence_references,
        contradictory_evidence_references,
        previously_addressed_research_references,
        search_methodology_version,
        literature_coverage_timestamp,
        validation_run_id,
        literature_coverage_metadata
    ) VALUES (
        p_gap_id,
        p_validation_outcome,
        p_confidence_score,
        p_reasoning_summary,
        p_model_attribution,
        p_supporting_evidence_references,
        p_contradictory_evidence_references,
        p_previously_addressed_research_references,
        p_search_methodology_version,
        p_literature_coverage_timestamp,
        v_val_run_id,
        p_literature_coverage_metadata
    ) RETURNING id INTO v_validation_id;

    -- 6. Insert Strongly-Typed Relationships with Composite FK
    IF jsonb_array_length(p_gap_relationships) > 0 THEN
        FOR v_rel IN SELECT * FROM jsonb_to_recordset(p_gap_relationships) AS x(
            source_gap_id UUID,
            source_paper_id UUID,
            target_gap_id UUID,
            target_paper_id UUID,
            relationship_type TEXT,
            confidence_weight NUMERIC,
            bilateral_evidence_refs JSONB
        )
        LOOP
            INSERT INTO public.research_gap_relationships (
                gap_id,
                validation_run_id,
                source_gap_id,
                source_paper_id,
                target_gap_id,
                target_paper_id,
                relationship_type,
                confidence_weight,
                bilateral_evidence_refs
            ) VALUES (
                p_gap_id,
                v_val_run_id,
                v_rel.source_gap_id,
                v_rel.source_paper_id,
                v_rel.target_gap_id,
                v_rel.target_paper_id,
                v_rel.relationship_type,
                v_rel.confidence_weight,
                COALESCE(v_rel.bilateral_evidence_refs, '[]'::jsonb)
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- 7. Insert New Bilateral Evidence Items referencing public.research_papers
    IF jsonb_array_length(p_new_evidence_items) > 0 THEN
        FOR v_ev IN SELECT * FROM jsonb_to_recordset(p_new_evidence_items) AS y(
            paper_id UUID,
            doi TEXT,
            openalex_id TEXT,
            source_url TEXT,
            source_document_checksum TEXT,
            extracted_text_checksum TEXT,
            chunk_identifier TEXT,
            page_number INTEGER,
            section_name TEXT,
            exact_quotation TEXT,
            start_offset INTEGER,
            end_offset INTEGER,
            offset_unit TEXT,
            text_normalization_version TEXT,
            evidence_classification TEXT,
            ai_interpretation TEXT,
            verification_status TEXT
        )
        LOOP
            INSERT INTO public.research_gap_evidence (
                gap_id,
                paper_id,
                doi,
                openalex_id,
                source_url,
                source_document_checksum,
                extracted_text_checksum,
                chunk_identifier,
                page_number,
                section_name,
                exact_quotation,
                start_offset,
                end_offset,
                offset_unit,
                text_normalization_version,
                evidence_classification,
                ai_interpretation,
                model_attribution,
                verification_status
            ) VALUES (
                p_gap_id,
                v_ev.paper_id,
                v_ev.doi,
                v_ev.openalex_id,
                v_ev.source_url,
                COALESCE(v_ev.source_document_checksum, 'sha256:unknown'),
                COALESCE(v_ev.extracted_text_checksum, 'sha256:unknown'),
                COALESCE(v_ev.chunk_identifier, 'chunk_0'),
                COALESCE(v_ev.page_number, 1),
                COALESCE(v_ev.section_name, 'General'),
                COALESCE(v_ev.exact_quotation, ''),
                COALESCE(v_ev.start_offset, 0),
                COALESCE(v_ev.end_offset, 0),
                COALESCE(v_ev.offset_unit, 'codepoints'),
                COALESCE(v_ev.text_normalization_version, 'v1.0-nfc-normalized'),
                COALESCE(v_ev.evidence_classification, 'EXPLICIT_AUTHOR_STATEMENT'),
                COALESCE(v_ev.ai_interpretation, ''),
                p_model_attribution,
                COALESCE(v_ev.verification_status, 'VERIFIED_EXACT_MATCH')
            );
        END LOOP;
    END IF;

    -- 8. Atomically Update Parent Research Gap
    UPDATE public.research_gaps
    SET current_validation_outcome = p_validation_outcome,
        current_epistemic_classification = p_new_epistemic_classification,
        evidence_confidence = p_confidence_score,
        last_validated_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_gap_id;

    -- 9. Insert Immutable Audit Log Record
    INSERT INTO public.research_gap_audit_log (
        gap_id,
        previous_classification,
        new_classification,
        previous_validation_outcome,
        new_validation_outcome,
        transition_reason,
        evidence_snapshot,
        validation_run_id,
        literature_coverage_date,
        model_identifier,
        prompt_methodology_version
    ) VALUES (
        p_gap_id,
        v_prev_classification,
        p_new_epistemic_classification,
        v_prev_outcome,
        p_validation_outcome,
        'Stage 4D Validation: ' || p_reasoning_summary,
        jsonb_build_object(
            'supporting', p_supporting_evidence_references,
            'contradictory', p_contradictory_evidence_references,
            'addressed', p_previously_addressed_research_references
        ),
        v_val_run_id,
        p_literature_coverage_timestamp,
        p_model_attribution,
        '4.1.0-REVISED'
    );

    RETURN v_validation_id;
END;
$$;

-- 9. Archival and Purge Administrative RPCs

-- 9A. Soft Deletion / Archival RPC
CREATE OR REPLACE FUNCTION public.archive_research_gap(
    p_gap_id UUID,
    p_archival_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_creator UUID;
    v_is_archived BOOLEAN;
BEGIN
    -- Verify gap existence
    SELECT created_by, is_archived INTO v_creator, v_is_archived
    FROM public.research_gaps
    WHERE id = p_gap_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Research gap with ID % does not exist', p_gap_id USING ERRCODE = 'P0002';
    END IF;

    -- Authorization check: owner or service_role
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        IF auth.uid() IS NULL OR auth.uid() <> v_creator THEN
            RAISE EXCEPTION 'Access denied: Only gap owner or service_role can archive a research gap.' USING ERRCODE = '42501';
        END IF;
    END IF;

    PERFORM set_config('app.trusted_server_context', 'true', true);

    UPDATE public.research_gaps
    SET is_archived = true,
        archived_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_gap_id;

    -- Record in audit log
    INSERT INTO public.research_gap_audit_log (
        gap_id,
        previous_classification,
        new_classification,
        previous_validation_outcome,
        new_validation_outcome,
        transition_reason,
        evidence_snapshot,
        validation_run_id,
        literature_coverage_date,
        model_identifier,
        prompt_methodology_version
    ) VALUES (
        p_gap_id,
        NULL,
        (SELECT current_epistemic_classification FROM public.research_gaps WHERE id = p_gap_id),
        NULL,
        (SELECT current_validation_outcome FROM public.research_gaps WHERE id = p_gap_id),
        'Gap Archived: ' || coalesce(p_archival_reason, 'User or administrative archival'),
        '{}'::jsonb,
        'ARCHIVE-' || to_char(timezone('utc'::text, now()), 'YYYYMMDD-HH24MISS'),
        timezone('utc'::text, now()),
        'system-archival',
        '4.1.0-REVISED'
    );

    RETURN TRUE;
END;
$$;

-- 9B. Controlled Administrative Purge RPC
CREATE OR REPLACE FUNCTION public.purge_archived_research_gap(
    p_gap_id UUID,
    p_purge_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_archived BOOLEAN;
    v_dep_count INTEGER;
BEGIN
    -- Strict service_role authorization check
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: purge_archived_research_gap requires service_role authorization.' USING ERRCODE = '42501';
    END IF;

    -- Verify gap existence and archived state
    SELECT is_archived INTO v_is_archived
    FROM public.research_gaps
    WHERE id = p_gap_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Research gap with ID % does not exist', p_gap_id USING ERRCODE = 'P0002';
    END IF;

    IF v_is_archived <> true THEN
        RAISE EXCEPTION 'Cannot purge active research gap: Gap must be archived first via archive_research_gap().' USING ERRCODE = '22000';
    END IF;

    -- Check if any OTHER active research gap depends on this gap as source or target
    SELECT count(*) INTO v_dep_count
    FROM public.research_gap_relationships r
    JOIN public.research_gaps g ON g.id = r.gap_id
    WHERE (r.source_gap_id = p_gap_id OR r.target_gap_id = p_gap_id)
      AND r.gap_id <> p_gap_id
      AND g.is_archived = false;

    IF v_dep_count > 0 THEN
        RAISE EXCEPTION 'Purge restricted: % active research gap relationship(s) depend on this gap as an evidence anchor. Purge would break historical provenance.', v_dep_count
            USING ERRCODE = '23001';
    END IF;

    PERFORM set_config('app.trusted_server_context', 'true', true);

    -- Delete self-scoped relationships first
    DELETE FROM public.research_gap_relationships WHERE gap_id = p_gap_id;

    -- Delete self-scoped validations
    DELETE FROM public.research_gap_validations WHERE gap_id = p_gap_id;

    -- Delete self-scoped evidence
    DELETE FROM public.research_gap_evidence WHERE gap_id = p_gap_id;

    -- Delete research gap record
    DELETE FROM public.research_gaps WHERE id = p_gap_id;

    RETURN TRUE;
END;
$$;
