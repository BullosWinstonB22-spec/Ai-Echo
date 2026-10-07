import React from 'react';
import { motion } from 'motion/react';
import { Home, MessageSquareText, Mic, Camera, Clock } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'voice', label: 'Talk', icon: <Mic className="w-5 h-5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquareText className="w-5 h-5" /> },
    { id: 'image-search', label: 'Vision', icon: <Camera className="w-5 h-5" /> },
    { id: 'conversations', label: 'History', icon: <Clock className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md select-none">
      <div className="relative flex items-center justify-around py-2 px-3 rounded-full bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_rgba(139,92,246,0.12)]">
        {navItems.map(item => {
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all cursor-pointer group"
            >
              {/* Active Glow Backdrop */}
              {isActive && (
                <motion.div
                  layoutId="activeNavTab"
                  className="absolute inset-0 rounded-full bg-purple-100/90 border border-purple-200/60 shadow-[0_2px_12px_rgba(139,92,246,0.15)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-[#7C3AED] scale-105' : 'text-[#8A84A6] group-hover:text-[#4A4560]'
                }`}
              >
                {item.icon}
              </div>

              <span
                className={`relative z-10 text-[10px] font-semibold mt-0.5 transition-colors duration-200 ${
                  isActive ? 'text-[#7C3AED]' : 'text-[#9C96B8] group-hover:text-[#6A6484]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
