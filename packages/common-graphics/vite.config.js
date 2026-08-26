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
        'index.browser': 'src/index.browser.js',
        'index.node': 'src/index.node.js',
        'utilities/index.browser': 'src/utilities/index.browser.js',
        'utilities/index.node': 'src/utilities/index.node.js',
        'shapes/index': 'src/shapes/index.js'
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => format === 'es' ? `${name}.mjs` : `${name}.cjs`
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
        /^#/
      ]
    }
  }
}))
