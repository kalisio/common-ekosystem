import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from '../../vite.base-config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: {
        'index.browser': 'src/index.browser.js',
        'index.node': 'src/index.node.js',
        'utilities/index.browser': 'src/utilities/index.browser.js',
        'utilities/index.node': 'src/utilities/index.node.js',
        'shapes/index': 'src/shapes/index.js'
      }
    },
    rolldownOptions: {
      // Keep subpath imports (e.g. '#utilities') unresolved in the build output.
      // Without this, Vite would resolve them now, bundle only one implementation
      // and the package would no longer work in both environments.
      external: [
        /^#/
      ]
    }
  }
}))
