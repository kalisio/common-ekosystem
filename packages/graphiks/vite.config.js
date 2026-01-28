import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from '../../vite.config'

export default mergeConfig(baseConfig, defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    open: '/example/index.html'
  }
}))
