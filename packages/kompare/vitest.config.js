import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    name: 'kompare',
    environment: 'node',
    globals: true,
    silent: false,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      all: true,
      clean: true,
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'test/**',
        '*.config.js'
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../../coverage/kompare'
    }
  }
})
