import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
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
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
