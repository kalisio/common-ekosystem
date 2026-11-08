import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from '../../vite.base-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: {
        'predicates/index': 'src/predicates/index.js',
        'utilities/index': 'src/utilities/index.js',
        'runtime/index': 'src/runtime/index.js',
        'io/json': 'src/io/json.js',
        'io/csv': 'src/io/csv.js',
        'io/xml': 'src/io/xml.js',
        'io/yaml': 'src/io/yaml.js',
        'operators/compare': 'src/operators/compare.js',
        'operators/quantify': 'src/operators/quantify.js',
        'operators/request': 'src/operators/request.js',
        'operators/sanitize': 'src/operators/sanitize.js',
        'operators/transform': 'src/operators/transform.js'
      }
    }
  }
}))
