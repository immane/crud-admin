const authMocks = vi.hoisted(() => ({
  getToken: vi.fn(() => '')
}))

vi.mock('@/utils/auth', () => ({
  __esModule: true,
  getToken: (...args) => authMocks.getToken(...args)
}))

import { resolveUploadHost, getUploadUrl, getUploadData, getPictureUrl, getUploadHeaders, resolveUploadPath } from '@/utils/upload'

describe('Utils:upload', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    authMocks.getToken.mockReset()
    authMocks.getToken.mockReturnValue('')
    process.env.VITE_BASE_API = ''
    process.env.VITE_PROXY_TARGET = ''
    process.env.MEDIA_STORAGE_DEFAULT = 'local'
  })

  afterEach(() => {
    Object.keys(process.env).forEach(k => delete process.env[k])
    Object.assign(process.env, originalEnv)
    vi.restoreAllMocks()
  })

  describe('resolveUploadHost', () => {
    it('prioritizes VITE_BASE_API when set', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      expect(resolveUploadHost()).toBe('https://api.example.com')
    })

    it('trims VITE_BASE_API', () => {
      process.env.VITE_BASE_API = '  https://api.example.com  '
      expect(resolveUploadHost()).toBe('https://api.example.com')
    })

    it('returns window.location.origin when VITE_BASE_API empty and window exists', () => {
      process.env.VITE_BASE_API = ''
      process.env.VITE_PROXY_TARGET = 'https://proxy.example.com'
      const host = resolveUploadHost()
      expect(host).toBe(window.location.origin)
      expect(host).not.toBe('https://proxy.example.com')
    })

    it('falls back to VITE_PROXY_TARGET when window undefined', async () => {
      vi.resetModules()
      const savedWindow = globalThis.window
      // @ts-ignore
      delete globalThis.window
      process.env.VITE_BASE_API = ''
      process.env.VITE_PROXY_TARGET = 'https://proxy.example.com'
      const mod = await import('@/utils/upload')
      expect(mod.resolveUploadHost()).toBe('https://proxy.example.com')
      globalThis.window = savedWindow
      vi.resetModules()
      // re-import to restore original module for other tests is not needed because we keep using original functions
      // but we need to ensure next tests use fresh env; we already reset modules so re-import original via side effect
      await import('@/utils/upload')
    })

    it('trims VITE_PROXY_TARGET when window undefined', async () => {
      vi.resetModules()
      const savedWindow = globalThis.window
      delete globalThis.window
      process.env.VITE_BASE_API = ''
      process.env.VITE_PROXY_TARGET = '  https://proxy.example.com  '
      const mod = await import('@/utils/upload')
      expect(mod.resolveUploadHost()).toBe('https://proxy.example.com')
      globalThis.window = savedWindow
      vi.resetModules()
      await import('@/utils/upload')
    })

    it('returns empty string when no env and window undefined', async () => {
      vi.resetModules()
      const savedWindow = globalThis.window
      delete globalThis.window
      process.env.VITE_BASE_API = ''
      process.env.VITE_PROXY_TARGET = ''
      const mod = await import('@/utils/upload')
      expect(mod.resolveUploadHost()).toBe('')
      globalThis.window = savedWindow
      vi.resetModules()
      await import('@/utils/upload')
    })

    it('returns empty string when VITE_PROXY_TARGET whitespace only and window undefined', async () => {
      vi.resetModules()
      const savedWindow = globalThis.window
      delete globalThis.window
      process.env.VITE_BASE_API = '   '
      process.env.VITE_PROXY_TARGET = '   '
      const mod = await import('@/utils/upload')
      expect(mod.resolveUploadHost()).toBe('')
      globalThis.window = savedWindow
      vi.resetModules()
      await import('@/utils/upload')
    })
  })

  describe('getUploadUrl', () => {
    it('concatenates host and endpoint', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      expect(getUploadUrl()).toBe('https://api.example.com/api/v1/manage/media/upload')
    })

    it('handles host with trailing slash via getPictureUrl host normalization (getUploadUrl does not trim)', () => {
      process.env.VITE_BASE_API = 'https://api.example.com/'
      expect(getUploadUrl()).toBe('https://api.example.com//api/v1/manage/media/upload')
    })

    it('uses window origin when no base api', () => {
      process.env.VITE_BASE_API = ''
      expect(getUploadUrl()).toBe(`${window.location.origin}/api/v1/manage/media/upload`)
    })
  })

  describe('getUploadData', () => {
    it('returns provided storage', () => {
      expect(getUploadData('s3')).toEqual({ storage: 's3' })
      expect(getUploadData('local')).toEqual({ storage: 'local' })
    })

    it('falls back to MEDIA_STORAGE_DEFAULT env', () => {
      process.env.MEDIA_STORAGE_DEFAULT = 's3'
      expect(getUploadData()).toEqual({ storage: 's3' })
      expect(getUploadData('')).toEqual({ storage: 's3' })
      expect(getUploadData(null)).toEqual({ storage: 's3' })
      expect(getUploadData(undefined)).toEqual({ storage: 's3' })
    })

    it('trims MEDIA_STORAGE_DEFAULT', () => {
      process.env.MEDIA_STORAGE_DEFAULT = '  s3  '
      expect(getUploadData()).toEqual({ storage: 's3' })
    })

    it('defaults to local when env empty', () => {
      process.env.MEDIA_STORAGE_DEFAULT = ''
      expect(getUploadData()).toEqual({ storage: 'local' })
    })

    it('returns empty string when MEDIA_STORAGE_DEFAULT is whitespace only (trim yields empty)', () => {
      process.env.MEDIA_STORAGE_DEFAULT = '   '
      expect(getUploadData()).toEqual({ storage: '' })
    })
  })

  describe('getPictureUrl', () => {
    it('returns falsy as-is', () => {
      expect(getPictureUrl('')).toBe('')
      expect(getPictureUrl(null)).toBe(null)
      expect(getPictureUrl(undefined)).toBe(undefined)
      expect(getPictureUrl(0)).toBe(0)
    })

    it('returns absolute url unchanged for http/https', () => {
      expect(getPictureUrl('https://cdn.example.com/img.jpg')).toBe('https://cdn.example.com/img.jpg')
      expect(getPictureUrl('http://example.com/a.png')).toBe('http://example.com/a.png')
    })

    it('treats protocol-relative URL as not absolute (is-absolute-url behavior)', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      // is-absolute-url returns false for '//cdn...'
      expect(getPictureUrl('//cdn.example.com/img.jpg')).toBe('https://api.example.com//cdn.example.com/img.jpg')
    })

    it('prefixes relative name with /uploads/images/', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      expect(getPictureUrl('a.jpg')).toBe('https://api.example.com/uploads/images/a.jpg')
      expect(getPictureUrl('folder/b.png')).toBe('https://api.example.com/uploads/images/folder/b.png')
    })

    it('handles leading slash correctly', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      expect(getPictureUrl('/uploads/images/a.jpg')).toBe('https://api.example.com/uploads/images/a.jpg')
      expect(getPictureUrl('/custom/path.jpg')).toBe('https://api.example.com/custom/path.jpg')
    })

    it('strips trailing slash from host', () => {
      process.env.VITE_BASE_API = 'https://api.example.com/'
      expect(getPictureUrl('a.jpg')).toBe('https://api.example.com/uploads/images/a.jpg')
      expect(getPictureUrl('/uploads/images/a.jpg')).toBe('https://api.example.com/uploads/images/a.jpg')
    })

    it('converts numeric name to string', () => {
      process.env.VITE_BASE_API = 'https://api.example.com'
      expect(getPictureUrl(123)).toBe('https://api.example.com/uploads/images/123')
    })

    it('uses window origin when no base api', () => {
      process.env.VITE_BASE_API = ''
      const result = getPictureUrl('a.jpg')
      expect(result).toBe(`${window.location.origin}/uploads/images/a.jpg`)
    })
  })

  describe('getUploadHeaders', () => {
    it('returns Authorization when token exists', () => {
      authMocks.getToken.mockReturnValue('token-123')
      expect(getUploadHeaders()).toEqual({ Authorization: 'Bearer token-123' })
      expect(authMocks.getToken).toHaveBeenCalled()
    })

    it('returns empty object when no token', () => {
      authMocks.getToken.mockReturnValue('')
      expect(getUploadHeaders()).toEqual({})
      authMocks.getToken.mockReturnValue(null)
      expect(getUploadHeaders()).toEqual({})
      authMocks.getToken.mockReturnValue(undefined)
      expect(getUploadHeaders()).toEqual({})
    })
  })

  describe('resolveUploadPath', () => {
    beforeEach(() => {
      process.env.VITE_BASE_API = 'https://api.example.com'
    })

    it('returns null for falsy data', () => {
      expect(resolveUploadPath(null)).toBeNull()
      expect(resolveUploadPath(undefined)).toBeNull()
      expect(resolveUploadPath({})).toBeNull()
      expect(resolveUploadPath({ data: null })).toBeNull()
      expect(resolveUploadPath({ data: '' })).toBeNull()
      expect(resolveUploadPath({ data: 0 })).toBeNull()
    })

    it('handles string data', () => {
      expect(resolveUploadPath({ data: 'a.jpg' })).toBe('https://api.example.com/uploads/images/a.jpg')
      expect(resolveUploadPath({ data: '/uploads/images/a.jpg' })).toBe('https://api.example.com/uploads/images/a.jpg')
      expect(resolveUploadPath({ data: 'https://cdn.com/a.jpg' })).toBe('https://cdn.com/a.jpg')
    })

    it('handles object data with path', () => {
      expect(resolveUploadPath({ data: { path: 'b.jpg' } })).toBe('https://api.example.com/uploads/images/b.jpg')
      expect(resolveUploadPath({ data: { path: '/custom/b.jpg' } })).toBe('https://api.example.com/custom/b.jpg')
    })

    it('returns null when object data has no path', () => {
      expect(resolveUploadPath({ data: {} })).toBeNull()
      expect(resolveUploadPath({ data: { path: '' } })).toBeNull()
      expect(resolveUploadPath({ data: { path: null } })).toBeNull()
      expect(resolveUploadPath({ data: { url: 'a.jpg' } })).toBeNull()
    })
  })
})
