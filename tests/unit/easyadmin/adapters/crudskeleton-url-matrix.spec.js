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
import CrudSkeletonAdapter from '@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter'

const DEFAULT_PREFIX = '/api/v1/manage'
const INVENTORY_PREFIX = '/api/v1/manage/inventory'

// Every custom entity identity found in src/configs/collections.
const matrix = [
  { conf: { name: 'Stock', prefix: '/api/v1/manage/inventory', plural: 'stocks' }, url: `${INVENTORY_PREFIX}/stocks` },
  { conf: { name: 'Material', prefix: '/api/v1/manage/inventory', plural: 'materials' }, url: `${INVENTORY_PREFIX}/materials` },
  { conf: { name: 'SpecificationRecipe', prefix: '/api/v1/manage/inventory', plural: 'recipes' }, url: `${INVENTORY_PREFIX}/recipes` },
  { conf: { name: 'Store', plural: 'stores' }, url: `${DEFAULT_PREFIX}/stores` },
  { conf: { name: 'StoreOrder', plural: 'store-orders' }, url: `${DEFAULT_PREFIX}/store-orders` },
  { conf: { name: 'Transaction', plural: 'transactions' }, url: `${DEFAULT_PREFIX}/transactions` },
  { conf: { name: 'PaymentDeduction', plural: 'payment-deductions' }, url: `${DEFAULT_PREFIX}/payment-deductions` },
  { conf: { name: 'AuditLog', plural: 'audit-logs' }, url: `${DEFAULT_PREFIX}/audit-logs` },
  { conf: { name: 'RoleFieldGrant', plural: 'role-field-grants' }, url: `${DEFAULT_PREFIX}/role-field-grants` },
  { conf: { name: 'Assignment', plural: 'assignments' }, url: `${DEFAULT_PREFIX}/assignments` },
  { conf: { name: 'Role', plural: 'roles' }, url: `${DEFAULT_PREFIX}/roles` },
  { conf: { name: 'Permission', plural: 'permissions' }, url: `${DEFAULT_PREFIX}/permissions` },
  // User-spec nested entity conf (SpecificationManager in trade/Product.jsx).
  { conf: { name: 'Specification', prefix: '/api/v1/manage/products/1', plural: 'specifications' }, url: '/api/v1/manage/products/1/specifications' }
]

describe('adapters/crudskeleton URL matrix (entity configs)', () => {
  beforeEach(() => {
    for (const fn of [request.get, request.post, request.put, request.delete, store.dispatch]) {
      fn.mockReset()
    }
    store.getters.entity.entities = null
    store.getters.entity.structures = null
    request.get.mockResolvedValue({ data: [] })
  })

  it.each(matrix)('list() hits $url', async({ conf, url }) => {
    await new CrudSkeletonAdapter(conf).list()
    expect(request.get).toHaveBeenCalledWith(url, { params: undefined })
  })

  it('retrieves through the custom inventory prefix (Stock)', async() => {
    request.get.mockResolvedValue({ data: { id: 'a' }})
    await new CrudSkeletonAdapter({ name: 'Stock', prefix: '/api/v1/manage/inventory', plural: 'stocks' }).retrieve('a')
    expect(request.get).toHaveBeenCalledWith(`${INVENTORY_PREFIX}/stocks/a`)
  })

  it('posts batchUpdate through the StoreOrder URL', async() => {
    request.post.mockResolvedValue({ data: true })
    await new CrudSkeletonAdapter({ name: 'StoreOrder', plural: 'store-orders' }).batchUpdate([1, 2], { operationalStatus: 'accepted' })
    expect(request.post).toHaveBeenCalledWith(
      `${DEFAULT_PREFIX}/store-orders/batch-update`,
      [{ id: 1, operationalStatus: 'accepted' }, { id: 2, operationalStatus: 'accepted' }],
      { params: { '@basis': 'id', '@mode': 'update' }}
    )
  })
})
