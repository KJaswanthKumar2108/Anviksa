-- ====================================================================
-- Anvīkṣā — Stage 4E Additive Migration: Research Opportunity Intelligence
-- Work Package: 4E-IMP-01
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Create table public.research_opportunities
CREATE TABLE IF NOT EXISTS public.research_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE RESTRICT,
    validation_run_id TEXT NOT NULL,
    
    -- Status lifecycle
    status TEXT NOT NULL DEFAULT 'ELIGIBLE' CHECK (status IN (
        'ELIGIBLE',
        'RANKED',
        'UNDER_REVIEW',
        'ACCEPTED',
        'REJECTED',
        'STALE',
        'INELIGIBLE'
    )),
    
    -- Four Intrinsic Scientific Dimensions (Each bounded on [0.00, 10.00])
    intrinsic_scientific_value NUMERIC(4,2) CHECK (
        intrinsic_scientific_value IS NULL OR 
        (intrinsic_scientific_value >= 0.00 AND intrinsic_scientific_value <= 10.00)
    ),
    evidence_confidence_score NUMERIC(4,2) CHECK (
        evidence_confidence_score IS NULL OR 
        (evidence_confidence_score >= 0.00 AND evidence_confidence_score <= 10.00)
    ),
    novelty_score NUMERIC(4,2) CHECK (
        novelty_score IS NULL OR 
        (novelty_score >= 0.00 AND novelty_score <= 10.00)
    ),
    scientific_significance_score NUMERIC(4,2) CHECK (
        scientific_significance_score IS NULL OR 
        (scientific_significance_score >= 0.00 AND scientific_significance_score <= 10.00)
    ),
    methodological_tractability_score NUMERIC(4,2) CHECK (
        methodological_tractability_score IS NULL OR 
        (methodological_tractability_score >= 0.00 AND methodological_tractability_score <= 10.00)
    ),
    
    -- Discrete Scientific Qualifications (Replacing crude scalar capping)
    contradiction_status TEXT NOT NULL DEFAULT 'CONTRADICTION_STATUS_UNKNOWN' CHECK (contradiction_status IN (
        'NO_CONTRADICTIONS_DETECTED',
        'PREMISE_FALSIFIED',
        'SCOPE_NARROWED',
        'CONTRADICTION_STATUS_UNKNOWN'
    )),
    literature_density_status TEXT NOT NULL DEFAULT 'ACTIVE_COMPETITIVE' CHECK (literature_density_status IN (
        'SPARSE_FRONTIER',
        'ACTIVE_COMPETITIVE',
        'SATURATED_EXACT_REPETITION',
        'DIFFICULT_OPEN_DIRECTION'
    )),
    
    -- Residual scope for PARTIALLY_ADDRESSED gaps
    residual_unresolved_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Sensitivity & Methodology Metadata
    weighting_regime TEXT NOT NULL DEFAULT 'BALANCED_DEFAULT',
    scoring_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    structured_explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Invalidation & Staleness Tracking
    is_stale BOOLEAN NOT NULL DEFAULT false,
    staleness_reason TEXT,
    
    -- Provenance & Timestamps
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Composite Foreign Key to public.research_gap_validations:
    -- Guarantees validation_run_id belongs strictly to the associated gap_id.
    -- Uses ON DELETE RESTRICT to guarantee historical validation runs cannot be deleted while opportunities exist!
    CONSTRAINT fk_opp_validation_run 
        FOREIGN KEY (gap_id, validation_run_id) 
        REFERENCES public.research_gap_validations(gap_id, validation_run_id) 
        ON DELETE RESTRICT,
        
    -- Explicit Prohibition of Nil UUID Sentinel
    CONSTRAINT chk_opp_gap_not_nil 
        CHECK (gap_id <> '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 2. Partial Unique Index (Ensures single active opportunity per gap + validation run + weighting regime)
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_active_opp 
    ON public.research_opportunities (gap_id, validation_run_id, weighting_regime)
    WHERE status <> 'REJECTED';

-- 3. Lookup Indexes for Opportunity Retrieval
CREATE INDEX IF NOT EXISTS idx_opp_gap_run 
    ON public.research_opportunities (gap_id, validation_run_id);

CREATE INDEX IF NOT EXISTS idx_opp_status_score 
    ON public.research_opportunities (status, intrinsic_scientific_value DESC NULLS LAST);

-- 4. Enable Row-Level Security
ALTER TABLE public.research_opportunities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow public/authenticated read access to active opportunities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'research_opportunities' AND policyname = 'p_select_active_opportunities'
    ) THEN
        CREATE POLICY p_select_active_opportunities 
            ON public.research_opportunities 
            FOR SELECT 
            USING (status <> 'REJECTED');
    END IF;
END $$;

