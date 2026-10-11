import React, { useState } from 'react';
import { Search, Filter, FileText, ExternalLink, Bookmark, AlertTriangle, Target, Check, Calendar } from 'lucide-react';
import { Paper } from '../data/mockData';

interface PapersViewProps {
  papers: Paper[];
  savedPaperIds: string[];
  onToggleSavePaper: (paperId: string) => void;
  onSelectPaper: (paper: Paper) => void;
  onOpenContributionModal: (paperId: string) => void;
}

export const PapersView: React.FC<PapersViewProps> = ({
  papers,
  savedPaperIds,
  onToggleSavePaper,
  onSelectPaper,
  onOpenContributionModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  const fields = ['All', 'Artificial Intelligence', 'Genomics & Gene Editing', 'Quantum Physics', 'Materials Science & Climate', 'Clean Energy & Storage'];
  const years = ['All', ...Array.from(new Set(papers.map(p => p.year.toString()))).sort((a, b) => Number(b) - Number(a))];

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.doi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.subjectTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesField = selectedField === 'All' || paper.field === selectedField;
    const matchesYear = selectedYear === 'All' || paper.year.toString() === selectedYear;
    const matchesOA = !openAccessOnly || paper.openAccess;

    return matchesSearch && matchesField && matchesYear && matchesOA;
  });

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">Research Papers Directory</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Explore peer-reviewed literature with explicit limitation tracking and challenge connections.
            </p>
          </div>
          <div className="text-xs font-mono text-[#6B6255] bg-[#FEFAE0] px-3 py-1.5 rounded-lg border border-[#DCD5BC]">
            Showing <strong className="text-[#342F27]">{filteredPapers.length}</strong> papers
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
            <input
              type="text"
              placeholder="Search by title, author, DOI (e.g. 10.1038), or subject tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] placeholder-[#6B6255]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] font-medium text-[#342F27] cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Open Access Toggle */}
            <button
              onClick={() => setOpenAccessOnly(!openAccessOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                openAccessOnly
                  ? 'bg-[#CCD5AE] text-[#342F27] border-[#B8C299] font-bold shadow-2xs'
                  : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:bg-[#E9EDC9]'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${openAccessOnly ? 'bg-[#287A50] border-[#287A50] text-white' : 'border-[#DCD5BC]'}`}>
                {openAccessOnly && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>Open Access</span>
            </button>
          </div>
        </div>

        {/* Field Category Filter Buttons */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {fields.map((field) => (
            <button
              key={field}
              onClick={() => setSelectedField(field)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedField === field
                  ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299] shadow-2xs'
                  : 'bg-[#E9EDC9] text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE]/60 border border-[#DCD5BC]'
              }`}
            >
              {field}
            </button>
          ))}
        </div>
      </div>

      {/* Paper List */}
      <div className="space-y-4">
        {filteredPapers.map((paper) => {
          const isSaved = savedPaperIds.includes(paper.id);

          return (
            <div
              key={paper.id}
              className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] hover:border-[#D4A373] shadow-2xs transition-all space-y-3"
            >
              {/* Top Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                    DOI: {paper.doi}
                  </span>
                  {paper.openAccess && (
                    <span className="font-semibold text-[#287A50] bg-[#287A50]/15 px-2 py-0.5 rounded border border-[#287A50]/30">
                      Open Access
                    </span>
                  )}
                  <span className="text-[#6B6255]">· {paper.field}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[#6B6255] font-mono text-[11px]">{paper.citationsCount} Citations</span>
                  
                  {/* Save / Bookmark Button */}
                  <button
                    onClick={() => onToggleSavePaper(paper.id)}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer ${
                      isSaved
                        ? 'bg-[#CCD5AE] text-[#342F27] border border-[#B8C299] font-bold'
                        : 'text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9]'
                    }`}
                    title={isSaved ? 'Bookmarked' : 'Save Paper'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#8B5E34] text-[#8B5E34]' : ''}`} />
                    <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Journal */}
              <div>
                <h3
                  onClick={() => onSelectPaper(paper)}
                  className="text-base font-bold text-[#342F27] hover:text-[#8B5E34] cursor-pointer leading-snug"
                >
                  {paper.title}
                </h3>
                <p className="text-xs text-[#6B6255] mt-1">
                  By {paper.authors.join(', ')} — <strong className="text-[#342F27]">{paper.journal} ({paper.year})</strong>
                </p>
              </div>

              {/* Abstract */}
              <p className="text-xs text-[#342F27] leading-relaxed line-clamp-3 bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC]">
                {paper.abstract}
              </p>

              {/* Subject Tags */}
              <div className="flex items-center gap-2 text-xs text-[#6B6255] flex-wrap">
                <span className="font-semibold text-[#342F27]">Tags:</span>
                {paper.subjectTags.map((tag, idx) => (
                  <React.Fragment key={tag}>
                    <span className="hover:text-[#8B5E34] cursor-pointer">{tag}</span>
                    {idx < paper.subjectTags.length - 1 && <span aria-hidden="true" className="text-[#DCD5BC]">·</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Documented Limitations Badge Box */}
              <div className="bg-[#E9EDC9] p-3 rounded-xl border border-[#DCD5BC] text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#342F27] text-[11px] uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#986515]" />
                  <span>Documented Paper Limitations & Research Gaps</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[#342F27]">
                  {paper.limitations.map((lim, i) => (
                    <li key={i} className="leading-snug">{lim}</li>
                  ))}
                </ul>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-[#DCD5BC]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPaper(paper)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8B5E34]" />
                    <span>View Details</span>
                  </button>
                  {paper.linkedChallengeIds.length > 0 && (
                    <span className="text-[11px] font-semibold text-[#342F27] bg-[#CCD5AE] px-2.5 py-1 rounded-xl border border-[#B8C299] inline-flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#8B5E34]" />
                      <span>{paper.linkedChallengeIds.length} Linked Challenge(s)</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onOpenContributionModal(paper.id)}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>

            </div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="bg-[#FAEDCD] p-12 text-center rounded-2xl border border-[#DCD5BC]">
            <p className="text-[#6B6255] font-medium">No research papers match your filter criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
};
