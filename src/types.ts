export type EchoState = 
  | 'idle' 
  | 'happy'
  | 'excited'
  | 'curious'
  | 'thinking' 
  | 'listening' 
  | 'speaking' 
  | 'processing' 
  | 'confused'
  | 'surprised'
  | 'sad'
  | 'worried'
  | 'angry'
  | 'love'
  | 'celebrating'
  | 'sleeping'
  | 'error' 
  | 'success'
  | 'offline';

export interface EmotionMeta {
  state: EchoState;
  emoji: string;
  label: string;
  color: string;
  badgeText: string;
  exampleMsg?: string;
}

export type NavigationTab = 'home' | 'chat' | 'voice' | 'image-search' | 'conversations' | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  status?: 'sending' | 'sent' | 'error';
  likeState?: 'like' | 'dislike' | null;
  modelUsed?: string;
  groundingChunks?: Array<{ web?: { uri: string; title: string } }>;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  category: 'general' | 'vision' | 'voice' | 'code' | 'creative';
  preview: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  category: 'voice' | 'chat' | 'image' | 'code';
  timestamp: string;
  preview: string;
  status: 'completed' | 'saved' | 'favorite';
}

export type LowPowerReason = 'battery_low' | 'manual' | 'performance_throttle' | null;

export interface LowPowerDetails {
  enabled: boolean;
  reason: LowPowerReason;
  targetFPS: number;
  simplifyRendering: boolean;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
}

export interface UserPreferences {
  themeGlow: boolean;
  glowIntensity: number; // 1 - 5
  ttsVoice: string; // 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir'
  autoSpeak: boolean;
  speechRate: number; // 0.8 - 1.5
  speechPitch: number;
  soundEffects: boolean;
  hapticFeedback: boolean;
  offlineCaching: boolean;
  selectedAiModel: string;
  lowPowerMode?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  preferences: UserPreferences;
  memberSince: string;
  totalQueries: number;
}

export interface NetworkStatus {
  online: boolean;
  aiAvailable: boolean;
  syncing: boolean;
  pendingSyncCount: number;
}
