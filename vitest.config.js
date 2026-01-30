import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/test/**/*.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      clean: true,
      include: ['packages/*/src/**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/dist/**',
        '**/*.test.js'
      ]
    },
    silent: false,
    testTimeout: 30000,
    projects: [
      {
        test: {
          name: 'check',
          root: 'packages/check',
          include: ['test/**/*.js']
        }
      },
      {
        test: {
          name: 'geokit',
          root: 'packages/geokit',
          include: ['test/**/*.js']
        }
      },
      {
        test: {
          name: 'graphiks',
          root: 'packages/graphiks',
          include: ['test/**/*.js']
        }
      }
    ]
  }
})
