-- ====================================================================
-- Anvīkṣā — Stage 4E Additive Migration: Resource Suitability & Recommendations
-- Work Package: 4E-IMP-04
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Create table public.researcher_resource_profiles
CREATE TABLE IF NOT EXISTS public.researcher_resource_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- High-level compute claims & summaries
    gpu_count INTEGER NOT NULL DEFAULT 0 CHECK (gpu_count >= 0),
    gpu_model TEXT,
    max_vram_gb INTEGER NOT NULL DEFAULT 0 CHECK (max_vram_gb >= 0),
    monthly_compute_budget_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (monthly_compute_budget_usd >= 0.00),
    accessible_dataset_tiers TEXT[] NOT NULL DEFAULT ARRAY['PUBLIC_OPEN']::TEXT[],
    
    -- Discrete resource evidence map: holds claims and verification states
    -- Evidence states: VERIFIED_AVAILABLE, DECLARED_AVAILABLE, VERIFIED_UNAVAILABLE, UNKNOWN, EXPIRED_EVIDENCE
    resource_claims JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Aggregate verification posture: VERIFIED, PARTIALLY_VERIFIED, SELF_DECLARED, UNVERIFIED
    overall_verification_status TEXT NOT NULL DEFAULT 'SELF_DECLARED' CHECK (
        overall_verification_status IN ('VERIFIED', 'PARTIALLY_VERIFIED', 'SELF_DECLARED', 'UNVERIFIED')
    ),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_researcher_profile_user UNIQUE (user_id)
);

-- 2. Create table public.researcher_resources (granular inventory items)
CREATE TABLE IF NOT EXISTS public.researcher_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Resource Categorization
    resource_category TEXT NOT NULL CHECK (resource_category IN (
        'COMPUTE_HARDWARE',
        'SOFTWARE_FRAMEWORK',
        'DATASET_ACCESS',
        'LAB_EQUIPMENT',
        'FINANCIAL_BUDGET',
        'HUMAN_EXPERTISE',
        'COLLABORATOR_ACCESS',
        'TIME_AVAILABILITY',
        'EXTERNAL_SERVICE'
    )),
    resource_name TEXT NOT NULL,
    description TEXT,
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Discrete Evidence States (Frozen Architecture Invariant)
    evidence_state TEXT NOT NULL DEFAULT 'DECLARED_AVAILABLE' CHECK (evidence_state IN (
        'VERIFIED_AVAILABLE',
        'DECLARED_AVAILABLE',
        'VERIFIED_UNAVAILABLE',
        'UNKNOWN',
        'EXPIRED_EVIDENCE'
    )),
    
    -- Provenance & Verification
    evidence_source TEXT NOT NULL DEFAULT 'USER_SELF_DECLARATION' CHECK (evidence_source IN (
        'CLOUD_PROVIDER_API',
        'INSTITUTIONAL_SSO',
        'BENCHMARK_PROBE',
        'CRYPTO_ATTESTATION',
        'PEER_CONFIRMED',
        'USER_SELF_DECLARATION',
        'NONE'
    )),
    verification_source_ref TEXT,
    verification_timestamp TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    evidence_freshness_ttl_days INTEGER DEFAULT 90 CHECK (evidence_freshness_ttl_days IS NULL OR evidence_freshness_ttl_days > 0),
    confidence_level TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
    
    -- Researcher Annotations & Overrides
    researcher_override_flag BOOLEAN NOT NULL DEFAULT false,
    override_justification TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create table public.research_strategic_recommendations
