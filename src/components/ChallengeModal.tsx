import React, { useState, useEffect } from 'react';
import { X, Plus, Target, Check, AlertCircle } from 'lucide-react';
import { Challenge } from '../data/mockData';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (challenge: Challenge) => void;
  initialChallenge?: Challenge | null;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialChallenge
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Artificial Intelligence');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Grand Challenge'>('Advanced');
  const [orgName, setOrgName] = useState('AI Science Foundation');
  const [orgType, setOrgType] = useState('Non-Profit');
  const [rewardBounty, setRewardBounty] = useState('$50,000 Grant');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [problemStatement, setProblemStatement] = useState('');
  const [researchBackground, setResearchBackground] = useState('');
  const [knownLimitations, setKnownLimitations] = useState('');
  const [constraints, setConstraints] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialChallenge) {
      setTitle(initialChallenge.title);
      setCategory(initialChallenge.category);
      setDifficulty(initialChallenge.difficulty);
      setOrgName(initialChallenge.orgName);
      setOrgType(initialChallenge.orgType);
      setRewardBounty(initialChallenge.rewardBounty || '');
      setDeadline(initialChallenge.deadline);
      setProblemStatement(initialChallenge.problemStatement);
      setResearchBackground(initialChallenge.researchBackground);
      setKnownLimitations(initialChallenge.knownLimitations.join('\n'));
      setConstraints(initialChallenge.constraints.join('\n'));
      setDesiredOutcome(initialChallenge.desiredOutcome);
    } else {
      setTitle('');
      setProblemStatement('');
      setResearchBackground('');
      setKnownLimitations('');
      setConstraints('');
      setDesiredOutcome('');
    }
    setErrors({});
  }, [initialChallenge, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!problemStatement.trim()) newErrors.problemStatement = 'Problem statement is required';
    if (!desiredOutcome.trim()) newErrors.desiredOutcome = 'Desired outcome is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const challengeData: Challenge = {
      id: initialChallenge ? initialChallenge.id : `chal-${Date.now()}`,
      title,
      orgId: initialChallenge ? initialChallenge.orgId : 'org-user',
      orgName,
      orgType,
      orgLogo: initialChallenge?.orgLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      category,
      difficulty,
      status: initialChallenge ? initialChallenge.status : 'Open',
      rewardBounty: rewardBounty.trim() || undefined,
      deadline: deadline || '2026-12-31',
      problemStatement,
      researchBackground: researchBackground || 'Extracted from published literature limitations.',
      relatedPaperIds: initialChallenge ? initialChallenge.relatedPaperIds : ['paper-1'],
      knownLimitations: knownLimitations.split('\n').filter(l => l.trim()),
      constraints: constraints.split('\n').filter(c => c.trim()),
      desiredOutcome,
      contributorCount: initialChallenge ? initialChallenge.contributorCount : 0,
      proposalCount: initialChallenge ? initialChallenge.proposalCount : 0,
      createdAt: initialChallenge ? initialChallenge.createdAt : new Date().toISOString().split('T')[0]
    };

    onSubmit(challengeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342F27]/60 backdrop-blur-xs">
      <div className="bg-[#FAEDCD] rounded-2xl shadow-2xl border border-[#DCD5BC] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#E9EDC9]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#8B5E34]" />
            <h3 className="text-base font-bold text-[#342F27]">
              {initialChallenge ? 'Edit Research Challenge' : 'Publish New Research Challenge'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6255] hover:text-[#342F27] hover:bg-[#CCD5AE] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-[#342F27]">
          
          <div>
            <label className="block font-bold text-[#342F27] mb-1">Challenge Title *</label>
            <input
              type="text"
              placeholder="e.g. Reduce Gradient Memory Overhead in Linear Attention Models to O(1)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium ${
                errors.title ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
              }`}
            />
            {errors.title && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.title}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#342F27] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium cursor-pointer"
              >
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Genomics & Gene Editing">Genomics & Gene Editing</option>
                <option value="Quantum Physics">Quantum Physics</option>
                <option value="Materials Science & Climate">Materials Science & Climate</option>
                <option value="Clean Energy & Storage">Clean Energy & Storage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#342F27] mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Grand Challenge">Grand Challenge</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#342F27] mb-1">Publishing Organization</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#342F27] mb-1">Grant / Reward Bounty</label>
              <input
                type="text"
                placeholder="e.g. $50,000 Grant or $20,000 Compute Credits"
                value={rewardBounty}
                onChange={(e) => setRewardBounty(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#342F27] mb-1">Problem Statement *</label>
            <textarea
              rows={3}
              placeholder="State the technical problem, target constraints, and exact bottleneck..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                errors.problemStatement ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
              }`}
            />
            {errors.problemStatement && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.problemStatement}</span>}
          </div>

          <div>
            <label className="block font-bold text-[#342F27] mb-1">Known Limitations (One per line)</label>
            <textarea
              rows={2}
              placeholder="e.g. Gradient checkpointing trades computation time for memory linearly&#10;High GPU memory activation storage"
              value={knownLimitations}
              onChange={(e) => setKnownLimitations(e.target.value)}
              className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#342F27] mb-1">Desired Outcome & Success Criteria *</label>
            <textarea
              rows={2}
              placeholder="Quantifiable outcome metrics required for verification..."
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              className={`w-full px-3 py-2 bg-[#FEFAE0] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27] ${
                errors.desiredOutcome ? 'border-[#B83A32]' : 'border-[#DCD5BC]'
              }`}
            />
            {errors.desiredOutcome && <span className="text-[#B83A32] text-[10px] mt-0.5 block">{errors.desiredOutcome}</span>}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#DCD5BC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] border border-[#DCD5BC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialChallenge ? 'Save Changes' : 'Publish Challenge'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
