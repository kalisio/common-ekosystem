import { defineConfig } from 'vite'
import { resolve } from 'path'

export const defaultConfig = {
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.cjs'
    },
    rollupOptions: {
      external: []
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true
  }
}

export default defineConfig(defaultConfig)
