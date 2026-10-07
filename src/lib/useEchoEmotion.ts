import { useState, useEffect } from 'react';
import { EchoState, EmotionMeta, LowPowerDetails } from '../types';
import { emotionEngine, EMOTION_METADATA } from './emotionEngine';

export function useEchoEmotion() {
  const [state, setState] = useState<EchoState>(emotionEngine.getCurrentState());
  const [meta, setMeta] = useState<EmotionMeta>(emotionEngine.getCurrentMeta());
  const [subAction, setSubAction] = useState<string | undefined>(emotionEngine.getSubAction());
  const [lowPowerMode, setLowPowerMode] = useState<LowPowerDetails>(emotionEngine.getLowPowerDetails());

  useEffect(() => {
    const unsubscribeEmotion = emotionEngine.subscribe((newState, newMeta, newSubAction) => {
      setState(newState);
      setMeta(newMeta);
      setSubAction(newSubAction);
    });

    const unsubscribePower = emotionEngine.subscribeLowPower((details) => {
      setLowPowerMode(details);
    });

    // Setup periodic random idle animation trigger
    const idleInterval = setInterval(() => {
      if (emotionEngine.getCurrentState() === 'idle') {
        emotionEngine.triggerRandomIdleAction();
      }
    }, 8000);

    return () => {
      unsubscribeEmotion();
      unsubscribePower();
      clearInterval(idleInterval);
    };
  }, []);

  return {
    state,
    meta,
    subAction,
    lowPowerMode,
    setEmotion: (newState: EchoState, durationMs?: number, subActionName?: string) =>
      emotionEngine.setEmotion(newState, durationMs, subActionName),
    triggerEmote: (newState: EchoState, durationMs?: number) =>
      emotionEngine.triggerEmote(newState, durationMs),
    registerActivity: () => emotionEngine.registerActivity(),
    setLowPowerMode: (enabled: boolean, reason?: 'battery_low' | 'manual' | 'performance_throttle') =>
      emotionEngine.setLowPowerMode(enabled, reason),
    toggleLowPowerMode: () => emotionEngine.toggleLowPowerMode(),
  };
}
