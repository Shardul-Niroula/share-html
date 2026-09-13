import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  // Only VITE_-prefixed vars are exposed to client code by default, to avoid
  // leaking server secrets (like DATABASE_URL) into the browser bundle. The
  // Neon Auth base URL is meant to be public (the browser calls it directly),
  // so bridge just that one value in from whatever name Vercel/Neon injected it as.
  const env = loadEnv(mode, process.cwd(), '');
  const neonAuthUrl = env.VITE_NEON_AUTH_URL || env.sharehtml_NEON_AUTH_BASE_URL || env.NEON_AUTH_BASE_URL || '';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(neonAuthUrl),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
