import React from 'react';
import {
  Home,
  FileText,
  Target,
  Network,
  Users,
  Building2,
  Sparkles,
  MessageSquare,
  GitPullRequest,
  Bookmark,
  Settings,
  ChevronRight,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'papers', label: 'Research Papers', icon: FileText, count: '5' },
    { id: 'challenges', label: 'Research Challenges', icon: Target, count: '5', badge: 'Active' },
    { id: 'graph', label: 'Research Graph', icon: Network },
    { id: 'contributors', label: 'Contributors', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'ai-assistant', label: 'AI Research Assistant', icon: Sparkles, highlight: true },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'my-contributions', label: 'My Contributions', icon: GitPullRequest, count: '3' },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#E9EDC9] border-r border-[#DCD5BC] w-64 text-xs font-medium">
      {/* Top Workspace Header */}
      <div className="p-4 border-b border-[#DCD5BC] flex items-center justify-between bg-[#CCD5AE]/40">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#287A50]" />
          <span className="font-bold text-[#342F27]">Anvīkṣā</span>
        </div>
        <span className="text-[10px] text-[#6B6255] font-mono">v1.2</span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-[#6B6255] uppercase tracking-wider">
          Main Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#CCD5AE] text-[#342F27] font-bold shadow-2xs border border-[#B8C299]'
                  : 'text-[#6B6255] hover:text-[#342F27] hover:bg-[#FEFAE0]/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#8B5E34]' : item.highlight ? 'text-[#8B5E34]' : 'text-[#6B6255]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.count && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-[#D4A373] text-[#342F27] font-bold' : 'bg-[#FEFAE0] text-[#6B6255] border border-[#DCD5BC]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#287A50]/15 text-[#287A50] border border-[#287A50]/30">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 m-3 bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl text-[11px]">
        <div className="flex items-center justify-between font-bold text-[#342F27] mb-1">
          <span>Lifecycle Sync</span>
          <BarChart3 className="w-3.5 h-3.5 text-[#8B5E34]" />
        </div>
        <p className="text-[10px] text-[#6B6255] leading-snug">
          Connected 12 papers, 8 limitations & 5 challenges in active graph.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#342F27]/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#E9EDC9] z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
