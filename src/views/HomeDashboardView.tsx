import React, { useState } from 'react';
import { Search, PlusCircle, Target, FileText, ArrowRight, Sparkles, Activity, Shield, Users, GitPullRequest, ExternalLink } from 'lucide-react';
import { MOCK_PAPERS, MOCK_CHALLENGES, MOCK_ACTIVITY, Paper, Challenge } from '../data/mockData';
import { LifecycleBanner } from '../components/LifecycleBanner';
import { EndToEndLifecycleRunner } from '../components/EndToEndLifecycleRunner';

interface HomeDashboardViewProps {
  onTabChange: (tab: string) => void;
  onSelectPaper: (paper: Paper) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onOpenContributionModal: () => void;
  onExecuteFullLifecycle: () => void;
  papersCount?: number;
  openChallengesCount?: number;
  contributionsCount?: number;
  verifiedOutcomesCount?: number;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onTabChange,
  onSelectPaper,
  onSelectChallenge,
  onOpenContributionModal,
  onExecuteFullLifecycle,
  papersCount = 5,
  openChallengesCount = 6,
  contributionsCount = 3,
  verifiedOutcomesCount = 2
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPapers = MOCK_PAPERS.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.field.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = MOCK_CHALLENGES.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner & Quick Action */}
      <div className="bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2.5 py-0.5 rounded-full border border-[#B8C299] uppercase tracking-wider">
                Researcher Workbench
              </span>
              <span className="text-xs text-[#DCD5BC]">·</span>
              <span className="text-xs text-[#6B6255] font-medium">Welcome back, Dr. Elena Rostova</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#342F27] tracking-tight">
              Collaborative Open Research Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6255] mt-1 max-w-2xl leading-relaxed">
              Address published limitations, submit empirical proposals, and track verified outcomes across the connected science pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenContributionModal}
              className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Contribution</span>
            </button>
            <button
              onClick={() => onTabChange('challenges')}
              className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#8B5E34]" />
              <span>Publish Challenge</span>
            </button>
          </div>
        </div>

        {/* Search across Papers & Challenges */}
        <div className="mt-6 pt-5 border-t border-[#DCD5BC]">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
            <input
              type="text"
              placeholder="Search across indexed research papers, DOIs, open challenges, or grant bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] focus:bg-white text-[#342F27] placeholder-[#6B6255] transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Interactive 8-Step End-to-End Lifecycle Scenario Demonstrator */}
      <EndToEndLifecycleRunner
        onExecuteFullLifecycle={onExecuteFullLifecycle}
        onNavigateTab={onTabChange}
      />

      {/* Quick Stats Grid - Computed Dynamically */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC] shadow-2xs">
          <div className="flex items-center justify-between text-[#6B6255] mb-1">
            <span>Indexed Papers</span>
            <FileText className="w-4 h-4 text-[#8B5E34]" />
          </div>
          <span className="text-xl font-bold text-[#342F27] font-mono">{papersCount}</span>
          <span className="text-[10px] text-[#6B6255] block mt-0.5 font-medium">Persisted records</span>
        </div>

        <div className="bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC] shadow-2xs">
          <div className="flex items-center justify-between text-[#6B6255] mb-1">
            <span>Open Challenges</span>
            <Target className="w-4 h-4 text-[#8B5E34]" />
          </div>
          <span className="text-xl font-bold text-[#342F27] font-mono">{openChallengesCount}</span>
          <span className="text-[10px] text-[#6B6255] block mt-0.5">Active funding opportunities</span>
        </div>

        <div className="bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC] shadow-2xs">
          <div className="flex items-center justify-between text-[#6B6255] mb-1">
            <span>Proposals & Contributions</span>
            <GitPullRequest className="w-4 h-4 text-[#8B5E34]" />
          </div>
          <span className="text-xl font-bold text-[#342F27] font-mono">{contributionsCount}</span>
          <span className="text-[10px] text-[#6B6255] block mt-0.5 font-medium">Under review / active</span>
        </div>

        <div className="bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC] shadow-2xs">
          <div className="flex items-center justify-between text-[#6B6255] mb-1">
            <span>Verified Outcomes</span>
            <Shield className="w-4 h-4 text-[#287A50]" />
          </div>
          <span className="text-xl font-bold text-[#342F27] font-mono">{verifiedOutcomesCount}</span>
          <span className="text-[10px] text-[#287A50] block mt-0.5 font-medium">Independently replicated</span>
        </div>
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Featured Papers & Active Challenges */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Challenges Section */}
          <div className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#342F27]">Active Research Challenges</h3>
                <p className="text-[11px] text-[#6B6255]">Funded problems seeking empirical contributions</p>
              </div>
              <button
                onClick={() => onTabChange('challenges')}
                className="text-xs font-semibold text-[#8B5E34] hover:text-[#342F27] flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredChallenges.slice(0, 3).map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => onSelectChallenge(challenge)}
                  className="p-4 rounded-xl border border-[#DCD5BC] bg-[#FEFAE0] hover:border-[#D4A373] hover:bg-[#E9EDC9]/50 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                      {challenge.category}
                    </span>
                    {challenge.rewardBounty && (
                      <span className="text-[10px] font-mono font-bold text-[#342F27] bg-[#D4A373] px-2 py-0.5 rounded border border-[#C59465]">
                        {challenge.rewardBounty}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-[#342F27] text-sm leading-snug">{challenge.title}</h4>
                  <p className="text-[#6B6255] mt-1 line-clamp-2 text-xs leading-relaxed">{challenge.problemStatement}</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-[#DCD5BC] flex items-center justify-between text-[10px] text-[#6B6255]">
                    <span>Org: <strong className="text-[#342F27]">{challenge.orgName}</strong></span>
                    <span className="font-mono">{challenge.proposalCount} Proposals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Research Papers */}
          <div className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#342F27]">Featured Research Papers</h3>
                <p className="text-[11px] text-[#6B6255]">Papers with documented limitations ready for exploration</p>
              </div>
              <button
                onClick={() => onTabChange('papers')}
                className="text-xs font-semibold text-[#8B5E34] hover:text-[#342F27] flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredPapers.slice(0, 3).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="p-4 rounded-xl border border-[#DCD5BC] bg-[#FEFAE0] hover:border-[#D4A373] hover:bg-[#E9EDC9]/50 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#6B6255]">
                    <span className="font-mono font-bold text-[#8B5E34]">DOI: {paper.doi}</span>
                    <span>{paper.journal} ({paper.year})</span>
                  </div>
                  <h4 className="font-bold text-[#342F27] text-sm leading-snug">{paper.title}</h4>
                  <p className="text-[#6B6255] mt-1 line-clamp-2 text-xs leading-relaxed">{paper.abstract}</p>

                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {paper.limitations.slice(0, 1).map((lim, i) => (
                      <span key={i} className="text-[10px] bg-[#CCD5AE]/50 text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299] font-medium truncate max-w-md">
                        Limitation: {lim}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Activity Feed & AI Assistant Card */}
        <div className="space-y-6">
          
          {/* AI Assistant Quick Card */}
          <div className="bg-[#E9EDC9] border border-[#DCD5BC] text-[#342F27] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#8B5E34]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E34] font-mono">Gemma / Gemini Workbench</span>
            </div>
            <h3 className="text-base font-bold text-[#342F27]">Discover Unresolved Research Gaps</h3>
            <p className="text-xs text-[#6B6255] mt-1.5 leading-relaxed">
              Use Gemini AI to analyze papers, extract author limitations, draft challenges, and match contributors.
            </p>
            <button
              onClick={() => onTabChange('ai-assistant')}
              className="mt-4 w-full py-2 px-3 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Launch AI Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Community Activity */}
          <div className="bg-[#FAEDCD] rounded-2xl p-5 border border-[#DCD5BC] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>Community Activity</span>
              </h3>
              <button
                onClick={() => onTabChange('community')}
                className="text-[11px] font-semibold text-[#8B5E34] hover:underline cursor-pointer"
              >
                Feed
              </button>
            </div>

            <div className="space-y-3 divide-y divide-[#DCD5BC] text-xs">
              {MOCK_ACTIVITY.map((act) => (
                <div key={act.id} className="pt-3 first:pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={act.authorAvatar} alt={act.authorName} className="w-5 h-5 rounded-full object-cover border border-[#DCD5BC]" />
                    <span className="font-bold text-[#342F27] text-[11px]">{act.authorName}</span>
                    <span className="text-[10px] text-[#6B6255] ml-auto">{act.timestamp}</span>
                  </div>
                  <p className="text-[#6B6255] text-[11px] leading-snug">
                    {act.action} <strong className="text-[#342F27]">{act.targetTitle}</strong>
                  </p>
                  <p className="text-[#6B6255] text-[10px] mt-1 bg-[#FEFAE0] p-2 rounded-lg border border-[#DCD5BC] line-clamp-2">
                    "{act.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
