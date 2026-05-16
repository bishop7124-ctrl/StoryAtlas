import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/backup-before-app-launch-route-fix/**',
        '**/backup-before-launch-fix/**',
        '**/.claude/**',
        '**/broken-files/**',
        '**/dist/**',
        '**/dist-test/**',
        '**/functions/**',
        '**/node_modules.broken-20260505/**',
      ],
    },
  },
})
