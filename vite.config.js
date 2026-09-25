import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Base44 plugin uses VITE_BASE44_APP_BASE_URL as its /api proxy target.
// For the local backend this should be empty (relative URLs via our own proxy).
// If a stale generated value is present in the platform env, clear it so the
// plugin doesn't try to proxy to an invalid URL and crash.
if (process.env.VITE_BASE44_APP_BASE_URL && !/^https?:\/\//.test(process.env.VITE_BASE44_APP_BASE_URL)) {
  process.env.VITE_BASE44_APP_BASE_URL = '';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
