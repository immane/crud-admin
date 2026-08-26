const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
}))

vi.mock('js-cookie', () => ({
  __esModule: true,
  default: mocks
}))

import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken } from '@/utils/auth'

describe('Utils:auth', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.set.mockReset()
    mocks.remove.mockReset()
  })

  it('getToken reads dream_studio_admin_token', () => {
    mocks.get.mockReturnValue('abc')
    expect(getToken()).toBe('abc')
    expect(mocks.get).toHaveBeenCalledWith('dream_studio_admin_token')
  })

  it('getToken returns undefined when no cookie', () => {
    mocks.get.mockReturnValue(undefined)
    expect(getToken()).toBeUndefined()
  })

  it('setToken writes token', () => {
    mocks.set.mockReturnValue('ok')
    const ret = setToken('my-token')
    expect(mocks.set).toHaveBeenCalledWith('dream_studio_admin_token', 'my-token')
    expect(ret).toBe('ok')
  })

  it('setToken handles empty string', () => {
    setToken('')
    expect(mocks.set).toHaveBeenCalledWith('dream_studio_admin_token', '')
  })

  it('removeToken deletes token cookie', () => {
    mocks.remove.mockReturnValue('removed')
    const ret = removeToken()
    expect(mocks.remove).toHaveBeenCalledWith('dream_studio_admin_token')
    expect(ret).toBe('removed')
  })

  it('getRefreshToken reads refresh token key', () => {
    mocks.get.mockReturnValue('refresh-123')
    expect(getRefreshToken()).toBe('refresh-123')
    expect(mocks.get).toHaveBeenCalledWith('dream_studio_admin_refresh_token')
  })

  it('setRefreshToken writes refresh token', () => {
    setRefreshToken('r-token')
    expect(mocks.set).toHaveBeenCalledWith('dream_studio_admin_refresh_token', 'r-token')
  })

  it('removeRefreshToken deletes refresh cookie', () => {
    removeRefreshToken()
    expect(mocks.remove).toHaveBeenCalledWith('dream_studio_admin_refresh_token')
  })

  it('token and refresh token keys are isolated', () => {
    mocks.get.mockImplementation(key => key === 'dream_studio_admin_token' ? 'A' : 'B')
    expect(getToken()).toBe('A')
    expect(getRefreshToken()).toBe('B')
  })
})
