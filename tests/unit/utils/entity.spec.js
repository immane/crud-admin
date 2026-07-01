const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()
const mockDelete = jest.fn()

const mockDispatch = jest.fn()

const mockStore = {
  getters: {
    entity: {
      entities: null,
      structures: null
    }
  },
  dispatch: mockDispatch
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
  default: mockStore
}))

describe('utils/entity.ts', () => {
  beforeEach(() => {
    jest.resetModules()
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDelete.mockReset()
    mockDispatch.mockReset()
    mockStore.getters.entity.entities = null
    mockStore.getters.entity.structures = null
  })

  it('loads entities and structure from server when cache is empty', async() => {
    mockGet
      .mockResolvedValueOnce({ data: ['CommonBundle\\Entity\\User'] })
      .mockResolvedValueOnce({ data: { id: { metadata: { type: 'integer' } } } })

    const { default: EntityManage } = await import('@/utils/entity')
    const em = new EntityManage('User')
    const structure = await em.structure()

    expect(mockGet).toHaveBeenNthCalledWith(1, '/system/entities')
    expect(mockGet).toHaveBeenNthCalledWith(2, '/system/entities/CommonBundle\\Entity\\User')
    expect(mockDispatch).toHaveBeenCalledWith('entity/set_entities', ['CommonBundle\\Entity\\User'])
    expect(mockDispatch).toHaveBeenCalledWith('entity/set_structures', expect.objectContaining({ entity: 'CommonBundle\\Entity\\User' }))
    expect(structure).toHaveProperty('id')
  })

  it('uses cached structure when available', async() => {
    mockStore.getters.entity.entities = ['CommonBundle\\Entity\\User']
    mockStore.getters.entity.structures = {
      'CommonBundle\\Entity\\User': {
        id: { metadata: { type: 'integer' } }
      }
    }

    const { default: EntityManage } = await import('@/utils/entity')
    const em = new EntityManage('User')
    const structure = await em.structure()

    expect(mockGet).not.toHaveBeenCalled()
    expect(structure).toEqual(mockStore.getters.entity.structures['CommonBundle\\Entity\\User'])
  })

  it('proxies CRUD calls to request utility', async() => {
    mockGet.mockResolvedValue({ data: [] })
    mockPost.mockResolvedValue({ data: { id: 1 } })
    mockPut.mockResolvedValue({ data: { id: 1 } })
    mockDelete.mockResolvedValue({ data: true })

    const { default: EntityManage } = await import('@/utils/entity')
    const em = new EntityManage('User')

    await em.list({ page: 1 })
    await em.create({ username: 'u' })
    await em.update(1, { username: 'u2' })
    await em.delete(1)

    expect(mockGet).toHaveBeenCalledWith('/api/v1/manage/users', { params: { page: 1 } })
    expect(mockPost).toHaveBeenCalledWith('/api/v1/manage/users', { username: 'u' })
    expect(mockPut).toHaveBeenCalledWith('/api/v1/manage/users/1', { username: 'u2' })
    expect(mockDelete).toHaveBeenCalledWith('/api/v1/manage/users/1')
  })
})
