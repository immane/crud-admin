import Cookies from 'js-cookie'

const BASE_TOKEN_KEY = 'dream_studio_admin_token'
const BASE_REFRESH_TOKEN_KEY = 'dream_studio_admin_refresh_token'

function getNamespaceSuffix() {
  try {
    const port = typeof window !== 'undefined' && window.location ? window.location.port : ''
    if (!port) return ''
    return `_${port}`
  } catch {
    return ''
  }
}

function buildKey(base) {
  return `${base}${getNamespaceSuffix()}`
}

function getTokenKey() {
  return buildKey(BASE_TOKEN_KEY)
}

function getRefreshTokenKey() {
  return buildKey(BASE_REFRESH_TOKEN_KEY)
}

export function getToken() {
  const key = getTokenKey()
  const val = Cookies.get(key)
  if (val) return val
  // Fallback to legacy key for migration after upgrade (avoid forced re-login)
  if (key !== BASE_TOKEN_KEY) {
    return Cookies.get(BASE_TOKEN_KEY)
  }
  return val
}

export function setToken(token) {
  return Cookies.set(getTokenKey(), token)
}

export function removeToken() {
  const key = getTokenKey()
  const ret = Cookies.remove(key)
  if (key !== BASE_TOKEN_KEY) {
    Cookies.remove(BASE_TOKEN_KEY)
  }
  return ret
}

export function getRefreshToken() {
  const key = getRefreshTokenKey()
  const val = Cookies.get(key)
  if (val) return val
  if (key !== BASE_REFRESH_TOKEN_KEY) {
    return Cookies.get(BASE_REFRESH_TOKEN_KEY)
  }
  return val
}

export function setRefreshToken(token) {
  return Cookies.set(getRefreshTokenKey(), token)
}

export function removeRefreshToken() {
  const key = getRefreshTokenKey()
  const ret = Cookies.remove(key)
  if (key !== BASE_REFRESH_TOKEN_KEY) {
    Cookies.remove(BASE_REFRESH_TOKEN_KEY)
  }
  return ret
}

// Export helpers for testing / debugging (not part of public API)
export const __test__ = {
  getTokenKey,
  getRefreshTokenKey,
  getNamespaceSuffix,
  BASE_TOKEN_KEY,
  BASE_REFRESH_TOKEN_KEY
}
