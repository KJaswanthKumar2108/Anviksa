import React, { useState } from 'react';
import { Search, PlusCircle, Target, FileText, ArrowRight, Sparkles, Activity, Shield, Users, GitPullRequest, ExternalLink } from 'lucide-react';
import { Paper, Challenge, ActivityItem } from '../data/mockData';
import { LifecycleBanner } from '../components/LifecycleBanner';
import { EndToEndLifecycleRunner } from '../components/EndToEndLifecycleRunner';

interface HomeDashboardViewProps {
  onTabChange: (tab: string) => void;
  onSelectPaper: (paper: Paper) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onOpenContributionModal: () => void;
  onExecuteFullLifecycle: () => void;
  papers?: Paper[];
  challenges?: Challenge[];
  communityPosts?: ActivityItem[];
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
  papers = [],
  challenges = [],
  communityPosts = [],
  papersCount = 6,
  openChallengesCount = 5,
  contributionsCount = 0,
  verifiedOutcomesCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.field.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = challenges.filter(c =>
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
                Open Science & Research Intelligence
              </span>
              <span className="text-[10px] text-[#6B6255] font-mono">Ledger v2.4</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#342F27]">
              Anvīkṣā Scientific Research Workspace
            </h1>
            <p className="text-xs text-[#6B6255] mt-1 max-w-2xl leading-relaxed">
              Explore authentic peer-reviewed literature, turn published limitations into solvable challenges, and coordinate experimental verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenContributionModal}
              className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Proposal</span>
            </button>
            <button
              onClick={() => onTabChange('graph')}
              className="px-4 py-2 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <GitPullRequest className="w-4 h-4 text-[#8B5E34]" />
              <span>Explore Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Interactive End-to-End Lifecycle Banner */}
      <LifecycleBanner onStepClick={(step) => onTabChange(step === 'paper' ? 'papers' : step === 'challenge' ? 'challenges' : 'graph')} />

      {/* 8-Step Interactive Lifecycle Demonstrator */}
      <EndToEndLifecycleRunner onExecuteFullLifecycle={onExecuteFullLifecycle} onNavigateTab={onTabChange} />

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Published Papers', value: papersCount, sub: 'Peer-reviewed literature', icon: FileText, color: 'text-[#8B5E34]' },
          { label: 'Open Challenges', value: openChallengesCount, sub: 'Active research gaps', icon: Target, color: 'text-[#342F27]' },
          { label: 'Research Proposals', value: contributionsCount, sub: 'Independent submissions', icon: GitPullRequest, color: 'text-[#8B5E34]' },
          { label: 'Verified Outcomes', value: verifiedOutcomesCount, sub: 'Replicated solutions', icon: Shield, color: 'text-[#287A50]' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#FAEDCD] p-4 rounded-2xl border border-[#DCD5BC] shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E9EDC9] border border-[#DCD5BC] flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#6B6255] block">{stat.label}</span>
                <span className="text-xl font-bold text-[#342F27] leading-tight block">{stat.value}</span>
                <span className="text-[10px] text-[#6B6255] block font-mono">{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Papers & Challenges Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Papers & Grand Challenges */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Research Papers List */}
          <div className="bg-[#FAEDCD] rounded-2xl p-5 border border-[#DCD5BC] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8B5E34]" />
                  <span>Published Literature</span>
                </h3>
                <p className="text-[11px] text-[#6B6255]">
                  Authentic peer-reviewed publications across AI, Genomics, and Quantum Physics.
                </p>
              </div>
              <button
                onClick={() => onTabChange('papers')}
                className="text-xs font-semibold text-[#8B5E34] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({papers.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredPapers.slice(0, 3).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] hover:border-[#D4A373] transition-all cursor-pointer space-y-2 shadow-2xs group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#8B5E34] font-semibold text-[10px]">DOI: {paper.doi}</span>
                    <span className="text-[#6B6255]">{paper.journal} · {paper.year}</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#342F27] group-hover:text-[#8B5E34] transition-colors leading-snug">
                    {paper.title}
                  </h4>
                  <p className="text-[11px] text-[#6B6255] line-clamp-2 leading-relaxed">
                    {paper.abstract}
                  </p>
                  
                  {/* Stated Limitations Pill */}
                  {paper.limitations && paper.limitations.length > 0 && (
                    <div className="pt-2 border-t border-[#DCD5BC] flex items-center gap-1.5 text-[10px] text-[#986515]">
                      <span className="font-bold uppercase tracking-wider font-mono">Known Limitation:</span>
                      <span className="truncate italic">"{paper.limitations[0]}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Open Grand Challenges */}
          <div className="bg-[#FAEDCD] rounded-2xl p-5 border border-[#DCD5BC] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#8B5E34]" />
                  <span>Open Research Challenges & Bounties</span>
                </h3>
                <p className="text-[11px] text-[#6B6255]">
                  Sponsored problem statements published to address known limitations.
                </p>
              </div>
              <button
                onClick={() => onTabChange('challenges')}
                className="text-xs font-semibold text-[#8B5E34] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({challenges.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredChallenges.slice(0, 3).map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => onSelectChallenge(challenge)}
                  className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] hover:border-[#D4A373] transition-all cursor-pointer space-y-2 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                      {challenge.category}
                    </span>
                    <span className="text-[11px] font-bold text-[#287A50] font-mono">
                      {challenge.rewardBounty}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[#342F27] group-hover:text-[#8B5E34] transition-colors leading-snug">
                    {challenge.title}
                  </h4>

                  <p className="text-[11px] text-[#6B6255] line-clamp-2 leading-relaxed">
                    {challenge.problemStatement}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#DCD5BC] text-[10px] text-[#6B6255]">
                    <span>Host: <strong>{challenge.orgName}</strong></span>
                    <span>Deadline: <strong>{challenge.deadline}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: AI Intelligence & Live Community Activity */}
        <div className="space-y-6">
          
          {/* AI Intelligence Card */}
          <div className="bg-[#FAEDCD] rounded-2xl p-5 border border-[#DCD5BC] shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#E9EDC9] border border-[#DCD5BC] flex items-center justify-center text-[#8B5E34]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#342F27]">Literature Intelligence</h3>
                <p className="text-[10px] text-[#6B6255]">Extract limitations & draft proposals</p>
              </div>
            </div>

            <p className="text-[11px] text-[#342F27] bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC] leading-relaxed">
              Use Gemini AI to extract claims, separate author limitations from inferred hypotheses, and auto-draft challenge specifications.
            </p>

            <button
              onClick={() => onTabChange('ai-assistant')}
              className="mt-4 w-full py-2 px-3 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Launch AI Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Genuine Community Feed */}
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
              {communityPosts.length > 0 ? (
                communityPosts.slice(0, 4).map((act) => (
                  <div key={act.id} className="pt-3 first:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full border border-[#DCD5BC] bg-[#CCD5AE] flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-[#342F27]" />
                      </span>
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
                ))
              ) : (
                <div className="py-6 text-center text-[#6B6255] space-y-2">
                  <p className="text-[11px]">No user activity yet in community feed.</p>
                  <button
                    onClick={() => onTabChange('community')}
                    className="text-xs font-bold text-[#8B5E34] hover:underline cursor-pointer"
                  >
                    Start the first discussion thread →
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
