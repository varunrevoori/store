import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  envDir: resolve(__dirname, '..'),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    watch: {
      // Windows (especially Downloads): large JPGs in `public/` can throw EBUSY while AV scans.
      ignored: ['**/public/images/**'],
      usePolling: process.platform === 'win32',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});