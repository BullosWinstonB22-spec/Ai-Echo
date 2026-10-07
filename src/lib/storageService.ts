import { UserProfile, ConversationSession, RecentSearch, ChatMessage } from '../types';
import { databaseService } from './databaseService';
import { getCurrentUserUID } from './firebase';

const STORAGE_KEYS = {
  USER_PROFILE: 'echo_user_profile',
  CONVERSATIONS: 'echo_conversations',
  RECENT_SEARCHES: 'echo_recent_searches',
  ONBOARDING_COMPLETED: 'echo_onboarding_completed',
};

const getScopedKey = (base: string) => `${base}_${getCurrentUserUID()}`;

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  email: 'alex.mercer@echo.ai',
  avatarUrl: '',
  memberSince: 'August 2026',
  totalQueries: 128,
  preferences: {
    themeGlow: true,
    glowIntensity: 4,
    ttsVoice: 'Kore',
    autoSpeak: false,
    speechRate: 1.0,
    speechPitch: 1.0,
    soundEffects: true,
    hapticFeedback: true,
    offlineCaching: true,
    selectedAiModel: 'gemini-3.6-flash',
  },
};

export const INITIAL_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: 'rs-1',
    query: 'Recommendation for colours...',
    category: 'image',
    timestamp: '10 mins ago',
    preview: 'Mint green & turquoise palette suggestions for mobile futuristic interface',
    status: 'completed',
  },
  {
    id: 'rs-2',
    query: 'How should my UX design p...',
    category: 'chat',
    timestamp: '1 hour ago',
    preview: 'Micro-interactions and glowing cards hierarchy for Echo dashboard',
    status: 'completed',
  },
  {
    id: 'rs-3',
    query: 'What is Firebase?',
    category: 'chat',
    timestamp: 'Yesterday',
    preview: 'Firebase platform overview, Firestore security rules and Auth setup',
    status: 'saved',
  },
  {
    id: 'rs-4',
    query: 'Help me debug this code',
    category: 'code',
    timestamp: '2 days ago',
    preview: 'TypeScript async function handling and error boundaries',
    status: 'completed',
  },
];

export const INITIAL_CONVERSATION: ConversationSession = {
  id: 'conv-default',
  title: 'Welcome to Echo AI',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: 'general',
  preview: 'Hello! I am Echo, your personal digital companion.',
  messages: [
    {
      id: 'm-1',
      role: 'assistant',
      content: 'Hello Alex! I am **Echo**, your intelligent digital companion. How can I assist you right now? You can talk with me via voice, send chat messages, or upload an image to analyze.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.6-flash',
    },
  ],
};

export const storageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.USER_PROFILE));
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(getScopedKey(STORAGE_KEYS.USER_PROFILE), JSON.stringify(profile));
      databaseService.saveUser(profile).catch(err => console.error('DB saveUser error:', err));
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  },

  getRecentSearches(): RecentSearch[] {
    try {
      const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.RECENT_SEARCHES));
      return data ? JSON.parse(data) : INITIAL_RECENT_SEARCHES;
    } catch {
      return INITIAL_RECENT_SEARCHES;
    }
  },

  addRecentSearch(search: Omit<RecentSearch, 'id' | 'timestamp'>): RecentSearch {
    const searches = this.getRecentSearches();
    const newSearch: RecentSearch = {
      ...search,
      id: 'rs-' + Date.now(),
      timestamp: 'Just now',
    };
    const updated = [newSearch, ...searches.slice(0, 15)];
    try {
      localStorage.setItem(getScopedKey(STORAGE_KEYS.RECENT_SEARCHES), JSON.stringify(updated));
      databaseService.saveRecentSearch(newSearch).catch(err => console.error('DB saveRecentSearch error:', err));
    } catch (err) {
      console.error('Failed to save recent searches:', err);
    }
    return newSearch;
  },

  deleteRecentSearch(id: string): void {
    const searches = this.getRecentSearches().filter(s => s.id !== id);
    try {
      localStorage.setItem(getScopedKey(STORAGE_KEYS.RECENT_SEARCHES), JSON.stringify(searches));
      databaseService.deleteRecentSearch(id).catch(err => console.error('DB deleteRecentSearch error:', err));
    } catch (err) {
      console.error('Failed to delete search:', err);
    }
  },

  getConversations(): ConversationSession[] {
    try {
      const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.CONVERSATIONS));
      if (!data) {
        this.saveConversations([INITIAL_CONVERSATION]);
        return [INITIAL_CONVERSATION];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_CONVERSATION];
    }
  },

  saveConversations(conversations: ConversationSession[]): void {
    try {
      localStorage.setItem(getScopedKey(STORAGE_KEYS.CONVERSATIONS), JSON.stringify(conversations));
      for (const conv of conversations) {
        databaseService.saveConversation(conv).catch(err => console.error('DB saveConversation error:', err));
      }
    } catch (err) {
      console.error('Failed to save conversations:', err);
    }
  },

  getConversation(id: string): ConversationSession | null {
    const list = this.getConversations();
    return list.find(c => c.id === id) || null;
  },

  saveMessage(session: ConversationSession, message: ChatMessage): ConversationSession {
    const updatedMessages = [...session.messages, message];
    const updatedSession: ConversationSession = {
      ...session,
      messages: updatedMessages,
      preview: message.content.slice(0, 60) + (message.content.length > 60 ? '...' : ''),
      updatedAt: new Date().toISOString(),
    };

    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === session.id);
    let updatedList: ConversationSession[];
    if (index >= 0) {
      updatedList = [...conversations];
      updatedList[index] = updatedSession;
    } else {
      updatedList = [updatedSession, ...conversations];
    }

    this.saveConversations(updatedList);
    databaseService.saveMessage(session.id, message).catch(err => console.error('DB saveMessage error:', err));

    // Increment total queries count
    const profile = this.getProfile();
    profile.totalQueries += 1;
    this.saveProfile(profile);

    return updatedSession;
  },

  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  },

  setOnboardingCompleted(completed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  },

  clearAllData(): void {
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.USER_PROFILE));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.CONVERSATIONS));
    localStorage.removeItem(getScopedKey(STORAGE_KEYS.RECENT_SEARCHES));
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    databaseService.clearLocalCache().catch(err => console.error('DB clear error:', err));
  },
};
