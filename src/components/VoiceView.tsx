import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  ArrowLeft,
  Sparkles,
  Trash2,
  Pause,
  Play,
  Volume2,
  Keyboard,
  X,
} from 'lucide-react';
import { EchoState } from '../types';
import { audioService } from '../lib/audioService';
import { useEchoEmotion } from '../lib/useEchoEmotion';
import { emotionEngine } from '../lib/emotionEngine';

interface VoiceViewProps {
  onBackToDashboard: () => void;
  onSendMessage: (text: string) => Promise<string>;
  isStreaming?: boolean;
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  onBackToDashboard,
  onSendMessage,
  isStreaming = false,
}) => {
  const { state: robotState } = useEchoEmotion();
  const setRobotState = (s: EchoState) => emotionEngine.setEmotion(s);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Listening...');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [textInputValue, setTextInputValue] = useState<string>('');

  const DEFAULT_GREETING =
    "Hey there! What can I help you with today? Ask me anything—explanations, creative ideas, study help, or just a chat. I'm ready whenever you are. Feel free to start now, I'm listening always okay.";

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (isSpeaking) {
      audioService.stopSpeaking();
      setIsSpeaking(false);
    }

    setTranscript('');
    setIsListening(true);
    setRobotState('listening');
    setStatusText('Listening...');

    audioService.startListening(
      async (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          setIsListening(false);
          await processVoiceCommand(text);
        }
      },
      (err) => {
        setIsListening(false);
        const errStr = String(err?.message || err || '');
        if (errStr.includes('not-allowed') || err === 'not-allowed') {
          setRobotState('idle');
          setStatusText('Microphone permission required.');
          setShowTextInput(true);
        } else if (errStr.includes('no-speech') || err === 'no-speech') {
          setRobotState('idle');
          setStatusText('No speech detected. Tap microphone to speak.');
        } else {
          setRobotState('idle');
          setStatusText('Tap microphone to speak');
        }
      },
      () => {
        setIsListening(false);
        if (!transcript) {
          setRobotState('idle');
          setStatusText('Tap microphone to speak');
        }
      }
    );
  };

  const stopListening = () => {
    audioService.stopListening();
    setIsListening(false);
    setRobotState('idle');
    setStatusText('Paused');
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setAssistantReply('');
    if (isSpeaking) {
      audioService.stopSpeaking();
      setIsSpeaking(false);
    }
    setRobotState('idle');
    setStatusText('Listening...');
    startListening();
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInputValue.trim()) return;
    const input = textInputValue.trim();
    setTextInputValue('');
    setTranscript(input);
    setShowTextInput(false);
    await processVoiceCommand(input);
  };

  const processVoiceCommand = async (userInput: string) => {
    if (isStreaming) return;
    setRobotState('thinking');
    setStatusText('Thinking...');

    try {
      const responseText = await onSendMessage(userInput);
      setAssistantReply(responseText);
      setRobotState('speaking');
      setIsSpeaking(true);
      setStatusText('Speaking...');

      // Speak text aloud
      audioService.speakText(responseText, 1.0, 1.0, () => {
        setIsSpeaking(false);
        setRobotState('idle');
        setStatusText('Listening...');
        startListening();
      });
    } catch (err) {
      setRobotState('error');
      setStatusText('Something went wrong. Please try again.');
      setTimeout(() => setRobotState('idle'), 3000);
    }
  };

  useEffect(() => {
    startListening();
    return () => {
      audioService.stopListening();
      audioService.stopSpeaking();
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#F3EDFB] via-[#F8F2FD] to-[#ECE2FA] text-[#1E1B4B] flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Soft Pastel Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-purple-200/35 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP HEADER (Matching Reference Screen 3) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-4 z-10">
        {/* Back Button */}
        <button
          onClick={onBackToDashboard}
          className="w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-white/80 shadow-xs flex items-center justify-center text-[#575073] hover:text-[#7C3AED] transition-all cursor-pointer active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Right Sparkles Button */}
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-white/80 shadow-xs flex items-center justify-center text-[#7C3AED] transition-all cursor-pointer active:scale-95"
          title="Keyboard or Prompt"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* CONVERSATIONAL PROMPT / TRANSCRIPT AREA (Matching Reference Screen 3) */}
      <div className="w-full max-w-md mx-auto my-auto z-10 px-2 space-y-6">
        <div className="min-h-[140px] flex items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {transcript ? (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">You asked</span>
                <p className="text-xl sm:text-2xl font-bold text-[#1E1B4B] leading-relaxed">
                  {transcript}
                </p>
              </motion.div>
            ) : assistantReply ? (
              <motion.div
                key="reply"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">Echo says</span>
                <p className="text-base sm:text-lg font-medium text-[#4A4363] leading-relaxed max-h-48 overflow-y-auto no-scrollbar">
                  {assistantReply}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-base sm:text-lg font-normal text-[#6D6789]/90 leading-relaxed max-w-sm mx-auto"
              >
                {DEFAULT_GREETING}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Fallback Keyboard Input if Toggled */}
        {showTextInput && (
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-2 animate-fade-in">
            <input
              type="text"
              value={textInputValue}
              onChange={e => setTextInputValue(e.target.value)}
              placeholder="Type your message to Echo..."
              className="flex-1 px-4 py-2.5 rounded-full bg-white/90 border border-white/80 text-xs text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none shadow-sm"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              Send
            </button>
          </form>
        )}

        {/* CENTER INTERACTION (Matching Reference Screen 3: "Listening..." + Big Purple Mic) */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-4">
          {/* Status Label (e.g. "Listening...") */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6D6789]">
            {isListening && (
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping" />
            )}
            <span>{statusText}</span>
          </div>

          {/* Large Floating Glowing Purple Microphone Circle */}
          <div className="relative flex items-center justify-center">
            {/* Concentric Glowing Aura Rings */}
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-purple-300/30 animate-pulse pointer-events-none" />
                <div className="absolute w-36 h-36 rounded-full border border-purple-300/40 animate-ping pointer-events-none" />
              </>
            )}

            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-[0_12px_45px_rgba(139,92,246,0.28)] transition-all duration-300 active:scale-90 cursor-pointer ${
                isListening
                  ? 'bg-white border-2 border-purple-200 text-[#7C3AED]'
                  : 'bg-white border border-purple-100 text-[#8C84A6] hover:text-[#7C3AED]'
              }`}
              title={isListening ? 'Tap to pause' : 'Tap to start speaking'}
            >
              {isListening ? (
                <Mic className="w-8 h-8 text-[#7C3AED] animate-pulse" />
              ) : (
                <MicOff className="w-7 h-7 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROL DOCK (Matching Reference Screen 3) */}
      <div className="w-full max-w-md mx-auto pb-6 z-10">
        <div className="flex items-center justify-between px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(139,92,246,0.08)]">
          {/* Left: Trash Button (clears transcript) */}
          <button
            onClick={handleClearTranscript}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-red-500 border border-white/80 flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Clear transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Center: Live Waveform Visualizer (Reference: Vertical undulating sound bars) */}
          <div className="flex items-center gap-1.5 h-8 px-2">
            {[40, 75, 55, 95, 65, 35, 85, 50, 70, 45, 90, 60, 30].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isListening || isSpeaking
                    ? 'bg-[#7C3AED] animate-pulse'
                    : 'bg-slate-300'
                }`}
                style={{
                  height: isListening || isSpeaking ? `${h * 0.3}px` : '6px',
                  animationDelay: `${i * 90}ms`,
                }}
              />
            ))}
          </div>

          {/* Right: Pause / Play Toggle Button */}
          <button
            onClick={toggleListening}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-[#7C3AED] border border-white/80 flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
            title={isListening ? 'Pause listening' : 'Resume'}
          >
            {isListening ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
