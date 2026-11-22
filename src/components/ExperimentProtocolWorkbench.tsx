import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
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
  Cpu,
  Database,
  BarChart2,
  Box,
  FileCode,
  Sliders,
  Check,
  AlertCircle,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export type ExperimentalDesignType = 
  | 'RANDOMIZED_CONTROLLED_TRIAL'
  | 'PAIRED_COMPARATIVE_BENCHMARK'
  | 'SYSTEMATIC_COMPONENT_ABLATION'
  | 'SCALING_AND_COMPLEXITY_ANALYSIS'
  | 'STOCHASTIC_SIMULATION'
  | 'FORMAL_PROOF_AND_COUNTER_EXAMPLE'
  | 'DATASET_BIAS_AND_DISTRIBUTION_AUDIT'
  | 'ADVERSARIAL_ROBUSTNESS_STRESS_TEST'
  | 'EMPIRICAL_REPLICATION_STUDY'
  | 'QUALITATIVE_SYSTEMS_ARCHITECTURE'
  | 'PARAMETER_EFFICIENCY_ADAPTATION';

export interface VerifiedBaseline {
  baseline_name: string;
  source_paper_id?: string;
  doi: string | null;
  citation_title: string;
  is_reported_in_paper: boolean;
  reported_metric_value: string | null;
  hardware_platform_used: string;
  comparability_mismatch_warning?: string;
  codebase_license: string;
  pinned_commit_or_release: string;
}

export interface DatasetOrMaterial {
  name: string;
  source_url_or_identifier: string;
  data_split: string;
  license: string;
  checksum_sha256: string;
  size_or_sample_count: string;
}

export interface ExecutionEnvironment {
  compute_architecture: string;
  minimum_gpu_count: number;
  minimum_vram_gb: number;
  software_framework_and_version: string;
  estimated_wall_clock_hours: number;
  thermal_throttling_controls: string;
}

export interface PowerAndSampleSizePlan {
  statistical_test: string;
  significance_level_alpha: number;
  target_power_one_minus_beta: number;
  expected_effect_size_cohens_d: number;
  recommended_sample_size_per_group: number;
  total_sample_size: number;
  multiple_comparison_correction: string;
  adjusted_alpha: number;
  power_formula_used: string;
  justification: string;
}

export interface AblationCondition {
  condition_name: string;
  isolated_factor: string;
  expected_delta_impact: string;
  degradation_threshold: string;
}

export interface ExperimentMetric {
  id?: string;
  metric_name: string;
  metric_type: string;
  operational_definition: string;
  measurement_unit: string;
  measurement_instrument: string;
  direction_of_improvement: string;
  target_value?: string;
  falsification_threshold: string;
  is_uncalibrated: boolean;
  baseline_reference_value?: string;
}

export interface FourQuadrantThreats {
  internal_validity: { threats: string[]; mitigations: string[] };
  external_validity: { threats: string[]; mitigations: string[] };
  construct_validity: { threats: string[]; mitigations: string[] };
  conclusion_validity: { threats: string[]; mitigations: string[] };
}

export interface ReproducibilityPackage {
  dockerfile_spec: string;
  deterministic_seed_schedule: number[];
  hardware_pinning_spec: string;
  repository_structure_summary: string;
}

export interface ExperimentProtocol {
  id: string;
  hypothesis_id: string;
  opportunity_id: string;
  gap_id: string;
  validation_run_id: string;
  hypothesis_version: number;
  current_version: number;
  title: string;
  objective: string;
  experimental_design_type: ExperimentalDesignType;
  paradigm_specific_config: Record<string, any>;
  verified_baselines: VerifiedBaseline[];
  datasets_and_materials: DatasetOrMaterial[];
  execution_environment: ExecutionEnvironment;
  statistical_analysis_plan: PowerAndSampleSizePlan;
  ablation_matrix: AblationCondition[];
  falsification_criteria: string[];
  threats_to_validity: FourQuadrantThreats;
  reproducibility_package: ReproducibilityPackage;
  metrics: ExperimentMetric[];
  status: string;
  is_stale: boolean;
  staleness_reason?: string;
  generation_provenance: Record<string, any>;
  protocol_audit_findings: string[];
  created_at: string;
  updated_at: string;
}

