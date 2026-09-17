import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/request', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/store', () => ({
  __esModule: true,
  default: {
    getters: {
      entity: {
        entities: null,
        structures: null
      }
    },
    dispatch: vi.fn()
  }
}))

import request from '@/utils/request'
import store from '@/store'
import CrudSkeletonAdapter, { CrudSkeletonAdapter as NamedAdapter } from '@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter'

describe('adapters/crudskeleton/CrudSkeletonAdapter', () => {
  beforeEach(() => {
    for (const fn of [request.get, request.post, request.put, request.delete, store.dispatch]) {
      fn.mockReset()
    }
    store.getters.entity.entities = null
    store.getters.entity.structures = null
  })

  it('exposes both default and named exports', () => {
    expect(NamedAdapter).toBe(CrudSkeletonAdapter)
    const em = new CrudSkeletonAdapter('User')
    expect(em.name).toBe('User')
    expect(em.plural).toBe('users')
  })

  it('loads entities and structure from server when cache is empty', async() => {
    request.get
      .mockResolvedValueOnce({ data: ['CommonBundle\\Entity\\User'] })
      .mockResolvedValueOnce({ data: { id: { metadata: { type: 'integer' } } } })

    const em = new CrudSkeletonAdapter('User')
    const structure = await em.structure()

    expect(request.get).toHaveBeenNthCalledWith(1, '/system/entities')
    expect(request.get).toHaveBeenNthCalledWith(2, '/system/entities/CommonBundle\\Entity\\User')
    expect(store.dispatch).toHaveBeenCalledWith('entity/set_entities', ['CommonBundle\\Entity\\User'])
    expect(store.dispatch).toHaveBeenCalledWith('entity/set_structures', expect.objectContaining({ entity: 'CommonBundle\\Entity\\User' }))
    expect(structure).toHaveProperty('id')
  })

  it('uses cached structure when available', async() => {
    store.getters.entity.entities = ['CommonBundle\\Entity\\User']
    store.getters.entity.structures = {
      'CommonBundle\\Entity\\User': {
        id: { metadata: { type: 'integer' } }
      }
    }

    const em = new CrudSkeletonAdapter('User')
    const structure = await em.structure()

    expect(request.get).not.toHaveBeenCalled()
    expect(structure).toEqual(store.getters.entity.structures['CommonBundle\\Entity\\User'])
  })

  it('supports object entity conf with explicit prefix/plural', () => {
    const em = new CrudSkeletonAdapter({ name: 'Specification', prefix: '/api/v1/manage/products/1', plural: 'specifications' })
    expect(em.name).toBe('Specification')
    expect(em.prefix).toBe('/api/v1/manage/products/1')
    expect(em.plural).toBe('specifications')
  })

  it('falls back to defaults for partial object conf', () => {
    const em = new CrudSkeletonAdapter({ name: 'User' })
    expect(em.prefix).toBe('/api/v1/manage')
    expect(em.plural).toBe('users')
  })

  it('throws when no entity matches', async() => {
    request.get.mockResolvedValueOnce({ data: ['CommonBundle\\Entity\\Order'] })
    await expect(new CrudSkeletonAdapter('User').structure()).rejects.toThrow('No entity was found.')
  })

  it('retrieves a single record', async() => {
    request.get.mockResolvedValue({ data: { id: 1 } })
    const res = await new CrudSkeletonAdapter('User').retrieve(1)
    expect(request.get).toHaveBeenCalledWith('/api/v1/manage/users/1')
    expect(res).toEqual({ data: { id: 1 } })
  })

  it('falls back to empty plural path when plural is null', async() => {
    request.get.mockResolvedValue({ data: [] })
    request.post.mockResolvedValue({ data: {} })
    const em = new CrudSkeletonAdapter('User')
    em.plural = null
    await em.list()
    await em.create({})
    expect(request.get).toHaveBeenCalledWith('/api/v1/manage', { params: undefined })
    expect(request.post).toHaveBeenCalledWith('/api/v1/manage', {})
  })

  it('proxies CRUD calls to request utility', async() => {
    request.get.mockResolvedValue({ data: [] })
    request.post.mockResolvedValue({ data: { id: 1 } })
    request.put.mockResolvedValue({ data: { id: 1 } })
    request.delete.mockResolvedValue({ data: true })

    const em = new CrudSkeletonAdapter('User')

    await em.list({ page: 1 })
    await em.create({ username: 'u' })
    await em.update(1, { username: 'u2' })
    await em.delete(1)
    await em.deleteMany([2, 3])

    expect(request.get).toHaveBeenCalledWith('/api/v1/manage/users', { params: { page: 1 } })
    expect(request.post).toHaveBeenCalledWith('/api/v1/manage/users', { username: 'u' })
    expect(request.put).toHaveBeenCalledWith('/api/v1/manage/users/1', { username: 'u2' })
    expect(request.delete).toHaveBeenCalledWith('/api/v1/manage/users/1')
    expect(request.delete).toHaveBeenCalledWith('/api/v1/manage/users/2')
    expect(request.delete).toHaveBeenCalledWith('/api/v1/manage/users/3')
  })

  it('keeps successful deletions when some batch deletions fail', async() => {
    request.delete
      .mockResolvedValueOnce({ data: true })
      .mockRejectedValueOnce(new Error('delete failed'))

    const results = await new CrudSkeletonAdapter('User').deleteMany([1, 2])

    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected'])
  })

  it('sends batch update records with only the changed fields', async() => {
    request.post.mockResolvedValue({ data: true })

    await new CrudSkeletonAdapter('User').batchUpdate([1, 2], { enabled: true })

    expect(request.post).toHaveBeenCalledWith(
      '/api/v1/manage/users/batch-update',
      [{ id: 1, enabled: true }, { id: 2, enabled: true }],
      { params: { '@basis': 'id', '@mode': 'update' } }
    )
  })
})
