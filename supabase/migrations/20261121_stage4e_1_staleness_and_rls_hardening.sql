-- ====================================================================
-- Anvīkṣā Stage 4E-IMP-01 Hardening Migration:
-- 1. Automatic Transactional Staleness Propagation Triggers
-- 2. Strict Inherited Parent-Gap RLS on research_opportunities
-- 3. Dedicated Service-Role ACL Enforcement on Privileged RPCs
-- ====================================================================

-- 1. Tighten RLS Policy on public.research_opportunities
-- Existing policy allowed any public user to select opportunities even if parent gap was private/unpublished.
-- New policy strictly enforces parent research gap visibility and ownership.
DROP POLICY IF EXISTS p_select_active_opportunities ON public.research_opportunities;
DROP POLICY IF EXISTS rls_research_opportunities_select ON public.research_opportunities;

CREATE POLICY rls_research_opportunities_select 
ON public.research_opportunities 
FOR SELECT TO public
USING (
    status <> 'REJECTED' AND (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.research_gaps g
            WHERE g.id = research_opportunities.gap_id
            AND (
                (g.visibility IN ('public', 'community') AND g.is_published = true) OR
                (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
            )
        )
    )
);

-- Ensure service role write-only policy is named consistently
DROP POLICY IF EXISTS p_service_role_all_opportunities ON public.research_opportunities;
DROP POLICY IF EXISTS rls_research_opportunities_write ON public.research_opportunities;

CREATE POLICY rls_research_opportunities_write 
ON public.research_opportunities 
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- 2. Automatic Staleness Propagation Trigger Function
CREATE OR REPLACE FUNCTION public.trg_fn_propagate_validation_to_opportunities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- When a new validation run is recorded, any existing active opportunities
    -- for that gap whose validation_run_id differs are superseded.
    UPDATE public.research_opportunities
    SET is_stale = true,
        staleness_reason = 'SUPERSEDED_BY_NEW_VALIDATION_RUN',
        updated_at = timezone('utc'::text, now())
    WHERE gap_id = NEW.gap_id
      AND validation_run_id <> NEW.validation_run_id
      AND is_stale = false
      AND status <> 'REJECTED';

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validation_run_supersedes_opportunities ON public.research_gap_validations;
CREATE TRIGGER trg_validation_run_supersedes_opportunities
AFTER INSERT ON public.research_gap_validations
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_propagate_validation_to_opportunities();


-- 3. Automatic Staleness Propagation on Gap Mutation
CREATE OR REPLACE FUNCTION public.trg_fn_propagate_gap_mutation_to_opportunities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If validation outcome changed, invalidate active opportunities
    IF NEW.current_validation_outcome IS DISTINCT FROM OLD.current_validation_outcome THEN
        UPDATE public.research_opportunities
        SET is_stale = true,
            staleness_reason = 'UPSTREAM_GAP_VALIDATION_OUTCOME_MUTATED',
            updated_at = timezone('utc'::text, now())
        WHERE gap_id = NEW.id
          AND is_stale = false
          AND status <> 'REJECTED';
    ELSIF NEW.is_archived = true AND OLD.is_archived = false THEN
        UPDATE public.research_opportunities
        SET is_stale = true,
            staleness_reason = 'UPSTREAM_GAP_ARCHIVED',
            updated_at = timezone('utc'::text, now())
        WHERE gap_id = NEW.id
          AND is_stale = false
          AND status <> 'REJECTED';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gap_mutation_invalidates_opportunities ON public.research_gaps;
CREATE TRIGGER trg_gap_mutation_invalidates_opportunities
AFTER UPDATE OF current_validation_outcome, is_archived ON public.research_gaps
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_propagate_gap_mutation_to_opportunities();


-- 4. Harden Privileged RPCs with Service-Role Guard & ACL Restrictions
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
    -- Strict ACL Guard: service_role only
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: rpc_persist_research_opportunity requires service_role'
            USING ERRCODE = '42501';
    END IF;

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
        is_stale,
        created_by
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
        p_residual_scope,
        p_weighting_regime,
        p_scoring_metadata,
        p_structured_explanation,
        p_evidence_provenance,
        false,
        p_created_by
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
        is_stale = false,
        staleness_reason = NULL,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_opp_id;

    RETURN v_opp_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_propagate_gap_staleness(
    p_gap_id UUID,
    p_validation_run_id TEXT DEFAULT NULL,
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
    -- Strict ACL Guard: service_role only
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Access denied: rpc_propagate_gap_staleness requires service_role'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.research_opportunities
    SET is_stale = true,
        staleness_reason = p_reason,
        updated_at = timezone('utc'::text, now())
    WHERE gap_id = p_gap_id
      AND (p_validation_run_id IS NULL OR validation_run_id = p_validation_run_id)
      AND is_stale = false
      AND status <> 'REJECTED';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.rpc_persist_research_opportunity FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_propagate_gap_staleness FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_persist_research_opportunity TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_propagate_gap_staleness TO service_role;