export const PARADIGM_DEFINITIONS: Record<ExperimentalDesignType, { label: string; description: string }> = {
  RANDOMIZED_CONTROLLED_TRIAL: {
    label: 'Randomized Controlled Trial (RCT)',
    description: 'Empirical causal trials with randomized cohort schedules and double-blind controls'
  },
  PAIRED_COMPARATIVE_BENCHMARK: {
    label: 'Paired Comparative Benchmark',
    description: 'Direct within-instance paired comparisons against verified state-of-the-art literature baselines'
  },
  SYSTEMATIC_COMPONENT_ABLATION: {
    label: 'Systematic Component Ablation',
    description: 'Full-factorial module knockouts to establish causal necessity of individual components'
  },
  SCALING_AND_COMPLEXITY_ANALYSIS: {
    label: 'Scaling & Complexity Analysis',
    description: 'Asymptotic empirical scaling laws (O(N) memory/runtime curves over expanding horizons)'
  },
  STOCHASTIC_SIMULATION: {
    label: 'Stochastic Simulation',
    description: 'Monte Carlo multi-seed agent simulations measuring distributional divergence (Wasserstein W1)'
  },
  FORMAL_PROOF_AND_COUNTER_EXAMPLE: {
    label: 'Formal Proof & Counter-Example',
    description: 'Axiomatic verification in Lean 4 with automated SMT counter-example search'
  },
  DATASET_BIAS_AND_DISTRIBUTION_AUDIT: {
    label: 'Dataset Bias & Distribution Audit',
    description: 'Intersectional fairness audits across demographic and domain partitions'
  },
  ADVERSARIAL_ROBUSTNESS_STRESS_TEST: {
    label: 'Adversarial Robustness Stress-Test',
    description: 'Perturbation susceptibility under bounded white-box and black-box gradient attacks'
  },
  EMPIRICAL_REPLICATION_STUDY: {
    label: 'Empirical Replication Study',
    description: 'Rigorous reproduction of published schedules in pinned containerized environments'
  },
  QUALITATIVE_SYSTEMS_ARCHITECTURE: {
    label: 'Qualitative Systems Architecture',
    description: 'Chaos fault-injection trials measuring recovery time objectives (RTO) and tail latencies'
  },
  PARAMETER_EFFICIENCY_ADAPTATION: {
    label: 'Parameter-Efficiency Adaptation',
    description: 'Quantized low-rank fine-tuning measuring accuracy retention versus trainable parameter bounds'
  }
};

