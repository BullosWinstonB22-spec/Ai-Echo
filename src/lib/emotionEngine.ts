import { EchoState, EmotionMeta, LowPowerDetails, LowPowerReason } from '../types';

export const EMOTION_METADATA: Record<EchoState, EmotionMeta> = {
  idle: {
    state: 'idle',
    emoji: '✨',
    label: 'Idle',
    color: '#22d3ee',
    badgeText: 'Echo Active',
    exampleMsg: 'Ready when you are!',
  },
  happy: {
    state: 'happy',
    emoji: '😊',
    label: 'Happy',
    color: '#10b981',
    badgeText: 'Glad to help!',
    exampleMsg: 'Glad I could help!',
  },
  excited: {
    state: 'excited',
    emoji: '🤩',
    label: 'Excited',
    color: '#a855f7',
    badgeText: 'Awesome!',
    exampleMsg: "Awesome! Let's do it!",
  },
  curious: {
    state: 'curious',
    emoji: '🤔',
    label: 'Curious',
    color: '#f59e0b',
    badgeText: 'Hmm, interesting...',
    exampleMsg: "That's interesting...",
  },
  thinking: {
    state: 'thinking',
    emoji: '💡',
    label: 'Thinking',
    color: '#38bdf8',
    badgeText: 'Echo is thinking...',
    exampleMsg: 'Processing your thoughts...',
  },
  listening: {
    state: 'listening',
    emoji: '👂',
    label: 'Listening',
    color: '#06b6d4',
    badgeText: 'Listening...',
    exampleMsg: 'I am listening closely...',
  },
  speaking: {
    state: 'speaking',
    emoji: '💬',
    label: 'Speaking',
    color: '#34d399',
    badgeText: 'Echo is speaking...',
    exampleMsg: 'Here is what I found...',
  },
  processing: {
    state: 'processing',
    emoji: '⚙️',
    label: 'Processing',
    color: '#818cf8',
    badgeText: 'Processing...',
    exampleMsg: 'Working on it...',
  },
  confused: {
    state: 'confused',
    emoji: '❓',
    label: 'Confused',
    color: '#eab308',
    badgeText: 'Not quite sure...',
    exampleMsg: "I'm not quite sure what you mean.",
  },
  surprised: {
    state: 'surprised',
    emoji: '😮',
    label: 'Surprised',
    color: '#ec4899',
    badgeText: 'Woah!',
    exampleMsg: 'That caught me by surprise!',
  },
  sad: {
    state: 'sad',
    emoji: '🥺',
    label: 'Sad',
    color: '#64748b',
    badgeText: 'I feel for you',
    exampleMsg: "I'm sorry that happened.",
  },
  worried: {
    state: 'worried',
    emoji: '😟',
    label: 'Worried',
    color: '#f97316',
    badgeText: 'Careful there',
    exampleMsg: 'Please take care!',
  },
  angry: {
    state: 'angry',
    emoji: '😤',
    label: 'Mildly Miffed',
    color: '#ef4444',
    badgeText: "Let's reset",
    exampleMsg: "Let's take a deep breath.",
  },
  love: {
    state: 'love',
    emoji: '💚',
    label: 'Friendly',
    color: '#10b981',
    badgeText: "You're awesome!",
    exampleMsg: "You're awesome!",
  },
  celebrating: {
    state: 'celebrating',
    emoji: '🎉',
    label: 'Celebrating',
    color: '#f43f5e',
    badgeText: 'Great job! 🎉',
    exampleMsg: 'Great job! 🎉',
  },
  sleeping: {
    state: 'sleeping',
    emoji: '😴',
    label: 'Resting',
    color: '#475569',
    badgeText: 'Resting...',
    exampleMsg: 'Zzz...',
  },
  error: {
    state: 'error',
    emoji: '⚠️',
    label: 'Error',
    color: '#ef4444',
    badgeText: 'Oops! Something went wrong',
    exampleMsg: 'Oops! Something went wrong.',
  },
  success: {
    state: 'success',
    emoji: '✅',
    label: 'Success',
    color: '#10b981',
    badgeText: 'Success!',
    exampleMsg: 'Operation completed successfully!',
  },
  offline: {
    state: 'offline',
    emoji: '📡',
    label: 'Offline',
    color: '#94a3b8',
    badgeText: 'Echo is offline',
    exampleMsg: 'Echo is currently offline.',
  },
};

