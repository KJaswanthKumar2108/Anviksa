import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Users,
  BarChart2,
  FileCheck,
  RefreshCw,
  Send,
  Sliders,
  History,
  ShieldCheck,
  Info
} from 'lucide-react';
import { getSupabase } from '../lib/supabase';

interface EvaluationResult {
  entityType: string;
  entityId: string;
  overallScore: number;
  passedGates: boolean;
  criteria: Array<{
    criterion: string;
    score: number;
    passed: boolean;
    notes: string;
  }>;
  metrics: Record<string, any>;
  evaluatorVersion: string;
}

interface ReviewRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  reviewer_id: string;
  decision: string;
  review_comments: string;
  criterion_scores: Record<string, number>;
  reviewer_role: string;
  is_self_review: boolean;
  adjudication_notes?: string;
  is_invalidated: boolean;
  invalidation_reason?: string;
  reviewed_at: string;
}

export const ScientificEvaluationWorkbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'review' | 'statistical' | 'reliability'>('audit');

  // Audit Tab State
  const [auditEntityType, setAuditEntityType] = useState<'OPPORTUNITY' | 'HYPOTHESIS' | 'EXPERIMENT' | 'SUITABILITY'>('HYPOTHESIS');
  const [auditEntityId, setAuditEntityId] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<EvaluationResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Review Tab State
  const [reviewEntityType, setReviewEntityType] = useState<'HYPOTHESIS' | 'EXPERIMENT' | 'OPPORTUNITY'>('HYPOTHESIS');
  const [reviewEntityId, setReviewEntityId] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'MODIFIED_AND_APPROVED' | 'REVISION_REQUESTED'>('APPROVED');
  const [reviewerRole, setReviewerRole] = useState<'INDEPENDENT_PEER' | 'AUTHOR' | 'SENIOR_ARBITRATOR'>('INDEPENDENT_PEER');
  const [reviewComments, setReviewComments] = useState('');
  const [adjudicationNotes, setAdjudicationNotes] = useState('');
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>({
    falsifiability: 5,
    baseline_authenticity: 5,
    methodological_rigor: 4,
    clarity: 4,
    executability: 4
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<ReviewRecord[]>([]);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Statistical Tab State
  const [tauX, setTauX] = useState('8.8, 7.5, 9.2, 6.4, 8.1, 5.5, 9.0, 7.8, 6.9, 8.5');
  const [tauY, setTauY] = useState('9.0, 7.0, 9.5, 6.0, 8.0, 5.0, 9.2, 8.0, 7.1, 8.7');
  const [tauLoading, setTauLoading] = useState(false);
  const [tauResult, setTauResult] = useState<any>(null);

  const [pciScoresInput, setPciScoresInput] = useState('9.2, 8.8, 9.5, 8.5, 9.0, 8.7, 9.8, 8.9, 9.1, 8.6, 9.4, 9.0');
  const [pciLoading, setPciLoading] = useState(false);
  const [pciResult, setPciResult] = useState<any>(null);

  // Reliability Tab State
  const [krippMatrixInput, setKrippMatrixInput] = useState('4, 5, 4, 3, 5\n4, 4, 4, 3, 4\n5, 5, 4, 3, null');
  const [krippLoading, setKrippLoading] = useState(false);
  const [krippResult, setKrippResult] = useState<any>(null);

  // Handle Multi-Criterion Quality Audit
  const handleRunQualityAudit = async () => {
    if (!auditEntityId.trim()) {
      setAuditError('Please enter a valid Entity UUID.');
      return;
    }
    setAuditLoading(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const res = await fetch('/api/research/evaluations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: auditEntityType,
          entityId: auditEntityId.trim(),
          persist: true
        })
      });
      const data = await res.json();
      if (!data.success) {
        setAuditError(data.error || 'Evaluation failed.');
      } else {
        setAuditResult(data.evaluation);
      }
    } catch (err: any) {
      setAuditError(err.message || 'Network error.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle Human Review Submission
  const handleSubmitReview = async () => {
    if (!reviewEntityId.trim()) {
      setReviewError('Please specify target Entity UUID.');
      return;
    }
    if (!reviewComments.trim()) {
      setReviewError('Review comments are mandatory.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccessMsg(null);

    try {
      const supabase = getSupabase();
      const session = await supabase?.auth.getSession();
      const token = session?.data?.session?.access_token;

      if (!token) {
        setReviewError('Authentication required. Please sign in to submit scientific reviews.');
        setReviewSubmitting(false);
        return;
      }

      const res = await fetch('/api/research/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entityType: reviewEntityType,
          entityId: reviewEntityId.trim(),
          decision: reviewDecision,
          reviewComments,
          criterionScores,
          reviewerRole,
          adjudicationNotes: adjudicationNotes.trim() ? adjudicationNotes.trim() : undefined
        })
      });

      const data = await res.json();
      if (!data.success) {
        setReviewError(data.error || 'Failed to submit review.');
      } else {
        setReviewSuccessMsg(`Review recorded successfully (ID: ${data.reviewId.slice(0, 8)}...). Role: ${data.effectiveRole}${data.isSelfReview ? ' (Author Self-Review)' : ''}${data.escalatedToArbitration ? ' [Escalated to Senior Arbitrator]' : ''}`);
        // Fetch review history
        fetchReviewHistory(reviewEntityType, reviewEntityId.trim());
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const fetchReviewHistory = async (type: string, id: string) => {
    try {
      const res = await fetch(`/api/research/reviews/${type}/${id}`);
      const data = await res.json();
      if (data.success) {
        setReviewHistory(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  // Run Kendall's Tau_b
  const handleRunKendallTau = async () => {
    setTauLoading(true);
    try {
      const x = tauX.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const y = tauY.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const res = await fetch('/api/research/evaluations/statistical/kendall-tau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x,
          y,
          runBootstrap: true,
          bootstrapReps: 2000,
          runPermutation: true,
          permutationReps: 10000
        })
      });
      const data = await res.json();
      setTauResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTauLoading(false);
    }
  };

  // Run PCI Distribution
  const handleRunPCIDistribution = async () => {
    setPciLoading(true);
    try {
      const pciScores = pciScoresInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const res = await fetch('/api/research/evaluations/statistical/pci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pciScores,
          bootstrapReps: 2000
        })
      });
      const data = await res.json();
      setPciResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPciLoading(false);
    }
  };

  // Run Krippendorff's Alpha
  const handleRunKrippendorff = async () => {
    setKrippLoading(true);
    try {
      const lines = krippMatrixInput.trim().split('\n');
      const matrix = lines.map(line =>
        line.split(',').map(cell => {
          const t = cell.trim();
          if (t === 'null' || t === '') return null;
          const num = parseFloat(t);
          return isNaN(num) ? null : num;
        })
      );
      const res = await fetch('/api/research/evaluations/reliability/krippendorff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratingMatrix: matrix,
          metricType: 'ordinal'
        })
      });
      const data = await res.json();
      setKrippResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setKrippLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAEDCD]/20 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#DCD5BC] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#287A50]" />
            <h1 className="text-xl font-bold text-[#342F27]">Scientific Evaluation & Human Review Workbench</h1>
            <span className="bg-[#287A50]/10 text-[#287A50] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#287A50]/20">
              Stage 4E-IMP-05
            </span>
          </div>
          <p className="text-xs text-[#5C5549] mt-1">
            Popperian falsifiability rubrics, double-blind BIBD multi-rater annotation, tie-corrected Kendall’s τ_b, and immutable human review audit trails.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#CCD5AE]/40 p-1 rounded-lg border border-[#DCD5BC] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'audit' ? 'bg-white shadow text-[#287A50]' : 'text-[#5C5549] hover:text-[#342F27]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Quality Audit
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'review' ? 'bg-white shadow text-[#287A50]' : 'text-[#5C5549] hover:text-[#342F27]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Human Review
          </button>
          <button
            onClick={() => setActiveTab('statistical')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'statistical' ? 'bg-white shadow text-[#287A50]' : 'text-[#5C5549] hover:text-[#342F27]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Statistical Inference
          </button>
          <button
            onClick={() => setActiveTab('reliability')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'reliability' ? 'bg-white shadow text-[#287A50]' : 'text-[#5C5549] hover:text-[#342F27]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Inter-Rater Reliability
          </button>
        </div>
      </div>

      {/* TAB 1: QUALITY AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#287A50]" />
              Automated Multi-Criterion Artifact Evaluation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Target Artifact Type</label>
                <select
                  value={auditEntityType}
                  onChange={(e: any) => setAuditEntityType(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                >
                  <option value="OPPORTUNITY">Research Opportunity (4E-IMP-01)</option>
                  <option value="HYPOTHESIS">Falsifiable Hypothesis (4E-IMP-02)</option>
                  <option value="EXPERIMENT">Experiment Protocol (4E-IMP-03)</option>
                  <option value="SUITABILITY">Resource Suitability (4E-IMP-04)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Entity UUID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter UUID..."
                    value={auditEntityId}
                    onChange={(e) => setAuditEntityId(e.target.value)}
                    className="flex-1 text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                  />
                  <button
                    onClick={handleRunQualityAudit}
                    disabled={auditLoading}
                    className="bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {auditLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                    Audit Quality
                  </button>
                </div>
              </div>
            </div>

            {auditError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {auditError}
              </div>
            )}
          </div>

          {auditResult && (
            <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
                <div>
                  <h3 className="text-sm font-bold text-[#342F27]">Quality Audit Findings: {auditResult.entityType}</h3>
                  <p className="text-xs text-[#5C5549] mt-0.5">Evaluator Version: {auditResult.evaluatorVersion}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-[#5C5549] block">Overall Score</span>
                    <span className="text-base font-bold text-[#287A50]">{auditResult.overallScore} / 10.0</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    auditResult.passedGates ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {auditResult.passedGates ? 'GATES PASSED' : 'REFINEMENT REQUIRED'}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#CCD5AE]/20 border-b border-[#DCD5BC] text-[#5C5549]">
                      <th className="p-2.5 font-semibold">Evaluation Criterion</th>
                      <th className="p-2.5 font-semibold">Score</th>
                      <th className="p-2.5 font-semibold">Status</th>
                      <th className="p-2.5 font-semibold">Detailed Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResult.criteria.map((c, i) => (
                      <tr key={i} className="border-b border-[#DCD5BC]/60 hover:bg-[#FEFAE0]/20">
                        <td className="p-2.5 font-medium text-[#342F27]">{c.criterion}</td>
                        <td className="p-2.5 font-semibold text-[#287A50]">{c.score} / 10.0</td>
                        <td className="p-2.5">
                          {c.passed ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <XCircle className="w-3.5 h-3.5" /> Deficient
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[#5C5549]">{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HUMAN REVIEW */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#287A50]" />
                Formal Scientific Review & Sign-Off
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#5C5549] bg-[#CCD5AE]/20 px-2.5 py-1 rounded-md">
                <Info className="w-3.5 h-3.5" />
                <span>All decisions are immutably logged with full parameter provenance.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Entity Type</label>
                <select
                  value={reviewEntityType}
                  onChange={(e: any) => setReviewEntityType(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                >
                  <option value="HYPOTHESIS">Hypothesis (4E-IMP-02)</option>
                  <option value="EXPERIMENT">Experiment Protocol (4E-IMP-03)</option>
                  <option value="OPPORTUNITY">Opportunity (4E-IMP-01)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Target Entity UUID</label>
                <input
                  type="text"
                  placeholder="Enter UUID..."
                  value={reviewEntityId}
                  onChange={(e) => {
                    setReviewEntityId(e.target.value);
                    if (e.target.value.trim().length > 30) {
                      fetchReviewHistory(reviewEntityType, e.target.value.trim());
                    }
                  }}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Review Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e: any) => setReviewDecision(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="MODIFIED_AND_APPROVED">MODIFIED_AND_APPROVED</option>
                  <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Reviewer Role</label>
                <select
                  value={reviewerRole}
                  onChange={(e: any) => setReviewerRole(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                >
                  <option value="INDEPENDENT_PEER">Independent Peer Reviewer (Unconflicted)</option>
                  <option value="AUTHOR">Author / Creator (Self-Review)</option>
                  <option value="SENIOR_ARBITRATOR">Senior Scientific Arbitrator (Binding)</option>
                </select>
                <p className="text-[11px] text-[#8C857B] mt-1">
                  Author self-reviews cannot transition an artifact to <code>RESEARCHER_APPROVED</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C5549] mb-1">Arbitration Notes (If Resolving Disagreements)</label>
                <input
                  type="text"
                  placeholder="Mandatory binding rationale if delta > 1.5 or split 2-1..."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
                />
              </div>
            </div>

            {/* Rubric Likert Ratings */}
            <div>
              <label className="block text-xs font-medium text-[#5C5549] mb-2">Multi-Criterion Rubric Ratings (1 to 5 scale)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(criterionScores).map(([crit, val]) => (
                  <div key={crit} className="bg-[#FEFAE0]/40 p-2.5 rounded-lg border border-[#DCD5BC]">
                    <div className="text-[11px] font-semibold text-[#342F27] capitalize">{crit.replace('_', ' ')}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={val}
                        onChange={(e) => setCriterionScores({ ...criterionScores, [crit]: parseInt(e.target.value) })}
                        className="w-full accent-[#287A50]"
                      />
                      <span className="font-bold text-[#287A50] text-xs">{val}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Comments */}
            <div>
              <label className="block text-xs font-medium text-[#5C5549] mb-1">Scientific Review Comments & Rationale</label>
              <textarea
                rows={3}
                placeholder="Provide detailed methodological feedback, physical constraints, variable isolation comments..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
              />
            </div>

            {reviewError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {reviewError}
              </div>
            )}

            {reviewSuccessMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {reviewSuccessMsg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {reviewSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit Formal Review
              </button>
            </div>
          </div>

          {/* Immutable Review Audit History */}
          {reviewHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
                <History className="w-4 h-4 text-[#287A50]" />
                Immutable Review Audit Trail ({reviewHistory.length} Recorded)
              </h3>
              <div className="space-y-3">
                {reviewHistory.map((rev) => (
                  <div key={rev.id} className={`p-4 rounded-lg border text-xs ${
                    rev.is_invalidated ? 'bg-amber-50/50 border-amber-200 opacity-75' : 'bg-[#FEFAE0]/20 border-[#DCD5BC]'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-[#DCD5BC]/40">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          rev.decision === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          rev.decision === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {rev.decision}
                        </span>
                        <span className="font-semibold text-[#342F27]">Role: {rev.reviewer_role}</span>
                        {rev.is_self_review && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                            Self-Review
                          </span>
                        )}
                        {rev.is_invalidated && (
                          <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> INVALIDATED ({rev.invalidation_reason || 'PARENT REVISED'})
                          </span>
                        )}
                      </div>
                      <span className="text-[#8C857B] text-[11px]">
                        {new Date(rev.reviewed_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-[#342F27] leading-relaxed">{rev.review_comments}</p>
                    {rev.adjudication_notes && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                        <strong>Senior Arbitrator Ruling:</strong> {rev.adjudication_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STATISTICAL INFERENCE */}
      {activeTab === 'statistical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kendall's Tau_b */}
          <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#287A50]" />
              Kendall’s Rank Correlation (τ_b) Concordance
            </h3>
            <p className="text-xs text-[#5C5549]">
              Tie-corrected rank correlation with 2,000-replication Paired BCa Bootstrap 95% CI and 10,000-permutation test.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#5C5549] mb-1">Algorithm Scores Vector (X)</label>
                <input
                  type="text"
                  value={tauX}
                  onChange={(e) => setTauX(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2 focus:ring-1 focus:ring-[#287A50]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#5C5549] mb-1">Human Expert Median Ranks (Y)</label>
                <input
                  type="text"
                  value={tauY}
                  onChange={(e) => setTauY(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2 focus:ring-1 focus:ring-[#287A50]"
                />
              </div>
              <button
                onClick={handleRunKendallTau}
                disabled={tauLoading}
                className="bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {tauLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
                Compute τ_b & BCa Confidence Interval
              </button>
            </div>

            {tauResult && tauResult.success && (
              <div className="p-3 bg-[#FEFAE0]/40 rounded-lg border border-[#DCD5BC] text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#342F27]">Observed Kendall’s τ_b:</span>
                  <span className="font-bold text-[#287A50] text-sm">{tauResult.base.tau_b}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                  <span>Concordant Pairs / Discordant Pairs:</span>
                  <span>{tauResult.base.concordant} / {tauResult.base.discordant}</span>
                </div>
                {tauResult.bootstrap && (
                  <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                    <span>BCa 95% Confidence Interval:</span>
                    <span className="font-mono font-semibold text-[#342F27]">
                      [{tauResult.bootstrap.ciLower}, {tauResult.bootstrap.ciUpper}]
                    </span>
                  </div>
                )}
                {tauResult.permutation && (
                  <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                    <span>Exact Permutation p-value (B=10,000):</span>
                    <span className="font-mono font-semibold text-[#342F27]">
                      p = {tauResult.permutation.pValueTwoSided} ({tauResult.permutation.significantAt05 ? 'p < 0.05' : 'n.s.'})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PCI Distribution */}
          <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#287A50]" />
              Protocol Completeness Index (PCI) Calibration
            </h3>
            <p className="text-xs text-[#5C5549]">
              Bounded Non-Parametric BCa Bootstrap over [0.0, 10.0] support vs Bayesian Squeezed Beta Transformation (Smithson & Verkuilen 2006).
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#5C5549] mb-1">Synthesized Protocols PCI Scores (N items)</label>
                <input
                  type="text"
                  value={pciScoresInput}
                  onChange={(e) => setPciScoresInput(e.target.value)}
                  className="w-full text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2 focus:ring-1 focus:ring-[#287A50]"
                />
              </div>
              <button
                onClick={handleRunPCIDistribution}
                disabled={pciLoading}
                className="bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {pciLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                Evaluate PCI Distributions
              </button>
            </div>

            {pciResult && pciResult.success && (
              <div className="p-3 bg-[#FEFAE0]/40 rounded-lg border border-[#DCD5BC] text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#342F27]">Sample Mean PCI:</span>
                  <span className="font-bold text-[#287A50] text-sm">{pciResult.meanPCI} / 10.0</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                  <span>Primary Bounded BCa Bootstrap CI:</span>
                  <span className="font-mono font-semibold text-[#342F27]">
                    [{pciResult.bcaBootstrapCI[0]}, {pciResult.bcaBootstrapCI[1]}]
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                  <span>Bayesian Squeezed Beta CI (p*):</span>
                  <span className="font-mono font-semibold text-[#342F27]">
                    [{pciResult.bayesianSqueezedBetaCI[0]}, {pciResult.bayesianSqueezedBetaCI[1]}]
                  </span>
                </div>
                <div className="pt-1 flex items-center gap-1.5 font-semibold text-[11px]">
                  <span>Acceptance Target (&gt;= 8.5):</span>
                  <span className={pciResult.targetMet ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                    {pciResult.targetMet ? 'TARGET MET' : 'TARGET NOT REACHED'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INTER-RATER RELIABILITY */}
      {activeTab === 'reliability' && (
        <div className="bg-white rounded-xl border border-[#DCD5BC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#287A50]" />
              Krippendorff’s Alpha (α_Kripp) & BIBD Annotation
            </h3>
            <span className="text-xs bg-[#CCD5AE]/20 px-2.5 py-1 rounded text-[#5C5549]">
              Pilot Study N=20 Standard: α &gt;= 0.70 (Main Target &gt;= 0.80)
            </span>
          </div>
          <p className="text-xs text-[#5C5549]">
            Calculates coincidence matrices and ordinal disagreement metrics δ²(c, k), handling missing values and degenerate distributions honestly.
          </p>

          <div>
            <label className="block text-xs font-medium text-[#5C5549] mb-1">
              Rater Matrix (Rows = Raters, Columns = Artifacts, use comma and newline, 'null' for missing)
            </label>
            <textarea
              rows={4}
              value={krippMatrixInput}
              onChange={(e) => setKrippMatrixInput(e.target.value)}
              className="w-full font-mono text-xs bg-[#FEFAE0]/30 border border-[#DCD5BC] rounded-lg p-2.5 focus:ring-1 focus:ring-[#287A50]"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleRunKrippendorff}
              disabled={krippLoading}
              className="bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {krippLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Calculate Krippendorff’s Alpha
            </button>
          </div>

          {krippResult && krippResult.success && (
            <div className="p-4 bg-[#FEFAE0]/40 rounded-lg border border-[#DCD5BC] text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#342F27]">Krippendorff’s Alpha (α):</span>
                <span className="font-bold text-[#287A50] text-base">
                  {krippResult.alpha !== null ? krippResult.alpha : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                <span>Reliability Classification Status:</span>
                <span className="font-semibold text-[#342F27]">{krippResult.status}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                <span>Observed Disagreement (D_o) / Expected Disagreement (D_e):</span>
                <span>{krippResult.observedDisagreement} / {krippResult.expectedDisagreement}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#5C5549]">
                <span>Pairable Artifact Units:</span>
                <span>{krippResult.pairableUnitsCount} units</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
