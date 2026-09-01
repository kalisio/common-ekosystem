import { fileURLToPath } from 'node:url'
import { builtinModules } from 'node:module'
import { dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from '../../vite.base-config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: {
        index: 'src/index.js',
        'predicates/index': 'src/predicates/index.js',
        'utilities/index': 'src/utilities/index.js',
        'io/index': 'src/io/index.js',
        'operators/compare': 'src/operators/compare.js',
        'operators/quantify': 'src/operators/quantify.js',
        'operators/sanitize': 'src/operators/sanitize.js',
        'operators/transform': 'src/operators/transform.js'
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => format === 'es' ? `${name}.mjs` : `${name}.cjs`
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {})
      ]
    }
  }
}))
