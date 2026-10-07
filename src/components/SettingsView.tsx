import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  Settings,
  Volume2,
  Sliders,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Info,
  LogOut,
  LogIn,
  Bell,
  Lock,
  Database,
  Moon,
  Zap,
  CheckCircle2,
  Globe,
  Smartphone,
  Battery,
  BatteryCharging,
} from 'lucide-react';
import { useEchoEmotion } from '../lib/useEchoEmotion';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onClearData: () => void;
  onBackToDashboard: () => void;
  onOpenPrivacyPolicy?: () => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onClearData,
  onBackToDashboard,
  onOpenPrivacyPolicy,
  isAuthenticated = false,
  onOpenAuthModal,
  onLogout,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [saveToast, setSaveToast] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTheme, setSelectedTheme] = useState('Pastel Lavender');
  const [preferredNameInput, setPreferredNameInput] = useState(userProfile.name || '');

  const { lowPowerMode, setLowPowerMode: updateLowPowerMode, toggleLowPowerMode } = useEchoEmotion();

  const handlePreferenceChange = (key: keyof UserProfile['preferences'], value: any) => {
    const updated: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [key]: value,
      },
    };
    setProfile(updated);
    onUpdateProfile(updated);
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6 text-[#1E1B4B] pb-32 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-white/80 shadow-xs flex items-center justify-center text-[#575073] hover:text-[#7C3AED] transition-all cursor-pointer active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-white/80 text-[#7C3AED] text-xs font-bold shadow-xs">
          <Settings className="w-3.5 h-3.5" />
          <span>ECHO SYSTEM SETTINGS</span>
        </div>
      </div>

      {/* BANNER HEADER */}
      <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(139,92,246,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-xs shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1E1B4B] tracking-wide">Echo Preferences & Controls</h1>
            <p className="text-xs text-[#71688D]">Manage voice synthesis, AI models, appearance, and local offline cache.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[11px] font-semibold text-[#7C3AED] shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>v2.5 System Active</span>
        </div>
      </div>

      {/* 0. USER ACCOUNT & AUTHENTICATION */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 space-y-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Echo Account & Identity</span>
          </div>

          {isAuthenticated ? (
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              Authenticated Account
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7C3AED] text-[11px] font-bold">
              Guest Local Mode
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100/70">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1B4B]">{profile.name || 'Guest User'}</h3>
              <p className="text-xs text-[#71688D]">{profile.email || 'Sign in to sync your conversation history'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Preferred Name Personalization Input */}
        <div className="pt-1 space-y-2">
          <label className="text-xs font-semibold text-[#575073] block">
            Preferred Name (Echo will address you naturally by this name)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={preferredNameInput}
              onChange={e => setPreferredNameInput(e.target.value)}
              placeholder="e.g. Jackson"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-purple-100 text-xs text-[#1E1B4B] focus:border-[#7C3AED] focus:outline-none shadow-2xs"
            />
            <button
              onClick={() => {
                if (preferredNameInput.trim()) {
                  const updated: UserProfile = {
                    ...profile,
                    name: preferredNameInput.trim(),
                  };
                  setProfile(updated);
                  onUpdateProfile(updated);
                  showToast();
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-purple-50 text-[#7C3AED] border border-purple-200 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              Save Name
            </button>
          </div>
        </div>
      </div>

      {/* 1. AI & VOICE SETTINGS */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 space-y-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)]">
        <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
          <Volume2 className="w-4 h-4" />
          <span>Voice & AI Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Voice model selection */}
          <div className="space-y-1.5">
            <label className="text-[#575073] font-medium">TTS Voice Model</label>
            <select
              value={profile.preferences.ttsVoice}
              onChange={e => handlePreferenceChange('ttsVoice', e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-white border border-purple-100 text-[#1E1B4B] focus:border-[#7C3AED] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="Kore">Kore (Warm Female)</option>
              <option value="Puck">Puck (Friendly Male)</option>
              <option value="Zephyr">Zephyr (Futuristic Clear)</option>
              <option value="Fenrir">Fenrir (Deep Voice)</option>
            </select>
          </div>

          {/* AI Model selector */}
          <div className="space-y-1.5">
            <label className="text-[#575073] font-medium">Default AI Model</label>
            <select
              value={profile.preferences.selectedAiModel}
              onChange={e => handlePreferenceChange('selectedAiModel', e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-white border border-purple-100 text-[#1E1B4B] focus:border-[#7C3AED] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast & Balanced)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
            </select>
          </div>

          {/* Auto speak toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div>
              <span className="font-semibold text-[#1E1B4B] block">Auto-speak Responses</span>
              <span className="text-[10px] text-[#71688D]">Read AI answers out loud automatically</span>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.autoSpeak}
              onChange={e => handlePreferenceChange('autoSpeak', e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
            />
          </div>

          {/* Sound effects toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div>
              <span className="font-semibold text-[#1E1B4B] block">UI Sound Effects</span>
              <span className="text-[10px] text-[#71688D]">Futuristic audio chimes on voice trigger</span>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.soundEffects}
              onChange={e => handlePreferenceChange('soundEffects', e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. APPEARANCE & GLOW */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 space-y-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)]">
        <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
          <Moon className="w-4 h-4" />
          <span>Appearance & Visual Effects</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div>
              <span className="font-semibold text-[#1E1B4B] block">Soft Lavender Glassmorphism</span>
              <span className="text-[10px] text-[#71688D]">Enable pastel ambient radiance and frosted surfaces</span>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.themeGlow}
              onChange={e => handlePreferenceChange('themeGlow', e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#575073] font-medium">Theme Style</label>
              <select
                value={selectedTheme}
                onChange={e => setSelectedTheme(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-white border border-purple-100 text-[#1E1B4B] focus:border-[#7C3AED] focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="Pastel Lavender">Pastel Lavender (Soft Violet)</option>
                <option value="Pure Crystal">Pure Crystal (Frosted White)</option>
                <option value="Twilight Glow">Twilight Glow (Deep Purple)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#575073] font-medium">Language</label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-white border border-purple-100 text-[#1E1B4B] focus:border-[#7C3AED] focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="English">English (US)</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
                <option value="Japanese">日本語</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. BATTERY & PERFORMANCE / LOW POWER MODE */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 space-y-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Battery & Power Performance</span>
          </div>

          {lowPowerMode.batteryLevel !== null && lowPowerMode.batteryLevel !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              {lowPowerMode.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{Math.round((lowPowerMode.batteryLevel || 0) * 100)}% {lowPowerMode.isCharging ? '(Charging)' : ''}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1E1B4B] block">Low Power Mode</span>
                {lowPowerMode.enabled && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px]">
                    15 FPS Active
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#71688D]">
                Throttles 3D mascot frame rate to 15 FPS and simplifies graphics to extend battery life and reduce CPU usage
              </span>
            </div>
            <input
              type="checkbox"
              checked={lowPowerMode.enabled}
              onChange={e => {
                updateLowPowerMode(e.target.checked, 'manual');
                handlePreferenceChange('lowPowerMode', e.target.checked);
              }}
              className="w-4 h-4 accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100/40 text-[11px] text-[#575073] space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>Auto-Battery Detection (≤ 20%)</span>
              <span className="text-emerald-600">Enabled</span>
            </div>
            <p className="text-[10px]">
              {lowPowerMode.enabled
                ? `Low Power Mode active (${lowPowerMode.reason || 'manual'}). 3D mascot rendering throttled from 60 FPS to 15 FPS.`
                : 'Full performance mode active (60 FPS rendering with anti-aliasing and ambient particle effects).'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. DATA, PRIVACY & OFFLINE MODE */}
      <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 space-y-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)]">
        <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Data, Privacy & Storage</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div>
              <span className="font-semibold text-[#1E1B4B] block">Offline Caching & IndexedDB</span>
              <span className="text-[10px] text-[#71688D]">Keep conversations available when offline</span>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.offlineCaching}
              onChange={e => handlePreferenceChange('offlineCaching', e.target.checked)}
              className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#1E1B4B] block">Privacy Policy & Data Lifecycle</span>
              <span className="text-[10px] text-[#71688D]">View detailed explanation of SQLite local WASM & Firestore sync</span>
            </div>
            <button
              onClick={() => onOpenPrivacyPolicy?.()}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-purple-50 text-[#7C3AED] border border-purple-200 font-semibold transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              View Policy
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-[#7C3AED]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#1E1B4B] block">Data Synchronization</span>
                <span className="text-[10px] text-[#71688D]">Automatic local background sync</span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Synced
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-800 block">Clear Local SQLite Cache</span>
              <span className="text-[10px] text-amber-700/80">Clears local SQLite database without deleting Firebase cloud records</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your local SQLite cache? Your cloud data in Firebase will remain safe.')) {
                  onClearData();
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 font-semibold transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/50 border border-red-100">
            <div className="space-y-0.5">
              <span className="font-semibold text-red-800 block">Delete Cloud Firebase Data</span>
              <span className="text-[10px] text-red-700/80">Permanently delete all your cloud-stored conversations and settings from Firebase</span>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('CRITICAL WARNING: This will permanently delete all your cloud data from Firebase. Are you sure?')) {
                  try {
                    const { databaseService } = await import('../lib/databaseService');
                    await databaseService.deleteCloudData();
                    onClearData();
                    alert('Cloud data deleted successfully.');
                  } catch (e) {
                    alert('Error deleting cloud data: ' + (e as any)?.message);
                  }
                }
              }}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-red-50 text-red-700 border border-red-200 font-semibold transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              Delete Cloud Data
            </button>
          </div>
        </div>
      </div>

      {/* ABOUT ECHO */}
      <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 space-y-2 text-center text-xs text-[#71688D] shadow-xs">
        <div className="flex items-center justify-center gap-2 text-[#7C3AED] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Echo Digital Companion v2.5</span>
        </div>
        <p>Built with React 19, Tailwind CSS, Three.js 3D Engine, and Gemini 3.6 Flash API.</p>
      </div>

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-[#7C3AED] text-white font-bold text-xs shadow-2xl z-50 animate-bounce">
          ✓ Echo settings saved successfully!
        </div>
      )}
    </div>
  );
};
