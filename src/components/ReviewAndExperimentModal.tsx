import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Beaker, FileText, Check, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { Contribution } from '../data/mockData';

interface ReviewAndExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: Contribution | null;
  currentUserId?: string;
  onCompleteReview: (reviewData: {
    contributionId: string;
    decision: 'Accepted' | 'Request Changes' | 'Rejected';
    reviewComments: string;
    ratingScore: number;
    conflictDeclared: boolean;
    experimentTitle?: string;
    environmentSpecs?: string;
    metricsResults?: string;
    outcomeStatus?: 'Independently Replicated' | 'Supported by Experiment' | 'Not Supported' | 'Inconclusive';
  }) => void;
}

export const ReviewAndExperimentModal: React.FC<ReviewAndExperimentModalProps> = ({
  isOpen,
  onClose,
  contribution,
  currentUserId = 'user-999', // Default reviewer ID distinct from author 'user-101'
  onCompleteReview
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'experiment'>('review');

  // Review Form State
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [reviewComments, setReviewComments] = useState('');
  const [conflictDeclared, setConflictDeclared] = useState(false);
  const [decision, setDecision] = useState<'Accepted' | 'Request Changes' | 'Rejected'>('Accepted');

  // Experiment & Outcome State
  const [experimentTitle, setExperimentTitle] = useState('');
  const [environmentSpecs, setEnvironmentSpecs] = useState('NVIDIA H100 80GB GPU, PyTorch 2.4, Triton CUDA v2.1');
  const [datasetRef, setDatasetRef] = useState('MHC-256k Multi-Hop Chain Evaluation Dataset');
  const [metricsResults, setMetricsResults] = useState('Peak Memory: 12.4 GB (O(1) bound), FLOP Overhead: 8.2%, Perplexity Delta: +0.01');
  const [reproducibilityInstructions, setReproductionInstructions] = useState('1. Clone repo. 2. Run python benchmark_h100.py --context 512000');
  const [outcomeStatus, setOutcomeStatus] = useState<'Independently Replicated' | 'Supported by Experiment' | 'Not Supported' | 'Inconclusive'>('Independently Replicated');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !contribution) return null;

  const isAuthor = currentUserId === contribution.contributorId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthor) {
      setErrorMsg('Self-Review Security Violation: Authors are prohibited from peer-reviewing or self-approving their own proposals.');
      return;
    }

    if (!reviewComments.trim()) {
      setErrorMsg('Please provide detailed peer review comments before submitting.');
      return;
    }

    onCompleteReview({
      contributionId: contribution.id,
      decision,
      reviewComments,
      ratingScore,
      conflictDeclared,
      experimentTitle: experimentTitle || `Trial Execution: ${contribution.title}`,
      environmentSpecs,
      metricsResults,
      outcomeStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div>
            <span className="text-[10px] font-bold text-[#8B5E34] uppercase tracking-wider font-mono">
              Peer Review & Experiment Verification Engine
            </span>
            <h3 className="text-base font-bold text-[#342F27]">
              Evaluate Proposal: {contribution.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-[#E9EDC9] px-6 py-2 border-b border-[#DCD5BC] flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'review' ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299] shadow-2xs' : 'text-[#6B6255] hover:text-[#342F27]'
            }`}
          >
            1. Peer Review Evaluation
          </button>
          <button
            onClick={() => setActiveTab('experiment')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'experiment' ? 'bg-[#CCD5AE] text-[#342F27] font-bold border border-[#B8C299] shadow-2xs' : 'text-[#6B6255] hover:text-[#342F27]'
            }`}
          >
            2. Record Experiment & Outcome
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-[#342F27]">
          
          {isAuthor && (
            <div className="p-3.5 bg-[#986515]/15 border border-[#986515]/30 text-[#986515] rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-5 h-5 text-[#986515] shrink-0" />
              <span>
                <strong>Self-Review Prevention Enforced:</strong> You are the author of this proposal. You may view the experiment details but cannot submit peer review decisions or validate your own work.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#B83A32]/10 border border-[#B83A32]/30 text-[#B83A32] rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Proposal Summary Box */}
          <div className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] space-y-1">
            <span className="text-[10px] font-bold text-[#6B6255] uppercase">Target Proposal Summary</span>
            <p className="font-semibold text-[#342F27]">{contribution.title}</p>
            <p className="text-[#6B6255] leading-relaxed">{contribution.summary}</p>
          </div>

          {/* TAB 1: PEER REVIEW EVALUATION */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              
              {/* Rating Score */}
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Methodological Soundness & Feasibility Score (1 - 5 Stars)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 text-[#D4A373] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= ratingScore ? 'fill-[#D4A373] text-[#D4A373]' : 'text-[#DCD5BC]'}`} />
                    </button>
                  ))}
                  <span className="ml-2 font-mono font-bold text-[#342F27]">{ratingScore} / 5</span>
                </div>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Detailed Peer Review Evaluation & Critique *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the proposal's theoretical validity, potential limitations, hardware feasibility, and reproducibility prospects..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
                />
              </div>

              {/* Conflict of Interest Declaration */}
              <div className="p-3 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conflictDeclared}
                    onChange={(e) => setConflictDeclared(e.target.checked)}
                    className="w-4 h-4 text-[#D4A373] rounded focus:ring-[#D4A373]"
                  />
                  <span className="font-semibold text-[#342F27]">
                    I declare no conflict of interest or financial relationship with the proposal authors.
                  </span>
                </label>
              </div>

              {/* Review Decision */}
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Reviewer Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Accepted', label: 'Approve & Accept for Experiment', color: 'bg-[#CCD5AE] text-[#342F27] border-[#287A50]/40' },
                    { id: 'Request Changes', label: 'Request Revision', color: 'bg-[#E9EDC9] text-[#986515] border-[#986515]/40' },
                    { id: 'Rejected', label: 'Reject Proposal', color: 'bg-[#B83A32]/10 text-[#B83A32] border-[#B83A32]/30' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDecision(d.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        decision === d.id ? `${d.color} shadow-2xs ring-2 ring-[#D4A373]` : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RECORD EXPERIMENT & OUTCOME */}
          {activeTab === 'experiment' && (
            <div className="space-y-4">
              
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Trial / Experiment Title</label>
                <input
                  type="text"
                  placeholder="e.g. NVIDIA H100 512k Token Context Memory Allocation Trial"
                  value={experimentTitle}
                  onChange={(e) => setExperimentTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#342F27] mb-1">Environment / Hardware Specs</label>
                  <input
                    type="text"
                    value={environmentSpecs}
                    onChange={(e) => setEnvironmentSpecs(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#342F27] mb-1">Dataset Reference</label>
                  <input
                    type="text"
                    value={datasetRef}
                    onChange={(e) => setDatasetRef(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#342F27] mb-1">Quantitative Metrics & Results</label>
                <textarea
                  rows={2}
                  value={metricsResults}
                  onChange={(e) => setMetricsResults(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#342F27] mb-1">Reproduction Instructions</label>
                <textarea
                  rows={2}
                  value={reproducibilityInstructions}
                  onChange={(e) => setReproductionInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-mono text-[11px]"
                />
              </div>

              {/* Outcome Status */}
              <div>
                <label className="block font-bold text-[#342F27] mb-1">Empirical Outcome Status (Supports Negative Results!)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Independently Replicated', label: 'Independently Replicated (Validated)', badge: 'bg-[#CCD5AE] text-[#342F27] border-[#287A50]/40' },
                    { id: 'Supported by Experiment', label: 'Supported by Experiment', badge: 'bg-[#E9EDC9] text-[#342F27] border-[#DCD5BC]' },
                    { id: 'Not Supported', label: 'Not Supported / Failed Experiment (Negative Result)', badge: 'bg-[#B83A32]/10 text-[#B83A32] border-[#B83A32]/30' },
                    { id: 'Inconclusive', label: 'Inconclusive / Needs Further Investigation', badge: 'bg-[#986515]/10 text-[#986515] border-[#986515]/30' }
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOutcomeStatus(o.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                        outcomeStatus === o.id ? `${o.badge} shadow-2xs ring-2 ring-[#D4A373]` : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC]'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Modal Footer Submit */}
          <div className="pt-3 border-t border-[#DCD5BC] flex items-center justify-between">
            <span className="text-[11px] text-[#6B6255] font-mono">
              Action logged to audit ledger
            </span>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Peer Review & Record Outcome</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
