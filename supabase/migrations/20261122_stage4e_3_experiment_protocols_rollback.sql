-- ====================================================================
-- Anvīkṣā — Stage 4E Rollback Migration: Experiment Protocol Synthesizer
-- Work Package: 4E-IMP-03
-- ====================================================================

-- 1. Revoke and drop RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_revise_research_experiment FROM service_role;
DROP FUNCTION IF EXISTS public.rpc_revise_research_experiment(UUID, JSONB, TEXT, UUID);

REVOKE EXECUTE ON FUNCTION public.rpc_persist_research_experiment FROM service_role;
DROP FUNCTION IF EXISTS public.rpc_persist_research_experiment(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT, JSONB, JSONB, UUID);

-- 2. Drop triggers and trigger functions
DROP TRIGGER IF EXISTS trg_opportunity_staleness_to_experiments ON public.research_opportunities;
DROP FUNCTION IF EXISTS public.trg_fn_propagate_opportunity_to_experiments();

DROP TRIGGER IF EXISTS trg_hypothesis_staleness_to_experiments ON public.research_hypotheses;
DROP FUNCTION IF EXISTS public.trg_fn_propagate_hypothesis_to_experiments();

DROP TRIGGER IF EXISTS trg_experiment_version_immutable ON public.research_experiment_versions;
DROP FUNCTION IF EXISTS public.trg_fn_enforce_experiment_version_immutability();

-- 3. Drop tables in dependency order
DROP TABLE IF EXISTS public.research_experiment_versions CASCADE;
DROP TABLE IF EXISTS public.research_experiment_metrics CASCADE;
DROP TABLE IF EXISTS public.research_experiments CASCADE;
