import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two pages: the DM window and the player display. Relative base, so the build
// works from any GitHub Pages path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        dm: resolve(__dirname, 'index.html'),
        display: resolve(__dirname, 'display.html')
      }
    }
  }
})
