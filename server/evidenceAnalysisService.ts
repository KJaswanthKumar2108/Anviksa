/**
 * Evidence-Grounded Research Paper Analysis & Synthesis Service
 * 
 * Leverages Gemma 4 (with resilient Gemini fallback) to analyze real extracted
 * scientific literature with rigorous provenance, page/section citations,
 * strict separation of author-stated vs AI-inferred limitations, and research comparison.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { resolveModelIdentifier, ModelResolution } from '../src/lib/ai/modelAdapter.js';
import { fullTextService } from './fullTextService.js';
import { supabase, isSupabaseConfigured, getSupabase, getSupabaseAdmin } from '../src/lib/supabase.js';
import type { ExtractedDocument, GemmaChunk, ExtractedSection } from '../src/types/openalex.js';

export interface EvidenceCitation {
  sourceLocator: string;
  section: string;
  pageRange?: string;
  excerpt?: string;
  evidenceStatus: 'EXTRACTED_FROM_SOURCE' | 'AUTHOR_STATED_CONCLUSION' | 'AI_INFERRED_HYPOTHESIS' | 'AI_RESEARCH_HYPOTHESIS';
}

export interface GroundedClaim {
  claim: string;
  evidence: EvidenceCitation;
}

export interface GroundedLimitation {
  limitation: string;
  category: 'AUTHOR_STATED' | 'AI_INFERRED';
  evidence: EvidenceCitation;
  reasoning?: string;
}

export type EpistemicGapCategory =
  | 'AUTHOR_STATED_LIMITATION'
  | 'PAPER_SUPPORTED_OBSERVATION'
  | 'AI_INFERRED_LIMITATION'
  | 'CANDIDATE_RESEARCH_HYPOTHESIS'
  | 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP';

export interface PotentialResearchGap {
  gapTitle: string;
  description: string;
  category: EpistemicGapCategory;
  categoryLabel: string;
  unexploredCondition: string;
  suggestedExperimentalDirection: string;
  evidence: EvidenceCitation;
  supportingLiterature?: {
    paperTitle: string;
    doi?: string;
    relation: string;
  }[];
  validationCriteriaMet: boolean;
  validationNotes: string;
}

export function classifyResearchGap(
  rawCategory: string | undefined,
  isCrossLiterature: boolean = false,
  supportingPapersCount: number = 0
): { category: EpistemicGapCategory; categoryLabel: string; validationCriteriaMet: boolean; validationNotes: string } {
  const norm = (rawCategory || '').toUpperCase();

  if (norm.includes('AUTHOR') || norm.includes('CONCEDED')) {
    return {
      category: 'AUTHOR_STATED_LIMITATION',
      categoryLabel: 'Author-Stated Limitation',
      validationCriteriaMet: true,
      validationNotes: 'Directly conceded by the authors within the primary text.'
    };
  }

  if (norm.includes('OBSERVATION') || norm.includes('SUPPORTED') || norm.includes('EMPIRICAL')) {
    return {
      category: 'PAPER_SUPPORTED_OBSERVATION',
      categoryLabel: 'Paper-Supported Observation',
      validationCriteriaMet: true,
      validationNotes: 'Empirically documented in publication results, tables, or ablation benchmarks.'
    };
  }

  if (norm.includes('CROSS') || norm.includes('VALIDATED')) {
    if (isCrossLiterature || supportingPapersCount >= 2) {
      return {
        category: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP',
        categoryLabel: 'Cross-Literature-Validated Research Gap',
        validationCriteriaMet: true,
        validationNotes: `Corroborated across ${Math.max(2, supportingPapersCount)} independent literature publications.`
      };
    } else {
      return {
        category: 'CANDIDATE_RESEARCH_HYPOTHESIS',
        categoryLabel: 'Candidate Research Hypothesis',
        validationCriteriaMet: false,
        validationNotes: 'Downgraded: A topic absent from a single paper cannot be designated cross-literature-validated without multi-source literature corroboration.'
      };
    }
  }

  if (norm.includes('INFERRED') || norm.includes('BOUNDARY')) {
    return {
      category: 'AI_INFERRED_LIMITATION',
      categoryLabel: 'AI-Inferred Limitation',
      validationCriteriaMet: false,
      validationNotes: 'Deduced by model from experimental bounds, hardware assumptions, or evaluation omissions.'
    };
  }

  return {
    category: 'CANDIDATE_RESEARCH_HYPOTHESIS',
    categoryLabel: 'Candidate Research Hypothesis',
    validationCriteriaMet: false,
    validationNotes: 'Exploratory hypothesis requiring empirical trial before scientific validation.'
  };
}

export interface ResearchPaperAnalysis {
  paperTitle: string;
  doi: string;
  paperId?: string;
  persistedId?: string | null;
  modelRequested: string;
  modelUsed: string;
  isFallback: boolean;
  fallbackReason: string | null;
  adapterNotes: string;
  inferenceDurationMs: number;
  timestamp: string;
  analysisVersion: string;
  
  // Section A: Research Objective
  objective: {
    problemAddressed: string;
    coreObjective: string;
    centralResearchQuestion: string;
    evidence: EvidenceCitation;
  };

  // Section B: Methodology
  methodology: {
    algorithmsUsed: string[];
    mathematicalFormulations: string[];
    experimentalDesign: string;
    datasetsAndMetrics: string[];
    hardwareAndSoftwareRequirements: string[];
    evidence: EvidenceCitation;
  };

  // Section C: Key Findings
  keyFindings: {
    mainContributions: GroundedClaim[];
    quantitativeResults: GroundedClaim[];
    baselineComparisons: GroundedClaim[];
  };

  // Section D: Limitations (Strict separation)
  limitations: {
    authorStated: GroundedLimitation[];
    aiInferred: GroundedLimitation[];
  };

  // Section E: Potential Research Gaps
  potentialResearchGaps: PotentialResearchGap[];

  // Provenance & Scope Metadata
  provenance: {
    fullTextAnalyzed: boolean;
    sectionsAnalyzed: string[];
    chunksUsed: number;
    totalDocumentPages: number;
    documentChecksum: string | null;
  };

  // Backward compatibility fields
  problem?: string;
  mainClaims?: { claim: string; sourceLocator: string; evidenceStatus: string }[];
  assumptionsConstraints?: string[];
  authorStatedLimitations?: { limitation: string; sourceLocator: string; evidenceStatus: string }[];
  aiInferredLimitations?: { limitation: string; reasoning?: string; evidenceStatus: string }[];
  openQuestions?: string[];
}

export interface PaperComparisonResult {
  persistedId?: string | null;
  paperA: { title: string; doi?: string | null; evidenceDepth?: string };
  paperB: { title: string; doi?: string | null; evidenceDepth?: string };
  modelRequested: string;
  modelUsed: string;
  isFallback: boolean;
  fallbackReason: string | null;
  inferenceDurationMs: number;
  timestamp: string;
  evidenceLevel: 'full-text-grounded' | 'abstract-and-metadata-only';

  // 1. Shared research objectives and problem statements
  sharedObjectivesAndProblems: {
    sharedProblem: string;
    sharedObjective: string;
    evidenceA?: string;
    evidenceB?: string;
  }[];

  // 2. Differences in research methodology
  methodologicalDifferences: {
    aspect: string;
    paperAApproach: string;
    paperBApproach: string;
    evidenceA?: string;
    evidenceB?: string;
  }[];

  // 3. Algorithmic and architectural differences
  architecturalDifferences: {
    component: string;
    paperADesign: string;
    paperBDesign: string;
    tradeoffSummary: string;
  }[];

  // 4. Datasets, experimental settings, and evaluation metrics
  datasetAndEvaluationDifferences: {
    dimension: string;
    paperASetting: string;
    paperBSetting: string;
    varianceAnalysis: string;
  }[];

  // 5. Quantitative findings and performance trade-offs with structured scientific verification
  quantitativeFindingsAndTradeoffs: {
    metricOrTask: string;
    sourcePaper?: 'Paper A' | 'Paper B' | 'Both' | string;
    benchmark?: string;
    baseline?: string;
    hardware?: string;
    conditions?: string;
    paperAResult: string;
    paperBResult: string;
    sourceLocatorA?: string;
    sourceLocatorB?: string;
    authorReportedResult?: string;
    aiInterpretation?: string;
    comparativeAnalysis: string;
    tradeoffComparison?: string;
  }[];

  // 6. Author-stated limitations from each paper
  authorStatedLimitations: {
    paperALimitations: { limitation: string; sourceLocator: string }[];
    paperBLimitations: { limitation: string; sourceLocator: string }[];
  };

  // 7. AI-inferred limitations, explicitly labelled
  aiInferredLimitations: {
    paperTarget: 'Paper A' | 'Paper B' | 'Both';
    inferredLimitation: string;
    epistemicLabel: 'AI_INFERRED_LIMITATION';
    analyticalReasoning: string;
  }[];

  // 8. Potential research hypotheses
  candidateResearchHypotheses: {
    hypothesisTitle: string;
    formulation: string;
    epistemicLabel: 'CANDIDATE_RESEARCH_HYPOTHESIS';
    motivationFromComparison: string;
  }[];

  // 9. Research gaps supported by evidence across both papers
  crossLiteratureResearchGaps: {
    gapTitle: string;
    corroborationDetails: string;
    epistemicLabel: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP';
    validationCriteriaMet: boolean;
    unexploredCondition: string;
  }[];

  // 10. Potential experiments that could validate those hypotheses
  suggestedValidationExperiments: {
    experimentTitle: string;
    targetHypothesis: string;
    proposedMethodology: string;
    evaluationMetrics: string[];
    feasibilityAndRisks: string;
  }[];

  // Backward compatibility fields
  commonObjectives: string[];
  divergentOrContradictoryFindings: string[];
  unresolvedQuestions: string[];
  comparativeResearchOpportunities: string[];
}

export class EvidenceAnalysisService {
  /**
   * Selects relevant chunks within token budget, prioritizing IMRAD sections.
   */
  public selectRelevantChunks(
    document: ExtractedDocument,
    maxChunks: number = 16
  ): { selectedChunks: GemmaChunk[]; sectionsAnalyzed: string[] } {
    const chunks = document.gemmaChunks || [];
    if (chunks.length === 0) {
      return { selectedChunks: [], sectionsAnalyzed: [] };
    }

    if (chunks.length <= maxChunks) {
      const sections = Array.from(new Set(chunks.map(c => c.section)));
      return { selectedChunks: chunks, sectionsAnalyzed: sections };
    }

    // Section Priority order
    const priority = [
      'Abstract',
      'Introduction',
      'Methodology',
      'Results',
      'Limitations',
      'Conclusion',
      'Related Work',
      'Discussion'
    ];

    const prioritized: GemmaChunk[] = [];
    const seenSections = new Set<string>();

    for (const secName of priority) {
      const matching = chunks.filter(c => c.section.toLowerCase().includes(secName.toLowerCase()));
      for (const chunk of matching) {
        if (prioritized.length < maxChunks) {
          prioritized.push(chunk);
          seenSections.add(chunk.section);
        }
      }
    }

    // If still have budget, add remaining chunks sequentially
    for (const chunk of chunks) {
      if (prioritized.length < maxChunks && !prioritized.includes(chunk)) {
        prioritized.push(chunk);
        seenSections.add(chunk.section);
      }
    }

    // Sort back to sequential order for coherent narrative
    prioritized.sort((a, b) => a.chunkIndex - b.chunkIndex);

    return {
      selectedChunks: prioritized,
      sectionsAnalyzed: Array.from(seenSections)
    };
  }

  /**
   * Main Analysis Workflow: Analyzes a research paper using Gemma 4 with strict evidence grounding.
   */
  public async analyzeResearchPaper(
    aiClient: GoogleGenAI | null,
    params: {
      paperTitle: string;
      doi?: string | null;
      paperId?: string;
      abstract?: string;
      fullText?: string;
      fullTextDocument?: ExtractedDocument | null;
      modelRequested?: string;
    }
  ): Promise<ResearchPaperAnalysis> {
    const startTime = Date.now();
    const modelRequested = params.modelRequested || 'gemma-4-26b-a4b-it';
    const modelInfo = resolveModelIdentifier(modelRequested);

    // 1. Resolve Document Content: Check if we have extracted full-text document
    let doc = params.fullTextDocument || null;

    // If full text document was not provided but DOI exists, attempt retrieving it via fullTextService
    if (!doc && params.doi) {
      try {
        const retrieval = await fullTextService.retrieveAndExtractForPaper(params.doi);
        if (retrieval.document) {
          doc = retrieval.document;
        }
      } catch (e) {
        console.warn('[EvidenceAnalysisService] Full-text retrieve attempt note:', e);
      }
    }

    // 2. Prepare Context Chunks & Metadata
    let contextPrompt = '';
    let sectionsAnalyzed: string[] = [];
    let chunksUsed = 0;
    let fullTextAnalyzed = false;
    let totalDocumentPages = doc?.pageCount || 1;
    let documentChecksum = doc?.checksumSha256 || null;

    if (doc && doc.gemmaChunks && doc.gemmaChunks.length > 0) {
      const selection = this.selectRelevantChunks(doc, 14);
      sectionsAnalyzed = selection.sectionsAnalyzed;
      chunksUsed = selection.selectedChunks.length;
      fullTextAnalyzed = true;

      contextPrompt = selection.selectedChunks
        .map(c => `=== CHUNK [Page ${c.pageStart}-${c.pageEnd}, Section: ${c.section}] ===\nCitation Ref: ${c.citationRef}\n${c.text}`)
        .join('\n\n');
    } else {
      sectionsAnalyzed = ['Abstract'];
      chunksUsed = 1;
      fullTextAnalyzed = false;
      contextPrompt = `=== ABSTRACT / TEXT CONTENT ===\nTitle: ${params.paperTitle}\nDOI: ${params.doi || 'N/A'}\n${params.fullText || params.abstract || 'No text content available.'}`;
    }

    // 3. System Instructions enforcing strict evidence citation and limitation separation
    const systemInstruction = `You are OpenResearch Intelligence, a rigorous evidence-grounded scientific literature analyzer powered by Gemma 4.
Your mandate is to extract, analyze, and synthesize scientific papers with verifiable citations and provenance.

CRITICAL RULES:
1. Every claim, finding, and methodology item MUST cite its exact section and page range using the format "[Pages X-Y, Section: Z]" from the provided text chunks.
2. STRICTLY CATEGORIZE GAPS INTO 5 EPISTEMIC CLASSES:
   - "AUTHOR_STATED_LIMITATION": Limitations explicitly conceded by authors in the text. Labeled as AUTHOR_STATED_CONCLUSION.
   - "PAPER_SUPPORTED_OBSERVATION": Directly verified empirical tradeoffs or ablation findings in the paper tables/figures.
   - "AI_INFERRED_LIMITATION": Deductions based on missing boundary conditions, unaddressed hardware profiles, or untested edge scenarios.
   - "CANDIDATE_RESEARCH_HYPOTHESIS": Exploratory research hypotheses proposing new algorithms or architectural changes.
   - "CROSS_LITERATURE_VALIDATED_RESEARCH_GAP": STRICT RULE: NEVER classify a gap as cross-literature-validated merely because it is omitted from one paper. This category requires corroborating evidence from multiple publications.
3. If an equation, algorithm name, or hardware metric is not mentioned in the text, DO NOT fabricate it. State "Not explicitly documented in analyzed text".
4. Output MUST be valid JSON adhering to the required structure.`;

    const userPrompt = `Analyze the following scientific paper content and return a structured JSON response:
Paper Title: ${params.paperTitle}
DOI: ${params.doi || 'N/A'}
Analyzed Sections: ${sectionsAnalyzed.join(', ')}

DOCUMENT EVIDENCE CHUNKS:
${contextPrompt}

Respond in JSON with this exact structure:
{
  "objective": {
    "problemAddressed": "Detailed explanation of core problem",
    "coreObjective": "Specific objective",
    "centralResearchQuestion": "Central research question investigated",
    "sourceLocator": "Page and section citation"
  },
  "methodology": {
    "algorithmsUsed": ["Algorithm 1", "Algorithm 2"],
    "mathematicalFormulations": ["Mathematical model / equation with notation"],
    "experimentalDesign": "Experimental framework and setup",
    "datasetsAndMetrics": ["Dataset / benchmark name and metrics"],
    "hardwareAndSoftwareRequirements": ["Hardware / software environment"],
    "sourceLocator": "Page and section citation"
  },
  "keyFindings": {
    "mainContributions": [
      { "claim": "Contribution statement", "sourceLocator": "Page and section citation", "excerpt": "Short quote" }
    ],
    "quantitativeResults": [
      { "claim": "Quantitative finding with numbers", "sourceLocator": "Page and section citation", "excerpt": "Short quote" }
    ],
    "baselineComparisons": [
      { "claim": "Comparison vs baseline", "sourceLocator": "Page and section citation", "excerpt": "Short quote" }
    ]
  },
  "authorStatedLimitations": [
    { "limitation": "Explicit limitation admitted by authors", "sourceLocator": "Page and section citation", "excerpt": "Author quote" }
  ],
  "aiInferredLimitations": [
    { "limitation": "Inferred boundary or missing condition", "reasoning": "Scientific reasoning for inference", "sourceLocator": "Contextual chunk reference" }
  ],
  "potentialResearchGaps": [
    {
      "gapTitle": "Title of gap",
      "description": "Gap description",
      "category": "AUTHOR_STATED_LIMITATION | PAPER_SUPPORTED_OBSERVATION | AI_INFERRED_LIMITATION | CANDIDATE_RESEARCH_HYPOTHESIS | CROSS_LITERATURE_VALIDATED_RESEARCH_GAP",
      "unexploredCondition": "Unexplored condition",
      "suggestedExperimentalDirection": "Suggested experiment",
      "sourceLocator": "Related section citation"
    }
  ]
}`;

    // 4. Execute AI Generation with Gemma 4 and Resilient Fallback
    const result = await this.executeGeneration(aiClient, modelRequested, userPrompt, systemInstruction);
    const inferenceDurationMs = Date.now() - startTime;

    if (!result.providerRequestSucceeded || !result.text) {
      const err: any = new Error(result.fallbackReason || 'Inference request failed on external AI provider.');
      err.status = 503;
      err.code = 'INFERENCE_FAILED';
      throw err;
    }

    // 5. Parse and Normalize Output
    const parsed = this.parseJsonSafe(result.text);
    if (!parsed || typeof parsed !== 'object') {
      const err: any = new Error('Model output failed JSON parsing.');
      err.status = 502;
      err.code = 'MALFORMED_MODEL_OUTPUT';
      throw err;
    }

    const normalizedAnalysis: ResearchPaperAnalysis = {
      paperTitle: params.paperTitle,
      doi: params.doi || 'N/A',
      paperId: params.paperId,
      modelRequested: result.modelInfo.requestedModel,
      modelUsed: result.modelUsed,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason,
      adapterNotes: result.modelInfo.notes,
      inferenceDurationMs,
      timestamp: new Date().toISOString(),
      analysisVersion: 'gemma4-v2-grounded',

      objective: {
        problemAddressed: parsed.objective?.problemAddressed || 'Problem statement extracted from literature.',
        coreObjective: parsed.objective?.coreObjective || 'Primary research objective.',
        centralResearchQuestion: parsed.objective?.centralResearchQuestion || 'Central research question.',
        evidence: {
          sourceLocator: parsed.objective?.sourceLocator || `[${sectionsAnalyzed[0] || 'Introduction'}]`,
          section: 'Introduction / Objective',
          evidenceStatus: 'EXTRACTED_FROM_SOURCE'
        }
      },

      methodology: {
        algorithmsUsed: Array.isArray(parsed.methodology?.algorithmsUsed) ? parsed.methodology.algorithmsUsed : [],
        mathematicalFormulations: Array.isArray(parsed.methodology?.mathematicalFormulations) ? parsed.methodology.mathematicalFormulations : [],
        experimentalDesign: parsed.methodology?.experimentalDesign || 'Empirical evaluation methodology.',
        datasetsAndMetrics: Array.isArray(parsed.methodology?.datasetsAndMetrics) ? parsed.methodology.datasetsAndMetrics : [],
        hardwareAndSoftwareRequirements: Array.isArray(parsed.methodology?.hardwareAndSoftwareRequirements) ? parsed.methodology.hardwareAndSoftwareRequirements : [],
        evidence: {
          sourceLocator: parsed.methodology?.sourceLocator || `[Methodology]`,
          section: 'Methodology / System Design',
          evidenceStatus: 'EXTRACTED_FROM_SOURCE'
        }
      },

      keyFindings: {
        mainContributions: (Array.isArray(parsed.keyFindings?.mainContributions) ? parsed.keyFindings.mainContributions : []).map((c: any) => ({
          claim: c.claim || String(c),
          evidence: {
            sourceLocator: c.sourceLocator || '[Results]',
            section: 'Results / Contributions',
            excerpt: c.excerpt || undefined,
            evidenceStatus: 'EXTRACTED_FROM_SOURCE'
          }
        })),
        quantitativeResults: (Array.isArray(parsed.keyFindings?.quantitativeResults) ? parsed.keyFindings.quantitativeResults : []).map((c: any) => ({
          claim: c.claim || String(c),
          evidence: {
            sourceLocator: c.sourceLocator || '[Results Table / Text]',
            section: 'Quantitative Results',
            excerpt: c.excerpt || undefined,
            evidenceStatus: 'EXTRACTED_FROM_SOURCE'
          }
        })),
        baselineComparisons: (Array.isArray(parsed.keyFindings?.baselineComparisons) ? parsed.keyFindings.baselineComparisons : []).map((c: any) => ({
          claim: c.claim || String(c),
          evidence: {
            sourceLocator: c.sourceLocator || '[Experiments / Comparison]',
            section: 'Baseline Comparisons',
            excerpt: c.excerpt || undefined,
            evidenceStatus: 'EXTRACTED_FROM_SOURCE'
          }
        }))
      },

      limitations: {
        authorStated: (Array.isArray(parsed.authorStatedLimitations) ? parsed.authorStatedLimitations : []).map((l: any) => ({
          limitation: l.limitation || String(l),
          category: 'AUTHOR_STATED',
          evidence: {
            sourceLocator: l.sourceLocator || '[Limitations Section]',
            section: 'Author Conceded Limitations',
            excerpt: l.excerpt || undefined,
            evidenceStatus: 'AUTHOR_STATED_CONCLUSION'
          }
        })),
        aiInferred: (Array.isArray(parsed.aiInferredLimitations) ? parsed.aiInferredLimitations : []).map((l: any) => ({
          limitation: l.limitation || String(l),
          category: 'AI_INFERRED',
          reasoning: l.reasoning || 'Inferred from experimental scope boundaries.',
          evidence: {
            sourceLocator: l.sourceLocator || '[Epistemic Evaluation]',
            section: 'AI Extrapolation',
            evidenceStatus: 'AI_INFERRED_HYPOTHESIS'
          }
        }))
      },

      potentialResearchGaps: (Array.isArray(parsed.potentialResearchGaps) ? parsed.potentialResearchGaps : []).map((g: any) => {
        const supportingLiterature = Array.isArray(g.supportingLiterature) ? g.supportingLiterature : [];
        const classification = classifyResearchGap(g.category, false, supportingLiterature.length);
        return {
          gapTitle: g.gapTitle || 'Research Opportunity',
          description: g.description || String(g),
          category: classification.category,
          categoryLabel: classification.categoryLabel,
          unexploredCondition: g.unexploredCondition || 'Unexplored operational scenario',
          suggestedExperimentalDirection: g.suggestedExperimentalDirection || 'Further empirical trial recommended.',
          supportingLiterature,
          validationCriteriaMet: classification.validationCriteriaMet,
          validationNotes: classification.validationNotes,
          evidence: {
            sourceLocator: g.sourceLocator || '[Research Opportunities]',
            section: 'Research Gaps',
            evidenceStatus: (classification.category === 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP' 
              ? 'AUTHOR_STATED_CONCLUSION'
              : 'AI_RESEARCH_HYPOTHESIS') as any
          }
        };
      }),

      provenance: {
        fullTextAnalyzed,
        sectionsAnalyzed,
        chunksUsed,
        totalDocumentPages,
        documentChecksum
      },

      // Backward compatibility aliases
      problem: parsed.objective?.problemAddressed || 'Problem statement extracted from literature.',
      mainClaims: (Array.isArray(parsed.keyFindings?.mainContributions) ? parsed.keyFindings.mainContributions : []).map((c: any, i: number) => ({
        claim: c.claim || String(c),
        sourceLocator: c.sourceLocator || `[${sectionsAnalyzed[0] || 'Findings'} #${i + 1}]`,
        evidenceStatus: 'EXTRACTED_FROM_SOURCE'
      })),
      assumptionsConstraints: Array.isArray(parsed.methodology?.hardwareAndSoftwareRequirements) ? parsed.methodology.hardwareAndSoftwareRequirements : [],
      authorStatedLimitations: (Array.isArray(parsed.authorStatedLimitations) ? parsed.authorStatedLimitations : []).map((l: any, i: number) => ({
        limitation: l.limitation || String(l),
        sourceLocator: l.sourceLocator || `[Author Discussion #${i + 1}]`,
        evidenceStatus: 'EXTRACTED_FROM_SOURCE'
      })),
      aiInferredLimitations: (Array.isArray(parsed.aiInferredLimitations) ? parsed.aiInferredLimitations : []).map((l: any, i: number) => ({
        limitation: l.limitation || String(l),
        reasoning: l.reasoning || `Hypothesis deduced from theoretical boundary conditions #${i + 1}.`,
        evidenceStatus: 'AI_INFERRED_HYPOTHESIS'
      })),
      openQuestions: (Array.isArray(parsed.potentialResearchGaps) ? parsed.potentialResearchGaps : []).map((g: any) => `${g.gapTitle || 'Research Gap'}: ${g.description || ''}`)
    };

    // 6. Persist to Supabase asynchronously
    const persistedId = await this.persistAnalysis(normalizedAnalysis);
    if (persistedId) {
      normalizedAnalysis.persistedId = persistedId;
    }

    return normalizedAnalysis;
  }

  /**
   * Compares two research papers with methodological and empirical cross-examination.
   */
  public async comparePapers(
    aiClient: GoogleGenAI | null,
    paperA: { title: string; doi?: string | null; abstract?: string; document?: ExtractedDocument | null },
    paperB: { title: string; doi?: string | null; abstract?: string; document?: ExtractedDocument | null },
    modelRequested: string = 'gemma-4-26b-a4b-it'
  ): Promise<PaperComparisonResult> {
    const startTime = Date.now();
    const systemInstruction = `You are OpenResearch Comparative Synthesis Engine, analyzing two scholarly publications.
Analyze the two papers across 10 structured comparative dimensions.
CRITICAL EPISTEMIC INTEGRITY RULES:
1. Every factual statement must be grounded in the provided texts with specific excerpt citations.
2. Never conclude a research gap exists merely because one paper omitted a topic.
3. Author-stated limitations must be attributed only if explicitly conceded by authors in the source text.
4. AI-inferred limitations must be explicitly labeled AI_INFERRED_LIMITATION.
5. Cross-literature research gaps must be corroborated across BOTH papers.
6. Never fabricate datasets, numbers, benchmarks, or citations.
7. QUANTITATIVE EVIDENCE RIGOR:
   - For each quantitative claim, retain: Source paper, Benchmark, Baseline, Hardware (if explicitly mentioned in text), Sequence length or experimental conditions (if stated), and Original evidence locator.
   - Keep direct author-reported results strictly separate from AI comparative interpretations.
   - Do NOT invent or assume missing experimental details — if hardware or conditions are not stated, specify "Unspecified in source text".
Output ONLY a valid JSON object matching the requested schema.`;

    // Attempt resolving full text if available
    let docA = paperA.document || null;
    if (!docA && paperA.doi) {
      try {
        const retA = await fullTextService.retrieveAndExtractForPaper(paperA.doi);
        docA = retA.document || null;
      } catch (e) {}
    }

    let docB = paperB.document || null;
    if (!docB && paperB.doi) {
      try {
        const retB = await fullTextService.retrieveAndExtractForPaper(paperB.doi);
        docB = retB.document || null;
      } catch (e) {}
    }

    const hasFullA = Boolean(docA && Object.keys(docA.sections || {}).length > 0);
    const hasFullB = Boolean(docB && Object.keys(docB.sections || {}).length > 0);
    const evidenceLevel: 'full-text-grounded' | 'abstract-and-metadata-only' = (hasFullA || hasFullB)
      ? 'full-text-grounded'
      : 'abstract-and-metadata-only';

    const summaryA = docA
      ? Object.entries(docA.sections).map(([name, s]) => `[Section: ${name}]\n${s.content.slice(0, 3000)}`).join('\n\n')
      : paperA.abstract || 'No abstract text available.';

    const summaryB = docB
      ? Object.entries(docB.sections).map(([name, s]) => `[Section: ${name}]\n${s.content.slice(0, 3000)}`).join('\n\n')
      : paperB.abstract || 'No abstract text available.';

    const userPrompt = `Perform a comprehensive, evidence-grounded comparative literature analysis between:

PAPER A: ${paperA.title} (DOI: ${paperA.doi || 'N/A'})
EVIDENCE DEPTH: ${hasFullA ? 'Full-Text Document' : 'Abstract and Metadata Only'}
TEXT A:
${summaryA.slice(0, 15000)}

PAPER B: ${paperB.title} (DOI: ${paperB.doi || 'N/A'})
EVIDENCE DEPTH: ${hasFullB ? 'Full-Text Document' : 'Abstract and Metadata Only'}
TEXT B:
${summaryB.slice(0, 15000)}

Output a valid JSON object matching this structure:
{
  "sharedObjectivesAndProblems": [
    { "sharedProblem": "Problem both papers address", "sharedObjective": "Common research objective", "evidenceA": "Excerpt from Paper A", "evidenceB": "Excerpt from Paper B" }
  ],
  "methodologicalDifferences": [
    { "aspect": "Specific methodology aspect", "paperAApproach": "Paper A method", "paperBApproach": "Paper B method", "evidenceA": "Paper A citation", "evidenceB": "Paper B citation" }
  ],
  "architecturalDifferences": [
    { "component": "Architecture component", "paperADesign": "Paper A design", "paperBDesign": "Paper B design", "tradeoffSummary": "Design trade-off" }
  ],
  "datasetAndEvaluationDifferences": [
    { "dimension": "Benchmark or metric", "paperASetting": "Paper A dataset/eval", "paperBSetting": "Paper B dataset/eval", "varianceAnalysis": "Why results vary" }
  ],
  "quantitativeFindingsAndTradeoffs": [
    {
      "metricOrTask": "Task or benchmark metric",
      "sourcePaper": "Paper A | Paper B | Both",
      "benchmark": "Benchmark name or 'Unspecified'",
      "baseline": "Baseline model/technique or 'Unspecified'",
      "hardware": "Hardware profile stated by authors or 'Unspecified in source text'",
      "conditions": "Sequence length or experimental conditions or 'Unspecified in source text'",
      "paperAResult": "Exact result from Paper A",
      "paperBResult": "Exact result from Paper B",
      "sourceLocatorA": "Section/Page locator in Paper A",
      "sourceLocatorB": "Section/Page locator in Paper B",
      "authorReportedResult": "Direct author-reported metric and values",
      "aiInterpretation": "Separate AI comparative interpretation",
      "comparativeAnalysis": "Factual comparison grounded strictly in text"
    }
  ],
  "authorStatedLimitations": {
    "paperALimitations": [{ "limitation": "Limitation admitted by authors", "sourceLocator": "Section/Page locator" }],
    "paperBLimitations": [{ "limitation": "Limitation admitted by authors", "sourceLocator": "Section/Page locator" }]
  },
  "aiInferredLimitations": [
    { "paperTarget": "Paper A", "inferredLimitation": "Limitation deduced by model", "analyticalReasoning": "Why this limitation holds" }
  ],
  "candidateResearchHypotheses": [
    { "hypothesisTitle": "Hypothesis name", "formulation": "Proposed hypothesis", "motivationFromComparison": "Why the comparison supports this" }
  ],
  "crossLiteratureResearchGaps": [
    { "gapTitle": "Validated gap title", "corroborationDetails": "How both papers show this gap", "unexploredCondition": "Unexplored condition" }
  ],
  "suggestedValidationExperiments": [
    { "experimentTitle": "Experiment name", "targetHypothesis": "Target hypothesis", "proposedMethodology": "Protocol", "evaluationMetrics": ["Metric 1"], "feasibilityAndRisks": "Feasibility" }
  ]
}`;

    const result = await this.executeGeneration(aiClient, modelRequested, userPrompt, systemInstruction);
    const inferenceDurationMs = Date.now() - startTime;
    if (!result.providerRequestSucceeded || !result.text) {
      throw new Error(result.fallbackReason || 'Comparative inference failed.');
    }

    const parsed = this.parseJsonSafe(result.text) || {};

    // Backward-compatible projections
    const commonObjectives = Array.isArray(parsed.sharedObjectivesAndProblems)
      ? parsed.sharedObjectivesAndProblems.map((p: any) => `${p.sharedObjective || p.sharedProblem}`)
      : (Array.isArray(parsed.commonObjectives) ? parsed.commonObjectives : []);

    const normalizedQuantitativeFindings = Array.isArray(parsed.quantitativeFindingsAndTradeoffs)
      ? parsed.quantitativeFindingsAndTradeoffs.map((q: any) => ({
          metricOrTask: q.metricOrTask || q.metric || 'Performance Metric',
          sourcePaper: q.sourcePaper || 'Both',
          benchmark: q.benchmark || 'Unspecified',
          baseline: q.baseline || 'Unspecified',
          hardware: q.hardware || 'Unspecified in source text',
          conditions: q.conditions || 'Unspecified in source text',
          paperAResult: q.paperAResult || 'Not reported',
          paperBResult: q.paperBResult || 'Not reported',
          sourceLocatorA: q.sourceLocatorA || q.sourceLocator || undefined,
          sourceLocatorB: q.sourceLocatorB || undefined,
          authorReportedResult: q.authorReportedResult || `${q.paperAResult || ''} vs ${q.paperBResult || ''}`.trim(),
          aiInterpretation: q.aiInterpretation || q.comparativeAnalysis || q.tradeoffComparison || '',
          comparativeAnalysis: q.comparativeAnalysis || q.tradeoffComparison || 'Factual comparison extracted from texts.',
          tradeoffComparison: q.comparativeAnalysis || q.tradeoffComparison || ''
        }))
      : [];

    const divergentOrContradictoryFindings = normalizedQuantitativeFindings.length > 0
      ? normalizedQuantitativeFindings.map(
          (q: any) => `${q.metricOrTask} [Benchmark: ${q.benchmark} | Baseline: ${q.baseline}]: Paper A: ${q.paperAResult} vs Paper B: ${q.paperBResult}. Analysis: ${q.comparativeAnalysis}`
        )
      : (Array.isArray(parsed.divergentOrContradictoryFindings) ? parsed.divergentOrContradictoryFindings : []);

    const unresolvedQuestions = Array.isArray(parsed.candidateResearchHypotheses)
      ? parsed.candidateResearchHypotheses.map((h: any) => `${h.hypothesisTitle}: ${h.formulation}`)
      : (Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : []);

    const comparativeResearchOpportunities = Array.isArray(parsed.crossLiteratureResearchGaps)
      ? parsed.crossLiteratureResearchGaps.map((g: any) => `${g.gapTitle}: ${g.corroborationDetails}`)
      : (Array.isArray(parsed.comparativeResearchOpportunities) ? parsed.comparativeResearchOpportunities : []);

    const comparisonResult: PaperComparisonResult = {
      paperA: {
        title: paperA.title,
        doi: paperA.doi,
        evidenceDepth: hasFullA ? 'Full-Text Document' : 'Abstract and Metadata Only'
      },
      paperB: {
        title: paperB.title,
        doi: paperB.doi,
        evidenceDepth: hasFullB ? 'Full-Text Document' : 'Abstract and Metadata Only'
      },
      modelRequested,
      modelUsed: result.modelUsed,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason,
      inferenceDurationMs,
      timestamp: new Date().toISOString(),
      evidenceLevel,

      sharedObjectivesAndProblems: Array.isArray(parsed.sharedObjectivesAndProblems) ? parsed.sharedObjectivesAndProblems : [],
      methodologicalDifferences: Array.isArray(parsed.methodologicalDifferences) ? parsed.methodologicalDifferences : [],
      architecturalDifferences: Array.isArray(parsed.architecturalDifferences) ? parsed.architecturalDifferences : [],
      datasetAndEvaluationDifferences: Array.isArray(parsed.datasetAndEvaluationDifferences) ? parsed.datasetAndEvaluationDifferences : [],
      quantitativeFindingsAndTradeoffs: normalizedQuantitativeFindings,

      authorStatedLimitations: {
        paperALimitations: Array.isArray(parsed.authorStatedLimitations?.paperALimitations)
          ? parsed.authorStatedLimitations.paperALimitations
          : [],
        paperBLimitations: Array.isArray(parsed.authorStatedLimitations?.paperBLimitations)
          ? parsed.authorStatedLimitations.paperBLimitations
          : []
      },

      aiInferredLimitations: Array.isArray(parsed.aiInferredLimitations)
        ? parsed.aiInferredLimitations.map((l: any) => ({
            paperTarget: l.paperTarget || 'Both',
            inferredLimitation: l.inferredLimitation || String(l),
            epistemicLabel: 'AI_INFERRED_LIMITATION' as const,
            analyticalReasoning: l.analyticalReasoning || ''
          }))
        : [],

      candidateResearchHypotheses: Array.isArray(parsed.candidateResearchHypotheses)
        ? parsed.candidateResearchHypotheses.map((h: any) => ({
            hypothesisTitle: h.hypothesisTitle || 'Hypothesis',
            formulation: h.formulation || String(h),
            epistemicLabel: 'CANDIDATE_RESEARCH_HYPOTHESIS' as const,
            motivationFromComparison: h.motivationFromComparison || ''
          }))
        : [],

      crossLiteratureResearchGaps: Array.isArray(parsed.crossLiteratureResearchGaps)
        ? parsed.crossLiteratureResearchGaps.map((g: any) => ({
            gapTitle: g.gapTitle || 'Cross-Literature Gap',
            corroborationDetails: g.corroborationDetails || String(g),
            epistemicLabel: 'CROSS_LITERATURE_VALIDATED_RESEARCH_GAP' as const,
            validationCriteriaMet: true,
            unexploredCondition: g.unexploredCondition || ''
          }))
        : [],

      suggestedValidationExperiments: Array.isArray(parsed.suggestedValidationExperiments)
        ? parsed.suggestedValidationExperiments.map((e: any) => ({
            experimentTitle: e.experimentTitle || 'Validation Experiment',
            targetHypothesis: e.targetHypothesis || '',
            proposedMethodology: e.proposedMethodology || '',
            evaluationMetrics: Array.isArray(e.evaluationMetrics) ? e.evaluationMetrics : [],
            feasibilityAndRisks: e.feasibilityAndRisks || ''
          }))
        : [],

      // Backward compatibility fields
      commonObjectives,
      divergentOrContradictoryFindings,
      unresolvedQuestions,
      comparativeResearchOpportunities
    };

    // Attempt server-verified database persistence for comparative analysis
    const persistedId = await this.persistComparativeAnalysis(comparisonResult);
    if (persistedId) {
      comparisonResult.persistedId = persistedId;
    }

    return comparisonResult;
  }

  /**
   * Safe JSON Parser handling code blocks and trailing annotations.
   */
  private parseJsonSafe(rawText?: string | null): any {
    if (!rawText) return null;
    try {
      return JSON.parse(rawText.trim());
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        try {
          return JSON.parse(match[1].trim());
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Centralized inference execution honoring Gemma 4 conventions and fallback.
   */
  private async executeGeneration(
    aiClient: GoogleGenAI | null,
    modelRequested: string,
    userPrompt: string,
    systemInstruction: string
  ): Promise<{
    modelInfo: ModelResolution;
    modelUsed: string;
    isFallback: boolean;
    fallbackReason: string | null;
    providerRequestSucceeded: boolean;
    text: string | null;
  }> {
    const modelInfo = resolveModelIdentifier(modelRequested || 'gemma-4-26b-a4b-it');
    if (!aiClient) {
      return {
        modelInfo,
        modelUsed: 'None',
        isFallback: false,
        fallbackReason: 'GEMINI_API_KEY is not configured on the server environment.',
        providerRequestSucceeded: false,
        text: null
      };
    }

    const primaryModel = modelInfo.resolvedModel;
    const secondaryModel = modelInfo.secondaryModel;
    const fallbackModel = modelInfo.fallbackModel;

    function buildParams(targetModel: string) {
      const isGemma = targetModel.toLowerCase().includes('gemma');
      const config: any = { temperature: 0.1 };
      let contents = userPrompt;

      if (!isGemma) {
        config.systemInstruction = systemInstruction;
        config.responseMimeType = 'application/json';
      } else {
        contents = `System Instruction:\n${systemInstruction}\n\nUser Request:\n${userPrompt}\n\nIMPORTANT: Output ONLY a valid JSON object matching the requested schema. No conversational preamble.`;
      }
      return { model: targetModel, contents, config };
    }

    // 1. Try primary
    const simulateOutage = process.env.TEST_SIMULATE_GEMMA_OUTAGE === 'true';
    try {
      if (simulateOutage && primaryModel.toLowerCase().includes('gemma')) {
        throw new Error(`Controlled test simulation: Primary Gemma 4 model '${primaryModel}' unavailable (HTTP 503 UNAVAILABLE).`);
      }
      const response = await aiClient.models.generateContent(buildParams(primaryModel));
      return {
        modelInfo,
        modelUsed: primaryModel,
        isFallback: false,
        fallbackReason: null,
        providerRequestSucceeded: true,
        text: response.text || null
      };
    } catch (primaryErr: any) {
      const primaryMsg = primaryErr?.message || String(primaryErr);

      // 2. Try secondary Gemma
      if (secondaryModel && secondaryModel !== primaryModel) {
        try {
          if (simulateOutage && secondaryModel.toLowerCase().includes('gemma')) {
            throw new Error(`Controlled test simulation: Secondary Gemma 4 model '${secondaryModel}' unavailable (HTTP 503 UNAVAILABLE).`);
          }
          const response = await aiClient.models.generateContent(buildParams(secondaryModel));
          return {
            modelInfo,
            modelUsed: secondaryModel,
            isFallback: true,
            fallbackReason: `Primary Gemma model '${primaryModel}' call failed (${primaryMsg}). Recovered using '${secondaryModel}'.`,
            providerRequestSucceeded: true,
            text: response.text || null
          };
        } catch (secErr: any) {
          console.warn(`[AI Engine] Secondary Gemma model '${secondaryModel}' failed: ${secErr?.message || secErr}`);
        }
      }

      // 3. Fallback to Gemini Flash
      try {
        console.log(`[AI Engine] Attempting inference with fallback model: ${fallbackModel}`);
        const response = await aiClient.models.generateContent(buildParams(fallbackModel));
        return {
          modelInfo,
          modelUsed: fallbackModel,
          isFallback: true,
          fallbackReason: `Gemma 4 models failed (${primaryMsg}). Recovered using baseline fallback '${fallbackModel}'.`,
          providerRequestSucceeded: true,
          text: response.text || null
        };
      } catch (fbErr: any) {
        const fbMsg = fbErr?.message || String(fbErr);
        console.warn(`[AI Engine] Configured fallback model '${fallbackModel}' failed: ${fbMsg}`);

        // 4. Resilient rescue tier (gemini-3-flash-preview) if primary fallback hit 503 / high demand
        const rescueFallback = (fallbackModel !== 'gemini-3-flash-preview') ? 'gemini-3-flash-preview' : 'gemini-3.5-flash';
        try {
          console.log(`[AI Engine] Attempting inference with active rescue fallback: ${rescueFallback}`);
          const response = await aiClient.models.generateContent(buildParams(rescueFallback));
          return {
            modelInfo: {
              ...modelInfo,
              fallbackModel: rescueFallback
            },
            modelUsed: rescueFallback,
            isFallback: true,
            fallbackReason: `Gemma 4 models failed (${primaryMsg}), and fallback '${fallbackModel}' failed (${fbMsg}). Recovered using active fallback '${rescueFallback}'.`,
            providerRequestSucceeded: true,
            text: response.text || null
          };
        } catch (rescueErr: any) {
          return {
            modelInfo,
            modelUsed: 'None',
            isFallback: true,
            fallbackReason: `All models failed: Primary (${primaryMsg}) -> Fallback ${fallbackModel} (${fbMsg}) -> Rescue ${rescueFallback} (${rescueErr?.message || rescueErr})`,
            providerRequestSucceeded: false,
            text: null
          };
        }
      }
    }
  }

  /**
   * Persists analysis results to Supabase `paper_analyses` table and `research_papers` table
   * using the secure server-verified RPC with service-role client to guarantee cryptographic provenance.
   */
  public async persistAnalysis(analysis: ResearchPaperAnalysis, userId?: string | null, visibility: string = 'public') {
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn('[EvidenceAnalysisService] SUPABASE_SERVICE_ROLE_KEY missing on server. insert_server_verified_analysis requires service-role authorization.');
      return null;
    }

    try {
      const { data: insertedId, error: rpcErr } = await admin.rpc('insert_server_verified_analysis', {
        p_doi: analysis.doi !== 'N/A' ? analysis.doi : null,
        p_paper_title: analysis.paperTitle,
        p_model_requested: analysis.modelRequested,
        p_model_used: analysis.modelUsed,
        p_is_fallback: analysis.isFallback,
        p_fallback_reason: analysis.fallbackReason,
        p_analysis_version: analysis.analysisVersion,
        p_objective: analysis.objective.coreObjective,
        p_problem: analysis.objective.problemAddressed,
        p_methodology: analysis.methodology.experimentalDesign,
        p_key_findings: analysis.keyFindings,
        p_author_stated_limitations: analysis.limitations.authorStated,
        p_ai_inferred_limitations: analysis.limitations.aiInferred,
        p_potential_research_gaps: analysis.potentialResearchGaps,
        p_evidence_references: {
          objective: analysis.objective.evidence,
          methodology: analysis.methodology.evidence,
          provenance: analysis.provenance
        },
        p_sections_analyzed: analysis.provenance.sectionsAnalyzed,
        p_chunks_used: analysis.provenance.chunksUsed,
        p_analysis_output: analysis,
        p_user_id: userId || null,
        p_visibility: visibility || 'public'
      });

      if (rpcErr) {
        console.warn('[EvidenceAnalysisService] insert_server_verified_analysis rpc warning:', rpcErr);
      }
      return insertedId;
    } catch (dbErr) {
      console.warn('[EvidenceAnalysisService] Database persistence warning:', dbErr);
      return null;
    }
  }

  /**
   * Persists comparative analysis results to Supabase `paper_analyses` table
   * using the secure server-verified RPC with service-role client to guarantee cryptographic provenance.
   */
  public async persistComparativeAnalysis(comparison: PaperComparisonResult, userId?: string | null, visibility: string = 'public') {
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn('[EvidenceAnalysisService] SUPABASE_SERVICE_ROLE_KEY missing on server. insert_server_verified_analysis requires service-role authorization.');
      return null;
    }

    try {
      const { data: insertedId, error: rpcErr } = await admin.rpc('insert_server_verified_analysis', {
        p_doi: comparison.paperA?.doi || comparison.paperB?.doi || null,
        p_paper_title: `Comparative Analysis: ${comparison.paperA.title} vs ${comparison.paperB.title}`,
        p_model_requested: comparison.modelRequested,
        p_model_used: comparison.modelUsed,
        p_is_fallback: comparison.isFallback,
        p_fallback_reason: comparison.fallbackReason,
        p_analysis_version: '2.0.0',
        p_objective: comparison.sharedObjectivesAndProblems?.[0]?.sharedObjective || 'Comparative Literature Synthesis',
        p_problem: comparison.sharedObjectivesAndProblems?.[0]?.sharedProblem || 'Literature Comparison Problem',
        p_methodology: 'Comparative Cross-Literature Synthesis across 10 structured dimensions',
        p_key_findings: {
          methodologicalDifferences: comparison.methodologicalDifferences,
          architecturalDifferences: comparison.architecturalDifferences,
          quantitativeFindingsAndTradeoffs: comparison.quantitativeFindingsAndTradeoffs
        },
        p_author_stated_limitations: comparison.authorStatedLimitations,
        p_ai_inferred_limitations: comparison.aiInferredLimitations,
        p_potential_research_gaps: comparison.crossLiteratureResearchGaps,
        p_evidence_references: {
          sharedObjectives: comparison.sharedObjectivesAndProblems,
          candidateHypotheses: comparison.candidateResearchHypotheses,
          suggestedExperiments: comparison.suggestedValidationExperiments,
          paperA: comparison.paperA,
          paperB: comparison.paperB
        },
        p_sections_analyzed: ['Full-Text Comparative Synthesis'],
        p_chunks_used: ((comparison.paperA as any)?.chunksUsed || 0) + ((comparison.paperB as any)?.chunksUsed || 0),
        p_analysis_output: comparison,
        p_user_id: userId || null,
        p_visibility: visibility || 'public'
      });

      if (rpcErr) {
        console.warn('[EvidenceAnalysisService] insert_server_verified_analysis comparative rpc warning:', rpcErr);
      }
      return insertedId;
    } catch (dbErr) {
      console.warn('[EvidenceAnalysisService] Comparative database persistence warning:', dbErr);
      return null;
    }
  }
}

export const evidenceAnalysisService = new EvidenceAnalysisService();
