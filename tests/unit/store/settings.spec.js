const mockSettings = vi.hoisted(() => ({
  showSettings: true,
  fixedHeader: false,
  sidebarLogo: true,
  title: 'Test'
}))

vi.mock('@/settings', () => ({
  __esModule: true,
  default: mockSettings
}))

import settings from '@/store/modules/settings'
import getters from '@/store/getters'

describe('store/modules/settings', () => {
  beforeEach(() => {
    // reset state to defaults after each mutation test
    settings.state.showSettings = mockSettings.showSettings
    settings.state.fixedHeader = mockSettings.fixedHeader
    settings.state.sidebarLogo = mockSettings.sidebarLogo
  })

  it('namespaced true', () => {
    expect(settings.namespaced).toBe(true)
  })

  it('state reflects defaultSettings', () => {
    expect(settings.state.showSettings).toBe(mockSettings.showSettings)
    expect(settings.state.fixedHeader).toBe(mockSettings.fixedHeader)
    expect(settings.state.sidebarLogo).toBe(mockSettings.sidebarLogo)
  })

  describe('mutations CHANGE_SETTING', () => {
    it('changes existing key', () => {
      const state = { showSettings: true, fixedHeader: false, sidebarLogo: true }
      settings.mutations.CHANGE_SETTING(state, { key: 'fixedHeader', value: true })
      expect(state.fixedHeader).toBe(true)
    })

    it('changes showSettings', () => {
      const state = { showSettings: true, fixedHeader: false, sidebarLogo: true }
      settings.mutations.CHANGE_SETTING(state, { key: 'showSettings', value: false })
      expect(state.showSettings).toBe(false)
    })

    it('changes sidebarLogo', () => {
      const state = { showSettings: true, fixedHeader: false, sidebarLogo: true }
      settings.mutations.CHANGE_SETTING(state, { key: 'sidebarLogo', value: false })
      expect(state.sidebarLogo).toBe(false)
    })

    it('ignores non-existing key', () => {
      const state = { showSettings: true, fixedHeader: false }
      settings.mutations.CHANGE_SETTING(state, { key: 'nonexistent', value: 'x' })
      expect(state.nonexistent).toBeUndefined()
      expect(state.showSettings).toBe(true)
    })

    it('ignores prototype polluted keys not in state', () => {
      const state = { fixedHeader: false }
      settings.mutations.CHANGE_SETTING(state, { key: 'hasOwnProperty', value: 'evil' })
      expect(state.hasOwnProperty).not.toBe('evil') // should not set
    })

    it('handles falsey values', () => {
      const state = { fixedHeader: true }
      settings.mutations.CHANGE_SETTING(state, { key: 'fixedHeader', value: false })
      expect(state.fixedHeader).toBe(false)
      settings.mutations.CHANGE_SETTING(state, { key: 'fixedHeader', value: 0 })
      expect(state.fixedHeader).toBe(0)
    })
  })

  describe('actions changeSetting', () => {
    it('commits CHANGE_SETTING', () => {
      const commit = vi.fn()
      settings.actions.changeSetting({ commit }, { key: 'fixedHeader', value: true })
      expect(commit).toHaveBeenCalledWith('CHANGE_SETTING', { key: 'fixedHeader', value: true })
    })
  })
})

describe('store/getters', () => {
  const mockState = {
    app: { sidebar: { opened: true, withoutAnimation: false }, device: 'desktop', size: 'medium' },
    user: { token: 't', avatar: 'av', name: 'n', roles: ['R'], introduction: 'intro' },
    entity: { entities: [], structures: {} },
    tagsView: { visitedViews: [{ path: '/a' }], cachedViews: ['A'] },
    permission: { routes: [{ path: '/perm' }] },
    errorLog: { logs: [{ msg: 'err' }] }
  }

  it('sidebar maps state.app.sidebar', () => {
    expect(getters.sidebar(mockState)).toBe(mockState.app.sidebar)
  })
  it('device maps state.app.device', () => {
    expect(getters.device(mockState)).toBe('desktop')
  })
  it('token maps state.user.token', () => {
    expect(getters.token(mockState)).toBe('t')
  })
  it('avatar maps state.user.avatar', () => {
    expect(getters.avatar(mockState)).toBe('av')
  })
  it('name maps state.user.name', () => {
    expect(getters.name(mockState)).toBe('n')
  })
  it('roles maps state.user.roles', () => {
    expect(getters.roles(mockState)).toEqual(['R'])
  })
  it('entity maps state.entity', () => {
    expect(getters.entity(mockState)).toBe(mockState.entity)
  })
  it('size maps state.app.size', () => {
    expect(getters.size(mockState)).toBe('medium')
  })
  it('visitedViews maps state.tagsView.visitedViews', () => {
    expect(getters.visitedViews(mockState)).toEqual([{ path: '/a' }])
  })
  it('cachedViews maps state.tagsView.cachedViews', () => {
    expect(getters.cachedViews(mockState)).toEqual(['A'])
  })
  it('introduction maps state.user.introduction', () => {
    expect(getters.introduction(mockState)).toBe('intro')
  })
  it('permission_routes maps state.permission.routes', () => {
    expect(getters.permission_routes(mockState)).toEqual([{ path: '/perm' }])
  })
  it('errorLogs maps state.errorLog.logs', () => {
    expect(getters.errorLogs(mockState)).toEqual([{ msg: 'err' }])
  })
})
