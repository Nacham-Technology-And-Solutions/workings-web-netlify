import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Unique cache name per build so old SW caches are dropped on deploy. */
function injectSwCacheRevision(): Plugin {
  return {
    name: 'inject-sw-cache-revision',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/service-worker.js');
      if (!fs.existsSync(swPath)) return;
      const revision =
        process.env.NETLIFY_DEPLOY_ID ||
        process.env.COMMIT_REF ||
        process.env.GITHUB_SHA ||
        String(Date.now());
      const safe = revision.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 64);
      const src = fs.readFileSync(swPath, 'utf-8');
      fs.writeFileSync(swPath, src.replace(/__SW_CACHE_REVISION__/g, safe), 'utf-8');
    },
  };
}

const projectRoot = path.resolve(__dirname);

/** http-proxy requires a full URL with scheme; .env sometimes omits `http://`. */
function devApiProxyTarget(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return 'http://localhost:5000';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export default defineConfig(({ mode }) => {
    // Resolve env from the directory that contains vite.config.ts (not process.cwd()),
    // so dev mode picks up .env when the shell/Cursor cwd is elsewhere.
    const env = loadEnv(mode, projectRoot, '');
    const apiBase = env.VITE_API_BASE_URL || env.VITE_API_URL;
    return {
      root: projectRoot,
      envDir: projectRoot,
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Proxy configuration for development to avoid CORS issues
        proxy: {
          '/api': {
            target: devApiProxyTarget(apiBase),
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path, // Keep the /api path as is
          },
        },
      },
      plugins: [react(), injectSwCacheRevision()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