CREATE TABLE IF NOT EXISTS public.research_strategic_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.research_opportunities(id) ON DELETE RESTRICT,
    experiment_id UUID REFERENCES public.research_experiments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Independent Scientific Value & Provenance (Untarnished by researcher constraints)
    intrinsic_scientific_value NUMERIC(4,2) NOT NULL CHECK (
        intrinsic_scientific_value >= 0.00 AND intrinsic_scientific_value <= 10.00
    ),
    
    -- Researcher Execution Suitability (Nullable: null when SUITABILITY_UNDETERMINED)
    execution_suitability NUMERIC(4,2) CHECK (
        execution_suitability IS NULL OR 
        (execution_suitability >= 0.00 AND execution_suitability <= 10.00)
    ),
    suitability_status TEXT NOT NULL CHECK (suitability_status IN (
        'SUITABILITY_EVALUATED',
        'SUITABILITY_UNDETERMINED',
        'RESOURCE_BLOCKED'
    )),
    
    -- Strategic Quadrant Output
    strategic_quadrant TEXT NOT NULL CHECK (strategic_quadrant IN (
        'IMMEDIATE_HIGH_PRIORITY',
        'GRANT_OR_COLLABORATION_TARGET',
        'FEASIBLE_RESEARCH_OPPORTUNITY',
        'DEPRIORITIZED',
        'SUITABILITY_UNDETERMINED'
    )),
    
    -- Traceable Matching Breakdown & Evidence Rationale
    suitability_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    unmatched_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    resource_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_basis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Freshness & Invalidation Tracking
    is_stale BOOLEAN NOT NULL DEFAULT false,
    staleness_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chk_rec_opp_not_nil CHECK (opportunity_id <> '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 4. Create table public.researcher_reviews (for human sign-off on hypotheses, protocols, and opportunities)
CREATE TABLE IF NOT EXISTS public.researcher_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('HYPOTHESIS', 'EXPERIMENT', 'OPPORTUNITY')),
    entity_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'MODIFIED_AND_APPROVED', 'REVISION_REQUESTED')),
    review_comments TEXT NOT NULL,
    parameter_modifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chk_review_entity_not_nil CHECK (entity_id <> '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 5. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_res_user ON public.researcher_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_user_opp ON public.research_strategic_recommendations(user_id, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_rec_quadrant ON public.research_strategic_recommendations(strategic_quadrant);
CREATE INDEX IF NOT EXISTS idx_review_entity ON public.researcher_reviews(entity_type, entity_id);

-- 6. Enable RLS
ALTER TABLE public.researcher_resource_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_strategic_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_reviews ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Owner isolation for resources and recommendations)
CREATE POLICY rls_profile_owner_select ON public.researcher_resource_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY rls_resource_owner_select ON public.researcher_resources
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY rls_rec_owner_select ON public.research_strategic_recommendations
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY rls_reviews_select ON public.researcher_reviews
    FOR SELECT TO authenticated USING (true);

-- Block direct client modifications; all inserts/updates go through service_role or vetted RPCs
CREATE POLICY rls_profile_block_client_insert ON public.researcher_resource_profiles
    FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY rls_profile_block_client_update ON public.researcher_resource_profiles
    FOR UPDATE TO authenticated USING (false);
CREATE POLICY rls_profile_block_client_delete ON public.researcher_resource_profiles
    FOR DELETE TO authenticated USING (false);

CREATE POLICY rls_resource_block_client_insert ON public.researcher_resources
    FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY rls_resource_block_client_update ON public.researcher_resources
    FOR UPDATE TO authenticated USING (false);
CREATE POLICY rls_resource_block_client_delete ON public.researcher_resources
    FOR DELETE TO authenticated USING (false);

CREATE POLICY rls_rec_block_client_insert ON public.research_strategic_recommendations
    FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY rls_rec_block_client_update ON public.research_strategic_recommendations
    FOR UPDATE TO authenticated USING (false);
CREATE POLICY rls_rec_block_client_delete ON public.research_strategic_recommendations
    FOR DELETE TO authenticated USING (false);

