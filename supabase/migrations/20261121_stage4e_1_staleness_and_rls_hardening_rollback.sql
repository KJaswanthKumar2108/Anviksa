-- Rollback Migration for 20261121_stage4e_1_staleness_and_rls_hardening.sql

DROP TRIGGER IF EXISTS trg_validation_run_supersedes_opportunities ON public.research_gap_validations;
DROP FUNCTION IF EXISTS public.trg_fn_propagate_validation_to_opportunities();

DROP TRIGGER IF EXISTS trg_gap_mutation_invalidates_opportunities ON public.research_gaps;
DROP FUNCTION IF EXISTS public.trg_fn_propagate_gap_mutation_to_opportunities();

DROP POLICY IF EXISTS rls_research_opportunities_select ON public.research_opportunities;
CREATE POLICY p_select_active_opportunities 
    ON public.research_opportunities 
    FOR SELECT 
    USING (status <> 'REJECTED');

DROP POLICY IF EXISTS rls_research_opportunities_write ON public.research_opportunities;
CREATE POLICY p_service_role_all_opportunities 
    ON public.research_opportunities 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
