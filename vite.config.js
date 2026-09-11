import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { verifyVoiceTicket } from './src/lib/server/voiceTicket.js'

export default defineConfig(({ command }) => {
  const voiceClientToken = process.env.VOICE_CLIENT_TOKEN;
  const isHospitalEdition = process.env.VITE_KRISPOINT_EDITION !== 'solo';
  if (command === 'serve' && isHospitalEdition && !voiceClientToken) {
    throw new Error(
      'VOICE_CLIENT_TOKEN is required for the Hospital /voice development proxy. ' +
      'Set it server-side; it must not be exposed to browser code.'
    );
  }

  return {
    plugins: [sveltekit()],
    clearScreen: false,
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      watch: {
        ignored: [
          '**/.agents/**',
          '**/.cache/**',
          '**/.git/**',
          '**/.local/**',
          '**/.pythonlibs/**',
          '**/.svelte-kit/**',
          '**/build/**',
          '**/dist/**',
          '**/solo-runtime/**',
          '**/src-tauri/target/**',
          '**/voice-runtime/**',
          '**/__pycache__/**'
        ],
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      proxy: {
        '/license-server': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/license-server/, ''),
        },
        '/voice': {
          target: 'ws://127.0.0.1:8000',
          ws: true,
          rewrite: (path) => {
            const ticket = new URL(path, 'http://voice.invalid').searchParams.get('ticket');
            // Invalid tickets intentionally produce an empty backend token.
            // The voice server rejects that request; the private client token
            // is never sent for an unauthenticated browser connection.
            const token = ticket && verifyVoiceTicket(ticket) ? voiceClientToken : '';
            return `/?token=${encodeURIComponent(token || '')}`;
          },
        },
      },
    },
    optimizeDeps: {
      force: true,
      holdUntilCrawlEnd: true,
      exclude: ['@sveltejs/kit'],
    },
    cacheDir: '.vite',
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      target: 'esnext',
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      sourcemap: !!process.env.TAURI_DEBUG,
    },
    ssr: {
      target: 'node',
    },
  };
})
