import { defineConfig } from 'vite';

export default defineConfig({
  base: '/faustdle/',  // Update this to match your repository name
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/archipelago': {
        target: 'ws://localhost:38281',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});