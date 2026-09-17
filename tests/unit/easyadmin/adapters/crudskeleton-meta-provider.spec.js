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
import CrudSkeletonMetaProvider, { CrudSkeletonMetaProvider as NamedProvider } from '@/easyadmin/adapters/crudskeleton/CrudSkeletonMetaProvider'

describe('adapters/crudskeleton/CrudSkeletonMetaProvider', () => {
  beforeEach(() => {
    for (const fn of [request.get, store.dispatch]) {
      fn.mockReset()
    }
    store.getters.entity.entities = null
    store.getters.entity.structures = null
  })

  it('exposes both default and named exports', () => {
    expect(NamedProvider).toBe(CrudSkeletonMetaProvider)
  })

  it('fetches entities from server when cache is empty', async() => {
    request.get.mockResolvedValueOnce({ data: ['CommonBundle\\Entity\\User'] })

    const entities = await new CrudSkeletonMetaProvider().listEntities()

    expect(request.get).toHaveBeenCalledWith('/system/entities')
    expect(store.dispatch).toHaveBeenCalledWith('entity/set_entities', ['CommonBundle\\Entity\\User'])
    expect(entities).toEqual(['CommonBundle\\Entity\\User'])
  })

  it('uses cached entities when available', async() => {
    store.getters.entity.entities = ['CommonBundle\\Entity\\User']

    const entities = await new CrudSkeletonMetaProvider().listEntities()

    expect(request.get).not.toHaveBeenCalled()
    expect(entities).toEqual(['CommonBundle\\Entity\\User'])
  })

  it('fetches structure from server when cache misses', async() => {
    request.get.mockResolvedValueOnce({ data: { id: { metadata: { type: 'integer' } } } })

    const structure = await new CrudSkeletonMetaProvider().getStructure('CommonBundle\\Entity\\User')

    expect(request.get).toHaveBeenCalledWith('/system/entities/CommonBundle\\Entity\\User')
    expect(store.dispatch).toHaveBeenCalledWith(
      'entity/set_structures',
      expect.objectContaining({ entity: 'CommonBundle\\Entity\\User' })
    )
    expect(structure).toHaveProperty('id')
  })

  it('uses cached structure when available', async() => {
    store.getters.entity.structures = {
      'CommonBundle\\Entity\\User': { id: { metadata: { type: 'integer' } } }
    }

    const structure = await new CrudSkeletonMetaProvider().getStructure('CommonBundle\\Entity\\User')

    expect(request.get).not.toHaveBeenCalled()
    expect(structure).toEqual(store.getters.entity.structures['CommonBundle\\Entity\\User'])
  })
})
