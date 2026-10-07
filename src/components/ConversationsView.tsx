import React, { useState } from 'react';
import { ConversationSession, NavigationTab } from '../types';
import {
  MessageSquare,
  Search,
  Plus,
  Trash2,
  Download,
  ArrowLeft,
  Clock,
  Sparkles,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface ConversationsViewProps {
  conversations: ConversationSession[];
  activeSessionId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onBackToDashboard: () => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations,
  activeSessionId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (e: React.MouseEvent, conv: ConversationSession) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim() && onRenameConversation) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  const exportConversations = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `echo_conversations_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6 text-[#1E1B4B] pb-32 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="w-10 h-10 rounded-full bg-white/85 hover:bg-white border border-white/80 shadow-xs flex items-center justify-center text-[#575073] hover:text-[#7C3AED] transition-all cursor-pointer active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={exportConversations}
            className="px-3.5 py-2 rounded-full bg-white/80 hover:bg-white border border-white/80 text-[#575073] hover:text-[#7C3AED] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Export Conversations Data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={onNewConversation}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
          Conversation History
        </h1>
        <p className="text-xs sm:text-sm text-[#71688D]">
          Manage and review past chats, searches, and analysis sessions with Echo.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-2 p-2.5 pl-4 rounded-full bg-white border border-purple-100 shadow-sm focus-within:border-purple-300">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 bg-transparent text-sm text-[#1E1B4B] focus:outline-none placeholder-[#9CA3AF]"
        />
      </div>

      {/* FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        {['All', 'Pinned', 'Today', 'This Week'].map((filter, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (filter === 'All') setSearchTerm('');
              else setSearchTerm(filter.toLowerCase());
            }}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              idx === 0 && !searchTerm
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white/80 border border-white/80 text-[#575073] hover:bg-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* CONVERSATION LIST */}
      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/60 border border-white/80 text-[#71688D] text-xs">
            No conversations found. Start a new chat with Echo!
          </div>
        ) : (
          filteredConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`group flex items-center justify-between p-4 rounded-3xl cursor-pointer border transition-all duration-200 ${
                conv.id === activeSessionId
                  ? 'bg-purple-50/90 border-purple-200/90 shadow-[0_4px_20px_rgba(139,92,246,0.1)]'
                  : 'bg-white/85 hover:bg-white border-white/80 shadow-[0_4px_16px_rgba(139,92,246,0.05)]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100/80 border border-purple-200/60 text-[#7C3AED] flex items-center justify-center shrink-0 shadow-inner">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  {editingConvId === conv.id ? (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold text-[#1E1B4B] bg-white border border-[#7C3AED] rounded-xl focus:outline-none shadow-2xs w-full max-w-xs"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename(e as any, conv.id);
                          if (e.key === 'Escape') setEditingConvId(null);
                        }}
                      />
                      <button
                        onClick={e => handleSaveRename(e, conv.id)}
                        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-sm font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] truncate transition-colors">
                      {conv.title}
                    </h3>
                  )}
                  <p className="text-xs text-[#71688D] truncate mt-0.5 max-w-md">
                    {conv.preview || 'No messages yet'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8C84A6]">
                    <Clock className="w-3 h-3" />
                    <span>{conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'Recent'}</span>
                    <span>·</span>
                    <span className="capitalize">{conv.category || 'general'}</span>
                    <span>·</span>
                    <span>{conv.messages?.length || 0} messages</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={e => handleStartRename(e, conv)}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors"
                  title="Rename conversation"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
