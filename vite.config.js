import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
