describe('store/modules/entity', () => {
  let entityMod

  beforeEach(async () => {
    sessionStorage.clear()
    vi.resetModules()
    entityMod = (await import('@/store/modules/entity')).default
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('state initial', () => {
    it('has entities array or null and structures object or null (empty sessionStorage returns null via JSON.parse(null))', () => {
      // when sessionStorage empty, JSON.parse(null) => null, so initial may be null
      expect(entityMod.state.entities === null || Array.isArray(entityMod.state.entities)).toBe(true)
      expect(entityMod.state.structures === null || typeof entityMod.state.structures === 'object').toBe(true)
    })

    it('namespaced true', () => {
      expect(entityMod.namespaced).toBe(true)
    })

    it('loads from sessionStorage when present', async () => {
      sessionStorage.setItem('dream_studio_entities', JSON.stringify([{ id: 1 }]))
      sessionStorage.setItem('dream_studio_structures', JSON.stringify({ Product: { fields: [] } }))
      vi.resetModules()
      const mod = (await import('@/store/modules/entity')).default
      expect(mod.state.entities).toEqual([{ id: 1 }])
      expect(mod.state.structures).toEqual({ Product: { fields: [] } })
    })

    it('handles JSON parse error gracefully', async () => {
      sessionStorage.setItem('dream_studio_entities', 'invalid-json')
      sessionStorage.setItem('dream_studio_structures', 'invalid-json')
      vi.resetModules()
      const mod = (await import('@/store/modules/entity')).default
      expect(mod.state.entities).toEqual([])
      expect(mod.state.structures).toEqual({})
    })

    it('handles null sessionStorage returns', async () => {
      sessionStorage.clear()
      vi.resetModules()
      const mod = (await import('@/store/modules/entity')).default
      // JSON.parse(null) => null, so entities null and structures null? check getDefaultEntities logic
      // it returns { entities: null, structures: null }? but test current implementation
      // When storage empty, getItem returns null, JSON.parse(null) => null
      // So state.entities === null, state.structures === null? Let's verify fallback
      // Actually code: JSON.parse(null) => null, not exception, so returns null.
      // But SET_STRUCTURES guards with if (!state.structures) state.structures = {}
      expect(mod.state.entities).toBeNull()
      expect(mod.state.structures).toBeNull()
    })
  })

  describe('mutations', () => {
    it('SET_ENTITIES sets when array and persists to sessionStorage', () => {
      const state = { entities: [], structures: {} }
      const data = [{ name: 'Product' }, { name: 'Order' }]
      entityMod.mutations.SET_ENTITIES(state, data)
      expect(state.entities).toEqual(data)
      expect(JSON.parse(sessionStorage.getItem('dream_studio_entities'))).toEqual(data)
    })

    it('SET_ENTITIES ignores non-array', () => {
      const state = { entities: [{ existing: 1 }], structures: {} }
      sessionStorage.setItem('dream_studio_entities', JSON.stringify(state.entities))
      entityMod.mutations.SET_ENTITIES(state, { not: 'array' })
      expect(state.entities).toEqual([{ existing: 1 }])
      // sessionStorage not overwritten with non-array
      expect(JSON.parse(sessionStorage.getItem('dream_studio_entities'))).toEqual([{ existing: 1 }])
    })

    it('SET_ENTITIES ignores string and null', () => {
      const state = { entities: [], structures: {} }
      entityMod.mutations.SET_ENTITIES(state, 'string')
      expect(state.entities).toEqual([])
      entityMod.mutations.SET_ENTITIES(state, null)
      expect(state.entities).toEqual([])
    })

    it('SET_STRUCTURES sets structure and persists', () => {
      const state = { entities: [], structures: {} }
      entityMod.mutations.SET_STRUCTURES(state, { entity: 'Product', structure: { fields: ['a'] } })
      expect(state.structures.Product).toEqual({ fields: ['a'] })
      expect(JSON.parse(sessionStorage.getItem('dream_studio_structures')).Product).toEqual({ fields: ['a'] })
    })

    it('SET_STRUCTURES initializes structures if null', () => {
      const state = { entities: [], structures: null }
      entityMod.mutations.SET_STRUCTURES(state, { entity: 'Order', structure: { x: 1 } })
      expect(state.structures).toEqual({ Order: { x: 1 } })
    })

    it('SET_STRUCTURES merges multiple entities', () => {
      const state = { entities: [], structures: {} }
      entityMod.mutations.SET_STRUCTURES(state, { entity: 'A', structure: { v: 1 } })
      entityMod.mutations.SET_STRUCTURES(state, { entity: 'B', structure: { v: 2 } })
      expect(state.structures.A).toEqual({ v: 1 })
      expect(state.structures.B).toEqual({ v: 2 })
    })

    it('RESET_STATE clears storage and resets state via getDefaultEntities', () => {
      sessionStorage.setItem('dream_studio_entities', JSON.stringify([{ x: 1 }]))
      sessionStorage.setItem('dream_studio_structures', JSON.stringify({ P: {} }))
      const state = { entities: [{ x: 1 }], structures: { P: {} } }
      entityMod.mutations.RESET_STATE(state)
      expect(sessionStorage.getItem('dream_studio_entities')).toBeNull()
      expect(sessionStorage.getItem('dream_studio_structures')).toBeNull()
      // after clear, getDefaultEntities returns nulls (JSON.parse(null))
      expect(state.entities).toBeNull()
      expect(state.structures).toBeNull()
    })

    it('RESET_STATE handles parse exception fallback', () => {
      // Simulate JSON parse exception by mocking sessionStorage.getItem to throw? Actually getDefaultEntities catches exception.
      // We can monkey-patch JSON.parse temporarily
      const origParse = JSON.parse
      JSON.parse = vi.fn(() => { throw new Error('parse error') })
      const state = { entities: [1], structures: { a: 1 } }
      entityMod.mutations.RESET_STATE(state)
      expect(state.entities).toEqual([])
      expect(state.structures).toEqual({})
      JSON.parse = origParse
    })
  })

  describe('actions', () => {
    it('set_structures commits SET_STRUCTURES', () => {
      const commit = vi.fn()
      entityMod.actions.set_structures({ commit }, { entity: 'Product', structure: {} })
      expect(commit).toHaveBeenCalledWith('SET_STRUCTURES', { entity: 'Product', structure: {} })
    })

    it('set_entities commits SET_ENTITIES', () => {
      const commit = vi.fn()
      const data = [{ id: 1 }]
      entityMod.actions.set_entities({ commit }, data)
      expect(commit).toHaveBeenCalledWith('SET_ENTITIES', data)
    })

    it('reset commits RESET_STATE and resolves', async () => {
      const commit = vi.fn()
      const result = await entityMod.actions.reset({ commit })
      expect(commit).toHaveBeenCalledWith('RESET_STATE')
      expect(result).toBeUndefined()
    })

    it('integration: set_entities persists and can be reloaded', async () => {
      const state = { entities: [], structures: {} }
      entityMod.mutations.SET_ENTITIES(state, [{ name: 'X' }])
      // simulate fresh module load reads from sessionStorage
      vi.resetModules()
      const mod2 = (await import('@/store/modules/entity')).default
      expect(mod2.state.entities).toEqual([{ name: 'X' }])
    })
  })
})
