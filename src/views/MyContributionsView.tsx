import React, { useState } from 'react';
import { GitPullRequest, Beaker, CheckCircle2, Clock, PlusCircle, ExternalLink, Shield, Trash2, Edit3, Award, Star } from 'lucide-react';
import { Contribution } from '../data/mockData';

interface MyContributionsViewProps {
  contributions: Contribution[];
  draftContribution: Partial<Contribution> | null;
  onOpenContributionModal: (challengeId?: string, paperId?: string) => void;
  onClearDraft: () => void;
  onDeleteContribution: (id: string) => void;
  onOpenReviewModal: (contribution: Contribution) => void;
}

export const MyContributionsView: React.FC<MyContributionsViewProps> = ({
  contributions,
  draftContribution,
  onOpenContributionModal,
  onClearDraft,
  onDeleteContribution,
  onOpenReviewModal
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">My Contributions & Proposals</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Track submitted methodologies, peer review decisions, empirical trial outcomes, and independent replications.
            </p>
          </div>
          <button
            onClick={() => onOpenContributionModal()}
            className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Proposal</span>
          </button>
        </div>
      </div>

      {/* Saved Draft Alert Box if draft exists */}
      {draftContribution && (
        <div className="bg-[#E9EDC9] border border-[#DCD5BC] rounded-2xl p-5 text-xs text-[#342F27] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299] font-mono">
                Unsaved Draft
              </span>
              <span className="text-[10px] text-[#8B5E34] font-mono">Resume where you left off</span>
            </div>
            <h4 className="font-bold text-sm text-[#342F27]">{draftContribution.title || 'Untitled Proposal Draft'}</h4>
            <p className="text-[#6B6255] mt-0.5 line-clamp-1">{draftContribution.summary || 'No summary entered yet.'}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClearDraft}
              className="px-3 py-1.5 text-xs font-semibold text-[#6B6255] hover:text-[#B83A32] bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg transition-colors cursor-pointer"
            >
              Discard Draft
            </button>
            <button
              onClick={() => onOpenContributionModal(draftContribution.challengeId, draftContribution.paperId)}
              className="px-4 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Resume Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Contributions Tracker List */}
      <div className="space-y-4 text-xs">
        {contributions.map((c) => (
          <div key={c.id} className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs space-y-3">
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299] font-mono">
                  {c.type}
                </span>
                {c.isVerified && (
                  <span className="text-[10px] font-semibold bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded border border-[#B8C299] inline-flex items-center gap-1 font-mono">
                    <Shield className="w-3 h-3 text-[#287A50]" />
                    <span>[INDEPENDENTLY REPLICATED]</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  c.status === 'Accepted' || c.status === 'Published'
                    ? 'bg-[#E9EDC9] text-[#287A50] border-[#B8C299]'
                    : 'bg-[#CCD5AE] text-[#986515] border-[#B8C299]'
                }`}>
                  Status: {c.status}
                </span>

                <button
                  onClick={() => onDeleteContribution(c.id)}
                  className="p-1 text-[#6B6255] hover:text-[#B83A32] transition-colors cursor-pointer"
                  title="Remove Proposal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-[#342F27] text-sm">{c.title}</h3>
            {c.challengeTitle && (
              <p className="text-[#6B6255] text-xs">Target Challenge: <strong className="text-[#342F27]">{c.challengeTitle}</strong></p>
            )}

            <p className="text-[#342F27] bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC] leading-relaxed">
              {c.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC]">
                <span className="font-bold text-[#342F27] block mb-0.5">Expected Scientific Outcome:</span>
                <p className="text-[#6B6255] text-[11px]">{c.expectedOutcome}</p>
              </div>
              <div className="bg-[#E9EDC9] p-3 rounded-xl border border-[#DCD5BC]">
                <span className="font-bold text-[#8B5E34] block mb-0.5">Known Constraints:</span>
                <p className="text-[#342F27] text-[11px]">{c.limitations}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCD5BC] text-[11px] text-[#6B6255]">
              <span>Submitted: {c.createdAt} · {c.reviewsCount} Peer Reviews</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenReviewModal(c)}
                  className="px-3 py-1.5 text-xs font-bold text-[#342F27] bg-[#CCD5AE] hover:bg-[#D4A373] hover:text-white border border-[#B8C299] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Star className="w-3.5 h-3.5 text-[#8B5E34]" />
                  <span>Review & Record Trial Outcome</span>
                </button>

                {c.codeUrl && (
                  <a href={c.codeUrl} target="_blank" rel="noreferrer" className="text-[#8B5E34] font-medium hover:underline inline-flex items-center gap-1">
                    <span>View Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

          </div>
        ))}

        {contributions.length === 0 && !draftContribution && (
          <div className="bg-[#FAEDCD] p-12 text-center rounded-2xl border border-[#DCD5BC] text-[#6B6255]">
            You haven't submitted any research proposals yet.
          </div>
        )}
      </div>

    </div>
  );
};
