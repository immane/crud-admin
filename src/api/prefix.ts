const trimSlashes = (value: string) => String(value || '').replace(/^\/+|\/+$/g, '')

export const API_PREFIX = trimSlashes(process.env.VITE_API_PREFIX || '/api/v1')
export const AUTH_API_PREFIX = trimSlashes(process.env.VITE_AUTH_API_PREFIX || '/api/auth')
export const SYSTEM_API_PREFIX = trimSlashes(process.env.VITE_SYSTEM_API_PREFIX || '/system')

export function apiPath(prefix: string, path = ''): string {
  return `/${[trimSlashes(prefix), trimSlashes(path)].filter(Boolean).join('/')}`
}
