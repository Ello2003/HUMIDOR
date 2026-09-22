cat > vite.config.ts <<'EOF'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  return {
    // GitHub Pages serves HUMIDOR from /HUMIDOR/.
    // Vercel serves the app from the domain root.
    base:
      command === 'build'
        ? (process.env.VERCEL === '1' || process.env.VERCEL === 'true'
            ? '/'
            : '/HUMIDOR/')
        : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
EOF