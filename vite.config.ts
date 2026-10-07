import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function apiKeyCheckPlugin(): Plugin {
  return {
    name: 'api-key-check',
    buildStart() {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('\n⚠️ [WARN] GEMINI_API_KEY / VITE_GEMINI_API_KEY is not defined in environment variables.');
        console.warn('   The application will gracefully fallback to user-provided keys or server-side API proxies.\n');
      } else {
        console.log('✅ GEMINI_API_KEY detected in environment.');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiKeyCheckPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
