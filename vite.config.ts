import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
<<<<<<< HEAD
        includeAssets: ['favicon.ico', 'icon/icon1.png'],
=======
        includeAssets: ['favicon.ico', 'icon/unnamed.png'],
>>>>>>> parent of 8b8ba17 (图标更改)
        manifest: {
          name: 'Daily Grippy',
          short_name: 'Daily Grippy',
          description: 'A daily grip training app',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          categories: ['productivity', 'health'],
          screenshots: [
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
<<<<<<< HEAD
              src: '/icon/icon1.png',
=======
              src: '/icon/unnamed.png',
>>>>>>> parent of 8b8ba17 (图标更改)
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
            },
          ],
        },
        devOptions: {
          enabled: true,
          navigateFallback: 'index.html',
          suppressWarnings: true,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    publicDir: 'public',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
