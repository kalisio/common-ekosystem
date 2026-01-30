import { defineConfig, mergeConfig } from 'vite'
import { defaultConfig } from '../../vite.config'

export default mergeConfig(defaultConfig, defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    open: '/example/index.html'
  }
}))
