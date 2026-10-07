import React, { useState, useEffect } from 'react';
import {
  NavigationTab,
  UserProfile,
  RecentSearch,
  ConversationSession,
  EchoState,
  ChatMessage,
} from './types';
import { storageService } from './lib/storageService';
import { databaseService } from './lib/databaseService';
import { syncEngine } from './lib/syncEngine';
import { aiService } from './lib/aiService';
import { emotionEngine } from './lib/emotionEngine';
import { useEchoEmotion } from './lib/useEchoEmotion';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { VoiceView } from './components/VoiceView';
import { VisionView } from './components/VisionView';
import { ConversationsView } from './components/ConversationsView';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';
import { NavigationDrawer } from './components/NavigationDrawer';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { authService } from './lib/authService';
import { Sparkles, Wifi, WifiOff } from 'lucide-react';
import { User } from 'firebase/auth';

function EchoAppContent() {
  const [isOnboarding, setIsOnboarding] = useState<boolean>(
    !storageService.hasCompletedOnboarding()
  );
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const [userProfile, setUserProfile] = useState<UserProfile>(storageService.getProfile());
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('conv-default');

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [networkOnline, setNetworkOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const { state: globalRobotState, meta: globalRobotMeta, subAction: globalSubAction } = useEchoEmotion();

  const setGlobalRobotState = (s: EchoState) => {
    emotionEngine.setEmotion(s);
  };

  // Helper to load or refresh user conversations and profile from DatabaseService
  const loadUserData = async (activeUid?: string) => {
    try {
      const data = await databaseService.initialize();
      setUserProfile(data.userProfile);

      if (data.conversations.length > 0) {
        setConversations(data.conversations);
        setActiveSessionId(prev => (data.conversations.some(c => c.id === prev) ? prev : data.conversations[0].id));
      } else {
        // If empty for this user, create an initial personalized conversation
        const initialSession: ConversationSession = {
          id: 'conv-' + Date.now(),
          title: 'Welcome to Echo AI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: 'general',
          preview: `Hello ${data.userProfile.name}! I am Echo, your intelligent companion.`,
          messages: [
            {
              id: 'm-' + Date.now(),
              role: 'assistant',
              content: `Hello ${data.userProfile.name}! I am **Echo**, your intelligent digital assistant. How can I help you today? You can ask me questions, talk using voice mode, or share images to analyze.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              modelUsed: 'gemini-3.6-flash',
            },
          ],
        };
        await databaseService.saveConversation(initialSession);
        setConversations([initialSession]);
        setActiveSessionId(initialSession.id);
      }

      setRecentSearches(data.recentSearches);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = authService.subscribeToAuthState(async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load cloud profile if available
        const cloudProfile = await authService.fetchUserProfile(user.uid);
        setUserProfile(cloudProfile);
        await databaseService.saveUser(cloudProfile);
        await syncEngine.syncAll(user.uid);
        await loadUserData(user.uid);
        showToast(`Welcome back, ${cloudProfile.name}!`);
      } else {
        // Reset or load guest data
        await loadUserData();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Database & Network monitoring
  useEffect(() => {
    loadUserData();

    const handleOnline = () => {
      setNetworkOnline(true);
      emotionEngine.triggerEmote('happy', 3000);
      showToast('Echo is back online');
      syncEngine.startSync().catch(() => {});
    };
    const handleOffline = () => {
      setNetworkOnline(false);
      emotionEngine.setEmotion('offline');
      showToast('Echo is currently offline (SQLite local active)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial server health check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (!data.online) setNetworkOnline(false);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartOnboardingComplete = () => {
    storageService.setOnboardingCompleted(true);
    setIsOnboarding(false);
    setCurrentTab('home');
  };

  const handleRestartOnboarding = () => {
    setIsOnboarding(true);
  };

  // Active conversation session
  const activeSession =
    conversations.find(c => c.id === activeSessionId) || conversations[0] || storageService.getConversations()[0];

  // Send message in active conversation
  const handleSendMessage = async (text: string, imageUrl?: string, fileName?: string): Promise<string> => {
    // Prevent duplicate triggers while AI response is currently streaming
    if (isStreaming) {
      console.warn('handleSendMessage ignored: Response is currently streaming.');
      return '';
    }

    setIsStreaming(true);
    // Show active thinking state for the Echo robot
    emotionEngine.setEmotion('thinking');

    try {
      const userMsg: ChatMessage = {
        id: 'm-' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl,
        fileName,
      };

      const updatedSessionWithUser = storageService.saveMessage(activeSession, userMsg);
      setConversations(storageService.getConversations());

      // Save to Recent Searches
      storageService.addRecentSearch({
        query: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        category: imageUrl ? 'image' : 'chat',
        preview: text,
        status: 'completed',
      });
      setRecentSearches(storageService.getRecentSearches());

      // If offline, store user message in SQLite local cache and show offline notification
      if (!networkOnline) {
        const offlineText = "You're currently offline. Your request has been saved to local SQLite database and will be synced when you're back online.";
        const offlineMsg: ChatMessage = {
          id: 'm-' + Date.now(),
          role: 'assistant',
          content: offlineText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        storageService.saveMessage(updatedSessionWithUser, offlineMsg);
        setConversations(storageService.getConversations());
        emotionEngine.setEmotion('offline');
        return offlineText;
      }

      // Send to AI Service with user preferred name, ID, and active conversation ID for context continuity
      const aiRes = await aiService.sendChatMessage(
        text,
        updatedSessionWithUser.messages,
        'chat-req',
        userProfile.preferences.selectedAiModel,
        userProfile.name,
        currentUser?.uid || 'anonymous_guest',
        activeSession.id
      );

      // Clean any accidental enclosing quotes from assistant text before saving
      let cleanAssistantText = (aiRes.text || '').trim();
      if (
        (cleanAssistantText.startsWith('"') && cleanAssistantText.endsWith('"') && cleanAssistantText.length >= 2) ||
        (cleanAssistantText.startsWith('“') && cleanAssistantText.endsWith('”') && cleanAssistantText.length >= 2)
      ) {
        cleanAssistantText = cleanAssistantText.slice(1, -1).trim();
      }

      const assistantMsg: ChatMessage = {
        id: 'm-' + Date.now(),
        role: 'assistant',
        content: cleanAssistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: aiRes.modelUsed,
        groundingChunks: aiRes.groundingChunks,
      };

      storageService.saveMessage(updatedSessionWithUser, assistantMsg);
      setConversations(storageService.getConversations());
      setUserProfile(storageService.getProfile());

      // Emotional intelligence response sentiment mapping
      const lowerText = cleanAssistantText.toLowerCase();
      if (lowerText.includes('congrat') || lowerText.includes('awesome') || lowerText.includes('great job') || lowerText.includes('party')) {
        emotionEngine.triggerEmote('celebrating', 3500);
      } else if (lowerText.includes('love') || lowerText.includes('thank') || lowerText.includes('happy to help')) {
        emotionEngine.triggerEmote('love', 3500);
      } else if (lowerText.includes('curious') || lowerText.includes('interesting') || lowerText.includes('wonder')) {
        emotionEngine.triggerEmote('curious', 3000);
      } else {
        emotionEngine.setEmotion('speaking', 2500);
      }

      return aiRes.text;
    } catch (err: any) {
      console.error('Error sending message:', err);
      emotionEngine.triggerEmote('error', 3500);

      const fallbackText = 'I encountered an issue processing your request. Please try again.';
      const errorMsg: ChatMessage = {
        id: 'm-' + Date.now(),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      storageService.saveMessage(activeSession, errorMsg);
      setConversations(storageService.getConversations());
      return fallbackText;
    } finally {
      setIsStreaming(false);
    }
  };

  // Create new conversation session
  const handleNewConversation = () => {
    const newSession: ConversationSession = {
      id: 'conv-' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 'general',
      preview: 'Start asking questions with Echo...',
      messages: [
        {
          id: 'm-' + Date.now(),
          role: 'assistant',
          content: 'Hello! I am ready for your next question or task.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    const updatedList = [newSession, ...conversations];
    storageService.saveConversations(updatedList);
    setConversations(updatedList);
    setActiveSessionId(newSession.id);
    setCurrentTab('chat');
  };

  // Select a recent search
  const handleSelectRecentSearch = (search: RecentSearch) => {
    if (isStreaming) return;
    if (search.category === 'voice') {
      setCurrentTab('voice');
    } else if (search.category === 'image') {
      setCurrentTab('image-search');
    } else {
      setCurrentTab('chat');
      handleSendMessage(search.query);
    }
  };

  // Delete recent search item
  const handleDeleteRecentSearch = (id: string) => {
    storageService.deleteRecentSearch(id);
    setRecentSearches(storageService.getRecentSearches());
  };

  // Delete conversation session
  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter(c => c.id !== id);
    storageService.saveConversations(remaining);
    setConversations(remaining);
    if (activeSessionId === id && remaining.length > 0) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Save profile updates
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    storageService.saveProfile(updated);
  };

  // Clear data
  const handleClearData = () => {
    storageService.clearAllData();
    setUserProfile(storageService.getProfile());
    setRecentSearches(storageService.getRecentSearches());
    setConversations(storageService.getConversations());
    showToast('All local cache cleared');
  };

  // Safe Logout & User Context Switching
  const handleLogout = async () => {
    try {
      await authService.logout();
      showToast('Signed out of Echo account');
      await loadUserData('anonymous_guest');
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  // Onboarding screen view
  if (isOnboarding) {
    return <OnboardingScreen onStart={handleStartOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#080A0D] text-white font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1A202C] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          {networkOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Drawer Menu */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        userProfile={userProfile}
        onRestartOnboarding={handleRestartOnboarding}
        online={networkOnline}
        onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
        isAuthenticated={Boolean(currentUser && !currentUser.isAnonymous)}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Auth Modal (Sign Up, Login, Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={async () => {
          showToast('Account authenticated successfully!');
        }}
      />

      {/* Legal / Privacy Policy Modal Overlay */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onClearLocalData={handleClearData}
        onClearCloudData={async () => {
          await databaseService.deleteCloudData();
          handleClearData();
        }}
      />

      {/* MAIN VIEW SWITCHER */}
      <main className="w-full">
        {currentTab === 'home' && (
          <DashboardView
            userProfile={userProfile}
            recentSearches={recentSearches}
            onNavigate={tab => setCurrentTab(tab)}
            onSelectRecentSearch={handleSelectRecentSearch}
            onDeleteRecentSearch={handleDeleteRecentSearch}
            onOpenMenu={() => setIsDrawerOpen(true)}
            isAuthenticated={Boolean(currentUser && !currentUser.isAnonymous)}
            onOpenAuthModal={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onQuickPrompt={async (promptText) => {
              setCurrentTab('chat');
              await handleSendMessage(promptText);
            }}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            session={activeSession}
            onSendMessage={async (text, img, file) => {
              await handleSendMessage(text, img, file);
            }}
            onBackToDashboard={() => setCurrentTab('home')}
            onUpdateRobotState={state => setGlobalRobotState(state)}
            isStreaming={isStreaming}
            onNewConversation={handleNewConversation}
          />
        )}

        {currentTab === 'voice' && (
          <VoiceView
            onBackToDashboard={() => setCurrentTab('home')}
            onSendMessage={text => handleSendMessage(text)}
            isStreaming={isStreaming}
          />
        )}

        {currentTab === 'image-search' && (
          <VisionView
            onBackToDashboard={() => setCurrentTab('home')}
            onSaveToSearchHistory={(q, preview) => {
              storageService.addRecentSearch({
                query: q,
                category: 'image',
                preview,
                status: 'completed',
              });
              setRecentSearches(storageService.getRecentSearches());
            }}
          />
        )}

        {currentTab === 'conversations' && (
          <ConversationsView
            conversations={conversations}
            activeSessionId={activeSessionId}
            onSelectConversation={id => {
              setActiveSessionId(id);
              setCurrentTab('chat');
            }}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={async (id, newTitle) => {
              await databaseService.renameConversation(id, newTitle);
              setConversations(prev =>
                prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
              );
              showToast('Conversation renamed');
            }}
            onBackToDashboard={() => setCurrentTab('home')}
          />
        )}

        {(currentTab === 'settings' || (currentTab as string) === 'profile') && (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onClearData={handleClearData}
            onBackToDashboard={() => setCurrentTab('home')}
            onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
            isAuthenticated={Boolean(currentUser && !currentUser.isAnonymous)}
            onOpenAuthModal={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Floating Glass Navigation Bar (hidden in full voice view) */}
      {currentTab !== 'voice' && (
        <BottomNav currentTab={currentTab} onSelectTab={tab => setCurrentTab(tab)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <EchoAppContent />
    </ErrorBoundary>
  );
}
