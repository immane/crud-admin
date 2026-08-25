const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()
const mockDelete = jest.fn()
const mockDispatch = jest.fn()
const mockStoreGetters = {
  entity: {
    entities: null,
    structures: null
  }
}

jest.mock('@/utils/request', () => ({
  __esModule: true,
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete
  }
}))

jest.mock('@/store', () => ({
  __esModule: true,
  default: {
    getters: mockStoreGetters,
    dispatch: mockDispatch
  }
}))

describe('utils/entity.ts advanced', () => {
  beforeEach(() => {
    jest.resetModules()
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDelete.mockReset()
    mockDispatch.mockReset()
    mockStoreGetters.entity.entities = null
    mockStoreGetters.entity.structures = null
  })

  describe('constructor', () => {
    it('parameterizes string name to plural dasherized', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      expect(em.name).toBe('User')
      expect(em.plural).toBe('users')
      expect(em.prefix).toBe('/api/v1/manage')
    })

    it('dasherizes camelCase via underscore + pluralize', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('BlogPost')
      expect(em.plural).toBe('blog-posts')
    })

    it('handles irregular plural', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('Person')
      // i pluralizes Person -> People -> people
      expect(em.plural).toBe('people')
    })

    it('object form with custom plural preserves it', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'User', plural: 'custom-users' })
      expect(em.plural).toBe('custom-users')
      expect(em.name).toBe('User')
    })

    it('object form without plural derives parameterized', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'BlogPost' })
      expect(em.plural).toBe('blog-posts')
      expect(em.prefix).toBe('/api/v1/manage')
    })

    it('object form with custom prefix overrides default', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'User', prefix: '/custom' })
      expect(em.prefix).toBe('/custom')
    })

    it('object form without prefix falls back to default', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'User', plural: 'users' })
      expect(em.prefix).toBe('/api/v1/manage')
    })

    it('object form with empty prefix keeps default', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'User', prefix: '' })
      // empty string falsy -> fallback to default via || this.prefix
      expect(em.prefix).toBe('/api/v1/manage')
    })
  })

  describe('structure()', () => {
    it('fetches entities when cache empty (null)', async () => {
      mockGet.mockResolvedValueOnce({ data: ['App\\Entity\\User'] }).mockResolvedValueOnce({ data: { id: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.structure()
      expect(mockGet).toHaveBeenNthCalledWith(1, '/system/entities')
      expect(mockDispatch).toHaveBeenCalledWith('entity/set_entities', ['App\\Entity\\User'])
    })

    it('fetches entities when cache is empty array', async () => {
      mockStoreGetters.entity.entities = []
      mockGet.mockResolvedValueOnce({ data: ['App\\Entity\\User'] }).mockResolvedValueOnce({ data: { id: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.structure()
      expect(mockGet).toHaveBeenCalledWith('/system/entities')
    })

    it('uses cached entities when present and does not fetch list', async () => {
      mockStoreGetters.entity.entities = ['App\\Entity\\User']
      mockStoreGetters.entity.structures = null
      mockGet.mockResolvedValueOnce({ data: { id: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.structure()
      expect(mockGet).not.toHaveBeenCalledWith('/system/entities')
      expect(mockGet).toHaveBeenCalledWith('/system/entities/App\\Entity\\User')
    })

    it('filters by name using backslash pop', async () => {
      mockStoreGetters.entity.entities = ['App\\Entity\\User', 'App\\Entity\\Post']
      mockGet.mockResolvedValueOnce({ data: { id: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.structure()
      expect(mockGet).toHaveBeenCalledWith('/system/entities/App\\Entity\\User')
    })

    it('picks first match when multiple entities share same short name', async () => {
      mockStoreGetters.entity.entities = ['BundleA\\Entity\\User', 'BundleB\\Entity\\User']
      mockGet.mockResolvedValueOnce({ data: { id: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const s = await em.structure()
      expect(mockGet).toHaveBeenCalledWith('/system/entities/BundleA\\Entity\\User')
      expect(mockDispatch).toHaveBeenCalledWith('entity/set_structures', expect.objectContaining({ entity: 'BundleA\\Entity\\User' }))
    })

    it('returns cached structure without second fetch', async () => {
      const cached = { id: { metadata: { type: 'integer' } } }
      mockStoreGetters.entity.entities = ['App\\Entity\\User']
      mockStoreGetters.entity.structures = { 'App\\Entity\\User': cached }
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const out = await em.structure()
      expect(mockGet).not.toHaveBeenCalled()
      expect(out).toEqual(cached)
    })

    it('fetches structure and dispatches when not cached', async () => {
      mockStoreGetters.entity.entities = ['App\\Entity\\User']
      mockStoreGetters.entity.structures = {}
      mockGet.mockResolvedValueOnce({ data: { username: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const out = await em.structure()
      expect(mockGet).toHaveBeenCalledWith('/system/entities/App\\Entity\\User')
      expect(mockDispatch).toHaveBeenCalledWith('entity/set_structures', { entity: 'App\\Entity\\User', structure: { username: {} } })
      expect(out).toEqual({ username: {} })
    })

    it('throws when no entity matches', async () => {
      mockStoreGetters.entity.entities = ['App\\Entity\\Post']
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await expect(em.structure()).rejects.toThrow('No entity was found.')
      expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining('/system/entities/App'))
    })

    it('throws when fetched entities contain no match', async () => {
      mockGet.mockResolvedValueOnce({ data: ['App\\Entity\\Post'] })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await expect(em.structure()).rejects.toThrow('No entity was found.')
    })

    it('handles structures null as cache miss', async () => {
      mockStoreGetters.entity.entities = ['App\\Entity\\User']
      mockStoreGetters.entity.structures = null
      mockGet.mockResolvedValueOnce({ data: { foo: {} } })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.structure()
      expect(mockGet).toHaveBeenCalledWith('/system/entities/App\\Entity\\User')
    })
  })

  describe('CRUD path building', () => {
    it('retrieve builds correct path', async () => {
      mockGet.mockResolvedValue({ data: {} })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.retrieve(1)
      expect(mockGet).toHaveBeenCalledWith('/api/v1/manage/users/1')
      await em.retrieve('abc')
      expect(mockGet).toHaveBeenLastCalledWith('/api/v1/manage/users/abc')
    })

    it('list uses plural with params', async () => {
      mockGet.mockResolvedValue({ data: [] })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.list({ page: 2 })
      expect(mockGet).toHaveBeenCalledWith('/api/v1/manage/users', { params: { page: 2 } })
      await em.list()
      expect(mockGet).toHaveBeenLastCalledWith('/api/v1/manage/users', { params: undefined })
    })

    it('create posts to plural', async () => {
      mockPost.mockResolvedValue({ data: {} })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.create({ name: 'a' })
      expect(mockPost).toHaveBeenCalledWith('/api/v1/manage/users', { name: 'a' })
    })

    it('update puts to plural/pk', async () => {
      mockPut.mockResolvedValue({ data: {} })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.update(5, { name: 'b' })
      expect(mockPut).toHaveBeenCalledWith('/api/v1/manage/users/5', { name: 'b' })
    })

    it('delete deletes plural/pk', async () => {
      mockDelete.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.delete(7)
      expect(mockDelete).toHaveBeenCalledWith('/api/v1/manage/users/7')
    })

    it('respects custom prefix and plural for CRUD', async () => {
      mockGet.mockResolvedValue({ data: {} })
      mockPost.mockResolvedValue({ data: {} })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'User', prefix: '/custom', plural: 'members' })
      await em.list()
      expect(mockGet).toHaveBeenCalledWith('/custom/members', { params: undefined })
      await em.retrieve(1)
      expect(mockGet).toHaveBeenCalledWith('/custom/members/1')
      await em.create({ x: 1 })
      expect(mockPost).toHaveBeenCalledWith('/custom/members', { x: 1 })
    })

    it('handles BlogPost dasherized plural in paths', async () => {
      mockGet.mockResolvedValue({ data: {} })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('BlogPost')
      await em.list()
      expect(mockGet).toHaveBeenCalledWith('/api/v1/manage/blog-posts', { params: undefined })
    })
  })

  describe('deleteMany', () => {
    it('resolves empty array without calling delete', async () => {
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const res = await em.deleteMany([])
      expect(res).toEqual([])
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('resolves all fulfilled when all succeed', async () => {
      mockDelete.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const res = await em.deleteMany([1, 2, 3])
      expect(res.every(r => r.status === 'fulfilled')).toBe(true)
      expect(mockDelete).toHaveBeenCalledTimes(3)
    })

    it('reports partial failure via allSettled', async () => {
      mockDelete.mockResolvedValueOnce({ data: true }).mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const res = await em.deleteMany([1, 2, 3])
      expect(res.map(r => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
    })

    it('all rejected', async () => {
      mockDelete.mockRejectedValue(new Error('fail'))
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      const res = await em.deleteMany([1, 2])
      expect(res.every(r => r.status === 'rejected')).toBe(true)
    })
  })

  describe('batchUpdate', () => {
    it('posts empty records when ids empty', async () => {
      mockPost.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.batchUpdate([], { enabled: true })
      expect(mockPost).toHaveBeenCalledWith('/api/v1/manage/users/batch-update', [], { params: { '@basis': 'id', '@mode': 'update' } })
    })

    it('assembles records with id spread and fixed params', async () => {
      mockPost.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.batchUpdate([1, 2], { enabled: true })
      expect(mockPost).toHaveBeenCalledWith('/api/v1/manage/users/batch-update', [{ id: 1, enabled: true }, { id: 2, enabled: true }], { params: { '@basis': 'id', '@mode': 'update' } })
    })

    it('merges data correctly for multiple fields', async () => {
      mockPost.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage('User')
      await em.batchUpdate([10], { enabled: false, role: 'admin' })
      expect(mockPost).toHaveBeenCalledWith('/api/v1/manage/users/batch-update', [{ id: 10, enabled: false, role: 'admin' }], { params: { '@basis': 'id', '@mode': 'update' } })
    })

    it('uses dasherized plural with custom prefix', async () => {
      mockPost.mockResolvedValue({ data: true })
      const { default: EntityManage } = await import('@/utils/entity')
      const em = new EntityManage({ name: 'BlogPost', prefix: '/custom' })
      await em.batchUpdate([1], { title: 'x' })
      expect(mockPost).toHaveBeenCalledWith('/custom/blog-posts/batch-update', [{ id: 1, title: 'x' }], { params: { '@basis': 'id', '@mode': 'update' } })
    })
  })
})
