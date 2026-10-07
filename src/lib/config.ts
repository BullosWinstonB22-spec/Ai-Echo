/**
 * Configuration module to safely access Vite environment variables
 * with robust fallbacks for local and production environments.
 */

export const config = {
  geminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || (import.meta.env.GEMINI_API_KEY as string) || '',
  appUrl: (import.meta.env.VITE_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  isDev: import.meta.env.DEV || import.meta.env.MODE === 'development',
  isProd: import.meta.env.PROD || import.meta.env.MODE === 'production',
};

export const getGeminiApiKey = (): string => {
  return config.geminiApiKey;
};

export const getAppUrl = (): string => {
  return config.appUrl;
};

export default config;
