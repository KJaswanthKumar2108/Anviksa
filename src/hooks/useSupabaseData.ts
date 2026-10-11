import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  MOCK_PAPERS,
  MOCK_CHALLENGES,
  MOCK_CONTRIBUTIONS,
  MOCK_CONTRIBUTORS,
  MOCK_ORGANIZATIONS,
  Paper,
  Challenge,
  Contribution
} from '../data/mockData';
import { deduplicatePapers, deduplicateById } from '../utils/doiNormalization';

export function useSupabaseData() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    return {
      id: 'user-101',
      email: 'elena.rostova@inf.ethz.ch',
      display_name: 'Dr. Elena Rostova',
      title: 'Senior AI Researcher',
      institution: 'ETH Zürich / OpenResearch Fellow',
      role: 'researcher',
      is_verified: true,
      h_index: 28
    };
  });

  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
  const [contributions, setContributions] = useState<Contribution[]>(MOCK_CONTRIBUTIONS);
  const [savedPaperIds, setSavedPaperIds] = useState<string[]>(['paper-1']);
  const [savedChallengeIds, setSavedChallengeIds] = useState<string[]>(['chal-1']);
  const [followedContributorIds, setFollowedContributorIds] = useState<string[]>(['user-101']);
  const [loading, setLoading] = useState(false);

  // Initialize Supabase session & fetch initial records if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    async function loadSupabaseData() {
      if (!client) return;
      setLoading(true);
      try {
        // Check session
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) setCurrentUser(profile);
        }

        // Fetch Papers
        const { data: dbPapers } = await client.from('research_papers').select('*');
        if (dbPapers && dbPapers.length > 0) {
          const mappedPapers: Paper[] = dbPapers.map((p: any) => ({
            id: p.id,
            doi: p.doi,
            title: p.title,
            authors: p.authors || [],
            year: p.publication_date ? new Date(p.publication_date).getFullYear() : 2025,
            journal: p.journal || 'Journal of Open Research',
            citationsCount: p.citations_count || 0,
            openAccess: p.open_access ?? true,
            abstract: p.abstract,
            field: p.field,
            subjectTags: p.subject_tags || [],
            limitations: p.limitations || [],
            linkedChallengeIds: [],
            readTime: '12 min read'
          }));
          setPapers(deduplicatePapers(mappedPapers));
        }

        // Fetch Challenges
        const { data: dbChallenges } = await client.from('challenges').select('*');
        if (dbChallenges && dbChallenges.length > 0) {
          const mappedChallenges: Challenge[] = dbChallenges.map((c: any) => ({
            id: c.id,
            title: c.title,
            orgId: c.organization_id || 'org-1',
            orgName: c.org_name,
            orgType: c.org_type || 'Research Institute',
            category: c.category,
            difficulty: c.difficulty || 'Advanced',
            status: c.status || 'Open',
            rewardBounty: c.reward_bounty,
            deadline: c.deadline || '2026-12-31',
            problemStatement: c.problem_statement,
            researchBackground: c.research_background || '',
            relatedPaperIds: c.related_paper_ids || [],
            knownLimitations: c.known_limitations || [],
            constraints: c.constraints || [],
            desiredOutcome: c.desired_outcome,
            contributorCount: 12,
            proposalCount: 4,
            createdAt: c.created_at ? c.created_at.split('T')[0] : '2026-09-01'
          }));
          setChallenges(deduplicateById(mappedChallenges));
        }

        // Fetch Contributions
        const { data: dbContributions } = await client.from('contributions').select('*');
        if (dbContributions && dbContributions.length > 0) {
          const mappedContributions: Contribution[] = dbContributions.map((c: any) => ({
            id: c.id,
            challengeId: c.challenge_id,
            paperId: c.paper_id,
            title: c.title,
            contributorId: c.author_id,
            contributorName: 'Dr. Elena Rostova',
            contributorTitle: 'Senior AI Researcher',
            contributorInstitution: 'ETH Zürich',
            type: c.type,
            summary: c.summary,
            methodology: c.methodology,
            attachments: c.attachments || [],
            codeUrl: c.code_url,
            datasetUrl: c.dataset_url,
            expectedOutcome: c.expected_outcome,
            limitations: c.limitations,
            status: c.status,
            reviewsCount: 3,
            createdAt: c.created_at ? c.created_at.split('T')[0] : 'Just now',
            isVerified: c.is_verified || false
          }));
          setContributions(deduplicateById(mappedContributions));
        }

      } catch (err) {
        console.warn('Supabase fetch fallback to mock data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSupabaseData();
  }, []);

  const handleSignOut = async () => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      await client.auth.signOut();
    }
    setCurrentUser(null);
  };

  return {
    currentUser,
    setCurrentUser,
    papers,
    challenges,
    contributions,
    contributors: MOCK_CONTRIBUTORS,
    organizations: MOCK_ORGANIZATIONS,
    savedPaperIds,
    savedChallengeIds,
    followedContributorIds,
    isSupabaseConfigured,
    loading,
    signOut: handleSignOut
  };
}
