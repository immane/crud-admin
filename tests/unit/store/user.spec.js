const apiMocks = vi.hoisted(() => ({
  login: vi.fn(),
  getInfo: vi.fn(),
  logout: vi.fn()
}))

const authMocks = vi.hoisted(() => ({
  getToken: vi.fn(() => 'initial-token'),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  getRefreshToken: vi.fn(() => 'initial-refresh'),
  setRefreshToken: vi.fn(),
  removeRefreshToken: vi.fn()
}))

const routerMocks = vi.hoisted(() => ({
  addRoute: vi.fn(),
  resetRouter: vi.fn()
}))

vi.mock('@/api/user', () => ({
  __esModule: true,
  login: apiMocks.login,
  logout: apiMocks.logout,
  getInfo: apiMocks.getInfo
}))

vi.mock('@/utils/auth', () => ({
  __esModule: true,
  getToken: authMocks.getToken,
  setToken: authMocks.setToken,
  removeToken: authMocks.removeToken,
  getRefreshToken: authMocks.getRefreshToken,
  setRefreshToken: authMocks.setRefreshToken,
  removeRefreshToken: authMocks.removeRefreshToken
}))

vi.mock('@/router', () => ({
  __esModule: true,
  default: { addRoute: routerMocks.addRoute },
  resetRouter: routerMocks.resetRouter
}))

import user from '@/store/modules/user'

