import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Chunks séparés = mieux pour le cache navigateur + plus rapide
    // à charger la 1ère fois (parallel downloads sur HTTP/2)
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React isolé — change rarement, cache long
          'react-vendor': ['react', 'react-dom'],
          // Supabase — gros lib (auth + storage + realtime)
          'supabase': ['@supabase/supabase-js'],
          // QR — feature lourde mais optionnelle (framer-motion retiré : plus utilisé)
          'qr': ['qrcode'],
          // Icônes Lucide — peuvent être tree-shaken mais on les groupe
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
