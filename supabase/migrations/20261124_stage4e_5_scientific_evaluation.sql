-- ====================================================================
-- Anvīkṣā — Stage 4E Additive Migration: Scientific Evaluation & Human Review
-- Work Package: 4E-IMP-05
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Enhance public.researcher_reviews with multi-criterion, roles, and invalidation fields
ALTER TABLE public.researcher_reviews
    ADD COLUMN IF NOT EXISTS criterion_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS reviewer_role TEXT NOT NULL DEFAULT 'INDEPENDENT_PEER',
    ADD COLUMN IF NOT EXISTS is_self_review BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS adjudication_notes TEXT,
    ADD COLUMN IF NOT EXISTS is_invalidated BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS invalidation_reason TEXT,
    ADD COLUMN IF NOT EXISTS entity_version INTEGER NOT NULL DEFAULT 1;

-- Add check constraints if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_review_role'
    ) THEN
        ALTER TABLE public.researcher_reviews
            ADD CONSTRAINT chk_review_role CHECK (reviewer_role IN ('AUTHOR', 'INDEPENDENT_PEER', 'SENIOR_ARBITRATOR'));
    END IF;
END $$;

-- 2. Create table public.research_evaluations (immutable automated & benchmark evaluation runs)
CREATE TABLE IF NOT EXISTS public.research_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('OPPORTUNITY', 'HYPOTHESIS', 'EXPERIMENT', 'SUITABILITY', 'BENCHMARK_BATCH')),
    entity_id UUID,
    evaluation_mode TEXT NOT NULL CHECK (evaluation_mode IN ('AUTOMATED_RUBRIC', 'MULTI_RATER_PILOT', 'BENCHMARK_RUN', 'STATISTICAL_VALIDATION')),
    overall_score NUMERIC(5,2),
    passed_gates BOOLEAN NOT NULL DEFAULT false,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    criterion_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    statistical_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_stale BOOLEAN NOT NULL DEFAULT false,
    staleness_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create table public.research_reviewer_allocations (BIBD rater assignments)
CREATE TABLE IF NOT EXISTS public.research_reviewer_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id TEXT NOT NULL,
    artifact_type TEXT NOT NULL CHECK (artifact_type IN ('HYPOTHESIS', 'EXPERIMENT', 'OPPORTUNITY')),
    artifact_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    block_index INTEGER NOT NULL,
    domain_specialty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXCUSED_COI', 'REPLACED')),
    coi_declared BOOLEAN NOT NULL DEFAULT false,
    coi_details TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_eval_entity ON public.research_evaluations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_eval_mode ON public.research_evaluations(evaluation_mode);
