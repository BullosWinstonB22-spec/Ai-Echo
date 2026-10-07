// Speech Recognition and Synthesis Helper for Echo
export class AudioService {
  private recognition: any = null;
  private isListening: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Lazy recognition initialization per request
  }

  private createRecognitionInstance(): any {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const instance = new SpeechRecognition();
        instance.continuous = false;
        instance.interimResults = true;
        instance.lang = 'en-US';
        return instance;
      }
    }
    return null;
  }

  public isSpeechSupported(): boolean {
    return Boolean(typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    // Always stop and dispose previous instance cleanly
    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    this.isListening = false;
    this.playTone(880, 0.1, 'sine'); // Chime on start listening

    // Instantiate fresh SpeechRecognition instance to avoid "recognition has already started"
    const rec = this.createRecognitionInstance();
    if (!rec) {
      onError('Could not create SpeechRecognition instance.');
      return;
    }
    this.recognition = rec;

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    rec.onerror = (event: any) => {
      this.isListening = false;
      const errorType = event?.error || event;
      onError(errorType);
    };

    rec.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      rec.start();
      this.isListening = true;
    } catch (err: any) {
      this.isListening = false;
      const errStr = String(err?.message || err || '');
      if (errStr.includes('already started') || err?.name === 'InvalidStateError') {
        // Retry once after brief timeout if browser thread was busy
        setTimeout(() => {
          try {
            rec.start();
            this.isListening = true;
          } catch (retryErr) {
            this.isListening = false;
            onError(retryErr);
          }
        }, 150);
      } else {
        onError(err);
      }
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  // Speak text out loud using browser SpeechSynthesis or custom audio
  public speakText(text: string, rate: number = 1.0, pitch: number = 1.0, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Stop current speech

    // Clean markdown notation from text for spoken audio
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'code snippet omitted')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Pick pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Synthetic tone generator for futuristic Echo UI audio chimes
  public playTone(freq: number = 440, duration: number = 0.15, type: OscillatorType = 'sine') {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {}
  }
}

export const audioService = new AudioService();
