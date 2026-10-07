import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  Upload,
  ArrowLeft,
  Sparkles,
  Search,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { aiService } from '../lib/aiService';
import { emotionEngine } from '../lib/emotionEngine';
import { useEchoEmotion } from '../lib/useEchoEmotion';
import { EchoRobot3D } from './EchoRobot3D';

interface VisionViewProps {
  onBackToDashboard: () => void;
  onSaveToSearchHistory: (query: string, preview: string) => void;
}

const QUICK_PROMPTS = [
  'What is this image?',
  'Explain this image in detail.',
  'Read any text found in this image.',
  'Identify key objects & colors.',
  'How can I improve this design?',
];

const SAMPLE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600',
    label: 'Retro Gaming Setup',
  },
  {
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600',
    label: 'UI Design Dashboard',
  },
  {
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    label: 'Code Matrix Visual',
  },
];

export const VisionView: React.FC<VisionViewProps> = ({
  onBackToDashboard,
  onSaveToSearchHistory,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [prompt, setPrompt] = useState<string>('Analyze this image in detail.');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file) return;
    setSelectedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const { state: echoState, subAction: echoSubAction } = useEchoEmotion();

  const handleAnalyze = async (customPrompt?: string) => {
    if (!selectedImage) return;

    const p = customPrompt || prompt;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    emotionEngine.setEmotion('thinking');

    try {
      const res = await aiService.analyzeImage(selectedImage, selectedMimeType, p);
      setAnalysisResult(res.text);
      onSaveToSearchHistory(p, res.text.slice(0, 60));
      emotionEngine.triggerEmote('excited', 3500);
    } catch (err: any) {
      setAnalysisResult('Error analyzing image. Please try again.');
      emotionEngine.triggerEmote('error', 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6 text-[#1E1B4B] pb-32 select-none">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-white/80 shadow-xs flex items-center justify-center text-[#575073] hover:text-[#7C3AED] transition-all cursor-pointer active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block shrink-0">
            <EchoRobot3D state={echoState} subAction={echoSubAction} size="sm" showBadge={false} />
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-white/80 text-[#7C3AED] text-xs font-bold shadow-xs">
            <Camera className="w-3.5 h-3.5" />
            <span>Search by Image</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
          Multimodal Vision AI
        </h1>
        <p className="text-xs sm:text-sm text-[#71688D]">
          Upload or capture an image for Echo to analyze, extract text, and explain in detail.
        </p>
      </div>

      {/* UPLOAD & PREVIEW AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Image Canvas / Dropzone */}
        <div className="flex flex-col space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-72 sm:h-80 w-full rounded-3xl border-2 border-dashed border-purple-200 hover:border-[#8B5CF6] bg-white/70 hover:bg-white/90 flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden transition-all group shadow-[0_8px_30px_rgba(139,92,246,0.06)]"
          >
            {selectedImage ? (
              <>
                <img
                  src={selectedImage}
                  alt="Vision target"
                  className="w-full h-full object-contain rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Click to change image</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-14 h-14 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7C3AED] group-hover:scale-110 transition-transform shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Upload or Drop Image</h3>
                  <p className="text-xs text-[#8C84A6] mt-1">
                    Supports PNG, JPG, WEBP formats up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Sample Images Selection */}
          <div className="space-y-2">
            <span className="text-xs text-[#575073] font-semibold uppercase tracking-wider block">
              Or Try Sample Image
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(sample.url);
                    setAnalysisResult(null);
                  }}
                  className="group relative h-16 rounded-2xl overflow-hidden border border-white/80 hover:border-[#8B5CF6] transition-all cursor-pointer shadow-xs"
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-end">
                    <span className="text-[10px] text-white truncate font-medium">
                      {sample.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prompts & Output */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <label className="text-xs text-[#575073] font-semibold uppercase tracking-wider block">
              What do you want to ask Echo?
            </label>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(qp);
                    if (selectedImage) handleAnalyze(qp);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-white/80 text-xs font-medium text-[#4A4363] hover:text-[#7C3AED] shadow-2xs transition-all active:scale-95 text-left cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Prompt Box */}
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-white border border-purple-100 shadow-sm focus-within:border-purple-300">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Type your question about the image..."
                className="flex-1 bg-transparent text-sm text-[#1E1B4B] placeholder-[#9CA3AF] focus:outline-none px-1"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={!selectedImage || isAnalyzing}
                className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {isAnalyzing ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Analyze</span>
              </button>
            </div>
          </div>

          {/* Analysis Result Box */}
          <div className="flex-1 min-h-[160px] p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(139,92,246,0.06)] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7C3AED]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>ECHO VISION ANALYSIS</span>
              </div>
              {analysisResult && (
                <span className="text-[10px] text-[#8C84A6] font-medium">Completed</span>
              )}
            </div>

            {isAnalyzing ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[#7C3AED] text-xs">
                <Sparkles className="w-6 h-6 animate-spin" />
                <span>Echo is analyzing visual features...</span>
              </div>
            ) : analysisResult ? (
              <div className="text-xs sm:text-sm text-[#1E1B4B] leading-relaxed whitespace-pre-wrap">
                {analysisResult}
              </div>
            ) : (
              <p className="text-xs text-[#8C84A6] italic py-6 text-center">
                Upload or select an image and tap "Analyze" to see Echo's findings.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
