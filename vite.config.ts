import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pdf-maker/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        taskpane: resolve(__dirname, 'src/taskpane/taskpane.html'),
        standalone: resolve(__dirname, 'src/pages/standalone.html'),
      },
    },
  },
  server: {
    port: 3000,
    https: false,
  },
}));
