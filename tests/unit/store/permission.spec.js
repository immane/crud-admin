const mockRouter = vi.hoisted(() => ({
  constantRoutes: [{ path: '/login' }, { path: '/404' }, { path: '/', children: [{ name: 'Dashboard' }] }],
  asyncRoutes: [
    {
      path: '/product',
      meta: { roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
      children: [{ path: 'list', meta: { roles: ['ROLE_ADMIN'] } }]
    },
    {
      path: '/order',
      meta: { roles: ['ROLE_ADMIN'] },
      children: []
    },
    {
      path: '/public',
      // no meta => accessible to all
      children: [{ path: 'view' }]
    },
    {
      path: '/mixed',
      children: [
        { path: 'admin', meta: { roles: ['ROLE_ADMIN'] } },
        { path: 'user', meta: { roles: ['ROLE_USER'] } },
        { path: 'open' }
      ]
    }
  ]
}))

vi.mock('@/router', () => mockRouter)

import permission, { filterAsyncRoutes } from '@/store/modules/permission'

describe('store/modules/permission', () => {
  describe('filterAsyncRoutes', () => {
    it('returns all routes when no meta.roles', () => {
      const routes = [
        { path: '/a' },
        { path: '/b', children: [{ path: 'c' }] }
      ]
      const result = filterAsyncRoutes(routes, ['ROLE_USER'])
      expect(result).toHaveLength(2)
    })

    it('filters by role: allows matching role', () => {
      const routes = [
        { path: '/admin', meta: { roles: ['ROLE_ADMIN'] } },
        { path: '/user', meta: { roles: ['ROLE_USER'] } },
        { path: '/open' }
      ]
      const result = filterAsyncRoutes(routes, ['ROLE_ADMIN'])
      expect(result.map(r => r.path)).toEqual(['/admin', '/open'])
    })

    it('allows route when roles includes one of meta.roles', () => {
      const routes = [{ path: '/mixed', meta: { roles: ['ROLE_ADMIN', 'ROLE_USER'] } }]
      expect(filterAsyncRoutes(routes, ['ROLE_USER'])).toHaveLength(1)
      expect(filterAsyncRoutes(routes, ['ROLE_GUEST'])).toHaveLength(0)
    })

    it('recursively filters children', () => {
      const routes = [
        {
          path: '/parent',
          meta: { roles: ['ROLE_ADMIN'] },
          children: [
            { path: 'child1', meta: { roles: ['ROLE_ADMIN'] } },
            { path: 'child2', meta: { roles: ['ROLE_USER'] } },
            { path: 'child3' }
          ]
        }
      ]
      const result = filterAsyncRoutes(routes, ['ROLE_ADMIN'])
      expect(result[0].children.map(c => c.path)).toEqual(['child1', 'child3'])
    })

    it('does not mutate original routes array', () => {
      const routes = [
        {
          path: '/parent',
          meta: { roles: ['ROLE_ADMIN'] },
          children: [{ path: 'c', meta: { roles: ['ROLE_USER'] } }]
        }
      ]
      const copy = JSON.parse(JSON.stringify(routes))
      filterAsyncRoutes(routes, ['ROLE_ADMIN'])
      expect(routes).toEqual(copy)
    })

    it('returns empty when no routes match', () => {
      const routes = [
        { path: '/admin', meta: { roles: ['ROLE_ADMIN'] } },
        { path: '/super', meta: { roles: ['ROLE_SUPER_ADMIN'] } }
      ]
      expect(filterAsyncRoutes(routes, ['ROLE_USER'])).toEqual([])
    })

    it('handles empty input', () => {
      expect(filterAsyncRoutes([], ['ROLE_ADMIN'])).toEqual([])
    })

    it('handles nested children filtering with open routes inside restricted parent', () => {
      const routes = [
        {
          path: '/restricted',
          meta: { roles: ['ROLE_ADMIN'] },
          children: [
            { path: 'open' },
            { path: 'user-only', meta: { roles: ['ROLE_USER'] } }
          ]
        }
      ]
      // parent not allowed for ROLE_USER, so whole branch filtered
      expect(filterAsyncRoutes(routes, ['ROLE_USER'])).toEqual([])
      // allowed for admin, children filtered
      const admin = filterAsyncRoutes(routes, ['ROLE_ADMIN'])
      expect(admin[0].children.map(c => c.path)).toEqual(['open'])
    })

    it('filters mixed example from mock', () => {
      const result = filterAsyncRoutes(mockRouter.asyncRoutes, ['ROLE_USER'])
      // public always passes, mixed children should have user and open, but product/order require admin
      const paths = result.map(r => r.path)
      expect(paths).toContain('/public')
      expect(paths).not.toContain('/product')
      expect(paths).not.toContain('/order')
      const mixed = result.find(r => r.path === '/mixed')
      expect(mixed.children.map(c => c.path)).toEqual(['user', 'open'])
    })
  })

  describe('state & mutations', () => {
    it('state initial empty', () => {
      expect(permission.state.routes).toEqual([])
      expect(permission.state.addRoutes).toEqual([])
    })

    it('namespaced true', () => {
      expect(permission.namespaced).toBe(true)
    })

    it('SET_ROUTES sets addRoutes and merges constantRoutes', () => {
      const state = { routes: [], addRoutes: [] }
      const routes = [{ path: '/a' }, { path: '/b' }]
      permission.mutations.SET_ROUTES(state, routes)
      expect(state.addRoutes).toEqual(routes)
      expect(state.routes).toEqual([...mockRouter.constantRoutes, ...routes])
    })

    it('SET_ROUTES handles empty routes', () => {
      const state = { routes: [], addRoutes: [] }
      permission.mutations.SET_ROUTES(state, [])
      expect(state.routes).toEqual(mockRouter.constantRoutes)
    })
  })

  describe('actions.generateRoutes', () => {
    it('for ROLE_SUPER_ADMIN returns all asyncRoutes', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['ROLE_SUPER_ADMIN'])
      expect(result).toEqual(mockRouter.asyncRoutes)
      expect(commit).toHaveBeenCalledWith('SET_ROUTES', mockRouter.asyncRoutes)
    })

    it('for ROLE_ADMIN returns all asyncRoutes (not filtered)', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['ROLE_ADMIN'])
      expect(result).toEqual(mockRouter.asyncRoutes)
      expect(commit).toHaveBeenCalledWith('SET_ROUTES', mockRouter.asyncRoutes)
    })

    it('for ROLE_SUPER_ADMIN with extra role still returns all', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['ROLE_USER', 'ROLE_SUPER_ADMIN'])
      expect(result).toEqual(mockRouter.asyncRoutes)
    })

    it('for normal role filters routes', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['ROLE_USER'])
      const expected = filterAsyncRoutes(mockRouter.asyncRoutes, ['ROLE_USER'])
      expect(result).toEqual(expected)
      expect(commit).toHaveBeenCalledWith('SET_ROUTES', expected)
      expect(result.length).toBeLessThan(mockRouter.asyncRoutes.length)
    })

    it('for empty roles filters to only public routes', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, [])
      const expected = filterAsyncRoutes(mockRouter.asyncRoutes, [])
      expect(result).toEqual(expected)
    })

    it('for unknown role returns only routes without meta', async () => {
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['UNKNOWN'])
      // only /public and /mixed/open ? but /mixed parent has no meta, so it passes, children filtered
      expect(result.some(r => r.path === '/public')).toBe(true)
      expect(result.some(r => r.path === '/product')).toBe(false)
    })

    it('handles asyncRoutes null/undefined fallback to [] for admin', async () => {
      // temporarily patch
      const original = mockRouter.asyncRoutes
      mockRouter.asyncRoutes = null
      // need to reimport? but generateRoutes uses imported asyncRoutes binding; mockRouter is same object reference,
      // so if we set null, the imported value (which is reference) should reflect? Actually permission.js destructures import; it captures reference to mock object.
      // Since we mock via vi.mock returning same object, mutating mockRouter.asyncRoutes affects permission's view.
      const commit = vi.fn()
      const result = await permission.actions.generateRoutes({ commit }, ['ROLE_SUPER_ADMIN'])
      expect(result).toEqual([])
      mockRouter.asyncRoutes = original
    })
  })
})
