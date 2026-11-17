import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  MOCK_PAPERS,
  MOCK_CHALLENGES,
  MOCK_CONTRIBUTORS,
  MOCK_ORGANIZATIONS,
  Paper,
  Challenge,
  Contribution,
  Contributor,
  Organization,
  ActivityItem
} from '../data/mockData';
import { deduplicateById, deduplicatePapers } from '../utils/doiNormalization';

const LOCAL_STORAGE_KEY_SAVED_PAPERS = 'openresearch_saved_papers_v1';
const LOCAL_STORAGE_KEY_SAVED_CHALLENGES = 'openresearch_saved_challenges_v1';
const LOCAL_STORAGE_KEY_CHALLENGES = 'openresearch_challenges_v1';
const LOCAL_STORAGE_KEY_CONTRIBUTIONS = 'openresearch_contributions_v1';
const LOCAL_STORAGE_KEY_FOLLOWED = 'openresearch_followed_contributors_v1';
const LOCAL_STORAGE_KEY_DRAFT_CONTRIB = 'openresearch_draft_contrib_v1';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export function useResearchStore(currentUser?: any) {
  // Saved Item IDs
  const [savedPaperIds, setSavedPaperIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_PAPERS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedChallengeIds, setSavedChallengeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_CHALLENGES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Followed Contributors
  const [followedContributorIds, setFollowedContributorIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_FOLLOWED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Papers (hydrated from Supabase, fallback to verified peer-reviewed publications)
  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);

  // Organizations (hydrated from Supabase)
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Challenges (hydrated from Supabase, merged with mock & local storage)
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CHALLENGES);
      if (stored) {
        const custom: Challenge[] = JSON.parse(stored);
        const mockMap = new Map(MOCK_CHALLENGES.map(c => [c.id, c]));
        custom.forEach(c => mockMap.set(c.id, c));
        return Array.from(mockMap.values());
      }
    } catch {}
    return MOCK_CHALLENGES;
  });

  // Contributions (purely genuine: user-submitted and Supabase records)
  const [contributions, setContributions] = useState<Contribution[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CONTRIBUTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Community Activity (purely genuine from Supabase)
  const [communityPosts, setCommunityPosts] = useState<ActivityItem[]>([]);

  // Draft Contribution
  const [draftContribution, setDraftContribution] = useState<Partial<Contribution> | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_DRAFT_CONTRIB);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Toast Notification
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3200);
  }, []);

  // Fetch from Supabase on mount and sync to state
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    async function syncFromSupabase() {
      try {
        // Fetch Challenges from Supabase
        const { data: dbChallenges, error: cErr } = await client.from('challenges').select('*');
        let liveChallenges: Challenge[] = [];
        if (!cErr && dbChallenges && dbChallenges.length > 0) {
          liveChallenges = dbChallenges.map((c: any) => ({
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
            contributorCount: 0,
            proposalCount: 0,
            createdAt: c.created_at ? c.created_at.split('T')[0] : '2026-09-01'
          }));
          setChallenges(liveChallenges);
        }

        // Fetch Organizations from Supabase and dynamically correlate with actual challenges
        const { data: dbOrgs, error: oErr } = await client.from('organizations').select('*');
        if (!oErr && dbOrgs && dbOrgs.length > 0) {
          const mappedOrgs: Organization[] = dbOrgs.map((o: any) => {
            const orgChallenges = (dbChallenges || []).filter((c: any) => c.organization_id === o.id || c.org_name === o.name);
            const activeCount = orgChallenges.length;
            const bountyList = orgChallenges.map((c: any) => c.reward_bounty).filter(Boolean);
            const totalGrants = bountyList.length > 0 ? bountyList[0] : 'N/A';
            return {
              id: o.id,
              name: o.name,
              logo: o.logo_url || '',
              type: o.type || 'Research Institute',
              location: o.location || 'Global',
              description: o.description || 'Active research organization.',
              activeChallengesCount: activeCount,
              totalGrantsAwarded: totalGrants,
              website: o.website_url || '',
              focusAreas: o.focus_areas || []
            };
          });
          setOrganizations(mappedOrgs);
        }

        // Fetch Papers from Supabase
        const { data: dbPapers, error: pErr } = await client.from('research_papers').select('*');
        if (!pErr && dbPapers && dbPapers.length > 0) {
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
            readTime: '12 min read',
            pdfUrl: p.pdf_url,
            fulltextStatus: p.fulltext_status || (p.open_access ? 'pdf_available' : 'metadata_only'),
            fulltextSourceType: p.fulltext_source_type || (p.pdf_url ? 'pdf' : null),
            fulltextSourceUrl: p.fulltext_source_url || p.pdf_url || null,
            accessStatus: p.access_status || (p.open_access ? 'open' : 'closed'),
            license: p.license || null,
            extractionStatus: p.extraction_status || 'pending',
            documentChecksum: p.document_checksum || null,
            extractedAt: p.extracted_at || null,
            extractedSections: p.extracted_sections || null
          }));
          setPapers(deduplicatePapers(mappedPapers));
        }

        // Fetch Contributions from Supabase
        const { data: dbContribs, error: cbErr } = await client.from('contributions').select('*');
        if (!cbErr && dbContribs && dbContribs.length > 0) {
          const mappedContributions: Contribution[] = dbContribs.map((c: any) => ({
            id: c.id,
            challengeId: c.challenge_id,
            paperId: c.paper_id,
            title: c.title,
            contributorId: c.author_id,
            contributorName: 'Researcher',
            contributorTitle: 'Researcher',
            contributorInstitution: '',
            type: c.type,
            summary: c.summary,
            methodology: c.methodology,
            attachments: c.attachments || [],
            codeUrl: c.code_url,
            datasetUrl: c.dataset_url,
            expectedOutcome: c.expected_outcome,
            limitations: c.limitations,
            status: c.status,
            reviewsCount: 0,
            createdAt: c.created_at ? c.created_at.split('T')[0] : 'Just now',
            isVerified: c.is_verified || false
          }));
          setContributions(prev => deduplicateById([...mappedContributions, ...prev]));
        }

        // Fetch Community Posts from Supabase
        const { data: dbPosts, error: postErr } = await client
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!postErr && dbPosts) {
          const mappedPosts: ActivityItem[] = dbPosts.map((p: any) => ({
            id: p.id,
            authorName: p.author_name,
            authorAvatar: p.author_avatar || '',
            authorRole: p.author_role || 'Researcher',
            hierarchyRole: p.hierarchy_role || 'Researcher',
            category: p.category,
            action: p.action,
            targetTitle: p.target_title,
            targetType: p.target_type,
            timestamp: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
            snippet: p.snippet,
            likes: p.likes || 0,
            comments: p.comments || 0
          }));
          setCommunityPosts(mappedPosts);
        }

        // Fetch user's saved items if signed in
        if (currentUser?.id) {
          const { data: savedData } = await client
            .from('saved_items')
            .select('*')
            .eq('user_id', currentUser.id);

          if (savedData && savedData.length > 0) {
            const paperIds = savedData.filter((s: any) => s.item_type === 'paper').map((s: any) => s.item_id);
            const challengeIds = savedData.filter((s: any) => s.item_type === 'challenge').map((s: any) => s.item_id);
            if (paperIds.length > 0) setSavedPaperIds(paperIds);
            if (challengeIds.length > 0) setSavedChallengeIds(challengeIds);
          }
        }
      } catch (err) {
        console.warn('[Supabase Sync] Error fetching Supabase records:', err);
      }
    }

    syncFromSupabase();
  }, [currentUser?.id]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_PAPERS, JSON.stringify(savedPaperIds));
    } catch {}
  }, [savedPaperIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_CHALLENGES, JSON.stringify(savedChallengeIds));
    } catch {}
  }, [savedChallengeIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_FOLLOWED, JSON.stringify(followedContributorIds));
    } catch {}
  }, [followedContributorIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CHALLENGES, JSON.stringify(challenges));
    } catch {}
  }, [challenges]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONTRIBUTIONS, JSON.stringify(contributions));
    } catch {}
  }, [contributions]);

  useEffect(() => {
    try {
      if (draftContribution) {
        localStorage.setItem(LOCAL_STORAGE_KEY_DRAFT_CONTRIB, JSON.stringify(draftContribution));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_DRAFT_CONTRIB);
      }
    } catch {}
  }, [draftContribution]);

  // Actions with live Supabase synchronization
  const toggleSavePaper = async (paperId: string) => {
    const exists = savedPaperIds.includes(paperId);
    if (exists) {
      setSavedPaperIds(prev => prev.filter(id => id !== paperId));
      showToast('Paper removed from Saved', 'info');
      if (isSupabaseConfigured && supabase && currentUser?.id) {
        await supabase
          .from('saved_items')
          .delete()
          .match({ user_id: currentUser.id, item_type: 'paper', item_id: paperId });
      }
    } else {
      setSavedPaperIds(prev => [...prev, paperId]);
      showToast('Paper saved to Saved bookmarks', 'success');
      if (isSupabaseConfigured && supabase && currentUser?.id) {
        await supabase
          .from('saved_items')
          .insert({ user_id: currentUser.id, item_type: 'paper', item_id: paperId });
      }
    }
  };

  const toggleSaveChallenge = async (challengeId: string) => {
    const exists = savedChallengeIds.includes(challengeId);
    if (exists) {
      setSavedChallengeIds(prev => prev.filter(id => id !== challengeId));
      showToast('Challenge removed from Saved', 'info');
      if (isSupabaseConfigured && supabase && currentUser?.id) {
        await supabase
          .from('saved_items')
          .delete()
          .match({ user_id: currentUser.id, item_type: 'challenge', item_id: challengeId });
      }
    } else {
      setSavedChallengeIds(prev => [...prev, challengeId]);
      showToast('Challenge bookmarked to Saved', 'success');
      if (isSupabaseConfigured && supabase && currentUser?.id) {
        await supabase
          .from('saved_items')
          .insert({ user_id: currentUser.id, item_type: 'challenge', item_id: challengeId });
      }
    }
  };

  const toggleFollowContributor = (contributorId: string) => {
    if (followedContributorIds.includes(contributorId)) {
      setFollowedContributorIds(prev => prev.filter(id => id !== contributorId));
      showToast('Unfollowed contributor', 'info');
    } else {
      setFollowedContributorIds(prev => [...prev, contributorId]);
      showToast('Connected with contributor', 'success');
    }
  };

  const createChallenge = async (newChallenge: Challenge) => {
    setChallenges(prev => deduplicateById([newChallenge, ...prev]));
    showToast('Research challenge published successfully!', 'success');

    // Persist to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = {
          title: newChallenge.title,
          org_name: newChallenge.orgName,
          org_type: newChallenge.orgType,
          category: newChallenge.category,
          difficulty: newChallenge.difficulty,
          status: newChallenge.status,
          reward_bounty: newChallenge.rewardBounty,
          deadline: newChallenge.deadline,
          problem_statement: newChallenge.problemStatement,
          research_background: newChallenge.researchBackground,
          related_paper_ids: newChallenge.relatedPaperIds || [],
          known_limitations: newChallenge.knownLimitations || [],
          constraints: newChallenge.constraints || [],
          desired_outcome: newChallenge.desiredOutcome
        };
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newChallenge.id);
        if (isValidUuid) {
          payload.id = newChallenge.id;
        }
        if (currentUser?.id) {
          payload.creator_id = currentUser.id;
        }
        const { error } = await supabase.from('challenges').insert(payload);
        if (error) {
          console.warn('[Supabase] Failed to persist challenge:', error.message);
        }
      } catch (e) {
        console.warn('[Supabase] Challenge insert error:', e);
      }
    }
  };

  const updateChallenge = async (id: string, updatedFields: Partial<Challenge>) => {
    setChallenges(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    showToast('Challenge details updated', 'success');

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = {};
        if (updatedFields.title) updatePayload.title = updatedFields.title;
        if (updatedFields.category) updatePayload.category = updatedFields.category;
        if (updatedFields.difficulty) updatePayload.difficulty = updatedFields.difficulty;
        if (updatedFields.status) updatePayload.status = updatedFields.status;
        if (updatedFields.problemStatement) updatePayload.problem_statement = updatedFields.problemStatement;
        if (updatedFields.desiredOutcome) updatePayload.desired_outcome = updatedFields.desiredOutcome;
        await supabase.from('challenges').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('[Supabase] Challenge update error:', e);
      }
    }
  };

  const deleteChallenge = async (id: string) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
    showToast('Challenge deleted', 'info');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('challenges').delete().eq('id', id);
      } catch (e) {
        console.warn('[Supabase] Challenge delete error:', e);
      }
    }
  };

  const saveDraft = (draft: Partial<Contribution>) => {
    setDraftContribution(draft);
    showToast('Proposal draft saved to local workspace', 'info');
  };

  const clearDraft = () => {
    setDraftContribution(null);
  };

  const submitContribution = async (newContrib: Contribution) => {
    setContributions(prev => deduplicateById([newContrib, ...prev]));
    setDraftContribution(null);
    showToast('Proposal submitted successfully to peer reviewers!', 'success');

    // Persist to Supabase if available
    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        const payload: any = {
          title: newContrib.title,
          type: newContrib.type,
          summary: newContrib.summary,
          methodology: newContrib.methodology,
          expected_outcome: newContrib.expectedOutcome,
          limitations: newContrib.limitations,
          status: newContrib.status || 'Under Review',
          author_id: currentUser.id,
          code_url: newContrib.codeUrl,
          dataset_url: newContrib.datasetUrl
        };
        const isChallengeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newContrib.challengeId || '');
        if (isChallengeUuid) {
          payload.challenge_id = newContrib.challengeId;
        }
        const isPaperUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newContrib.paperId || '');
        if (isPaperUuid) {
          payload.paper_id = newContrib.paperId;
        }

        const { error } = await supabase.from('contributions').insert(payload);
        if (error) {
          console.warn('[Supabase] Failed to persist contribution:', error.message);
        }
      } catch (e) {
        console.warn('[Supabase] Contribution insert error:', e);
      }
    }
  };

  const recordPeerReviewAndExperiment = async (reviewData: {
    contributionId: string;
    decision: 'Accepted' | 'Request Changes' | 'Rejected';
    reviewComments: string;
    ratingScore: number;
    conflictDeclared: boolean;
    experimentTitle?: string;
    environmentSpecs?: string;
    metricsResults?: string;
    outcomeStatus?: string;
  }) => {
    showToast(`Peer Review logged: Decision ${reviewData.decision} for proposal`, 'success');

    // Persist to Supabase reviews and experiments tables
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Insert into reviews table
        const reviewPayload: any = {
          contribution_id: reviewData.contributionId,
          comments: reviewData.reviewComments,
          rating_score: reviewData.ratingScore,
          decision: reviewData.decision,
          conflict_of_interest_declaration: reviewData.conflictDeclared,
          status: 'Submitted'
        };
        if (currentUser?.id) {
          reviewPayload.reviewer_id = currentUser.id;
        }
        await supabase.from('reviews').insert(reviewPayload);

        // 2. Insert into experiments table if experiment details provided
        if (reviewData.experimentTitle) {
          const expPayload: any = {
            contribution_id: reviewData.contributionId,
            title: reviewData.experimentTitle,
            methodology: 'Empirical verification and benchmark execution.',
            environment_specs: reviewData.environmentSpecs,
            metrics_results: { results: reviewData.metricsResults },
            outcome_status: reviewData.outcomeStatus || 'Pending'
          };
          if (currentUser?.id) {
            expPayload.researcher_id = currentUser.id;
          }
          await supabase.from('experiments').insert(expPayload);
        }

        // 3. Update contribution status if Accepted
        if (reviewData.decision === 'Accepted') {
          const isContribUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewData.contributionId);
          if (isContribUuid) {
            await supabase
              .from('contributions')
              .update({ status: 'Accepted', is_verified: true })
              .eq('id', reviewData.contributionId);
          }
        }
      } catch (err) {
        console.warn('[Supabase] Error persisting review and experiment:', err);
      }
    }
  };

  const deleteContribution = async (id: string) => {
    setContributions(prev => prev.filter(c => c.id !== id));
    showToast('Contribution removed', 'info');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contributions').delete().eq('id', id);
      } catch (e) {
        console.warn('[Supabase] Contribution delete error:', e);
      }
    }
  };

  return {
    papers,
    challenges,
    contributions,
    contributors: MOCK_CONTRIBUTORS,
    organizations,
    communityPosts,
    savedPaperIds,
    savedChallengeIds,
    followedContributorIds,
    draftContribution,
    toast,
    toggleSavePaper,
    toggleSaveChallenge,
    toggleFollowContributor,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    saveDraft,
    clearDraft,
    submitContribution,
    recordPeerReviewAndExperiment,
    deleteContribution,
    showToast
  };
}