// Priority map: higher number = higher priority override
const EMOTION_PRIORITY: Record<EchoState, number> = {
  error: 100,
  offline: 90,
  speaking: 80,
  listening: 70,
  thinking: 60,
  processing: 55,
  celebrating: 50,
  excited: 45,
  love: 40,
  surprised: 35,
  confused: 30,
  happy: 25,
  success: 24,
  curious: 20,
  sad: 15,
  worried: 14,
  angry: 12,
  sleeping: 10,
  idle: 0,
};

type Listener = (state: EchoState, meta: EmotionMeta, subAction?: string) => void;

class EmotionEngine {
  private currentState: EchoState = 'idle';
  private baseState: EchoState = 'idle';
  private currentSubAction: string | undefined = undefined;
  private listeners: Set<Listener> = new Set();
  private powerListeners: Set<(details: LowPowerDetails) => void> = new Set();
  private timerId: any = null;
  private idleTimerId: any = null;
  private inactivityTimerId: any = null;
  private lastActivityTime: number = Date.now();

  // Low Power Mode state
  private isLowPowerMode: boolean = false;
  private lowPowerReason: LowPowerReason = null;
  private isManualOverride: boolean = false;
  private batteryLevel: number | null = null;
  private isCharging: boolean | null = null;

  constructor() {
    this.setupInactivityMonitor();
    this.setupBatteryMonitor();
  }

  public getLowPowerDetails(): LowPowerDetails {
    return {
      enabled: this.isLowPowerMode,
      reason: this.lowPowerReason,
      targetFPS: this.isLowPowerMode ? 15 : 60,
      simplifyRendering: this.isLowPowerMode,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
    };
  }

  public setLowPowerMode(enabled: boolean, reason: LowPowerReason = 'manual', isManual: boolean = true) {
    this.isLowPowerMode = enabled;
    this.lowPowerReason = enabled ? reason : null;
    if (isManual) {
      this.isManualOverride = true;
    }
    this.notifyPowerListeners();
  }

  public toggleLowPowerMode() {
    this.setLowPowerMode(!this.isLowPowerMode, 'manual', true);
  }

  public subscribeLowPower(listener: (details: LowPowerDetails) => void): () => void {
    this.powerListeners.add(listener);
    listener(this.getLowPowerDetails());
    return () => {
      this.powerListeners.delete(listener);
    };
  }

  private notifyPowerListeners() {
    const details = this.getLowPowerDetails();
    this.powerListeners.forEach((fn) => fn(details));
  }

