import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ContributionModal } from './components/ContributionModal';
import { ChallengeModal } from './components/ChallengeModal';
import { AuthModal } from './components/AuthModal';
import { PaperDetailModal } from './components/PaperDetailModal';
import { ChallengeDetailModal } from './components/ChallengeDetailModal';
import { ReviewAndExperimentModal } from './components/ReviewAndExperimentModal';

// Custom State Store & Supabase Data Hook
import { useResearchStore } from './hooks/useResearchStore';
import { useSupabaseData } from './hooks/useSupabaseData';
import { addLifecycleNodesToGraph } from './utils/researchGraphStore';

// Views
import { LandingView } from './views/LandingView';
import { HomeDashboardView } from './views/HomeDashboardView';
import { PapersView } from './views/PapersView';
import { ChallengesView } from './views/ChallengesView';
import { ResearchGraphView } from './views/ResearchGraphView';
import { ContributorsView } from './views/ContributorsView';
import { OrganizationsView } from './views/OrganizationsView';
import { AiAssistantView } from './views/AiAssistantView';
import { CommunityView } from './views/CommunityView';
import { MyContributionsView } from './views/MyContributionsView';
import { SavedView } from './views/SavedView';
import { SettingsView } from './views/SettingsView';
import { getInitialTheme, applyTheme, ThemeConfig, ThemeMode } from './utils/themeManager';

import { Paper, Challenge, Contribution } from './data/mockData';

