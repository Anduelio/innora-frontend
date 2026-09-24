import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { gzipAndCache } from './vite/gzip'

function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('date-fns')) return 'dates'
  if (id.includes('node_modules/zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'forms'
  if (id.includes('@tanstack')) return 'query'
  if (id.includes('i18next')) return 'i18n'
  if (id.includes('react-router')) return 'router'
  return 'vendor'
}

export default defineConfig({
  plugins: [react(), gzipAndCache()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]__[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: (source: string, filename: string) => {
          if (filename.split('\\').join('/').includes('/src/styles/')) return source
          return `@use "@/styles/abstracts" as *;\n${source}`
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://innora-backend.test', changeOrigin: true, secure: false },
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
