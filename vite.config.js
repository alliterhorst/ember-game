/// <reference types="vitest" />
import { defineConfig } from 'vite';

// base relativa: servido de subcaminho no GitHub Pages.
export default defineConfig({
  base: './',
  server: { port: 5174, strictPort: true },
  build: { target: 'es2022', outDir: 'dist' },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.js'],
  },
});
