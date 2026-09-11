import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/.cache/**', '**/.pythonlibs/**', '**/__pycache__/**'],
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
})
