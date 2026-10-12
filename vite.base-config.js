import { readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The build must run from a package directory (as pnpm scripts do), not from the workspace root
const workspaceRoot = dirname(fileURLToPath(import.meta.url))
if (process.cwd() === workspaceRoot) {
  throw new Error('vite build must be run from a package directory, not from the workspace root')
}

const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
const escape = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const dependencies = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {})
]

export const baseConfig = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    rollupOptions: {
      // Node built-ins and package dependencies, including their subpaths
      // (e.g. @kalisio/common-core/predicates), are never bundled
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        ...dependencies.map(name => new RegExp(`^${escape(name)}(/.*)?$`))
      ]
    }
  }
})