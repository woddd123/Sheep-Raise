import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    build: {
      assetsInlineLimit: 200000, // Inline assets up to 200KB (our mp3 is ~105KB)
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        },
        manifest: {
          name: 'Sheep Farm Simulator',
          short_name: 'SheepFarm',
          description: 'A casual sheep farming simulation game',
          theme_color: '#4ade80',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'https://api.iconify.design/lucide:tractor.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'https://api.iconify.design/lucide:tractor.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
