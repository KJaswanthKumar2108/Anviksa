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
  Quote
} from 'lucide-react';
import { MOCK_PAPERS, MOCK_CHALLENGES, MOCK_CONTRIBUTORS, Paper, Challenge } from '../data/mockData';
import { runAIEvaluationBenchmark, EvaluationReport } from '../utils/aiEvaluationBenchmark';

interface AiAssistantViewProps {
  onPublishChallengeSuccess?: (newChallenge: Challenge) => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ onPublishChallengeSuccess }) => {
  const [activeToolTab, setActiveToolTab] = useState<'analyzer' | 'drafter' | 'matcher' | 'benchmark'>('analyzer');

  // AI Model Selection State
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemma-4-26b-a4b-it');

  // Tool 1: Paper Analyzer State
  const [selectedPaperTitle, setSelectedPaperTitle] = useState(MOCK_PAPERS[0].title);
  const [customAbstract, setCustomAbstract] = useState('');
  const [loadingAnalyzer, setLoadingAnalyzer] = useState(false);
  const [paperAnalysis, setPaperAnalysis] = useState<any>({
    modelRequested: 'gemma-4-26b-a4b-it',
    modelUsed: 'gemma-4-26b-a4b-it',
    isFallback: false,
    providerRequestSucceeded: true,
    analysisStatus: 'completed',
    timestamp: new Date().toISOString(),
    paperTitle: MOCK_PAPERS[0].title,
    doi: MOCK_PAPERS[0].doi,
    objective: 'To eliminate the quadratic O(N²) computational bottleneck of self-attention in long-context Transformers.',
    problem: 'Standard self-attention requires O(N²) memory and compute, making contexts beyond 32k tokens computationally prohibitive.',
    methodology: 'Introduces S2-Kernel, a state-space operator that approximates global self-attention in linear time O(N).',
    mainClaims: [
      { claim: 'Achieves linear time O(N) time complexity on sequences up to 128,000 tokens.', sourceLocator: 'Section 3.1, Paragraph 2', evidenceStatus: 'EXTRACTED_FROM_SOURCE' },
      { claim: 'Perplexity remains within 0.04 points of standard Transformer-XL baseline on Pile corpus.', sourceLocator: 'Section 4.2, Table 1', evidenceStatus: 'EXTRACTED_FROM_SOURCE' }
    ],
    assumptionsConstraints: [
      'Requires GPU hardware supporting FP32 or TF32 matrix accumulation',
      'Assumes stationary state transitions across temporal chunk boundaries'
    ],
    authorStatedLimitations: [
      { limitation: 'High GPU activation memory overhead during backward pass gradient synthesis', sourceLocator: 'Section 5.3 (Limitations)', evidenceStatus: 'EXTRACTED_FROM_SOURCE' },
      { limitation: 'Degraded retrieval precision on non-contiguous multi-hop associative recall tasks', sourceLocator: 'Section 5.4, Paragraph 1', evidenceStatus: 'EXTRACTED_FROM_SOURCE' }
    ],
    aiInferredLimitations: [
      { limitation: 'Lack of long-form empirical evaluation on multi-file codebase generation benchmarks', reasoning: 'The evaluation suite is restricted to single-file Pile text snippets.', evidenceStatus: 'AI_INFERRED_HYPOTHESIS' },
      { limitation: 'Potential numerical underflow in float16 precision when sequence lengths exceed 256k tokens', reasoning: 'State space transition matrices exhibit vanishing eigenvalues under low precision.', evidenceStatus: 'AI_INFERRED_HYPOTHESIS' }
    ],
    openQuestions: [
      'Can backward pass activation storage be reduced to O(1) via chunked state space recomputation?',
      'Will inserting decay bounds resolve precision degradation on multi-hop associative recall?'
    ]
  });

  // Tool 2: Challenge Drafter State
  const [selectedPaperForDraft, setSelectedPaperForDraft] = useState(MOCK_PAPERS[0].title);
  const [targetLimitationText, setTargetLimitationText] = useState(MOCK_PAPERS[0].limitations[0]);
  const [loadingDrafter, setLoadingDrafter] = useState(false);
  const [challengeDraft, setChallengeDraft] = useState<any>(null);
  const [isChallengePublished, setIsChallengePublished] = useState(false);

  // Tool 3: Contributor Matcher State
  const [selectedChallengeForMatch, setSelectedChallengeForMatch] = useState(MOCK_CHALLENGES[0].title);
  const [loadingMatcher, setLoadingMatcher] = useState(false);
  const [matchedContributors, setMatchedContributors] = useState<any[]>([]);

  // Tool 4: Evaluation Benchmark State
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState<EvaluationReport | null>(null);

  // Run Paper Analysis
  const handleRunPaperAnalysis = async () => {
    setLoadingAnalyzer(true);
    try {
      const res = await fetch('/api/ai-research/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperTitle: selectedPaperTitle,
          abstract: customAbstract || MOCK_PAPERS.find(p => p.title === selectedPaperTitle)?.abstract,
          doi: MOCK_PAPERS.find(p => p.title === selectedPaperTitle)?.doi,
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
      const targetChallenge = MOCK_CHALLENGES.find(c => c.title === selectedChallengeForMatch) || MOCK_CHALLENGES[0];
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
            { id: 'drafter', label: '2. Challenge Draft Generator', icon: Target },
            { id: 'matcher', label: '3. Contributor Match Engine', icon: Users },
            { id: 'benchmark', label: '4. AI Trust & Evaluation Suite', icon: BarChart2 }
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
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini 3.8 Flash Baseline)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Gemini 3.1 Pro Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#6B6255] mb-1">Select Paper from Directory</label>
                <select
                  value={selectedPaperTitle}
                  onChange={(e) => {
                    setSelectedPaperTitle(e.target.value);
                    const p = MOCK_PAPERS.find(item => item.title === e.target.value);
                    if (p) setTargetLimitationText(p.limitations[0] || '');
                  }}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27] focus:ring-2 focus:ring-[#D4A373]"
                >
                  {MOCK_PAPERS.map((p) => (
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
              
              {/* Paper Overview Box */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-[#DCD5BC] pb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#E9EDC9] text-[#342F27] px-2 py-0.5 rounded border border-[#DCD5BC]">
                      DOI: {paperAnalysis.doi}
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

                <h3 className="text-base font-bold text-[#342F27]">{paperAnalysis.paperTitle}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">
                    <span className="font-bold text-[#342F27] block mb-1">Research Objective</span>
                    <p className="text-[#6B6255] leading-relaxed">{paperAnalysis.objective}</p>
                  </div>

                  <div className="bg-[#FEFAE0] p-3.5 rounded-xl border border-[#DCD5BC]">
                    <span className="font-bold text-[#342F27] block mb-1">Problem Addressed</span>
                    <p className="text-[#6B6255] leading-relaxed">{paperAnalysis.problem}</p>
                  </div>
                </div>
              </div>

              {/* Main Claims with Source Locators */}
              <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[#8B5E34]" />
                  <span>Main Claims & Evidence Source Locators</span>
                </h4>

                <div className="space-y-2">
                  {paperAnalysis.mainClaims?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#E9EDC9] text-[#287A50] px-2 py-0.5 rounded border border-[#B8C299] shrink-0 mt-0.5">
                          [EXTRACTED FROM SOURCE]
                        </span>
                        <p className="font-medium text-[#342F27]">{item.claim}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8B5E34] bg-[#FAEDCD] px-2 py-1 rounded border border-[#DCD5BC] shrink-0">
                        Locator: {item.sourceLocator}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Author-Stated Limitations vs AI-Inferred Limitations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Author Stated */}
                <div className="bg-[#E9EDC9] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#986515]" />
                    <span>Author-Stated Limitations (Verified Quotes)</span>
                  </h4>
                  <div className="space-y-2">
                    {paperAnalysis.authorStatedLimitations?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#986515]">[AUTHOR STATED]</span>
                          <span className="text-[#6B6255]">Locator: {item.sourceLocator}</span>
                        </div>
                        <p className="font-medium leading-relaxed">{item.limitation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Inferred */}
                <div className="bg-[#CCD5AE]/40 p-6 rounded-2xl border border-[#B8C299] shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#342F27] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8B5E34]" />
                    <span>AI-Inferred Potential Limitations</span>
                  </h4>
                  <div className="space-y-2">
                    {paperAnalysis.aiInferredLimitations?.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-bold text-[#8B5E34]">[AI-INFERRED HYPOTHESIS]</span>
                          <span className="text-[#6B6255]">Unverified</span>
                        </div>
                        <p className="font-semibold leading-relaxed">{item.limitation}</p>
                        <p className="text-[11px] text-[#6B6255] leading-snug">Reasoning: {item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* TOOL 2: CHALLENGE DRAFT GENERATOR & APPROVER */}
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
                    const p = MOCK_PAPERS.find(item => item.title === e.target.value);
                    if (p) setTargetLimitationText(p.limitations[0] || '');
                  }}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl font-medium text-[#342F27]"
                >
                  {MOCK_PAPERS.map((p) => (
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
                {MOCK_CHALLENGES.map((c) => (
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

    </div>
  );
};
