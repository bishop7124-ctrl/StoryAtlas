import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    watch: {
      ignored: (path) => path.includes('backup-before-app-launch-route-fix') ||
        path.includes('backup-before-launch-fix') ||
        path.includes('/.claude/') ||
        path.includes('broken-files') ||
        path.includes('/dist/') ||
        path.includes('dist-test') ||
        path.includes('/functions/') ||
        path.includes('node_modules.broken-20260505'),
    },
  },
})
