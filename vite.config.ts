import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function serveApkPlugin(): Plugin {
  const sendApk = (req: any, res: any, next: () => void) => {
    const url = req.url?.split('?')[0];
    if (
      url === '/arrow-master.apk' ||
      url === '/download/arrow-master.apk' ||
      url === '/download' ||
      url === '/api/download' ||
      url === '/app-debug.apk' ||
      url === '/public/arrow-master.apk'
    ) {
      const publicApkPath = path.resolve(__dirname, 'public/arrow-master.apk');
      const rootApkPath = path.resolve(__dirname, 'arrow-master.apk');
      const debugApkPath = path.resolve(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
      let apkPath = '';
      if (fs.existsSync(rootApkPath)) apkPath = rootApkPath;
      else if (fs.existsSync(publicApkPath)) apkPath = publicApkPath;
      else if (fs.existsSync(debugApkPath)) apkPath = debugApkPath;

      if (apkPath && fs.existsSync(apkPath)) {
        const stat = fs.statSync(apkPath);
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="arrow-master.apk"',
          'Content-Length': stat.size,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
        });
        const readStream = fs.createReadStream(apkPath);
        readStream.pipe(res);
        return;
      }
    }
    next();
  };

  return {
    name: 'serve-apk-middleware',
    configureServer(server) {
      server.middlewares.use(sendApk);
    },
    configurePreviewServer(server) {
      server.middlewares.use(sendApk);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      serveApkPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'Arrow Master : Puzzle Escape',
          short_name: 'Arrow Master',
          description: 'Untangle intricate labyrinth paths, escape the grid, and tap away arrows in this satisfying logic puzzle game.',
          theme_color: '#1e3a8a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/assets/aistudio/**', '**/*.apk', '**/download/**'],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
