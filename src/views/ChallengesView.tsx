import React, { useState } from 'react';
import { Search, Target, Building2, Calendar, Users, GitPullRequest, ArrowUpRight, Award, PlusCircle, Bookmark, Edit, Trash2 } from 'lucide-react';
import { Challenge } from '../data/mockData';

interface ChallengesViewProps {
  challenges: Challenge[];
  savedChallengeIds: string[];
  onToggleSaveChallenge: (challengeId: string) => void;
  onSelectChallenge: (challenge: Challenge) => void;
  onOpenContributionModal: (challengeId: string) => void;
  onOpenCreateChallengeModal: () => void;
  onEditChallenge: (challenge: Challenge) => void;
  onDeleteChallenge: (challengeId: string) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  savedChallengeIds,
  onToggleSaveChallenge,
  onSelectChallenge,
  onOpenContributionModal,
  onOpenCreateChallengeModal,
  onEditChallenge,
  onDeleteChallenge
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const categories = ['All', 'Artificial Intelligence', 'Genomics & Gene Editing', 'Quantum Physics', 'Materials Science & Climate', 'Clean Energy & Storage'];
  const statuses = ['All', 'Open', 'In Review', 'Solved'];

  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.problemStatement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.orgName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStat = selectedStatus === 'All' || c.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">Research Challenges</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Organizations publish structured research challenges with constraints, desired outcomes, and grant bounties.
            </p>
          </div>
          <button
            onClick={onOpenCreateChallengeModal}
            className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish New Challenge</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
          <input
            type="text"
            placeholder="Search challenges by problem statement, organization, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] placeholder-[#6B6255]"
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299] shadow-2xs'
                    : 'bg-[#E9EDC9] text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE]/60 border border-[#DCD5BC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#E9EDC9] rounded-xl border border-[#DCD5BC] shrink-0">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] shadow-2xs font-bold'
                    : 'text-[#6B6255] hover:text-[#342F27]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge) => {
          const isSaved = savedChallengeIds.includes(challenge.id);

          return (
            <div
              key={challenge.id}
              className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] hover:border-[#D4A373] shadow-2xs transition-all flex flex-col justify-between space-y-4 h-full"
            >
              <div>
                {/* Category, Difficulty & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                      {challenge.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-[#D4A373] text-[#342F27] px-2 py-0.5 rounded border border-[#C59465]">
                      {challenge.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {challenge.rewardBounty && (
                      <span className="text-[11px] font-mono font-bold text-[#342F27] bg-[#CCD5AE] px-2.5 py-0.5 rounded border border-[#B8C299]">
                        {challenge.rewardBounty}
                      </span>
                    )}

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => onToggleSaveChallenge(challenge.id)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isSaved ? 'text-[#8B5E34]' : 'text-[#6B6255] hover:text-[#342F27]'
                      }`}
                      title={isSaved ? 'Bookmarked' : 'Save Challenge'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#8B5E34]' : ''}`} />
                    </button>

                    {/* Local Edit / Delete Actions */}
                    <button
                      onClick={() => onEditChallenge(challenge)}
                      className="p-1 text-[#6B6255] hover:text-[#8B5E34] transition-colors cursor-pointer"
                      title="Edit Challenge"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteChallenge(challenge.id)}
                      className="p-1 text-[#6B6255] hover:text-[#B83A32] transition-colors cursor-pointer"
                      title="Delete Challenge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectChallenge(challenge)}
                  className="text-base font-bold text-[#342F27] hover:text-[#8B5E34] cursor-pointer leading-snug"
                >
                  {challenge.title}
                </h3>

                {/* Problem Statement */}
                <p className="text-xs text-[#342F27] mt-2 line-clamp-3 leading-relaxed bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC]">
                  {challenge.problemStatement}
                </p>

                {/* Desired Outcome Preview */}
                <div className="mt-3 text-xs text-[#342F27]">
                  <span className="font-bold text-[#342F27] block mb-0.5">Desired Outcome:</span>
                  <p className="text-[#6B6255] line-clamp-2 leading-snug">{challenge.desiredOutcome}</p>
                </div>
              </div>

              {/* Bottom Details & Actions */}
              <div className="pt-3 border-t border-[#DCD5BC] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6B6255]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#342F27]">{challenge.orgName}</span>
                    <span>· Deadline: {challenge.deadline}</span>
                  </div>
                  <span className="font-mono text-[#8B5E34] font-bold">{challenge.proposalCount} Proposals</span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onSelectChallenge(challenge)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenContributionModal(challenge.id)}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Submit Proposal
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredChallenges.length === 0 && (
          <div className="col-span-2 bg-[#FAEDCD] p-12 text-center rounded-2xl border border-[#DCD5BC]">
            <p className="text-[#6B6255] font-medium">No challenges match your selected filters.</p>
          </div>
        )}
      </div>

    </div>
  );
};
