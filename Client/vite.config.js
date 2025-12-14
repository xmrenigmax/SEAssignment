/**
 * @file vite.config.js
 * @description Vite Build Configuration.
 * Sets up the React plugin and defines the development server port.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // Opens browser on start
    host: true, // Exposes server to network (allows mobile testing via IP)

    // Optional: Proxy setup to avoid CORS during development
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5000',
    //     changeOrigin: true,
    //   }
    // }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});