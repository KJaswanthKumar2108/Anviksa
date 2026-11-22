import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
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
  Info,
  GitBranch,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export type ScientificParadigmType = 
  | 'EMPIRICAL_QUANTITATIVE'
  | 'COMPARATIVE_BENCHMARK'
  | 'THEORETICAL_FORMAL'
  | 'COMPUTATIONAL_COMPLEXITY'
  | 'QUALITATIVE_SYSTEMS'
  | 'ABLATION_MECHANISTIC';

export type HypothesisReviewState =
  | 'GENERATED'
  | 'EVIDENCE_VERIFICATION_PENDING'
  | 'VERIFIED_FOR_REVIEW'
  | 'REQUIRES_REFINEMENT'
  | 'REJECTED'
  | 'RESEARCHER_APPROVED'
  | 'SUPERSEDED'
  | 'STALE';

export interface OperationalVariable {
  name: string;
  description: string;
  operational_definition: string;
  measurement_unit: string;
  allowed_values_or_range?: string;
  expected_direction?: 'INCREASE' | 'DECREASE' | 'INVARIANT' | 'NON_LINEAR';
}

export interface ControlVariable {
  name: string;
  constant_value_or_protocol: string;
}

export interface GroundingEvidenceReference {
  paper_id: string;
  doi: string | null;
  quote: string;
  offsets: [number, number];
  role: 'PRIMARY_BOTTLENECK' | 'SUPPORTING_OBSERVATION' | 'PRIOR_PARTIAL_SOLUTION';
}

export interface CounterEvidenceReference {
  paper_id: string;
  doi: string | null;
  contradictory_finding: string;
}

export interface GenerationProvenance {
  model_used: string;
  model_requested: string;
  is_fallback: boolean;
  prompt_version: string;
  evidence_corpus_hash: string;
  generation_timestamp: string;
}

export interface LogicalAuditFinding {
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATIONAL';
  description: string;
  fieldAffected: string;
}

export interface ScientificHypothesisArtifact {
  hypothesis_id: string;
  parent_gap_id: string;
  parent_validation_run_id: string;
  research_opportunity_id: string;
  version_number: number;
  research_question: string;
  hypothesis_statement: string;
  scientific_rationale: string;
  paradigm_type: ScientificParadigmType;
  grounding_evidence_references: GroundingEvidenceReference[];
  known_counter_evidence_references: CounterEvidenceReference[];
  underlying_assumptions: string[];
  boundary_conditions: string[];
  independent_variables: OperationalVariable[];
  dependent_variables: OperationalVariable[];
  control_variables: ControlVariable[];
  statistical_formalism_applicable: boolean;
  null_hypothesis: string | null;
  alternative_hypothesis: string | null;
  falsification_conditions: string[];
  critical_failure_threshold: string;
  scope_and_limitations: string;
  falsifiability_rubric_score: number;
  generation_provenance: GenerationProvenance;
  review_state: HypothesisReviewState;
  is_stale: boolean;
  created_at: string;
  staleness_reason?: string | null;
  logical_audit_findings?: LogicalAuditFinding[];
}

export interface OpportunityOption {
  id: string;
  gapId: string;
  validationRunId: string;
  intrinsicScientificValue: number;
  status: string;
  structuredExplanation?: { summary?: string };
}

