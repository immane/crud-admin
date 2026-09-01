const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
}))

vi.mock('js-cookie', () => ({
  __esModule: true,
  default: mocks
}))

import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken, __test__ } from '@/utils/auth'

describe('Utils:auth', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.set.mockReset()
    mocks.remove.mockReset()
  })

  it('getToken reads namespaced token key', () => {
    const expectedKey = __test__.getTokenKey()
    mocks.get.mockReturnValue('abc')
    expect(getToken()).toBe('abc')
    expect(mocks.get).toHaveBeenCalledWith(expectedKey)
  })

  it('getToken falls back to legacy key when namespaced missing', () => {
    const expectedKey = __test__.getTokenKey()
    const legacy = __test__.BASE_TOKEN_KEY
    if (expectedKey !== legacy) {
      mocks.get.mockImplementation(key => key === expectedKey ? undefined : 'legacy-val')
      expect(getToken()).toBe('legacy-val')
      expect(mocks.get).toHaveBeenCalledWith(expectedKey)
      expect(mocks.get).toHaveBeenCalledWith(legacy)
    } else {
      mocks.get.mockReturnValue(undefined)
      expect(getToken()).toBeUndefined()
    }
  })

  it('getToken returns undefined when no cookie', () => {
    mocks.get.mockReturnValue(undefined)
    expect(getToken()).toBeUndefined()
  })

  it('setToken writes namespaced token', () => {
    const expectedKey = __test__.getTokenKey()
    mocks.set.mockReturnValue('ok')
    const ret = setToken('my-token')
    expect(mocks.set).toHaveBeenCalledWith(expectedKey, 'my-token')
    expect(ret).toBe('ok')
  })

  it('setToken handles empty string', () => {
    const expectedKey = __test__.getTokenKey()
    setToken('')
    expect(mocks.set).toHaveBeenCalledWith(expectedKey, '')
  })

  it('removeToken deletes namespaced and legacy cookie', () => {
    const expectedKey = __test__.getTokenKey()
    mocks.remove.mockReturnValue('removed')
    const ret = removeToken()
    expect(mocks.remove).toHaveBeenCalledWith(expectedKey)
    if (expectedKey !== __test__.BASE_TOKEN_KEY) {
      expect(mocks.remove).toHaveBeenCalledWith(__test__.BASE_TOKEN_KEY)
    }
    expect(ret).toBe('removed')
  })

  it('getRefreshToken reads namespaced refresh token key', () => {
    const expectedKey = __test__.getRefreshTokenKey()
    mocks.get.mockReturnValue('refresh-123')
    expect(getRefreshToken()).toBe('refresh-123')
    expect(mocks.get).toHaveBeenCalledWith(expectedKey)
  })

  it('setRefreshToken writes namespaced refresh token', () => {
    const expectedKey = __test__.getRefreshTokenKey()
    setRefreshToken('r-token')
    expect(mocks.set).toHaveBeenCalledWith(expectedKey, 'r-token')
  })

  it('removeRefreshToken deletes namespaced and legacy cookie', () => {
    const expectedKey = __test__.getRefreshTokenKey()
    removeRefreshToken()
    expect(mocks.remove).toHaveBeenCalledWith(expectedKey)
    if (expectedKey !== __test__.BASE_REFRESH_TOKEN_KEY) {
      expect(mocks.remove).toHaveBeenCalledWith(__test__.BASE_REFRESH_TOKEN_KEY)
    }
  })

  it('token and refresh token keys are isolated', () => {
    const tokenKey = __test__.getTokenKey()
    const refreshKey = __test__.getRefreshTokenKey()
    expect(tokenKey).not.toBe(refreshKey)
    mocks.get.mockImplementation(key => key === tokenKey ? 'A' : 'B')
    expect(getToken()).toBe('A')
    // reset mock for second call to avoid fallback interference
    mocks.get.mockImplementation(key => key === refreshKey ? 'B' : 'A')
    expect(getRefreshToken()).toBe('B')
  })

  it('namespace isolates different ports', () => {
    // jsdom default is http://localhost:3000, suffix should contain port
    const suffix = __test__.getNamespaceSuffix()
    // In test env, port is 3000, so suffix should contain 3000
    expect(suffix).toContain('3000')
    const tokenKey = __test__.getTokenKey()
    expect(tokenKey).toContain('3000')
  })
})
