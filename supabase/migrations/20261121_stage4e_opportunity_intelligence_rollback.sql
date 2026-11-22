-- ====================================================================
-- Anvīkṣā — Stage 4E Rollback Migration: Research Opportunity Intelligence
-- Work Package: 4E-IMP-01
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: Reversible teardown of 4E-IMP-01 schema objects
-- ====================================================================

DROP FUNCTION IF EXISTS public.rpc_propagate_gap_staleness(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_persist_research_opportunity(UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT, JSONB, JSONB, JSONB, UUID);

DROP TABLE IF EXISTS public.research_opportunities CASCADE;
