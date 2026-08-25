import tagsView from '@/store/modules/tagsView'

describe('store/modules/tagsView', () => {
  const makeView = (overrides = {}) => ({
    path: '/test',
    name: 'Test',
    meta: { title: 'Test', affix: false, noCache: false },
    ...overrides,
    meta: { title: 'Test', affix: false, noCache: false, ...(overrides.meta || {}) }
  })

  describe('state', () => {
    it('initial empty and namespaced', () => {
      expect(tagsView.namespaced).toBe(true)
      expect(tagsView.state.visitedViews).toEqual([])
      expect(tagsView.state.cachedViews).toEqual([])
    })
  })

  describe('mutations ADD_VISITED_VIEW', () => {
    it('adds view with title fallback', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_VISITED_VIEW(state, { path: '/a', meta: { title: 'A' } })
      expect(state.visitedViews).toHaveLength(1)
      expect(state.visitedViews[0].title).toBe('A')
    })

    it('uses no-name when meta.title missing', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_VISITED_VIEW(state, { path: '/a', meta: {} })
      expect(state.visitedViews[0].title).toBe('no-name')
    })

    it('does not duplicate by path', () => {
      const state = { visitedViews: [], cachedViews: [] }
      const view = { path: '/a', meta: { title: 'A' } }
      tagsView.mutations.ADD_VISITED_VIEW(state, view)
      tagsView.mutations.ADD_VISITED_VIEW(state, view)
      expect(state.visitedViews).toHaveLength(1)
    })

    it('allows different paths', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_VISITED_VIEW(state, { path: '/a', meta: { title: 'A' } })
      tagsView.mutations.ADD_VISITED_VIEW(state, { path: '/b', meta: { title: 'B' } })
      expect(state.visitedViews).toHaveLength(2)
    })
  })

  describe('ADD_CACHED_VIEW', () => {
    it('adds name to cachedViews when not noCache', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_CACHED_VIEW(state, { name: 'Test', meta: {} })
      expect(state.cachedViews).toEqual(['Test'])
    })

    it('does not add when meta.noCache true', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_CACHED_VIEW(state, { name: 'Test', meta: { noCache: true } })
      expect(state.cachedViews).toEqual([])
    })

    it('does not duplicate', () => {
      const state = { visitedViews: [], cachedViews: [] }
      tagsView.mutations.ADD_CACHED_VIEW(state, { name: 'A', meta: {} })
      tagsView.mutations.ADD_CACHED_VIEW(state, { name: 'A', meta: {} })
      expect(state.cachedViews).toEqual(['A'])
    })
  })

  describe('DEL_VISITED_VIEW', () => {
    it('removes by path', () => {
      const state = { visitedViews: [{ path: '/a' }, { path: '/b' }], cachedViews: [] }
      tagsView.mutations.DEL_VISITED_VIEW(state, { path: '/a' })
      expect(state.visitedViews).toEqual([{ path: '/b' }])
    })

    it('does nothing when not found', () => {
      const state = { visitedViews: [{ path: '/a' }], cachedViews: [] }
      tagsView.mutations.DEL_VISITED_VIEW(state, { path: '/not' })
      expect(state.visitedViews).toHaveLength(1)
    })
  })

  describe('DEL_CACHED_VIEW', () => {
    it('removes by name', () => {
      const state = { visitedViews: [], cachedViews: ['A', 'B'] }
      tagsView.mutations.DEL_CACHED_VIEW(state, { name: 'A' })
      expect(state.cachedViews).toEqual(['B'])
    })

    it('does nothing when name not found', () => {
      const state = { visitedViews: [], cachedViews: ['A'] }
      tagsView.mutations.DEL_CACHED_VIEW(state, { name: 'X' })
      expect(state.cachedViews).toEqual(['A'])
    })
  })

  describe('DEL_OTHERS_VISITED_VIEWS', () => {
    it('keeps affix and current view', () => {
      const state = {
        visitedViews: [
          { path: '/a', meta: { affix: true } },
          { path: '/b', meta: { affix: false } },
          { path: '/c', meta: { affix: false } }
        ],
        cachedViews: []
      }
      tagsView.mutations.DEL_OTHERS_VISITED_VIEWS(state, { path: '/b' })
      expect(state.visitedViews).toEqual([
        { path: '/a', meta: { affix: true } },
        { path: '/b', meta: { affix: false } }
      ])
    })
  })

  describe('DEL_OTHERS_CACHED_VIEWS', () => {
    it('keeps only current cached view when found', () => {
      const state = { visitedViews: [], cachedViews: ['A', 'B', 'C'] }
      tagsView.mutations.DEL_OTHERS_CACHED_VIEWS(state, { name: 'B' })
      expect(state.cachedViews).toEqual(['B'])
    })

    it('clears when current not cached', () => {
      const state = { visitedViews: [], cachedViews: ['A', 'B'] }
      tagsView.mutations.DEL_OTHERS_CACHED_VIEWS(state, { name: 'X' })
      expect(state.cachedViews).toEqual([])
    })
  })

  describe('DEL_ALL_VISITED_VIEWS', () => {
    it('keeps affix tags only', () => {
      const state = {
        visitedViews: [
          { path: '/a', meta: { affix: true } },
          { path: '/b', meta: { affix: false } },
          { path: '/c', meta: { affix: true } }
        ],
        cachedViews: []
      }
      tagsView.mutations.DEL_ALL_VISITED_VIEWS(state)
      expect(state.visitedViews).toEqual([
        { path: '/a', meta: { affix: true } },
        { path: '/c', meta: { affix: true } }
      ])
    })

    it('clears when no affix', () => {
      const state = { visitedViews: [{ path: '/a', meta: {} }], cachedViews: [] }
      tagsView.mutations.DEL_ALL_VISITED_VIEWS(state)
      expect(state.visitedViews).toEqual([])
    })
  })

  describe('DEL_ALL_CACHED_VIEWS', () => {
    it('clears cachedViews', () => {
      const state = { visitedViews: [], cachedViews: ['A', 'B'] }
      tagsView.mutations.DEL_ALL_CACHED_VIEWS(state)
      expect(state.cachedViews).toEqual([])
    })
  })

  describe('UPDATE_VISITED_VIEW', () => {
    it('merges view by path', () => {
      const state = {
        visitedViews: [{ path: '/a', meta: { title: 'old' }, query: {} }],
        cachedViews: []
      }
      tagsView.mutations.UPDATE_VISITED_VIEW(state, { path: '/a', meta: { title: 'new' } })
      // Note: implementation does v = Object.assign(v, view) but v is let copy, not mutating array entry? Let's verify actual effect
      // It reassigns local v, not array element, so original object may not be updated if not by reference? Check implementation
      // Actually for(let v of ...) v is reference to object, Object.assign mutates it, so it works
      expect(state.visitedViews[0].meta.title).toBe('new')
    })

    it('does nothing when path not found', () => {
      const state = { visitedViews: [{ path: '/a', meta: {} }], cachedViews: [] }
      tagsView.mutations.UPDATE_VISITED_VIEW(state, { path: '/not', meta: { title: 'x' } })
      expect(state.visitedViews[0].meta).toEqual({})
    })
  })

  describe('actions', () => {
    it('addView dispatches addVisitedView and addCachedView', () => {
      const dispatch = vi.fn()
      tagsView.actions.addView({ dispatch }, { path: '/a' })
      expect(dispatch).toHaveBeenCalledWith('addVisitedView', { path: '/a' })
      expect(dispatch).toHaveBeenCalledWith('addCachedView', { path: '/a' })
    })

    it('addVisitedView commits', () => {
      const commit = vi.fn()
      const view = { path: '/a' }
      tagsView.actions.addVisitedView({ commit }, view)
      expect(commit).toHaveBeenCalledWith('ADD_VISITED_VIEW', view)
    })

    it('addCachedView commits', () => {
      const commit = vi.fn()
      const view = { name: 'A' }
      tagsView.actions.addCachedView({ commit }, view)
      expect(commit).toHaveBeenCalledWith('ADD_CACHED_VIEW', view)
    })

    it('delView dispatches and resolves', async () => {
      const dispatch = vi.fn()
      const state = { visitedViews: [{ path: '/a' }], cachedViews: ['A'] }
      const result = await tagsView.actions.delView({ dispatch, state }, { path: '/a', name: 'A' })
      expect(dispatch).toHaveBeenCalledWith('delVisitedView', { path: '/a', name: 'A' })
      expect(dispatch).toHaveBeenCalledWith('delCachedView', { path: '/a', name: 'A' })
      expect(result).toEqual({ visitedViews: [{ path: '/a' }], cachedViews: ['A'] })
    })

    it('delVisitedView commits and resolves copy', async () => {
      const commit = vi.fn()
      const state = { visitedViews: [{ path: '/a' }] }
      const res = await tagsView.actions.delVisitedView({ commit, state }, { path: '/a' })
      expect(commit).toHaveBeenCalledWith('DEL_VISITED_VIEW', { path: '/a' })
      expect(res).toEqual([{ path: '/a' }])
    })

    it('delCachedView commits and resolves', async () => {
      const commit = vi.fn()
      const state = { cachedViews: ['A'] }
      const res = await tagsView.actions.delCachedView({ commit, state }, { name: 'A' })
      expect(commit).toHaveBeenCalledWith('DEL_CACHED_VIEW', { name: 'A' })
      expect(res).toEqual(['A'])
    })

    it('delOthersViews dispatches both and resolves', async () => {
      const dispatch = vi.fn()
      const state = { visitedViews: [], cachedViews: [] }
      const view = { path: '/a' }
      const res = await tagsView.actions.delOthersViews({ dispatch, state }, view)
      expect(dispatch).toHaveBeenCalledWith('delOthersVisitedViews', view)
      expect(dispatch).toHaveBeenCalledWith('delOthersCachedViews', view)
      expect(res).toHaveProperty('visitedViews')
      expect(res).toHaveProperty('cachedViews')
    })

    it('delAllViews dispatches and resolves', async () => {
      const dispatch = vi.fn()
      const state = { visitedViews: [{ path: '/a' }], cachedViews: ['A'] }
      const res = await tagsView.actions.delAllViews({ dispatch, state })
      expect(dispatch).toHaveBeenCalledWith('delAllVisitedViews', undefined)
      expect(dispatch).toHaveBeenCalledWith('delAllCachedViews', undefined)
      expect(res).toEqual({ visitedViews: [{ path: '/a' }], cachedViews: ['A'] })
    })

    it('delOthersVisitedViews commits', async () => {
      const commit = vi.fn()
      const state = { visitedViews: [] }
      const view = { path: '/a' }
      const res = await tagsView.actions.delOthersVisitedViews({ commit, state }, view)
      expect(commit).toHaveBeenCalledWith('DEL_OTHERS_VISITED_VIEWS', view)
      expect(res).toEqual([])
    })

    it('delOthersCachedViews commits', async () => {
      const commit = vi.fn()
      const state = { cachedViews: ['A'] }
      const res = await tagsView.actions.delOthersCachedViews({ commit, state }, { name: 'A' })
      expect(commit).toHaveBeenCalledWith('DEL_OTHERS_CACHED_VIEWS', { name: 'A' })
    })

    it('delAllVisitedViews commits', async () => {
      const commit = vi.fn()
      const state = { visitedViews: [] }
      const res = await tagsView.actions.delAllVisitedViews({ commit, state })
      expect(commit).toHaveBeenCalledWith('DEL_ALL_VISITED_VIEWS')
      expect(res).toEqual([])
    })

    it('delAllCachedViews commits', async () => {
      const commit = vi.fn()
      const state = { cachedViews: ['A'] }
      const res = await tagsView.actions.delAllCachedViews({ commit, state })
      expect(commit).toHaveBeenCalledWith('DEL_ALL_CACHED_VIEWS')
      expect(res).toEqual(['A'])
    })

    it('updateVisitedView commits', () => {
      const commit = vi.fn()
      const view = { path: '/a' }
      tagsView.actions.updateVisitedView({ commit }, view)
      expect(commit).toHaveBeenCalledWith('UPDATE_VISITED_VIEW', view)
    })
  })
})