  private async setupBatteryMonitor() {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        const updateBatteryStatus = () => {
          this.batteryLevel = battery.level;
          this.isCharging = battery.charging;

          // Auto trigger low power mode if battery <= 20% and not charging (unless user manually overridden)
          if (!this.isManualOverride) {
            if (battery.level <= 0.20 && !battery.charging) {
              this.setLowPowerMode(true, 'battery_low', false);
            } else if (this.lowPowerReason === 'battery_low' && (battery.charging || battery.level > 0.25)) {
              this.setLowPowerMode(false, null, false);
            }
          }
          this.notifyPowerListeners();
        };

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
      } catch (err) {
        console.warn('Battery Status API not available:', err);
      }
    }
  }

  public getCurrentState(): EchoState {
    return this.currentState;
  }

  public getCurrentMeta(): EmotionMeta {
    return EMOTION_METADATA[this.currentState] || EMOTION_METADATA.idle;
  }

  public getSubAction(): string | undefined {
    return this.currentSubAction;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Initial emission
    listener(this.currentState, this.getCurrentMeta(), this.currentSubAction);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const meta = this.getCurrentMeta();
    this.listeners.forEach((fn) => fn(this.currentState, meta, this.currentSubAction));
  }

  // Register user interaction to reset inactivity sleep
  public registerActivity() {
    this.lastActivityTime = Date.now();
    if (this.currentState === 'sleeping') {
      // Wake up sequence: sleeping -> surprised/happy -> idle
      this.setEmotion('surprised', 1200);
      setTimeout(() => {
        this.setEmotion('happy', 1800);
      }, 1200);
    } else {
      this.resetInactivityTimer();
    }
  }

  private resetInactivityTimer() {
    if (this.inactivityTimerId) clearTimeout(this.inactivityTimerId);
    // 60 seconds of inactivity triggers sleeping state unless actively listening/thinking
    this.inactivityTimerId = setTimeout(() => {
      if (['idle', 'happy', 'sad', 'curious'].includes(this.currentState)) {
        this.setEmotion('sleeping');
      }
    }, 60000);
  }

  private setupInactivityMonitor() {
    if (typeof window !== 'undefined') {
      const handleUserAct = () => this.registerActivity();
      window.addEventListener('mousemove', handleUserAct, { passive: true });
      window.addEventListener('keydown', handleUserAct, { passive: true });
      window.addEventListener('touchstart', handleUserAct, { passive: true });
    }
    this.resetInactivityTimer();
  }

  /**
   * Set emotion with priority checking and optional duration (auto-reversion).
   */
  public setEmotion(state: EchoState, durationMs?: number, subAction?: string) {
    const newPriority = EMOTION_PRIORITY[state] ?? 0;
    const currentPriority = EMOTION_PRIORITY[this.currentState] ?? 0;

    // Allow state update if higher/equal priority OR if clearing a state
    if (newPriority >= currentPriority || state === 'idle' || state === this.baseState) {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }

      this.currentState = state;
      this.currentSubAction = subAction;

      // Update base state if non-temporary
      if (!durationMs && !['happy', 'excited', 'curious', 'confused', 'surprised', 'love', 'celebrating', 'error', 'success'].includes(state)) {
        this.baseState = state;
      }

      this.notify();

      // Handle auto-reversion if duration provided or default duration for temporary emotions
      const defaultDurations: Partial<Record<EchoState, number>> = {
        happy: 3000,
        excited: 3500,
        curious: 3000,
        confused: 3500,
        surprised: 2500,
        love: 3500,
        celebrating: 4000,
        error: 4500,
        success: 3000,
      };

      const effectiveDuration = durationMs || defaultDurations[state];

      if (effectiveDuration && effectiveDuration > 0) {
        this.timerId = setTimeout(() => {
          this.currentState = this.baseState;
          this.currentSubAction = undefined;
          this.notify();
        }, effectiveDuration);
      }
    }
  }

  /**
   * Force trigger an emote (e.g., when clicking or completing a task)
   */
  public triggerEmote(state: EchoState, durationMs: number = 3000) {
    this.registerActivity();
    this.setEmotion(state, durationMs);
  }

  /**
   * Random idle personality actions (blink, tilt, wave, smile)
   */
  public triggerRandomIdleAction() {
    if (this.currentState !== 'idle') return;
    const actions = ['blink', 'look_left', 'look_right', 'head_tilt', 'wave', 'smile', 'stretch'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    this.currentSubAction = randomAction;
    this.notify();

    setTimeout(() => {
      if (this.currentState === 'idle' && this.currentSubAction === randomAction) {
        this.currentSubAction = undefined;
        this.notify();
      }
    }, 1500);
  }
}

export const emotionEngine = new EmotionEngine();
