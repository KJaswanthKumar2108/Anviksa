-- ====================================================================
-- Anvīkṣā — Stage 4E Additive Migration: Falsifiable Hypothesis Engine
-- Work Package: 4E-IMP-02
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Create table public.research_hypotheses
CREATE TABLE IF NOT EXISTS public.research_hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.research_opportunities(id) ON DELETE RESTRICT,
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE RESTRICT,
    validation_run_id TEXT NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    
    -- Core Scientific & Linguistic Formulation
    research_question TEXT NOT NULL,
    hypothesis_statement TEXT NOT NULL,
    scientific_rationale TEXT NOT NULL,
    paradigm_type TEXT NOT NULL CHECK (paradigm_type IN (
        'EMPIRICAL_QUANTITATIVE',
        'COMPARATIVE_BENCHMARK',
        'THEORETICAL_FORMAL',
        'COMPUTATIONAL_COMPLEXITY',
        'QUALITATIVE_SYSTEMS',
        'ABLATION_MECHANISTIC'
    )),
    
    -- Grounding Evidence & Known Counter-Evidence References
    grounding_evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    known_counter_evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    underlying_assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    boundary_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Operationalized Variables
    independent_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    dependent_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    control_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Statistical & Formal Falsification
    statistical_formalism_applicable BOOLEAN NOT NULL DEFAULT true,
    null_hypothesis TEXT,
    alternative_hypothesis TEXT,
    falsification_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    critical_failure_threshold TEXT NOT NULL,
    scope_and_limitations TEXT NOT NULL,
    
    -- Rubric Evaluation & Lifecycle
    falsifiability_rubric_score NUMERIC(4,2) NOT NULL CHECK (
        falsifiability_rubric_score >= 0.00 AND falsifiability_rubric_score <= 10.00
    ),
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN (
        'GENERATED',
        'EVIDENCE_VERIFICATION_PENDING',
        'VERIFIED_FOR_REVIEW',
        'REQUIRES_REFINEMENT',
        'REJECTED',
        'RESEARCHER_APPROVED',
        'SUPERSEDED',
        'STALE'
    )),
    
    -- Invalidation & Staleness Tracking
    is_stale BOOLEAN NOT NULL DEFAULT false,
    staleness_reason TEXT,
    
    -- Provenance, Audit & Timestamps
    generation_provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    logical_audit_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Composite Foreign Key to public.research_gap_validations:
    -- Guarantees validation_run_id strictly belongs to the gap_id.
    CONSTRAINT fk_hyp_validation_run
        FOREIGN KEY (gap_id, validation_run_id)
        REFERENCES public.research_gap_validations(gap_id, validation_run_id)
        ON DELETE RESTRICT,
        
    -- Explicit Prohibition of Nil UUID Sentinels
    CONSTRAINT chk_hyp_opportunity_not_nil
        CHECK (opportunity_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_hyp_gap_not_nil
        CHECK (gap_id <> '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 2. Create table public.research_hypothesis_versions (Immutable Audit History)
CREATE TABLE IF NOT EXISTS public.research_hypothesis_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id UUID NOT NULL REFERENCES public.research_hypotheses(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    hypothesis_payload JSONB NOT NULL,
    logical_audit_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    modification_rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_hypothesis_version UNIQUE (hypothesis_id, version_number)
);

-- 3. Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_hyp_opportunity ON public.research_hypotheses(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_hyp_gap_run ON public.research_hypotheses(gap_id, validation_run_id);
CREATE INDEX IF NOT EXISTS idx_hyp_status_score ON public.research_hypotheses(status, falsifiability_rubric_score DESC);
CREATE INDEX IF NOT EXISTS idx_hyp_versions_lookup ON public.research_hypothesis_versions(hypothesis_id, version_number DESC);

-- 4. Enable Row-Level Security
ALTER TABLE public.research_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_hypothesis_versions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Inherited Parent-Gap Visibility
-- Public/anonymous can only read hypotheses if the parent research gap is public and published
CREATE POLICY rls_research_hypotheses_select
ON public.research_hypotheses
FOR SELECT TO public
USING (
    status <> 'REJECTED' AND (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.research_gaps g
            WHERE g.id = research_hypotheses.gap_id
            AND (
                (g.visibility IN ('public', 'community') AND g.is_published = true) OR
                (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
            )
        )
    )
);

CREATE POLICY rls_research_hypotheses_write
ON public.research_hypotheses
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY rls_hypothesis_versions_select
ON public.research_hypothesis_versions
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_hypotheses h
        JOIN public.research_gaps g ON g.id = h.gap_id
        WHERE h.id = research_hypothesis_versions.hypothesis_id
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

CREATE POLICY rls_hypothesis_versions_write
ON public.research_hypothesis_versions
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 6. Trigger: Immutability Enforcement on Hypothesis Versions
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_hypothesis_version_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'research_hypothesis_versions records are strictly immutable. Updates and deletes are prohibited.'
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE OR REPLACE TRIGGER trg_hypothesis_version_immutable
BEFORE UPDATE OR DELETE ON public.research_hypothesis_versions
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_enforce_hypothesis_version_immutability();

-- 7. Trigger: Automatic Staleness Propagation from Opportunities to Hypotheses
CREATE OR REPLACE FUNCTION public.trg_fn_propagate_opportunity_to_hypotheses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_stale = true AND (OLD.is_stale IS NULL OR OLD.is_stale = false) THEN
        UPDATE public.research_hypotheses
        SET is_stale = true,
            staleness_reason = 'UPSTREAM_OPPORTUNITY_STALE',
            updated_at = timezone('utc'::text, now())
        WHERE opportunity_id = NEW.id
          AND is_stale = false
          AND status NOT IN ('REJECTED', 'SUPERSEDED');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_opportunity_staleness_to_hypotheses
AFTER UPDATE OF is_stale ON public.research_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_propagate_opportunity_to_hypotheses();

-- 8. Privileged RPC: rpc_persist_research_hypothesis
-- Persists a server-verified scientific hypothesis and creates version 1 in an atomic transaction
CREATE OR REPLACE FUNCTION public.rpc_persist_research_hypothesis(
    p_opportunity_id UUID,
    p_gap_id UUID,
    p_validation_run_id TEXT,
    p_research_question TEXT,
    p_hypothesis_statement TEXT,
    p_scientific_rationale TEXT,
    p_paradigm_type TEXT,
    p_grounding_evidence JSONB DEFAULT '[]'::jsonb,
    p_counter_evidence JSONB DEFAULT '[]'::jsonb,
    p_assumptions JSONB DEFAULT '[]'::jsonb,
    p_boundary_conditions JSONB DEFAULT '[]'::jsonb,
    p_independent_vars JSONB DEFAULT '[]'::jsonb,
    p_dependent_vars JSONB DEFAULT '[]'::jsonb,
    p_control_vars JSONB DEFAULT '[]'::jsonb,
    p_statistical_applicable BOOLEAN DEFAULT true,
    p_null_hyp TEXT DEFAULT NULL,
    p_alt_hyp TEXT DEFAULT NULL,
    p_falsification_conditions JSONB DEFAULT '[]'::jsonb,
    p_critical_failure_threshold TEXT DEFAULT '',
    p_scope_limitations TEXT DEFAULT '',
    p_rubric_score NUMERIC DEFAULT 0.00,
    p_status TEXT DEFAULT 'GENERATED',
    p_generation_provenance JSONB DEFAULT '{}'::jsonb,
    p_logical_audit_findings JSONB DEFAULT '[]'::jsonb,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_opp_is_stale BOOLEAN;
    v_opp_status TEXT;
    v_hypothesis_id UUID;
    v_initial_payload JSONB;
BEGIN
    -- Verify opportunity is eligible and non-stale
    SELECT is_stale, status INTO v_opp_is_stale, v_opp_status
    FROM public.research_opportunities
    WHERE id = p_opportunity_id AND gap_id = p_gap_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target research opportunity % not found for gap %', p_opportunity_id, p_gap_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_opp_is_stale THEN
        RAISE EXCEPTION 'Cannot generate hypothesis from stale research opportunity %', p_opportunity_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_opp_status IN ('REJECTED', 'INELIGIBLE') THEN
        RAISE EXCEPTION 'Cannot generate hypothesis from disqualified opportunity with status %', v_opp_status
            USING ERRCODE = 'check_violation';
    END IF;

    -- Insert hypothesis record
    INSERT INTO public.research_hypotheses (
        opportunity_id,
        gap_id,
        validation_run_id,
        current_version,
        research_question,
        hypothesis_statement,
        scientific_rationale,
        paradigm_type,
        grounding_evidence_references,
        known_counter_evidence_references,
        underlying_assumptions,
        boundary_conditions,
        independent_variables,
        dependent_variables,
        control_variables,
        statistical_formalism_applicable,
        null_hypothesis,
        alternative_hypothesis,
        falsification_conditions,
        critical_failure_threshold,
        scope_and_limitations,
        falsifiability_rubric_score,
        status,
        generation_provenance,
        logical_audit_findings,
        created_by,
        updated_at
    ) VALUES (
        p_opportunity_id,
        p_gap_id,
        p_validation_run_id,
        1,
        p_research_question,
        p_hypothesis_statement,
        p_scientific_rationale,
        p_paradigm_type,
        p_grounding_evidence,
        p_counter_evidence,
        p_assumptions,
        p_boundary_conditions,
        p_independent_vars,
        p_dependent_vars,
        p_control_vars,
        p_statistical_applicable,
        p_null_hyp,
        p_alt_hyp,
        p_falsification_conditions,
        p_critical_failure_threshold,
        p_scope_limitations,
        p_rubric_score,
        p_status,
        p_generation_provenance,
        p_logical_audit_findings,
        p_created_by,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_hypothesis_id;

    -- Construct version 1 snapshot
    v_initial_payload := jsonb_build_object(
        'research_question', p_research_question,
        'hypothesis_statement', p_hypothesis_statement,
        'scientific_rationale', p_scientific_rationale,
        'paradigm_type', p_paradigm_type,
        'grounding_evidence_references', p_grounding_evidence,
        'known_counter_evidence_references', p_counter_evidence,
        'underlying_assumptions', p_assumptions,
        'boundary_conditions', p_boundary_conditions,
        'independent_variables', p_independent_vars,
        'dependent_variables', p_dependent_vars,
        'control_variables', p_control_vars,
        'null_hypothesis', p_null_hyp,
        'alternative_hypothesis', p_alt_hyp,
        'falsification_conditions', p_falsification_conditions,
        'critical_failure_threshold', p_critical_failure_threshold,
        'scope_and_limitations', p_scope_limitations,
        'falsifiability_rubric_score', p_rubric_score
    );

    -- Insert version 1 audit snapshot
    INSERT INTO public.research_hypothesis_versions (
        hypothesis_id,
        version_number,
        hypothesis_payload,
        logical_audit_findings,
        modified_by,
        modification_rationale,
        created_at
    ) VALUES (
        v_hypothesis_id,
        1,
        v_initial_payload,
        p_logical_audit_findings,
        p_created_by,
        'Initial candidate hypothesis generation',
        timezone('utc'::text, now())
    );

    RETURN v_hypothesis_id;
END;
$$;

-- 9. Privileged RPC: rpc_revise_research_hypothesis
CREATE OR REPLACE FUNCTION public.rpc_revise_research_hypothesis(
    p_hypothesis_id UUID,
    p_revision_payload JSONB,
    p_modification_rationale TEXT,
    p_modified_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_curr_ver INTEGER;
    v_new_ver INTEGER;
    v_logical_findings JSONB;
BEGIN
    SELECT current_version, logical_audit_findings
    INTO v_curr_ver, v_logical_findings
    FROM public.research_hypotheses
    WHERE id = p_hypothesis_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hypothesis % not found for revision', p_hypothesis_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    v_new_ver := v_curr_ver + 1;

    -- Update mutable active fields on research_hypotheses
    UPDATE public.research_hypotheses
    SET current_version = v_new_ver,
        research_question = COALESCE(p_revision_payload->>'research_question', research_question),
        hypothesis_statement = COALESCE(p_revision_payload->>'hypothesis_statement', hypothesis_statement),
        scientific_rationale = COALESCE(p_revision_payload->>'scientific_rationale', scientific_rationale),
        boundary_conditions = COALESCE(p_revision_payload->'boundary_conditions', boundary_conditions),
        underlying_assumptions = COALESCE(p_revision_payload->'underlying_assumptions', underlying_assumptions),
        independent_variables = COALESCE(p_revision_payload->'independent_variables', independent_variables),
        dependent_variables = COALESCE(p_revision_payload->'dependent_variables', dependent_variables),
        control_variables = COALESCE(p_revision_payload->'control_variables', control_variables),
        null_hypothesis = COALESCE(p_revision_payload->>'null_hypothesis', null_hypothesis),
        alternative_hypothesis = COALESCE(p_revision_payload->>'alternative_hypothesis', alternative_hypothesis),
        falsification_conditions = COALESCE(p_revision_payload->'falsification_conditions', falsification_conditions),
        critical_failure_threshold = COALESCE(p_revision_payload->>'critical_failure_threshold', critical_failure_threshold),
        scope_and_limitations = COALESCE(p_revision_payload->>'scope_and_limitations', scope_and_limitations),
        falsifiability_rubric_score = COALESCE((p_revision_payload->>'falsifiability_rubric_score')::numeric, falsifiability_rubric_score),
        status = COALESCE(p_revision_payload->>'status', 'RESEARCHER_APPROVED'),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_hypothesis_id;

    -- Insert new immutable snapshot in research_hypothesis_versions
    INSERT INTO public.research_hypothesis_versions (
        hypothesis_id,
        version_number,
        hypothesis_payload,
        logical_audit_findings,
        modified_by,
        modification_rationale,
        created_at
    ) VALUES (
        p_hypothesis_id,
        v_new_ver,
        p_revision_payload,
        v_logical_findings,
        p_modified_by,
        p_modification_rationale,
        timezone('utc'::text, now())
    );

    RETURN v_new_ver;
END;
$$;

-- 10. Dedicated ACL Lockdown on Privileged RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_persist_research_hypothesis FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_persist_research_hypothesis TO service_role;

REVOKE EXECUTE ON FUNCTION public.rpc_revise_research_hypothesis FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_revise_research_hypothesis TO service_role;
