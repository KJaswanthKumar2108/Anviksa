import React from 'react';
import { ArrowRight, BookOpen, Target, Sparkles, CheckCircle2, Shield, Users, Award, Building2, Network, ArrowUpRight } from 'lucide-react';
import { LifecycleBanner } from '../components/LifecycleBanner';
import { LogoMark } from '../components/LogoMark';
import { MOCK_CHALLENGES } from '../data/mockData';

interface LandingViewProps {
  onExplore: () => void;
  onJoinCommunity: () => void;
  onSelectChallenge: (challengeId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onExplore,
  onJoinCommunity,
  onSelectChallenge
}) => {
  return (
    <div className="bg-[#FEFAE0] text-[#342F27] min-h-screen">
      
      {/* Public Landing Top Bar */}
      <header className="border-b border-[#DCD5BC] bg-[#FAEDCD] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-8 h-8 shrink-0" />
            <span className="text-lg font-bold tracking-tight text-[#342F27]">Anvīkṣā</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExplore}
              className="text-xs font-semibold text-[#6B6255] hover:text-[#8B5E34] px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onExplore}
              className="px-4 py-2 text-xs font-semibold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Explore Research
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9EDC9] border border-[#DCD5BC] text-[#342F27] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5E34]" />
            <span>The Connected Research Collaboration Platform</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#342F27] tracking-tight leading-tight">
            Turn Research Into Real-World Impact
          </h1>
          
          <p className="mt-4 text-base sm:text-lg text-[#6B6255] leading-relaxed">
            Connect students, researchers, PhD scholars, scientists, and organizations to transform paper limitations into funded challenges, verified experiments, and groundbreaking outcomes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Research Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onJoinCommunity}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-[#342F27] bg-[#FAEDCD] border border-[#DCD5BC] hover:bg-[#E9EDC9] rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join the Community</span>
              <Users className="w-4 h-4 text-[#8B5E34]" />
            </button>
          </div>
        </div>
      </section>

      {/* Visual Explanation of Research Lifecycle */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <LifecycleBanner />
      </section>

      {/* Featured Research Challenges */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#8B5E34] uppercase tracking-wider">Funded Opportunities</span>
            <h2 className="text-2xl font-bold text-[#342F27] mt-1">Featured Research Challenges</h2>
            <p className="text-xs text-[#6B6255] mt-1">Solve critical limitations published by world-class universities and research institutes.</p>
          </div>
          <button
            onClick={onExplore}
            className="mt-4 md:mt-0 text-xs font-bold text-[#8B5E34] hover:text-[#342F27] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Challenges</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CHALLENGES.slice(0, 3).map((challenge) => (
            <div
              key={challenge.id}
              onClick={() => onSelectChallenge(challenge.id)}
              className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] hover:border-[#D4A373] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                    {challenge.category}
                  </span>
                  {challenge.rewardBounty && (
                    <span className="text-[11px] font-mono font-bold text-[#287A50] bg-[#E9EDC9] px-2 py-0.5 rounded border border-[#B8C299]">
                      {challenge.rewardBounty}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-[#342F27] leading-snug line-clamp-2">{challenge.title}</h3>
                <p className="text-xs text-[#6B6255] mt-2 line-clamp-3 leading-relaxed">{challenge.problemStatement}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DCD5BC] flex items-center justify-between text-[11px] text-[#6B6255]">
                <span className="font-medium text-[#342F27]">{challenge.orgName}</span>
                <span className="font-mono">{challenge.contributorCount} Contributors</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-[#E9EDC9] border-y border-[#DCD5BC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#8B5E34] uppercase tracking-wider">Methodology</span>
            <h2 className="text-2xl font-bold text-[#342F27] mt-1">How Anvīkṣā Works</h2>
            <p className="text-xs text-[#6B6255] mt-1">Structured collaboration designed for rigorous scientific verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#CCD5AE] text-[#342F27] flex items-center justify-center font-bold text-lg mb-4 border border-[#B8C299]">
                1
              </div>
              <h3 className="text-sm font-bold text-[#342F27]">Publish or Discover Challenges</h3>
              <p className="text-xs text-[#6B6255] mt-2 leading-relaxed">
                Organizations extract known limitations from literature and formulate scoped challenges with explicit success criteria and grant funding.
              </p>
            </div>

            <div className="p-6 bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#CCD5AE] text-[#342F27] flex items-center justify-center font-bold text-lg mb-4 border border-[#B8C299]">
                2
              </div>
              <h3 className="text-sm font-bold text-[#342F27]">Submit Structured Proposals</h3>
              <p className="text-xs text-[#6B6255] mt-2 leading-relaxed">
                Researchers submit multi-step proposals specifying methodology, open code repositories, benchmark datasets, and known constraints.
              </p>
            </div>

            <div className="p-6 bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#CCD5AE] text-[#342F27] flex items-center justify-center font-bold text-lg mb-4 border border-[#B8C299]">
                3
              </div>
              <h3 className="text-sm font-bold text-[#342F27]">Independent Replication & Outcomes</h3>
              <p className="text-xs text-[#6B6255] mt-2 leading-relaxed">
                Peer reviewers perform independent verification. Successful outcomes are linked to the global research graph and published open access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Researchers and Organizations */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-8 bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#CCD5AE] text-[#8B5E34] flex items-center justify-center mb-4 border border-[#B8C299]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#342F27]">For Researchers & Scholars</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-[#6B6255]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Access funded research challenges from leading global institutions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Gain independent verification for your code, methodologies, and datasets.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Build an evidence-backed researcher profile separated from vanity metrics.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#CCD5AE] text-[#8B5E34] flex items-center justify-center mb-4 border border-[#B8C299]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#342F27]">For Organizations & Institutes</h3>
            <ul className="mt-4 space-y-2.5 text-xs text-[#6B6255]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Crowdsource solutions to persistent technical bottlenecks from global experts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Distribute research grants with full milestone accountability.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                <span>Maintain explicit traceability across the complete research lifecycle.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCD5BC] bg-[#FAEDCD] py-12 text-xs text-[#6B6255]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LogoMark className="w-6 h-6 shrink-0" />
              <span className="font-bold text-[#342F27] text-sm">Anvīkṣā</span>
            </div>
            <p className="text-[11px] text-[#6B6255]">
              An open collaboration platform connecting research papers, challenges, and verified outcomes.
            </p>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button onClick={onExplore} className="hover:text-[#342F27] cursor-pointer">Research Papers</button>
            <button onClick={onExplore} className="hover:text-[#342F27] cursor-pointer">Challenges</button>
            <button onClick={onExplore} className="hover:text-[#342F27] cursor-pointer">Research Graph</button>
            <button onClick={onExplore} className="hover:text-[#342F27] cursor-pointer">Community</button>
          </div>
        </div>
      </footer>

    </div>
  );
};
