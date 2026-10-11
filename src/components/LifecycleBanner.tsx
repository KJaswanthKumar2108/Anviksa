import React from 'react';
import { FileText, AlertTriangle, Target, GitPullRequest, Beaker, CheckCircle2, Award } from 'lucide-react';

interface LifecycleBannerProps {
  compact?: boolean;
  onStepClick?: (step: string) => void;
}

export const LifecycleBanner: React.FC<LifecycleBannerProps> = ({ compact = false, onStepClick }) => {
  const steps = [
    {
      id: 'paper',
      title: 'Research Paper',
      desc: 'Published scientific discovery & baseline findings',
      icon: FileText,
      color: 'bg-[#FEFAE0] text-[#342F27] border-[#DCD5BC]',
      badge: '#8B5E34'
    },
    {
      id: 'limitation',
      title: 'Limitation',
      desc: 'Explicitly identified gaps or empirical constraints',
      icon: AlertTriangle,
      color: 'bg-[#E9EDC9] text-[#342F27] border-[#DCD5BC]',
      badge: '#986515'
    },
    {
      id: 'challenge',
      title: 'Challenge',
      desc: 'Formulated open problem with grants or bounties',
      icon: Target,
      color: 'bg-[#CCD5AE] text-[#342F27] border-[#B8C299]',
      badge: '#8B5E34'
    },
    {
      id: 'contribution',
      title: 'Contribution',
      desc: 'Peer proposals, methodologies & code extensions',
      icon: GitPullRequest,
      color: 'bg-[#FAEDCD] text-[#342F27] border-[#D4A373]',
      badge: '#D4A373'
    },
    {
      id: 'experiment',
      title: 'Experiment',
      desc: 'Rigorous empirical testing & dataset validation',
      icon: Beaker,
      color: 'bg-[#FEFAE0] text-[#342F27] border-[#DCD5BC]',
      badge: '#8B5E34'
    },
    {
      id: 'review',
      title: 'Peer Review',
      desc: 'Independent replication & code audit',
      icon: CheckCircle2,
      color: 'bg-[#E9EDC9] text-[#342F27] border-[#DCD5BC]',
      badge: '#287A50'
    },
    {
      id: 'outcome',
      title: 'Research Outcome',
      desc: 'Validated solution & new scientific consensus',
      icon: Award,
      color: 'bg-[#CCD5AE] text-[#342F27] border-[#287A50]/30',
      badge: '#287A50'
    }
  ];

  if (compact) {
    return (
      <div className="bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#6B6255] uppercase tracking-wider">The Anvīkṣā Lifecycle</span>
          <span className="text-xs text-[#6B6255] font-medium">Connected Science Pipeline</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => onStepClick?.(step.id)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all hover:border-[#D4A373] hover:shadow-xs cursor-pointer ${step.color}`}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/90 mb-1.5 shadow-2xs text-[#8B5E34]">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-tight text-[#342F27]">{step.title}</span>
                <span className="text-[10px] text-[#6B6255] mt-0.5 font-mono">Step {idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl p-6 shadow-2xs">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs font-bold tracking-wider text-[#342F27] uppercase bg-[#CCD5AE] px-3 py-1 rounded-full border border-[#B8C299]">
          Connected Science Architecture
        </span>
        <h3 className="text-xl font-bold text-[#342F27] mt-3">The Anvīkṣā Collaboration Lifecycle</h3>
        <p className="text-xs sm:text-sm text-[#6B6255] mt-1.5">
          Every scientific breakthrough begins with a limitation in existing literature and ends with independently validated outcomes.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => onStepClick?.(step.id)}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${step.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white shadow-2xs text-[#8B5E34]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#6B6255]">0{idx + 1}</span>
                </div>
                <h4 className="text-sm font-bold text-[#342F27] leading-snug">{step.title}</h4>
                <p className="text-xs text-[#6B6255] mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
