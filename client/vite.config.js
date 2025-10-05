import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use root base during development so you can open http://localhost:5173/
// Use the repo subpath for production builds so GH Pages assets resolve.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/food-ordering/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5051',
        changeOrigin: true
      }
    }
  }
}))
