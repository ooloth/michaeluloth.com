import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    // Default to node environment for most tests (io/, utils/, etc.)
    // Tests that need a DOM, including the app/ route and page tests, specify happy-dom via
    // @vitest-environment docblock
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
