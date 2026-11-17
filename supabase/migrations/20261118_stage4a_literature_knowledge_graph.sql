-- ====================================================================
-- Anvīkṣā — Stage 4A Migration: Literature Knowledge Graph & Provenance
-- Version: 4.1.0-REVISED
-- Safety: ADDITIVE ONLY, IDEMPOTENT (IF NOT EXISTS), NON-DESTRUCTIVE
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'research_gap_category') THEN
        CREATE TYPE public.research_gap_category AS ENUM (
            'METHODOLOGICAL',
            'THEORETICAL',
            'EMPIRICAL',
            'DATASET_BENCHMARK',
            'EVALUATION_MEASUREMENT',
            'COMPUTATIONAL_SCALABILITY',
            'SECURITY_ROBUSTNESS_PRIVACY',
            'REPRODUCIBILITY',
            'GENERALIZATION',
            'CONTRADICTORY_FINDINGS',
            'APPLICATION_DOMAIN',
            'DEPLOYMENT_IMPLEMENTATION'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'epistemic_classification') THEN
        CREATE TYPE public.epistemic_classification AS ENUM (
            'AUTHOR_STATED_LIMITATION',
            'PAPER_SUPPORTED_OBSERVATION',
            'AI_INFERRED_LIMITATION',
            'CANDIDATE_RESEARCH_GAP',
            'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
            'ADDRESSED_OR_SUPERSEDED_GAP'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_outcome') THEN
        CREATE TYPE public.validation_outcome AS ENUM (
            'CONFIRMED_UNRESOLVED',
            'PARTIALLY_ADDRESSED',
            'ADDRESSED',
            'CONTRADICTED',
            'INSUFFICIENT_EVIDENCE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gap_visibility') THEN
        CREATE TYPE public.gap_visibility AS ENUM (
            'private',
            'community',
            'public'
        );
    END IF;
END $$;

-- 3. PRIMARY TABLE: public.research_gaps
CREATE TABLE IF NOT EXISTS public.research_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_statement TEXT NOT NULL,
    gap_category public.research_gap_category NOT NULL,
    current_epistemic_classification public.epistemic_classification NOT NULL DEFAULT 'CANDIDATE_RESEARCH_GAP',
    current_validation_outcome public.validation_outcome NOT NULL DEFAULT 'INSUFFICIENT_EVIDENCE',
    
    -- Six Independent Scoring Dimensions (Range 0.0 - 10.0, NULL allowed prior to scoring)
    evidence_confidence NUMERIC(4,2) CHECK (evidence_confidence IS NULL OR (evidence_confidence >= 0.0 AND evidence_confidence <= 10.0)),
    novelty_assessment NUMERIC(4,2) CHECK (novelty_assessment IS NULL OR (novelty_assessment >= 0.0 AND novelty_assessment <= 10.0)),
    scientific_significance NUMERIC(4,2) CHECK (scientific_significance IS NULL OR (scientific_significance >= 0.0 AND scientific_significance <= 10.0)),
    practical_feasibility NUMERIC(4,2) CHECK (practical_feasibility IS NULL OR (practical_feasibility >= 0.0 AND practical_feasibility <= 10.0)),
    research_tractability NUMERIC(4,2) CHECK (research_tractability IS NULL OR (research_tractability >= 0.0 AND research_tractability <= 10.0)),
    opportunity_priority NUMERIC(4,2) CHECK (opportunity_priority IS NULL OR (opportunity_priority >= 0.0 AND opportunity_priority <= 10.0)),
    
    -- Scoring metadata & reproducible parameter versions
    scoring_metadata JSONB NOT NULL DEFAULT '{"scoring_version": "4.1.0-REVISED"}'::jsonb,
    
    -- Ownership, Visibility & Publication Status
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visibility public.gap_visibility NOT NULL DEFAULT 'private',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Server-Enforced Provenance
    verified_by_server BOOLEAN NOT NULL DEFAULT FALSE,
    model_used TEXT NOT NULL,
    model_requested TEXT NOT NULL,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Compound & Functional Indexes on research_gaps
CREATE INDEX IF NOT EXISTS idx_research_gaps_category_epistemic ON public.research_gaps (gap_category, current_epistemic_classification);
CREATE INDEX IF NOT EXISTS idx_research_gaps_priority ON public.research_gaps (opportunity_priority DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_research_gaps_visibility_user ON public.research_gaps (visibility, created_by, is_published);

-- 4. EVIDENCE TABLE: public.research_gap_evidence
CREATE TABLE IF NOT EXISTS public.research_gap_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE CASCADE,
    paper_id UUID REFERENCES public.research_papers(id) ON DELETE CASCADE,
    
    -- Canonical Identifiers & Source Location
    doi TEXT,
    openalex_id TEXT,
    source_url TEXT,
    source_document_checksum TEXT NOT NULL, -- SHA-256 of raw binary or source PDF
    extracted_text_checksum TEXT NOT NULL,  -- SHA-256 of normalized extracted text
    chunk_identifier TEXT NOT NULL,
    page_number INTEGER,
    section_name TEXT NOT NULL,
    
    -- Exact Quotation & Offset Convention (Versioned Normalized Extracted Text)
    exact_quotation TEXT NOT NULL,
    start_offset INTEGER NOT NULL CHECK (start_offset >= 0),
    end_offset INTEGER NOT NULL CHECK (end_offset >= start_offset),
    offset_unit TEXT NOT NULL DEFAULT 'codepoints' CHECK (offset_unit IN ('codepoints', 'utf8_bytes', 'tokens')),
    text_normalization_version TEXT NOT NULL DEFAULT 'v1.0-nfc-normalized',
    
    -- Evidence Classification & Semantic Interpretation
    evidence_classification TEXT NOT NULL CHECK (evidence_classification IN ('AUTHOR_CONCESSION', 'EMPIRICAL_TABLE', 'METHODOLOGICAL_DETAIL', 'AI_DEDUCTION')),
    ai_interpretation TEXT NOT NULL,
    model_attribution TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED_EXACT_MATCH', 'VERIFIED_NORMALIZED_MATCH', 'FAILED_VERIFICATION')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gap_evidence_gap_id ON public.research_gap_evidence (gap_id);
CREATE INDEX IF NOT EXISTS idx_gap_evidence_paper_id ON public.research_gap_evidence (paper_id);
CREATE INDEX IF NOT EXISTS idx_gap_evidence_checksum ON public.research_gap_evidence (extracted_text_checksum);

-- 5. VALIDATIONS TABLE: public.research_gap_validations
CREATE TABLE IF NOT EXISTS public.research_gap_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE CASCADE,
    validation_run_id TEXT NOT NULL,
    
    -- Traceable Evidence Reference Arrays (UUIDs pointing to research_gap_evidence or papers)
    supporting_evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    contradictory_evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    previously_addressed_research_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    validation_outcome public.validation_outcome NOT NULL,
    literature_coverage_timestamp TIMESTAMPTZ NOT NULL,
    search_methodology_version TEXT NOT NULL DEFAULT '4.1.0-multi-vector-discovery',
    reasoning_summary TEXT NOT NULL,
    model_attribution TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gap_validations_gap_id ON public.research_gap_validations (gap_id);
CREATE INDEX IF NOT EXISTS idx_gap_validations_run_id ON public.research_gap_validations (validation_run_id);

-- 6. IMMUTABLE AUDIT LOG: public.research_gap_audit_log
CREATE TABLE IF NOT EXISTS public.research_gap_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE CASCADE,
    previous_classification public.epistemic_classification,
    new_classification public.epistemic_classification NOT NULL,
    previous_validation_outcome public.validation_outcome,
    new_validation_outcome public.validation_outcome NOT NULL,
    transition_reason TEXT NOT NULL,
    evidence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_run_id TEXT NOT NULL,
    literature_coverage_date TIMESTAMPTZ NOT NULL,
    model_identifier TEXT NOT NULL,
    prompt_methodology_version TEXT NOT NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gap_audit_log_gap_id ON public.research_gap_audit_log (gap_id);
CREATE INDEX IF NOT EXISTS idx_gap_audit_log_assessed_at ON public.research_gap_audit_log (assessed_at);

-- 7. EXTEND RELATIONSHIPS CONSTRAINTS: public.research_relationships
-- Prevent self-reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.research_relationships'::regclass 
          AND conname = 'chk_no_self_relationship'
    ) THEN
        ALTER TABLE public.research_relationships
        ADD CONSTRAINT chk_no_self_relationship 
        CHECK (NOT (source_type = target_type AND source_id = target_id));
    END IF;
END $$;

-- Prevent relationship duplication via unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_research_relationship 
ON public.research_relationships (source_type, source_id, target_type, target_id, relationship_type);

-- 8. PROVENANCE SECURITY TRIGGER FOR RESEARCH GAPS
CREATE OR REPLACE FUNCTION public.protect_research_gaps_provenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Service-role bypass: ONLY genuine service_role or internal postgres context with service_role caller
    IF auth.role() = 'service_role' OR (current_user = 'postgres' AND current_setting('app.trusted_server_context', true) = 'true' AND coalesce(auth.role(), '') = 'service_role') THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Clients cannot self-verify
        IF NEW.verified_by_server = true THEN
            RAISE EXCEPTION 'Access denied: Only trusted backend service_role can persist server-verified research gaps.';
        END IF;

        -- Clients cannot declare AI model provenance
        IF NEW.model_used IS NOT NULL OR NEW.model_requested IS NOT NULL OR NEW.is_fallback = true OR NEW.fallback_reason IS NOT NULL THEN
            RAISE EXCEPTION 'Access denied: Client cannot declare AI model provenance on research gaps.';
        END IF;

        -- Enforce user identity and ownership
        IF auth.uid() IS NOT NULL THEN
            IF NEW.created_by IS NOT NULL AND NEW.created_by <> auth.uid() THEN
                RAISE EXCEPTION 'Access denied: User cannot impersonate another creator.';
            END IF;
            NEW.created_by := auth.uid();
        ELSE
            RAISE EXCEPTION 'Access denied: Unauthenticated clients cannot insert research gaps.';
        END IF;

        -- Enforce single-paper validation rule: user cannot insert with cross-literature status directly
        IF NEW.current_epistemic_classification = 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP' THEN
            RAISE EXCEPTION 'Access denied: Initial candidate gaps cannot be created as CROSS_LITERATURE_VALIDATED_RESEARCH_GAP.';
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Prevent self-verification upgrade
        IF NEW.verified_by_server = true AND OLD.verified_by_server = false THEN
            RAISE EXCEPTION 'Access denied: Cannot self-verify research gaps without server authorization.';
        END IF;

        -- Prevent ownership transfer
        IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION 'Access denied: Modification of gap ownership (created_by) is prohibited.';
        END IF;

        -- If verified record, prevent modification of protected provenance fields
        IF OLD.verified_by_server = true THEN
            IF NEW.model_used IS DISTINCT FROM OLD.model_used OR
               NEW.model_requested IS DISTINCT FROM OLD.model_requested OR
               NEW.is_fallback IS DISTINCT FROM OLD.is_fallback OR
               NEW.fallback_reason IS DISTINCT FROM OLD.fallback_reason OR
               NEW.verified_by_server IS DISTINCT FROM OLD.verified_by_server THEN
                RAISE EXCEPTION 'Access denied: Modification of server-verified research gap provenance is prohibited.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_research_gaps_provenance ON public.research_gaps;
CREATE TRIGGER trg_protect_research_gaps_provenance
BEFORE INSERT OR UPDATE ON public.research_gaps
FOR EACH ROW EXECUTE FUNCTION public.protect_research_gaps_provenance();

-- 9. IMMUTABILITY TRIGGER FOR AUDIT LOG
CREATE OR REPLACE FUNCTION public.protect_research_gap_audit_log_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Access denied: public.research_gap_audit_log is append-only and permanently immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_gap_audit_log_immutability ON public.research_gap_audit_log;
CREATE TRIGGER trg_protect_gap_audit_log_immutability
BEFORE UPDATE OR DELETE ON public.research_gap_audit_log
FOR EACH ROW EXECUTE FUNCTION public.protect_research_gap_audit_log_immutability();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.research_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gap_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gap_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_gap_audit_log ENABLE ROW LEVEL SECURITY;

-- 10.1 research_gaps RLS
DROP POLICY IF EXISTS "rls_research_gaps_select" ON public.research_gaps;
CREATE POLICY "rls_research_gaps_select" ON public.research_gaps
FOR SELECT TO public
USING (
    (visibility IN ('public', 'community') AND is_published = true) OR
    (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
    auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "rls_research_gaps_insert" ON public.research_gaps;
CREATE POLICY "rls_research_gaps_insert" ON public.research_gaps
FOR INSERT TO public
WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.uid() = created_by AND verified_by_server = false AND model_used IS NULL)
);

DROP POLICY IF EXISTS "rls_research_gaps_update" ON public.research_gaps;
CREATE POLICY "rls_research_gaps_update" ON public.research_gaps
FOR UPDATE TO public
USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.uid() = created_by)
)
WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.uid() = created_by)
);

