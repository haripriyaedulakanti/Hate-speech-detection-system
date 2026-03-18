import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to the FastAPI backend
      '/predict-text': 'http://localhost:8000',
      '/predict-voice': 'http://localhost:8000',
    }
  }
})
