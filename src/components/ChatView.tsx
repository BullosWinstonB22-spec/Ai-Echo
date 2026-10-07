import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  X,
  Zap,
  Plus,
} from 'lucide-react';
import { ChatMessage, ConversationSession, EchoState } from '../types';
import { EchoRobot3D } from './EchoRobot3D';
import { audioService } from '../lib/audioService';
import { useEchoEmotion } from '../lib/useEchoEmotion';
import { emotionEngine } from '../lib/emotionEngine';

interface ChatViewProps {
  session: ConversationSession;
  onSendMessage: (text: string, imageUrl?: string, fileName?: string) => Promise<void>;
  onBackToDashboard: () => void;
  onUpdateRobotState: (state: EchoState) => void;
  isStreaming?: boolean;
  onNewConversation?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  session,
  onSendMessage,
  onBackToDashboard,
  onUpdateRobotState,
  isStreaming = false,
  onNewConversation,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, 'like' | 'dislike' | null>>({});

  const isLoading = isSending || isStreaming;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isLoading]);

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage && !attachedFileName) || isLoading) return;

    const textToSend = inputText.trim() || (selectedImage ? 'Analyze attached image' : 'Analyze file');
    const img = selectedImage || undefined;
    const file = attachedFileName || undefined;

    setInputText('');
    setSelectedImage(null);
    setAttachedFileName(null);
    setIsSending(true);

    onUpdateRobotState('thinking');

    try {
      await onSendMessage(textToSend, img, file);
      onUpdateRobotState('speaking');
      setTimeout(() => onUpdateRobotState('idle'), 2500);
    } catch (err) {
      onUpdateRobotState('error');
      setTimeout(() => onUpdateRobotState('idle'), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSend();
    }
  };

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generic File Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
    }
  };

  // Toggle Voice Input in Chat
  const toggleVoiceInput = () => {
    if (isListening) {
      audioService.stopListening();
      setIsListening(false);
      onUpdateRobotState('idle');
    } else {
      setIsListening(true);
      onUpdateRobotState('listening');
      audioService.startListening(
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            onUpdateRobotState('idle');
          }
        },
        (err) => {
          console.error('Chat voice error:', err);
          setIsListening(false);
          onUpdateRobotState('idle');
        },
        () => {
          setIsListening(false);
          onUpdateRobotState('idle');
        }
      );
    }
  };

  // Copy Message text
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Speak response out loud
  const toggleSpeakResponse = (text: string, id: string) => {
    if (speakingMessageId === id) {
      audioService.stopSpeaking();
      setSpeakingMessageId(null);
      onUpdateRobotState('idle');
    } else {
      setSpeakingMessageId(id);
      onUpdateRobotState('speaking');
      audioService.speakText(text, 1.0, 1.0, () => {
        setSpeakingMessageId(null);
        onUpdateRobotState('idle');
      });
    }
  };

  // Toggle Like / Dislike
  const toggleLikeState = (id: string, state: 'like' | 'dislike') => {
    const nextState = likedMap[id] === state ? null : state;
    setLikedMap(prev => ({
      ...prev,
      [id]: nextState,
    }));

    if (nextState === 'like') {
      emotionEngine.triggerEmote('love', 3500);
    } else if (nextState === 'dislike') {
      emotionEngine.triggerEmote('sad', 2500);
    }
  };

  const { state: echoState, subAction: echoSubAction } = useEchoEmotion();

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto text-[#1E1B4B] bg-gradient-to-b from-[#F3EDFB] via-[#F8F2FD] to-[#ECE2FA] overflow-hidden select-none">
      {/* TOP CHAT HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/80 bg-white/80 backdrop-blur-xl z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-full bg-white hover:bg-purple-50 text-[#575073] hover:text-[#7C3AED] border border-white/80 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center shadow-inner">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-1.5">
                <span>Echo Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED]">
                  Gemini 3.6
                </span>
              </h2>
              <p className="text-[11px] text-[#71688D] truncate max-w-[200px] sm:max-w-xs">{session.title}</p>
            </div>
          </div>
        </div>

        {/* Top Actions: New Chat button & 3D Mascot Widget */}
        <div className="flex items-center gap-2 shrink-0">
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 text-[#7C3AED] border border-purple-200 text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}

          <div className="hidden sm:block shrink-0">
            <EchoRobot3D state={echoState} subAction={echoSubAction} size="sm" showBadge={false} />
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
        {session.messages.map(msg => {
          const isUser = msg.role === 'user';
          const isLiked = likedMap[msg.id];

          // Ensure AI message content is not wrapped in unwanted outer quotation marks
          let displayContent = msg.content || '';
          if (!isUser) {
            const trimmed = displayContent.trim();
            if (
              (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
              (trimmed.startsWith('“') && trimmed.endsWith('”') && trimmed.length >= 2)
            ) {
              displayContent = trimmed.slice(1, -1).trim();
            }
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-end gap-2.5 max-w-[90%] sm:max-w-[82%]">
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7C3AED] shrink-0 mb-1 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`relative p-4 rounded-3xl ${
                    isUser
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-br-xs shadow-md shadow-purple-500/15'
                      : 'bg-white/90 border border-white/80 text-[#1E1B4B] rounded-bl-xs shadow-[0_4px_20px_rgba(139,92,246,0.06)]'
                  }`}
                >
                  {/* Image Attachment Preview in Bubble */}
                  {msg.imageUrl && (
                    <div className="mb-3 rounded-2xl overflow-hidden max-h-60 border border-white/40">
                      <img src={msg.imageUrl} alt="Attached" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* File Attachment Label */}
                  {msg.fileName && (
                    <div className="mb-2 p-2 rounded-xl bg-purple-50 text-xs flex items-center gap-2 text-[#7C3AED]">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate">{msg.fileName}</span>
                    </div>
                  )}

                  {/* Message Text Content */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-normal">
                    {displayContent}
                  </div>

                  {/* Grounding Sources / Links */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-purple-100 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#7C3AED] font-bold block">
                        Verified Sources:
                      </span>
                      {msg.groundingChunks.map((chunk, idx) =>
                        chunk.web ? (
                          <a
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline truncate"
                          >
                            🔗 {chunk.web.title || chunk.web.uri}
                          </a>
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Timestamp and Actions Footer */}
                  <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-black/5 text-[10px]">
                    <span className={isUser ? 'text-purple-200' : 'text-[#8C84A6]'}>
                      {msg.timestamp}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-[#71688D]">
                        {/* Copy button */}
                        <button
                          onClick={() => copyToClipboard(displayContent, msg.id)}
                          className="p-1 rounded-md hover:bg-purple-50 transition-colors"
                          title="Copy"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Read Aloud button */}
                        <button
                          onClick={() => toggleSpeakResponse(displayContent, msg.id)}
                          className="p-1 rounded-md hover:bg-purple-50 transition-colors"
                          title="Read aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-[#7C3AED] animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Like button */}
                        <button
                          onClick={() => toggleLikeState(msg.id, 'like')}
                          className={`p-1 rounded-md hover:bg-purple-50 transition-colors ${
                            isLiked === 'like' ? 'text-[#7C3AED]' : ''
                          }`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Dislike button */}
                        <button
                          onClick={() => toggleLikeState(msg.id, 'dislike')}
                          className={`p-1 rounded-md hover:bg-purple-50 transition-colors ${
                            isLiked === 'dislike' ? 'text-rose-500' : ''
                          }`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* AI Thinking State */}
        {isLoading && (
          <div className="flex items-center gap-3 text-[#7C3AED] text-xs p-3 rounded-2xl bg-white/80 border border-white/80 shadow-xs max-w-fit animate-pulse">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#5B5478]">
              <span>Echo is thinking</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT ATTACHMENT PREVIEW */}
      {(selectedImage || attachedFileName) && (
        <div className="px-4 py-2 bg-white/80 border-t border-white/80 flex items-center justify-between text-xs text-[#575073]">
          <div className="flex items-center gap-2">
            {selectedImage && (
              <img src={selectedImage} alt="Upload preview" className="w-8 h-8 rounded-lg object-cover" />
            )}
            {attachedFileName && (
              <span className="flex items-center gap-1.5 text-[#7C3AED] font-medium">
                <Paperclip className="w-3.5 h-3.5" />
                {attachedFileName}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedImage(null);
              setAttachedFileName(null);
            }}
            className="p-1 rounded-full hover:bg-purple-100 text-[#575073]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BOTTOM INPUT BAR (Matching Screen 2 Pill Style) */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-white/80 z-20">
        <div className="flex items-end gap-2 p-1.5 pl-3 rounded-full bg-white border border-purple-100 shadow-[0_4px_20px_rgba(139,92,246,0.08)] focus-within:border-purple-300 transition-all">
          {/* File input button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Image upload button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-full text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors cursor-pointer"
            title="Attach image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask Echo anything...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#1E1B4B] placeholder-[#9CA3AF] resize-none focus:outline-none max-h-24 py-2 px-1"
          />

          {/* Voice Mic Input */}
          <button
            onClick={toggleVoiceInput}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isListening
                ? 'bg-[#7C3AED] text-white animate-pulse'
                : 'text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50'
            }`}
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage && !attachedFileName) || isLoading}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title={isLoading ? 'Generating response...' : 'Send'}
          >
            {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
