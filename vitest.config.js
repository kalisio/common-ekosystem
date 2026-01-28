import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.js'],
    exclude: ['node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{js,ts}'],
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.js'
      ]
    },
    silent: false,
    testTimeout: 30000
  },
  projects: ['packages/*'].map(pkg => ({
    name: pkg.split('/').pop(),
    root: pkg,
    test: {
      environment: pkg.includes('graphiks') ? 'happy-dom' : 'node'
    }
  }))
})