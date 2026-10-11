import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2, Plus, Users, Shield, GraduationCap, Microscope, BookOpen, Send, X } from 'lucide-react';
import { MOCK_ACTIVITY, ActivityItem, HierarchyRole } from '../data/mockData';

export const CommunityView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [posts, setPosts] = useState<ActivityItem[]>(MOCK_ACTIVITY);
  const [isComposing, setIsComposing] = useState(false);
  const [newPostCategory, setNewPostCategory] = useState<'researchers' | 'research-students' | 'students' | 'reviews'>('researchers');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const filterTabs = [
    { id: 'all', label: 'All Community Posts', icon: Users },
    { id: 'researchers', label: 'Researchers Area', icon: Microscope },
    { id: 'research-students', label: 'Research Student Area', icon: GraduationCap },
    { id: 'students', label: 'Students Area', icon: BookOpen },
    { id: 'reviews', label: 'Reviews Block', icon: Shield }
  ];

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.category === activeFilter;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const roleMap: Record<string, { role: string; hierarchy: HierarchyRole }> = {
      researchers: { role: 'Principal Investigator · Anvīkṣā Fellow', hierarchy: 'Research Scientist' },
      'research-students': { role: 'PhD Scholar · Department of Informatics', hierarchy: 'PhD Scholar' },
      students: { role: 'Graduate Research Student', hierarchy: 'Student' },
      reviews: { role: 'Peer Review Auditor · Independent Replicator', hierarchy: 'Researcher' }
    };

    const newActivity: ActivityItem = {
      id: `act-custom-${Date.now()}`,
      authorName: 'Dr. Elena Rostova',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
      authorRole: roleMap[newPostCategory].role,
      hierarchyRole: roleMap[newPostCategory].hierarchy,
      category: newPostCategory,
      action: newPostCategory === 'reviews' ? 'published independent replication audit for' : 'started discussion on',
      targetTitle: newPostTitle,
      targetType: newPostCategory === 'reviews' ? 'Experiment' : 'Paper',
      timestamp: 'Just now',
      snippet: newPostContent,
      likes: 1,
      comments: 0
    };

    setPosts([newActivity, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setIsComposing(false);
    setActiveFilter(newPostCategory);
  };

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'researchers':
        return { label: 'Researchers Area', bg: 'bg-[#CCD5AE]', text: 'text-[#342F27]' };
      case 'research-students':
        return { label: 'Research Student Area', bg: 'bg-[#E9EDC9]', text: 'text-[#342F27]' };
      case 'students':
        return { label: 'Students Area', bg: 'bg-[#FEFAE0]', text: 'text-[#8B5E34]' };
      case 'reviews':
        return { label: 'Reviews Block', bg: 'bg-[#CCD5AE]', text: 'text-[#287A50]' };
      default:
        return { label: 'Community', bg: 'bg-[#FEFAE0]', text: 'text-[#342F27]' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">Research Community & Academic Feed</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Structured collaboration spaces organized for Researchers, PhD Scholars, Students, and Peer Reviewers.
            </p>
          </div>
          <button
            onClick={() => setIsComposing(true)}
            className="px-4 py-2 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Discussion Thread</span>
          </button>
        </div>

        {/* Filter Bar with Requested Areas */}
        <div className="mt-5 flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
          {filterTabs.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#CCD5AE] text-[#342F27] font-bold border-[#B8C299] shadow-xs ring-1 ring-[#D4A373]'
                    : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:text-[#342F27] hover:bg-[#E9EDC9]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#8B5E34]' : 'text-[#6B6255]'}`} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose Modal / Drawer */}
      {isComposing && (
        <div className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#DCD5BC] pb-3">
            <h3 className="font-bold text-sm text-[#342F27] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#8B5E34]" />
              <span>Compose Academic Thread</span>
            </h3>
            <button
              onClick={() => setIsComposing(false)}
              className="p-1 text-[#6B6255] hover:text-[#342F27] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#6B6255] mb-1">Target Community Section</label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27] font-medium"
                >
                  <option value="researchers">Researchers Area (Faculty, PIs & Senior Scientists)</option>
                  <option value="research-students">Research Student Area (PhD Scholars & Doctoral Candidates)</option>
                  <option value="students">Students Area (Undergraduate & Masters Research)</option>
                  <option value="reviews">Reviews Block (Independent Replications & Audits)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#6B6255] mb-1">Paper, Challenge, or Research Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. Linear Attention Kernel Replication or Assay Formulation..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#6B6255] mb-1">Detailed Academic Note / Findings</label>
              <textarea
                rows={3}
                placeholder="Share your experimental notes, methodological critique, dataset parameters, or peer review evaluation..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-[#342F27]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 font-semibold text-[#6B6255] hover:text-[#342F27] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white border border-[#C59465] rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Thread</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4 text-xs">
        {filteredPosts.map((act) => {
          const badge = getCategoryBadge(act.category);
          return (
            <div key={act.id} className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img src={act.authorAvatar} alt={act.authorName} className="w-10 h-10 rounded-full object-cover border border-[#DCD5BC]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#342F27] text-xs">{act.authorName}</h3>
                      {act.hierarchyRole && (
                        <span className="text-[10px] font-mono font-bold bg-[#CCD5AE] text-[#342F27] px-2 py-0.2 rounded border border-[#B8C299]">
                          {act.hierarchyRole}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B6255] mt-0.5">{act.authorRole}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#DCD5BC] ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-[#6B6255] font-mono">{act.timestamp}</span>
                </div>
              </div>

              <p className="text-[#6B6255] text-xs leading-relaxed">
                {act.action} <strong className="text-[#342F27]">{act.targetTitle}</strong>
              </p>

              <div className="p-4 bg-[#FEFAE0] rounded-xl border border-[#DCD5BC] text-[#342F27] leading-relaxed text-[11px]">
                "{act.snippet}"
              </div>

              <div className="pt-2 flex items-center gap-6 text-[#6B6255] text-xs border-t border-[#DCD5BC]">
                <button
                  onClick={() => handleLike(act.id)}
                  className="flex items-center gap-1.5 hover:text-[#8B5E34] transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{act.likes} Likes</span>
                </button>
                <div className="flex items-center gap-1.5 text-[#6B6255]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{act.comments} Comments</span>
                </div>
                <button className="flex items-center gap-1.5 hover:text-[#8B5E34] transition-colors ml-auto cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="bg-[#FAEDCD] p-12 text-center rounded-2xl border border-[#DCD5BC] text-[#6B6255]">
            No threads found in this area. Click "New Discussion Thread" to post!
          </div>
        )}
      </div>

    </div>
  );
};
