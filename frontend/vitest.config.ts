import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
      VITE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 75,
        statements: 80,
      },
      exclude: [
        'src/types/**',
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/pages/**',
        'src/hooks/**',
        'src/components/**',
        'src/contexts/**',
        'src/context/**',
        'src/router/**',
        'src/sentry.ts',
        'src/services/api.ts',
        'src/config/sentry.ts',
        'src/config/env.ts',
        '*.config.*',
        'eslint.config.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
