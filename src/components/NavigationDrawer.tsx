import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Mic,
  MessageSquare,
  Camera,
  Settings,
  X,
  Sparkles,
  RotateCcw,
  Zap,
  Radio,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';
import { EchoRobot3D } from './EchoRobot3D';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userProfile: UserProfile;
  onRestartOnboarding: () => void;
  online: boolean;
  onOpenPrivacyPolicy?: () => void;
  isAuthenticated: boolean;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  userProfile,
  onRestartOnboarding,
  online,
  onOpenPrivacyPolicy,
  isAuthenticated,
  onOpenAuthModal,
  onLogout,
}) => {
  if (!isOpen) return null;

  const menuItems: Array<{ id: NavigationTab; label: string; desc: string; icon: React.ReactNode }> = [
    {
      id: 'home',
      label: 'Main Dashboard',
      desc: 'Primary control panel & quick actions',
      icon: <Home className="w-5 h-5 text-[#7C3AED]" />,
    },
    {
      id: 'voice',
      label: 'Talk With Echo',
      desc: 'Hands-free voice assistant mode',
      icon: <Mic className="w-5 h-5 text-[#8B5CF6]" />,
    },
    {
      id: 'chat',
      label: 'Chat With Echo',
      desc: 'Conversational Gemini 3.6 AI',
      icon: <MessageSquare className="w-5 h-5 text-[#7C3AED]" />,
    },
    {
      id: 'image-search',
      label: 'Search By Image',
      desc: 'Multimodal vision analysis',
      icon: <Camera className="w-5 h-5 text-[#0284C7]" />,
    },
    {
      id: 'conversations',
      label: 'History & Logs',
      desc: 'Review past chat sessions',
      icon: <Radio className="w-5 h-5 text-[#059669]" />,
    },
    {
      id: 'settings',
      label: 'Echo Settings',
      desc: 'Customize AI voice, theme & offline mode',
      icon: <Settings className="w-5 h-5 text-[#6D28D9]" />,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#1E1B4B]/40 backdrop-blur-md"
        />

        {/* Drawer Content */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative w-80 max-w-[85vw] h-full bg-gradient-to-b from-[#F3EDFB] via-[#F8F2FD] to-[#ECE2FA] border-r border-white/80 text-[#1E1B4B] flex flex-col justify-between p-5 z-10 overflow-y-auto shadow-2xl"
        >
          {/* Header & User Card */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1E1B4B] tracking-wide">Echo Assistant</h2>
                  <span className="text-[10px] font-semibold text-[#7C3AED] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {online ? 'Online Core' : 'Offline Mode'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/80 text-[#575073] hover:text-[#1E1B4B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="mt-3 p-3 rounded-2xl bg-white/80 border border-purple-100 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1E1B4B] truncate">
                    {userProfile?.name || 'Guest User'}
                  </p>
                  <p className="text-[10px] text-[#71688D] truncate">
                    {isAuthenticated ? userProfile?.email || 'Logged in' : 'Local guest session'}
                  </p>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuthModal();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-[11px] font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Menu Links */}
            <div className="space-y-1.5 pt-4">
              {menuItems.map(item => {
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border border-purple-200 text-[#1E1B4B] shadow-[0_4px_16px_rgba(139,92,246,0.12)]'
                        : 'hover:bg-white/60 border border-transparent text-[#4B4568]'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-100/60 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E1B4B]">{item.label}</h4>
                      <p className="text-[10px] text-[#71688D] mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-purple-100 space-y-2">
            <button
              onClick={() => {
                if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white border border-purple-100 text-xs font-semibold text-[#7C3AED] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
              <span>Privacy Policy & Data Rights</span>
            </button>

            <button
              onClick={() => {
                onRestartOnboarding();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white border border-purple-100 text-xs font-semibold text-[#575073] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#8B5CF6]" />
              <span>Restart Onboarding Intro</span>
            </button>

            <div className="text-[10px] text-center text-[#8C84A6] pt-2">
              Echo Digital Companion • AI Studio
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
