-- ====================================================================
-- Anvīkṣā — Stage 4C Additive Migration: Idempotency Key & Enhanced RPC
-- Version: 4.1.0-REVISED
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING RECORDS & RLS
-- ====================================================================

-- 1. Add idempotency_key column to public.research_gaps
ALTER TABLE public.research_gaps 
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Add unique constraint / index for idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_gaps_idempotency_key 
    ON public.research_gaps (idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_research_gaps_idempotency_key'
  ) THEN
    ALTER TABLE public.research_gaps ADD CONSTRAINT uq_research_gaps_idempotency_key UNIQUE (idempotency_key);
  END IF;
END $$;

-- 3. Update existing insert_server_verified_gap function with idempotency support via scoring_metadata
CREATE OR REPLACE FUNCTION public.insert_server_verified_gap(
    p_gap_statement TEXT,
    p_gap_category public.research_gap_category,
    p_epistemic_classification public.epistemic_classification,
    p_validation_outcome public.validation_outcome,
    p_evidence_confidence NUMERIC DEFAULT NULL,
    p_novelty_assessment NUMERIC DEFAULT NULL,
    p_scientific_significance NUMERIC DEFAULT NULL,
    p_practical_feasibility NUMERIC DEFAULT NULL,
    p_research_tractability NUMERIC DEFAULT NULL,
    p_opportunity_priority NUMERIC DEFAULT NULL,
    p_scoring_metadata JSONB DEFAULT '{"scoring_version": "4.1.0-REVISED"}'::jsonb,
    p_created_by UUID DEFAULT NULL,
    p_visibility public.gap_visibility DEFAULT 'private',
    p_is_published BOOLEAN DEFAULT FALSE,
    p_model_used TEXT DEFAULT 'gemma-4-26b-a4b-it',
    p_model_requested TEXT DEFAULT 'gemma-4-26b-a4b-it',
    p_is_fallback BOOLEAN DEFAULT FALSE,
    p_fallback_reason TEXT DEFAULT NULL,
    p_evidence_items JSONB DEFAULT '[]'::jsonb,
    p_audit_transition_reason TEXT DEFAULT 'Initial server-verified extraction'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_gap_id UUID;
    v_evidence_elem JSONB;
    v_val_run_id TEXT;
    v_idempotency_key TEXT;
BEGIN
    -- Strict service_role authorization check
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: insert_server_verified_gap requires service_role authorization.';
    END IF;

    -- Set trusted server context for duration of transaction
    PERFORM set_config('app.trusted_server_context', 'true', true);

    -- Extract idempotency key from scoring metadata if present
    v_idempotency_key := NULLIF(trim(coalesce(p_scoring_metadata->>'idempotency_key', '')), '');

    -- Fast-path idempotency check: if gap with this idempotency key already exists, return existing ID
    IF v_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_gap_id 
        FROM public.research_gaps 
        WHERE idempotency_key = v_idempotency_key 
        LIMIT 1;
        
        IF v_gap_id IS NOT NULL THEN
            UPDATE public.research_gaps 
            SET updated_at = timezone('utc'::text, now()) 
            WHERE id = v_gap_id;
            
            RETURN v_gap_id;
        END IF;
    END IF;

    -- 1. Insert Gap Record with concurrency-safe ON CONFLICT handling
    IF v_idempotency_key IS NOT NULL THEN
        INSERT INTO public.research_gaps (
            gap_statement,
            gap_category,
            current_epistemic_classification,
            current_validation_outcome,
            evidence_confidence,
            novelty_assessment,
            scientific_significance,
            practical_feasibility,
            research_tractability,
            opportunity_priority,
            scoring_metadata,
            created_by,
            visibility,
            is_published,
            verified_by_server,
            model_used,
            model_requested,
            is_fallback,
            fallback_reason,
            idempotency_key
        ) VALUES (
            p_gap_statement,
            p_gap_category,
            p_epistemic_classification,
            p_validation_outcome,
            p_evidence_confidence,
            p_novelty_assessment,
            p_scientific_significance,
            p_practical_feasibility,
            p_research_tractability,
            p_opportunity_priority,
            coalesce(p_scoring_metadata, '{"scoring_version": "4.1.0-REVISED"}'::jsonb),
            p_created_by,
            p_visibility,
            p_is_published,
            TRUE,
            p_model_used,
            p_model_requested,
            p_is_fallback,
            p_fallback_reason,
            v_idempotency_key
        )
        ON CONFLICT (idempotency_key) DO UPDATE
        SET updated_at = timezone('utc'::text, now())
        RETURNING id INTO v_gap_id;

        -- Check if evidence records already exist for this gap (conflict recovery)
        IF EXISTS (SELECT 1 FROM public.research_gap_evidence WHERE gap_id = v_gap_id LIMIT 1) THEN
            RETURN v_gap_id;
        END IF;
    ELSE
        INSERT INTO public.research_gaps (
            gap_statement,
            gap_category,
            current_epistemic_classification,
            current_validation_outcome,
            evidence_confidence,
            novelty_assessment,
            scientific_significance,
            practical_feasibility,
            research_tractability,
            opportunity_priority,
            scoring_metadata,
            created_by,
            visibility,
            is_published,
            verified_by_server,
            model_used,
            model_requested,
            is_fallback,
            fallback_reason
        ) VALUES (
            p_gap_statement,
            p_gap_category,
            p_epistemic_classification,
            p_validation_outcome,
            p_evidence_confidence,
            p_novelty_assessment,
            p_scientific_significance,
            p_practical_feasibility,
            p_research_tractability,
            p_opportunity_priority,
            coalesce(p_scoring_metadata, '{"scoring_version": "4.1.0-REVISED"}'::jsonb),
            p_created_by,
            p_visibility,
            p_is_published,
            TRUE,
            p_model_used,
            p_model_requested,
            p_is_fallback,
            p_fallback_reason
        ) RETURNING id INTO v_gap_id;
    END IF;

    -- 2. Insert Transactional Evidence Records if provided
    IF p_evidence_items IS NOT NULL AND jsonb_array_length(p_evidence_items) > 0 THEN
        FOR v_evidence_elem IN SELECT * FROM jsonb_array_elements(p_evidence_items)
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
                v_gap_id,
                CASE WHEN (v_evidence_elem->>'paper_id') IS NOT NULL AND (v_evidence_elem->>'paper_id') <> '' 
                     THEN (v_evidence_elem->>'paper_id')::uuid ELSE NULL END,
                v_evidence_elem->>'doi',
                v_evidence_elem->>'openalex_id',
                v_evidence_elem->>'source_url',
                coalesce(v_evidence_elem->>'source_document_checksum', 'sha256:unknown'),
                coalesce(v_evidence_elem->>'extracted_text_checksum', 'sha256:unknown'),
                coalesce(v_evidence_elem->>'chunk_identifier', 'chunk_0'),
                (v_evidence_elem->>'page_number')::integer,
                coalesce(v_evidence_elem->>'section_name', 'General'),
                coalesce(v_evidence_elem->>'exact_quotation', ''),
                coalesce((v_evidence_elem->>'start_offset')::integer, 0),
                coalesce((v_evidence_elem->>'end_offset')::integer, 0),
                coalesce(v_evidence_elem->>'offset_unit', 'codepoints'),
                coalesce(v_evidence_elem->>'text_normalization_version', 'v1.0-nfc-normalized'),
                coalesce(v_evidence_elem->>'evidence_classification', 'EXPLICIT_AUTHOR_STATEMENT'),
                coalesce(v_evidence_elem->>'ai_interpretation', ''),
                coalesce(v_evidence_elem->>'model_attribution', p_model_used),
                coalesce(v_evidence_elem->>'verification_status', 'VERIFIED_EXACT_MATCH')
            );
        END LOOP;
    END IF;

    -- 3. Insert Initial Immutable Audit Log Record
    v_val_run_id := 'init_' || to_char(now(), 'YYYYMMDD_HH24MISS') || '_' || substr(v_gap_id::text, 1, 8);
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
        v_gap_id,
        NULL,
        p_epistemic_classification,
        NULL,
        p_validation_outcome,
        p_audit_transition_reason,
        coalesce(p_evidence_items, '[]'::jsonb),
        v_val_run_id,
        now(),
        p_model_used,
        '4.1.0-REVISED'
    );

    RETURN v_gap_id;
END;
$$;
