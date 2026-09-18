import { describe, it, expect } from 'vitest'
import { buildAdminQuery } from '@/easyadmin/application/query/build-admin-query'

const filters = {
  name: { expression: `entity.getName() matches ':value'` },
  status: { expression: `entity.getStatus() == ':value'` }
}

describe('application/query/build-admin-query', () => {
  it('returns emptyFilter with defaults for empty input', () => {
    const q = buildAdminQuery({ entity: 'Post' })
    expect(q.entity).toBe('Post')
    expect(q.filter).toEqual({ kind: 'empty' })
    expect(q.sort).toEqual([])
    expect(q.page).toEqual({ page: 1, limit: 20 })
    expect(q.rawSortParam).toBe('')
    expect(q.rawFilterParam).toBeUndefined()
  })

  it('builds a single parenthesized expression', () => {
    const q = buildAdminQuery({ entity: 'Post', listFilterData: { name: 'foo' }, filters })
    expect(q.rawFilterParam).toBe(`(entity.getName() matches 'foo')`)
    expect(q.filter).toEqual({
      kind: 'and',
      children: [{ kind: 'cond', expression: `(entity.getName() matches 'foo')` }]
    })
  })

  it('joins multiple expressions with && and parens', () => {
    const q = buildAdminQuery({
      entity: 'Post',
      listFilterData: { name: 'foo', status: '1' },
      filters
    })
    expect(q.rawFilterParam).toBe(`(entity.getName() matches 'foo') && (entity.getStatus() == '1')`)
  })

  it('merges base @filter with &&', () => {
    const q = buildAdminQuery({
      entity: 'Post',
      listFilterData: { name: 'foo' },
      filters,
      query: { '@filter': 'entity.getId() == 1' }
    })
    expect(q.rawFilterParam).toBe(`entity.getId() == 1 && (entity.getName() matches 'foo')`)
  })

  it('keeps base @filter alone when no expressions', () => {
    const q = buildAdminQuery({
      entity: 'Post',
      listFilterData: {},
      filters,
      query: { '@filter': 'entity.getId() == 1' }
    })
    expect(q.rawFilterParam).toBe('entity.getId() == 1')
    expect(q.filter).toEqual({
      kind: 'and',
      children: [{ kind: 'cond', expression: 'entity.getId() == 1' }]
    })
  })

  it('drops falsy values (0/false locked)', () => {
    const q = buildAdminQuery({
      entity: 'Post',
      listFilterData: { name: 0, status: false, other: '', nil: null, undef: undefined },
      filters: { ...filters, other: { expression: 'x' }, nil: { expression: 'y' }, undef: { expression: 'z' }}
    })
    expect(q.filter).toEqual({ kind: 'empty' })
    expect(q.rawFilterParam).toBeUndefined()
  })

  it('parses a single sort entry', () => {
    const q = buildAdminQuery({ entity: 'Post', sort: { '@order': 'entity.id|DESC' }})
    expect(q.sort).toEqual([{ field: 'id', dir: 'DESC' }])
    expect(q.rawSortParam).toBe('entity.id|DESC')
  })

  it('parses multiple sort entries', () => {
    const q = buildAdminQuery({
      entity: 'Post',
      sort: { '@order': 'entity.name|DESC, entity.id|ASC' }
    })
    expect(q.sort).toEqual([
      { field: 'name', dir: 'DESC' },
      { field: 'id', dir: 'ASC' }
    ])
  })

  it('returns empty sort for missing/empty @order', () => {
    expect(buildAdminQuery({ entity: 'Post' }).sort).toEqual([])
    expect(buildAdminQuery({ entity: 'Post', sort: { '@order': '' }}).sort).toEqual([])
    expect(buildAdminQuery({ entity: 'Post', sort: {}}).rawSortParam).toBe('')
  })

  it('skips keys with no filter definition', () => {
    const q = buildAdminQuery({ entity: 'Post', listFilterData: { unknown: 'x' }, filters })
    expect(q.filter).toEqual({ kind: 'empty' })
    expect(q.rawFilterParam).toBeUndefined()
  })

  it('skips empty/invalid sort segments', () => {
    const q = buildAdminQuery({ entity: 'Post', sort: { '@order': ' , entity.id|DESC,, entity.x|UP, entity.y, entity.z| ASC ' }})
    expect(q.sort).toEqual([{ field: 'id', dir: 'DESC' }, { field: 'z', dir: 'ASC' }])
  })

  it('normalizes the pager', () => {
    expect(buildAdminQuery({ entity: 'Post', pager: { page: 2, limit: 10 }}).page).toEqual({
      page: 2,
      limit: 10
    })
  })
})
