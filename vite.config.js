import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'study'),
  build: {
    outDir: path.resolve(__dirname, 'study/dist'),
    emptyOutDir: true
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false
  }
})
