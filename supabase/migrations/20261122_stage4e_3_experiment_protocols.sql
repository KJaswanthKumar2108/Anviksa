-- ====================================================================
-- Anvīkṣā — Stage 4E Additive Migration: Experiment Protocol Synthesizer
-- Work Package: 4E-IMP-03
-- Target Database: Supabase PostgreSQL (dtlvtpntmtdmdawupylv)
-- Safety: ADDITIVE ONLY, NON-DESTRUCTIVE, PRESERVES EXISTING TABLES & RLS
-- ====================================================================

-- 1. Create table public.research_experiments
CREATE TABLE IF NOT EXISTS public.research_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id UUID NOT NULL REFERENCES public.research_hypotheses(id) ON DELETE RESTRICT,
    opportunity_id UUID NOT NULL REFERENCES public.research_opportunities(id) ON DELETE RESTRICT,
    gap_id UUID NOT NULL REFERENCES public.research_gaps(id) ON DELETE RESTRICT,
    validation_run_id TEXT NOT NULL,
    hypothesis_version INTEGER NOT NULL DEFAULT 1,
    current_version INTEGER NOT NULL DEFAULT 1,
    
    -- Protocol Identification & Scope
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    experimental_design_type TEXT NOT NULL CHECK (experimental_design_type IN (
        'RANDOMIZED_CONTROLLED_TRIAL',
        'PAIRED_COMPARATIVE_BENCHMARK',
        'SYSTEMATIC_COMPONENT_ABLATION',
        'SCALING_AND_COMPLEXITY_ANALYSIS',
        'STOCHASTIC_SIMULATION',
        'FORMAL_PROOF_AND_COUNTER_EXAMPLE',
        'DATASET_BIAS_AND_DISTRIBUTION_AUDIT',
        'ADVERSARIAL_ROBUSTNESS_STRESS_TEST',
        'EMPIRICAL_REPLICATION_STUDY',
        'QUALITATIVE_SYSTEMS_ARCHITECTURE',
        'PARAMETER_EFFICIENCY_ADAPTATION'
    )),
    paradigm_specific_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Grounded Baselines & Reproducibility Specs
    verified_baselines JSONB NOT NULL DEFAULT '[]'::jsonb,
    datasets_and_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
    execution_environment JSONB NOT NULL DEFAULT '{}'::jsonb,
    statistical_analysis_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    ablation_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
    falsification_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    threats_to_validity JSONB NOT NULL DEFAULT '{}'::jsonb,
    reproducibility_package JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Lifecycle & Review Status
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN (
        'GENERATED',
        'VALIDATION_PENDING',
        'VERIFIED_FOR_REVIEW',
        'REQUIRES_REFINEMENT',
        'REJECTED',
        'RESEARCHER_APPROVED',
        'READY_FOR_EXECUTION',
        'EXECUTED',
        'SUPERSEDED',
        'STALE'
    )),
    
    -- Invalidation & Staleness Tracking
    is_stale BOOLEAN NOT NULL DEFAULT false,
    staleness_reason TEXT,
    
    -- Provenance, Audit & Timestamps
    generation_provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    protocol_audit_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Composite Foreign Key to public.research_gap_validations:
    -- Guarantees validation_run_id strictly belongs to the gap_id.
    CONSTRAINT fk_exp_validation_run
        FOREIGN KEY (gap_id, validation_run_id)
        REFERENCES public.research_gap_validations(gap_id, validation_run_id)
        ON DELETE RESTRICT,
        
    -- Explicit Prohibition of Nil UUID Sentinels
    CONSTRAINT chk_exp_hypothesis_not_nil
        CHECK (hypothesis_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_exp_opportunity_not_nil
        CHECK (opportunity_id <> '00000000-0000-0000-0000-000000000000'::uuid),
    CONSTRAINT chk_exp_gap_not_nil
        CHECK (gap_id <> '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 2. Create table public.research_experiment_metrics
CREATE TABLE IF NOT EXISTS public.research_experiment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES public.research_experiments(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'PRIMARY',
        'SECONDARY',
        'ABLATION',
        'EFFICIENCY',
        'SAFETY',
        'FAIRNESS'
    )),
    operational_definition TEXT NOT NULL,
    measurement_unit TEXT NOT NULL,
    measurement_instrument TEXT NOT NULL,
    direction_of_improvement TEXT NOT NULL CHECK (direction_of_improvement IN (
        'HIGHER_IS_BETTER',
        'LOWER_IS_BETTER',
        'TARGET_VALUE',
        'INVARIANCE'
    )),
    target_value TEXT,
    falsification_threshold TEXT NOT NULL,
    is_uncalibrated BOOLEAN NOT NULL DEFAULT false,
    baseline_reference_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create table public.research_experiment_versions (Immutable Audit History)
CREATE TABLE IF NOT EXISTS public.research_experiment_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES public.research_experiments(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    protocol_payload JSONB NOT NULL,
    protocol_audit_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    modification_rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_experiment_version UNIQUE (experiment_id, version_number)
);

-- 4. Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_exp_hypothesis ON public.research_experiments(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_exp_opportunity ON public.research_experiments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_exp_gap_run ON public.research_experiments(gap_id, validation_run_id);
CREATE INDEX IF NOT EXISTS idx_exp_status_design ON public.research_experiments(status, experimental_design_type);
CREATE INDEX IF NOT EXISTS idx_exp_metrics_exp ON public.research_experiment_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_versions_lookup ON public.research_experiment_versions(experiment_id, version_number DESC);

-- 5. Enable Row-Level Security
ALTER TABLE public.research_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_experiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_experiment_versions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Inherited Parent-Gap Visibility
CREATE POLICY rls_research_experiments_select
ON public.research_experiments
FOR SELECT TO public
USING (
    status <> 'REJECTED' AND (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.research_gaps g
            WHERE g.id = research_experiments.gap_id
            AND (
                (g.visibility IN ('public', 'community') AND g.is_published = true) OR
                (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
            )
        )
    )
);

CREATE POLICY rls_research_experiments_write
ON public.research_experiments
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY rls_research_experiment_metrics_select
ON public.research_experiment_metrics
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_experiments e
        JOIN public.research_gaps g ON g.id = e.gap_id
        WHERE e.id = research_experiment_metrics.experiment_id
        AND e.status <> 'REJECTED'
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

CREATE POLICY rls_research_experiment_metrics_write
ON public.research_experiment_metrics
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY rls_experiment_versions_select
ON public.research_experiment_versions
FOR SELECT TO public
USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM public.research_experiments e
        JOIN public.research_gaps g ON g.id = e.gap_id
        WHERE e.id = research_experiment_versions.experiment_id
        AND (
            (g.visibility IN ('public', 'community') AND g.is_published = true) OR
            (auth.uid() IS NOT NULL AND g.created_by = auth.uid())
        )
    )
);

