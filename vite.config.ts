import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// TaxiSchild – إعداد Vite مع دعم PWA (تثبيت على الشاشة الرئيسية + عمل بدون إنترنت)
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'TaxiSchild – Das digitale Fahrtenbuch',
        short_name: 'TaxiSchild',
        description: 'Fahrten, Fahrer und Fuhrpark papierlos verwalten',
        theme_color: '#1C1B1A',
        background_color: '#F4ECDD',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    port: 5173,
    allowedHosts: command === 'serve' ? true : undefined,
  },
}));
