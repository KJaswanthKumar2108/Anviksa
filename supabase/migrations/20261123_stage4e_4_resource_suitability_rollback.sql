-- ====================================================================
-- Anvīkṣā — Stage 4E Rollback Migration: Resource Suitability & Recommendations
-- Work Package: 4E-IMP-04
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- ====================================================================

DROP TRIGGER IF EXISTS trg_cascade_experiment_to_recommendations ON public.research_experiments;
DROP FUNCTION IF EXISTS public.fn_cascade_experiment_staleness_to_recommendations();

DROP FUNCTION IF EXISTS public.rpc_persist_strategic_recommendation(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.rpc_upsert_researcher_resource(UUID, UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, TEXT, BOOLEAN, TEXT);

DROP TABLE IF EXISTS public.researcher_reviews CASCADE;
DROP TABLE IF EXISTS public.research_strategic_recommendations CASCADE;
DROP TABLE IF EXISTS public.researcher_resources CASCADE;
DROP TABLE IF EXISTS public.researcher_resource_profiles CASCADE;
