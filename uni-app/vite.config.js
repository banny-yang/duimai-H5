import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import Uni from '@uni-helper/plugin-uni'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (!env.VITE_API_BASE_URL && mode === 'production') {
    console.warn(
      '\n[duimai-h5-uni-app] 未找到 VITE_API_BASE_URL。' +
        '小程序 build 请创建 .env.production（可参考 .env.production.example）\n',
    )
  }

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [Uni()],
    server: {
      port: 5181,
      proxy: {
        '/api': {
          target: 'http://localhost:8091',
          changeOrigin: true,
        },
      },
    },
  }
})


