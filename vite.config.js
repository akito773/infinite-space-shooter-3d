import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/infinite-space-shooter-3d/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});