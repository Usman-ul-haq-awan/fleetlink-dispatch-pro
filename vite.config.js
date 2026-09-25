import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Base44 plugin proxies /api to VITE_BASE44_APP_BASE_URL. If the value
// is a generated dev placeholder (not a valid http(s) URL), the proxy crashes
// on the first request. Clear it so the plugin skips the proxy instead.
const _rawBaseUrl = process.env.VITE_BASE44_APP_BASE_URL;
if (_rawBaseUrl && !/^https?:\/\//.test(_rawBaseUrl)) {
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
  ]
});
