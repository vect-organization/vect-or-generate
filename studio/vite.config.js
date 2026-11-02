import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Read from vect-or-generate/.env or the build environment, used by core/vault/webVault.js
    __VECT_SHARED_APP_SECRET__: JSON.stringify(loadEnv(mode, '..', 'VECTOR_SHARED_APP_SECRET').VECTOR_SHARED_APP_SECRET ?? ''),
  },
  base: './', // Ensures relative paths for GitHub Pages deployment
  server: {
    fs: {
      allow: ['..']
    }
  }
}))