-- 8. Privileged Atomic RPC: Upsert Researcher Resource (Service Role)
CREATE OR REPLACE FUNCTION public.rpc_upsert_researcher_resource(
    p_user_id UUID,
    p_resource_id UUID DEFAULT NULL,
    p_resource_category TEXT DEFAULT 'COMPUTE_HARDWARE',
    p_resource_name TEXT DEFAULT '',
    p_description TEXT DEFAULT NULL,
    p_specifications JSONB DEFAULT '{}'::jsonb,
    p_evidence_state TEXT DEFAULT 'DECLARED_AVAILABLE',
    p_evidence_source TEXT DEFAULT 'USER_SELF_DECLARATION',
    p_verification_source_ref TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_evidence_freshness_ttl_days INTEGER DEFAULT 90,
    p_confidence_level TEXT DEFAULT 'MEDIUM',
    p_researcher_override_flag BOOLEAN DEFAULT false,
    p_override_justification TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_res_id UUID;
    v_is_expired BOOLEAN := false;
    v_effective_state TEXT := p_evidence_state;
BEGIN
    -- Check expiration if timestamp provided
    IF p_expires_at IS NOT NULL AND p_expires_at < timezone('utc'::text, now()) THEN
        v_is_expired := true;
        IF v_effective_state = 'VERIFIED_AVAILABLE' THEN
            v_effective_state := 'EXPIRED_EVIDENCE';
        END IF;
    END IF;

    IF p_resource_id IS NOT NULL THEN
        -- Verify ownership
        IF NOT EXISTS (SELECT 1 FROM public.researcher_resources WHERE id = p_resource_id AND user_id = p_user_id) THEN
            RAISE EXCEPTION 'Resource not found or unauthorized' USING ERRCODE = '42501';
        END IF;

        UPDATE public.researcher_resources
        SET resource_category = p_resource_category,
            resource_name = p_resource_name,
            description = p_description,
            specifications = p_specifications,
            evidence_state = v_effective_state,
            evidence_source = p_evidence_source,
            verification_source_ref = p_verification_source_ref,
            verification_timestamp = CASE WHEN p_evidence_source <> 'USER_SELF_DECLARATION' THEN timezone('utc'::text, now()) ELSE verification_timestamp END,
            expires_at = p_expires_at,
            evidence_freshness_ttl_days = p_evidence_freshness_ttl_days,
            confidence_level = p_confidence_level,
            researcher_override_flag = p_researcher_override_flag,
            override_justification = p_override_justification,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_resource_id AND user_id = p_user_id
        RETURNING id INTO v_res_id;
    ELSE
        INSERT INTO public.researcher_resources (
            user_id,
            resource_category,
            resource_name,
            description,
            specifications,
            evidence_state,
            evidence_source,
            verification_source_ref,
            verification_timestamp,
            expires_at,
            evidence_freshness_ttl_days,
            confidence_level,
            researcher_override_flag,
            override_justification
        ) VALUES (
            p_user_id,
            p_resource_category,
            p_resource_name,
            p_description,
            p_specifications,
            v_effective_state,
            p_evidence_source,
            p_verification_source_ref,
            CASE WHEN p_evidence_source <> 'USER_SELF_DECLARATION' THEN timezone('utc'::text, now()) ELSE NULL END,
            p_expires_at,
            p_evidence_freshness_ttl_days,
            p_confidence_level,
            p_researcher_override_flag,
            p_override_justification
        )
        RETURNING id INTO v_res_id;
    END IF;

    -- Invalidate dependent recommendations for this researcher
    UPDATE public.research_strategic_recommendations
    SET is_stale = true,
        staleness_reason = 'UPSTREAM_RESOURCE_INVENTORY_MODIFIED',
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id AND is_stale = false;

    RETURN v_res_id;
END;
$$;

-- 9. Privileged Atomic RPC: Persist Strategic Recommendation (Service Role)
CREATE OR REPLACE FUNCTION public.rpc_persist_strategic_recommendation(
    p_opportunity_id UUID,
    p_experiment_id UUID,
    p_user_id UUID,
    p_intrinsic_scientific_value NUMERIC,
    p_execution_suitability NUMERIC,
    p_suitability_status TEXT,
    p_strategic_quadrant TEXT,
    p_suitability_breakdown JSONB,
    p_unmatched_requirements JSONB,
    p_resource_recommendations JSONB,
    p_evidence_basis JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_rec_id UUID;
BEGIN
    INSERT INTO public.research_strategic_recommendations (
        opportunity_id,
        experiment_id,
        user_id,
        intrinsic_scientific_value,
        execution_suitability,
        suitability_status,
        strategic_quadrant,
        suitability_breakdown,
        unmatched_requirements,
        resource_recommendations,
        evidence_basis,
        is_stale,
        staleness_reason
    ) VALUES (
        p_opportunity_id,
        p_experiment_id,
        p_user_id,
        p_intrinsic_scientific_value,
        p_execution_suitability,
        p_suitability_status,
        p_strategic_quadrant,
        p_suitability_breakdown,
        p_unmatched_requirements,
        p_resource_recommendations,
        p_evidence_basis,
        false,
        NULL
    )
    RETURNING id INTO v_rec_id;

    RETURN v_rec_id;
END;
$$;

-- 10. Staleness Propagation Trigger on Experiments
CREATE OR REPLACE FUNCTION public.fn_cascade_experiment_staleness_to_recommendations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (NEW.is_stale = true AND (OLD.is_stale IS DISTINCT FROM true))) THEN
        UPDATE public.research_strategic_recommendations
        SET is_stale = true,
            staleness_reason = 'UPSTREAM_EXPERIMENT_PROTOCOL_STALE',
            updated_at = timezone('utc'::text, now())
        WHERE experiment_id = NEW.id AND is_stale = false;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_experiment_to_recommendations ON public.research_experiments;
CREATE TRIGGER trg_cascade_experiment_to_recommendations
    AFTER UPDATE OF is_stale ON public.research_experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_cascade_experiment_staleness_to_recommendations();

-- Revoke execute from public/anon on privileged RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_upsert_researcher_resource FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_persist_strategic_recommendation FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_upsert_researcher_resource TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_persist_strategic_recommendation TO service_role;
