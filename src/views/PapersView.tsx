import React, { useState } from 'react';
import {
  Search,
  FileText,
  ExternalLink,
  Bookmark,
  AlertTriangle,
  Target,
  Check,
  Download,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCode,
  BookOpen,
  Hash,
  Clock
} from 'lucide-react';
import { Paper } from '../data/mockData';
import type { ExtractedDocument, GemmaChunk } from '../types/openalex';

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
  const [extractionFilter, setExtractionFilter] = useState<'All' | 'Extracted' | 'OA Available' | 'Metadata Only'>('All');

  // Full-Text Extraction Modal State
  const [activeExtractionPaper, setActiveExtractionPaper] = useState<Paper | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocument | null>(null);
  const [activeSectionTab, setActiveSectionTab] = useState<string>('Overview');

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

    let matchesExtraction = true;
    if (extractionFilter === 'Extracted') {
      matchesExtraction = paper.fulltextStatus === 'extracted' || paper.extractionStatus === 'success';
    } else if (extractionFilter === 'OA Available') {
      matchesExtraction = Boolean(paper.openAccess || paper.pdfUrl);
    } else if (extractionFilter === 'Metadata Only') {
      matchesExtraction = !paper.openAccess && paper.fulltextStatus !== 'extracted';
    }

    return matchesSearch && matchesField && matchesYear && matchesOA && matchesExtraction;
  });

  // Handle live extraction from backend
  const handleTriggerExtraction = async (paper: Paper) => {
    setActiveExtractionPaper(paper);
    setIsExtracting(true);
    setExtractionError(null);
    setExtractedDoc(null);
    setActiveSectionTab('Overview');

    try {
      const res = await fetch('/api/research/fulltext/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: paper.doi || paper.id })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setExtractionError(data.error || 'Failed to retrieve or extract paper full text.');
      } else if (data.status === 'metadata_only') {
        setExtractionError(data.error || 'No accessible open-access full text available. Retaining metadata and abstract only.');
      } else if (data.document) {
        setExtractedDoc(data.document);
        // Optimistically update local paper object state
        paper.fulltextStatus = 'extracted';
        paper.extractionStatus = 'success';
        paper.documentChecksum = data.documentChecksum;
      }
    } catch (err: any) {
      setExtractionError(err.message || 'Network failure communicating with extraction service.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299] uppercase tracking-wider">
                Full-Text Scholarly Pipeline
              </span>
              <span className="text-[10px] text-[#6B6255] font-mono">Stage 2 Live</span>
            </div>
            <h1 className="text-xl font-bold text-[#342F27]">Research Papers & Full-Text Directory</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Explore peer-reviewed literature with verified open-access retrieval, IMRAD section extraction, and Gemma 4 citation chunking.
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
            {/* Extraction Filter */}
            <select
              value={extractionFilter}
              onChange={(e) => setExtractionFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] font-medium text-[#342F27] cursor-pointer"
            >
              <option value="All">All Documents</option>
              <option value="Extracted">Full Text Extracted</option>
              <option value="OA Available">OA PDF Available</option>
              <option value="Metadata Only">Metadata Only</option>
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] font-medium text-[#342F27] cursor-pointer"
            >
              <option value="All">All Years</option>
              {years.filter(y => y !== 'All').map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
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
          const isExtracted = paper.fulltextStatus === 'extracted' || paper.extractionStatus === 'success';
          const hasPdf = Boolean(paper.pdfUrl || paper.openAccess);
          const hasAbstract = Boolean(paper.abstract && paper.abstract.length > 20);

          return (
            <div
              key={paper.id}
              className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] hover:border-[#D4A373] shadow-2xs transition-all space-y-3"
            >
              {/* Top Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                    DOI: {paper.doi}
                  </span>

                  {/* Availability Distinction Badges (Requirement 6) */}
                  {isExtracted ? (
                    <span className="font-bold text-[#1E5C3C] bg-[#D8F3DC] px-2 py-0.5 rounded border border-[#95D5B2] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                      <span>Full Text Extracted</span>
                    </span>
                  ) : hasPdf ? (
                    <span className="font-semibold text-[#1D4ED8] bg-[#DBEAFE] px-2 py-0.5 rounded border border-[#BFDBFE] inline-flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>OA PDF Available</span>
                    </span>
                  ) : hasAbstract ? (
                    <span className="font-semibold text-[#8B5E34] bg-[#FEFAE0] px-2 py-0.5 rounded border border-[#DCD5BC] inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Abstract Available</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-[#6B6255] bg-[#E9EDC9] px-2 py-0.5 rounded border border-[#DCD5BC]">
                      Metadata Only
                    </span>
                  )}

                  {paper.license && (
                    <span className="font-mono text-[10px] text-[#4A3E2D] bg-[#CCD5AE]/60 px-1.5 py-0.5 rounded border border-[#B8C299] uppercase">
                      {paper.license}
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

              {/* Checksum & Extraction Provenance Bar (if extracted) */}
              {paper.documentChecksum && (
                <div className="bg-[#FEFAE0] px-3 py-1.5 rounded-xl border border-[#DCD5BC] text-[10px] font-mono text-[#6B6255] flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#8B5E34]" />
                    <span>SHA-256: <strong>{paper.documentChecksum.slice(0, 16)}...</strong></span>
                  </span>
                  {paper.extractedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8B5E34]" />
                      <span>Extracted: {new Date(paper.extractedAt).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              )}

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
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCD5BC]">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onSelectPaper(paper)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8B5E34]" />
                    <span>View Details</span>
                  </button>

                  {/* Extract & Inspect Full Text Button */}
                  <button
                    onClick={() => handleTriggerExtraction(paper)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#FEFAE0] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#8B5E34]" />
                    <span>{isExtracted ? 'Inspect Full-Text Sections' : 'Retrieve & Extract Full Text'}</span>
                  </button>

                  {/* External Source Link */}
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-medium text-[#6B6255] hover:text-[#342F27] hover:bg-[#FEFAE0] border border-transparent hover:border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1"
                      title="Open source document in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Source PDF</span>
                    </a>
                  )}

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

      {/* FULL-TEXT EXTRACTION & INSPECTION MODAL */}
      {activeExtractionPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DCD5BC] bg-[#FAEDCD] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#8B5E34]" />
                    <span>Document Extraction Engine</span>
                  </span>
                  <span className="text-[10px] text-[#6B6255] font-mono">
                    DOI: {activeExtractionPaper.doi}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#342F27] leading-snug line-clamp-1">
                  {activeExtractionPaper.title}
                </h2>
                <p className="text-xs text-[#6B6255]">
                  {activeExtractionPaper.journal} ({activeExtractionPaper.year}) — {activeExtractionPaper.authors.slice(0, 3).join(', ')}
                </p>
              </div>

              <button
                onClick={() => setActiveExtractionPaper(null)}
                className="p-1 rounded-lg text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Extraction In-Progress Loader */}
              {isExtracting && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#D4A373] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-[#342F27]">Validating and Extracting Full Text...</p>
                  <p className="text-xs text-[#6B6255] max-w-md mx-auto">
                    Retrieving open-access publication via SSRF-safe pipeline, verifying magic bytes `%PDF-`, segmenting IMRAD sections, and generating Gemma 4 citation chunks.
                  </p>
                </div>
              )}

              {/* Extraction Error / Paywall Notice */}
              {!isExtracting && extractionError && (
                <div className="bg-[#FAEDCD] p-5 rounded-xl border border-[#DCD5BC] space-y-3">
                  <div className="flex items-center gap-2 text-[#986515] font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Full-Text Status: Restricted / Metadata Only</span>
                  </div>
                  <p className="text-xs text-[#342F27] leading-relaxed">
                    {extractionError}
                  </p>
                  <div className="text-[11px] text-[#6B6255] bg-[#FEFAE0] p-3 rounded-lg border border-[#DCD5BC] space-y-1">
                    <p>• <strong>Copyright & Access Policy</strong>: Anvīkṣā strictly adheres to copyright and publisher licensing. No paywalls or access controls are bypassed.</p>
                    <p>• <strong>Retained Content</strong>: Verified publication metadata, citations, and author abstract remain fully available for limitation extraction.</p>
                  </div>
                </div>
              )}

              {/* Successfully Extracted Document View */}
              {!isExtracting && extractedDoc && (
                <div className="space-y-4">
                  
                  {/* Document Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#FAEDCD] p-3 rounded-xl border border-[#DCD5BC]">
                      <span className="text-[10px] uppercase font-bold text-[#6B6255] block">Page Count</span>
                      <span className="text-sm font-bold text-[#342F27]">{extractedDoc.pageCount} Pages</span>
                    </div>
                    <div className="bg-[#FAEDCD] p-3 rounded-xl border border-[#DCD5BC]">
                      <span className="text-[10px] uppercase font-bold text-[#6B6255] block">Characters</span>
                      <span className="text-sm font-bold text-[#342F27]">{extractedDoc.characterCount.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#FAEDCD] p-3 rounded-xl border border-[#DCD5BC]">
                      <span className="text-[10px] uppercase font-bold text-[#6B6255] block">Gemma 4 Chunks</span>
                      <span className="text-sm font-bold text-[#287A50]">{extractedDoc.gemmaChunks.length} Chunks</span>
                    </div>
                    <div className="bg-[#FAEDCD] p-3 rounded-xl border border-[#DCD5BC]">
                      <span className="text-[10px] uppercase font-bold text-[#6B6255] block">License</span>
                      <span className="text-sm font-bold text-[#342F27] uppercase">{extractedDoc.license || 'Open Access'}</span>
                    </div>
                  </div>

                  {/* SHA-256 Checksum Tag */}
                  <div className="bg-[#E9EDC9] p-2.5 rounded-xl border border-[#B8C299] flex items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="text-[#342F27] flex items-center gap-1 font-sans font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#287A50]" />
                      <span>Document Integrity (SHA-256):</span>
                    </span>
                    <span className="text-[#6B6255] truncate max-w-sm" title={extractedDoc.checksumSha256}>
                      {extractedDoc.checksumSha256}
                    </span>
                  </div>

                  {/* Section Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#DCD5BC]">
                    <button
                      onClick={() => setActiveSectionTab('Overview')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        activeSectionTab === 'Overview'
                          ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299]'
                          : 'bg-[#FAEDCD] text-[#6B6255] hover:bg-[#E9EDC9]'
                      }`}
                    >
                      Overview
                    </button>
                    {Object.keys(extractedDoc.sections).map((secKey) => (
                      <button
                        key={secKey}
                        onClick={() => setActiveSectionTab(secKey)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          activeSectionTab === secKey
                            ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299]'
                            : 'bg-[#FAEDCD] text-[#6B6255] hover:bg-[#E9EDC9]'
                        }`}
                      >
                        {secKey}
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveSectionTab('Gemma 4 Chunks')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        activeSectionTab === 'Gemma 4 Chunks'
                          ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299]'
                          : 'bg-[#FAEDCD] text-[#6B6255] hover:bg-[#E9EDC9]'
                      }`}
                    >
                      Gemma 4 Chunks ({extractedDoc.gemmaChunks.length})
                    </button>
                  </div>

                  {/* Tab Content Display */}
                  {activeSectionTab === 'Overview' && (
                    <div className="space-y-3 bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC]">
                      <h4 className="font-bold text-[#342F27]">Document Structure Breakdown</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(extractedDoc.sections).map(([name, sec]) => (
                          <div key={name} className="bg-[#FEFAE0] p-3 rounded-lg border border-[#DCD5BC] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#342F27]">{name}</span>
                              <span className="text-[10px] text-[#6B6255] font-mono">Pages {sec.pageStart}-{sec.pageEnd}</span>
                            </div>
                            <p className="text-[11px] text-[#6B6255] line-clamp-2 leading-relaxed">
                              {sec.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSectionTab !== 'Overview' && activeSectionTab !== 'Gemma 4 Chunks' && (
                    <div className="bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC] space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DCD5BC]">
                        <h4 className="font-bold text-[#342F27]">{activeSectionTab}</h4>
                        <span className="text-[11px] font-mono text-[#6B6255]">
                          Pages {extractedDoc.sections[activeSectionTab]?.pageStart}–{extractedDoc.sections[activeSectionTab]?.pageEnd} ({extractedDoc.sections[activeSectionTab]?.characterCount.toLocaleString()} chars)
                        </span>
                      </div>
                      <div className="p-3 bg-[#FEFAE0] rounded-lg border border-[#DCD5BC] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto text-[#342F27] font-sans">
                        {extractedDoc.sections[activeSectionTab]?.content}
                      </div>
                    </div>
                  )}

                  {activeSectionTab === 'Gemma 4 Chunks' && (
                    <div className="space-y-3 bg-[#FAEDCD] p-4 rounded-xl border border-[#DCD5BC]">
                      <div>
                        <h4 className="font-bold text-[#342F27] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#8B5E34]" />
                          <span>Gemma 4 Citation Chunks (~3,500 chars with 250-char overlap)</span>
                        </h4>
                        <p className="text-[11px] text-[#6B6255] mt-0.5">
                          Each chunk includes exact section headers and page references for grounded literature synthesis.
                        </p>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {extractedDoc.gemmaChunks.map((chunk) => (
                          <div key={chunk.chunkIndex} className="bg-[#FEFAE0] p-3 rounded-lg border border-[#DCD5BC] space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold text-[#8B5E34] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299]">
                                Chunk #{chunk.chunkIndex + 1} · {chunk.section}
                              </span>
                              <span className="text-[#6B6255]">{chunk.tokenEstimate} tokens est.</span>
                            </div>
                            <p className="text-[10px] font-mono text-[#6B6255] bg-[#E9EDC9] p-1.5 rounded border border-[#DCD5BC]">
                              Citation Ref: {chunk.citationRef}
                            </p>
                            <p className="text-[11px] text-[#342F27] leading-relaxed line-clamp-3">
                              {chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAEDCD] border-t border-[#DCD5BC] flex items-center justify-between">
              {activeExtractionPaper.pdfUrl ? (
                <a
                  href={activeExtractionPaper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Upstream PDF</span>
                </a>
              ) : (
                <span className="text-xs text-[#6B6255]">Upstream URL: Restricted / Closed</span>
              )}

              <button
                onClick={() => setActiveExtractionPaper(null)}
                className="px-4 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors cursor-pointer"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