export default function App() {
  const [isLandingPage, setIsLandingPage] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Academic Research Theme & Mode State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const initial = getInitialTheme();
    applyTheme(initial.palette, initial.mode);
    return initial;
  });

  const handleToggleThemeMode = () => {
    const nextMode: ThemeMode = themeConfig.mode === 'dark' ? 'light' : 'dark';
    const updated: ThemeConfig = { ...themeConfig, mode: nextMode };
    setThemeConfig(updated);
    applyTheme(updated.palette, updated.mode);
  };

  // Store & Supabase Hooks
  const store = useResearchStore();
  const supabaseData = useSupabaseData();

  // Modals & Selection States
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Proposal Modal State
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [modalChallengeId, setModalChallengeId] = useState<string | undefined>(undefined);
  const [modalPaperId, setModalPaperId] = useState<string | undefined>(undefined);

  // Challenge Modal State (Create / Edit)
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Review & Experiment Verification Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewContribution, setReviewContribution] = useState<Contribution | null>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  const handleOpenContributionModal = (challengeId?: string, paperId?: string) => {
    setModalChallengeId(challengeId);
    setModalPaperId(paperId);
    setIsContributionModalOpen(true);
  };

  const handleNewContributionSuccess = (newContrib: Contribution) => {
    store.submitContribution(newContrib);
    setCurrentTab('my-contributions');
  };

  const handleCreateOrUpdateChallenge = (challengeData: Challenge) => {
    if (editingChallenge) {
      store.updateChallenge(challengeData.id, challengeData);
    } else {
      store.createChallenge(challengeData);
    }
    setEditingChallenge(null);
  };

  const handleExecuteFullEndToEndLifecycle = () => {
    const demoChallenge: Challenge = {
      id: `chal-${Date.now()}`,
      title: 'Reduce Gradient Memory Overhead in Linear Attention Models to O(1)',
      orgId: 'org-1',
      orgName: 'AI Science Foundation',
      orgType: 'Non-Profit',
      category: 'Artificial Intelligence',
      difficulty: 'Grand Challenge',
      status: 'Open',
      rewardBounty: '$50,000 Grant',
      deadline: '2026-11-30',
      problemStatement: 'S2-Kernel achieves linear time O(N) forward pass complexity but requires O(N) backward pass activation storage. Develop a chunked state recomputation kernel reducing activation memory to O(1).',
      researchBackground: 'Extracted from Nature Machine Intelligence (2025).',
      relatedPaperIds: ['paper-1'],
      knownLimitations: ['Gradient checkpointing trades computation time for memory linearly'],
      constraints: ['Exact output equivalence within 1e-4 tolerance'],
      desiredOutcome: 'Peak GPU activation memory allocation reduced to O(1) in 512k context training.',
      contributorCount: 24,
      proposalCount: 9,
      createdAt: 'Just now'
    };

    const demoContrib: Contribution = {
      id: `contrib-${Date.now()}`,
      challengeId: demoChallenge.id,
      challengeTitle: demoChallenge.title,
      paperId: 'paper-1',
      title: 'Backward Recomputation Kernel via Chunked State Space Checkpointing',
      contributorId: 'user-101',
      contributorName: 'Dr. Elena Rostova',
      contributorTitle: 'Senior AI Researcher',
      contributorInstitution: 'ETH Zürich',
      type: 'Methodology',
      summary: 'Chunked recomputation schedule splitting S2-kernel state sequences into fixed blocks, storing only boundary states. Reduces memory from O(N) to O(1).',
      methodology: 'Mathematical derivation of gradient flow through state space matrices combined with custom Triton GPU kernel.',
      attachments: [],
      codeUrl: 'https://github.com/anviksa/s2-chunked-kernel',
      expectedOutcome: 'Peak GPU activation memory allocation reduced from O(N) to O(1).',
      limitations: 'Requires FP32 accumulation.',
      status: 'Published',
      reviewsCount: 12,
      createdAt: 'Just now',
      isVerified: true
    };

    store.createChallenge(demoChallenge);
    store.submitContribution(demoContrib);

    addLifecycleNodesToGraph(
      'Linear Attention S2-Kernel',
      'High GPU activation memory overhead in backward pass',
      demoChallenge,
      demoContrib,
      'NVIDIA H100 512k Context Activation Trial',
      'Independently Replicated'
    );

    store.showToast('Full 8-Step End-to-End Research Lifecycle executed & lineage updated in Research Graph!', 'success');
  };

  const handleCompletePeerReviewAndExperiment = (reviewData: any) => {
    store.showToast(`Peer Review logged: Decision ${reviewData.decision} for proposal`, 'success');

    if (reviewContribution) {
      const targetChallenge = store.challenges[0];
      addLifecycleNodesToGraph(
        'Linear Attention S2-Kernel',
        'High GPU activation memory overhead in backward pass',
        targetChallenge,
        reviewContribution,
        reviewData.experimentTitle,
        reviewData.outcomeStatus
      );
    }
  };

  const handleDeleteChallengePrompt = (challengeId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Research Challenge',
      message: 'Are you sure you want to delete this challenge? This action cannot be undone.',
      action: () => {
        store.deleteChallenge(challengeId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteContributionPrompt = (contribId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Contribution Proposal',
      message: 'Are you sure you want to remove this proposal from your workspace?',
      action: () => {
        store.deleteContribution(contribId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSelectChallengeById = (challengeId: string) => {
    const found = store.challenges.find((c) => c.id === challengeId);
    if (found) {
      setSelectedChallenge(found);
    }
  };

  // Breadcrumb items mapping
  const getBreadcrumbItems = () => {
    const map: Record<string, string> = {
      home: 'Dashboard',
      papers: 'Research Papers',
      challenges: 'Research Challenges',
      graph: 'Research Lifecycle Graph',
      contributors: 'Contributors',
      organizations: 'Organizations & Grantors',
      'ai-assistant': 'AI Research Assistant',
      community: 'Community Feed',
      'my-contributions': 'My Contributions',
      saved: 'Saved',
      settings: 'Settings'
    };
    return [{ label: map[currentTab] || 'Workspace' }];
  };

  if (isLandingPage) {
    return (
      <LandingView
        onExplore={() => { setIsLandingPage(false); setCurrentTab('home'); }}
        onJoinCommunity={() => { setIsLandingPage(false); setCurrentTab('community'); }}
        onSelectChallenge={(id) => {
          setIsLandingPage(false);
          setCurrentTab('challenges');
          handleSelectChallengeById(id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#342F27] flex flex-col font-sans">
      
      {/* Global Toast Alert */}
      <Toast toast={store.toast} />

      {/* Global Confirmation Prompt Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Yes, Delete"
        isDangerous
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenContributionModal={() => handleOpenContributionModal()}
        globalSearchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        onToggleLanding={() => setIsLandingPage(true)}
        currentUser={supabaseData.currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={supabaseData.signOut}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        themeMode={themeConfig.mode}
        onToggleThemeMode={handleToggleThemeMode}
      />

      {/* Main Workspace Shell */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex">
        
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Container */}
        <main className="flex-1 py-6 md:pl-6 min-w-0">
          
          <Breadcrumbs
            items={getBreadcrumbItems()}
            onTabChange={setCurrentTab}
          />

          {currentTab === 'home' && (
            <HomeDashboardView
              onTabChange={setCurrentTab}
              onSelectPaper={(p) => setSelectedPaper(p)}
              onSelectChallenge={(c) => setSelectedChallenge(c)}
              onOpenContributionModal={() => handleOpenContributionModal()}
              onExecuteFullLifecycle={handleExecuteFullEndToEndLifecycle}
              papersCount={store.papers.length}
              openChallengesCount={store.challenges.filter(c => c.status === 'Open').length}
              contributionsCount={store.contributions.length}
              verifiedOutcomesCount={store.contributions.filter(c => c.isVerified || c.status === 'Published').length}
            />
          )}

          {currentTab === 'papers' && (
            <PapersView
              papers={store.papers}
              savedPaperIds={store.savedPaperIds}
              onToggleSavePaper={store.toggleSavePaper}
              onSelectPaper={(p) => setSelectedPaper(p)}
              onOpenContributionModal={(pId) => handleOpenContributionModal(undefined, pId)}
            />
          )}

          {currentTab === 'challenges' && (
            <ChallengesView
              challenges={store.challenges}
              savedChallengeIds={store.savedChallengeIds}
              onToggleSaveChallenge={store.toggleSaveChallenge}
              onSelectChallenge={(c) => setSelectedChallenge(c)}
              onOpenContributionModal={(cId) => handleOpenContributionModal(cId)}
              onOpenCreateChallengeModal={() => { setEditingChallenge(null); setIsChallengeModalOpen(true); }}
              onEditChallenge={(c) => { setEditingChallenge(c); setIsChallengeModalOpen(true); }}
              onDeleteChallenge={handleDeleteChallengePrompt}
            />
          )}

          {currentTab === 'graph' && (
            <ResearchGraphView onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'contributors' && (
            <ContributorsView
              contributors={store.contributors}
              followedContributorIds={store.followedContributorIds}
              onToggleFollowContributor={store.toggleFollowContributor}
            />
          )}

          {currentTab === 'organizations' && (
            <OrganizationsView
              onSelectChallenge={(cId) => {
                setCurrentTab('challenges');
                handleSelectChallengeById(cId);
              }}
            />
          )}

          {currentTab === 'ai-assistant' && (
            <AiAssistantView
              onPublishChallengeSuccess={(c) => {
                store.createChallenge(c);
                setCurrentTab('challenges');
              }}
            />
          )}

          {currentTab === 'community' && (
            <CommunityView />
          )}

          {currentTab === 'my-contributions' && (
            <MyContributionsView
              contributions={store.contributions}
              draftContribution={store.draftContribution}
              onOpenContributionModal={(cId, pId) => handleOpenContributionModal(cId, pId)}
              onClearDraft={store.clearDraft}
              onDeleteContribution={handleDeleteContributionPrompt}
              onOpenReviewModal={(c) => {
                setReviewContribution(c);
                setIsReviewModalOpen(true);
              }}
            />
          )}

          {currentTab === 'saved' && (
            <SavedView
              papers={store.papers}
              challenges={store.challenges}
              savedPaperIds={store.savedPaperIds}
              savedChallengeIds={store.savedChallengeIds}
              onToggleSavePaper={store.toggleSavePaper}
              onToggleSaveChallenge={store.toggleSaveChallenge}
              onSelectPaper={(p) => setSelectedPaper(p)}
              onSelectChallenge={(c) => setSelectedChallenge(c)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              themeConfig={themeConfig}
              onThemeChange={(newConfig) => setThemeConfig(newConfig)}
            />
          )}

        </main>

      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          supabaseData.setCurrentUser(profile);
          store.showToast(`Authenticated as ${profile.display_name || profile.email}`, 'success');
        }}
      />

      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        onSubmitSuccess={handleNewContributionSuccess}
        onSaveDraft={store.saveDraft}
        initialDraft={store.draftContribution}
        preselectedChallengeId={modalChallengeId}
        preselectedPaperId={modalPaperId}
      />

      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onSubmit={handleCreateOrUpdateChallenge}
        initialChallenge={editingChallenge}
      />

      <ReviewAndExperimentModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        contribution={reviewContribution}
        currentUserId={supabaseData.currentUser?.id}
        onCompleteReview={handleCompletePeerReviewAndExperiment}
      />

      <PaperDetailModal
        paper={selectedPaper}
        onClose={() => setSelectedPaper(null)}
        onSelectChallenge={(cId) => {
          setSelectedPaper(null);
          setCurrentTab('challenges');
          handleSelectChallengeById(cId);
        }}
        onOpenContribution={(pId) => {
          setSelectedPaper(null);
          handleOpenContributionModal(undefined, pId);
        }}
      />

      <ChallengeDetailModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
        onOpenContributionModal={(cId) => {
          setSelectedChallenge(null);
          handleOpenContributionModal(cId);
        }}
      />

    </div>
  );
}
