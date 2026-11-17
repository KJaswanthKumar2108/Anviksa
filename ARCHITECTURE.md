# Anvīkṣā — System Architecture Specification

**Project:** Anvīkṣā — AI-Powered Open Science & Research Collaboration Platform  
**Architecture Version:** 4.1.0-REVISED  
**Status:** Approved Architecture Blueprint  

---

## 1. System Vision & Core Scientific Lifecycle

Anvīkṣā connects students, independent researchers, PhD scholars, scientists, research institutions, and organizations through an evidence-driven scientific discovery ecosystem.

Its defining lifecycle forms an unbroken, traceable lineage:
$$\text{Research Paper} \longrightarrow \text{Research Gap} \longrightarrow \text{Challenge} \longrightarrow \text{Contribution Proposal} \longrightarrow \text{Experiment Trial} \longrightarrow \text{Peer Review} \longrightarrow \text{Research Outcome}$$

---

## 2. High-Level Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend Application Server:** Node.js, Express, TypeScript (ESM)
- **Literature Harvesting:** OpenAlex REST API with server-side bearer authentication
- **Document & PDF Pipeline:** `pdf-parse`, HTML extraction, IMRAD chunking, character offset mapping, SHA-256 chunk hashing, and SSRF validation
- **AI & Reasoning Engine:** Google GenAI SDK (`@google/genai`), Gemma 4 MoE (`gemma-4-26b-a4b-it`), Gemma 4 31B (`gemma-4-31b-it`), with resilient Gemini fallback (`gemini-3-flash-preview`)
- **Database & Identity:** Supabase PostgreSQL 17, Supabase Auth, Row Level Security (RLS)
- **Storage:** Supabase Storage (`research_files`) with private RLS access controls

---

## 3. Subsystem Architecture

### 3.1 Stage 1 & 2: Literature Discovery & Open-Access Full-Text Retrieval
- **OpenAlex Integration (`server/openAlexService.ts`):** Live keyword and semantic search, DOI normalization, inverted index abstract reconstruction, candidate location parsing, and multi-vector graph expansion (forward citations, backward references, and counter-evidence queries).
- **Source-Aware Retrieval Pipeline (`server/fullTextService.ts`):** Discovers accessible PDFs via OpenAlex `best_oa_location`, institutional repositories (arXiv, PubMed Central), and publisher landing pages.
- **SSRF Perimeter Defense (`server/ssrfValidator.ts`):** Validates all target hostnames and resolved IP addresses against private, loopback, link-local, and cloud metadata addresses (`169.254.169.254`) prior to dispatch.
- **IMRAD Chunking & Provenance:** Breaks full-text documents into structured chunks with exact page/section citations, character start/end offsets, and SHA-256 content checksums.

### 3.2 Stage 3: Evidence-Grounded AI Analysis & Comparative Synthesis
- **Model Adapter (`src/lib/ai/modelAdapter.ts`):** Dynamic resolution of requested Gemma 4 identifiers with automated provider congestion recovery (`gemma-4-31b-it` $\to$ `gemma-4-26b-a4b-it`) and baseline rescue (`gemini-3-flash-preview`). Truthful attribution is strictly preserved across API, UI, and database records.
- **Evidence Analysis Service (`server/evidenceAnalysisService.ts`):** Executes structured extraction with explicit separation between author-conceded limitations and AI-inferred hypotheses.
- **Cryptographic Provenance Protection:** PostgreSQL `SECURITY DEFINER` RPC `public.insert_server_verified_analysis` enforces `auth.role() = 'service_role'`. Trigger `protect_paper_analyses_provenance()` prevents client tampering with model provenance or verification status.

### 3.3 Stage 4: Research Gap Discovery & Validation Engine
- **Relational Literature Knowledge Graph (LKG):** Directly represented in Supabase PostgreSQL (`public.research_gaps`, `public.research_gap_evidence`, `public.research_gap_validations`, `public.research_gap_audit_log`, `public.research_relationships`).
- **12-Category Gap Extractor:** Evaluates publications across 12 distinct scientific gap dimensions (Methodological, Theoretical, Empirical, Dataset/Benchmark, Evaluation, Scalability, Security, Reproducibility, Generalization, Contradictions, Domain, Deployment).
- **Redesigned Cross-Literature Validation:** Evaluates candidate gaps across multi-paper clusters into 5 explicit outcomes (`CONFIRMED_UNRESOLVED`, `PARTIALLY_ADDRESSED`, `ADDRESSED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`). Chronology alone never establishes that a gap is resolved.
- **Epistemic Versioning & Audit Trail:** Current classification is updateable when new evidence emerges, while historical assessments are preserved immutably in `public.research_gap_audit_log`.
- **Explainable Multi-Factor Opportunity Scoring:** Distinguishes 6 independent scientific dimensions: Evidence Confidence ($S_c$), Novelty ($S_n$), Significance ($S_s$), Feasibility ($S_f$), Tractability ($S_t$), and Overall Priority ($S_p$). Scores never upgrade epistemic status.
- **Falsifiable Hypothesis & Experiment Synthesizer:** Formulates testable hypotheses with explicit independent, dependent, and control variables, paired with reproducible experiment protocols and failure thresholds.
- **Security & RLS Isolation:** Academic documents treated as untrusted inputs with token neutralization and zero tool access; private candidate gaps protected from public discovery via Supabase RLS.

---
