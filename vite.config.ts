import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core (small, critical path)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting library (large, used only on analytics/dashboard)
          'vendor-charts': ['recharts'],
          // Animation libraries
          'vendor-motion': ['framer-motion', 'gsap', '@gsap/react'],
          // Radix UI primitives (grouped to avoid 40+ tiny chunks)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
          ],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Form utilities
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
