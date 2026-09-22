import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/HUMIDOR/',
})

export default defineConfig(({ command }) => {
  return {
    // Only apply the /HUMIDOR/ subpath when actually building for
    // production (i.e. for GitHub Pages, which serves this repo at
    // https://ello2003.github.io/HUMIDOR/). Leaving it unset during `vite
    // dev`/AI Studio's own preview keeps local development at the domain
    // root, where it's expected to run.
    base: command === 'build' ? '/HUMIDOR/' : '/',
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
