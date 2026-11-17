import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Share2, Plus, Users, Shield, GraduationCap, Microscope, BookOpen, Send, X } from 'lucide-react';
import { ActivityItem, HierarchyRole } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface CommunityViewProps {
  currentUser?: any;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ currentUser }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [posts, setPosts] = useState<ActivityItem[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [newPostCategory, setNewPostCategory] = useState<'researchers' | 'research-students' | 'students' | 'reviews'>('researchers');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Hydrate community posts from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    async function loadCommunityPosts() {
      try {
        const { data, error } = await client
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mappedPosts: ActivityItem[] = data.map((p: any) => ({
            id: p.id,
            authorName: p.author_name,
            authorAvatar: p.author_avatar || '',
            authorRole: p.author_role || 'Researcher',
            hierarchyRole: (p.hierarchy_role as HierarchyRole) || 'Researcher',
            category: p.category,
            action: p.action,
            targetTitle: p.target_title,
            targetType: p.target_type,
            timestamp: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
            snippet: p.snippet,
            likes: p.likes || 0,
            comments: p.comments || 0
          }));

          setPosts(mappedPosts);
        }
      } catch (err) {
        console.warn('[Community] Error loading posts from Supabase:', err);
      }
    }

    loadCommunityPosts();
  }, []);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const roleMap: Record<string, { role: string; hierarchy: HierarchyRole }> = {
      researchers: { role: 'Principal Investigator · Anvīkṣā Fellow', hierarchy: 'Research Scientist' },
      'research-students': { role: 'PhD Scholar · Department of Informatics', hierarchy: 'PhD Scholar' },
      students: { role: 'Graduate Research Student', hierarchy: 'Student' },
      reviews: { role: 'Peer Review Auditor · Independent Replicator', hierarchy: 'Researcher' }
    };

    const authorDisplayName = currentUser?.display_name || currentUser?.email || 'Community Member';

    const newActivity: ActivityItem = {
      id: `act-custom-${Date.now()}`,
      authorName: authorDisplayName,
      authorAvatar: currentUser?.avatar_url || '',
      authorRole: currentUser?.title || roleMap[newPostCategory].role,
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

    // Optimistically prepend to state
    setPosts([newActivity, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setIsComposing(false);
    setActiveFilter(newPostCategory);

    // Persist to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('community_posts').insert({
          author_name: newActivity.authorName,
          author_avatar: newActivity.authorAvatar,
          author_role: newActivity.authorRole,
          hierarchy_role: newActivity.hierarchyRole,
          category: newActivity.category,
          action: newActivity.action,
          target_title: newActivity.targetTitle,
          target_type: newActivity.targetType,
          snippet: newActivity.snippet,
          likes: newActivity.likes,
          comments: newActivity.comments
        });
      } catch (err) {
        console.warn('[Community] Failed to persist post to Supabase:', err);
      }
    }
  };

  const handleLike = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));

    if (isSupabaseConfigured && supabase) {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isValidUuid) {
        try {
          const currentPost = posts.find(p => p.id === id);
          if (currentPost) {
            await supabase
              .from('community_posts')
              .update({ likes: currentPost.likes + 1 })
              .eq('id', id);
          }
        } catch (e) {
          console.warn('[Community] Like update error:', e);
        }
      }
    }
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
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#CCD5AE] border-[#B8C299] text-[#342F27] font-bold shadow-xs'
                    : 'bg-[#FEFAE0] border-[#DCD5BC] text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#8B5E34]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Thread Composer Modal */}
      {isComposing && (
        <div className="bg-[#FAEDCD] p-5 rounded-2xl border border-[#DCD5BC] shadow-sm space-y-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#DCD5BC] pb-3">
            <h3 className="font-bold text-[#342F27] text-sm">Create New Discussion or Replication Note</h3>
            <button
              onClick={() => setIsComposing(false)}
              className="text-[#6B6255] hover:text-[#342F27] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div>
              <label className="block font-bold text-[#342F27] mb-1">Target Community Area</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'researchers', label: 'Researchers Area' },
                  { id: 'research-students', label: 'PhD Scholar Area' },
                  { id: 'students', label: 'Students Area' },
                  { id: 'reviews', label: 'Reviews Block' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewPostCategory(cat.id as any)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                      newPostCategory === cat.id
                        ? 'bg-[#CCD5AE] border-[#B8C299] text-[#342F27] font-bold shadow-2xs'
                        : 'bg-[#FEFAE0] border-[#DCD5BC] text-[#6B6255]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#342F27] mb-1">Topic or Target Research Paper / Challenge *</label>
              <input
                type="text"
                required
                placeholder="e.g. S2-Kernel Linear Attention Backward Memory in Practice"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg text-[#342F27] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#342F27] mb-1">Discussion Details or Empirical Findings *</label>
              <textarea
                rows={3}
                required
                placeholder="Share findings, question assumptions, or provide peer commentary..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full px-3 py-2 bg-[#FEFAE0] border border-[#DCD5BC] rounded-lg text-[#342F27] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-3 py-1.5 text-xs text-[#6B6255] hover:text-[#342F27] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white rounded-xl shadow-2xs border border-[#C59465] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Thread</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const badge = getCategoryBadge(post.category);
            return (
              <div
                key={post.id}
                className="bg-[#FAEDCD] p-5 rounded-2xl border border-[#DCD5BC] shadow-2xs space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-9 h-9 rounded-full object-cover border border-[#DCD5BC]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#CCD5AE] text-[#342F27] font-bold flex items-center justify-center border border-[#B8C299]">
                        {post.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#342F27] text-xs">{post.authorName}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border border-[#B8C299] ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6255]">{post.authorRole}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#6B6255] font-mono shrink-0">{post.timestamp}</span>
                </div>

                {/* Action statement & target */}
                <div className="text-[11px] text-[#6B6255] pt-1 border-t border-[#DCD5BC]/60">
                  <span>{post.action} </span>
                  <span className="font-bold text-[#342F27]">"{post.targetTitle}"</span>
                  <span className="ml-1 text-[10px] bg-[#E9EDC9] px-1.5 py-0.5 rounded text-[#8B5E34] font-medium font-mono">
                    {post.targetType}
                  </span>
                </div>

                {/* Snippet body */}
                <p className="text-[#342F27] leading-relaxed bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC]">
                  {post.snippet}
                </p>

                {/* Engagement Footer */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1.5 text-[#6B6255] hover:text-[#8B5E34] font-medium cursor-pointer transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.likes} Endorsements</span>
                  </button>
                  <div className="flex items-center gap-1 text-[#6B6255]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.comments} Responses</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#FAEDCD] p-8 rounded-2xl border border-[#DCD5BC] text-center space-y-2 text-xs">
            <p className="font-semibold text-[#342F27]">No community discussions in this category yet.</p>
            <p className="text-[#6B6255]">Be the first researcher or student to start a discussion or post replication findings.</p>
            <button
              onClick={() => setIsComposing(true)}
              className="mt-2 px-4 py-1.5 font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Thread</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
