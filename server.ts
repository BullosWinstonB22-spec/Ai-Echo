import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy-initialized Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for Echo
const ECHO_SYSTEM_INSTRUCTION = `You are Echo, an advanced futuristic AI digital assistant companion.
Your personality is friendly, articulate, highly intelligent, concise when appropriate, and deeply helpful.
When responding:
1. Provide accurate, well-formatted, clean responses (use markdown formatting for lists, code snippets, bold text, and headers where helpful).
2. For code, always wrap it in proper code blocks with language specifiers.
3. Keep tone encouraging, futuristic, modern, and warm.
4. Adapt to the user's intent: whether it's brainstorming, coding, summarizing, image analysis, or general conversation.
5. Keep answers direct and readable as natural, normal conversational messages.
6. IMPORTANT FORMATTING RULE: NEVER wrap your entire response or answers in quotation marks ("..." or '...' or “...”). Output natural, clean conversational text without leading or trailing quotes.`;

// Health check
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({ status: 'ok', online: true, aiAvailable: hasKey });
});

// Chat endpoint (supports history and streaming or JSON response)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, model: requestedModel, userName, userId, conversationId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    
    // Offline / fallback response generator if no key or error
    if (!ai) {
      const fallbackResponses = [
        `I'm Echo! I'm operating in intelligent offline preview mode. Your message was: "${message}". Connect a valid Gemini API key in Settings > Secrets for live cloud AI processing!`,
        `Fascinating point! In offline mode, I can confirm that Echo's 3D core and interfaces are active. To enable live web search and deep reasoning, ensure GEMINI_API_KEY is configured!`,
        `As Echo, I've logged your request: "${message}". You can test all voice controls, image uploads, profile customization, and UI features freely!`,
      ];
      const selected = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return res.json({ text: selected, modelUsed: 'offline-preview' });
    }

    const modelName = requestedModel || 'gemini-3.6-flash';

    // Format chat history if provided
    let formattedContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      formattedContents = history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || h.text || '' }],
      }));
    }
    
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const safeUserName = typeof userName === 'string' && userName.trim() ? userName.trim().slice(0, 50) : null;
    let contextDirectives: string[] = [];
    if (safeUserName) {
      contextDirectives.push(`User's preferred name is "${safeUserName}". Address them naturally by name when appropriate.`);
    }
    if (userId && typeof userId === 'string') {
      const sanitizedUid = userId.slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedUid) {
        contextDirectives.push(`Authenticated user ID: ${sanitizedUid}.`);
      }
    }
    if (conversationId && typeof conversationId === 'string') {
      const sanitizedConvId = conversationId.slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedConvId) {
        contextDirectives.push(`Active conversation thread ID: ${sanitizedConvId}. Maintain continuity across this thread.`);
      }
    }

    const personalizedInstruction = contextDirectives.length > 0
      ? `${ECHO_SYSTEM_INSTRUCTION}\n\nContext & Personalization:\n${contextDirectives.join('\n')}`
      : ECHO_SYSTEM_INSTRUCTION;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction: personalizedInstruction,
        temperature: 0.7,
      },
    });

    let textOutput = response.text || "I couldn't generate a response. Please try asking again.";
    
    // Ensure response is not wrapped in outer quotation marks
    textOutput = textOutput.trim();
    if (
      (textOutput.startsWith('"') && textOutput.endsWith('"') && textOutput.length >= 2) ||
      (textOutput.startsWith('“') && textOutput.endsWith('”') && textOutput.length >= 2) ||
      (textOutput.startsWith('\'') && textOutput.endsWith('\'') && textOutput.length >= 2)
    ) {
      // Check if it's an outer wrapper (not multiple quotes)
      const inner = textOutput.slice(1, -1).trim();
      textOutput = inner;
    }
    
    // Extract grounding metadata if search grounding occurred
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return res.json({
      text: textOutput,
      modelUsed: modelName,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response from Echo',
      fallbackText: "Echo encountered a temporary signal disruption while processing your request. Please try again in a moment.",
    });
  }
});

// Image Analysis / Vision Endpoint
app.post('/api/vision', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt = 'Analyze this image in detail and describe what you see.' } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        text: `[Offline Preview Mode] I received your image! Echo analyzed the image metrics: format ${mimeType}, size approximately ${Math.round(imageBase64.length * 0.75 / 1024)}KB. Add a valid GEMINI_API_KEY in Secrets for live AI multimodal image understanding!`,
        modelUsed: 'offline-vision-preview',
      });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: ECHO_SYSTEM_INSTRUCTION,
      },
    });

    let visionOutput = response.text || 'Image analysis complete, but no description was returned.';
    visionOutput = visionOutput.trim();
    if (
      (visionOutput.startsWith('"') && visionOutput.endsWith('"') && visionOutput.length >= 2) ||
      (visionOutput.startsWith('“') && visionOutput.endsWith('”') && visionOutput.length >= 2)
    ) {
      visionOutput = visionOutput.slice(1, -1).trim();
    }

    return res.json({
      text: visionOutput,
      modelUsed: 'gemini-3.6-flash',
    });
  } catch (error: any) {
    console.error('Vision analysis error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze image with Echo AI',
    });
  }
});

// Text-To-Speech Endpoint using Gemini TTS model
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API Key required for cloud TTS synthesis' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Say with a clean, friendly AI voice: ${text.slice(0, 300)}` }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/pcm' });
    } else {
      return res.status(500).json({ error: 'No audio generated' });
    }
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Vite & Express static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Echo AI Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
