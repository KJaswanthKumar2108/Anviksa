import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Target,
  GitPullRequest,
  Check,
  Beaker,
  Award,
  Network,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface EndToEndLifecycleRunnerProps {
  onExecuteFullLifecycle: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EndToEndLifecycleRunner: React.FC<EndToEndLifecycleRunnerProps> = ({
  onExecuteFullLifecycle,
  onNavigateTab
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const steps = [
    { id: 1, title: '1. Register Paper', tab: 'papers', desc: 'Linear Attention S2-Kernel (Nature Machine Intelligence)', icon: FileText },
    { id: 2, title: '2. AI Analysis & Gaps', tab: 'ai-assistant', desc: 'Author limitation: High GPU activation memory in backward pass', icon: AlertTriangle },
    { id: 3, title: '3. Publish Challenge', tab: 'challenges', desc: 'AI Science Foundation ($50,000 Grant): O(1) Memory Kernel', icon: Target },
    { id: 4, title: '4. Submit Proposal', tab: 'my-contributions', desc: 'Dr. Elena Rostova: Chunked Triton Kernel Checkpointing', icon: GitPullRequest },
    { id: 5, title: '5. Peer Review', tab: 'my-contributions', desc: 'Stanford Review Board: Approved & Accepted for Experiment', icon: Check },
    { id: 6, title: '6. Record Experiment', tab: 'my-contributions', desc: 'NVIDIA H100 512k Context Activation Trial: Peak Memory 12.4GB', icon: Beaker },
    { id: 7, title: '7. Document Outcome', tab: 'my-contributions', desc: 'Validation Status: Independently Replicated (S2 v1.0 Released)', icon: Award },
    { id: 8, title: '8. Graph Lineage', tab: 'graph', desc: 'Traceable lineage nodes & edges updated live in Research Graph', icon: Network }
  ];

  const handleStepClick = (s: any) => {
    setActiveStep(s.id);
    onNavigateTab(s.tab);
  };

  const handleRunFullScenario = () => {
    setIsAutoRunning(true);
    onExecuteFullLifecycle();
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      if (current <= 8) {
        setActiveStep(current);
        onNavigateTab(steps[current - 1].tab);
      } else {
        clearInterval(interval);
        setIsAutoRunning(false);
      }
    }, 1200);
  };

  return (
    <div className="bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCD5BC] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299] uppercase tracking-wider font-mono">
              End-to-End Research Lifecycle
            </span>
            <span className="text-xs text-[#DCD5BC]">·</span>
            <span className="text-xs text-[#6B6255] font-medium">8-Stage Traceable Science Pipeline</span>
          </div>
          <h3 className="text-base font-bold text-[#342F27]">
            Interactive Lifecycle Demonstrator
          </h3>
          <p className="text-xs text-[#6B6255] mt-0.5">
            Trace how an original paper's reported limitation moves from a funded challenge to independent replication and live graph lineage.
          </p>
        </div>

        <button
          onClick={handleRunFullScenario}
          disabled={isAutoRunning}
          className="px-5 py-2.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isAutoRunning ? 'Simulating Workflow...' : 'Execute 8-Step Lifecycle Scenario'}</span>
        </button>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = activeStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleStepClick(s)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#CCD5AE] text-[#342F27] border-[#B8C299] shadow-md ring-2 ring-[#D4A373]'
                  : 'bg-[#FEFAE0] hover:bg-[#E9EDC9] border-[#DCD5BC] text-[#342F27]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#8B5E34]' : 'text-[#6B6255]'}`} />
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-[#342F27]' : 'text-[#6B6255]'}`}>0{s.id}</span>
              </div>
              <div>
                <span className="font-bold text-[11px] block leading-tight">{s.title}</span>
                <p className={`text-[10px] mt-1 line-clamp-2 leading-snug ${isActive ? 'text-[#342F27]/90' : 'text-[#6B6255]'}`}>
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
