-- ====================================================================
-- Anvīkṣā — Stage 4A Rollback Script
-- Target: 20261118_stage4a_literature_knowledge_graph.sql
-- ====================================================================

-- 1. DROP RPC
DROP FUNCTION IF EXISTS public.insert_server_verified_gap;

-- 2. DROP TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS trg_protect_research_gaps_provenance ON public.research_gaps;
DROP FUNCTION IF EXISTS public.protect_research_gaps_provenance();

DROP TRIGGER IF EXISTS trg_protect_gap_audit_log_immutability ON public.research_gap_audit_log;
DROP FUNCTION IF EXISTS public.protect_research_gap_audit_log_immutability();

-- 3. DROP NEW TABLES
DROP TABLE IF EXISTS public.research_gap_audit_log CASCADE;
DROP TABLE IF EXISTS public.research_gap_validations CASCADE;
DROP TABLE IF EXISTS public.research_gap_evidence CASCADE;
DROP TABLE IF EXISTS public.research_gaps CASCADE;

-- 4. REMOVE ADDED RELATIONSHIP CONSTRAINTS & INDEXES
DROP INDEX IF EXISTS public.idx_unique_research_relationship;
ALTER TABLE public.research_relationships DROP CONSTRAINT IF EXISTS chk_no_self_relationship;

-- 5. DROP CREATED ENUMS
DROP TYPE IF EXISTS public.gap_visibility;
DROP TYPE IF EXISTS public.validation_outcome;
DROP TYPE IF EXISTS public.epistemic_classification;
DROP TYPE IF EXISTS public.research_gap_category;
