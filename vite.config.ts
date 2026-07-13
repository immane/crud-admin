import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
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

function createApiProxy(target: string) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure(proxy: any) {
      proxy.on('proxyReq', proxyRequestBody)
      proxy.on('error', (error: Error) => {
        console.error('[vite proxy]', error.message)
      })
    }
  }
}

function createProxyConfig(target?: string) {
  if (!target) return undefined

  return {
    '/api': createApiProxy(target),
    '/system': createApiProxy(target),
    '/upload': createApiProxy(target),
    '/uploads': createApiProxy(target)
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const proxyTarget = env.VITE_PROXY_TARGET

  return {
    base: mode === 'development' ? '/' : '/admin/',
    define: {
      'process.env.VITE_BASE_API': JSON.stringify(env.VITE_BASE_API || ''),
      'process.env.VITE_PROXY_TARGET': JSON.stringify(env.VITE_PROXY_TARGET || ''),
      'process.env.MEDIA_STORAGE_DEFAULT': JSON.stringify(env.MEDIA_STORAGE_DEFAULT || 'local'),
      'process.env.VITE_API_PREFIX': JSON.stringify(env.VITE_API_PREFIX || '/api/v1'),
      'process.env.VITE_AUTH_API_PREFIX': JSON.stringify(env.VITE_AUTH_API_PREFIX || '/api/auth'),
      'process.env.VITE_SYSTEM_API_PREFIX': JSON.stringify(env.VITE_SYSTEM_API_PREFIX || '/system'),
      'process.env.VITE_TINYMCE_SRC': JSON.stringify(env.VITE_TINYMCE_SRC || '')
    },
    plugins: [
      vue(),
      vueJsx({ include: [/\.[jt]sx?$/] })
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
      proxy: createProxyConfig(proxyTarget)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: false
    }
  }
})
