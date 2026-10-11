import React, { useState } from 'react';
import { Search, Award, BookOpen, CheckCircle2, Shield, Mail, MapPin, ExternalLink, GitPullRequest, UserPlus, UserCheck, GraduationCap, Microscope, Sparkles } from 'lucide-react';
import { Contributor, HierarchyRole } from '../data/mockData';

interface ContributorsViewProps {
  contributors: Contributor[];
  followedContributorIds: string[];
  onToggleFollowContributor: (contributorId: string) => void;
}

export const ContributorsView: React.FC<ContributorsViewProps> = ({
  contributors,
  followedContributorIds,
  onToggleFollowContributor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHierarchy, setSelectedHierarchy] = useState<string>('All');
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(contributors[0] || null);

  const hierarchyLevels: { id: string; label: string; role?: HierarchyRole }[] = [
    { id: 'All', label: 'All Hierarchy Levels' },
    { id: 'Research Scientist', label: '1. Research Scientists', role: 'Research Scientist' },
    { id: 'Researcher', label: '2. Researchers', role: 'Researcher' },
    { id: 'PhD Scholar', label: '3. PhD Scholars', role: 'PhD Scholar' },
    { id: 'Student', label: '4. Students', role: 'Student' }
  ];

  // Sort by hierarchyRank (1 to 4)
  const sortedContributors = [...contributors].sort((a, b) => a.hierarchyRank - b.hierarchyRank);

  const filteredContributors = sortedContributors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.researchInterests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHierarchy =
      selectedHierarchy === 'All' || c.hierarchyRole === selectedHierarchy;

    return matchesSearch && matchesHierarchy;
  });

  const getHierarchyBadge = (role: HierarchyRole, rank: number) => {
    switch (rank) {
      case 1:
        return { label: 'Tier 1 · Research Scientist', bg: 'bg-[#CCD5AE]', text: 'text-[#342F27]', border: 'border-[#B8C299]' };
      case 2:
        return { label: 'Tier 2 · Researcher', bg: 'bg-[#E9EDC9]', text: 'text-[#342F27]', border: 'border-[#DCD5BC]' };
      case 3:
        return { label: 'Tier 3 · PhD Scholar', bg: 'bg-[#FAEDCD]', text: 'text-[#8B5E34]', border: 'border-[#DCD5BC]' };
      case 4:
        return { label: 'Tier 4 · Student', bg: 'bg-[#FEFAE0]', text: 'text-[#6B6255]', border: 'border-[#DCD5BC]' };
      default:
        return { label: role, bg: 'bg-[#FEFAE0]', text: 'text-[#342F27]', border: 'border-[#DCD5BC]' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">Researcher & Contributor Directory</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Browse scientists and academic fellows organized across the 4 stages of research hierarchy.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
            <input
              type="text"
              placeholder="Search researchers, universities, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] placeholder-[#6B6255]"
            />
          </div>
        </div>

        {/* Hierarchy Filter Bar */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-[#6B6255] mr-1 shrink-0">Academic Hierarchy:</span>
          {hierarchyLevels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSelectedHierarchy(lvl.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                selectedHierarchy === lvl.id
                  ? 'bg-[#CCD5AE] text-[#342F27] font-bold border-[#B8C299] shadow-xs ring-1 ring-[#D4A373]'
                  : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:text-[#342F27] hover:bg-[#E9EDC9]'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Split: Contributor Cards & Detailed Profile View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List of Contributors */}
        <div className="space-y-3">
          {filteredContributors.map((c) => {
            const isSelected = selectedContributor?.id === c.id;
            const isFollowing = followedContributorIds.includes(c.id);
            const badge = getHierarchyBadge(c.hierarchyRole, c.hierarchyRank);

            return (
              <div
                key={c.id}
                onClick={() => setSelectedContributor(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#CCD5AE]/60 border-[#D4A373] ring-2 ring-[#D4A373] shadow-xs'
                    : 'bg-[#FAEDCD] border-[#DCD5BC] hover:border-[#D4A373]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full border border-[#DCD5BC] bg-[#CCD5AE] shrink-0 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#342F27]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-bold text-[#342F27] text-xs truncate">{c.name}</h3>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border} shrink-0`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6B6255] truncate font-medium">{c.title}</p>
                    <p className="text-[10px] text-[#6B6255] truncate mt-0.5">{c.institution}</p>

                    <div className="mt-2.5 pt-2 border-t border-[#DCD5BC]/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8B5E34] font-bold">h-index: {c.hIndex}</span>
                      <span className="text-[#287A50] font-semibold">{c.verifiedContributionsCount} Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredContributors.length === 0 && (
            <div className="bg-[#FAEDCD] p-8 text-center rounded-2xl border border-[#DCD5BC] text-[#6B6255] text-xs">
              No researchers found matching "{searchQuery}".
            </div>
          )}
        </div>

        {/* Right Detailed Profile Panel */}
        <div className="lg:col-span-2 lg:sticky lg:top-20 self-start">
          {selectedContributor ? (
            <div className="bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] p-6 shadow-2xs space-y-6 text-xs text-[#342F27]">
              
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pb-6 border-b border-[#DCD5BC]">
                <div className="w-20 h-20 rounded-2xl border border-[#DCD5BC] bg-[#CCD5AE] shadow-2xs flex items-center justify-center shrink-0">
                  <UserPlus className="w-8 h-8 text-[#342F27]" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#342F27]">{selectedContributor.name}</h2>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getHierarchyBadge(selectedContributor.hierarchyRole, selectedContributor.hierarchyRank).bg} ${getHierarchyBadge(selectedContributor.hierarchyRole, selectedContributor.hierarchyRank).text} ${getHierarchyBadge(selectedContributor.hierarchyRole, selectedContributor.hierarchyRank).border}`}>
                        {getHierarchyBadge(selectedContributor.hierarchyRole, selectedContributor.hierarchyRank).label}
                      </span>
                    </div>
                    
                    {/* Follow / Connect Button */}
                    <button
                      onClick={() => onToggleFollowContributor(selectedContributor.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 border cursor-pointer ${
                        followedContributorIds.includes(selectedContributor.id)
                          ? 'bg-[#E9EDC9] text-[#342F27] border-[#DCD5BC] hover:bg-[#CCD5AE]'
                          : 'bg-[#D4A373] text-[#342F27] hover:bg-[#8B5E34] hover:text-white border-[#C59465] shadow-2xs'
                      }`}
                    >
                      {followedContributorIds.includes(selectedContributor.id) ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-[#287A50]" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-[#6B6255]">{selectedContributor.title}</p>
                  <p className="text-xs text-[#6B6255]">{selectedContributor.institution}</p>
                  <div className="flex items-center gap-4 text-[11px] text-[#6B6255] mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8B5E34]" />
                      <span>{selectedContributor.location}</span>
                    </span>
                    {selectedContributor.orcid && (
                      <span className="font-mono text-[#287A50]">
                        ORCID: {selectedContributor.orcid}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Work vs Proposed Work Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] font-mono text-center">
                <div>
                  <span className="block text-[10px] font-sans text-[#6B6255] font-semibold uppercase">h-index</span>
                  <span className="text-base font-bold text-[#342F27]">{selectedContributor.hIndex}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-[#6B6255] font-semibold uppercase">Citations</span>
                  <span className="text-base font-bold text-[#342F27]">{selectedContributor.totalCitations}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-[#287A50] font-semibold uppercase">Verified Artifacts</span>
                  <span className="text-base font-bold text-[#287A50]">{selectedContributor.verifiedContributionsCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-[#6B6255] font-semibold uppercase">Active Proposals</span>
                  <span className="text-base font-bold text-[#6B6255]">{selectedContributor.proposedContributionsCount}</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-1.5">Biography & Research Focus</h4>
                <p className="text-[#342F27] leading-relaxed bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">{selectedContributor.bio}</p>
              </div>

              {/* Skills & Research Interests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Research Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContributor.researchInterests.map((interest) => (
                      <span key={interest} className="text-[11px] bg-[#E9EDC9] text-[#342F27] px-2.5 py-0.5 rounded-md border border-[#DCD5BC] font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Technical Skills & Methods</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContributor.skills.map((skill) => (
                      <span key={skill} className="text-[11px] bg-[#FEFAE0] text-[#6B6255] px-2.5 py-0.5 rounded-md border border-[#DCD5BC] font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Publications */}
              <div>
                <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider mb-2">Peer-Reviewed Publications</h4>
                <div className="space-y-2">
                  {selectedContributor.publications.map((pub, idx) => (
                    <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC]">
                      <h5 className="font-bold text-[#342F27] text-xs">{pub.title}</h5>
                      <p className="text-[11px] text-[#6B6255] mt-0.5">{pub.journal} ({pub.year}) · DOI: {pub.doi}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#FAEDCD] rounded-2xl border border-[#DCD5BC] p-12 text-center text-[#6B6255]">
              Select a researcher from the left panel to inspect their academic dossier.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