describe('store/modules/user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.getToken.mockReturnValue('initial-token')
    authMocks.getRefreshToken.mockReturnValue('initial-refresh')
  })

  describe('state', () => {
    it('has expected keys and namespaced', () => {
      expect(user.namespaced).toBe(true)
      expect(user.state).toHaveProperty('token')
      expect(user.state).toHaveProperty('refreshToken')
      expect(user.state).toHaveProperty('name')
      expect(user.state).toHaveProperty('avatar')
      expect(user.state).toHaveProperty('introduction')
      expect(user.state).toHaveProperty('roles')
    })
  })

  describe('mutations', () => {
    it('SET_TOKEN sets token', () => {
      const state = { token: '' }
      user.mutations.SET_TOKEN(state, 'abc')
      expect(state.token).toBe('abc')
    })
    it('SET_REFRESH_TOKEN sets refresh', () => {
      const state = { refreshToken: '' }
      user.mutations.SET_REFRESH_TOKEN(state, 'r')
      expect(state.refreshToken).toBe('r')
    })
    it('SET_NAME sets name', () => {
      const state = { name: '' }
      user.mutations.SET_NAME(state, 'John')
      expect(state.name).toBe('John')
    })
    it('SET_AVATAR sets avatar', () => {
      const state = { avatar: '' }
      user.mutations.SET_AVATAR(state, 'url')
      expect(state.avatar).toBe('url')
    })
    it('SET_ROLES sets roles array', () => {
      const state = { roles: [] }
      user.mutations.SET_ROLES(state, ['ROLE_ADMIN'])
      expect(state.roles).toEqual(['ROLE_ADMIN'])
    })
    it('SET_INTRODUCTION', () => {
      const state = { introduction: '' }
      user.mutations.SET_INTRODUCTION(state, 'intro')
      expect(state.introduction).toBe('intro')
    })
  })

  describe('actions.login', () => {
    it('trims username and calls login api with identifier', async () => {
      apiMocks.login.mockResolvedValue({ data: { access_token: 'token123', refresh_token: 'refresh123' } })
      const commit = vi.fn()
      await user.actions.login({ commit }, { username: '  admin  ', password: 'pwd' })
      expect(apiMocks.login).toHaveBeenCalledWith({ identifier: 'admin', password: 'pwd' })
      expect(commit).toHaveBeenCalledWith('SET_TOKEN', 'token123')
      expect(commit).toHaveBeenCalledWith('SET_REFRESH_TOKEN', 'refresh123')
      expect(authMocks.setToken).toHaveBeenCalledWith('token123')
      expect(authMocks.setRefreshToken).toHaveBeenCalledWith('refresh123')
      expect(authMocks.removeRefreshToken).not.toHaveBeenCalled()
    })

    it('handles missing refresh_token: calls removeRefreshToken', async () => {
      apiMocks.login.mockResolvedValue({ data: { access_token: 't1' } })
      const commit = vi.fn()
      await user.actions.login({ commit }, { username: 'admin', password: 'pwd' })
      expect(commit).toHaveBeenCalledWith('SET_REFRESH_TOKEN', '')
      expect(authMocks.removeRefreshToken).toHaveBeenCalled()
      expect(authMocks.setRefreshToken).not.toHaveBeenCalled()
    })

    it('handles empty refresh_token string', async () => {
      apiMocks.login.mockResolvedValue({ data: { access_token: 't', refresh_token: '' } })
      const commit = vi.fn()
      await user.actions.login({ commit }, { username: 'u', password: 'p' })
      expect(authMocks.removeRefreshToken).toHaveBeenCalled()
    })

    it('rejects on login failure', async () => {
      const err = new Error('fail')
      apiMocks.login.mockRejectedValue(err)
      const commit = vi.fn()
      await expect(user.actions.login({ commit }, { username: 'a', password: 'b' })).rejects.toBe(err)
    })
  })

  describe('actions.getInfo', () => {
    it('resolves data and commits roles/name/avatar', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: { roles: ['ROLE_ADMIN'], username: 'admin', email: 'a@b.com' } })
      const commit = vi.fn()
      const state = { token: 't' }
      const data = await user.actions.getInfo({ commit, state })
      expect(apiMocks.getInfo).toHaveBeenCalledWith('t')
      expect(commit).toHaveBeenCalledWith('SET_ROLES', ['ROLE_ADMIN'])
      expect(commit).toHaveBeenCalledWith('SET_NAME', 'admin')
      expect(commit).toHaveBeenCalledWith('SET_AVATAR', expect.any(String))
      expect(data.roles).toEqual(['ROLE_ADMIN'])
    })

    it('uses username fallback to email/identifier', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: { roles: ['R'], email: 'e@x.com' } })
      const commit = vi.fn()
      await user.actions.getInfo({ commit, state: {} })
      expect(commit).toHaveBeenCalledWith('SET_NAME', 'e@x.com')
    })

    it('uses identifier fallback', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: { roles: ['R'], identifier: 'user123' } })
      const commit = vi.fn()
      await user.actions.getInfo({ commit, state: {} })
      expect(commit).toHaveBeenCalledWith('SET_NAME', 'user123')
    })

    it('rejects when data missing', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: null })
      const commit = vi.fn()
      await expect(user.actions.getInfo({ commit, state: {} })).rejects.toBeDefined()
    })

    it('rejects when roles empty', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: { roles: [], username: 'a' } })
      const commit = vi.fn()
      await expect(user.actions.getInfo({ commit, state: {} })).rejects.toBeDefined()
    })

    it('rejects when roles undefined', async () => {
      apiMocks.getInfo.mockResolvedValue({ data: { username: 'a' } })
      const commit = vi.fn()
      await expect(user.actions.getInfo({ commit, state: {} })).rejects.toBeDefined()
    })

    it('rejects on api error', async () => {
      const err = new Error('net')
      apiMocks.getInfo.mockRejectedValue(err)
      const commit = vi.fn()
      await expect(user.actions.getInfo({ commit, state: {} })).rejects.toBe(err)
    })
  })

  describe('actions.logout', () => {
    it('calls logout api with refreshToken, clears tokens, resets router, dispatches tagsView', async () => {
      apiMocks.logout.mockResolvedValue({})
      const commit = vi.fn()
      const dispatch = vi.fn()
      const state = { refreshToken: 'r-token' }
      await user.actions.logout({ commit, state, dispatch })
      expect(apiMocks.logout).toHaveBeenCalledWith('r-token')
      expect(commit).toHaveBeenCalledWith('SET_TOKEN', '')
      expect(commit).toHaveBeenCalledWith('SET_REFRESH_TOKEN', '')
      expect(commit).toHaveBeenCalledWith('SET_ROLES', [])
      expect(authMocks.removeToken).toHaveBeenCalled()
      expect(authMocks.removeRefreshToken).toHaveBeenCalled()
      expect(routerMocks.resetRouter).toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('tagsView/delAllViews', null, { root: true })
    })

    it('rejects on logout failure', async () => {
      const err = new Error('fail')
      apiMocks.logout.mockRejectedValue(err)
      const commit = vi.fn()
      const dispatch = vi.fn()
      await expect(user.actions.logout({ commit, state: {}, dispatch })).rejects.toBe(err)
    })
  })

  describe('actions.resetToken', () => {
    it('clears token/roles and removes cookies', async () => {
      const commit = vi.fn()
      await user.actions.resetToken({ commit })
      expect(commit).toHaveBeenCalledWith('SET_TOKEN', '')
      expect(commit).toHaveBeenCalledWith('SET_REFRESH_TOKEN', '')
      expect(commit).toHaveBeenCalledWith('SET_ROLES', [])
      expect(authMocks.removeToken).toHaveBeenCalled()
      expect(authMocks.removeRefreshToken).toHaveBeenCalled()
    })
  })

  describe('actions.changeRoles', () => {
    it('changes roles: sets token, dispatches getInfo and permission/generateRoutes, adds routes', async () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
        .mockImplementation((action, payload, opts) => {
          if (action === 'getInfo') return Promise.resolve({ roles: ['ROLE_ADMIN'] })
          if (action === 'permission/generateRoutes') return Promise.resolve([{ path: '/a' }, { path: '/b' }])
          return Promise.resolve()
        })
      // need to mock router.addRoute via imported mock
      await user.actions.changeRoles({ commit, dispatch }, 'admin')
      expect(commit).toHaveBeenCalledWith('SET_TOKEN', 'admin-token')
      expect(commit).toHaveBeenCalledWith('SET_REFRESH_TOKEN', '')
      expect(authMocks.setToken).toHaveBeenCalledWith('admin-token')
      expect(authMocks.removeRefreshToken).toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('getInfo')
      expect(routerMocks.resetRouter).toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith('permission/generateRoutes', ['ROLE_ADMIN'], { root: true })
      expect(routerMocks.addRoute).toHaveBeenCalledTimes(2)
      expect(dispatch).toHaveBeenCalledWith('tagsView/delAllViews', null, { root: true })
    })
  })
})
