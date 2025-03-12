import { defineConfig } from 'vite';

export default defineConfig({
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
      external: ['@supabase/supabase-js'],
      output: {
        globals: {
          '@supabase/supabase-js': 'supabase'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  resolve: {
    alias: {
      '@supabase/supabase-js': '/node_modules/@supabase/supabase-js/dist/module/index.js'
    }
  }
});