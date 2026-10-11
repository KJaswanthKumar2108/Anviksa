import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Upload, Link as LinkIcon, FileText, Beaker, CheckCircle2, Save } from 'lucide-react';
import { MOCK_CHALLENGES, MOCK_PAPERS } from '../data/mockData';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (contribution: any) => void;
  onSaveDraft?: (draft: any) => void;
  initialDraft?: any;
  preselectedChallengeId?: string;
  preselectedPaperId?: string;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  onSaveDraft,
  initialDraft,
  preselectedChallengeId,
  preselectedPaperId
}) => {
  const [step, setStep] = useState(1);
  const [contributionType, setContributionType] = useState<'Methodology' | 'Dataset' | 'Code Implementation' | 'Replication Experiment' | 'Theoretical Extension'>('Methodology');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [methodology, setMethodology] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState(preselectedChallengeId || 'chal-1');
  const [selectedPaperId, setSelectedPaperId] = useState(preselectedPaperId || 'paper-1');
  const [codeUrl, setCodeUrl] = useState('');
  const [datasetUrl, setDatasetUrl] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [limitations, setLimitations] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.type) setContributionType(initialDraft.type);
      if (initialDraft.title) setTitle(initialDraft.title);
      if (initialDraft.summary) setSummary(initialDraft.summary);
      if (initialDraft.methodology) setMethodology(initialDraft.methodology);
      if (initialDraft.codeUrl) setCodeUrl(initialDraft.codeUrl);
      if (initialDraft.datasetUrl) setDatasetUrl(initialDraft.datasetUrl);
      if (initialDraft.expectedOutcome) setExpectedOutcome(initialDraft.expectedOutcome);
      if (initialDraft.limitations) setLimitations(initialDraft.limitations);
    }
  }, [initialDraft, isOpen]);

  if (!isOpen) return null;

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 2) {
      if (!title.trim()) errs.title = 'Title is required';
      if (!summary.trim()) errs.summary = 'Summary is required';
    }
    if (s === 3) {
      if (!methodology.trim()) errs.methodology = 'Methodology details are required';
    }
    if (s === 6) {
      if (!expectedOutcome.trim()) errs.expectedOutcome = 'Expected outcome is required';
      if (!limitations.trim()) errs.limitations = 'Known limitations are required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 7) setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSaveDraftClick = () => {
    const draftData = {
      type: contributionType,
      title,
      summary,
      methodology,
      challengeId: selectedChallengeId,
      paperId: selectedPaperId,
      codeUrl,
      datasetUrl,
      expectedOutcome,
      limitations,
      status: 'Draft',
      updatedAt: new Date().toLocaleTimeString()
    };
    onSaveDraft?.(draftData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2) || !validateStep(3) || !validateStep(6)) {
      alert('Please fill in all required fields before submitting.');
      return;
    }

    const newContribution = {
      id: `contrib-${Date.now()}`,
      challengeId: selectedChallengeId,
      paperId: selectedPaperId,
      title: title || 'Gradient Memory Checkpointing for State Space Models',
      contributorId: 'user-101',
      contributorName: 'Current Researcher',
      contributorTitle: 'Researcher',
      contributorInstitution: 'Independent',
      type: contributionType,
      summary: summary || 'A novel memory-efficient algorithm for long-context sequences.',
      methodology: methodology || 'Custom Triton GPU kernel derivation.',
      attachments: [],
      codeUrl: codeUrl || 'https://github.com/openresearch/s2-chunked-kernel',
      datasetUrl: datasetUrl || undefined,
      expectedOutcome: expectedOutcome || '80% memory reduction in backward pass.',
      limitations: limitations || 'Requires FP32 accumulation.',
      status: 'Under Review',
      reviewsCount: 0,
      createdAt: 'Just now',
      isVerified: false
    };

    setIsSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess(newContribution);
      setIsSubmitted(false);
      setStep(1);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div>
            <span className="text-[10px] font-bold text-[#8B5E34] uppercase tracking-wider">Research Proposal Builder</span>
            <h3 className="text-base font-bold text-[#342F27]">Submit Proposal / Methodology</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-[#E9EDC9] px-6 py-2 border-b border-[#DCD5BC] flex items-center justify-between text-xs font-mono font-medium text-[#6B6255]">
          <span>Step {step} of 7</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  s === step ? 'bg-[#D4A373]' : s < step ? 'bg-[#CCD5AE]' : 'bg-[#DCD5BC]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {isSubmitted ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#CCD5AE] text-[#287A50] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#342F27]">Proposal Submitted Successfully!</h4>
              <p className="text-[#6B6255] mt-1 max-w-md mx-auto">
                Your proposal has been registered on the OpenResearch ledger and dispatched to peer reviewers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Step 1: Contribution Type */}
              {step === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Select Contribution Type</h4>
                  <p className="text-[#6B6255]">Choose the nature of your scientific contribution:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {[
                      { type: 'Methodology', title: 'New Methodology / Algorithm', desc: 'A theoretical or algorithmic innovation addressing a known limitation.' },
                      { type: 'Dataset', title: 'Benchmark or Dataset', desc: 'Curated evaluation datasets, benchmarks, or clinical trial data.' },
                      { type: 'Code Implementation', title: 'Code Implementation', desc: 'Open-source software package, Triton kernel, or pipeline code.' },
                      { type: 'Replication Experiment', title: 'Replication Experiment', desc: 'Independent empirical validation or contradiction experiment.' },
                      { type: 'Theoretical Extension', title: 'Theoretical Extension', desc: 'Proof extensions or mathematical generalization of prior research.' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.type}
                        onClick={() => setContributionType(item.type as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          contributionType === item.type
                            ? 'bg-[#CCD5AE] border-[#B8C299] text-[#342F27] shadow-xs font-semibold'
                            : 'bg-[#FEFAE0] border-[#DCD5BC] text-[#342F27] hover:border-[#D4A373]'
                        }`}
                      >
                        <span className="font-bold text-xs block text-[#342F27]">{item.title}</span>
                        <span className="text-[11px] text-[#6B6255] mt-1 block leading-snug">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Title and Summary */}
              {step === 2 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Title & Executive Summary</h4>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Proposal Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chunked State Checkpointing for O(1) Gradient Memory in S2-Kernels"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                        errors.title ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
                      }`}
                    />
                    {errors.title && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.title}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Executive Summary *</label>
                    <textarea
                      rows={4}
                      placeholder="Briefly describe the key idea, main innovation, and how it addresses the target research problem..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                        errors.summary ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
                      }`}
                    />
                    {errors.summary && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.summary}</span>}
                  </div>
                </div>
              )}

              {/* Step 3: Methodology */}
              {step === 3 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Proposed Approach & Methodology</h4>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Detailed Technical Methodology *</label>
                    <textarea
                      rows={6}
                      placeholder="Detail your experimental design, mathematical formulation, hardware requirements, or synthesis protocols..."
                      value={methodology}
                      onChange={(e) => setMethodology(e.target.value)}
                      className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                        errors.methodology ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
                      }`}
                    />
                    {errors.methodology && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.methodology}</span>}
                  </div>
                </div>
              )}

              {/* Step 4: Related Paper or Challenge */}
              {step === 4 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Target Challenge & Related Research</h4>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Link to Research Challenge</label>
                    <select
                      value={selectedChallengeId}
                      onChange={(e) => setSelectedChallengeId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] cursor-pointer"
                    >
                      {MOCK_CHALLENGES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.orgName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Baseline Research Paper</label>
                    <select
                      value={selectedPaperId}
                      onChange={(e) => setSelectedPaperId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] cursor-pointer"
                    >
                      {MOCK_PAPERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.journal}, {p.year})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 5: Evidence Links & Attachments */}
              {step === 5 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Code, Datasets & Evidence Links</h4>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Code Repository URL (GitHub / GitLab)</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repository"
                      value={codeUrl}
                      onChange={(e) => setCodeUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Dataset / Weights URL (HuggingFace / Zenodo / Dryad)</label>
                    <input
                      type="url"
                      placeholder="https://huggingface.co/datasets/username/dataset"
                      value={datasetUrl}
                      onChange={(e) => setDatasetUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27]"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Expected Outcome & Limitations */}
              {step === 6 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#342F27]">Expected Outcome & Known Limitations</h4>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Expected Scientific Outcome & Key Metrics *</label>
                    <textarea
                      rows={3}
                      placeholder="Define quantifiable metrics (e.g., >90% cleavage retention, <15% FLOP overhead, 800-cycle battery stability)..."
                      value={expectedOutcome}
                      onChange={(e) => setExpectedOutcome(e.target.value)}
                      className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                        errors.expectedOutcome ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
                      }`}
                    />
                    {errors.expectedOutcome && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.expectedOutcome}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold text-[#342F27] mb-1">Known Limitations & Risk Factors *</label>
                    <textarea
                      rows={3}
                      placeholder="Be explicit about constraints, thermal limits, numerical precision requirements, or hardware edge-cases..."
                      value={limitations}
                      onChange={(e) => setLimitations(e.target.value)}
                      className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                        errors.limitations ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
                      }`}
                    />
                    {errors.limitations && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.limitations}</span>}
                  </div>
                </div>
              )}

              {/* Step 7: Review and Submit */}
              {step === 7 && (
                <div className="space-y-3 bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC]">
                  <h4 className="text-sm font-bold text-[#342F27]">Review Your Proposal</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6255]">Type</span>
                      <p className="font-medium text-[#342F27]">{contributionType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6255]">Title</span>
                      <p className="font-medium text-[#342F27]">{title || 'Untitled Proposal'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6255]">Summary</span>
                      <p className="text-[#6B6255] leading-relaxed">{summary || 'No summary provided.'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6B6255]">Expected Outcome</span>
                      <p className="text-[#6B6255]">{expectedOutcome || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

            </form>
          )}
        </div>

        {/* Modal Footer Buttons */}
        {!isSubmitted && (
          <div className="px-6 py-3 border-t border-[#DCD5BC] bg-[#E9EDC9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#FEFAE0] border border-[#DCD5BC] hover:bg-[#CCD5AE] rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDraftClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#342F27] bg-[#CCD5AE] hover:bg-[#D4A373] rounded-xl border border-[#B8C299] transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>Save Draft</span>
              </button>
            </div>

            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 px-5 py-1.5 text-xs font-bold text-white bg-[#287A50] hover:bg-[#1e5c3c] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Submit Proposal</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
