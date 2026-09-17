import path from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx({ include: [/\.[jt]sx?$/] })],
  resolve: {
    alias: {
      '@/components/EasyAdmin': path.resolve(__dirname, 'src/easyadmin/ui/vue'),
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/unit/setup.js'],
    include: ['tests/unit/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      include: ['src/easyadmin/ui/vue/**/*.{vue,ts}'],
      thresholds: {
        statements: 100,
        branches: 100,
        lines: 100
      }
    }
  }
})
