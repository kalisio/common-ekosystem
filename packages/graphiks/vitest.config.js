import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    name: 'graphiks',
    environment: 'happy-dom',
    globals: true,
    silent: false,
    testTimeout: 30000
  }
})
