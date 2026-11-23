-- ====================================================================
-- Anvīkṣā — Stage 4E Rollback: Scientific Evaluation & Human Review
-- Work Package: 4E-IMP-05 Rollback
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- ====================================================================

DROP TRIGGER IF EXISTS trg_cascade_experiment_to_reviews ON public.research_experiments;
DROP TRIGGER IF EXISTS trg_cascade_hypothesis_to_reviews ON public.research_hypotheses;
DROP FUNCTION IF EXISTS public.fn_cascade_experiment_invalidation_to_reviews();
DROP FUNCTION IF EXISTS public.fn_cascade_hypothesis_invalidation_to_reviews();

DROP FUNCTION IF EXISTS public.rpc_invalidate_entity_reviews(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.rpc_record_research_evaluation(TEXT, UUID, TEXT, NUMERIC, BOOLEAN, JSONB, JSONB, JSONB, UUID);
DROP FUNCTION IF EXISTS public.rpc_submit_researcher_review(TEXT, UUID, UUID, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT);

DROP TABLE IF EXISTS public.research_reviewer_allocations;
DROP TABLE IF EXISTS public.research_evaluations;

ALTER TABLE public.researcher_reviews
    DROP CONSTRAINT IF EXISTS chk_review_role,
    DROP COLUMN IF EXISTS criterion_scores,
    DROP COLUMN IF EXISTS reviewer_role,
    DROP COLUMN IF EXISTS is_self_review,
    DROP COLUMN IF EXISTS adjudication_notes,
    DROP COLUMN IF EXISTS is_invalidated,
    DROP COLUMN IF EXISTS invalidation_reason,
    DROP COLUMN IF EXISTS entity_version;