-- Service role has full write access (mutations occur via server-verified RPCs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'research_opportunities' AND policyname = 'p_service_role_all_opportunities'
    ) THEN
        CREATE POLICY p_service_role_all_opportunities 
            ON public.research_opportunities 
            FOR ALL 
            TO service_role 
            USING (true) 
            WITH CHECK (true);
    END IF;
END $$;

-- 6. SECURITY DEFINER RPC: rpc_persist_research_opportunity
-- Idempotently persists or updates a server-verified scientific opportunity record
CREATE OR REPLACE FUNCTION public.rpc_persist_research_opportunity(
    p_gap_id UUID,
    p_validation_run_id TEXT,
    p_status TEXT,
    p_intrinsic_value NUMERIC,
    p_confidence NUMERIC,
    p_novelty NUMERIC,
    p_significance NUMERIC,
    p_tractability NUMERIC,
    p_contradiction_status TEXT,
    p_density_status TEXT,
    p_residual_scope JSONB DEFAULT '{}'::jsonb,
    p_weighting_regime TEXT DEFAULT 'BALANCED_DEFAULT',
    p_scoring_metadata JSONB DEFAULT '{}'::jsonb,
    p_structured_explanation JSONB DEFAULT '{}'::jsonb,
    p_evidence_provenance JSONB DEFAULT '{}'::jsonb,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_validation_exists BOOLEAN;
    v_opp_id UUID;
BEGIN
    -- Verify validation run exists for the exact gap_id
    SELECT EXISTS (
        SELECT 1 FROM public.research_gap_validations
        WHERE gap_id = p_gap_id AND validation_run_id = p_validation_run_id
    ) INTO v_validation_exists;

    IF NOT v_validation_exists THEN
        RAISE EXCEPTION 'Target validation run % does not exist for gap %', p_validation_run_id, p_gap_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Upsert opportunity record
    INSERT INTO public.research_opportunities (
        gap_id,
        validation_run_id,
        status,
        intrinsic_scientific_value,
        evidence_confidence_score,
        novelty_score,
        scientific_significance_score,
        methodological_tractability_score,
        contradiction_status,
        literature_density_status,
        residual_unresolved_scope,
        weighting_regime,
        scoring_metadata,
        structured_explanation,
        evidence_provenance,
        created_by,
        updated_at
    ) VALUES (
        p_gap_id,
        p_validation_run_id,
        p_status,
        p_intrinsic_value,
        p_confidence,
        p_novelty,
        p_significance,
        p_tractability,
        p_contradiction_status,
        p_density_status,
        COALESCE(p_residual_scope, '{}'::jsonb),
        COALESCE(p_weighting_regime, 'BALANCED_DEFAULT'),
        COALESCE(p_scoring_metadata, '{}'::jsonb),
        COALESCE(p_structured_explanation, '{}'::jsonb),
        COALESCE(p_evidence_provenance, '{}'::jsonb),
        p_created_by,
        timezone('utc'::text, now())
    )
    ON CONFLICT (gap_id, validation_run_id, weighting_regime) WHERE status <> 'REJECTED'
    DO UPDATE SET
        status = EXCLUDED.status,
        intrinsic_scientific_value = EXCLUDED.intrinsic_scientific_value,
        evidence_confidence_score = EXCLUDED.evidence_confidence_score,
        novelty_score = EXCLUDED.novelty_score,
        scientific_significance_score = EXCLUDED.scientific_significance_score,
        methodological_tractability_score = EXCLUDED.methodological_tractability_score,
        contradiction_status = EXCLUDED.contradiction_status,
        literature_density_status = EXCLUDED.literature_density_status,
        residual_unresolved_scope = EXCLUDED.residual_unresolved_scope,
        scoring_metadata = EXCLUDED.scoring_metadata,
        structured_explanation = EXCLUDED.structured_explanation,
        evidence_provenance = EXCLUDED.evidence_provenance,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_opp_id;

    RETURN v_opp_id;
END;
$$;

-- 7. SECURITY DEFINER RPC: rpc_propagate_gap_staleness
-- Propagates staleness to dependent opportunities when an upstream gap outcome changes
CREATE OR REPLACE FUNCTION public.rpc_propagate_gap_staleness(
    p_gap_id UUID,
    p_validation_run_id TEXT,
    p_reason TEXT DEFAULT 'Upstream gap outcome re-evaluated'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE public.research_opportunities
    SET 
        is_stale = true,
        staleness_reason = p_reason,
        updated_at = timezone('utc'::text, now())
    WHERE gap_id = p_gap_id 
      AND (p_validation_run_id IS NULL OR validation_run_id = p_validation_run_id)
      AND is_stale = false;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

-- Grant execution to authenticated & service_role
GRANT EXECUTE ON FUNCTION public.rpc_persist_research_opportunity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_propagate_gap_staleness TO authenticated, service_role;
