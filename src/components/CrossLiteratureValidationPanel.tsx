import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GitBranch,
  FileCheck2,
  Users,
  Search,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Archive,
  Info,
  Sparkles
} from 'lucide-react';

export type ValidationOutcome = 
  | 'CONFIRMED_UNRESOLVED'
  | 'PARTIALLY_ADDRESSED'
  | 'ADDRESSED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface ValidationReportData {
  validationId?: string;
  validationRunId?: string;
  gapId: string;
  gapTitle: string;
  previousEpistemicClassification?: string;
  newEpistemicClassification?: string;
  validationOutcome: ValidationOutcome;
  provisionalValidationStrength: number;
  provisionalScoreResult?: {
    score: number;
    baseEvidenceQuality: number;
    methodologicalRigidity: number;
    sourceIndependenceWeight: number;
    recencyFactor: number;
    coverageFactor: number;
    contradictionDampener: number;
    rawCombinedQuality: number;
    isFoundationalExempt?: boolean;
    warningNotice: string;
  };
  reasoningSummary: string;
  requiresHumanReview: boolean;
  humanReviewReasons?: string[];
  relationships?: Array<{
    id?: string;
    relationshipType: string;
    targetPaperTitle?: string;
    targetPaperDoi?: string;
    confidenceWeight: number;
    verifiableQuote?: string;
    sourceLocator?: string;
  }>;
  replicationSummary?: {
    satisfiesStandardReplication: boolean;
    satisfiesHybridReplication: boolean;
    independentCount: number;
    partiallyDependentCount: number;
    fullyDependentCount: number;
    effectivePathway: string;
    pathwayLabel: string;
  };
  corpusSize?: number;
  corpusHash?: string;
}

interface CrossLiteratureValidationPanelProps {
  initialReport?: ValidationReportData | null;
  gapId?: string;
  gapTitle?: string;
  gapDescription?: string;
  onValidate?: (gapId: string) => Promise<ValidationReportData | null>;
  onArchive?: (gapId: string, reason: string) => Promise<boolean>;
}

