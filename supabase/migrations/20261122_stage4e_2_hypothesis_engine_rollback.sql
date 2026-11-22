-- ====================================================================
-- Anvīkṣā — Stage 4E Rollback Migration: Falsifiable Hypothesis Engine
-- Work Package: 4E-IMP-02
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: REVERSIBLE ROLLBACK SCRIPT ONLY
-- ====================================================================

-- 1. Drop Privileged RPCs
DROP FUNCTION IF EXISTS public.rpc_revise_research_hypothesis(UUID, JSONB, TEXT, UUID);
DROP FUNCTION IF EXISTS public.rpc_persist_research_hypothesis(
    UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, JSONB, BOOLEAN, TEXT, TEXT, JSONB, TEXT, TEXT, NUMERIC, TEXT, JSONB, JSONB, UUID
);

-- 2. Drop Triggers & Trigger Functions
DROP TRIGGER IF EXISTS trg_opportunity_staleness_to_hypotheses ON public.research_opportunities;
DROP FUNCTION IF EXISTS public.trg_fn_propagate_opportunity_to_hypotheses();

DROP TRIGGER IF EXISTS trg_hypothesis_version_immutable ON public.research_hypothesis_versions;
DROP FUNCTION IF EXISTS public.trg_fn_enforce_hypothesis_version_immutability();

-- 3. Drop Tables & Policies
DROP TABLE IF EXISTS public.research_hypothesis_versions CASCADE;
DROP TABLE IF EXISTS public.research_hypotheses CASCADE;
