import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue2'
import vueJsx from '@vitejs/plugin-vue2-jsx'
import path from 'node:path'

function resolve(dir: string) {
  return path.resolve(__dirname, dir)
}

function proxyRequestBody(proxyReq: any, req: any) {
  if (!req.body || !Object.keys(req.body).length) return

  const bodyData = JSON.stringify(req.body)
  proxyReq.setHeader('Content-Type', 'application/json')
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
  proxyReq.write(bodyData)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    base: mode === 'development' ? '/' : '/admin/',
    define: {
      'process.env.VITE_BASE_API': JSON.stringify(env.VITE_BASE_API || ''),
      'process.env.VITE_API_PREFIX': JSON.stringify(env.VITE_API_PREFIX || '/api/v1'),
      'process.env.VITE_AUTH_API_PREFIX': JSON.stringify(env.VITE_AUTH_API_PREFIX || '/api/auth'),
      'process.env.VITE_SYSTEM_API_PREFIX': JSON.stringify(env.VITE_SYSTEM_API_PREFIX || '/system'),
      'process.env.VITE_TINYMCE_SRC': JSON.stringify(env.VITE_TINYMCE_SRC || '')
    },
    plugins: [
    vue({
      script: {
        babelParserPlugins: ['jsx']
      }
    }),
    vueJsx({
      include: [/\.[jt]sx?$/, /\.vue\?vue&type=script/]
    })
    ],
    resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': resolve('src')
    }
    },
    server: {
    port: Number(process.env.port || process.env.npm_config_port) || 9528,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', proxyRequestBody)
        }
      },
      '/system': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', proxyRequestBody)
        }
      }
    }
    },
    build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: false
    }
  }
})
