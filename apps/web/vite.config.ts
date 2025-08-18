import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
  outDir: 'dist',
  // Disable sourcemaps in production builds to avoid noisy warnings like
  // "Error when using sourcemap for reporting an error: Can't resolve original location"
  // from dependencies that ship incomplete maps (e.g., MUI). Dev server maps are unaffected.
  sourcemap: false,
  },
})