CREATE POLICY rls_experiment_versions_write
ON public.research_experiment_versions
FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 7. Trigger: Immutability Enforcement on Experiment Versions
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_experiment_version_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'research_experiment_versions records are strictly immutable. Updates and deletes are prohibited.'
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE OR REPLACE TRIGGER trg_experiment_version_immutable
BEFORE UPDATE OR DELETE ON public.research_experiment_versions
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_enforce_experiment_version_immutability();

-- 8. Trigger: Automatic Staleness Propagation from Hypotheses to Experiments
CREATE OR REPLACE FUNCTION public.trg_fn_propagate_hypothesis_to_experiments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_stale = true AND (OLD.is_stale IS NULL OR OLD.is_stale = false) THEN
        UPDATE public.research_experiments
        SET is_stale = true,
            staleness_reason = 'UPSTREAM_HYPOTHESIS_STALE',
            updated_at = timezone('utc'::text, now())
        WHERE hypothesis_id = NEW.id
          AND is_stale = false
          AND status NOT IN ('REJECTED', 'SUPERSEDED');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_hypothesis_staleness_to_experiments
AFTER UPDATE OF is_stale ON public.research_hypotheses
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_propagate_hypothesis_to_experiments();

-- 9. Trigger: Automatic Staleness Propagation from Opportunities to Experiments
CREATE OR REPLACE FUNCTION public.trg_fn_propagate_opportunity_to_experiments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_stale = true AND (OLD.is_stale IS NULL OR OLD.is_stale = false) THEN
        UPDATE public.research_experiments
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

