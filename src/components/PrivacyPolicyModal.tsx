import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  Database,
  Cloud,
  Lock,
  Download,
  Trash2,
  RefreshCw,
  HardDrive,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Server,
  UserCheck,
} from 'lucide-react';
import { storageService } from '../lib/storageService';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearLocalData?: () => void;
  onClearCloudData?: () => Promise<void>;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onClearLocalData,
  onClearCloudData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sqlite' | 'firestore' | 'lifecycle' | 'actions'>('overview');
  const [isDeletingCloud, setIsDeletingCloud] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportData = () => {
    try {
      const data = {
        profile: storageService.getProfile(),
        conversations: storageService.getConversations(),
        recentSearches: storageService.getRecentSearches(),
        exportedAt: new Date().toISOString(),
        version: 'Echo AI Assistant 2.5',
      };
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `echo-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionMessage('Data exported successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage('Failed to export data');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleClearLocal = () => {
    if (window.confirm('Clear all local SQLite and browser storage? Your cloud data in Firestore will remain safe.')) {
      if (onClearLocalData) {
        onClearLocalData();
      }
      setActionMessage('Local SQLite cache cleared.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDeleteCloud = async () => {
    if (window.confirm('CRITICAL: Permanently delete all conversation records and profile data stored in Firebase Firestore? This cannot be undone.')) {
      setIsDeletingCloud(true);
      try {
        if (onClearCloudData) {
          await onClearCloudData();
        }
        setActionMessage('Firestore cloud data permanently deleted.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setActionMessage('Error deleting cloud data: ' + errorMessage);
      } finally {
        setIsDeletingCloud(false);
        setTimeout(() => setActionMessage(null), 3500);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#0D1017] border border-white/15 rounded-3xl shadow-2xl text-white flex flex-col z-10 overflow-hidden"
        >
          {/* Top Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#121622] to-cyan-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">Legal & Privacy Policy</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Dual DB Security
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Data storage lifecycle, SQLite WASM architecture & Firestore cloud sync
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#121622] px-4 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Policy Summary
            </button>

            <button
              onClick={() => setActiveTab('sqlite')}
              className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'sqlite'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              SQLite (Local)
            </button>

            <button
              onClick={() => setActiveTab('firestore')}
              className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'firestore'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Firestore (Cloud)
            </button>

            <button
              onClick={() => setActiveTab('lifecycle')}
              className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'lifecycle'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Data Lifecycle
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'actions'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Data Control & Purge
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-5 space-y-4 overflow-y-auto text-xs leading-relaxed max-h-[60vh]">
            {actionMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionMessage}</span>
              </motion.div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A29] border border-white/10 space-y-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Our Core Data Privacy Principles
                  </h3>
                  <p className="text-slate-300">
                    Echo AI Assistant operates on a **hybrid local-first architecture**. Your chats, voice audio transcripts, vision logs, and customized preferences are prioritized locally on your device in a WebAssembly SQLite database, ensuring minimal latency and complete offline capability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#121622] border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <HardDrive className="w-4 h-4" />
                      <span>Local SQLite Database</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Runs entirely inside your browser via WebAssembly (WASM). IndexedDB persists binary database state across page reloads without sending raw data to external servers.
                    </p>
                    <ul className="space-y-1 text-slate-400 text-[10px] list-disc list-inside">
                      <li>Offline availability</li>
                      <li>Instant local search & retrieval</li>
                      <li>Client-side encryption ready</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121622] border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Cloud className="w-4 h-4" />
                      <span>Firebase Firestore Sync</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Provides encrypted multi-device cloud synchronization. Your profile, session history, and metrics back up safely to Firebase under user-scoped security rules.
                    </p>
                    <ul className="space-y-1 text-slate-400 text-[10px] list-disc list-inside">
                      <li>User-scoped document security</li>
                      <li>Cross-device history recovery</li>
                      <li>1-click cloud data deletion</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#141A29] border border-white/10 space-y-2">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    AI API Processing (Gemini 3.6 Flash)
                  </h4>
                  <p className="text-slate-300 text-[11px]">
                    When you communicate with Echo, prompt queries and image payload data are proxied through our secure server-side routes (`/api/chat`, `/api/speech`, `/api/vision`) to Google Gemini models. API keys are kept securely on the backend server and are **never exposed to the browser client**.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: SQLITE (LOCAL) */}
            {activeTab === 'sqlite' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A29] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Database className="w-4.5 h-4.5" />
                      <span>SQLite Engine & Browser Storage</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Client-Side WASM
                    </span>
                  </div>
                  <p className="text-slate-300">
                    The local storage layer uses **sql.js**, an Emscripten-compiled C SQLite library compiled into WebAssembly. Every interaction is saved locally to an in-memory database and committed directly to browser **IndexedDB** (`EchoSQLiteStore`).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white text-xs">Stored Local Collections:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-1">
                      <span className="text-emerald-400 font-bold block">user_profile</span>
                      <span className="text-slate-400">UID, display name, energy points, streak, theme preferences.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-1">
                      <span className="text-emerald-400 font-bold block">conversations</span>
                      <span className="text-slate-400">Session IDs, conversation titles, AI models, message counts.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-1">
                      <span className="text-emerald-400 font-bold block">messages</span>
                      <span className="text-slate-400">Role, text content, voice duration, vision image URLs.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#121622] border border-white/5 space-y-1">
                      <span className="text-emerald-400 font-bold block">recent_searches</span>
                      <span className="text-slate-400">Search queries, multimodal tags, timestamp logs.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Local Data Lifespan:</strong> Clearing your browser history, site cache, or operating in Incognito mode without backup may reset local SQLite storage. We recommend periodic cloud sync or exporting your JSON backup.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FIRESTORE (CLOUD) */}
            {activeTab === 'firestore' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A29] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Cloud className="w-4.5 h-4.5" />
                      <span>Firebase Firestore Synchronization</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                      Cloud Security
                    </span>
                  </div>
                  <p className="text-slate-300">
                    When network connection is online, our background **Sync Engine** periodically replicates local delta changes to Google Cloud Firestore (`ai-studio-echoaiassistant-7b34de1a-b3cc-4433-9559-dbc02bf2dd76`).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-white text-xs">Firestore Security Schema & Rules:</h4>
                  <div className="p-3.5 rounded-xl bg-[#121622] border border-white/10 space-y-2 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-purple-400 font-bold">/users/&#123;userId&#125;</span>
                      <p className="text-slate-400 text-[10px] font-sans">
                        Restricted so only authenticated users with matching `request.auth.uid == userId` can read or modify.
                      </p>
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold">/users/&#123;userId&#125;/conversations/&#123;convId&#125;</span>
                      <p className="text-slate-400 text-[10px] font-sans">
                        Isolated chat sessions scoped to individual user records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-[11px] flex items-start gap-2">
                  <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Anonymous Authentication:</strong> Echo uses Firebase Anonymous Auth or Authorized Domain OAuth tokens so you can use cloud synchronization seamlessly without forcing complex password registration.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DATA LIFECYCLE */}
            {activeTab === 'lifecycle' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A29] border border-white/10 space-y-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    Data Flow Lifecycle Visualization
                  </h3>
                  <p className="text-slate-300 text-[11px]">
                    Trace how every chat message, voice query, and settings update travels through your local client and cloud infrastructure.
                  </p>
                </div>

                <div className="space-y-3 relative pl-4 border-l-2 border-emerald-500/30">
                  {/* Step 1 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D1017]" />
                    <span className="text-emerald-400 font-bold text-xs">1. User Interaction & Prompt Input</span>
                    <p className="text-slate-300 text-[11px]">
                      You speak into microphone, upload an image, or type a text message in Chat / Voice / Vision views.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D1017]" />
                    <span className="text-emerald-400 font-bold text-xs">2. Immediate Local WASM SQLite Save</span>
                    <p className="text-slate-300 text-[11px]">
                      Message is rendered instantly in UI and written into local SQLite database (`EchoSQLiteStore` IndexedDB).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#0D1017]" />
                    <span className="text-cyan-400 font-bold text-xs">3. Server Proxy AI Execution</span>
                    <p className="text-slate-300 text-[11px]">
                      Request sent over HTTPS to Express backend proxy (`/api/chat`). Gemini 3.6 Flash returns AI response and audio payload.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-purple-400 border-2 border-[#0D1017]" />
                    <span className="text-purple-400 font-bold text-xs">4. Background Sync Engine (Firestore)</span>
                    <p className="text-slate-300 text-[11px]">
                      If online, `syncEngine.ts` batches un-synced local records and securely uploads them to Firebase Firestore.
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#0D1017]" />
                    <span className="text-amber-400 font-bold text-xs">5. User Data Governance & Deletion</span>
                    <p className="text-slate-300 text-[11px]">
                      You hold total authority to export complete JSON backups or issue hard purge commands for local SQLite or cloud Firestore storage.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ACTIONS & PURGE */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A29] border border-white/10 space-y-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    Data Rights & Export Management
                  </h3>
                  <p className="text-slate-300 text-[11px]">
                    Manage your data lifecycle directly. Download a local backup, purge local SQLite browser state, or delete cloud records from Firebase.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Export */}
                  <div className="p-4 rounded-2xl bg-[#121622] border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-400" />
                        Export Complete JSON Backup
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Download a full JSON file containing your user profile, active chats, recent searches, and preferences.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors shrink-0 cursor-pointer active:scale-95"
                    >
                      Export JSON
                    </button>
                  </div>

                  {/* Clear Local */}
                  <div className="p-4 rounded-2xl bg-[#121622] border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-amber-400" />
                        Clear Local SQLite & Cache
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Clears local WebAssembly SQLite binary database from browser IndexedDB. Cloud records remain safe.
                      </p>
                    </div>
                    <button
                      onClick={handleClearLocal}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-colors shrink-0 cursor-pointer active:scale-95"
                    >
                      Clear SQLite
                    </button>
                  </div>

                  {/* Delete Cloud */}
                  <div className="p-4 rounded-2xl bg-[#121622] border border-red-500/30 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-red-300 text-xs flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-red-400" />
                        Permanently Delete Firestore Data
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Deletes user profile document and all conversation sub-collections from Firebase Firestore.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteCloud}
                      disabled={isDeletingCloud}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-xs transition-colors shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isDeletingCloud ? 'Deleting...' : 'Delete Cloud Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-white/10 bg-[#121622] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Compliant with client privacy & data governance standards</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
