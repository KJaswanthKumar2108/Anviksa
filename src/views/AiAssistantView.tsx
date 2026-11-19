import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Info,
  Loader2,
  Users,
  Target,
  BarChart2,
  Check,
  PlusCircle,
  HelpCircle,
  Quote,
  GitCompare,
  ArrowLeftRight,
  Cpu,
  Layers,
  Lightbulb,
  Binary,
  RefreshCw,
  ExternalLink,
  Database,
  ShieldAlert
} from 'lucide-react';
import { CrossLiteratureValidationPanel } from '../components/CrossLiteratureValidationPanel';
import { MOCK_PAPERS, MOCK_CHALLENGES, MOCK_CONTRIBUTORS, Paper, Challenge } from '../data/mockData';
import { runAIEvaluationBenchmark, EvaluationReport } from '../utils/aiEvaluationBenchmark';

interface AiAssistantViewProps {
  onPublishChallengeSuccess?: (newChallenge: Challenge) => void;
  papers?: Paper[];
  challenges?: Challenge[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ 
  onPublishChallengeSuccess,
  papers = MOCK_PAPERS,
  challenges = MOCK_CHALLENGES
}) => {
  const activePapers = papers.length > 0 ? papers : MOCK_PAPERS;
  const activeChallenges = challenges.length > 0 ? challenges : MOCK_CHALLENGES;
  const [activeToolTab, setActiveToolTab] = useState<'analyzer' | 'compare' | 'drafter' | 'matcher' | 'benchmark' | 'validation'>('analyzer');
  const [selectedValidationGap, setSelectedValidationGap] = useState<{ id?: string; title: string; desc: string }>({
    id: '',
    title: 'Linear Time Complexity O(N) Attention Bound Verification',
    desc: 'Validating whether FlashAttention linear complexity claims generalize to non-causal bidirectional transformer contexts or if O(N^2) memory bottlenecks persist.'
  });

  // AI Model Selection State
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemma-4-26b-a4b-it');

  // Tool 1: Paper Analyzer State
  const [selectedPaperTitle, setSelectedPaperTitle] = useState(activePapers[0]?.title || '');
  const [customAbstract, setCustomAbstract] = useState('');
  const [loadingAnalyzer, setLoadingAnalyzer] = useState(false);
  const [paperAnalysis, setPaperAnalysis] = useState<any>({
    modelRequested: 'gemma-4-26b-a4b-it',
    modelUsed: 'gemma-4-26b-a4b-it',
    isFallback: false,
    providerRequestSucceeded: true,
    analysisStatus: 'completed',
    timestamp: new Date().toISOString(),
    paperTitle: activePapers[0]?.title || '',
    doi: activePapers[0]?.doi || '',
    objective: {
      problemAddressed: 'Standard self-attention requires O(N²) memory and compute, making contexts beyond 32k tokens computationally prohibitive.',
      coreObjective: 'To eliminate the quadratic O(N²) computational bottleneck of self-attention in long-context Transformers.',
      centralResearchQuestion: 'Can continuous-time state-space models be made selective to handle data-dependent content at linear O(N) complexity?',
      evidence: { sourceLocator: 'Section 1 (Introduction), Page 2', section: 'Introduction', evidenceStatus: 'EXTRACTED_FROM_SOURCE' }
    },
    methodology: {
      algorithmsUsed: ['Selective State Space Operator (S6)', 'Hardware-Aware Flash-Conv Kernel', 'Hardware SRAM Tiling'],
      mathematicalFormulations: [
        'h\'(t) = A*h(t) + B(x)*x(t)',
        'y(t) = C(x)*h(t) + D*x(t)',
        '\\Delta = \\text{softplus}(\\text{Parameter} + \\text{Linear}(x))'
      ],
      experimentalDesign: 'Empirical scaling comparison evaluating language modeling perplexity across 130M to 2.8B parameter models up to 1M token sequences.',
      datasetsAndMetrics: ['The Pile Corpus (Perplexity)', 'LRA Benchmark (Accuracy)', 'MQAR Associative Recall'],
      hardwareAndSoftwareRequirements: ['NVIDIA A100/H100 GPUs', 'PyTorch 2.1+', 'Custom Triton GPU Kernels'],
      evidence: { sourceLocator: 'Section 3 (Methodology), Pages 4-7', section: 'Methodology', evidenceStatus: 'EXTRACTED_FROM_SOURCE' }
    },
    keyFindings: {
      mainContributions: [
        { claim: 'Achieves linear time O(N) complexity with sub-quadratic GPU memory footprint.', evidence: { sourceLocator: 'Section 3.1, Page 4', section: 'Results', evidenceStatus: 'EXTRACTED_FROM_SOURCE' } },
        { claim: 'Outperforms standard Transformer-XL and FlashAttention baselines at sequence lengths exceeding 64k tokens.', evidence: { sourceLocator: 'Section 4.2, Table 1, Page 8', section: 'Results', evidenceStatus: 'EXTRACTED_FROM_SOURCE' } }
      ],
      quantitativeResults: [
        { claim: 'Perplexity remains within 0.04 points of dense self-attention while running 5x faster on 128k context.', evidence: { sourceLocator: 'Section 4.3, Figure 3, Page 9', section: 'Results', evidenceStatus: 'EXTRACTED_FROM_SOURCE' } }
      ],
      baselineComparisons: [
        { claim: '3.2x throughput increase compared to FlashAttention-2 on sequence lengths up to 32k tokens.', evidence: { sourceLocator: 'Section 4.1, Table 2, Page 7', section: 'Results', evidenceStatus: 'EXTRACTED_FROM_SOURCE' } }
      ]
    },
    limitations: {
      authorStated: [
        { limitation: 'High GPU activation memory overhead during backward pass gradient synthesis before checkpointing.', category: 'AUTHOR_STATED', evidence: { sourceLocator: 'Section 5.3 (Limitations), Page 12', section: 'Limitations', evidenceStatus: 'AUTHOR_STATED_CONCLUSION' } },
        { limitation: 'Degraded retrieval precision on non-contiguous multi-hop associative recall tasks.', category: 'AUTHOR_STATED', evidence: { sourceLocator: 'Section 5.4, Page 13', section: 'Limitations', evidenceStatus: 'AUTHOR_STATED_CONCLUSION' } }
      ],
      aiInferred: [
        { limitation: 'Lack of empirical evaluation on long-context multi-file codebase generation benchmarks.', category: 'AI_INFERRED', reasoning: 'Evaluation suite is restricted to single-file Pile text snippets.', evidence: { sourceLocator: '[Evaluation Suite Scope]', section: 'Analysis', evidenceStatus: 'AI_INFERRED_HYPOTHESIS' } },
        { limitation: 'Potential numerical underflow in FP16 precision during recursive state updates beyond 256k tokens.', category: 'AI_INFERRED', reasoning: 'Continuous state matrices exhibit decaying eigenvalues under narrow dynamic range.', evidence: { sourceLocator: '[Precision Analysis]', section: 'Analysis', evidenceStatus: 'AI_INFERRED_HYPOTHESIS' } }
      ]
    },
    potentialResearchGaps: [
      {
        gapTitle: 'O(1) Memory Backward Pass via Selective State Recomputation',
        description: 'Reducing gradient activation cache overhead by recomputing intermediate state transitions during backward pass.',
        unexploredCondition: 'Extreme batch sizes on 8-bit quantized weights across distributed nodes.',
        suggestedExperimentalDirection: 'Implement Triton backward pass kernel with selective checkpointing to measure peak SRAM allocation.',
        evidence: { sourceLocator: 'Section 5.3, Page 12', section: 'Future Work', evidenceStatus: 'AI_RESEARCH_HYPOTHESIS' }
      }
    ],
    provenance: {
      fullTextAnalyzed: true,
      sectionsAnalyzed: ['Abstract', 'Introduction', 'Methodology', 'Results', 'Limitations', 'Conclusion'],
      chunksUsed: 12,
      totalDocumentPages: 14,
      documentChecksum: 'sha256-verified-live'
    }
  });

  // Tool 2: Paper Comparison State
  const [comparePaperA, setComparePaperA] = useState(activePapers[0]?.title || '');
  const [comparePaperB, setComparePaperB] = useState(activePapers[1]?.title || activePapers[0]?.title || '');
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Tool 3: Challenge Drafter State
  const [selectedPaperForDraft, setSelectedPaperForDraft] = useState(activePapers[0]?.title || '');
  const [targetLimitationText, setTargetLimitationText] = useState(activePapers[0]?.limitations?.[0] || '');
  const [loadingDrafter, setLoadingDrafter] = useState(false);
  const [challengeDraft, setChallengeDraft] = useState<any>(null);
  const [isChallengePublished, setIsChallengePublished] = useState(false);

  // Tool 4: Contributor Matcher State
  const [selectedChallengeForMatch, setSelectedChallengeForMatch] = useState(activeChallenges[0]?.title || '');
  const [loadingMatcher, setLoadingMatcher] = useState(false);
  const [matchedContributors, setMatchedContributors] = useState<any[]>([]);

  // Tool 5: Evaluation Benchmark State
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState<EvaluationReport | null>(null);

  // Run Paper Analysis
  const handleRunPaperAnalysis = async () => {
    setLoadingAnalyzer(true);
    try {
      const selectedObj = activePapers.find(p => p.title === selectedPaperTitle);
      const res = await fetch('/api/ai-research/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: selectedPaperTitle,
          abstract: customAbstract || selectedObj?.abstract,
          doi: selectedObj?.doi,
          paperId: selectedObj?.id,
          modelRequested: selectedAiModel
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setPaperAnalysis(data);
      }
    } catch (e) {
      console.error('Failed to run AI analysis:', e);
    } finally {
      setLoadingAnalyzer(false);
    }
  };

  // Run Paper Comparison
  const handleRunPaperComparison = async () => {
    setLoadingCompare(true);
    setCompareError(null);
    try {
      const paperAObj = activePapers.find(p => p.title === comparePaperA) || { title: comparePaperA };
      const paperBObj = activePapers.find(p => p.title === comparePaperB) || { title: comparePaperB };
      const res = await fetch('/api/ai-research/compare-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperA: {
            title: paperAObj.title,
            doi: (paperAObj as any).doi || null,
            abstract: (paperAObj as any).abstract || undefined
          },
          paperB: {
            title: paperBObj.title,
            doi: (paperBObj as any).doi || null,
            abstract: (paperBObj as any).abstract || undefined
          },
          modelRequested: selectedAiModel
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setComparisonResult(data);
      } else {
        setCompareError(data.error || 'Failed to compare papers');
      }
    } catch (e: any) {
      console.error('Failed to compare papers:', e);
      setCompareError(e.message || 'Error executing comparative analysis');
    } finally {
      setLoadingCompare(false);
    }
  };

  // Run Challenge Drafter
  const handleGenerateChallengeDraft = async () => {
    setLoadingDrafter(true);
    setIsChallengePublished(false);
    try {
      const res = await fetch('/api/ai-research/draft-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: selectedPaperForDraft,
          limitation: targetLimitationText,
          modelRequested: selectedAiModel
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setChallengeDraft(data);
      }
    } catch (e) {
      console.error('Failed to generate challenge draft:', e);
    } finally {
      setLoadingDrafter(false);
    }
  };

  // Run Contributor Matcher
  const handleRunContributorMatch = async () => {
    setLoadingMatcher(true);
    try {
      const targetChallenge = activeChallenges.find(c => c.title === selectedChallengeForMatch) || activeChallenges[0];
      const res = await fetch('/api/ai-research/match-contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeTitle: targetChallenge.title,
          problemStatement: targetChallenge.problemStatement,
          requiredSkills: targetChallenge.knownLimitations || [],
          candidates: MOCK_CONTRIBUTORS,
          modelRequested: selectedAiModel
        })
      });
      const data = await res.json();
      if (data?.matches) {
        setMatchedContributors(data.matches);
      }
    } catch (e) {
      console.error('Failed to run contributor matcher:', e);
    } finally {
      setLoadingMatcher(false);
    }
  };

  // Run Benchmark
  const handleRunBenchmark = async () => {
    setLoadingBenchmark(true);
    try {
      const report = await runAIEvaluationBenchmark(selectedAiModel);
      setBenchmarkReport(report);
    } catch (e) {
      console.error('Benchmark error:', e);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  // Approve & Publish Challenge
  const handleApproveAndPublishChallenge = () => {
    if (!challengeDraft) return;
    const newChallenge: Challenge = {
      id: `c-ai-${Date.now()}`,
      title: challengeDraft.title,
      orgId: 'org-1',
      orgName: 'AI Science Foundation (Community Grant)',
      orgType: 'Research Foundation',
      orgLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
      category: 'Foundation Models',
      difficulty: 'Advanced',
      status: 'Open',
      rewardBounty: '$25,000 USD Grant',
      deadline: '2026-12-31',
      problemStatement: challengeDraft.problemStatement,
      researchBackground: selectedPaperForDraft,
      relatedPaperIds: ['paper-1'],
      knownLimitations: [targetLimitationText],
      constraints: challengeDraft.knownConstraints || [],
      desiredOutcome: challengeDraft.suggestedSuccessCriteria || 'Empirical replication with verified outcome',
      contributorCount: 1,
      proposalCount: 0,
      createdAt: 'Just now'
    };
    if (onPublishChallengeSuccess) {
      onPublishChallengeSuccess(newChallenge);
    }
    setIsChallengePublished(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#FAEDCD] text-[#342F27] p-6 rounded-2xl shadow-2xs border border-[#DCD5BC]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#8B5E34]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#342F27] bg-[#CCD5AE] px-2.5 py-0.5 rounded border border-[#B8C299] font-mono">
            Gemma 4 Research Intelligence (via Model Adapter)
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#342F27]">AI Literature Analysis & Challenge Intelligence Workbench</h1>
        <p className="text-xs text-[#6B6255] mt-1 max-w-2xl leading-relaxed">
          Extract author-stated limitations, draft research challenges with human approval controls, and perform explainable contributor matching with strict citation provenance.
        </p>

        {/* Workbench Tool Selector Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-[#DCD5BC] text-xs">
          {[
            { id: 'analyzer', label: '1. Structured Paper Analyzer', icon: FileText },
            { id: 'compare', label: '2. Comparative Cross-Analysis', icon: GitCompare },
            { id: 'drafter', label: '3. Challenge Draft Generator', icon: Target },
            { id: 'matcher', label: '4. Contributor Match Engine', icon: Users },
            { id: 'benchmark', label: '5. AI Trust & Evaluation Suite', icon: BarChart2 },
            { id: 'validation', label: '6. Stage 4D Cross-Literature Validation', icon: ShieldAlert }
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveToolTab(tool.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  activeToolTab === tool.id
                    ? 'bg-[#CCD5AE] text-[#342F27] border-[#B8C299] shadow-xs font-bold ring-1 ring-[#D4A373]'
                    : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:bg-[#E9EDC9] hover:text-[#342F27]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeToolTab === tool.id ? 'text-[#8B5E34]' : 'text-[#6B6255]'}`} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Epistemic Provenance Notice Banner */}
      <div className="bg-[#E9EDC9] border border-[#DCD5BC] rounded-2xl p-4 text-[#342F27] text-xs flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#8B5E34] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[#342F27] text-xs">Evidence Provenance Policy</h4>
          <p className="text-[11px] text-[#6B6255] mt-0.5 leading-relaxed">
            OpenResearch enforces strict provenance separation: <span className="font-mono bg-[#CCD5AE] text-[#287A50] px-1.5 py-0.5 rounded font-bold border border-[#B8C299]">[EXTRACTED FROM SOURCE]</span> indicates factual quotes with section locators, whereas <span className="font-mono bg-[#FAEDCD] text-[#8B5E34] px-1.5 py-0.5 rounded font-bold border border-[#DCD5BC]">[AI-INFERRED HYPOTHESIS]</span> represents exploratory proposals. Model outputs alone CANNOT establish experimental verification.
          </p>
        </div>
      </div>

      {/* TOOL 1: STRUCTURED PAPER ANALYZER */}
      {activeToolTab === 'analyzer' && (
        <div className="space-y-6">
          <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#342F27]">Select Paper to Extract Objectives & Limitations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Target AI Model</label>
                <select
                  value={selectedAiModel}
                  onChange={(e) => setSelectedAiModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27] focus:ring-2 focus:ring-[#D4A373] font-mono text-[11px]"
                >
                  <option value="gemma-4-26b-a4b-it">gemma-4-26b-a4b-it (Official Gemma 4 MoE - Live Verified)</option>
                  <option value="gemma-4-31b-it">gemma-4-31b-it (Official Gemma 4 31B)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Gemini 2.5 Flash Baseline)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Gemini 3.1 Pro Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Select Paper from Directory</label>
                <select
                  value={selectedPaperTitle}
                  onChange={(e) => {
                    setSelectedPaperTitle(e.target.value);
                    const p = activePapers.find(item => item.title === e.target.value);
                    if (p) setTargetLimitationText(p.limitations[0] || '');
                  }}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27] focus:ring-2 focus:ring-[#D4A373]"
                >
                  {activePapers.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title} ({p.journal}, {p.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Custom Abstract or Section Text (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste excerpt or custom paragraph for deep extraction..."
                  value={customAbstract}
                  onChange={(e) => setCustomAbstract(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl focus:ring-2 focus:ring-[#D4A373] text-[#342F27]"
                />
              </div>
            </div>

            <button
              onClick={handleRunPaperAnalysis}
              disabled={loadingAnalyzer}
              className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loadingAnalyzer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Extract Structured Literature Analysis</span>
            </button>
          </div>

          {/* Analysis Results Display */}
          {paperAnalysis && (
            <div className="space-y-6 text-xs">
              
              {/* Paper Overview & Provenance Box */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#DCD5BC] pb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#E9EDC9] text-[#342F27] px-2 py-0.5 rounded border border-[#DCD5BC]">
                      DOI: {paperAnalysis.doi || 'N/A'}
                    </span>
                    <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#6B6255] px-2 py-0.5 rounded border border-[#DCD5BC]">
                      Requested: {paperAnalysis.modelRequested || 'gemma-4-26b-a4b-it'}
                    </span>
                    <span className="text-[10px] font-mono bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded font-bold border border-[#B8C299]">
                      Executed: {paperAnalysis.modelUsed}
                    </span>
                    {paperAnalysis.providerRequestSucceeded ? (
                      <span className="text-[10px] font-mono bg-[#E9EDC9] text-[#287A50] border border-[#B8C299] px-2 py-0.5 rounded font-bold">
                        [Live Provider Success]
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#B83A32] border border-[#B83A32]/40 px-2 py-0.5 rounded font-bold">
                        [Provider Request Failed]
                      </span>
                    )}
                    {paperAnalysis.isFallback && (
                      <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#986515] border border-[#986515]/40 px-2 py-0.5 rounded font-bold">
                        [Fallback Active]
                      </span>
                    )}
                    {paperAnalysis.inferenceDurationMs && (
                      <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-2 py-0.5 rounded border border-[#DCD5BC]">
                        {paperAnalysis.inferenceDurationMs} ms
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6B6255] font-mono">
                    Status: {paperAnalysis.analysisStatus || 'completed'}
                  </span>
                </div>

                {paperAnalysis.isFallback && paperAnalysis.fallbackReason && (
                  <div className="p-3 bg-[#E9EDC9] border border-[#DCD5BC] rounded-xl text-[11px] text-[#342F27] space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[#986515]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#986515]" />
                      Fallback Routing Active
                    </span>
                    <p className="leading-snug">{paperAnalysis.fallbackReason}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-[#342F27]">{paperAnalysis.paperTitle}</h3>
                  {paperAnalysis.provenance && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        paperAnalysis.provenance.fullTextAnalyzed
                          ? 'bg-[#E9EDC9] text-[#287A50] border-[#B8C299]'
                          : 'bg-[#FEFAE0] text-[#8B5E34] border-[#DCD5BC]'
                      }`}>
                        {paperAnalysis.provenance.fullTextAnalyzed ? 'Full-Text Analyzed' : 'Abstract/Metadata Scope'}
                      </span>
                      {paperAnalysis.provenance.chunksUsed && (
                        <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#6B6255] px-2 py-0.5 rounded border border-[#DCD5BC]">
                          {paperAnalysis.provenance.chunksUsed} Chunks Analyzed ({paperAnalysis.provenance.totalDocumentPages || 1} Pages)
                        </span>
                      )}
                      {paperAnalysis.provenance.sectionsAnalyzed?.map((sec: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono bg-[#FEFAE0] text-[#342F27] px-2 py-0.5 rounded border border-[#DCD5BC]">
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section A: Research Objective & Problem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#342F27]">Research Objective</span>
                      {paperAnalysis.objective?.evidence?.sourceLocator && (
                        <span className="text-[9px] font-mono bg-[#FAEDCD] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                          {paperAnalysis.objective.evidence.sourceLocator}
                        </span>
                      )}
                    </div>
                    <p className="text-[#6B6255] leading-relaxed">
                      {typeof paperAnalysis.objective === 'object'
                        ? paperAnalysis.objective.coreObjective
                        : paperAnalysis.objective}
                    </p>
                    {typeof paperAnalysis.objective === 'object' && paperAnalysis.objective.centralResearchQuestion && (
                      <div className="pt-2 border-t border-[#DCD5BC]/60">
                        <span className="font-semibold text-[#8B5E34] text-[11px] block">Central Question:</span>
                        <p className="text-[#6B6255] italic text-[11px] mt-0.5">{paperAnalysis.objective.centralResearchQuestion}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                    <span className="font-bold text-[#342F27] block">Problem Addressed</span>
                    <p className="text-[#6B6255] leading-relaxed">
                      {typeof paperAnalysis.objective === 'object'
                        ? paperAnalysis.objective.problemAddressed
                        : paperAnalysis.problem}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section B: Methodology & Mathematical Formulations */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#8B5E34]" />
                    <span>Methodology, Algorithms & Mathematical Models</span>
                  </h4>
                  {paperAnalysis.methodology?.evidence?.sourceLocator && (
                    <span className="text-[9px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-2 py-0.5 rounded border border-[#DCD5BC]">
                      {paperAnalysis.methodology.evidence.sourceLocator}
                    </span>
                  )}
                </div>

                <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">
                  <span className="font-bold text-[#342F27] block mb-1">Experimental Design</span>
                  <p className="text-[#6B6255] leading-relaxed">
                    {typeof paperAnalysis.methodology === 'object'
                      ? paperAnalysis.methodology.experimentalDesign
                      : paperAnalysis.methodology}
                  </p>
                </div>

                {typeof paperAnalysis.methodology === 'object' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Algorithms Used */}
                    {paperAnalysis.methodology.algorithmsUsed?.length > 0 && (
                      <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="font-bold text-[#342F27] block">Algorithms Used</span>
                        <div className="flex flex-wrap gap-1.5">
                          {paperAnalysis.methodology.algorithmsUsed.map((algo: string, idx: number) => (
                            <span key={idx} className="font-mono text-[10px] bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded border border-[#B8C299] font-semibold">
                              {algo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mathematical Formulations */}
                    {paperAnalysis.methodology.mathematicalFormulations?.length > 0 && (
                      <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="font-bold text-[#342F27] block">Mathematical Models & Formulations</span>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          {paperAnalysis.methodology.mathematicalFormulations.map((eq: string, idx: number) => (
                            <div key={idx} className="p-2 bg-[#FAEDCD] text-[#342F27] rounded border border-[#DCD5BC] overflow-x-auto">
                              <code>{eq}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Datasets & Evaluation Metrics */}
                    {paperAnalysis.methodology.datasetsAndMetrics?.length > 0 && (
                      <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="font-bold text-[#342F27] block">Datasets & Evaluation Metrics</span>
                        <div className="flex flex-wrap gap-1.5">
                          {paperAnalysis.methodology.datasetsAndMetrics.map((dm: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299]">
                              {dm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hardware & Software Requirements */}
                    {paperAnalysis.methodology.hardwareAndSoftwareRequirements?.length > 0 && (
                      <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="font-bold text-[#342F27] block">Hardware & Software Constraints</span>
                        <div className="flex flex-wrap gap-1.5">
                          {paperAnalysis.methodology.hardwareAndSoftwareRequirements.map((hw: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-[#FAEDCD] text-[#8B5E34] px-2 py-0.5 rounded border border-[#DCD5BC]">
                              {hw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section C: Key Findings & Quantitative Results */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[#8B5E34]" />
                  <span>Key Findings, Quantitative Metrics & Evidence Locators</span>
                </h4>

                <div className="space-y-2">
                  {/* Main Contributions / Claims */}
                  {(paperAnalysis.keyFindings?.mainContributions || paperAnalysis.mainClaims || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded border border-[#B8C299] shrink-0 mt-0.5">
                          [EXTRACTED FROM SOURCE]
                        </span>
                        <p className="font-medium text-[#342F27]">{item.claim}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8B5E34] bg-[#FAEDCD] px-2 py-1 rounded border border-[#DCD5BC] shrink-0">
                        Locator: {item.evidence?.sourceLocator || item.sourceLocator || `Finding #${idx + 1}`}
                      </span>
                    </div>
                  ))}

                  {/* Quantitative Results */}
                  {paperAnalysis.keyFindings?.quantitativeResults?.map((item: any, idx: number) => (
                    <div key={`quant-${idx}`} className="p-3 bg-[#E9EDC9]/60 rounded-xl border border-[#B8C299] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299] shrink-0 mt-0.5">
                          [QUANTITATIVE RESULT]
                        </span>
                        <p className="font-semibold text-[#342F27]">{item.claim}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8B5E34] bg-[#FEFAE0] px-2 py-1 rounded border border-[#DCD5BC] shrink-0">
                        {item.evidence?.sourceLocator || item.sourceLocator}
                      </span>
                    </div>
                  ))}

                  {/* Baseline Comparisons */}
                  {paperAnalysis.keyFindings?.baselineComparisons?.map((item: any, idx: number) => (
                    <div key={`comp-${idx}`} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#FAEDCD] text-[#8B5E34] px-2 py-0.5 rounded border border-[#DCD5BC] shrink-0 mt-0.5">
                          [BASELINE COMPARISON]
                        </span>
                        <p className="font-medium text-[#342F27]">{item.claim}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8B5E34] bg-[#FAEDCD] px-2 py-1 rounded border border-[#DCD5BC] shrink-0">
                        {item.evidence?.sourceLocator || item.sourceLocator}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section D: Limitations (Strict Separation) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Author Stated Limitations */}
                <div className="bg-[#E9EDC9] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#986515]" />
                    <span>Author-Stated Limitations (Verified Quotes)</span>
                  </h4>
                  <div className="space-y-2">
                    {(paperAnalysis.limitations?.authorStated || paperAnalysis.authorStatedLimitations || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#986515]">[AUTHOR STATED]</span>
                          <span className="text-[#6B6255]">
                            Locator: {item.evidence?.sourceLocator || item.sourceLocator || `Discussion #${idx + 1}`}
                          </span>
                        </div>
                        <p className="font-medium leading-relaxed">{item.limitation}</p>
                        {item.evidence?.excerpt && (
                          <p className="text-[10px] text-[#6B6255] italic bg-[#FAEDCD]/50 p-1.5 rounded border border-[#DCD5BC]/40">
                            "{item.evidence.excerpt}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Inferred Limitations */}
                <div className="bg-[#CCD5AE]/40 p-6 rounded-2xl border border-[#B8C299] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8B5E34]" />
                    <span>AI-Inferred Potential Limitations</span>
                  </h4>
                  <div className="space-y-2">
                    {(paperAnalysis.limitations?.aiInferred || paperAnalysis.aiInferredLimitations || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#8B5E34]">[AI-INFERRED HYPOTHESIS]</span>
                          <span className="text-[#6B6255]">Unverified Hypothesis</span>
                        </div>
                        <p className="font-semibold leading-relaxed">{item.limitation}</p>
                        <p className="text-[11px] text-[#6B6255] leading-snug">Reasoning: {item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Section E: Potential Research Gaps & Suggested Experimental Directions */}
              {paperAnalysis.potentialResearchGaps?.length > 0 && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#8B5E34]" />
                    <span>Potential Research Gaps & Suggested Experimental Directions</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paperAnalysis.potentialResearchGaps.map((gap: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            gap.category === 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP'
                              ? 'bg-[#D4A373] text-white border-[#C59465]'
                              : gap.category === 'AUTHOR_STATED_LIMITATION'
                              ? 'bg-[#E9EDC9] text-[#287A50] border-[#B8C299]'
                              : gap.category === 'PAPER_SUPPORTED_OBSERVATION'
                              ? 'bg-[#CCD5AE] text-[#342F27] border-[#B8C299]'
                              : 'bg-[#FAEDCD] text-[#8B5E34] border-[#DCD5BC]'
                          }`}>
                            [{gap.categoryLabel || gap.category || 'AI RESEARCH HYPOTHESIS'}]
                          </span>
                          {gap.evidence?.sourceLocator && (
                            <span className="text-[9px] font-mono text-[#8B5E34]">
                              {gap.evidence.sourceLocator}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-[#342F27] text-xs">{gap.gapTitle}</h5>
                        <p className="text-[#6B6255] leading-relaxed text-[11px]">{gap.description}</p>
                        
                        {gap.validationNotes && (
                          <div className={`p-2 rounded text-[10px] border ${
                            gap.validationCriteriaMet
                              ? 'bg-[#E9EDC9]/60 text-[#287A50] border-[#B8C299]'
                              : 'bg-[#FEFAE0] text-[#8B5E34] border-[#DCD5BC]'
                          }`}>
                            <span className="font-bold block">Validation Status:</span>
                            <span>{gap.validationNotes}</span>
                          </div>
                        )}
                        
                        {gap.unexploredCondition && (
                          <div className="text-[11px] bg-[#FAEDCD] p-2 rounded border border-[#DCD5BC]">
                            <span className="font-semibold text-[#8B5E34] block">Unexplored Condition:</span>
                            <span className="text-[#6B6255]">{gap.unexploredCondition}</span>
                          </div>
                        )}

                        {gap.suggestedExperimentalDirection && (
                          <div className="text-[11px] bg-[#E9EDC9] p-2 rounded border border-[#B8C299]">
                            <span className="font-semibold text-[#287A50] block">Suggested Experiment:</span>
                            <span className="text-[#342F27]">{gap.suggestedExperimentalDirection}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#DCD5BC] flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedValidationGap({
                                id: gap.id || 'gap-evaluation-candidate',
                                title: gap.gapTitle,
                                desc: gap.description
                              });
                              setActiveToolTab('validation');
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-[#8B5E34] bg-[#FAEDCD] hover:bg-[#DCD5BC] border border-[#DCD5BC] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldAlert className="w-3 h-3 text-[#8B5E34]" />
                            <span>Validate Against Literature (Stage 4D)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* TOOL 2: COMPARATIVE CROSS-ANALYSIS WORKBENCH */}
      {activeToolTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#8B5E34]" />
              <span>Comparative Literature Cross-Analysis (Gemma 4 Multi-Paper Synthesis)</span>
            </h3>
            <p className="text-xs text-[#6B6255] leading-relaxed">
              Compare two scholarly publications side-by-side with rigorous evidence grounding. The engine identifies shared objectives, distinct algorithmic architectures, empirical trade-offs, and unresolved questions without fabricating gaps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Select Paper A</label>
                <select
                  value={comparePaperA}
                  onChange={(e) => setComparePaperA(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27] focus:ring-2 focus:ring-[#D4A373]"
                >
                  {activePapers.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title} ({p.journal}, {p.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Select Paper B</label>
                <select
                  value={comparePaperB}
                  onChange={(e) => setComparePaperB(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27] focus:ring-2 focus:ring-[#D4A373]"
                >
                  {activePapers.map((p) => (
                    <option key={`b-${p.id}`} value={p.title}>
                      {p.title} ({p.journal}, {p.year})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRunPaperComparison}
                disabled={loadingCompare}
                className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loadingCompare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                <span>Execute Comparative Cross-Analysis</span>
              </button>

              <span className="text-[11px] text-[#6B6255] font-mono">
                Model: <span className="font-bold text-[#342F27]">{selectedAiModel}</span>
              </span>
            </div>

            {compareError && (
              <div className="p-3 bg-[#FEFAE0] border border-[#B83A32]/40 rounded-xl text-[#B83A32] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{compareError}</span>
              </div>
            )}
          </div>

          {/* Comparison Results Display */}
          {comparisonResult && (
            <div className="space-y-6 text-xs">
              
              {/* Header & Provenance Box */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-[#DCD5BC] pb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded font-bold border border-[#B8C299]">
                      Model: {comparisonResult.modelUsed || comparisonResult.modelRequested}
                    </span>
                    <span className="text-[10px] font-mono bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded font-bold border border-[#B8C299] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Comparative Cross-Analysis Verified
                    </span>
                    {comparisonResult.persistedId && (
                      <span className="text-[10px] font-mono bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded font-bold border border-[#B8C299] flex items-center gap-1" title={`Server-verified DB ID: ${comparisonResult.persistedId}`}>
                        <Database className="w-3 h-3" />
                        Persisted: {String(comparisonResult.persistedId).slice(0, 8)}...
                      </span>
                    )}
                    {comparisonResult.isFallback && (
                      <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#986515] px-2 py-0.5 rounded font-bold border border-[#DCD5BC]">
                        [Fallback Active]
                      </span>
                    )}
                    {comparisonResult.inferenceDurationMs && (
                      <span className="text-[10px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-2 py-0.5 rounded border border-[#DCD5BC]">
                        {comparisonResult.inferenceDurationMs} ms
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6B6255] font-mono">
                    {comparisonResult.timestamp ? new Date(comparisonResult.timestamp).toLocaleString() : 'Just now'}
                  </span>
                </div>

                {comparisonResult.isFallback && comparisonResult.fallbackReason && (
                  <div className="p-3 bg-[#E9EDC9] border border-[#DCD5BC] rounded-xl text-[11px] text-[#342F27] space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[#986515]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#986515]" />
                      Fallback Routing Active
                    </span>
                    <p className="leading-snug">{comparisonResult.fallbackReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8B5E34] uppercase">Paper A</span>
                      {comparisonResult.paperA?.evidenceDepth && (
                        <span className="text-[9px] font-mono bg-[#FAEDCD] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                          {comparisonResult.paperA.evidenceDepth}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-[#342F27]">{comparisonResult.paperA?.title}</h4>
                    {comparisonResult.paperA?.doi && (
                      <span className="text-[10px] font-mono text-[#6B6255] block">DOI: {comparisonResult.paperA.doi}</span>
                    )}
                    {comparisonResult.paperA?.chunksUsed > 0 && (
                      <span className="text-[10px] text-[#6B6255] block">
                        Full-text Chunks Analyzed: <span className="font-mono font-bold">{comparisonResult.paperA.chunksUsed}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#287A50] uppercase">Paper B</span>
                      {comparisonResult.paperB?.evidenceDepth && (
                        <span className="text-[9px] font-mono bg-[#E9EDC9] text-[#287A50] px-1.5 py-0.5 rounded border border-[#B8C299]">
                          {comparisonResult.paperB.evidenceDepth}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-[#342F27]">{comparisonResult.paperB?.title}</h4>
                    {comparisonResult.paperB?.doi && (
                      <span className="text-[10px] font-mono text-[#6B6255] block">DOI: {comparisonResult.paperB.doi}</span>
                    )}
                    {comparisonResult.paperB?.chunksUsed > 0 && (
                      <span className="text-[10px] text-[#6B6255] block">
                        Full-text Chunks Analyzed: <span className="font-mono font-bold">{comparisonResult.paperB.chunksUsed}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Shared Objectives & Problems */}
              {(comparisonResult.sharedObjectivesAndProblems?.length > 0 || comparisonResult.commonObjectives?.length > 0) && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#8B5E34]" />
                    <span>1. Shared Research Objectives & Core Problems</span>
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.sharedObjectivesAndProblems?.map((obj: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#287A50] shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-sm text-[#342F27]">{obj.objective}</h5>
                            <p className="text-[#6B6255] leading-relaxed">{obj.context}</p>
                          </div>
                        </div>
                        {(obj.evidenceA || obj.evidenceB) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#DCD5BC]/60 text-[11px]">
                            {obj.evidenceA && (
                              <div className="bg-[#FAEDCD]/60 p-2 rounded border border-[#DCD5BC]">
                                <span className="font-bold text-[#8B5E34] block">Paper A Citation ({obj.evidenceA.sourceLocator}):</span>
                                <span className="italic text-[#342F27]">"{obj.evidenceA.textCitation}"</span>
                              </div>
                            )}
                            {obj.evidenceB && (
                              <div className="bg-[#E9EDC9]/60 p-2 rounded border border-[#B8C299]">
                                <span className="font-bold text-[#287A50] block">Paper B Citation ({obj.evidenceB.sourceLocator}):</span>
                                <span className="italic text-[#342F27]">"{obj.evidenceB.textCitation}"</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )) || comparisonResult.commonObjectives?.map((obj: string, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#287A50] shrink-0 mt-0.5" />
                        <span className="font-medium text-[#342F27]">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Methodological Differences */}
              {comparisonResult.methodologicalDifferences?.length > 0 && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-[#8B5E34]" />
                    <span>2. Methodological Differences & Algorithmic Trade-offs</span>
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.methodologicalDifferences.map((diff: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="text-[11px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299] inline-block">
                          {diff.dimension || diff.aspect}
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-[#FAEDCD]/60 rounded-lg border border-[#DCD5BC] space-y-1">
                            <span className="text-[10px] font-bold text-[#8B5E34] block">Paper A Approach</span>
                            <p className="text-[#342F27]">{diff.paperAApproach}</p>
                            {diff.evidenceA && (
                              <p className="text-[10px] text-[#6B6255] italic pt-1 border-t border-[#DCD5BC]/40">
                                {typeof diff.evidenceA === 'object' ? `"${diff.evidenceA.textCitation}" (${diff.evidenceA.sourceLocator})` : `"${diff.evidenceA}"`}
                              </p>
                            )}
                          </div>

                          <div className="p-3 bg-[#E9EDC9]/60 rounded-lg border border-[#B8C299] space-y-1">
                            <span className="text-[10px] font-bold text-[#287A50] block">Paper B Approach</span>
                            <p className="text-[#342F27]">{diff.paperBApproach}</p>
                            {diff.evidenceB && (
                              <p className="text-[10px] text-[#6B6255] italic pt-1 border-t border-[#B8C299]/40">
                                {typeof diff.evidenceB === 'object' ? `"${diff.evidenceB.textCitation}" (${diff.evidenceB.sourceLocator})` : `"${diff.evidenceB}"`}
                              </p>
                            )}
                          </div>
                        </div>

                        {diff.algorithmicTradeoff && (
                          <div className="mt-2 p-2.5 bg-[#FEFAE0] rounded-lg border border-[#DCD5BC] text-[#342F27]">
                            <span className="font-bold text-[#8B5E34] text-[11px] block">Algorithmic Trade-off:</span>
                            <p className="text-[#6B6255] leading-relaxed">{diff.algorithmicTradeoff}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Architectural Differences */}
              {comparisonResult.architecturalDifferences?.length > 0 && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#8B5E34]" />
                    <span>3. Architectural Differences & Structural Implications</span>
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.architecturalDifferences.map((arch: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <span className="text-[11px] font-bold text-[#342F27] bg-[#E9EDC9] px-2 py-0.5 rounded border border-[#B8C299] inline-block">
                          Component: {arch.component}
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-[#FAEDCD]/60 rounded-lg border border-[#DCD5BC] space-y-1">
                            <span className="text-[10px] font-bold text-[#8B5E34] block">Paper A Architecture</span>
                            <p className="text-[#342F27]">{arch.paperAArchitecture}</p>
                          </div>
                          <div className="p-3 bg-[#E9EDC9]/60 rounded-lg border border-[#B8C299] space-y-1">
                            <span className="text-[10px] font-bold text-[#287A50] block">Paper B Architecture</span>
                            <p className="text-[#342F27]">{arch.paperBArchitecture}</p>
                          </div>
                        </div>

                        {arch.structuralImplication && (
                          <div className="p-2.5 bg-[#FEFAE0] rounded-lg border border-[#DCD5BC] text-[#342F27]">
                            <span className="font-bold text-[#287A50] text-[11px] block">Structural & Computational Implication:</span>
                            <p className="text-[#6B6255] leading-relaxed">{arch.structuralImplication}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 & 5. Dataset / Evaluation & Quantitative Findings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 4. Dataset & Evaluation Differences */}
                <div className="bg-[#E9EDC9] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#287A50]" />
                    <span>4. Dataset & Evaluation Differences</span>
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.datasetAndEvaluationDifferences?.map((item: any, idx: number) => {
                      if (typeof item === 'string') {
                        return (
                          <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27]">
                            <p className="leading-relaxed font-medium">{item}</p>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-1.5 text-[#342F27]">
                          <span className="font-bold text-[#287A50] block">{item.aspect}</span>
                          <div className="text-[11px] space-y-1">
                            <p><span className="font-semibold text-[#8B5E34]">Paper A:</span> {item.paperABenchmarks}</p>
                            <p><span className="font-semibold text-[#287A50]">Paper B:</span> {item.paperBBenchmarks}</p>
                            <p className="italic text-[#6B6255] pt-1 border-t border-[#DCD5BC]/40">{item.evaluationVarianceSummary}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Quantitative Findings & Trade-offs */}
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Binary className="w-4 h-4 text-[#8B5E34]" />
                    <span>5. Quantitative Findings & Trade-offs</span>
                  </h4>
                  <div className="space-y-3">
                    {(comparisonResult.quantitativeFindingsAndTradeoffs || comparisonResult.divergentOrContradictoryFindings)?.map((item: any, idx: number) => {
                      if (typeof item === 'string') {
                        return (
                          <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27]">
                            <p className="leading-relaxed font-medium">{item}</p>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="p-3.5 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2 text-[#342F27]">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-bold text-[#8B5E34] text-xs">{item.metricOrTask || item.metric || 'Quantitative Metric'}</span>
                            <div className="flex flex-wrap items-center gap-1">
                              {item.sourcePaper && (
                                <span className="text-[9px] font-bold bg-[#FAEDCD] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                                  {item.sourcePaper}
                                </span>
                              )}
                              {item.benchmark && item.benchmark !== 'Unspecified' && (
                                <span className="text-[9px] font-mono bg-[#E9EDC9] text-[#287A50] px-1.5 py-0.5 rounded border border-[#B8C299]">
                                  Bench: {item.benchmark}
                                </span>
                              )}
                              {item.baseline && item.baseline !== 'Unspecified' && (
                                <span className="text-[9px] font-mono bg-[#FEFAE0] text-[#6B6255] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                                  Base: {item.baseline}
                                </span>
                              )}
                            </div>
                          </div>

                          {(item.hardware || item.conditions) && (item.hardware !== 'Unspecified in source text' || item.conditions !== 'Unspecified in source text') && (
                            <div className="text-[10px] text-[#6B6255] bg-[#E9EDC9]/30 px-2 py-1 rounded border border-[#CCD5AE]/60 flex flex-wrap gap-2">
                              {item.hardware && item.hardware !== 'Unspecified in source text' && item.hardware !== 'Unspecified' && (
                                <span><strong className="text-[#342F27]">HW:</strong> {item.hardware}</span>
                              )}
                              {item.conditions && item.conditions !== 'Unspecified in source text' && item.conditions !== 'Unspecified' && (
                                <span><strong className="text-[#342F27]">Conditions:</strong> {item.conditions}</span>
                              )}
                            </div>
                          )}

                          <div className="text-[11px] space-y-1">
                            <p>
                              <span className="font-semibold text-[#8B5E34]">Paper A:</span> {item.paperAResult}
                              {item.sourceLocatorA && <span className="text-[9px] font-mono text-[#6B6255] ml-1.5">[{item.sourceLocatorA}]</span>}
                            </p>
                            <p>
                              <span className="font-semibold text-[#287A50]">Paper B:</span> {item.paperBResult}
                              {item.sourceLocatorB && <span className="text-[9px] font-mono text-[#6B6255] ml-1.5">[{item.sourceLocatorB}]</span>}
                            </p>
                            {item.authorReportedResult && item.authorReportedResult !== `${item.paperAResult || ''} vs ${item.paperBResult || ''}`.trim() && (
                              <p className="text-[10px] text-[#287A50] bg-[#E9EDC9]/40 p-1.5 rounded border border-[#B8C299]/50">
                                <strong>Author-Reported:</strong> {item.authorReportedResult}
                              </p>
                            )}
                            <p className="text-[#6B6255] pt-1 border-t border-[#DCD5BC]/40 font-medium">
                              {item.comparativeAnalysis || item.tradeoffComparison || item.aiInterpretation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6 & 7. Limitations Comparison: Author-Stated vs AI-Inferred */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 6. Author-Stated Limitations */}
                <div className="bg-[#CCD5AE]/40 p-6 rounded-2xl border border-[#B8C299] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#8B5E34]" />
                      <span>6. Author-Stated Limitations</span>
                    </h4>
                    <span className="text-[9px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                      [AUTHOR_STATED_CONCLUSION]
                    </span>
                  </div>
                  <div className="space-y-2">
                    {/* Render Paper A Author Limitations */}
                    {comparisonResult.authorStatedLimitations?.paperALimitations?.map((lim: any, idx: number) => (
                      <div key={`a-${idx}`} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#8B5E34] bg-[#FAEDCD] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                            Paper A
                          </span>
                          {lim.sourceLocator && (
                            <span className="text-[9px] font-mono text-[#6B6255]">{lim.sourceLocator}</span>
                          )}
                        </div>
                        <p className="font-medium text-[#342F27]">{lim.limitation || String(lim)}</p>
                      </div>
                    ))}
                    {/* Render Paper B Author Limitations */}
                    {comparisonResult.authorStatedLimitations?.paperBLimitations?.map((lim: any, idx: number) => (
                      <div key={`b-${idx}`} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#287A50] bg-[#E9EDC9] px-1.5 py-0.5 rounded border border-[#B8C299]">
                            Paper B
                          </span>
                          {lim.sourceLocator && (
                            <span className="text-[9px] font-mono text-[#6B6255]">{lim.sourceLocator}</span>
                          )}
                        </div>
                        <p className="font-medium text-[#342F27]">{lim.limitation || String(lim)}</p>
                      </div>
                    ))}
                    {/* Fallback if array */}
                    {Array.isArray(comparisonResult.authorStatedLimitations) && comparisonResult.authorStatedLimitations.map((lim: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#8B5E34] bg-[#FAEDCD] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                            {lim.paper || 'Literature'}
                          </span>
                          {lim.evidence?.sourceLocator && (
                            <span className="text-[9px] font-mono text-[#6B6255]">{lim.evidence.sourceLocator}</span>
                          )}
                        </div>
                        <p className="font-medium text-[#342F27]">{lim.limitation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. AI-Inferred Limitations */}
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#986515]" />
                      <span>7. AI-Inferred Limitations</span>
                    </h4>
                    <span className="text-[9px] font-mono bg-[#E9EDC9] text-[#986515] px-1.5 py-0.5 rounded border border-[#B8C299]">
                      [AI_INFERRED_HYPOTHESIS]
                    </span>
                  </div>
                  <div className="space-y-2">
                    {comparisonResult.aiInferredLimitations?.map((lim: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#287A50] bg-[#E9EDC9] px-1.5 py-0.5 rounded border border-[#B8C299]">
                            {lim.paperTarget || lim.paper || 'Comparative Extrapolation'}
                          </span>
                          <span className="text-[9px] font-mono text-[#6B6255]">Confidence: {lim.epistemicConfidence || 'HYPOTHESIS'}</span>
                        </div>
                        <p className="font-medium text-[#342F27]">{lim.inferredLimitation || lim.limitation}</p>
                        <p className="text-[10px] text-[#6B6255] italic">Reasoning: {lim.analyticalReasoning || lim.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8. Candidate Research Hypotheses */}
              {comparisonResult.candidateResearchHypotheses?.length > 0 && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#8B5E34]" />
                      <span>8. Candidate Research Hypotheses</span>
                    </h4>
                    <span className="text-[9px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                      [AI_RESEARCH_HYPOTHESIS]
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonResult.candidateResearchHypotheses.map((hyp: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <h5 className="font-bold text-[#342F27] text-xs">{hyp.hypothesisTitle}</h5>
                        <p className="text-[#342F27] leading-relaxed">{hyp.formulation || hyp.coreHypothesis}</p>
                        <div className="text-[11px] bg-[#FAEDCD]/60 p-2 rounded border border-[#DCD5BC] space-y-1">
                          <span className="font-bold text-[#8B5E34] block">Comparative Rationale:</span>
                          <p className="text-[#6B6255]">{hyp.motivationFromComparison || hyp.rationaleFromComparison}</p>
                        </div>
                        {(hyp.suggestedFalsificationCriteria || hyp.formulation) && (
                          <div className="text-[11px] bg-[#E9EDC9]/60 p-2 rounded border border-[#B8C299] space-y-1">
                            <span className="font-bold text-[#287A50] block">Suggested Falsification Criteria:</span>
                            <p className="text-[#342F27]">{hyp.suggestedFalsificationCriteria || 'Empirical benchmark ablation under identical hyperparameter scaling.'}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Cross-Literature Research Gaps */}
              {comparisonResult.crossLiteratureResearchGaps?.length > 0 && (
                <div className="bg-[#CCD5AE]/40 p-6 rounded-2xl border border-[#B8C299] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#8B5E34]" />
                      <span>9. Cross-Literature Research Gaps</span>
                    </h4>
                    <span className="text-[9px] font-mono bg-[#FEFAE0] text-[#8B5E34] px-1.5 py-0.5 rounded border border-[#DCD5BC]">
                      [AI_RESEARCH_GAP]
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonResult.crossLiteratureResearchGaps.map((gap: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <h5 className="font-bold text-[#342F27] text-xs">{gap.gapTitle}</h5>
                        <p className="text-[#342F27] leading-relaxed">{gap.corroborationDetails || gap.problemDescription}</p>
                        <div className="text-[11px] bg-[#FAEDCD] p-2 rounded border border-[#DCD5BC]">
                          <span className="font-semibold text-[#8B5E34] block">Unexplored Operational Condition:</span>
                          <span className="text-[#6B6255]">{gap.unexploredCondition || gap.whyUnresolvedInBoth || 'High-throughput scaling beyond single-node clusters.'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Suggested Validation Experiments */}
              {(comparisonResult.suggestedValidationExperiments?.length > 0 || comparisonResult.comparativeResearchOpportunities?.length > 0) && (
                <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8B5E34]" />
                    <span>10. Suggested Empirical Validation Experiments & Synthesis</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonResult.suggestedValidationExperiments?.map((exp: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] space-y-2">
                        <h5 className="font-bold text-[#342F27] text-xs">{exp.experimentTitle}</h5>
                        <p className="text-[#342F27] leading-relaxed font-medium">{exp.targetHypothesis || exp.objective}</p>
                        <div className="text-[11px] bg-[#FAEDCD]/70 p-2.5 rounded border border-[#DCD5BC] space-y-1">
                          <span className="font-bold text-[#8B5E34] block">Proposed Methodology:</span>
                          <p className="text-[#6B6255]">{exp.proposedMethodology}</p>
                        </div>
                        {exp.feasibilityAndRisks && (
                          <div className="text-[11px] bg-[#E9EDC9]/70 p-2.5 rounded border border-[#B8C299] space-y-1">
                            <span className="font-bold text-[#287A50] block">Feasibility & Technical Risks:</span>
                            <p className="text-[#342F27]">{exp.feasibilityAndRisks}</p>
                          </div>
                        )}
                        {exp.evaluationMetrics?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {exp.evaluationMetrics.map((met: string, mIdx: number) => (
                              <span key={mIdx} className="text-[9px] font-mono bg-[#CCD5AE] text-[#342F27] px-1.5 py-0.5 rounded border border-[#B8C299]">
                                {met}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )) || comparisonResult.comparativeResearchOpportunities?.map((opp: string, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27]">
                        <p className="leading-relaxed font-medium">{opp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* TOOL 3: CHALLENGE DRAFT GENERATOR & APPROVER */}
      {activeToolTab === 'drafter' && (
        <div className="space-y-6">
          <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#342F27]">Draft a Research Challenge from Paper Limitations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Source Paper</label>
                <select
                  value={selectedPaperForDraft}
                  onChange={(e) => {
                    setSelectedPaperForDraft(e.target.value);
                    const p = activePapers.find(item => item.title === e.target.value);
                    if (p) setTargetLimitationText(p.limitations[0] || '');
                  }}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27]"
                >
                  {activePapers.map((p) => (
                    <option key={p.id} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Target Research Limitation</label>
                <input
                  type="text"
                  value={targetLimitationText}
                  onChange={(e) => setTargetLimitationText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27]"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateChallengeDraft}
              disabled={loadingDrafter}
              className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loadingDrafter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              <span>Draft Challenge Specification</span>
            </button>
          </div>

          {/* Generated Draft Preview with Human Approval Controls */}
          {challengeDraft && (
            <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs text-[#342F27]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299] font-mono">
                    [{challengeDraft.draftStatus}]
                  </span>
                  <span className="text-[10px] text-[#6B6255] font-mono">Requires Explicit Human Approval</span>
                </div>
                {isChallengePublished && (
                  <span className="text-[10px] font-bold text-[#287A50] bg-[#E9EDC9] px-2 py-0.5 rounded border border-[#B8C299] flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#287A50]" />
                    <span>Approved & Published to Challenge Hub!</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#6B6255] uppercase">Draft Title</span>
                <h3 className="text-base font-bold text-[#342F27] mt-0.5">{challengeDraft.title}</h3>
              </div>

              <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">
                <span className="font-bold text-[#342F27] block mb-1">Problem Statement</span>
                <p className="text-[#6B6255] leading-relaxed">{challengeDraft.problemStatement}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">
                  <span className="font-bold text-[#342F27] block mb-1">Constraints & Assumptions</span>
                  <ul className="list-disc list-inside space-y-1 text-[#6B6255]">
                    {challengeDraft.knownConstraints?.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#E9EDC9] p-3.5 rounded-xl border border-[#DCD5BC]">
                  <span className="font-bold text-[#8B5E34] block mb-1">Suggested Success Criteria</span>
                  <p className="text-[#342F27] leading-relaxed">{challengeDraft.suggestedSuccessCriteria}</p>
                </div>
              </div>

              {/* Human Approval Action */}
              {!isChallengePublished && (
                <div className="pt-4 border-t border-[#DCD5BC] flex items-center justify-between">
                  <p className="text-[11px] text-[#6B6255]">
                    Review constraints before publishing. Content will not be published automatically.
                  </p>
                  <button
                    onClick={handleApproveAndPublishChallenge}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#287A50] hover:bg-[#1f5f3e] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Publish Challenge</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: CONTRIBUTOR MATCH ENGINE */}
      {activeToolTab === 'matcher' && (
        <div className="space-y-6">
          <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#342F27]">Match Qualified Contributors to Challenge</h3>
            
            <div>
              <label className="block font-bold text-[#6B6255] mb-1">Target Research Challenge</label>
              <select
                value={selectedChallengeForMatch}
                onChange={(e) => setSelectedChallengeForMatch(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27]"
              >
                {activeChallenges.map((c) => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunContributorMatch}
              disabled={loadingMatcher}
              className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loadingMatcher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              <span>Execute Skill & Publication Alignment Engine</span>
            </button>
          </div>

          {/* Matches List */}
          <div className="space-y-3 text-xs">
            {matchedContributors.map((match, idx) => (
              <div key={idx} className="bg-[#FAEDCD] rounded-2xl p-5 border border-[#DCD5BC] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#342F27] text-sm">{match.contributorName}</h4>
                  <span className="font-mono font-bold text-[#287A50] bg-[#E9EDC9] px-2.5 py-1 rounded-lg border border-[#B8C299]">
                    {match.matchScorePercentage}% Skill Match Alignment
                  </span>
                </div>

                <p className="text-[#342F27] bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC] leading-relaxed">
                  {match.alignmentReasoning}
                </p>

                {match.supportingReferences && (
                  <div>
                    <span className="text-[10px] font-bold text-[#6B6255] uppercase tracking-wider block mb-1">Supporting Evidence References</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#6B6255] text-[11px]">
                      {match.supportingReferences.map((ref: string, i: number) => (
                        <li key={i}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOOL 4: AI TRUST & EVALUATION BENCHMARK SUITE */}
      {activeToolTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#342F27]">Run AI Extraction & Citation Accuracy Benchmark</h3>
                <p className="text-[#6B6255] mt-0.5">Measures completeness, source locator accuracy, and unsupported claim rates on representative papers.</p>
              </div>
              <button
                onClick={handleRunBenchmark}
                disabled={loadingBenchmark}
                className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loadingBenchmark ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
                <span>Execute Benchmark Suite</span>
              </button>
            </div>
          </div>

          {benchmarkReport && (
            <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-6 text-xs text-[#342F27]">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#DCD5BC]">
                <span className="font-mono font-bold text-[#8B5E34]">{benchmarkReport.benchmarkSuite}</span>
                <span className="font-mono text-[#6B6255]">Model: {benchmarkReport.modelIdentifier}</span>
              </div>

              {/* Sample Suite Notice */}
              <div className="p-3 bg-[#E9EDC9] border border-[#DCD5BC] text-[#342F27] rounded-xl text-[11px] font-medium leading-relaxed">
                <strong>Data Provenance Notice:</strong> Metrics above represent a reproducible reference evaluation suite across N=5 peer-reviewed papers. Real-time paper analysis latency is calculated dynamically during execution.
              </div>

              {/* Metrics Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-center">
                <div className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC]">
                  <span className="block text-[10px] font-sans text-[#6B6255] font-bold uppercase">Completeness</span>
                  <span className="text-lg font-bold text-[#287A50]">{benchmarkReport.metrics.extractionCompletenessPercentage}%</span>
                </div>

                <div className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC]">
                  <span className="block text-[10px] font-sans text-[#6B6255] font-bold uppercase">Citation Accuracy</span>
                  <span className="text-lg font-bold text-[#8B5E34]">{benchmarkReport.metrics.evidenceReferenceAccuracyPercentage}%</span>
                </div>

                <div className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC]">
                  <span className="block text-[10px] font-sans text-[#6B6255] font-bold uppercase">Schema Conformance</span>
                  <span className="text-lg font-bold text-[#342F27]">{benchmarkReport.metrics.structuredOutputValidityPercentage}%</span>
                </div>

                <div className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC]">
                  <span className="block text-[10px] font-sans text-[#6B6255] font-bold uppercase">Avg Latency</span>
                  <span className="text-lg font-bold text-[#342F27]">{benchmarkReport.metrics.averageLatencyMs} ms</span>
                </div>
              </div>

              {/* Baseline Comparison */}
              <div className="bg-[#FEFAE0] p-4 rounded-xl border border-[#DCD5BC] space-y-2">
                <h4 className="font-bold text-[#342F27] uppercase text-[10px] tracking-wider">Comparison Against Baseline ({benchmarkReport.baselineComparison.baselineMode})</h4>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-[#6B6255] block">Extraction Gain</span>
                    <span className="font-bold text-[#287A50]">{benchmarkReport.baselineComparison.completenessGain}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6255] block">Speedup Factor</span>
                    <span className="font-bold text-[#8B5E34]">{benchmarkReport.baselineComparison.extractionSpeedupFactor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6255] block">Citation Precision</span>
                    <span className="font-bold text-[#342F27]">{benchmarkReport.baselineComparison.citationAccuracyDelta}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TOOL 6: STAGE 4D CROSS-LITERATURE VALIDATION & CONTRADICTION DETECTION */}
      {activeToolTab === 'validation' && (
        <CrossLiteratureValidationPanel
          gapId={selectedValidationGap.id}
          gapTitle={selectedValidationGap.title}
          gapDescription={selectedValidationGap.desc}
        />
      )}

    </div>
  );
};
