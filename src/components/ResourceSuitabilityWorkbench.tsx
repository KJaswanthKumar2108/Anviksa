import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Compass, 
  HelpCircle,
  FileCheck2,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResearcherResource {
  id: string;
  resourceCategory: string;
  resourceName: string;
  description?: string;
  specifications: Record<string, any>;
  evidenceState: 'VERIFIED_AVAILABLE' | 'DECLARED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN' | 'EXPIRED_EVIDENCE';
  evidenceSource: string;
  verificationSourceRef?: string;
  expiresAt?: string;
  confidenceLevel: string;
}

interface StrategicRecommendation {
  id: string;
  opportunity_id: string;
  experiment_id?: string;
  intrinsic_scientific_value: number;
  execution_suitability: number | null;
  suitability_status: string;
  strategic_quadrant: string;
  suitability_breakdown: any;
  resource_recommendations: any[];
  unmatched_requirements: any[];
  is_stale: boolean;
  created_at: string;
}

export const ResourceSuitabilityWorkbench: React.FC = () => {
  const [resources, setResources] = useState<ResearcherResource[]>([]);
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a resource
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('COMPUTE_HARDWARE');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEvidenceState, setNewEvidenceState] = useState<'VERIFIED_AVAILABLE' | 'DECLARED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN'>('DECLARED_AVAILABLE');
  const [newEvidenceSource, setNewEvidenceSource] = useState('USER_SELF_DECLARATION');
  const [newGpus, setNewGpus] = useState(1);
  const [newVram, setNewVram] = useState(24);
  const [newBudget, setNewBudget] = useState(100);

  // Evaluation selection
  const [selectedOppId, setSelectedOppId] = useState<string>('');
  const [selectedExpId, setSelectedExpId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (!token) {
        setError('Please sign in to access your researcher resource inventory and recommendations.');
        setLoading(false);
        return;
      }

      // Load resources
      const resRes = await fetch('/api/research/resources', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await resRes.json();
      if (resData.success) {
        setResources(resData.resources || []);
      }

      // Load recommendations
      const recRes = await fetch('/api/research/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recData = await recRes.json();
      if (recData.success) {
        setRecommendations(recData.recommendations || []);
      }

      // Load opportunities for evaluation dropdown
      const { data: opps } = await supabase
        .from('research_opportunities')
        .select('id, gap_id, intrinsic_scientific_value, status')
        .eq('status', 'ELIGIBLE')
        .limit(10);
      setOpportunities(opps || []);
      if (opps && opps.length > 0 && !selectedOppId) {
        setSelectedOppId(opps[0].id);
      }

      // Load experiments
      const { data: exps } = await supabase
        .from('research_experiments')
        .select('id, title, experimental_design_type, is_stale')
        .eq('is_stale', false)
        .limit(10);
      setExperiments(exps || []);
      if (exps && exps.length > 0 && !selectedExpId) {
        setSelectedExpId(exps[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const specifications: any = {};
      if (newCategory === 'COMPUTE_HARDWARE') {
        specifications.gpuCount = Number(newGpus);
        specifications.vramGb = Number(newVram);
      } else if (newCategory === 'FINANCIAL_BUDGET') {
        specifications.monthly_budget_usd = Number(newBudget);
      }

      const res = await fetch('/api/research/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceCategory: newCategory,
          resourceName: newName,
          description: newDesc,
          specifications,
          evidenceState: newEvidenceState,
          evidenceSource: newEvidenceSource
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewName('');
        setNewDesc('');
        loadData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEvaluateSuitability = async () => {
    if (!selectedOppId) return;
    try {
      setEvaluating(true);
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/research/suitability/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          opportunityId: selectedOppId,
          experimentId: selectedExpId || undefined,
          persist: true
        })
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const renderBadge = (state: string) => {
    switch (state) {
      case 'VERIFIED_AVAILABLE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</span>;
      case 'DECLARED_AVAILABLE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300"><FileCheck2 className="w-3 h-3 mr-1" /> Self-Declared</span>;
      case 'VERIFIED_UNAVAILABLE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300"><AlertTriangle className="w-3 h-3 mr-1" /> Unavailable</span>;
      case 'EXPIRED_EVIDENCE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300"><RefreshCw className="w-3 h-3 mr-1" /> Expired</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-800 border border-stone-300"><HelpCircle className="w-3 h-3 mr-1" /> Unknown</span>;
    }
  };

  const renderQuadrantBadge = (quadrant: string) => {
    switch (quadrant) {
      case 'IMMEDIATE_HIGH_PRIORITY':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">Immediate High Priority</span>;
      case 'GRANT_OR_COLLABORATION_TARGET':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-600 text-white shadow-sm">Grant / Partner Target</span>;
      case 'FEASIBLE_RESEARCH_OPPORTUNITY':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-600 text-white shadow-sm">Feasible Opportunity</span>;
      case 'DEPRIORITIZED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-500 text-white shadow-sm">Deprioritized</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-400 text-white shadow-sm">Suitability Undetermined</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-600">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-amber-600" />
        <span>Loading Resource Inventory and Recommendations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Stage 4E-IMP-04
              </span>
              <h1 className="text-2xl font-bold text-stone-900">Resource Suitability & Strategic Recommendations</h1>
            </div>
            <p className="text-sm text-stone-600">
              Evaluates researcher execution suitability (<span className="font-mono text-amber-900 font-semibold">E_suitability</span>) without altering intrinsic scientific opportunity value (<span className="font-mono text-amber-900 font-semibold">V_scientific</span>).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Resource Record
            </button>
            <button
              onClick={loadData}
              className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2D Evaluation Action Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-stone-900">Evaluate Opportunity Execution Suitability</h2>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Select an active research opportunity and associated experiment protocol to map into the 2D Strategic Research Decision Matrix.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Research Opportunity</label>
            <select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-lg p-2 bg-stone-50 text-stone-800"
            >
              {opportunities.map(opp => (
                <option key={opp.id} value={opp.id}>
                  {opp.id.substring(0, 8)}... (V_scientific: {opp.intrinsic_scientific_value ?? 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Experiment Protocol (Optional)</label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-lg p-2 bg-stone-50 text-stone-800"
            >
              <option value="">Standard Baseline Demands</option>
              {experiments.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} ({exp.experimental_design_type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleEvaluateSuitability}
              disabled={evaluating || !selectedOppId}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Evaluate & Categorize
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Inventory) & Right Column (Recommendations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Researcher Resource Inventory */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-stone-900">Resource Inventory</h2>
            </div>
            <span className="text-xs font-mono text-stone-500">{resources.length} registered item(s)</span>
          </div>

          {resources.length === 0 ? (
            <div className="p-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-lg">
              <Server className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-700">No resources registered yet</p>
              <p className="text-xs text-stone-500 mt-1">
                Register your available GPUs, software, datasets, and cloud budget to evaluate experiment execution suitability.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Resource
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(res => (
                <div key={res.id} className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">{res.resourceName}</span>
                    {renderBadge(res.evidenceState)}
                  </div>
                  <div className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-700">Category:</span> {res.resourceCategory}
                  </div>
                  {res.description && (
                    <div className="text-xs text-stone-500">{res.description}</div>
                  )}
                  {res.specifications && Object.keys(res.specifications).length > 0 && (
                    <div className="text-xs font-mono bg-stone-100 p-1.5 rounded border border-stone-200 text-stone-700">
                      {JSON.stringify(res.specifications)}
                    </div>
                  )}
                  <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
                    <span>Source: {res.evidenceSource}</span>
                    <span>Confidence: {res.confidenceLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Strategic Recommendations & Quadrants */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-stone-900">Strategic Recommendations</h2>
            </div>
            <span className="text-xs font-mono text-stone-500">{recommendations.length} evaluation(s)</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-lg">
              <Compass className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-700">No recommendations generated</p>
              <p className="text-xs text-stone-500 mt-1">
                Select an opportunity above and click "Evaluate & Categorize" to generate your first strategic quadrant placement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    {renderQuadrantBadge(rec.strategic_quadrant)}
                    <span className="text-xs text-stone-400 font-mono">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-stone-200">
                    <div>
                      <div className="text-[11px] font-semibold text-stone-500 uppercase">Scientific Value (V)</div>
                      <div className="text-xl font-bold text-amber-700 font-mono">
                        {rec.intrinsic_scientific_value?.toFixed(2) ?? 'N/A'}/10
                      </div>
                      <div className="text-[10px] text-stone-400">Intrinsic Literature Value</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-stone-500 uppercase">Suitability (E)</div>
                      <div className="text-xl font-bold text-stone-800 font-mono">
                        {rec.execution_suitability !== null ? `${rec.execution_suitability?.toFixed(2)}/10` : 'Undetermined'}
                      </div>
                      <div className="text-[10px] text-stone-400">Researcher Resource Match</div>
                    </div>
                  </div>

                  {rec.resource_recommendations && rec.resource_recommendations.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-stone-700">Recommended Next Actions:</div>
                      {rec.resource_recommendations.map((action: any, idx: number) => (
                        <div key={idx} className="p-2 bg-amber-50/50 border border-amber-200/60 rounded text-xs space-y-0.5">
                          <div className="font-semibold text-amber-900">{action.recommendationTitle}</div>
                          <div className="text-stone-600 text-[11px]">{action.detailedAction}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {rec.is_stale && (
                    <div className="p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-800 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span>Stale assessment: parent experiment or resources changed.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900">Add Researcher Resource</h3>
            <form onSubmit={handleAddResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Resource Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 bg-stone-50 text-stone-800"
                >
                  <option value="COMPUTE_HARDWARE">Compute Hardware (GPU/TPU)</option>
                  <option value="SOFTWARE_FRAMEWORK">Software & Frameworks</option>
                  <option value="DATASET_ACCESS">Dataset & Data Access</option>
                  <option value="FINANCIAL_BUDGET">Financial & Cloud Budget</option>
                  <option value="LAB_EQUIPMENT">Laboratory Equipment</option>
                  <option value="HUMAN_EXPERTISE">Expertise & Skills</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NVIDIA A100 Workstation, PyTorch 2.1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Evidence State</label>
                <select
                  value={newEvidenceState}
                  onChange={(e: any) => setNewEvidenceState(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 bg-stone-50 text-stone-800"
                >
                  <option value="DECLARED_AVAILABLE">Declared Available (Self-Reported)</option>
                  <option value="VERIFIED_AVAILABLE">Verified Available (Attested / Benchmarked)</option>
                  <option value="VERIFIED_UNAVAILABLE">Verified Unavailable</option>
                  <option value="UNKNOWN">Unknown Availability</option>
                </select>
              </div>

              {newCategory === 'COMPUTE_HARDWARE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">GPU Count</label>
                    <input
                      type="number"
                      min={1}
                      value={newGpus}
                      onChange={(e) => setNewGpus(Number(e.target.value))}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2 text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">VRAM (GB)</label>
                    <input
                      type="number"
                      min={4}
                      value={newVram}
                      onChange={(e) => setNewVram(Number(e.target.value))}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2 text-stone-800"
                    />
                  </div>
                </div>
              )}

              {newCategory === 'FINANCIAL_BUDGET' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Monthly Budget (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full text-sm border border-stone-300 rounded-lg p-2 text-stone-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional technical details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