CREATE INDEX IF NOT EXISTS idx_alloc_study ON public.research_reviewer_allocations(study_id, artifact_id);
CREATE INDEX IF NOT EXISTS idx_alloc_reviewer ON public.research_reviewer_allocations(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_invalidation ON public.researcher_reviews(entity_id, is_invalidated);

-- 5. Enable RLS
ALTER TABLE public.research_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reviewer_allocations ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies
-- Allow read for authenticated users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_evaluations_select' AND tablename = 'research_evaluations') THEN
        CREATE POLICY rls_evaluations_select ON public.research_evaluations
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_allocations_select' AND tablename = 'research_reviewer_allocations') THEN
        CREATE POLICY rls_allocations_select ON public.research_reviewer_allocations
            FOR SELECT TO authenticated USING (true);
    END IF;

    -- Block direct client writes (all writes must pass through service role or secure RPCs)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_evaluations_block_client_insert' AND tablename = 'research_evaluations') THEN
        CREATE POLICY rls_evaluations_block_client_insert ON public.research_evaluations
            FOR INSERT TO authenticated WITH CHECK (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_evaluations_block_client_update' AND tablename = 'research_evaluations') THEN
        CREATE POLICY rls_evaluations_block_client_update ON public.research_evaluations
            FOR UPDATE TO authenticated USING (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_evaluations_block_client_delete' AND tablename = 'research_evaluations') THEN
        CREATE POLICY rls_evaluations_block_client_delete ON public.research_evaluations
            FOR DELETE TO authenticated USING (false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_allocations_block_client_insert' AND tablename = 'research_reviewer_allocations') THEN
        CREATE POLICY rls_allocations_block_client_insert ON public.research_reviewer_allocations
            FOR INSERT TO authenticated WITH CHECK (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_allocations_block_client_update' AND tablename = 'research_reviewer_allocations') THEN
        CREATE POLICY rls_allocations_block_client_update ON public.research_reviewer_allocations
            FOR UPDATE TO authenticated USING (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_allocations_block_client_delete' AND tablename = 'research_reviewer_allocations') THEN
        CREATE POLICY rls_allocations_block_client_delete ON public.research_reviewer_allocations
            FOR DELETE TO authenticated USING (false);
    END IF;

    -- Also block direct client writes on researcher_reviews if not already blocked
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_reviews_block_client_insert' AND tablename = 'researcher_reviews') THEN
        CREATE POLICY rls_reviews_block_client_insert ON public.researcher_reviews
            FOR INSERT TO authenticated WITH CHECK (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_reviews_block_client_update' AND tablename = 'researcher_reviews') THEN
        CREATE POLICY rls_reviews_block_client_update ON public.researcher_reviews
            FOR UPDATE TO authenticated USING (false);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_reviews_block_client_delete' AND tablename = 'researcher_reviews') THEN
        CREATE POLICY rls_reviews_block_client_delete ON public.researcher_reviews
            FOR DELETE TO authenticated USING (false);
    END IF;
END $$;

-- 7. Privileged RPC: Submit Researcher Review (Service Role & Authenticated)
CREATE OR REPLACE FUNCTION public.rpc_submit_researcher_review(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_reviewer_id UUID,
    p_decision TEXT,
    p_review_comments TEXT,
    p_parameter_modifications JSONB DEFAULT '{}'::jsonb,
    p_criterion_scores JSONB DEFAULT '{}'::jsonb,
    p_reviewer_role TEXT DEFAULT 'INDEPENDENT_PEER',
    p_adjudication_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_review_id UUID;
    v_creator_id UUID := NULL;
    v_is_self_review BOOLEAN := false;
    v_effective_role TEXT := p_reviewer_role;
    v_current_status TEXT := NULL;
    v_entity_version INTEGER := 1;
BEGIN
    -- Validate parameters
    IF p_entity_id IS NULL OR p_entity_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
        RAISE EXCEPTION 'Invalid entity_id' USING ERRCODE = '22023';
    END IF;

    IF p_decision NOT IN ('APPROVED', 'REJECTED', 'MODIFIED_AND_APPROVED', 'REVISION_REQUESTED') THEN
        RAISE EXCEPTION 'Invalid review decision: %', p_decision USING ERRCODE = '22023';
    END IF;

    -- Determine creator and entity version based on entity type
    IF p_entity_type = 'HYPOTHESIS' THEN
        SELECT created_by, status INTO v_creator_id, v_current_status
        FROM public.research_hypotheses WHERE id = p_entity_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Hypothesis not found: %', p_entity_id USING ERRCODE = 'P0002';
        END IF;
        SELECT COALESCE(MAX(version_number), 1) INTO v_entity_version
        FROM public.research_hypothesis_versions WHERE hypothesis_id = p_entity_id;
    ELSIF p_entity_type = 'EXPERIMENT' THEN
        SELECT created_by, status INTO v_creator_id, v_current_status
        FROM public.research_experiments WHERE id = p_entity_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Experiment protocol not found: %', p_entity_id USING ERRCODE = 'P0002';
        END IF;
        SELECT COALESCE(MAX(version_number), 1) INTO v_entity_version
        FROM public.research_experiment_versions WHERE experiment_id = p_entity_id;
    ELSIF p_entity_type = 'OPPORTUNITY' THEN
        SELECT status INTO v_current_status
        FROM public.research_opportunities WHERE id = p_entity_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Research opportunity not found: %', p_entity_id USING ERRCODE = 'P0002';
        END IF;
    ELSE
        RAISE EXCEPTION 'Unsupported entity type: %', p_entity_type USING ERRCODE = '22023';
    END IF;

    -- Detect self-review: if reviewer is creator, enforce author self-review semantics
    IF v_creator_id IS NOT NULL AND v_creator_id = p_reviewer_id THEN
        v_is_self_review := true;
        v_effective_role := 'AUTHOR';
    END IF;

    -- Insert into researcher_reviews
    INSERT INTO public.researcher_reviews (
        entity_type,
        entity_id,
        reviewer_id,
        decision,
        review_comments,
        parameter_modifications,
        criterion_scores,
        reviewer_role,
        is_self_review,
        adjudication_notes,
        is_invalidated,
        invalidation_reason,
        entity_version,
        reviewed_at
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_reviewer_id,
        p_decision,
        p_review_comments,
        COALESCE(p_parameter_modifications, '{}'::jsonb),
        COALESCE(p_criterion_scores, '{}'::jsonb),
        v_effective_role,
        v_is_self_review,
        p_adjudication_notes,
        false,
        NULL,
        v_entity_version,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_review_id;

    -- Update parent entity lifecycle status ONLY if independent review or senior arbitrator
    -- (Self-reviews cannot masquerade as independent peer validation to advance status to RESEARCHER_APPROVED)
    IF NOT v_is_self_review THEN
        IF p_decision IN ('APPROVED', 'MODIFIED_AND_APPROVED') THEN
            IF p_entity_type = 'HYPOTHESIS' THEN
                UPDATE public.research_hypotheses
                SET status = 'RESEARCHER_APPROVED', updated_at = timezone('utc'::text, now())
                WHERE id = p_entity_id;
            ELSIF p_entity_type = 'EXPERIMENT' THEN
                UPDATE public.research_experiments
                SET status = 'RESEARCHER_APPROVED'
                WHERE id = p_entity_id;
            END IF;
        ELSIF p_decision = 'REJECTED' THEN
            IF p_entity_type = 'HYPOTHESIS' THEN
                UPDATE public.research_hypotheses
                SET status = 'REJECTED', updated_at = timezone('utc'::text, now())
                WHERE id = p_entity_id;
            ELSIF p_entity_type = 'EXPERIMENT' THEN
                UPDATE public.research_experiments
                SET status = 'REJECTED'
                WHERE id = p_entity_id;
            END IF;
        ELSIF p_decision = 'REVISION_REQUESTED' THEN
            IF p_entity_type = 'HYPOTHESIS' THEN
                UPDATE public.research_hypotheses
                SET status = 'REQUIRES_REFINEMENT', updated_at = timezone('utc'::text, now())
                WHERE id = p_entity_id;
            ELSIF p_entity_type = 'EXPERIMENT' THEN
                UPDATE public.research_experiments
                SET status = 'REQUIRES_REFINEMENT'
                WHERE id = p_entity_id;
            END IF;
        END IF;
    END IF;

    RETURN v_review_id;
END;
$$;

-- 8. Privileged RPC: Record Scientific Evaluation Run
CREATE OR REPLACE FUNCTION public.rpc_record_research_evaluation(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_evaluation_mode TEXT,
    p_overall_score NUMERIC,
    p_passed_gates BOOLEAN,
    p_metrics JSONB,
    p_criterion_scores JSONB,
    p_statistical_evidence JSONB,
    p_evaluated_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_eval_id UUID;
BEGIN
    INSERT INTO public.research_evaluations (
        entity_type,
        entity_id,
        evaluation_mode,
        overall_score,
        passed_gates,
        metrics,
        criterion_scores,
        statistical_evidence,
        evaluated_by,
        is_stale,
        staleness_reason,
        created_at
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_evaluation_mode,
        p_overall_score,
        p_passed_gates,
        COALESCE(p_metrics, '{}'::jsonb),
        COALESCE(p_criterion_scores, '{}'::jsonb),
        COALESCE(p_statistical_evidence, '{}'::jsonb),
        p_evaluated_by,
        false,
        NULL,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_eval_id;

    RETURN v_eval_id;
END;
$$;

-- 9. Privileged RPC: Invalidate Entity Reviews upon Revision / Staleness
CREATE OR REPLACE FUNCTION public.rpc_invalidate_entity_reviews(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_reason TEXT DEFAULT 'PARENT_ENTITY_REVISED'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.researcher_reviews
    SET is_invalidated = true,
        invalidation_reason = p_reason
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND is_invalidated = false;
      
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- If entity had RESEARCHER_APPROVED status, reset to VERIFIED_FOR_REVIEW
    IF p_entity_type = 'HYPOTHESIS' THEN
        UPDATE public.research_hypotheses
        SET status = 'VERIFIED_FOR_REVIEW', updated_at = timezone('utc'::text, now())
        WHERE id = p_entity_id AND status = 'RESEARCHER_APPROVED';
    ELSIF p_entity_type = 'EXPERIMENT' THEN
        UPDATE public.research_experiments
        SET status = 'VERIFIED_FOR_REVIEW'
        WHERE id = p_entity_id AND status = 'RESEARCHER_APPROVED';
    END IF;

    RETURN v_count;
END;
$$;

-- 10. Invalidation Triggers on Parent Artifact Revision & Staleness
CREATE OR REPLACE FUNCTION public.fn_cascade_hypothesis_invalidation_to_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (
        (NEW.is_stale = true AND OLD.is_stale IS DISTINCT FROM true) OR
        (NEW.hypothesis_statement IS DISTINCT FROM OLD.hypothesis_statement)
    )) THEN
        UPDATE public.researcher_reviews
        SET is_invalidated = true,
            invalidation_reason = CASE 
                WHEN NEW.is_stale = true THEN 'UPSTREAM_EVIDENCE_STALE'
                ELSE 'HYPOTHESIS_STATEMENT_REVISED'
            END
        WHERE entity_type = 'HYPOTHESIS' AND entity_id = NEW.id AND is_invalidated = false;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_hypothesis_to_reviews ON public.research_hypotheses;
CREATE TRIGGER trg_cascade_hypothesis_to_reviews
    AFTER UPDATE ON public.research_hypotheses
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_cascade_hypothesis_invalidation_to_reviews();

CREATE OR REPLACE FUNCTION public.fn_cascade_experiment_invalidation_to_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (
        (NEW.is_stale = true AND OLD.is_stale IS DISTINCT FROM true) OR
        (NEW.objective IS DISTINCT FROM OLD.objective)
    )) THEN
        UPDATE public.researcher_reviews
        SET is_invalidated = true,
            invalidation_reason = CASE 
                WHEN NEW.is_stale = true THEN 'UPSTREAM_PROTOCOL_STALE'
                ELSE 'EXPERIMENT_OBJECTIVE_REVISED'
            END
        WHERE entity_type = 'EXPERIMENT' AND entity_id = NEW.id AND is_invalidated = false;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_experiment_to_reviews ON public.research_experiments;
CREATE TRIGGER trg_cascade_experiment_to_reviews
    AFTER UPDATE ON public.research_experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_cascade_experiment_invalidation_to_reviews();

-- Revoke execute from public/anon on privileged RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_submit_researcher_review FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_record_research_evaluation FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_invalidate_entity_reviews FROM public, anon;

GRANT EXECUTE ON FUNCTION public.rpc_submit_researcher_review TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_record_research_evaluation TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_invalidate_entity_reviews TO authenticated, service_role;
