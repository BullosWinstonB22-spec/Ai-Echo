import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MessageSquareText,
  Camera,
  MoreVertical,
  Search,
  Sparkles,
  Menu,
  Settings,
  ArrowUpRight,
  Compass,
  Lightbulb,
  BookOpen,
  ShieldCheck,
  Plus,
  Send,
  RotateCcw,
  Trash2,
  ChevronRight,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { UserProfile, RecentSearch, NavigationTab } from '../types';
import { EchoRobot3D } from './EchoRobot3D';
import { useEchoEmotion } from '../lib/useEchoEmotion';

interface DashboardViewProps {
  userProfile: UserProfile;
  recentSearches: RecentSearch[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectRecentSearch: (search: RecentSearch) => void;
  onDeleteRecentSearch: (id: string) => void;
  onOpenMenu: () => void;
  onQuickPrompt?: (prompt: string) => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  recentSearches,
  onNavigate,
  onSelectRecentSearch,
  onDeleteRecentSearch,
  onOpenMenu,
  onQuickPrompt,
  isAuthenticated = false,
  onOpenAuthModal,
}) => {
  const [activeSearchMenuId, setActiveSearchMenuId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'chat' | 'voice' | 'image' | 'code'>('all');
  const [quickInputText, setQuickInputText] = useState<string>('');
  const [showPlusMenu, setShowPlusMenu] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'suggestions' | 'recent' | 'all-modes'>('suggestions');
  const { state: echoState, subAction: echoSubAction } = useEchoEmotion();

  const firstName = userProfile?.name ? userProfile.name.trim().split(' ')[0] : 'Jackson';

  const filteredSearches = recentSearches.filter(s =>
    filterCategory === 'all' ? true : s.category === filterCategory
  );

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;
    const text = quickInputText.trim();
    setQuickInputText('');
    if (onQuickPrompt) {
      onQuickPrompt(text);
    } else {
      onNavigate('chat');
    }
  };

  const PRIMARY_SUGGESTIONS = [
    {
      id: 'synthesize',
      title: 'Synthesize Data',
      subtitle: 'Turn meeting notes into five key team points.',
      icon: <Compass className="w-4 h-4 text-[#7C3AED]" />,
      badgeBg: 'bg-purple-100/90',
      prompt: 'Synthesize my meeting notes into five key actionable team points: 1) Client review completed, 2) Design system finalized, 3) Backend API ready, 4) Testing phase begins Thursday, 5) Production deployment next Monday.',
    },
    {
      id: 'brainstorm',
      title: 'Creative Brainstorm',
      subtitle: 'Create three taglines for a sustainable fashion brand.',
      icon: <Lightbulb className="w-4 h-4 text-amber-600" />,
      badgeBg: 'bg-amber-100/90',
      prompt: 'Create three compelling, catchy taglines for a modern sustainable fashion brand focusing on circular materials and timeless aesthetics.',
    },
    {
      id: 'explain',
      title: 'Explain Concept',
      subtitle: 'Explain complex tech simply and quickly today',
      icon: <BookOpen className="w-4 h-4 text-blue-600" />,
      badgeBg: 'bg-blue-100/90',
      prompt: 'Explain quantum computing and quantum superposition simply and clearly with an everyday analogy.',
    },
    {
      id: 'facts',
      title: 'Check Facts',
      subtitle: 'GDPR stricter than CCPA on privacy rules overall.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      badgeBg: 'bg-emerald-100/90',
      prompt: 'Compare GDPR and CCPA key privacy compliance differences and explain whether GDPR is stricter overall.',
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#F3EDFB] via-[#F8F2FD] to-[#ECE2FA] text-[#1E1B4B] select-none pb-32">
      {/* Soft Ambient Radial Lights (Pastel Blur Reference) */}
      <div className="absolute top-[-5%] left-[-10%] w-[420px] h-[420px] bg-purple-200/35 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[380px] h-[380px] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] bg-blue-100/30 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-xl mx-auto px-4 pt-4 sm:px-6 space-y-6 z-10">
        {/* HEADER SECTION (Matching Reference Screen 2) */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {/* User Avatar Circle */}
            <button
              onClick={onOpenMenu}
              className="group relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#C084FC] via-[#E879F9] to-[#818CF8] shadow-sm hover:scale-105 transition-all cursor-pointer"
              title="Open Navigation Menu"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-[#7C3AED]">
                    {firstName.charAt(0)}
                  </span>
                )}
              </div>
            </button>

            <div>
              <span className="text-sm font-bold text-[#1E1B4B]">
                Echo Assistant
              </span>
              <p className="text-[11px] text-[#71688D]">Online & Ready</p>
            </div>
          </div>

          {/* Right Action: Sign in / Try Premium / Menu */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('settings')}
                className="px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-xs font-bold text-[#7C3AED] border border-white/80 shadow-[0_4px_16px_rgba(139,92,246,0.08)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.14)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Account</span>
              </button>
            )}

            <button
              onClick={onOpenMenu}
              className="p-2 rounded-full bg-white/70 hover:bg-white text-[#575073] hover:text-[#7C3AED] border border-white/80 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO COMPANION SECTION (Matching Reference Screen 2) */}
        <div className="flex flex-col items-center justify-center text-center pt-2">
          {/* 3D Mascot Showcase */}
          <div className="relative flex items-center justify-center">
            {/* Soft Ambient Ground Aura */}
            <div className="absolute -bottom-1 w-40 h-8 bg-purple-900/8 rounded-full blur-xl pointer-events-none" />
            <EchoRobot3D
              state={echoState}
              subAction={echoSubAction}
              size="md"
              interactive={true}
              showBadge={false}
            />
          </div>

          {/* Greeting Typography (Matching Reference Screen 2) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-0.5 mt-1"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#6D28D9]">
              Hello, {firstName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6D6789]">
              How can I assist you right now?
            </p>
          </motion.div>
        </div>

        {/* 4 PROMPT SUGGESTION CARDS (2x2 Grid Matching Reference Screen 2) */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {PRIMARY_SUGGESTIONS.map(card => (
              <motion.div
                key={card.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (onQuickPrompt) {
                    onQuickPrompt(card.prompt);
                  } else {
                    onNavigate('chat');
                  }
                }}
                className="group relative cursor-pointer flex flex-col justify-between p-4 sm:p-4.5 rounded-[24px] bg-white/85 hover:bg-white backdrop-blur-xl border border-white/80 shadow-[0_8px_24px_rgba(139,92,246,0.06)] hover:shadow-[0_12px_28px_rgba(139,92,246,0.12)] transition-all duration-200"
              >
                {/* Top Row: Icon circle + Up-Right Arrow */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-full ${card.badgeBg} flex items-center justify-center shadow-xs shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="p-1 rounded-full text-slate-400 group-hover:text-[#7C3AED] transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-[#71688D] mt-1 leading-relaxed line-clamp-2">
                    {card.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* QUICK CAPABILITIES STRIP (Preserving Voice, Vision, History) */}
        <div className="pt-1">
          <div className="flex items-center justify-between p-1 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-xs text-xs font-semibold text-[#5A5376]">
            <button
              onClick={() => onNavigate('voice')}
              className="flex-1 py-2 px-3 rounded-xl hover:bg-white/80 flex items-center justify-center gap-1.5 transition-all text-[#6D28D9] cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Mode</span>
            </button>

            <button
              onClick={() => onNavigate('image-search')}
              className="flex-1 py-2 px-3 rounded-xl hover:bg-white/80 flex items-center justify-center gap-1.5 transition-all text-[#0284C7] cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Vision AI</span>
            </button>

            <button
              onClick={() => onNavigate('conversations')}
              className="flex-1 py-2 px-3 rounded-xl hover:bg-white/80 flex items-center justify-center gap-1.5 transition-all text-[#059669] cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* RECENT SEARCH EXPANDABLE SECTION */}
        {recentSearches.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#4B4568]">
              <span>Recent Activity</span>
              <button
                onClick={() => onNavigate('conversations')}
                className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-1.5">
              {recentSearches.slice(0, 2).map(search => (
                <div
                  key={search.id}
                  onClick={() => onSelectRecentSearch(search)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/75 hover:bg-white border border-white/70 shadow-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#1E1B4B] truncate">{search.query}</p>
                      <p className="text-[10px] text-[#8C84A6] truncate">{search.preview}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{search.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING BOTTOM INPUT BAR (Matching Reference Screen 2) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md">
        <form
          onSubmit={handleQuickSubmit}
          className="relative flex items-center justify-between p-1.5 pl-2.5 rounded-full bg-white/90 backdrop-blur-2xl border border-white/85 shadow-[0_12px_40px_rgba(139,92,246,0.15)]"
        >
          {/* Left: Plus Button with Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              className="w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 text-[#7C3AED] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              title="Add attachment or action"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Quick Attachment Popup */}
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 w-48 p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 shadow-2xl z-50 text-xs font-medium space-y-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      onNavigate('image-search');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 text-[#1E1B4B] text-left transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#7C3AED]" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      onNavigate('voice');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 text-[#1E1B4B] text-left transition-colors cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-[#7C3AED]" />
                    <span>Voice Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      onNavigate('conversations');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 text-[#1E1B4B] text-left transition-colors cursor-pointer"
                  >
                    <MessageSquareText className="w-4 h-4 text-[#7C3AED]" />
                    <span>Chat History</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Text Input */}
          <input
            type="text"
            value={quickInputText}
            onChange={e => setQuickInputText(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 bg-transparent text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none"
          />

          {/* Right Action Icons: Sparkles + Purple Microphone Button */}
          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="submit"
              className="p-2 rounded-full text-purple-400 hover:text-[#7C3AED] transition-colors cursor-pointer"
              title="Ask AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('voice')}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-500/25 transition-all cursor-pointer active:scale-95"
              title="Voice Mode"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
