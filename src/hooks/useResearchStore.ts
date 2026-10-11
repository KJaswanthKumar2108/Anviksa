import { useState, useEffect } from 'react';
import {
  MOCK_PAPERS,
  MOCK_CHALLENGES,
  MOCK_CONTRIBUTIONS,
  MOCK_CONTRIBUTORS,
  MOCK_ORGANIZATIONS,
  Paper,
  Challenge,
  Contribution,
  Contributor
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

export function useResearchStore() {
  // Saved Item IDs
  const [savedPaperIds, setSavedPaperIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_PAPERS);
      return stored ? JSON.parse(stored) : ['paper-1'];
    } catch {
      return ['paper-1'];
    }
  });

  const [savedChallengeIds, setSavedChallengeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_CHALLENGES);
      return stored ? JSON.parse(stored) : ['chal-1'];
    } catch {
      return ['chal-1'];
    }
  });

  // Followed Contributors
  const [followedContributorIds, setFollowedContributorIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_FOLLOWED);
      return stored ? JSON.parse(stored) : ['user-101'];
    } catch {
      return ['user-101'];
    }
  });

  // Custom Local Challenges (merged with base mock challenges)
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CHALLENGES);
      if (stored) {
        const custom: Challenge[] = JSON.parse(stored);
        // Merge custom with mock, keeping custom at top
        const mockMap = new Map(MOCK_CHALLENGES.map(c => [c.id, c]));
        custom.forEach(c => mockMap.set(c.id, c));
        return Array.from(mockMap.values());
      }
    } catch {}
    return MOCK_CHALLENGES;
  });

  // Contributions (merged with mock)
  const [contributions, setContributions] = useState<Contribution[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CONTRIBUTIONS);
      if (stored) {
        const custom: Contribution[] = JSON.parse(stored);
        const mockMap = new Map(MOCK_CONTRIBUTIONS.map(c => [c.id, c]));
        custom.forEach(c => mockMap.set(c.id, c));
        return Array.from(mockMap.values());
      }
    } catch {}
    return MOCK_CONTRIBUTIONS;
  });

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

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3200);
  };

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

  // Actions
  const toggleSavePaper = (paperId: string) => {
    if (savedPaperIds.includes(paperId)) {
      setSavedPaperIds(prev => prev.filter(id => id !== paperId));
      showToast('Paper removed from Saved', 'info');
    } else {
      setSavedPaperIds(prev => [...prev, paperId]);
      showToast('Paper saved to Saved bookmarks', 'success');
    }
  };

  const toggleSaveChallenge = (challengeId: string) => {
    if (savedChallengeIds.includes(challengeId)) {
      setSavedChallengeIds(prev => prev.filter(id => id !== challengeId));
      showToast('Challenge removed from Saved', 'info');
    } else {
      setSavedChallengeIds(prev => [...prev, challengeId]);
      showToast('Challenge bookmarked to Saved', 'success');
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

  const createChallenge = (newChallenge: Challenge) => {
    setChallenges(prev => deduplicateById([newChallenge, ...prev]));
    showToast('Research challenge published successfully!', 'success');
  };

  const updateChallenge = (id: string, updatedFields: Partial<Challenge>) => {
    setChallenges(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    showToast('Challenge details updated', 'success');
  };

  const deleteChallenge = (id: string) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
    showToast('Challenge deleted', 'info');
  };

  const saveDraft = (draft: Partial<Contribution>) => {
    setDraftContribution(draft);
    showToast('Proposal draft saved to local workspace', 'info');
  };

  const clearDraft = () => {
    setDraftContribution(null);
  };

  const submitContribution = (newContrib: Contribution) => {
    setContributions(prev => deduplicateById([newContrib, ...prev]));
    setDraftContribution(null);
    showToast('Proposal submitted successfully to peer reviewers!', 'success');
  };

  const deleteContribution = (id: string) => {
    setContributions(prev => prev.filter(c => c.id !== id));
    showToast('Contribution removed', 'info');
  };

  return {
    papers: MOCK_PAPERS,
    challenges,
    contributions,
    contributors: MOCK_CONTRIBUTORS,
    organizations: MOCK_ORGANIZATIONS,
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
    deleteContribution,
    showToast
  };
}
