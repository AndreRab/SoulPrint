import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'github-pages-spa-fallback',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
  server: { proxy: { '/api': 'http://localhost:7071' } },
  base: process.env.GITHUB_PAGES ? '/SoulPrint/' : '/',
})
