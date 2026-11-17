# Anvīkṣā — Stage 4: Research Gap Discovery & Validation Engine
## Comprehensive System Architecture & Engineering Blueprint

**Document Version:** 4.1.0-REVISED  
**Status:** Architecture Design & Blueprint (Implementation Prohibited in this Phase)  
**Author:** Principal AI Systems Architect & Supabase PostgreSQL Engineer  
**Target Milestone:** Stage 4 — Research Gap Discovery & Validation Engine  

---

## 1. Executive Summary & Architectural Mission

Anvīkṣā is designed as an evidence-grounded research acceleration and collaboration ecosystem. Its fundamental reason for existence is to solve the reproducibility, fragmentation, and exploratory inefficiencies in contemporary scientific literature. Rather than generating ungrounded speculative ideas, Anvīkṣā anchors the entire scientific lifecycle in traceable, verifiable empirical evidence:

```
[Research Paper] ──► [Evidence Extraction] ──► [Research Gap Discovery] ──► [Cross-Literature Validation]
       ▲                                                                               │
       │                                                                               ▼
[Research Outcome] ◄── [Peer Review] ◄── [Experiment Trial] ◄── [Contribution] ◄── [Challenge]
```

Stage 3 successfully delivered:
- Verified OpenAlex integration for discovery of scholarly literature.
- Resilient source-aware open-access full-text PDF retrieval, HTML extraction, and IMRAD chunking.
- Live evidence-grounded scientific inference utilizing Gemma 4 MoE (`gemma-4-26b-a4b-it`) with automatic congestion fallback to `gemma-4-31b-it` and baseline rescue to `gemini-3-flash-preview`.
- Strict epistemic separation between author-conceded limitations and AI-inferred limitations.
- Quantitative finding verification (benchmark, baseline, hardware, experimental conditions, source locators).
- Cryptographic provenance protection in Supabase PostgreSQL via `SECURITY DEFINER` service-role RPC `insert_server_verified_analysis` and trigger `protect_paper_analyses_provenance`.

**The Stage 4 Mission:**
To elevate Anvīkṣā from individual and pairwise paper analysis into a continuous, multi-paper **Research Gap Discovery & Validation Engine**. Stage 4 discovers candidate gaps across multiple publications, identifies supporting and contradictory empirical findings, cross-examines independent literature to verify if a gap is genuinely unresolved, partially addressed, contradicted, or resolved by subsequent publications, ranks research opportunities across 6 explainable scientific dimensions, and synthesizes falsifiable research hypotheses and actionable experiment protocols.

---

## 2. Redesigned Expandable Literature Corpus Discovery

To prevent claiming global novelty from small or incomplete paper sets, Stage 4 redesigns literature discovery:

- **Batch Limit vs. Discovery Process:** The 12-paper limit is retained strictly as an individual execution or batch processing ceiling for GPU inference, **not** as the boundary of the literature discovery process.
- **Multi-Vector Corpus Expansion:**
  ```mermaid
  flowchart LR
      Seed[Seed Topic / DOI] --> Query[OpenAlex Keyword & Concept Filter]
      Query --> Forward[Forward Citation Discovery]
      Query --> Backward[Backward Reference Parsing]
      Query --> Related[Related-Work Concept Expansion]
      Forward & Backward & Related --> Dedup[DOI / OpenAlex Deduplication]
      Dedup --> Counter[Targeted Counter-Evidence Retrieval]
      Counter --> Batcher[Batch Execution Engine: 5-12 papers/batch]
  ```
- **Targeted Counter-Evidence Retrieval:** The engine explicitly searches for papers citing the seed paper alongside contradiction / resolution keywords (*"solves"*, *"overcomes"*, *"in contrast to"*, *"refutes"*).
- **Explicit Literature Coverage Boundaries:** Every gap and validation run records explicit coverage metadata:
  - `coverage_date`: Timestamp of the literature search.
  - `corpus_scope`: Number of papers searched, indexed, and analyzed.
  - `boundary_status`: Explicitly labeled as:
    - `UNRESOLVED_WITHIN_ANALYZED_CORPUS` (when corpus is bounded),
    - `INSUFFICIENT_LITERATURE_COVERAGE` (when $< 2$ independent papers exist),
    - `POTENTIALLY_UNRESOLVED_ACROSS_BROADER_LITERATURE`,
    - `VALIDATED_ACROSS_SEARCHED_LITERATURE`.

---

## 3. High-Level Engine Architecture & Dataflow

The Stage 4 Engine operates through a multi-tiered pipeline combining deterministic database queries, temporal filtering, and structured Gemma 4 inference.

