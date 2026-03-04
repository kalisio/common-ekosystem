import { defineConfig, mergeConfig } from 'vite'
import { defaultConfig } from '../../vite.config'

export default mergeConfig(defaultConfig, defineConfig({
  root: __dirname,
  build: {
    rollupOptions: {
      external: ['@kalisio/check']
    }
  }
}))