export const CrossLiteratureValidationPanel: React.FC<CrossLiteratureValidationPanelProps> = ({
  initialReport,
  gapId,
  gapTitle,
  gapDescription,
  onValidate,
  onArchive
}) => {
  const [report, setReport] = useState<ValidationReportData | null>(initialReport || null);
  const [isValidating, setIsValidating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<number, boolean>>({});
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunValidation = async () => {
    const targetGapId = gapId || report?.gapId;
    if (!targetGapId) return;

    setIsValidating(true);
    setErrorMessage(null);
    try {
      if (onValidate) {
        const res = await onValidate(targetGapId);
        if (res) setReport(res);
      } else {
        const response = await fetch('/api/research/gaps/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gapId: targetGapId,
            discoveryBudget: 'STANDARD_VALIDATION'
          })
        });
        const data = await response.json();
        if (data.success && data.report) {
          setReport({
            validationId: data.report.validationId,
            validationRunId: data.report.validationRunId,
            gapId: targetGapId,
            gapTitle: gapTitle || 'Validated Research Gap',
            previousEpistemicClassification: data.report.previousEpistemicClassification,
            newEpistemicClassification: data.report.newEpistemicClassification,
            validationOutcome: data.report.validationOutcome,
            provisionalValidationStrength: data.report.provisionalValidationStrength,
            provisionalScoreResult: data.report.provisionalScoreResult,
            reasoningSummary: data.report.reasoningSummary,
            requiresHumanReview: data.report.requiresHumanReview,
            humanReviewReasons: data.report.humanReviewReasons,
            relationships: data.report.relationshipsToPersist?.map((r: any) => ({
              relationshipType: r.relationship_type,
              targetPaperTitle: r.target_paper_id ? `Referenced Literature Entity [${r.target_paper_id.slice(0, 8)}]` : 'Cross-Disciplinary Work',
              confidenceWeight: r.confidence_weight,
              verifiableQuote: r.verifiable_quote,
              sourceLocator: r.source_locator
            })),
            replicationSummary: data.report.replicationSummary,
            corpusSize: data.report.evaluatedCorpusCount,
            corpusHash: data.report.corpusHash
          });
        } else {
          setErrorMessage(data.error || 'Failed to complete cross-literature validation.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Validation request failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleArchiveGap = async () => {
    const targetGapId = gapId || report?.gapId;
    if (!targetGapId) return;
    if (!window.confirm('Are you sure you want to soft-archive this research gap? Archived gaps remain in historical validation records but are hidden from active queries.')) {
      return;
    }

    setIsArchiving(true);
    try {
      if (onArchive) {
        const ok = await onArchive(targetGapId, 'Researcher initiated archival via UI');
        if (ok) setIsArchived(true);
      } else {
        const response = await fetch(`/api/research/gaps/${targetGapId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archivalReason: 'Soft-archived from Cross-Literature Panel' })
        });
        const data = await response.json();
        if (data.success) {
          setIsArchived(true);
        } else {
          alert('Failed to archive gap: ' + data.error);
        }
      }
    } catch (err: any) {
      alert('Error archiving gap: ' + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const toggleQuote = (idx: number) => {
    setExpandedQuotes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getOutcomeBadge = (outcome: ValidationOutcome) => {
    switch (outcome) {
      case 'CONFIRMED_UNRESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E9EDC9] text-[#287A50] border border-[#B8C299]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONFIRMED UNRESOLVED (GENUINE GAP)
          </span>
        );
      case 'PARTIALLY_ADDRESSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAEDCD] text-[#8B5E34] border border-[#DCD5BC]">
            <AlertCircle className="w-3.5 h-3.5" />
            PARTIALLY ADDRESSED
          </span>
        );
      case 'ADDRESSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4A373] text-white border border-[#C59465]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ADDRESSED / SUPERSEDED
          </span>
        );
      case 'CONTRADICTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E76F51] text-white border border-[#C59465]">
            <ShieldAlert className="w-3.5 h-3.5" />
            CONTRADICTED BY EVIDENCE
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEFAE0] text-[#6B6255] border border-[#DCD5BC]">
            <HelpCircle className="w-3.5 h-3.5" />
            INSUFFICIENT EVIDENCE (ABSTAINED)
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5BC] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#CCD5AE] text-[#342F27]">
              STAGE 4D
            </span>
            <span className="text-xs text-[#6B6255] font-medium">Cross-Literature Validation Engine</span>
          </div>
          <h3 className="text-lg font-bold text-[#342F27]">
            {gapTitle || report?.gapTitle || 'Candidate Research Gap Validation'}
          </h3>
          {gapDescription && (
            <p className="text-xs text-[#6B6255] mt-1 max-w-2xl leading-relaxed">
              {gapDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunValidation}
            disabled={isValidating || isArchived}
            className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Evaluating Corpus...' : 'Validate Against Literature'}</span>
          </button>

          <button
            onClick={handleArchiveGap}
            disabled={isArchiving || isArchived}
            title="Soft-archive this research gap"
            className="p-2 text-xs font-bold text-[#8B5E34] bg-[#FAEDCD] hover:bg-[#DCD5BC] border border-[#DCD5BC] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isArchived && (
        <div className="bg-[#FAEDCD] border border-[#DCD5BC] p-3 rounded-xl flex items-center gap-2 text-xs text-[#8B5E34] font-medium">
          <Archive className="w-4 h-4 shrink-0" />
          <span>This research gap has been soft-archived. Historical validation runs and relationship edges are preserved.</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#F8D7DA] border border-[#F5C6CB] text-[#721C24] p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Validation View */}
      {report ? (
        <div className="space-y-6">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Outcome Card */}
            <div className="bg-[#FAEDCD] border border-[#DCD5BC] p-4 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-[#8B5E34] uppercase tracking-wider block">
                Validation Outcome
              </span>
              <div>
                {getOutcomeBadge(report.validationOutcome)}
              </div>
              <p className="text-[11px] text-[#6B6255] pt-1">
                {report.newEpistemicClassification ? (
                  <>Classification: <span className="font-mono font-semibold text-[#342F27]">{report.newEpistemicClassification}</span></>
                ) : (
                  'Awaiting classification updates'
                )}
              </p>
            </div>

            {/* Provisional Score Card */}
            <div className="bg-[#FAEDCD] border border-[#DCD5BC] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8B5E34] uppercase tracking-wider">
                  Provisional Strength
                </span>
                <button
                  onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
                  className="text-[10px] text-[#8B5E34] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>{showFormulaBreakdown ? 'Hide Math' : 'Formula Breakdown'}</span>
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#342F27]">
                  {report.provisionalValidationStrength?.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs text-[#6B6255] font-mono">/ 10.00</span>
              </div>
              <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-[#FEFAE0] text-[#8B5E34] border border-[#DCD5BC]">
                PROVISIONAL DETERMINISTIC SCORE (S_val)
              </span>
            </div>

            {/* Corpus & Pathway Card */}
            <div className="bg-[#FAEDCD] border border-[#DCD5BC] p-4 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-[#8B5E34] uppercase tracking-wider block">
                Corpus & Replication
              </span>
              <div className="flex items-center gap-2 text-xs text-[#342F27]">
                <FileCheck2 className="w-4 h-4 text-[#8B5E34]" />
                <span className="font-semibold">{report.corpusSize || 0} Papers Evaluated</span>
              </div>
              <div className="text-[11px] text-[#6B6255]">
                {report.replicationSummary?.pathwayLabel ? (
                  <span className="font-medium text-[#287A50]">{report.replicationSummary.pathwayLabel}</span>
                ) : (
                  <span>Independent: {report.replicationSummary?.independentCount ?? 0} | Dependent: {report.replicationSummary?.fullyDependentCount ?? 0}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mandatory Warning Banner */}
          <div className="bg-[#FAEDCD] border-l-4 border-[#8B5E34] p-3.5 rounded-r-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#8B5E34]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>MANDATORY SCIENTIFIC NOTICE — PROVISIONAL UNCALIBRATED METRIC</span>
            </div>
            <p className="text-[11px] text-[#6B6255] leading-relaxed pl-6">
              This score represents a provisional, uncalibrated algorithmic evaluation index calculated strictly via
              deterministic heuristic aggregation. It is <strong>NOT</strong> an empirical posterior probability,
              Bayesian confidence interval, or real-world truth estimate. Scientific gaps require independent peer review
              and physical experimental verification.
            </p>
          </div>

          {/* Human Review Escalation Banner if flagged */}
          {report.requiresHumanReview && (
            <div className="bg-[#FEFAE0] border border-[#E76F51] p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#E76F51]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>HUMAN SCIENTIFIC REVIEW ESCALATION REQUIRED</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-[#6B6255] space-y-1 pl-2">
                {report.humanReviewReasons?.map((reason, idx) => (
                  <li key={idx}><span className="font-medium text-[#342F27]">{reason}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* Formula Breakdown Panel (Expandable) */}
          {showFormulaBreakdown && report.provisionalScoreResult && (
            <div className="bg-[#CCD5AE]/30 border border-[#B8C299] p-4 rounded-xl text-xs space-y-3 font-mono">
              <h4 className="font-bold text-[#342F27] text-xs font-sans flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#8B5E34]" />
                <span>Deterministic Scoring Model Parameters</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Evidence Quality (Q_evid):</span>
                  <span className="font-bold text-[#342F27]">{report.provisionalScoreResult.baseEvidenceQuality.toFixed(3)}</span>
                </div>
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Methodological Rigidity (R_meth):</span>
                  <span className="font-bold text-[#342F27]">{report.provisionalScoreResult.methodologicalRigidity.toFixed(3)}</span>
                </div>
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Source Independence (I_src):</span>
                  <span className="font-bold text-[#342F27]">{report.provisionalScoreResult.sourceIndependenceWeight.toFixed(3)}</span>
                </div>
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Recency Penalty (T_rec):</span>
                  <span className="font-bold text-[#342F27]">
                    {report.provisionalScoreResult.recencyFactor.toFixed(3)}
                    {report.provisionalScoreResult.isFoundationalExempt ? ' (EXEMPT)' : ''}
                  </span>
                </div>
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Coverage Breadth (Ω_cov):</span>
                  <span className="font-bold text-[#342F27]">{report.provisionalScoreResult.coverageFactor.toFixed(3)}</span>
                </div>
                <div className="bg-[#FEFAE0] p-2 rounded border border-[#DCD5BC]">
                  <span className="text-[#6B6255] block text-[10px]">Contradiction Dampener (D_contra):</span>
                  <span className="font-bold text-[#342F27]">{report.provisionalScoreResult.contradictionDampener.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reasoning Summary */}
          <div className="bg-[#FEFAE0] border border-[#DCD5BC] p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5E34]" />
              <span>Scientific Synthesis & Reasoning</span>
            </h4>
            <p className="text-xs text-[#342F27] leading-relaxed">
              {report.reasoningSummary}
            </p>
            {report.corpusHash && (
              <div className="text-[10px] text-[#6B6255] font-mono pt-2 border-t border-[#DCD5BC] flex items-center gap-2">
                <span>Corpus Invariant Hash:</span>
                <span className="bg-[#FAEDCD] px-1.5 py-0.5 rounded border border-[#DCD5BC] text-[#8B5E34]">
                  sha256:{report.corpusHash.slice(0, 16)}...
                </span>
              </div>
            )}
          </div>

          {/* Connected Relationships & Bilateral Quotes */}
          {report.relationships && report.relationships.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>Connected Literature Citations & Bilateral Evidence ({report.relationships.length})</span>
              </h4>

              <div className="space-y-2">
                {report.relationships.map((rel, idx) => {
                  const isExpanded = expandedQuotes[idx] || false;
                  return (
                    <div
                      key={idx}
                      className="bg-[#FAEDCD]/50 border border-[#DCD5BC] rounded-xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            rel.relationshipType.includes('contradicts')
                              ? 'bg-[#E76F51] text-white'
                              : rel.relationshipType.includes('addresses')
                              ? 'bg-[#D4A373] text-white'
                              : 'bg-[#CCD5AE] text-[#342F27]'
                          }`}>
                            {rel.relationshipType.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-[#342F27]">
                            {rel.targetPaperTitle || 'Cross-Literature Paper'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8B5E34]">
                          Weight: {rel.confidenceWeight.toFixed(2)}
                        </span>
                      </div>

                      {rel.sourceLocator && (
                        <div className="text-[10px] font-mono text-[#6B6255]">
                          Locator: <span className="text-[#342F27] font-semibold">{rel.sourceLocator}</span>
                        </div>
                      )}

                      {rel.verifiableQuote && (
                        <div>
                          <button
                            onClick={() => toggleQuote(idx)}
                            className="text-[10px] text-[#8B5E34] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span>{isExpanded ? 'Hide Verifiable Quote' : 'Inspect Verifiable Quote'}</span>
                          </button>
                          {isExpanded && (
                            <blockquote className="mt-2 pl-3 border-l-2 border-[#8B5E34] text-[11px] text-[#6B6255] italic bg-[#FEFAE0] p-2 rounded">
                              "{rel.verifiableQuote}"
                            </blockquote>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 space-y-3 bg-[#FAEDCD]/30 rounded-xl border border-dashed border-[#DCD5BC]">
          <Search className="w-8 h-8 text-[#8B5E34] mx-auto opacity-70" />
          <h4 className="text-sm font-bold text-[#342F27]">No Validation Run Available Yet</h4>
          <p className="text-xs text-[#6B6255] max-w-md mx-auto">
            Click <strong>"Validate Against Literature"</strong> above to retrieve relevant papers, analyze
            methodological comparability, evaluate author independence, and compute the deterministic validation strength.
          </p>
        </div>
      )}
    </div>
  );
};
