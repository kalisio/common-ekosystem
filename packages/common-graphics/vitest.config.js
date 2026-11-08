import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import { baseConfig } from '../../vitest.base-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  test: {
    name: 'common-graphics',
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.browser.test.js', 'happy-dom']
    ]
  }
}))
