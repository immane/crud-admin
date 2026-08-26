import { vi } from 'vitest'

describe('api/prefix', () => {
  const ENV_KEYS = ['VITE_API_PREFIX', 'VITE_AUTH_API_PREFIX', 'VITE_SYSTEM_API_PREFIX']

  function saveEnv() {
    const saved = {}
    ENV_KEYS.forEach(k => { saved[k] = process.env[k] })
    return saved
  }
  function restoreEnv(saved) {
    ENV_KEYS.forEach(k => {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    })
  }
  async function loadPrefix(envOverrides = {}) {
    vi.resetModules()
    const saved = saveEnv()
    Object.entries(envOverrides).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    })
    // import fresh module – use explicit .ts to avoid ambiguity
    const mod = await import('@/api/prefix.ts')
    restoreEnv(saved)
    return mod
  }

  // normal import for pure function tests (default env)
  let prefixMod
  beforeEach(async () => {
    vi.resetModules()
    prefixMod = await import('@/api/prefix.ts')
  })
  afterEach(() => {
    vi.resetModules()
  })

  describe('trimSlashes (via apiPath & constants)', () => {
    it('trims leading and trailing slashes', () => {
      expect(prefixMod.apiPath('///api/v1///', '///users///')).toBe('/api/v1/users')
    })
    it('trims single leading slash', () => {
      expect(prefixMod.apiPath('/api', '/path')).toBe('/api/path')
    })
    it('trims single trailing slash', () => {
      expect(prefixMod.apiPath('api/', 'path/')).toBe('/api/path')
    })
    it('trims multiple slashes on both sides', () => {
      expect(prefixMod.apiPath('///api///', '///test///')).toBe('/api/test')
    })
    it('handles empty string prefix/path', () => {
      expect(prefixMod.apiPath('', '')).toBe('/')
      expect(prefixMod.apiPath('', 'users')).toBe('/users')
      expect(prefixMod.apiPath('api', '')).toBe('/api')
    })
    it('handles undefined / null via String coercion (value || "")', () => {
      // String(value || '') where value undefined => ''
      expect(prefixMod.apiPath(undefined, undefined)).toBe('/')
      expect(prefixMod.apiPath(null, null)).toBe('/')
      // @ts-ignore – explicit undefined path param uses default ''
      expect(prefixMod.apiPath('api', undefined)).toBe('/api')
      expect(prefixMod.apiPath(undefined, 'path')).toBe('/path')
    })
    it('handles "/" only -> empty after trim', () => {
      expect(prefixMod.apiPath('/', '/')).toBe('/')
      expect(prefixMod.apiPath('/', 'users')).toBe('/users')
      expect(prefixMod.apiPath('///', '///')).toBe('/')
    })
    it('preserves inner slashes', () => {
      expect(prefixMod.apiPath('api/v1', 'users/list')).toBe('/api/v1/users/list')
      expect(prefixMod.apiPath('//api//v1//', '//users//list//')).toBe('/api//v1/users//list')
    })
  })

  describe('default constants when env absent', () => {
    it('API_PREFIX defaults to api/v1', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: undefined, VITE_AUTH_API_PREFIX: undefined, VITE_SYSTEM_API_PREFIX: undefined })
      expect(mod.API_PREFIX).toBe('api/v1')
      expect(mod.AUTH_API_PREFIX).toBe('api/auth')
      expect(mod.SYSTEM_API_PREFIX).toBe('system')
    })
    it('API_PREFIX trims correctly when default fallback has leading slash', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: undefined })
      // fallback '/api/v1' -> trimSlashes => 'api/v1'
      expect(mod.API_PREFIX).toBe('api/v1')
    })
  })

  describe('constants with env values', () => {
    it('uses env value when provided', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '/custom/api', VITE_AUTH_API_PREFIX: '/custom/auth', VITE_SYSTEM_API_PREFIX: '/custom/system' })
      expect(mod.API_PREFIX).toBe('custom/api')
      expect(mod.AUTH_API_PREFIX).toBe('custom/auth')
      expect(mod.SYSTEM_API_PREFIX).toBe('custom/system')
    })
    it('trims multi-slash env values', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '///custom///', VITE_AUTH_API_PREFIX: '///auth///', VITE_SYSTEM_API_PREFIX: '///sys///' })
      expect(mod.API_PREFIX).toBe('custom')
      expect(mod.AUTH_API_PREFIX).toBe('auth')
      expect(mod.SYSTEM_API_PREFIX).toBe('sys')
    })
    it('handles env with trailing and leading slashes and inner path', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '//api/v2//', VITE_AUTH_API_PREFIX: '/api/auth/v2/', VITE_SYSTEM_API_PREFIX: 'system/' })
      expect(mod.API_PREFIX).toBe('api/v2')
      expect(mod.AUTH_API_PREFIX).toBe('api/auth/v2')
      expect(mod.SYSTEM_API_PREFIX).toBe('system')
    })
    it('handles empty string env -> falls back to default (via ||)', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '', VITE_AUTH_API_PREFIX: '', VITE_SYSTEM_API_PREFIX: '' })
      // '' is falsy -> fallback '/api/v1' etc
      expect(mod.API_PREFIX).toBe('api/v1')
      expect(mod.AUTH_API_PREFIX).toBe('api/auth')
      expect(mod.SYSTEM_API_PREFIX).toBe('system')
    })
    it('each constant independent with mixed env', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '/a', VITE_AUTH_API_PREFIX: undefined, VITE_SYSTEM_API_PREFIX: '///s///' })
      expect(mod.API_PREFIX).toBe('a')
      expect(mod.AUTH_API_PREFIX).toBe('api/auth')
      expect(mod.SYSTEM_API_PREFIX).toBe('s')
    })
  })

  describe('apiPath() combinations', () => {
    it('combines two normal segments', () => {
      expect(prefixMod.apiPath('api/v1', 'users')).toBe('/api/v1/users')
    })
    it('filters empty segments (only prefix)', () => {
      expect(prefixMod.apiPath('api', '')).toBe('/api')
      expect(prefixMod.apiPath('api', undefined)).toBe('/api')
    })
    it('filters empty segments (only path)', () => {
      expect(prefixMod.apiPath('', 'users')).toBe('/users')
      expect(prefixMod.apiPath('/', 'users')).toBe('/users')
      expect(prefixMod.apiPath('', '/users')).toBe('/users')
    })
    it('both empty returns "/"', () => {
      expect(prefixMod.apiPath('', '')).toBe('/')
      expect(prefixMod.apiPath('/', '/')).toBe('/')
    })
    it('both have multi slashes -> trimmed and joined', () => {
      expect(prefixMod.apiPath('///api/v1///', '///users///')).toBe('/api/v1/users')
      expect(prefixMod.apiPath('///', '///test///')).toBe('/test')
    })
    it('first arg multi slash, second empty', () => {
      expect(prefixMod.apiPath('///api///', '')).toBe('/api')
    })
    it('reuses exported constants with apiPath', async () => {
      const mod = await loadPrefix({ VITE_API_PREFIX: '/api/v1' })
      expect(mod.apiPath(mod.API_PREFIX, 'users')).toBe('/api/v1/users')
      expect(mod.apiPath(mod.API_PREFIX, '/users/')).toBe('/api/v1/users')
    })
    it('handles path with leading slash', () => {
      expect(prefixMod.apiPath('api', '/users')).toBe('/api/users')
      expect(prefixMod.apiPath('/api/', '/users/')).toBe('/api/users')
    })
  })
})
