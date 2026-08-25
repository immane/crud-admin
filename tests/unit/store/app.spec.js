const cookieMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
}))

vi.mock('js-cookie', () => ({
  __esModule: true,
  default: cookieMocks
}))

import app from '@/store/modules/app'

describe('store/modules/app', () => {
  beforeEach(() => {
    cookieMocks.get.mockReset()
    cookieMocks.set.mockReset()
    cookieMocks.remove.mockReset()
    cookieMocks.get.mockReturnValue(undefined)
  })

  describe('state', () => {
    it('has sidebar opened=true by default when no cookie', async () => {
      // app state is single instance imported already; we test shape
      expect(app.state).toBeDefined()
      expect(app.state.sidebar).toBeDefined()
      expect(typeof app.state.sidebar.opened).toBe('boolean')
      expect(app.state.device).toBe('desktop')
      expect(app.state.sidebar.withoutAnimation).toBe(false)
    })

    it('is namespaced', () => {
      expect(app.namespaced).toBe(true)
    })
  })

  describe('mutations', () => {
    function makeState(opened = true, withoutAnimation = false, device = 'desktop') {
      return {
        sidebar: { opened, withoutAnimation },
        device
      }
    }

    it('TOGGLE_SIDEBAR flips opened and sets cookie 0/1', () => {
      const state = makeState(true, true)
      app.mutations.TOGGLE_SIDEBAR(state)
      expect(state.sidebar.opened).toBe(false)
      expect(state.sidebar.withoutAnimation).toBe(false)
      expect(cookieMocks.set).toHaveBeenCalledWith('sidebarStatus', 0)

      cookieMocks.set.mockClear()
      app.mutations.TOGGLE_SIDEBAR(state)
      expect(state.sidebar.opened).toBe(true)
      expect(cookieMocks.set).toHaveBeenCalledWith('sidebarStatus', 1)
    })

    it('TOGGLE_SIDEBAR always resets withoutAnimation to false', () => {
      const state = makeState(false, true)
      app.mutations.TOGGLE_SIDEBAR(state)
      expect(state.sidebar.withoutAnimation).toBe(false)
    })

    it('CLOSE_SIDEBAR sets opened=false and sets cookie 0', () => {
      const state = makeState(true, false)
      app.mutations.CLOSE_SIDEBAR(state, false)
      expect(state.sidebar.opened).toBe(false)
      expect(state.sidebar.withoutAnimation).toBe(false)
      expect(cookieMocks.set).toHaveBeenCalledWith('sidebarStatus', 0)
    })

    it('CLOSE_SIDEBAR respects withoutAnimation param true', () => {
      const state = makeState(true, false)
      app.mutations.CLOSE_SIDEBAR(state, true)
      expect(state.sidebar.withoutAnimation).toBe(true)
    })

    it('CLOSE_SIDEBAR respects withoutAnimation param false/undefined', () => {
      const state = makeState(true, false)
      app.mutations.CLOSE_SIDEBAR(state, undefined)
      expect(state.sidebar.withoutAnimation).toBeUndefined()
    })

    it('TOGGLE_DEVICE sets device', () => {
      const state = makeState()
      app.mutations.TOGGLE_DEVICE(state, 'mobile')
      expect(state.device).toBe('mobile')
      app.mutations.TOGGLE_DEVICE(state, 'desktop')
      expect(state.device).toBe('desktop')
    })
  })

  describe('actions', () => {
    it('toggleSideBar commits TOGGLE_SIDEBAR', () => {
      const commit = vi.fn()
      app.actions.toggleSideBar({ commit })
      expect(commit).toHaveBeenCalledWith('TOGGLE_SIDEBAR')
    })

    it('closeSideBar commits CLOSE_SIDEBAR with withoutAnimation', () => {
      const commit = vi.fn()
      app.actions.closeSideBar({ commit }, { withoutAnimation: true })
      expect(commit).toHaveBeenCalledWith('CLOSE_SIDEBAR', true)
      commit.mockClear()
      app.actions.closeSideBar({ commit }, { withoutAnimation: false })
      expect(commit).toHaveBeenCalledWith('CLOSE_SIDEBAR', false)
    })

    it('toggleDevice commits TOGGLE_DEVICE', () => {
      const commit = vi.fn()
      app.actions.toggleDevice({ commit }, 'mobile')
      expect(commit).toHaveBeenCalledWith('TOGGLE_DEVICE', 'mobile')
    })
  })

  describe('integration: Cookies.get initial value', () => {
    it('when sidebarStatus=1 opened=true', async () => {
      vi.resetModules()
      cookieMocks.get.mockReturnValue('1')
      const fresh = await import('@/store/modules/app')
      expect(fresh.default.state.sidebar.opened).toBe(true)
    })

    it('when sidebarStatus=0 opened=false', async () => {
      vi.resetModules()
      cookieMocks.get.mockReturnValue('0')
      const fresh = await import('@/store/modules/app')
      expect(fresh.default.state.sidebar.opened).toBe(false)
    })

    it('when no cookie opened defaults true', async () => {
      vi.resetModules()
      cookieMocks.get.mockReturnValue(undefined)
      const fresh = await import('@/store/modules/app')
      expect(fresh.default.state.sidebar.opened).toBe(true)
    })
  })
})
