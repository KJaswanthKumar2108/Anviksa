import React, { useState } from 'react';
import { Search, Bell, PlusCircle, User, ChevronDown, BookOpen, Sparkles, LogIn, LogOut, Shield, Menu, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenContributionModal: () => void;
  globalSearchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleLanding?: () => void;
  currentUser: any;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onToggleMobileSidebar?: () => void;
  themeMode?: 'light' | 'dark';
  onToggleThemeMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenContributionModal,
  globalSearchQuery,
  onSearchChange,
  onToggleLanding,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onToggleMobileSidebar,
  themeMode = 'light',
  onToggleThemeMode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const mockNotifications = [
    { id: 1, title: 'Contribution Accepted', text: 'Your kernel benchmark proposal was approved.', time: '10m ago' },
    { id: 2, title: 'New Challenge Posted', text: 'AI Science Foundation launched a $50k Grant challenge.', time: '1h ago' }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAEDCD] border-b border-[#DCD5BC] shadow-2xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Zone 1: Mobile Menu Button & Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="md:hidden p-2 text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-xl transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-[#D4A373] rounded-xl p-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#D4A373] hover:bg-[#8B5E34] flex items-center justify-center text-[#342F27] hover:text-white font-bold text-sm shadow-xs transition-colors">
                AN
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#342F27] whitespace-nowrap">
                  Anvīkṣā
                </span>
              </div>
            </button>

            {/* Quick Landing Page Toggle */}
            {onToggleLanding && (
              <button
                onClick={onToggleLanding}
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6255] hover:text-[#342F27] bg-[#E9EDC9] hover:bg-[#CCD5AE] px-2.5 py-1 rounded-lg transition-colors border border-[#DCD5BC] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Public View</span>
              </button>
            )}
          </div>

          {/* Zone 2: Global Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
              <input
                type="text"
                placeholder="Search papers, DOIs, challenges, or contributors..."
                value={globalSearchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A373] focus:bg-white text-[#342F27] placeholder-[#6B6255] transition-all"
              />
            </div>
          </div>

          {/* Top Quick Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-[#6B6255]">
            <button
              onClick={() => onTabChange('papers')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${currentTab === 'papers' ? 'text-[#342F27] bg-[#CCD5AE] font-semibold border border-[#DCD5BC]' : 'hover:text-[#342F27] hover:bg-[#E9EDC9]'}`}
            >
              Papers
            </button>
            <button
              onClick={() => onTabChange('challenges')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${currentTab === 'challenges' ? 'text-[#342F27] bg-[#CCD5AE] font-semibold border border-[#DCD5BC]' : 'hover:text-[#342F27] hover:bg-[#E9EDC9]'}`}
            >
              Research Challenges
            </button>
            <button
              onClick={() => onTabChange('graph')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${currentTab === 'graph' ? 'text-[#342F27] bg-[#CCD5AE] font-semibold border border-[#DCD5BC]' : 'hover:text-[#342F27] hover:bg-[#E9EDC9]'}`}
            >
              Research Graph
            </button>
            <button
              onClick={() => onTabChange('ai-assistant')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${currentTab === 'ai-assistant' ? 'text-[#342F27] bg-[#CCD5AE] font-semibold border border-[#DCD5BC]' : 'hover:text-[#342F27] hover:bg-[#E9EDC9]'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5E34]" />
              <span>AI Assistant</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions & Auth */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenContributionModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#342F27] bg-[#D4A373] hover:bg-[#8B5E34] hover:text-white rounded-xl shadow-2xs border border-[#C59465] transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Submit Proposal</span>
              <span className="sm:hidden">Submit</span>
            </button>

            {/* Day / Night Quick Toggle */}
            {onToggleThemeMode && (
              <button
                onClick={onToggleThemeMode}
                className="p-2 text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-xl transition-colors cursor-pointer"
                title={themeMode === 'dark' ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
                aria-label="Toggle theme lighting"
              >
                {themeMode === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#D4A373]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#8B5E34]" />
                )}
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                className="relative p-2 text-[#6B6255] hover:text-[#342F27] hover:bg-[#E9EDC9] rounded-xl transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4A373] rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl shadow-lg py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-[#DCD5BC] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#342F27]">Notifications</span>
                  </div>
                  <div className="divide-y divide-[#DCD5BC] max-h-64 overflow-y-auto">
                    {mockNotifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-[#E9EDC9] cursor-pointer text-xs transition-colors">
                        <span className="font-semibold text-[#342F27] block">{n.title}</span>
                        <p className="text-[#6B6255] text-[11px] mt-0.5">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Profile / Login Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                  className="flex items-center gap-1.5 p-1 text-[#342F27] hover:bg-[#E9EDC9] rounded-xl transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover border border-[#DCD5BC]"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B6255] hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#FAEDCD] border border-[#DCD5BC] rounded-2xl shadow-lg py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-[#DCD5BC]">
                      <p className="text-xs font-bold text-[#342F27]">{currentUser.display_name || 'Dr. Elena Rostova'}</p>
                      <p className="text-[10px] text-[#6B6255] truncate">{currentUser.email || 'elena.rostova@inf.ethz.ch'}</p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-[#CCD5AE] text-[#342F27] px-2 py-0.5 rounded border border-[#B8C299]">
                          Tier 1 · Research Scientist
                        </span>
                        <span className="text-[10px] text-[#6B6255]">ETH Zürich</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { onTabChange('my-contributions'); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#342F27] hover:bg-[#E9EDC9] transition-colors"
                    >
                      My Contributions & Proposals
                    </button>
                    <button
                      onClick={() => { onTabChange('settings'); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#342F27] hover:bg-[#E9EDC9] transition-colors"
                    >
                      Account & Settings
                    </button>
                    <button
                      onClick={() => { onSignOut(); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-[#B83A32] hover:bg-[#E9EDC9] font-semibold border-t border-[#DCD5BC] flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#342F27] bg-[#CCD5AE] hover:bg-[#D4A373] rounded-xl border border-[#DCD5BC] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
