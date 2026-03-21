import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (!env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required but not defined')
  }

  return {
    plugins: [
      react(),
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: true,
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 250,
      rollupOptions: {
        output: {
        manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@mui')) return 'mui';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('@tanstack')) return 'query';
              if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'vendor';
            }
          },
        },
      },
    },
  }
})