CREATE OR REPLACE TRIGGER trg_opportunity_staleness_to_experiments
AFTER UPDATE OF is_stale ON public.research_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_propagate_opportunity_to_experiments();

-- 10. Privileged RPC: rpc_persist_research_experiment
-- Persists a server-verified experimental protocol and creates version 1 snapshot in an atomic transaction
CREATE OR REPLACE FUNCTION public.rpc_persist_research_experiment(
    p_hypothesis_id UUID,
    p_opportunity_id UUID,
    p_gap_id UUID,
    p_validation_run_id TEXT,
    p_hypothesis_version INTEGER,
    p_title TEXT,
    p_objective TEXT,
    p_experimental_design_type TEXT,
    p_paradigm_specific_config JSONB DEFAULT '{}'::jsonb,
    p_verified_baselines JSONB DEFAULT '[]'::jsonb,
    p_datasets_and_materials JSONB DEFAULT '[]'::jsonb,
    p_execution_environment JSONB DEFAULT '{}'::jsonb,
    p_statistical_analysis_plan JSONB DEFAULT '{}'::jsonb,
    p_ablation_matrix JSONB DEFAULT '[]'::jsonb,
    p_falsification_criteria JSONB DEFAULT '[]'::jsonb,
    p_threats_to_validity JSONB DEFAULT '{}'::jsonb,
    p_reproducibility_package JSONB DEFAULT '{}'::jsonb,
    p_metrics JSONB DEFAULT '[]'::jsonb,
    p_status TEXT DEFAULT 'GENERATED',
    p_generation_provenance JSONB DEFAULT '{}'::jsonb,
    p_protocol_audit_findings JSONB DEFAULT '[]'::jsonb,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hyp_is_stale BOOLEAN;
    v_hyp_status TEXT;
    v_experiment_id UUID;
    v_initial_payload JSONB;
    v_metric RECORD;
BEGIN
    -- Verify hypothesis exists, is not stale and is valid
    SELECT is_stale, status INTO v_hyp_is_stale, v_hyp_status
    FROM public.research_hypotheses
    WHERE id = p_hypothesis_id AND gap_id = p_gap_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target research hypothesis % not found for gap %', p_hypothesis_id, p_gap_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_hyp_is_stale THEN
        RAISE EXCEPTION 'Cannot generate experiment protocol from stale hypothesis %', p_hypothesis_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_hyp_status IN ('REJECTED', 'SUPERSEDED') THEN
        RAISE EXCEPTION 'Cannot generate experiment protocol from disqualified hypothesis with status %', v_hyp_status
            USING ERRCODE = 'check_violation';
    END IF;

    -- Insert experiment protocol record
    INSERT INTO public.research_experiments (
        hypothesis_id,
        opportunity_id,
        gap_id,
        validation_run_id,
        hypothesis_version,
        current_version,
        title,
        objective,
        experimental_design_type,
        paradigm_specific_config,
        verified_baselines,
        datasets_and_materials,
        execution_environment,
        statistical_analysis_plan,
        ablation_matrix,
        falsification_criteria,
        threats_to_validity,
        reproducibility_package,
        status,
        generation_provenance,
        protocol_audit_findings,
        created_by,
        updated_at
    ) VALUES (
        p_hypothesis_id,
        p_opportunity_id,
        p_gap_id,
        p_validation_run_id,
        p_hypothesis_version,
        1,
        p_title,
        p_objective,
        p_experimental_design_type,
        p_paradigm_specific_config,
        p_verified_baselines,
        p_datasets_and_materials,
        p_execution_environment,
        p_statistical_analysis_plan,
        p_ablation_matrix,
        p_falsification_criteria,
        p_threats_to_validity,
        p_reproducibility_package,
        p_status,
        p_generation_provenance,
        p_protocol_audit_findings,
        p_created_by,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_experiment_id;

    -- Insert structured metrics into normalized table
    FOR v_metric IN SELECT * FROM jsonb_to_recordset(p_metrics) AS m(
        metric_name TEXT,
        metric_type TEXT,
        operational_definition TEXT,
        measurement_unit TEXT,
        measurement_instrument TEXT,
        direction_of_improvement TEXT,
        target_value TEXT,
        falsification_threshold TEXT,
        is_uncalibrated BOOLEAN,
        baseline_reference_value TEXT
    ) LOOP
        INSERT INTO public.research_experiment_metrics (
            experiment_id,
            metric_name,
            metric_type,
            operational_definition,
            measurement_unit,
            measurement_instrument,
            direction_of_improvement,
            target_value,
            falsification_threshold,
            is_uncalibrated,
            baseline_reference_value
        ) VALUES (
            v_experiment_id,
            v_metric.metric_name,
            COALESCE(v_metric.metric_type, 'PRIMARY'),
            COALESCE(v_metric.operational_definition, ''),
            COALESCE(v_metric.measurement_unit, 'standard'),
            COALESCE(v_metric.measurement_instrument, 'Automated evaluation suite'),
            COALESCE(v_metric.direction_of_improvement, 'HIGHER_IS_BETTER'),
            v_metric.target_value,
            COALESCE(v_metric.falsification_threshold, 'REQUIRES_RESEARCHER_SPECIFICATION'),
            COALESCE(v_metric.is_uncalibrated, false),
            v_metric.baseline_reference_value
        );
    END LOOP;

    -- Construct version 1 snapshot
    v_initial_payload := jsonb_build_object(
        'title', p_title,
        'objective', p_objective,
        'experimental_design_type', p_experimental_design_type,
        'paradigm_specific_config', p_paradigm_specific_config,
        'verified_baselines', p_verified_baselines,
        'datasets_and_materials', p_datasets_and_materials,
        'execution_environment', p_execution_environment,
        'statistical_analysis_plan', p_statistical_analysis_plan,
        'ablation_matrix', p_ablation_matrix,
        'falsification_criteria', p_falsification_criteria,
        'threats_to_validity', p_threats_to_validity,
        'reproducibility_package', p_reproducibility_package,
        'metrics', p_metrics
    );

    -- Insert version 1 audit snapshot
    INSERT INTO public.research_experiment_versions (
        experiment_id,
        version_number,
        protocol_payload,
        protocol_audit_findings,
        modified_by,
        modification_rationale,
        created_at
    ) VALUES (
        v_experiment_id,
        1,
        v_initial_payload,
        p_protocol_audit_findings,
        p_created_by,
        'Initial candidate experiment protocol synthesis',
        timezone('utc'::text, now())
    );

    RETURN v_experiment_id;
END;
$$;

-- 11. Privileged RPC: rpc_revise_research_experiment
CREATE OR REPLACE FUNCTION public.rpc_revise_research_experiment(
    p_experiment_id UUID,
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
    v_audit_findings JSONB;
    v_metric RECORD;
BEGIN
    SELECT current_version, protocol_audit_findings
    INTO v_curr_ver, v_audit_findings
    FROM public.research_experiments
    WHERE id = p_experiment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Experiment protocol % not found for revision', p_experiment_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    v_new_ver := v_curr_ver + 1;

    -- Update mutable active fields on research_experiments
    UPDATE public.research_experiments
    SET current_version = v_new_ver,
        title = COALESCE(p_revision_payload->>'title', title),
        objective = COALESCE(p_revision_payload->>'objective', objective),
        experimental_design_type = COALESCE(p_revision_payload->>'experimental_design_type', experimental_design_type),
        paradigm_specific_config = COALESCE(p_revision_payload->'paradigm_specific_config', paradigm_specific_config),
        verified_baselines = COALESCE(p_revision_payload->'verified_baselines', verified_baselines),
        datasets_and_materials = COALESCE(p_revision_payload->'datasets_and_materials', datasets_and_materials),
        execution_environment = COALESCE(p_revision_payload->'execution_environment', execution_environment),
        statistical_analysis_plan = COALESCE(p_revision_payload->'statistical_analysis_plan', statistical_analysis_plan),
        ablation_matrix = COALESCE(p_revision_payload->'ablation_matrix', ablation_matrix),
        falsification_criteria = COALESCE(p_revision_payload->'falsification_criteria', falsification_criteria),
        threats_to_validity = COALESCE(p_revision_payload->'threats_to_validity', threats_to_validity),
        reproducibility_package = COALESCE(p_revision_payload->'reproducibility_package', reproducibility_package),
        status = COALESCE(p_revision_payload->>'status', 'RESEARCHER_APPROVED'),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_experiment_id;

    -- If updated metrics are provided, refresh normalized metrics table
    IF p_revision_payload ? 'metrics' AND jsonb_typeof(p_revision_payload->'metrics') = 'array' THEN
        DELETE FROM public.research_experiment_metrics WHERE experiment_id = p_experiment_id;

        FOR v_metric IN SELECT * FROM jsonb_to_recordset(p_revision_payload->'metrics') AS m(
            metric_name TEXT,
            metric_type TEXT,
            operational_definition TEXT,
            measurement_unit TEXT,
            measurement_instrument TEXT,
            direction_of_improvement TEXT,
            target_value TEXT,
            falsification_threshold TEXT,
            is_uncalibrated BOOLEAN,
            baseline_reference_value TEXT
        ) LOOP
            INSERT INTO public.research_experiment_metrics (
                experiment_id,
                metric_name,
                metric_type,
                operational_definition,
                measurement_unit,
                measurement_instrument,
                direction_of_improvement,
                target_value,
                falsification_threshold,
                is_uncalibrated,
                baseline_reference_value
            ) VALUES (
                p_experiment_id,
                v_metric.metric_name,
                COALESCE(v_metric.metric_type, 'PRIMARY'),
                COALESCE(v_metric.operational_definition, ''),
                COALESCE(v_metric.measurement_unit, 'standard'),
                COALESCE(v_metric.measurement_instrument, 'Automated evaluation suite'),
                COALESCE(v_metric.direction_of_improvement, 'HIGHER_IS_BETTER'),
                v_metric.target_value,
                COALESCE(v_metric.falsification_threshold, 'REQUIRES_RESEARCHER_SPECIFICATION'),
                COALESCE(v_metric.is_uncalibrated, false),
                v_metric.baseline_reference_value
            );
        END LOOP;
    END IF;

    -- Insert new immutable snapshot in research_experiment_versions
    INSERT INTO public.research_experiment_versions (
        experiment_id,
        version_number,
        protocol_payload,
        protocol_audit_findings,
        modified_by,
        modification_rationale,
        created_at
    ) VALUES (
        p_experiment_id,
        v_new_ver,
        p_revision_payload,
        v_audit_findings,
        p_modified_by,
        p_modification_rationale,
        timezone('utc'::text, now())
    );

    RETURN v_new_ver;
END;
$$;

-- 12. Dedicated ACL Lockdown on Privileged RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_persist_research_experiment FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_persist_research_experiment TO service_role;

REVOKE EXECUTE ON FUNCTION public.rpc_revise_research_experiment FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_revise_research_experiment TO service_role;
