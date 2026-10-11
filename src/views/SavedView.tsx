import React from 'react';
import { Bookmark, FileText, Target, Trash2, ArrowUpRight } from 'lucide-react';
import { Paper, Challenge } from '../data/mockData';

interface SavedViewProps {
  papers: Paper[];
  challenges: Challenge[];
  savedPaperIds: string[];
  savedChallengeIds: string[];
  onToggleSavePaper: (paperId: string) => void;
  onToggleSaveChallenge: (challengeId: string) => void;
  onSelectPaper: (paper: Paper) => void;
  onSelectChallenge: (challenge: Challenge) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  papers,
  challenges,
  savedPaperIds,
  savedChallengeIds,
  onToggleSavePaper,
  onToggleSaveChallenge,
  onSelectPaper,
  onSelectChallenge
}) => {
  const savedPapers = papers.filter(p => savedPaperIds.includes(p.id));
  const savedChallenges = challenges.filter(c => savedChallengeIds.includes(c.id));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <h1 className="text-xl font-bold text-[#342F27]">Saved</h1>
        <p className="text-xs text-[#6B6255] mt-1">
          Your bookmarked research papers, open challenges, and active grants for quick access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs items-stretch">
        
        {/* Saved Papers Collection */}
        <div className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs space-y-4 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
              <h3 className="font-bold text-[#342F27] text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8B5E34]" />
                <span>Saved Research Papers ({savedPapers.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {savedPapers.map((paper) => (
                <div key={paper.id} className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8B5E34] font-bold">DOI: {paper.doi}</span>
                    <button
                      onClick={() => onToggleSavePaper(paper.id)}
                      className="p-1 text-[#6B6255] hover:text-[#B83A32] transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4
                    onClick={() => onSelectPaper(paper)}
                    className="font-bold text-[#342F27] hover:text-[#8B5E34] cursor-pointer leading-snug"
                  >
                    {paper.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#6B6255] pt-1 border-t border-[#DCD5BC]">
                    <span>{paper.journal} ({paper.year})</span>
                    <button
                      onClick={() => onSelectPaper(paper)}
                      className="text-[#8B5E34] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {savedPapers.length === 0 && (
                <div className="p-8 text-center text-[#6B6255]">
                  No papers saved to bookmarks yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Challenges Collection */}
        <div className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs space-y-4 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
              <h3 className="font-bold text-[#342F27] text-sm flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#8B5E34]" />
                <span>Saved Research Challenges ({savedChallenges.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {savedChallenges.map((challenge) => (
                <div key={challenge.id} className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                      {challenge.category}
                    </span>
                    <button
                      onClick={() => onToggleSaveChallenge(challenge.id)}
                      className="p-1 text-[#6B6255] hover:text-[#B83A32] transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4
                    onClick={() => onSelectChallenge(challenge)}
                    className="font-bold text-[#342F27] hover:text-[#8B5E34] cursor-pointer leading-snug"
                  >
                    {challenge.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#6B6255] pt-1 border-t border-[#DCD5BC]">
                    <span>{challenge.orgName} · Grant: {challenge.rewardBounty}</span>
                    <button
                      onClick={() => onSelectChallenge(challenge)}
                      className="text-[#8B5E34] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {savedChallenges.length === 0 && (
                <div className="p-8 text-center text-[#6B6255]">
                  No challenges saved to bookmarks yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