export const ExperimentProtocolWorkbench: React.FC = () => {
  const [protocols, setProtocols] = useState<ExperimentProtocol[]>([]);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<ExperimentProtocol | null>(null);
  const [selectedParadigm, setSelectedParadigm] = useState<ExperimentalDesignType>('PAIRED_COMPARATIVE_BENCHMARK');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'baselines' | 'power' | 'metrics' | 'validity' | 'versions'>('overview');

  // Revision state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionRationale, setRevisionRationale] = useState('');
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedObjective, setRevisedObjective] = useState('');
  const [revising, setRevising] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Hypotheses for selector
      const { data: hypData } = await supabase
        .from('research_hypotheses')
        .select('id, hypothesis_statement, research_question, paradigm_type, status, is_stale')
        .order('created_at', { ascending: false });

      if (hypData && hypData.length > 0) {
        setHypotheses(hypData);
        setSelectedHypothesisId(hypData[0].id);
        fetchProtocolsForHypothesis(hypData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load initial hypotheses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProtocolsForHypothesis = async (hypothesisId: string) => {
    try {
      const res = await fetch(`/api/research/experiments/hypothesis/${hypothesisId}`);
      const data = await res.json();
      if (data.success) {
        setProtocols(data.protocols || []);
        if (data.protocols && data.protocols.length > 0) {
          setSelectedProtocol(data.protocols[0]);
          loadVersionHistory(data.protocols[0].id);
        } else {
          setSelectedProtocol(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch protocols:', err);
    }
  };

  const loadVersionHistory = async (protocolId: string) => {
    try {
      const res = await fetch(`/api/research/experiments/${protocolId}/versions`);
      const data = await res.json();
      if (data.success) {
        setVersionHistory(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    }
  };

  const handleSynthesizeProtocol = async () => {
    if (!selectedHypothesisId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/research/experiments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: selectedHypothesisId,
          preferredDesignType: selectedParadigm
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Protocol synthesis failed.');
      }

      setProtocols(prev => [data.protocol, ...prev]);
      setSelectedProtocol(data.protocol);
      loadVersionHistory(data.protocol.id);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize experiment protocol.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenRevisionModal = () => {
    if (!selectedProtocol) return;
    setRevisedTitle(selectedProtocol.title);
    setRevisedObjective(selectedProtocol.objective);
    setRevisionRationale('');
    setIsRevisionModalOpen(true);
  };

  const handleSaveRevision = async () => {
    if (!selectedProtocol || !revisionRationale.trim()) return;
    setRevising(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be signed in to submit a researcher revision.');
      }

      const res = await fetch(`/api/research/experiments/${selectedProtocol.id}/revise`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          revisionPayload: {
            title: revisedTitle,
            objective: revisedObjective,
            status: 'RESEARCHER_APPROVED'
          },
          modificationRationale: revisionRationale
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Revision submission failed.');
      }

      setSelectedProtocol(data.protocol);
      setProtocols(prev => prev.map(p => p.id === data.protocol.id ? data.protocol : p));
      setIsRevisionModalOpen(false);
      loadVersionHistory(data.protocol.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit revision.');
    } finally {
      setRevising(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAEDCD]/20 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-[#FEFAE0] border-b border-[#DCD5BC] px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#287A50]" />
            <h1 className="text-lg font-bold text-[#342F27]">Stage 4E: Experiment Protocol Synthesizer</h1>
            <span className="text-xs bg-[#CCD5AE]/60 text-[#342F27] px-2 py-0.5 rounded-full font-semibold border border-[#DCD5BC]">
              4E-IMP-03
            </span>
          </div>
          <p className="text-xs text-[#342F27]/70 mt-1">
            Transforms accepted falsifiable hypotheses into scientifically defensible, reproducible experimental protocols across 11 paradigms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="p-2 text-xs border border-[#DCD5BC] rounded-md bg-[#FEFAE0] hover:bg-[#E9EDC9] transition text-[#342F27] flex items-center gap-1.5"
            title="Refresh Protocols"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 font-bold">&times;</button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-6 grid grid-cols-12 gap-6 flex-1">
        {/* Left Sidebar: Hypothesis Selector & Protocol Synthesis Controls */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          {/* Target Hypothesis Card */}
          <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#342F27]/70 mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#287A50]" />
              Select Target Hypothesis
            </h2>

            <select
              value={selectedHypothesisId}
              onChange={(e) => {
                setSelectedHypothesisId(e.target.value);
                fetchProtocolsForHypothesis(e.target.value);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-[#DCD5BC] bg-white text-[#342F27] mb-3 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
            >
              {hypotheses.map(h => (
                <option key={h.id} value={h.id}>
                  {h.hypothesis_statement.substring(0, 75)}... ({h.paradigm_type})
                </option>
              ))}
            </select>

            {/* Synthesis Configuration */}
            <div className="border-t border-[#DCD5BC] pt-3 mt-2">
              <label className="text-xs font-semibold text-[#342F27] block mb-1.5">
                Experimental Paradigm (1 of 11):
              </label>
              <select
                value={selectedParadigm}
                onChange={(e) => setSelectedParadigm(e.target.value as ExperimentalDesignType)}
                className="w-full text-xs p-2 rounded-lg border border-[#DCD5BC] bg-white text-[#342F27] mb-2 focus:outline-none focus:ring-1 focus:ring-[#287A50]"
              >
                {Object.entries(PARADIGM_DEFINITIONS).map(([key, def]) => (
                  <option key={key} value={key}>
                    {def.label}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-[#342F27]/70 italic mb-4 bg-[#E9EDC9]/30 p-2 rounded border border-[#DCD5BC]/60">
                {PARADIGM_DEFINITIONS[selectedParadigm].description}
              </p>

              <button
                onClick={handleSynthesizeProtocol}
                disabled={generating || !selectedHypothesisId}
                className="w-full py-2.5 px-4 rounded-lg bg-[#287A50] hover:bg-[#1E5D3C] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Synthesizing Protocol...' : 'Synthesize Experiment Protocol'}
              </button>
            </div>
          </div>

          {/* Existing Protocols List */}
          <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl p-4 shadow-sm flex-1 flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#342F27]/70 mb-3 flex items-center justify-between">
              <span>Synthesized Protocols ({protocols.length})</span>
            </h2>

            {protocols.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#342F27]/50 italic">
                No protocols generated yet for this hypothesis. Click synthesize above.
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px]">
                {protocols.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProtocol(p);
                      loadVersionHistory(p.id);
                    }}
                    className={`text-left p-3 rounded-lg border transition flex flex-col gap-1 ${
                      selectedProtocol?.id === p.id
                        ? 'border-[#287A50] bg-[#E9EDC9]/60 shadow-sm'
                        : 'border-[#DCD5BC] bg-white hover:bg-[#E9EDC9]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#CCD5AE]/60 text-[#342F27] border border-[#DCD5BC]">
                        {p.experimental_design_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#342F27]/60">v{p.current_version}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#342F27] line-clamp-2">
                      {p.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        p.status === 'RESEARCHER_APPROVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                      {p.is_stale && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                          STALE
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Panel: Protocol Inspection & Workbench */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {selectedProtocol ? (
            <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl p-5 shadow-sm flex flex-col flex-1">
              {/* Protocol Header */}
              <div className="border-b border-[#DCD5BC] pb-4 mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#287A50] text-white">
                        {selectedProtocol.experimental_design_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#CCD5AE]/60 text-[#342F27] border border-[#DCD5BC]">
                        Version {selectedProtocol.current_version}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        selectedProtocol.status === 'RESEARCHER_APPROVED'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {selectedProtocol.status}
                      </span>
                      {selectedProtocol.is_stale && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          STALE: {selectedProtocol.staleness_reason || 'UPSTREAM_CHANGE'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#342F27]">{selectedProtocol.title}</h2>
                    <p className="text-xs text-[#342F27]/80 mt-1">{selectedProtocol.objective}</p>
                  </div>

                  <button
                    onClick={handleOpenRevisionModal}
                    className="py-1.5 px-3 rounded-lg border border-[#287A50] text-[#287A50] hover:bg-[#287A50] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Review & Revise
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex gap-2 mt-4 pt-2 border-t border-[#DCD5BC]/60 overflow-x-auto text-xs font-semibold">
                  {[
                    { id: 'overview', label: 'Paradigm & Env', icon: Cpu },
                    { id: 'baselines', label: 'Verified Baselines (BAR)', icon: ShieldCheck },
                    { id: 'power', label: 'Statistical Power Plan', icon: BarChart2 },
                    { id: 'metrics', label: 'Metrics & Thresholds', icon: Sliders },
                    { id: 'validity', label: '4-Quadrant Validity', icon: AlertTriangle },
                    { id: 'versions', label: `Version History (${versionHistory.length})`, icon: GitBranch }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-[#287A50] text-white shadow-xs'
                            : 'bg-white/80 hover:bg-[#E9EDC9] text-[#342F27] border border-[#DCD5BC]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab 1: Overview & Execution Environment */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-4 text-xs">
                  {/* Paradigm Config */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#287A50]" />
                      Paradigm Specific Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedProtocol.paradigm_specific_config || {}).map(([key, val]) => (
                        <div key={key} className="p-2 bg-[#FAEDCD]/20 rounded border border-[#DCD5BC]/40">
                          <span className="font-semibold text-[#342F27]/70 block capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-mono text-[#342F27] text-[11px]">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Environment */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#287A50]" />
                      Hardware Architecture & Execution Environment
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-[#FAEDCD]/20 rounded border border-[#DCD5BC]/40">
                        <span className="text-[10px] text-[#342F27]/60 block">Compute Architecture</span>
                        <span className="font-semibold text-[#342F27]">
                          {selectedProtocol.execution_environment?.compute_architecture || 'Standard x86_64'}
                        </span>
                      </div>
                      <div className="p-2 bg-[#FAEDCD]/20 rounded border border-[#DCD5BC]/40">
                        <span className="text-[10px] text-[#342F27]/60 block">GPU VRAM Requirement</span>
                        <span className="font-semibold text-[#342F27]">
                          {selectedProtocol.execution_environment?.minimum_vram_gb} GB ({selectedProtocol.execution_environment?.minimum_gpu_count} GPU)
                        </span>
                      </div>
                      <div className="p-2 bg-[#FAEDCD]/20 rounded border border-[#DCD5BC]/40">
                        <span className="text-[10px] text-[#342F27]/60 block">Est. Wall-Clock Hours</span>
                        <span className="font-semibold text-[#342F27]">
                          {selectedProtocol.execution_environment?.estimated_wall_clock_hours} hrs
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#342F27]/70 bg-[#E9EDC9]/30 p-2 rounded">
                      <span className="font-semibold">Framework:</span> {selectedProtocol.execution_environment?.software_framework_and_version} | <span className="font-semibold">Thermal Control:</span> {selectedProtocol.execution_environment?.thermal_throttling_controls}
                    </div>
                  </div>

                  {/* Datasets & Materials */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#287A50]" />
                      Datasets & Material Partitions
                    </h3>
                    <div className="flex flex-col gap-2">
                      {selectedProtocol.datasets_and_materials?.map((d, i) => (
                        <div key={i} className="p-2.5 rounded border border-[#DCD5BC]/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#342F27] block">{d.name}</span>
                            <span className="text-[11px] text-[#342F27]/60 font-mono">
                              Split: {d.data_split} | License: {d.license} | Size: {d.size_or_sample_count}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border">
                            SHA-256: {d.checksum_sha256?.substring(0, 10)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Verified Baselines (BAR = 100%) */}
              {activeTab === 'baselines' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>Zero-Fabricated-Baselines Invariant ($BAR = 100\%$):</strong> All referenced baseline comparisons originate from verified literature records. Unreported values must be measured empirically during trial execution.
                    </span>
                  </div>

                  {selectedProtocol.verified_baselines?.map((b, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-[#342F27]">{b.baseline_name}</h4>
                          <span className="text-[11px] text-[#342F27]/70 italic block">
                            {b.citation_title} {b.doi ? `(DOI: ${b.doi})` : ''}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          b.is_reported_in_paper
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {b.is_reported_in_paper ? 'REPORTED IN PAPER' : 'UNREPORTED — EMPIRICAL MEASUREMENT REQUIRED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-[#FAEDCD]/20 p-2.5 rounded border border-[#DCD5BC]/40">
                        <div>
                          <span className="font-semibold text-[#342F27]/70 block">Reported Metric Value:</span>
                          <span className="font-mono text-[#342F27]">{b.reported_metric_value || 'None'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#342F27]/70 block">Hardware Architecture Used:</span>
                          <span>{b.hardware_platform_used}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#342F27]/70 block">Codebase License:</span>
                          <span>{b.codebase_license}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#342F27]/70 block">Pinned Commit / Release:</span>
                          <span className="font-mono">{b.pinned_commit_or_release}</span>
                        </div>
                      </div>

                      {b.comparability_mismatch_warning && (
                        <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                          {b.comparability_mismatch_warning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Statistical Power Plan */}
              {activeTab === 'power' && (
                <div className="flex flex-col gap-4 text-xs">
                  <div className="bg-white p-4 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-[#287A50]" />
                      Analytical Two-Tailed Power & Sample Size Determination
                    </h3>
                    <p className="text-[11px] text-[#342F27]/70 mb-3">
                      {selectedProtocol.statistical_analysis_plan?.justification}
                    </p>

                    <div className="grid grid-cols-4 gap-3 text-center mb-3">
                      <div className="p-3 bg-[#E9EDC9]/40 rounded-lg border border-[#DCD5BC]">
                        <span className="text-[10px] text-[#342F27]/60 block uppercase font-bold">Significance (alpha)</span>
                        <span className="text-base font-bold text-[#342F27]">
                          {selectedProtocol.statistical_analysis_plan?.significance_level_alpha}
                        </span>
                      </div>
                      <div className="p-3 bg-[#E9EDC9]/40 rounded-lg border border-[#DCD5BC]">
                        <span className="text-[10px] text-[#342F27]/60 block uppercase font-bold">Target Power (1 - beta)</span>
                        <span className="text-base font-bold text-[#287A50]">
                          {(selectedProtocol.statistical_analysis_plan?.target_power_one_minus_beta * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-3 bg-[#E9EDC9]/40 rounded-lg border border-[#DCD5BC]">
                        <span className="text-[10px] text-[#342F27]/60 block uppercase font-bold">Effect Size (Cohen d)</span>
                        <span className="text-base font-bold text-[#342F27]">
                          {selectedProtocol.statistical_analysis_plan?.expected_effect_size_cohens_d}
                        </span>
                      </div>
                      <div className="p-3 bg-[#287A50]/10 rounded-lg border border-[#287A50]/30">
                        <span className="text-[10px] text-[#287A50] block uppercase font-bold">Total Sample Size N</span>
                        <span className="text-base font-bold text-[#287A50]">
                          {selectedProtocol.statistical_analysis_plan?.total_sample_size}
                        </span>
                        <span className="text-[10px] text-[#342F27]/50 block">
                          ({selectedProtocol.statistical_analysis_plan?.recommended_sample_size_per_group} per arm)
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono bg-gray-50 p-2.5 rounded border border-gray-200">
                      Formula: {selectedProtocol.statistical_analysis_plan?.power_formula_used} | Multiple Testing Correction: {selectedProtocol.statistical_analysis_plan?.multiple_comparison_correction}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Evaluation Metrics & Falsification */}
              {activeTab === 'metrics' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2">Structured Evaluation Metrics</h3>
                    <div className="flex flex-col gap-2">
                      {selectedProtocol.metrics?.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border border-[#DCD5BC]/60 bg-[#FAEDCD]/10">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#342F27]">{m.metric_name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#CCD5AE]/60 text-[#342F27] font-semibold">
                                  {m.metric_type}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#342F27]/70 mt-0.5">{m.operational_definition}</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#287A50] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Unit: {m.measurement_unit}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#DCD5BC]/40 text-[11px]">
                            <div>
                              <span className="font-semibold text-[#342F27]/70">Target Value:</span>{' '}
                              <span className="font-mono text-[#342F27]">{m.target_value || 'None specified'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-red-700">Critical Falsification Boundary:</span>{' '}
                              <span className="font-mono text-red-700 font-semibold">{m.falsification_threshold}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ablation Matrix */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h3 className="font-bold text-[#342F27] mb-2 flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-[#287A50]" />
                      Systematic Factorial Ablation Matrix
                    </h3>
                    <div className="flex flex-col gap-2">
                      {selectedProtocol.ablation_matrix?.map((a, i) => (
                        <div key={i} className="p-2.5 rounded border border-[#DCD5BC]/60 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-[#342F27] block">{a.condition_name}</span>
                            <span className="text-[#342F27]/60">Isolated Factor: {a.isolated_factor}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#287A50] font-semibold block">{a.expected_delta_impact}</span>
                            <span className="text-[10px] text-red-600 font-mono">Threshold: {a.degradation_threshold}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Four-Quadrant Validity Audit */}
              {activeTab === 'validity' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Internal Validity */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h4 className="font-bold text-[#342F27] flex items-center gap-1.5 mb-2 text-indigo-900">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      Internal Validity (Causal Isolation)
                    </h4>
                    <span className="text-[10px] text-[#342F27]/60 uppercase font-bold block mb-1">Threats</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#342F27]/80 mb-2">
                      {selectedProtocol.threats_to_validity?.internal_validity?.threats?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Mitigations</span>
                    <ul className="list-disc pl-4 text-[11px] text-emerald-900">
                      {selectedProtocol.threats_to_validity?.internal_validity?.mitigations?.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* External Validity */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h4 className="font-bold text-[#342F27] flex items-center gap-1.5 mb-2 text-blue-900">
                      <Globe className="w-4 h-4 text-blue-700" />
                      External Validity (Generalizability)
                    </h4>
                    <span className="text-[10px] text-[#342F27]/60 uppercase font-bold block mb-1">Threats</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#342F27]/80 mb-2">
                      {selectedProtocol.threats_to_validity?.external_validity?.threats?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Mitigations</span>
                    <ul className="list-disc pl-4 text-[11px] text-emerald-900">
                      {selectedProtocol.threats_to_validity?.external_validity?.mitigations?.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Construct Validity */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h4 className="font-bold text-[#342F27] flex items-center gap-1.5 mb-2 text-purple-900">
                      <Scale className="w-4 h-4 text-purple-700" />
                      Construct Validity (Metric Alignment)
                    </h4>
                    <span className="text-[10px] text-[#342F27]/60 uppercase font-bold block mb-1">Threats</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#342F27]/80 mb-2">
                      {selectedProtocol.threats_to_validity?.construct_validity?.threats?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Mitigations</span>
                    <ul className="list-disc pl-4 text-[11px] text-emerald-900">
                      {selectedProtocol.threats_to_validity?.construct_validity?.mitigations?.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Conclusion Validity */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#DCD5BC]">
                    <h4 className="font-bold text-[#342F27] flex items-center gap-1.5 mb-2 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      Conclusion Validity (Statistical Rigor)
                    </h4>
                    <span className="text-[10px] text-[#342F27]/60 uppercase font-bold block mb-1">Threats</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#342F27]/80 mb-2">
                      {selectedProtocol.threats_to_validity?.conclusion_validity?.threats?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">Mitigations</span>
                    <ul className="list-disc pl-4 text-[11px] text-emerald-900">
                      {selectedProtocol.threats_to_validity?.conclusion_validity?.mitigations?.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 6: Immutable Version History */}
              {activeTab === 'versions' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                    <span className="font-bold">Immutable Protocol Audit Ledger:</span> Every human revision creates a permanent version snapshot. Modifying or deleting prior versions is prohibited by database triggers.
                  </div>

                  {versionHistory.map((v, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-lg border border-[#DCD5BC] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#342F27]">Version {v.version_number}</span>
                        <span className="text-[11px] text-[#342F27]/60 font-mono">
                          {new Date(v.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] bg-[#FAEDCD]/20 p-2 rounded border border-[#DCD5BC]/40">
                        <span className="font-semibold text-[#342F27]/70">Rationale:</span> {v.modification_rationale}
                      </div>
                      <span className="text-[10px] text-[#342F27]/50 font-mono">
                        Modified By: {v.modified_by || 'System Ingestion'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl p-12 text-center text-xs text-[#342F27]/60 italic flex-1 flex flex-col items-center justify-center">
              <FlaskConical className="w-8 h-8 text-[#287A50]/40 mb-2" />
              <span>Select or synthesize an experiment protocol to view design specifications.</span>
            </div>
          )}
        </div>
      </div>

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl max-w-lg w-full p-5 shadow-xl flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#342F27] flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-[#287A50]" />
              Submit Researcher Revision & Approval
            </h3>
            <p className="text-xs text-[#342F27]/70">
              Modifying this protocol creates an immutable version snapshot in the audit log.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#342F27] block mb-1">Protocol Title:</label>
              <input
                type="text"
                value={revisedTitle}
                onChange={(e) => setRevisedTitle(e.target.value)}
                className="w-full text-xs p-2 rounded border border-[#DCD5BC] bg-white text-[#342F27] focus:outline-none focus:ring-1 focus:ring-[#287A50]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#342F27] block mb-1">Protocol Objective:</label>
              <textarea
                rows={3}
                value={revisedObjective}
                onChange={(e) => setRevisedObjective(e.target.value)}
                className="w-full text-xs p-2 rounded border border-[#DCD5BC] bg-white text-[#342F27] focus:outline-none focus:ring-1 focus:ring-[#287A50]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#342F27] block mb-1">
                Modification Rationale (Mandatory for scientific audit):
              </label>
              <textarea
                rows={2}
                value={revisionRationale}
                onChange={(e) => setRevisionRationale(e.target.value)}
                placeholder="Explain the scientific or methodological justification for this update..."
                className="w-full text-xs p-2 rounded border border-[#DCD5BC] bg-white text-[#342F27] focus:outline-none focus:ring-1 focus:ring-[#287A50]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCD5BC]">
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-[#DCD5BC] bg-white hover:bg-gray-50 text-[#342F27]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevision}
                disabled={revising || !revisionRationale.trim()}
                className="px-4 py-1.5 text-xs rounded bg-[#287A50] hover:bg-[#1E5D3C] text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {revising ? 'Saving...' : 'Commit Version & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
