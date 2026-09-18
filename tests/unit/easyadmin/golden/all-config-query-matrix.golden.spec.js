import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n', () => ({ t: key => key }))
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }] }))
  }
}))
vi.mock('@/store', () => ({ default: { getters: {}, dispatch: vi.fn() } }))

import entities from '@/configs/entities'
import golden from './__fixtures__/all-config-query-matrix.golden.json'
import { buildAdminQuery } from '@/easyadmin/application/query/build-admin-query'
import { compileCsqeQuery } from '@/easyadmin/adapters/crudskeleton/CrudSkeletonQueryCompiler'
import CrudSkeletonAdapter from '@/easyadmin/adapters/crudskeleton/CrudSkeletonAdapter'
import { shorthandExpression } from '@/easyadmin/core/query/dql-ops'
import { buildQueryParams, buildUrlSearch } from '@/easyadmin/application/query/url-query-sync'

const realEntries = Object.entries(entities).filter(([name]) => /^[A-Z]/.test(name))

async function filtersFromConfig(config) {
  const fields = config.list?.list_filter || {}
  return Object.fromEntries(await Promise.all(Object.entries(fields).map(async ([key, field]) => {
    const definition = typeof field === 'function' ? await field() : field
    return [key, { expression: shorthandExpression(key, definition).expression }]
  })))
}

describe('golden/all-config-query-matrix', () => {
  it('has exactly one golden row for every real entity configuration', () => {
    expect(golden.map(row => row.entity).sort()).toEqual(realEntries.map(([name]) => name).sort())
  })

  for (const row of golden) {
    it(`matches ${row.entity}`, async () => {
      const config = entities[row.entity]
      expect(Object.keys(row.listFilterData).sort()).toEqual(
        Object.keys(config.list?.list_filter || {}).sort()
      )
      const filters = await filtersFromConfig(config)
      const query = config.list?.query || {}
      const adminQuery = buildAdminQuery({
        entity: row.entity,
        listFilterData: row.listFilterData,
        filters,
        pager: row.pager,
        query,
        sort: query
      })

      expect(adminQuery).toEqual(row.adminQuery)
      expect(compileCsqeQuery({ ...adminQuery, query })).toEqual(row.csqeParams)
      expect(buildUrlSearch(buildQueryParams(row.listFilterData, row.pager))).toEqual(row.urlQueryString)

      const adapter = new CrudSkeletonAdapter(config.entity || row.entity)
      expect({ name: adapter.name, prefix: adapter.prefix, plural: adapter.plural }).toEqual({
        name: row.entity,
        ...row.identity
      })
    })
  }

  it('covers Product isDeleted with the configured DQL getter', () => {
    expect(golden.find(row => row.entity === 'Product').adminQuery.rawFilterParam)
      .toContain('entity.getIsDeleted() == true')
  })
})
