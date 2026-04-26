import { fileURLToPath } from 'node:url'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from '../../vite.base-config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: {
        index: 'src/index.js',
        'predicates/index': 'src/predicates/index.js',
        'utilities/index': 'src/utilities/index.js'
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.mjs` : `${entryName}.cjs`
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ]
    }
  }
}))
