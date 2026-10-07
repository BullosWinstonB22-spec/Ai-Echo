import { ChatMessage } from '../types';

export interface AIResponse {
  text: string;
  modelUsed: string;
  groundingChunks?: Array<{ web?: { uri: string; title: string } }>;
  isOfflineFallback?: boolean;
}

export class AIServiceLayer {
  private abortControllers: Map<string, AbortController> = new Map();

  // Network connectivity check
  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Cancel an active request if needed
  public cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  // Chat message generation
  public async sendChatMessage(
    message: string,
    history: ChatMessage[],
    requestId: string = 'default',
    requestedModel?: string,
    userName?: string,
    userId?: string,
    conversationId?: string
  ): Promise<AIResponse> {
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      if (!this.isOnline()) {
        return this.getOfflineFallback(message);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          history: history.map(h => ({ role: h.role, content: h.content })),
          model: requestedModel,
          userName: userName || undefined,
          userId: userId || undefined,
          conversationId: conversationId || undefined,
        }),
      });

      this.abortControllers.delete(requestId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.fallbackText) {
          return {
            text: errData.fallbackText,
            modelUsed: 'echo-resilient-fallback',
            isOfflineFallback: true,
          };
        }
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      let cleanedText = (data.text || '').trim();
      if (
        (cleanedText.startsWith('"') && cleanedText.endsWith('"') && cleanedText.length >= 2) ||
        (cleanedText.startsWith('“') && cleanedText.endsWith('”') && cleanedText.length >= 2)
      ) {
        cleanedText = cleanedText.slice(1, -1).trim();
      }

      return {
        text: cleanedText,
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
        groundingChunks: data.groundingChunks,
      };
    } catch (err: any) {
      this.abortControllers.delete(requestId);
      if (err.name === 'AbortError') {
        throw new Error('Request was cancelled.');
      }
      console.warn('AI Service Error, engaging fallback:', err);
      return this.getOfflineFallback(message);
    }
  }

  // Image vision analysis
  public async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    requestId: string = 'vision-req'
  ): Promise<AIResponse> {
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      if (!this.isOnline()) {
        return {
          text: "Echo is currently offline. When connection returns, I can perform deep multimodal vision analysis on this image.",
          modelUsed: 'offline-preview',
          isOfflineFallback: true,
        };
      }

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64,
          mimeType,
          prompt,
        }),
      });

      this.abortControllers.delete(requestId);

      if (!response.ok) {
        throw new Error(`Vision API error status ${response.status}`);
      }

      const data = await response.json();
      let cleanedText = (data.text || '').trim();
      if (
        (cleanedText.startsWith('"') && cleanedText.endsWith('"') && cleanedText.length >= 2) ||
        (cleanedText.startsWith('“') && cleanedText.endsWith('”') && cleanedText.length >= 2)
      ) {
        cleanedText = cleanedText.slice(1, -1).trim();
      }

      return {
        text: cleanedText,
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };
    } catch (err: any) {
      this.abortControllers.delete(requestId);
      if (err.name === 'AbortError') {
        throw new Error('Vision request cancelled.');
      }
      return {
        text: "Echo was unable to process the image at this moment. Please check your image format or connection.",
        modelUsed: 'echo-fallback',
        isOfflineFallback: true,
      };
    }
  }

  // Text-To-Speech generation
  public async generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
    try {
      if (!this.isOnline()) return null;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceName }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.audioBase64 || null;
    } catch {
      return null;
    }
  }

  // Local offline fallback intelligent answers
  private getOfflineFallback(query: string): AIResponse {
    const qLower = query.toLowerCase();
    
    let text = `Echo is currently operating offline. I have logged your query: "${query}".`;

    if (qLower.includes('color') || qLower.includes('palette') || qLower.includes('design')) {
      text = `Here is a quick offline UI Color Recommendation from Echo:\n\n- **Primary Accent**: Mint Green (\`#10B981\`)\n- **Secondary Highlight**: Cyan/Turquoise (\`#06B6D4\`)\n- **Contrast Glow**: Light Lime (\`#A3E635\`)\n- **Dark Canvas**: Deep Charcoal (\`#0D0F12\`)\n\n*Reconnect online for full AI design synthesis!*`;
    } else if (qLower.includes('code') || qLower.includes('debug') || qLower.includes('ts') || qLower.includes('react')) {
      text = `\`\`\`typescript\n// Echo Offline Code Quick-Helper\nexport function createEchoSession(userId: string) {\n  console.log("Initializing Echo digital session for:", userId);\n  return { status: "active", offlineMode: true };\n}\n\`\`\`\n\n*Echo is ready to provide live code assistance as soon as online connectivity is restored.*`;
    } else if (qLower.includes('hello') || qLower.includes('hi') || qLower.includes('who are you')) {
      text = `Hello! I am **Echo**, your futuristic AI assistant. Even while offline, I can manage your recent searches, stored conversations, and system preferences!`;
    }

    return {
      text,
      modelUsed: 'echo-local-engine',
      isOfflineFallback: true,
    };
  }
}

export const aiService = new AIServiceLayer();
