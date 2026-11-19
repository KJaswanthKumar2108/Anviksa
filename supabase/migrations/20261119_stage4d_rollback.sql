-- ====================================================================
-- Anvīkṣā — Stage 4D Rollback Migration
-- Safety: Reverts Stage 4D additive objects if required
-- ====================================================================

DROP FUNCTION IF EXISTS public.purge_archived_research_gap(UUID, TEXT);
DROP FUNCTION IF EXISTS public.archive_research_gap(UUID, TEXT);
DROP FUNCTION IF EXISTS public.insert_server_verified_validation(
    UUID,
    public.validation_outcome,
    public.epistemic_classification,
    NUMERIC,
    TEXT,
    TEXT,
    TIMESTAMPTZ,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    JSONB,
    TEXT
);

DROP TABLE IF EXISTS public.research_gap_relationships CASCADE;

ALTER TABLE public.research_gap_validations 
    DROP CONSTRAINT IF EXISTS uq_gap_validations_gap_run;

ALTER TABLE public.research_gap_validations 
    DROP COLUMN IF EXISTS literature_coverage_metadata,
    DROP COLUMN IF EXISTS confidence_score;

ALTER TABLE public.research_gaps 
    DROP COLUMN IF EXISTS last_validated_at,
    DROP COLUMN IF EXISTS is_archived,
    DROP COLUMN IF EXISTS archived_at;
