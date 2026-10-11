-- ====================================================================
-- OPENRESEARCH SUPABASE DATABASE MIGRATION & RLS POLICIES
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    title TEXT,
    biography TEXT,
    avatar_url TEXT,
    research_interests TEXT[] DEFAULT '{}'::TEXT[],
    skills TEXT[] DEFAULT '{}'::TEXT[],
    institution TEXT,
    orcid TEXT,
    h_index INTEGER DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    role TEXT DEFAULT 'researcher' CHECK (role IN ('researcher', 'organization_member', 'reviewer', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'members')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    type TEXT CHECK (type IN ('University', 'Research Institute', 'Tech Enterprise', 'Non-Profit')),
    location TEXT,
    description TEXT,
    website_url TEXT,
    focus_areas TEXT[] DEFAULT '{}'::TEXT[],
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'reviewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'invited')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 4. RESEARCH PAPERS TABLE
CREATE TABLE IF NOT EXISTS public.research_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doi TEXT UNIQUE,
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT '{}'::TEXT[],
    publication_date DATE,
    journal TEXT,
    citations_count INTEGER DEFAULT 0,
    open_access BOOLEAN DEFAULT TRUE,
    abstract TEXT NOT NULL,
    field TEXT NOT NULL,
    subject_tags TEXT[] DEFAULT '{}'::TEXT[],
    limitations TEXT[] DEFAULT '{}'::TEXT[],
    pdf_url TEXT,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    ai_analysis_status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    org_name TEXT NOT NULL,
    org_type TEXT,
    category TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Grand Challenge')),
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Solved', 'Closed')),
    reward_bounty TEXT,
    deadline DATE,
    problem_statement TEXT NOT NULL,
    research_background TEXT,
    related_paper_ids TEXT[] DEFAULT '{}'::TEXT[],
    known_limitations TEXT[] DEFAULT '{}'::TEXT[],
    constraints TEXT[] DEFAULT '{}'::TEXT[],
    desired_outcome TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
    paper_id UUID REFERENCES public.research_papers(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Methodology', 'Dataset', 'Code Implementation', 'Replication Experiment', 'Theoretical Extension')),
    summary TEXT NOT NULL,
    methodology TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::JSONB,
    code_url TEXT,
    dataset_url TEXT,
    expected_outcome TEXT NOT NULL,
    limitations TEXT NOT NULL,
    status TEXT DEFAULT 'Under Review' CHECK (status IN ('Draft', 'Under Review', 'In Experimentation', 'Accepted', 'Published', 'Rejected')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXPERIMENTS TABLE
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id UUID REFERENCES public.contributions(id) ON DELETE CASCADE,
    researcher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    methodology TEXT NOT NULL,
    environment_specs TEXT,
    dataset_reference TEXT,
    metrics_results JSONB DEFAULT '{}'::JSONB,
    reproducibility_instructions TEXT,
    evidence_links TEXT[] DEFAULT '{}'::TEXT[],
    outcome_status TEXT CHECK (outcome_status IN ('Pending', 'Replicated', 'Contradicted', 'Inconclusive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id UUID REFERENCES public.contributions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comments TEXT NOT NULL,
    rating_score INTEGER CHECK (rating_score BETWEEN 1 AND 5),
    decision TEXT CHECK (decision IN ('Approve', 'Request Changes', 'Reject')),
    conflict_of_interest_declaration BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RESEARCH RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.research_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('identifies limitation', 'addresses', 'tests', 'replicates', 'contradicts', 'extends')),
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SAVED ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT CHECK (item_type IN ('paper', 'challenge')),
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Organizations Policies
CREATE POLICY "Organizations are viewable by everyone" 
ON public.organizations FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Research Papers Policies
CREATE POLICY "Public research papers viewable by everyone" 
ON public.research_papers FOR SELECT USING (visibility = 'public');

CREATE POLICY "Authenticated users can upload papers" 
ON public.research_papers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Challenges Policies
CREATE POLICY "Public challenges viewable by everyone" 
ON public.challenges FOR SELECT USING (visibility = 'public');

CREATE POLICY "Authenticated users can create challenges" 
ON public.challenges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update own challenges" 
ON public.challenges FOR UPDATE USING (auth.uid() = creator_id);

-- 5. Contributions Policies
CREATE POLICY "Published or under review contributions viewable by everyone" 
ON public.contributions FOR SELECT USING (status != 'Draft' OR auth.uid() = author_id);

CREATE POLICY "Users can insert own contributions" 
ON public.contributions FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own contributions" 
ON public.contributions FOR UPDATE USING (auth.uid() = author_id);

-- 6. Saved Items Policies
CREATE POLICY "Users can view own saved items" 
ON public.saved_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved items" 
ON public.saved_items FOR ALL USING (auth.uid() = user_id);


-- ====================================================================
-- SUPABASE STORAGE BUCKETS & POLICIES
-- ====================================================================

-- Storage Bucket for Research Artifacts (PDFs, Datasets, Evidence)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('research_files', 'research_files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public research PDFs downloadable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'research_files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload research files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'research_files' AND auth.role() = 'authenticated');


-- ====================================================================
-- SEED MOCK DEMO DATA FOR IMMEDIATE INTERACTIVE TESTING
-- ====================================================================

INSERT INTO public.organizations (id, name, type, location, description, website_url, focus_areas) VALUES
('00000000-0000-0000-0000-000000000001', 'AI Science Foundation', 'Non-Profit', 'San Francisco, CA', 'Funding open-source foundational research in artificial intelligence.', 'https://aisciencefoundation.org', ARRAY['Efficient LLMs', 'AI Safety']),
('00000000-0000-0000-0000-000000000002', 'BioHealth Research Institute', 'Research Institute', 'Basel, Switzerland', 'Accelerating gene therapies and protein engineering.', 'https://biohealth-institute.org', ARRAY['CRISPR', 'RNA Therapeutics'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.research_papers (id, doi, title, authors, publication_date, journal, citations_count, open_access, abstract, field, subject_tags, limitations) VALUES
('00000000-0000-0000-0000-000000000101', '10.1038/s41586-025-08129-x', 'Linear-Time Attention Mechanisms via Sub-Quadratic State Space Kernels', ARRAY['Dr. Elena Rostova', 'Marcus Vance'], '2025-01-15', 'Nature Machine Intelligence', 342, true, 'Transformer architectures scale quadratically O(N²) with context length. S2-Kernel achieves linear time O(N) attention.', 'Artificial Intelligence', ARRAY['Transformer Models', 'Efficiency'], ARRAY['High GPU memory overhead during backward pass gradient synthesis']),
('00000000-0000-0000-0000-000000000102', '10.1016/j.cell.2025.04.019', 'High-Fidelity CRISPR-Cas12a Cleavage via Engineered Bridge RNA Constructs', ARRAY['Dr. Aris Thorne', 'Sarah Jenkins'], '2025-04-10', 'Cell Bioengineering', 189, true, 'Bridge RNA derivative (bRNA-v4) restricts non-specific double-strand break formation by 98.4%.', 'Genomics & Gene Editing', ARRAY['CRISPR-Cas12a', 'Gene Therapy'], ARRAY['bRNA-v4 transcript synthesis exhibits thermal degradation above 37°C'])
ON CONFLICT (id) DO NOTHING;
