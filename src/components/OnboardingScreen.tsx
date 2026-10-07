import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { EchoRobot3D } from './EchoRobot3D';
import confetti from 'canvas-confetti';

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  const handleGetStarted = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#8B5CF6', '#C026D3', '#EC4899', '#38BDF8'],
    });
    onStart();
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#F3EDFB] via-[#F7F2FD] to-[#ECE2FA] text-[#1E1B4B] flex flex-col justify-between items-center p-6 overflow-hidden select-none">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[380px] h-[380px] bg-purple-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-pink-200/35 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[480px] h-[380px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Title Section (Matching Reference Screen 1) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm pt-6 z-10 text-left"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight leading-tight">
            Meet Your 🤖
            <br />
            Smart <span className="text-[#8B5CF6]">AI</span> Assistant
          </h1>
        </div>
      </motion.div>

      {/* Mascot Center Showcase with Speech Bubble */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-sm">
        {/* Floating Speech Bubble (Matching Reference Screen 1) */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative self-end mr-6 mb-2"
        >
          <div className="px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 text-xs font-medium text-[#4A4560] shadow-[0_4px_20px_rgba(139,92,246,0.08)]">
            Need help? We're ready for you
          </div>
          {/* Subtle bubble tail pointer */}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white/80 rotate-45 border-r border-b border-white/80 shadow-[2px_2px_4px_rgba(139,92,246,0.04)]" />
        </motion.div>

        {/* 3D Robot Companion */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative flex items-center justify-center"
        >
          {/* Soft Ground Shadow */}
          <div className="absolute -bottom-2 w-44 h-8 bg-purple-950/10 rounded-full blur-xl pointer-events-none animate-pulse" />
          <EchoRobot3D state="idle" size="lg" interactive={true} />
        </motion.div>
      </div>

      {/* Bottom Floating "Get Started" Pill Action (Matching Reference Screen 1) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-sm pb-4 z-10"
      >
        <button
          onClick={handleGetStarted}
          className="w-full group relative flex items-center justify-between px-5 py-3.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-xl border border-white/80 text-[#1E1B4B] shadow-[0_10px_30px_rgba(139,92,246,0.12)] hover:shadow-[0_12px_35px_rgba(139,92,246,0.18)] transition-all duration-300 active:scale-95 cursor-pointer"
        >
          {/* Mini robot circle avatar */}
          <div className="w-8 h-8 rounded-full bg-purple-100/80 border border-purple-200/60 flex items-center justify-center text-sm shadow-inner shrink-0">
            🤖
          </div>

          <span className="text-sm font-bold text-[#1E1B4B] tracking-wide">
            Get Started
          </span>

          {/* Subtle chevron arrows >>> */}
          <div className="flex items-center text-slate-400 group-hover:text-[#8B5CF6] transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 -mr-2" />
            <ChevronRight className="w-4 h-4 -mr-2" />
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </motion.div>
    </div>
  );
};
