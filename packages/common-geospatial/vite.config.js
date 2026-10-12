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
        index: 'src/index.js',
        'foundation/index': 'src/foundation/index.js',
        'operators/index': 'src/operators/index.js',
        'io/index': 'src/io/index.js'
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => format === 'es' ? `${name}.mjs` : `${name}.cjs`
    }
  }
}))
