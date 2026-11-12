import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { pwaBackgroundColor, pwaThemeColor } from './src/shared/config/brand.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appName = env.VITE_APP_NAME?.trim() || 'Nuvora';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'theme.js', 'icons/*.png'],
        manifest: {
          id: '/',
          name: appName,
          short_name: appName,
          description:
             'Documentos FEL y control financiero para tu organización.',
          lang: 'es-GT',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: pwaThemeColor,
          background_color: pwaBackgroundColor,
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Solo el shell estático. API, autenticación y documentos no se cachean.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api(?:\/|$)/,
            /^\/health(?:\/|$)/,
            /^\/auth(?:\/|$)/,
          ],
          runtimeCaching: [],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
  };
});