DROP POLICY IF EXISTS "rls_research_gaps_delete" ON public.research_gaps;
CREATE POLICY "rls_research_gaps_delete" ON public.research_gaps
FOR DELETE TO public
USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.uid() = created_by)
);

-- 10.2 research_gap_evidence RLS
DROP POLICY IF EXISTS "rls_gap_evidence_select" ON public.research_gap_evidence;
CREATE POLICY "rls_gap_evidence_select" ON public.research_gap_evidence
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_evidence.gap_id
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "rls_gap_evidence_write" ON public.research_gap_evidence;
CREATE POLICY "rls_gap_evidence_write" ON public.research_gap_evidence
FOR ALL TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_evidence.gap_id
        AND auth.uid() IS NOT NULL AND g.created_by = auth.uid()
    )
)
WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_evidence.gap_id
        AND auth.uid() IS NOT NULL AND g.created_by = auth.uid()
    )
);

-- 10.3 research_gap_validations RLS
DROP POLICY IF EXISTS "rls_gap_validations_select" ON public.research_gap_validations;
CREATE POLICY "rls_gap_validations_select" ON public.research_gap_validations
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_validations.gap_id
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "rls_gap_validations_write" ON public.research_gap_validations;
CREATE POLICY "rls_gap_validations_write" ON public.research_gap_validations
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 10.4 research_gap_audit_log RLS
DROP POLICY IF EXISTS "rls_gap_audit_log_select" ON public.research_gap_audit_log;
CREATE POLICY "rls_gap_audit_log_select" ON public.research_gap_audit_log
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_gaps g
        WHERE g.id = research_gap_audit_log.gap_id
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

DROP POLICY IF EXISTS "rls_gap_audit_log_insert" ON public.research_gap_audit_log;
CREATE POLICY "rls_gap_audit_log_insert" ON public.research_gap_audit_log
FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role');

-- 11. TRUSTED RPC FUNCTION: public.insert_server_verified_gap
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
BEGIN
    -- Strict service_role authorization check
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: insert_server_verified_gap requires service_role authorization.';
    END IF;

    -- Set trusted server context for duration of transaction
    PERFORM set_config('app.trusted_server_context', 'true', true);

    -- 1. Insert Gap Record
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
                coalesce(v_evidence_elem->>'evidence_classification', 'METHODOLOGICAL_DETAIL'),
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

-- 12. ACL RESTRICTION FOR RPC
REVOKE ALL ON FUNCTION public.insert_server_verified_gap FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_server_verified_gap TO service_role;
