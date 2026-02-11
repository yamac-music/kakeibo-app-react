/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
function normalizeBasePath(rawBasePath) {
  if (!rawBasePath) return '/'
  const withLeadingSlash = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`
  if (withLeadingSlash === '/') return '/'
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultBase = mode === 'production' ? '/kakeibo-app-react/' : '/'
  const base = normalizeBasePath(env.VITE_BASE_PATH || defaultBase)

  return {
    plugins: [react(), tailwindcss()],
    base,
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            charts: ['recharts']
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/features/expenses/**/*.js'],
        exclude: [
          'src/features/expenses/hooks/**',
          'src/features/expenses/repositories/ExpenseRepository.js',
          'src/features/expenses/repositories/firestoreExpenseRepository.js'
        ],
        thresholds: {
          statements: 55,
          branches: 45,
          functions: 55,
          lines: 55
        }
      }
    }
  }
})
