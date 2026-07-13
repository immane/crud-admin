import isAbsoluteUrl from 'is-absolute-url'
import { getToken } from '@/utils/auth'

const UPLOAD_ENDPOINT = '/api/v1/manage/media/upload'

export function resolveUploadHost() {
  const baseApi = String(process.env.VITE_BASE_API || '').trim()
  if (baseApi) return baseApi

  // Browser uploads must use the same-origin Vite proxy. Sending the bearer
  // token directly to VITE_PROXY_TARGET triggers an unsupported CORS preflight.
  if (typeof window !== 'undefined') return window.location.origin

  const proxyTarget = String(process.env.VITE_PROXY_TARGET || '').trim()
  if (proxyTarget) return proxyTarget

  return ''
}

export function getUploadUrl() {
  const host = resolveUploadHost()
  return `${host}${UPLOAD_ENDPOINT}`
}

export function getUploadData(storage) {
  return {
    storage: storage || String(process.env.MEDIA_STORAGE_DEFAULT || 'local').trim()
  }
}

export function getPictureUrl(name) {
  if (!name) return name
  const value = String(name)
  if (isAbsoluteUrl(value)) return value
  const path = value.startsWith('/') ? value : `/uploads/images/${value}`
  return `${resolveUploadHost().replace(/\/$/, '')}${path}`
}

export function getUploadHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function resolveUploadPath(response) {
  const data = response?.data
  if (!data) return null
  const path = typeof data === 'string' ? data : data.path
  return path ? getPictureUrl(path) : null
}