```mermaid
flowchart TD
    subgraph INGESTION ["1. Literature Discovery & Evidence Harvesting"]
        OA[OpenAlex API] -->|Search & Graph Expansion| FTS[Full-Text Service]
        FTS -->|SSRF Validation| PDF[Publisher PDF / HTML]
        PDF -->|Chunking & Sectioning| CHUNKS[IMRAD Chunks, Offsets & Hashes]
    end

    subgraph GRAPH ["2. Relational Literature Knowledge Graph (PostgreSQL)"]
        CHUNKS --> PAPERS[(public.research_papers)]
        CHUNKS --> EVIDENCE[(public.research_gap_evidence)]
        PAPERS --- RELS[(public.research_relationships)]
    end

    subgraph GAP_ENGINE ["3. Gap Discovery & Extraction Engine"]
        CHUNKS --> EXTRACTOR[12-Category Gap Extractor<br/>Gemma 4 MoE (26b-a4b-it)]
        EXTRACTOR --> VERIFIER[Exact Substring & Offset Verifier]
        VERIFIER --> GAPS[(public.research_gaps)]
    end

    subgraph VALIDATION ["4. Cross-Literature Validation & Contradiction Engine"]
        GAPS --> VALIDATOR[Cross-Literature Validator]
        PAPERS -->|Temporal Index & Citations| VALIDATOR
        VALIDATOR -->|5 Outcomes: CONFIRMED, PARTIAL, ADDRESSED, CONTRA, INSUFF| AUDIT[(public.research_gap_audit_log)]
    end

    subgraph RANKING ["5. Multi-Factor Opportunity Scoring"]
        GAPS --> RANKER[6-Dimension Opportunity Scorer]
        RANKER -->|Confidence, Novelty, Significance, Feasibility, Tractability, Priority| OPPS[Ranked Research Opportunities]
    end

    subgraph SYNTHESIS ["6. Hypothesis & Experiment Protocol Generator"]
        OPPS --> HYP_GEN[Falsifiable Hypothesis Generator]
        HYP_GEN --> EXP_GEN[Experiment Protocol Synthesizer]
        HYP_GEN --> HYP_DB[(public.research_hypotheses)]
        EXP_GEN --> EXP_DB[(public.research_experiments)]
    end

    subgraph WORKBENCH ["7. Research Gap Discovery Workbench"]
        GAPS --> UI[Interactive Evidence Graph & Matrix (Beige/Orange)]
        HYP_DB --> UI
        EXP_DB --> UI
    end
```

---

## 4. Reusability Matrix: Leveraging Stage 3 Foundations

Stage 4 is engineered as an organic superset of Stage 3. It directly reuses, orchestrates, and expands established services without duplicating or replacing functioning infrastructure.

| Stage 3 Component | Location / Module | Role in Stage 3 | Reusability & Expansion in Stage 4 |
| :--- | :--- | :--- | :--- |
| **OpenAlex Service** | `server/openAlexService.ts` | Single query search, DOI resolution, inverted abstract reconstruction | Expanded for multi-vector discovery (forward/backward citations, concept expansion, and counter-evidence queries). |
| **Full-Text Pipeline** | `server/fullTextService.ts` | Multi-source OA retrieval, PDF extraction, IMRAD chunking | Enhanced with byte/character offset calculation and SHA-256 chunk hashing. |
| **SSRF Validator** | `server/ssrfValidator.ts` | IP blocking of loopback, link-local, and private subnets | Unmodified perimeter defense for all external full-text extraction tasks. |
| **AI Model Adapter** | `src/lib/ai/modelAdapter.ts` | Multi-tier Gemma 4 MoE resolution and Gemini fallback | Reused for routing: Gemma 4 MoE (`26b-a4b-it`) for extraction & synthesis, `31b-it` and `gemini-3-flash-preview` for fallback. |
| **Evidence Analysis Service** | `server/evidenceAnalysisService.ts` | Pairwise comparison, 10-dimension analysis, epistemic labeling | Extended into multi-paper cross-validation and contradiction analysis. |
| **Supabase Admin Client** | `src/lib/supabase.ts` | Secure service-role client for trusted backend persistence | Reused to execute Stage 4 server-verified gap insertions and relationship graph writes. |
| **PostgreSQL Provenance Trigger** | `protect_paper_analyses_provenance()` | Prevents client forging of `verified_by_server` & `model_used` | Extended pattern implemented as `protect_research_gaps_provenance()`. |
| **Beige/Orange Theme UI** | `src/views/`, `src/index.css` | Warm academic theme (`#FAEDCD`, `#CCD5AE`, `#8B5E34`) | Reused for Workbench, Gap Matrix, and Evidence Drawers. |
