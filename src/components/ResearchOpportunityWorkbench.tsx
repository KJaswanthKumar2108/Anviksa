import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Scale,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export type OpportunityStatus = 
  | 'ELIGIBLE'
  | 'RANKED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'STALE'
  | 'INELIGIBLE';

export type ContradictionStatus = 
  | 'NO_CONTRADICTIONS_DETECTED'
  | 'PREMISE_FALSIFIED'
  | 'SCOPE_NARROWED'
  | 'CONTRADICTION_STATUS_UNKNOWN';

export type LiteratureDensityStatus = 
  | 'SPARSE_FRONTIER'
  | 'ACTIVE_COMPETITIVE'
  | 'SATURATED_EXACT_REPETITION'
  | 'DIFFICULT_OPEN_DIRECTION';

export type WeightingRegime = 
  | 'BALANCED_DEFAULT'
  | 'FOUNDATIONAL_THEORY'
  | 'RAPID_EXPLORATION'
  | 'METHODOLOGICAL_RIGOR';

export interface ResearchOpportunity {
  id: string;
  gapId: string;
  validationRunId: string;
  status: OpportunityStatus;
  intrinsicScientificValue: number | null;
  evidenceConfidenceScore: number | null;
  noveltyScore: number | null;
  scientificSignificanceScore: number | null;
  methodologicalTractabilityScore: number | null;
  contradictionStatus: ContradictionStatus;
  literatureDensityStatus: LiteratureDensityStatus;
  residualUnresolvedScope: {
    resolvedComponents?: string[];
    unresolvedScope?: string;
    activeTradeoffs?: string[];
    boundaryRestrictions?: string[];
    evidenceSourceLocators?: string[];
  };
  weightingRegime: WeightingRegime;
  scoringMetadata: {
    sensitivityReporting?: Record<WeightingRegime, number>;
    isSensitivityVolatile?: boolean;
    missingDataFlags?: string[];
  };
  structuredExplanation: {
    summary?: string;
    scientificImportance?: string;
    methodologicalSoundness?: string;
    eligibilityRationale?: string;
    contradictionAnalysis?: string;
    densityAnalysis?: string;
  };
  evidenceProvenance: {
    gapId: string;
    validationRunId: string;
    sourcePaperId?: string;
    sourcePaperTitle?: string;
    sourcePaperDoi?: string | null;
    validationCorpusSize?: number;
    corroboratingPaperCount?: number;
    contradictingPaperCount?: number;
    modelAttribution?: {
      resolvedModel?: string;
      isFallback?: boolean;
    };
    methodologyVersion?: string;
    sha256Digest?: string;
  };
  isStale: boolean;
  stalenessReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ResearchOpportunityWorkbench: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ResearchOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection & Details Modal / Drawer
  const [selectedOpportunity, setSelectedOpportunity] = useState<ResearchOpportunity | null>(null);
  
