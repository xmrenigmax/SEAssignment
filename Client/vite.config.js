/**
 * @file vite.config.js
 * @description Vite Build Configuration.
 * Sets up the React plugin and defines the development server port.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Aligns with server.js CORS policy
    open: true, // Opens browser on start
  }
})