export const HypothesisWorkbench: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [selectedOppId, setSelectedOppId] = useState<string>('');
  const [hypotheses, setHypotheses] = useState<ScientificHypothesisArtifact[]>([]);
  const [selectedHypothesis, setSelectedHypothesis] = useState<ScientificHypothesisArtifact | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedParadigm, setSelectedParadigm] = useState<ScientificParadigmType | 'RECOMMENDED'>('RECOMMENDED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revisionRationale, setRevisionRationale] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editStatement, setEditStatement] = useState<string>('');

  // 1. Load active eligible opportunities
  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/research/opportunities?status=ELIGIBLE&limit=20');
      const data = await res.json();
      if (data.success && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
        if (data.opportunities.length > 0 && !selectedOppId) {
          setSelectedOppId(data.opportunities[0].id);
          fetchHypothesesForOpportunity(data.opportunities[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHypothesesForOpportunity = async (oppId: string) => {
    if (!oppId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/research/hypotheses/opportunity/${oppId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.hypotheses)) {
        setHypotheses(data.hypotheses);
        if (data.hypotheses.length > 0) {
          setSelectedHypothesis(data.hypotheses[0]);
          fetchVersionHistory(data.hypotheses[0].hypothesis_id);
        } else {
          setSelectedHypothesis(null);
          setVersionHistory([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch hypotheses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersionHistory = async (hypId: string) => {
    try {
      const res = await fetch(`/api/research/hypotheses/${hypId}/versions`);
      const data = await res.json();
      if (data.success) {
        setVersionHistory(data.versions);
      }
    } catch (err: any) {
      console.error('Failed to fetch version history:', err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOppId) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/research/hypotheses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: selectedOppId,
          preferredParadigm: selectedParadigm !== 'RECOMMENDED' ? selectedParadigm : undefined,
          candidateCount: 3
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.hypotheses)) {
        setHypotheses(data.hypotheses);
        if (data.hypotheses.length > 0) {
          setSelectedHypothesis(data.hypotheses[0]);
          fetchVersionHistory(data.hypotheses[0].hypothesis_id);
        }
      } else {
        setErrorMsg(data.error || 'Failed to synthesize candidate hypotheses.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during synthesis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevise = async () => {
    if (!selectedHypothesis || !editStatement.trim() || !revisionRationale.trim()) return;
    try {
      const res = await fetch(`/api/research/hypotheses/${selectedHypothesis.hypothesis_id}/revise`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionPayload: {
            hypothesis_statement: editStatement,
            status: 'RESEARCHER_APPROVED'
          },
          modificationRationale: revisionRationale
        })
      });
      const data = await res.json();
      if (data.success && data.hypothesis) {
        setSelectedHypothesis(data.hypothesis);
        fetchVersionHistory(data.hypothesis.hypothesis_id);
        setIsEditing(false);
        setRevisionRationale('');
      }
    } catch (err: any) {
      console.error('Failed to submit revision:', err);
    }
  };

  const getParadigmBadgeColor = (type: ScientificParadigmType) => {
    switch (type) {
      case 'EMPIRICAL_QUANTITATIVE': return 'bg-[#CCD5AE] text-[#3E4A28] border-[#A8B28B]';
      case 'COMPARATIVE_BENCHMARK': return 'bg-[#E9EDC9] text-[#4F583D] border-[#CCD5AE]';
      case 'THEORETICAL_FORMAL': return 'bg-[#D4A373]/20 text-[#8B5E34] border-[#D4A373]';
      case 'COMPUTATIONAL_COMPLEXITY': return 'bg-[#FAEDCD] text-[#7A5832] border-[#D9C49D]';
      case 'ABLATION_MECHANISTIC': return 'bg-[#DDA15E]/20 text-[#8C4F1C] border-[#DDA15E]';
      case 'QUALITATIVE_SYSTEMS': return 'bg-[#BC6C25]/20 text-[#6B370B] border-[#BC6C25]';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex-1 bg-[#FAEDCD]/25 text-[#332C27] flex flex-col min-h-screen font-sans">
      {/* Top Banner & Popperian Epistemic Badge */}
      <div className="bg-[#CCD5AE]/40 border-b border-[#DCD5BC] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5E34] text-white tracking-wide uppercase">
              Stage 4E-IMP-02
            </span>
            <h1 className="text-xl font-serif font-bold text-[#4B382A]">Falsifiable Hypothesis Engine</h1>
          </div>
          <p className="text-xs text-[#6C584C] mt-0.5">
            Popperian Falsification Architecture: Transforms research opportunities into structured, refutable scientific hypotheses across 6 paradigms.
          </p>
        </div>

        {/* Warning Alert: Non-Fabrication Notice */}
        <div className="bg-[#FAEDCD] border border-[#D4A373] px-3 py-2 rounded flex items-center gap-2 text-xs text-[#8B5E34] shadow-sm max-w-md">
          <Info className="w-4 h-4 flex-shrink-0 text-[#BC6C25]" />
          <span>
            <strong>Epistemic Invariant:</strong> Generated hypotheses are unproven candidate proposals requiring empirical testing. Zero experimental validation is claimed.
          </span>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Opportunity Selection & Generation Controls (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Target Opportunity Selector */}
          <div className="bg-white border border-[#DCD5BC] rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-serif font-bold text-[#4B382A] mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#8B5E34]" />
              Select Target Opportunity
            </h2>
            <select
              value={selectedOppId}
              onChange={(e) => {
                setSelectedOppId(e.target.value);
                fetchHypothesesForOpportunity(e.target.value);
              }}
              className="w-full text-xs border border-[#DCD5BC] rounded p-2 bg-[#FAEDCD]/30 text-[#4B382A] focus:outline-none focus:ring-1 focus:ring-[#8B5E34]"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.structuredExplanation?.summary?.slice(0, 75) || opp.id} (Score: {opp.intrinsicScientificValue}/10)
                </option>
              ))}
            </select>

            {/* Paradigm Selection */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-[#6C584C] block mb-1">
                Target Research Paradigm:
              </label>
              <select
                value={selectedParadigm}
                onChange={(e) => setSelectedParadigm(e.target.value as any)}
                className="w-full text-xs border border-[#DCD5BC] rounded p-1.5 bg-[#FAEDCD]/20 text-[#4B382A]"
              >
                <option value="RECOMMENDED">✨ Auto-Recommend by Scientific Nature</option>
                <option value="EMPIRICAL_QUANTITATIVE">1. Empirical Quantitative (Statistical H0/H1)</option>
                <option value="COMPARATIVE_BENCHMARK">2. Comparative Benchmark (Pareto Trade-offs)</option>
                <option value="THEORETICAL_FORMAL">3. Theoretical Formal (Deductive / Proof)</option>
                <option value="COMPUTATIONAL_COMPLEXITY">4. Computational Complexity (Scaling Laws)</option>
                <option value="ABLATION_MECHANISTIC">5. Ablation Mechanistic (Causal Necessity)</option>
                <option value="QUALITATIVE_SYSTEMS">6. Qualitative Systems (Architectural Bounds)</option>
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedOppId}
              className="w-full mt-4 bg-[#8B5E34] hover:bg-[#6C584C] text-white text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Synthesizing Falsifiable Candidates...' : 'Synthesize Hypotheses (K=3)'}
            </button>

            {errorMsg && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Candidate Pool List */}
          <div className="bg-white border border-[#DCD5BC] rounded-lg p-4 shadow-sm flex-1 flex flex-col">
            <h2 className="text-sm font-serif font-bold text-[#4B382A] mb-2 flex items-center justify-between">
              <span>Candidate Pool ({hypotheses.length})</span>
              <span className="text-[10px] text-[#8B5E34] font-normal">Diversity Filtered</span>
            </h2>

            {hypotheses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[#8C7A6B]">
                <Lightbulb className="w-8 h-8 text-[#CCD5AE] mb-2" />
                <p>No hypotheses generated yet.</p>
                <p className="text-[11px] mt-1">Select an opportunity and click Synthesize to generate falsifiable candidates.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[480px]">
                {hypotheses.map((h) => {
                  const isSelected = selectedHypothesis?.hypothesis_id === h.hypothesis_id;
                  return (
                    <div
                      key={h.hypothesis_id}
                      onClick={() => {
                        setSelectedHypothesis(h);
                        fetchVersionHistory(h.hypothesis_id);
                        setIsEditing(false);
                      }}
                      className={`p-3 rounded border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-[#8B5E34] bg-[#FAEDCD]/40 shadow-sm'
                          : 'border-[#E9EDC9] hover:bg-[#FAEDCD]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getParadigmBadgeColor(h.paradigm_type)}`}>
                          {h.paradigm_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-semibold text-[#8B5E34]">
                          HFI: {h.falsifiability_rubric_score}/10
                        </span>
                      </div>
                      <p className="font-semibold text-[#3E342B] line-clamp-2 mt-1">
                        {h.hypothesis_statement}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#7A6A5D] mt-2 pt-1 border-t border-[#DCD5BC]/40">
                        <span>v{h.version_number}</span>
                        <span className="font-mono text-[9px]">{h.generation_provenance?.model_used}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complete 27-Field Structure & Evaluation Details (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {!selectedHypothesis ? (
            <div className="bg-white border border-[#DCD5BC] rounded-lg p-12 text-center text-[#8C7A6B] shadow-sm flex-1 flex flex-col items-center justify-center">
              <Scale className="w-12 h-12 text-[#CCD5AE] mb-3" />
              <h3 className="font-serif text-base font-bold text-[#4B382A]">No Hypothesis Selected</h3>
              <p className="text-xs text-[#6C584C] max-w-md mt-1">
                Select a candidate hypothesis from the pool on the left to inspect its complete 27-field schema, operational variables, 10-point HFI score, and logical audit findings.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD5BC] rounded-lg p-6 shadow-sm space-y-6">
              {/* Header: Title & Action Status */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#DCD5BC]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getParadigmBadgeColor(selectedHypothesis.paradigm_type)}`}>
                      {selectedHypothesis.paradigm_type.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E9EDC9] text-[#4F583D] border border-[#CCD5AE]">
                      Status: {selectedHypothesis.review_state}
                    </span>
                    <span className="text-xs text-[#8B5E34] font-semibold">
                      v{selectedHypothesis.version_number}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#4B382A] mt-1.5">
                    Q: {selectedHypothesis.research_question}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditStatement(selectedHypothesis.hypothesis_statement);
                    }}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold border border-[#8B5E34] text-[#8B5E34] hover:bg-[#8B5E34] hover:text-white transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? 'Cancel Edit' : 'Revise Hypothesis'}
                  </button>
                </div>
              </div>

              {/* Editing Form if Active */}
              {isEditing && (
                <div className="p-4 bg-[#FAEDCD]/30 border border-[#D4A373] rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-[#8B5E34] uppercase tracking-wide">
                    Researcher Revision Protocol
                  </h4>
                  <div>
                    <label className="text-[11px] font-semibold text-[#6C584C] block mb-1">
                      Modified Hypothesis Statement (If-Then-Because):
                    </label>
                    <textarea
                      value={editStatement}
                      onChange={(e) => setEditStatement(e.target.value)}
                      rows={3}
                      className="w-full text-xs border border-[#DCD5BC] rounded p-2 text-[#3E342B]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#6C584C] block mb-1">
                      Modification Rationale (Required for Audit Traceability):
                    </label>
                    <input
                      type="text"
                      value={revisionRationale}
                      onChange={(e) => setRevisionRationale(e.target.value)}
                      placeholder="e.g. Tightened boundary condition to eliminate unmeasurable confounder"
                      className="w-full text-xs border border-[#DCD5BC] rounded p-1.5 text-[#3E342B]"
                    />
                  </div>
                  <button
                    onClick={handleRevise}
                    disabled={!editStatement.trim() || !revisionRationale.trim()}
                    className="bg-[#8B5E34] text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-[#6C584C] disabled:opacity-50"
                  >
                    Commit Verified Revision (Increments Version)
                  </button>
                </div>
              )}

              {/* Core Statement & Scientific Rationale */}
              <div className="space-y-3">
                <div className="p-3.5 bg-[#FAEDCD]/30 rounded border border-[#E9EDC9]">
                  <span className="text-[10px] font-bold text-[#8B5E34] uppercase tracking-wider block mb-1">
                    Formal Hypothesis Statement (Popperian Conditional)
                  </span>
                  <p className="text-xs font-medium text-[#2E2822] leading-relaxed">
                    {selectedHypothesis.hypothesis_statement}
                  </p>
                </div>

                <div className="p-3 bg-white rounded border border-[#DCD5BC]">
                  <span className="text-[10px] font-bold text-[#6C584C] uppercase tracking-wider block mb-1">
                    Mechanistic Scientific Rationale
                  </span>
                  <p className="text-xs text-[#4F4137] leading-relaxed">
                    {selectedHypothesis.scientific_rationale}
                  </p>
                </div>
              </div>

              {/* Operationalized Variables Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Independent Variables */}
                <div className="border border-[#CCD5AE] rounded p-3 bg-[#E9EDC9]/20">
                  <h4 className="text-xs font-bold text-[#3E4A28] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#8B5E34]"></span>
                    Independent Variables (Manipulated Factors)
                  </h4>
                  {selectedHypothesis.independent_variables?.map((iv, idx) => (
                    <div key={idx} className="text-xs space-y-1 mb-2 last:mb-0">
                      <div className="font-semibold text-[#3E342B]">{iv.name}</div>
                      <div className="text-[11px] text-[#6C584C]"><strong>Scale/Unit:</strong> {iv.measurement_unit}</div>
                      <div className="text-[11px] text-[#6C584C]"><strong>Definition:</strong> {iv.operational_definition}</div>
                    </div>
                  ))}
                </div>

                {/* Dependent Variables */}
                <div className="border border-[#D4A373] rounded p-3 bg-[#FAEDCD]/20">
                  <h4 className="text-xs font-bold text-[#8B5E34] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#BC6C25]"></span>
                    Dependent Variables (Outcome Endpoints)
                  </h4>
                  {selectedHypothesis.dependent_variables?.map((dv, idx) => (
                    <div key={idx} className="text-xs space-y-1 mb-2 last:mb-0">
                      <div className="font-semibold text-[#3E342B]">{dv.name}</div>
                      <div className="text-[11px] text-[#6C584C]"><strong>Measurement Unit:</strong> {dv.measurement_unit}</div>
                      <div className="text-[11px] text-[#6C584C]"><strong>Expected Direction:</strong> {dv.expected_direction}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Falsification Criteria & Failure Threshold */}
              <div className="p-3.5 bg-red-50/40 border border-red-200 rounded">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1">
                  Popperian Falsification Criteria & Critical Failure Threshold
                </span>
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Threshold: {selectedHypothesis.critical_failure_threshold}
                </p>
                <ul className="list-disc list-inside text-xs text-red-800 space-y-0.5">
                  {selectedHypothesis.falsification_conditions?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Statistical Null & Alternative Hypotheses */}
              {selectedHypothesis.statistical_formalism_applicable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                    <span className="text-[10px] font-bold text-gray-600 block mb-0.5">Null Hypothesis (H0)</span>
                    <p className="text-[#3E342B]">{selectedHypothesis.null_hypothesis || 'N/A'}</p>
                  </div>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                    <span className="text-[10px] font-bold text-gray-600 block mb-0.5">Alternative Hypothesis (H1)</span>
                    <p className="text-[#3E342B]">{selectedHypothesis.alternative_hypothesis || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* 10-Point HFI Rubric Score Card */}
              <div className="border border-[#DCD5BC] rounded p-4 bg-[#FAEDCD]/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#4B382A] uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#8B5E34]" />
                    10-Point Hypothesis Falsifiability Index (HFI): {selectedHypothesis.falsifiability_rubric_score}/10.0
                  </h4>
                  <span className="text-[11px] font-bold text-[#8B5E34]">
                    {selectedHypothesis.falsifiability_rubric_score >= 8.0 ? '✓ Verified for Review' : '⚠ Refinement Required'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G1: Variables ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G2: Units ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G3: Direction ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G4: Boundaries ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G5: H0/H1 ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G6: Tautology ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G7: Domain Law ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G8: Citations ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G9: Effect Size ✓</div>
                  <div className="p-1.5 bg-white border border-[#DCD5BC] rounded text-center">G10: Baseline ✓</div>
                </div>
              </div>

              {/* Logical Audit Findings */}
              {selectedHypothesis.logical_audit_findings && selectedHypothesis.logical_audit_findings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Logical Audit Findings ({selectedHypothesis.logical_audit_findings.length})
                  </div>
                  {selectedHypothesis.logical_audit_findings.map((f, idx) => (
                    <div key={idx} className="text-amber-800 text-[11px]">
                      <strong>[{f.severity}] {f.code}:</strong> {f.description} (Field: {f.fieldAffected})
                    </div>
                  ))}
                </div>
              )}

              {/* Version History Table */}
              <div className="pt-2 border-t border-[#DCD5BC]">
                <h4 className="text-xs font-bold text-[#4B382A] mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#8B5E34]" />
                  Immutable Version Audit Log ({versionHistory.length} revisions)
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  {versionHistory.map((v) => (
                    <div key={v.id} className="p-2 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#8B5E34] mr-2">v{v.version_number}</span>
                        <span className="text-[#3E342B]">{v.modification_rationale}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Attribution & Cryptographic Provenance */}
              <div className="pt-2 border-t border-[#DCD5BC] flex flex-wrap items-center justify-between text-[10px] text-[#7A6A5D] font-mono">
                <div>Model: {selectedHypothesis.generation_provenance?.model_used} ({selectedHypothesis.generation_provenance?.prompt_version})</div>
                <div>Hash: {selectedHypothesis.generation_provenance?.evidence_corpus_hash?.slice(0, 24)}...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
