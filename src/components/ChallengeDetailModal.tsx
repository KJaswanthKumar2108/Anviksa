import React from 'react';
import { X, Building2, Calendar, Target, AlertTriangle, CheckCircle2, Award, Users, GitPullRequest, ArrowUpRight } from 'lucide-react';
import { Challenge } from '../data/mockData';

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  onClose: () => void;
  onOpenContributionModal: (challengeId: string) => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  onClose,
  onOpenContributionModal
}) => {
  if (!challenge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CCD5AE] flex items-center justify-center font-bold text-[#342F27] border border-[#B8C299]">
              <Target className="w-5 h-5 text-[#8B5E34]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                  {challenge.category}
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#D4A373] text-[#342F27] px-2 py-0.5 rounded border border-[#C59465]">
                  {challenge.difficulty}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#342F27] mt-0.5">{challenge.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-[#342F27]">
          
          {/* Org & Bounty Bar */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] gap-4">
            <div className="flex items-center gap-3">
              {challenge.orgLogo ? (
                <img src={challenge.orgLogo} alt={challenge.orgName} className="w-10 h-10 rounded-lg object-cover border border-[#DCD5BC]" />
              ) : (
                <Building2 className="w-8 h-8 text-[#6B6255]" />
              )}
              <div>
                <span className="text-[10px] font-bold text-[#6B6255] uppercase">Publishing Organization</span>
                <p className="font-bold text-[#342F27] text-xs">{challenge.orgName}</p>
                <span className="text-[11px] text-[#6B6255]">{challenge.orgType}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              {challenge.rewardBounty && (
                <div className="bg-[#CCD5AE] text-[#342F27] px-3 py-1.5 rounded-lg border border-[#B8C299] text-center">
                  <span className="block text-[10px] uppercase font-sans font-bold opacity-75">Grant / Bounty</span>
                  <span className="font-bold text-sm">{challenge.rewardBounty}</span>
                </div>
              )}
              <div>
                <span className="block text-[10px] font-sans text-[#6B6255] uppercase font-bold">Deadline</span>
                <span className="font-semibold text-[#342F27]">{challenge.deadline}</span>
              </div>
            </div>
          </div>

          {/* Problem Statement */}
          <div>
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Problem Statement</h4>
            <p className="text-[#342F27] leading-relaxed bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] text-xs">
              {challenge.problemStatement}
            </p>
          </div>

          {/* Research Background */}
          <div>
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Research Background & Context</h4>
            <p className="text-[#6B6255] leading-relaxed bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] text-xs">
              {challenge.researchBackground}
            </p>
          </div>

          {/* Known Limitations */}
          <div className="bg-[#E9EDC9] p-4 rounded-xl border border-[#DCD5BC]">
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#986515]" />
              <span>Known Limitations to Overcome</span>
            </h4>
            <ul className="space-y-1 list-disc list-inside text-[#342F27] text-xs">
              {challenge.knownLimitations.map((lim, idx) => (
                <li key={idx} className="leading-relaxed">{lim}</li>
              ))}
            </ul>
          </div>

          {/* Constraints & Success Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC]">
              <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Constraints & Tolerances</h4>
              <ul className="space-y-1.5 list-disc list-inside text-[#6B6255] text-xs">
                {challenge.constraints.map((cons, idx) => (
                  <li key={idx} className="leading-relaxed">{cons}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#CCD5AE]/40 p-4 rounded-xl border border-[#B8C299]">
              <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#287A50]" />
                <span>Desired Research Outcome</span>
              </h4>
              <p className="text-[#342F27] leading-relaxed text-xs">
                {challenge.desiredOutcome}
              </p>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="flex items-center gap-6 p-3 bg-[#E9EDC9] rounded-xl text-[#6B6255] font-mono text-[11px] border border-[#DCD5BC]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#8B5E34]" />
              <span><strong className="text-[#342F27]">{challenge.contributorCount}</strong> Active Contributors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-[#8B5E34]" />
              <span><strong className="text-[#342F27]">{challenge.proposalCount}</strong> Submitted Proposals</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#DCD5BC] bg-[#E9EDC9] flex items-center justify-between">
          <span className="text-[11px] text-[#6B6255]">Status: <strong className="text-[#342F27]">{challenge.status}</strong></span>
          <button
            onClick={() => { onClose(); onOpenContributionModal(challenge.id); }}
            className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Submit Proposal for this Challenge</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