  // Filter & Search Controls
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regimeFilter, setRegimeFilter] = useState<WeightingRegime>('BALANCED_DEFAULT');
  const [densityFilter, setDensityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Manual Gap Opportunity Synthesis Dialog
  const [isSynthesizeModalOpen, setIsSynthesizeModalOpen] = useState(false);
  const [inputGapId, setInputGapId] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (regimeFilter) params.append('regime', regimeFilter);
      if (densityFilter !== 'ALL') params.append('literatureDensityStatus', densityFilter);

      const res = await fetch(`/api/research/opportunities?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load research opportunities (${res.status})`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities([]);
      }
    } catch (err: any) {
      console.error('Fetch opportunities error:', err);
      setError(err.message || 'Unable to connect to research opportunities API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [statusFilter, regimeFilter, densityFilter]);

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGapId.trim()) return;

    setIsSynthesizing(true);
    setSynthesisError(null);
    try {
      const res = await fetch('/api/research/opportunities/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: inputGapId.trim(),
          weightingRegime: regimeFilter
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize opportunity.');
      }

      setIsSynthesizeModalOpen(false);
      setInputGapId('');
      await fetchOpportunities();
      if (data.opportunity) {
        setSelectedOpportunity(data.opportunity);
      }
    } catch (err: any) {
      setSynthesisError(err.message || 'Synthesis failed. Verify that this research gap has been validated in Stage 4D.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = opp.evidenceProvenance?.sourcePaperTitle?.toLowerCase() || '';
    const summary = opp.structuredExplanation?.summary?.toLowerCase() || '';
    const gapId = opp.gapId?.toLowerCase() || '';
    return title.includes(q) || summary.includes(q) || gapId.includes(q);
  });

  const getContradictionBadge = (status: ContradictionStatus) => {
    switch (status) {
      case 'NO_CONTRADICTIONS_DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#E9EDC9] text-[#287A50] border border-[#287A50]/20">
            <CheckCircle2 className="w-3 h-3 text-[#287A50]" />
            No Contradictions
          </span>
        );
      case 'SCOPE_NARROWED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEFAE0] text-[#D97706] border border-[#D97706]/20">
            <Scale className="w-3 h-3 text-[#D97706]" />
            Scope Narrowed
          </span>
        );
      case 'PREMISE_FALSIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDE2E4] text-[#B91C1C] border border-[#B91C1C]/20">
            <XCircle className="w-3 h-3 text-[#B91C1C]" />
            Premise Refuted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0EFEB] text-[#6B6255] border border-[#DCD5BC]">
            <Clock className="w-3 h-3 text-[#6B6255]" />
            Unverified
          </span>
        );
    }
  };

  const getDensityBadge = (status: LiteratureDensityStatus) => {
    switch (status) {
      case 'DIFFICULT_OPEN_DIRECTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#CCD5AE]/40 text-[#287A50] border border-[#287A50]/20">
            <ShieldCheck className="w-3 h-3 text-[#287A50]" />
            Difficult Open Direction
          </span>
        );
      case 'SPARSE_FRONTIER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEFAE0] text-[#D97706] border border-[#D97706]/20">
            <Sparkles className="w-3 h-3 text-[#D97706]" />
            Sparse Frontier
          </span>
        );
      case 'SATURATED_EXACT_REPETITION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFEDD5] text-[#EA580C] border border-[#EA580C]/20">
            <Flame className="w-3 h-3 text-[#EA580C]" />
            Topic Saturated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAEDCD]/60 text-[#342F27] border border-[#DCD5BC]">
            <Layers className="w-3 h-3 text-[#6B6255]" />
            Active Competitive
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAEDCD]/20 text-[#342F27] overflow-y-auto">
      {/* 1. Header Toolbar */}
      <div className="p-6 border-b border-[#DCD5BC] bg-[#FEFAE0]/80 backdrop-blur-sm sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D97706]" />
            <h1 className="text-xl font-bold tracking-tight text-[#342F27]">
              Research Opportunity Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#D97706]/10 text-[#D97706] text-xs font-mono font-semibold border border-[#D97706]/30">
              Stage 4E
            </span>
          </div>
          <p className="text-xs text-[#6B6255] mt-1">
            Prioritizes verified research opportunities based on intrinsic scientific value (V_scientific), decoupled from researcher resource wealth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSynthesizeModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Synthesize from Gap
          </button>
          <button
            onClick={fetchOpportunities}
            disabled={isLoading}
            className="p-1.5 rounded border border-[#DCD5BC] bg-white hover:bg-[#FAEDCD]/40 text-[#6B6255] transition-colors"
            title="Refresh opportunities list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="px-6 py-3 border-b border-[#DCD5BC] bg-[#FEFAE0]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#6B6255] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by paper title, gap ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#DCD5BC] rounded text-xs text-[#342F27] placeholder-[#6B6255]/60 focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B6255] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#DCD5BC] rounded px-2 py-1 text-xs text-[#342F27] focus:outline-none focus:border-[#D97706]"
            >
              <option value="ALL">All Active</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="RANKED">Ranked</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="INELIGIBLE">Ineligible</option>
            </select>
          </div>

          {/* Weighting Regime */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B6255] font-medium">Weighting Regime:</span>
            <select
              value={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.value as WeightingRegime)}
              className="bg-white border border-[#DCD5BC] rounded px-2 py-1 text-xs text-[#342F27] focus:outline-none focus:border-[#D97706]"
            >
              <option value="BALANCED_DEFAULT">Balanced (30/25/30/15)</option>
              <option value="FOUNDATIONAL_THEORY">Foundational Theory (Significance 40%)</option>
              <option value="RAPID_EXPLORATION">Rapid Exploration (Novelty 40%)</option>
              <option value="METHODOLOGICAL_RIGOR">Methodological Rigor (Confidence 40%)</option>
            </select>
          </div>

          {/* Literature Density Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B6255] font-medium">Density:</span>
            <select
              value={densityFilter}
              onChange={(e) => setDensityFilter(e.target.value)}
              className="bg-white border border-[#DCD5BC] rounded px-2 py-1 text-xs text-[#342F27] focus:outline-none focus:border-[#D97706]"
            >
              <option value="ALL">All Density Profiles</option>
              <option value="SPARSE_FRONTIER">Sparse Frontier</option>
              <option value="ACTIVE_COMPETITIVE">Active Competitive</option>
              <option value="DIFFICULT_OPEN_DIRECTION">Difficult Open Direction</option>
              <option value="SATURATED_EXACT_REPETITION">Saturated Repetition</option>
            </select>
          </div>
        </div>

        <div className="text-[#6B6255] font-mono text-[11px]">
          Showing {filteredOpportunities.length} opportunities
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ranked List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 rounded-md bg-[#FDE2E4] border border-[#B91C1C]/20 text-[#B91C1C] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-[#6B6255] text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#D97706]" />
              <span>Evaluating literature opportunities...</span>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#DCD5BC] rounded-lg text-[#6B6255] text-xs space-y-2">
              <Layers className="w-8 h-8 mx-auto text-[#6B6255]/40" />
              <p className="font-semibold text-[#342F27]">No Research Opportunities Found</p>
              <p className="max-w-md mx-auto text-[11px]">
                No opportunities match the current filter. Validate candidate gaps in Stage 4D or click <strong>Synthesize from Gap</strong> above.
              </p>
            </div>
          ) : (
            filteredOpportunities.map((opp, idx) => {
              const isSelected = selectedOpportunity?.id === opp.id;
              const vScore = opp.intrinsicScientificValue !== null ? opp.intrinsicScientificValue.toFixed(2) : 'N/A';

              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpportunity(opp)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#D97706] ring-1 ring-[#D97706] shadow-sm'
                      : 'border-[#DCD5BC] hover:border-[#D97706]/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded bg-[#FAEDCD] flex items-center justify-center shrink-0 text-[11px] font-mono font-bold text-[#D97706]">
                        #{idx + 1}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#342F27] leading-tight">
                          {opp.evidenceProvenance?.sourcePaperTitle || opp.structuredExplanation?.summary || 'Research Opportunity'}
                        </h3>
                        <p className="text-[11px] text-[#6B6255] mt-1 line-clamp-2">
                          {opp.structuredExplanation?.summary || 'No summary description available.'}
                        </p>
                      </div>
                    </div>

                    {/* V_scientific Score Badge */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-base font-extrabold text-[#D97706] font-mono">
                          {vScore}
                        </span>
                        <span className="text-[10px] text-[#6B6255] font-mono">/10.0</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-[#6B6255] block">
                        V_scientific
                      </span>
                    </div>
                  </div>

                  {/* Sub-Score Bars */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#DCD5BC]/60 text-[10px]">
                    <div>
                      <span className="text-[#6B6255] block">Confidence (30%)</span>
                      <span className="font-mono font-semibold text-[#342F27]">
                        {opp.evidenceConfidenceScore?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B6255] block">Novelty (25%)</span>
                      <span className="font-mono font-semibold text-[#342F27]">
                        {opp.noveltyScore?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B6255] block">Significance (30%)</span>
                      <span className="font-mono font-semibold text-[#342F27]">
                        {opp.scientificSignificanceScore?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B6255] block">Tractability (15%)</span>
                      <span className="font-mono font-semibold text-[#342F27]">
                        {opp.methodologicalTractabilityScore?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* Badges Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getContradictionBadge(opp.contradictionStatus)}
                      {getDensityBadge(opp.literatureDensityStatus)}
                      {opp.isStale && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FDE2E4] text-[#B91C1C] font-semibold border border-[#B91C1C]/20">
                          STALE
                        </span>
                      )}
                      {opp.scoringMetadata?.isSensitivityVolatile && (
                        <span className="px-1.5 py-0.5 rounded bg-[#FEFAE0] text-[#D97706] font-semibold border border-[#D97706]/30">
                          Regime Volatile
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[#6B6255] text-[10px] font-mono">
                      <span>Run: {opp.validationRunId?.slice(0, 12)}...</span>
                      <ChevronRight className="w-3 h-3 text-[#D97706]" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Scientific Breakdown (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white border border-[#DCD5BC] rounded-lg p-5 sticky top-24 shadow-sm text-xs">
          {selectedOpportunity ? (
            <div className="space-y-4">
              <div className="border-b border-[#DCD5BC] pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FAEDCD] text-[#D97706] font-mono font-bold text-[10px]">
                    {selectedOpportunity.status}
                  </span>
                  <span className="text-[10px] text-[#6B6255] font-mono">
                    ID: {selectedOpportunity.id.slice(0, 8)}...
                  </span>
                </div>
                <h2 className="text-sm font-bold text-[#342F27] mt-1.5">
                  Scientific Opportunity Rationale
                </h2>
              </div>

              {/* Stale Warning */}
              {selectedOpportunity.isStale && (
                <div className="p-3 rounded bg-[#FDE2E4] border border-[#B91C1C]/30 text-[#B91C1C] text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Epistemic Staleness Detected:</span>
                    <p className="mt-0.5">{selectedOpportunity.stalenessReason || 'Upstream validation run outcome has evolved.'}</p>
                  </div>
                </div>
              )}

              {/* Explanation Summary */}
              <div>
                <h4 className="text-[11px] font-bold text-[#6B6255] uppercase tracking-wider">
                  Summary & Context
                </h4>
                <p className="text-[#342F27] text-xs mt-1 leading-relaxed">
                  {selectedOpportunity.structuredExplanation?.summary || 'No summary available.'}
                </p>
              </div>

              {/* Eligibility Rationale */}
              <div className="p-3 rounded bg-[#FEFAE0]/70 border border-[#DCD5BC]">
                <h4 className="text-[11px] font-bold text-[#342F27] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#287A50]" />
                  Eligibility Decision
                </h4>
                <p className="text-[11px] text-[#6B6255] mt-1 leading-relaxed">
                  {selectedOpportunity.structuredExplanation?.eligibilityRationale || 'Eligible based on cross-literature verification.'}
                </p>
              </div>

              {/* Residual Unresolved Scope (for Partial Gaps) */}
              {selectedOpportunity.residualUnresolvedScope?.unresolvedScope && (
                <div className="p-3 rounded bg-[#FAEDCD]/40 border border-[#DCD5BC]">
                  <h4 className="text-[11px] font-bold text-[#D97706] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#D97706]" />
                    Isolated Residual Scope
                  </h4>
                  <p className="text-[11px] text-[#342F27] mt-1 leading-relaxed">
                    {selectedOpportunity.residualUnresolvedScope.unresolvedScope}
                  </p>
                  {selectedOpportunity.residualUnresolvedScope.activeTradeoffs && (
                    <div className="mt-2 pt-2 border-t border-[#DCD5BC]/40">
                      <span className="text-[10px] font-bold text-[#6B6255] block">Active Trade-Offs:</span>
                      <ul className="list-disc list-inside text-[10px] text-[#6B6255] mt-1 space-y-0.5">
                        {selectedOpportunity.residualUnresolvedScope.activeTradeoffs.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sensitivity Reporting Table */}
              {selectedOpportunity.scoringMetadata?.sensitivityReporting && (
                <div>
                  <h4 className="text-[11px] font-bold text-[#6B6255] uppercase tracking-wider mb-1.5">
                    Regime Sensitivity Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(selectedOpportunity.scoringMetadata.sensitivityReporting).map(([regime, score]) => (
                      <div key={regime} className="p-2 rounded bg-[#F8F9FA] border border-[#DCD5BC]/60 flex items-center justify-between">
                        <span className="text-[#6B6255] text-[10px]">
                          {regime === 'BALANCED_DEFAULT' ? 'Balanced' : regime.replace('_', ' ')}:
                        </span>
                        <span className="font-mono font-bold text-[#342F27]">{score.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provenance Footer */}
              <div className="pt-3 border-t border-[#DCD5BC] text-[10px] text-[#6B6255] space-y-1 font-mono">
                <div>Source Paper ID: {selectedOpportunity.evidenceProvenance?.sourcePaperId || 'N/A'}</div>
                <div>Validation Run: {selectedOpportunity.validationRunId}</div>
                <div>Methodology: {selectedOpportunity.evidenceProvenance?.methodologyVersion || '4.1.0-STAGE4E-OPP-INTEL'}</div>
                <div>Attribution: {selectedOpportunity.evidenceProvenance?.modelAttribution?.resolvedModel || 'gemma-4-26b-a4b-it'}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#6B6255] space-y-2">
              <Info className="w-6 h-6 mx-auto text-[#6B6255]/40" />
              <p className="font-semibold text-xs text-[#342F27]">No Opportunity Selected</p>
              <p className="text-[11px]">Click an opportunity on the left to inspect its complete scientific score breakdown and evidence provenance.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Synthesize from Gap Modal */}
      {isSynthesizeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-[#DCD5BC] shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#DCD5BC] pb-3">
              <h3 className="font-bold text-sm text-[#342F27] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                Synthesize Research Opportunity
              </h3>
              <button
                onClick={() => setIsSynthesizeModalOpen(false)}
                className="text-[#6B6255] hover:text-[#342F27] text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSynthesize} className="space-y-4">
              {synthesisError && (
                <div className="p-3 rounded bg-[#FDE2E4] border border-[#B91C1C]/20 text-[#B91C1C] text-[11px]">
                  {synthesisError}
                </div>
              )}

              <div>
                <label className="block text-[#342F27] font-semibold mb-1">
                  Research Gap UUID (from Stage 4D):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0f0139a1-76d2-4f4c-b530-f98da61a48c5"
                  value={inputGapId}
                  onChange={(e) => setInputGapId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#DCD5BC] rounded text-xs font-mono text-[#342F27] focus:outline-none focus:border-[#D97706]"
                />
                <p className="text-[10px] text-[#6B6255] mt-1">
                  The gap must have at least one completed Stage 4D validation run (`CONFIRMED_UNRESOLVED` or `PARTIALLY_ADDRESSED`).
                </p>
              </div>

              <div>
                <label className="block text-[#342F27] font-semibold mb-1">
                  Weighting Profile:
                </label>
                <select
                  value={regimeFilter}
                  onChange={(e) => setRegimeFilter(e.target.value as WeightingRegime)}
                  className="w-full px-3 py-1.5 bg-white border border-[#DCD5BC] rounded text-xs text-[#342F27] focus:outline-none focus:border-[#D97706]"
                >
                  <option value="BALANCED_DEFAULT">Balanced (Confidence 30%, Novelty 25%, Significance 30%, Tractability 15%)</option>
                  <option value="FOUNDATIONAL_THEORY">Foundational Theory (Significance 40%)</option>
                  <option value="RAPID_EXPLORATION">Rapid Exploration (Novelty 40%)</option>
                  <option value="METHODOLOGICAL_RIGOR">Methodological Rigor (Confidence 40%)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCD5BC]">
                <button
                  type="button"
                  onClick={() => setIsSynthesizeModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#DCD5BC] text-[#6B6255] hover:bg-[#FAEDCD]/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSynthesizing || !inputGapId.trim()}
                  className="px-4 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    'Synthesize Opportunity'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
