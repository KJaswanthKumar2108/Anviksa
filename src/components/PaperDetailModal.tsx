import React from 'react';
import { X, ExternalLink, FileText, AlertTriangle, Target, Bookmark, Share2, Quote } from 'lucide-react';
import { Paper } from '../data/mockData';

interface PaperDetailModalProps {
  paper: Paper | null;
  onClose: () => void;
  onSelectChallenge?: (challengeId: string) => void;
  onOpenContribution?: (paperId: string) => void;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({
  paper,
  onClose,
  onSelectChallenge,
  onOpenContribution
}) => {
  if (!paper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] px-2 py-0.5 rounded">
              DOI: {paper.doi}
            </span>
            {paper.openAccess && (
              <span className="text-[10px] font-semibold bg-[#287A50]/15 text-[#287A50] border border-[#287A50]/30 px-2 py-0.5 rounded">
                Open Access
              </span>
            )}
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
          
          {/* Title & Metadata */}
          <div>
            <div className="text-[11px] text-[#6B6255] font-medium mb-1">
              <span>{paper.journal}</span> · <span>Published {paper.year}</span> · <span>{paper.readTime}</span>
            </div>
            <h2 className="text-xl font-bold text-[#342F27] leading-snug">{paper.title}</h2>
            <div className="mt-2 text-xs font-medium text-[#6B6255] flex flex-wrap gap-x-2 gap-y-1">
              {paper.authors.map((author, i) => (
                <span key={i} className="hover:text-[#8B5E34] cursor-pointer">
                  {author}{i < paper.authors.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Subject Tags */}
          <div className="flex flex-wrap gap-1.5">
            {paper.subjectTags.map((tag) => (
              <span key={tag} className="text-[11px] bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] px-2.5 py-0.5 rounded-md font-semibold">
                {tag}
              </span>
            ))}
          </div>

          {/* Abstract */}
          <div className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC]">
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#8B5E34]" />
              <span>Abstract</span>
            </h4>
            <p className="text-[#342F27] text-xs leading-relaxed">{paper.abstract}</p>
          </div>

          {/* Known Limitations Identified */}
          <div className="bg-[#E9EDC9] p-4 rounded-xl border border-[#DCD5BC]">
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#986515]" />
              <span>Reported Limitations & Open Research Gaps</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[#342F27] text-xs">
              {paper.limitations.map((lim, idx) => (
                <li key={idx} className="leading-relaxed">{lim}</li>
              ))}
            </ul>
          </div>

          {/* Linked Challenges */}
          {paper.linkedChallengeIds.length > 0 && (
            <div className="p-4 rounded-xl border border-[#B8C299] bg-[#CCD5AE]/30">
              <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#8B5E34]" />
                <span>Associated Active Research Challenges</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {paper.linkedChallengeIds.map((cId) => (
                  <button
                    key={cId}
                    onClick={() => onSelectChallenge?.(cId)}
                    className="text-xs font-semibold text-[#342F27] bg-[#FEFAE0] border border-[#DCD5BC] hover:bg-[#E9EDC9] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Challenge ({cId})</span>
                    <ExternalLink className="w-3 h-3 text-[#8B5E34]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Citations & Metrics */}
          <div className="flex items-center justify-between p-3 bg-[#E9EDC9] rounded-xl text-[#6B6255] font-mono text-[11px] border border-[#DCD5BC]">
            <div>
              <span className="font-bold text-[#342F27]">{paper.citationsCount}</span> Citations tracked
            </div>
            <div>
              Field: <span className="font-semibold text-[#342F27]">{paper.field}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#DCD5BC] bg-[#E9EDC9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="p-2 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <button
            onClick={() => { onClose(); onOpenContribution?.(paper.id); }}
            className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            Submit Proposal on this Paper
          </button>
        </div>

      </div>
    </div>
  );
};
