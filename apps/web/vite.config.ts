import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { proxy: { '/api': 'http://localhost:7071' } },
  base: process.env.GITHUB_PAGES ? '/SoulPrint/' : '/',
})
