import { describe, it, expect } from 'vitest'
import { compileCsqeQuery } from '@/easyadmin/adapters/crudskeleton/CrudSkeletonQueryCompiler'

describe('adapters/crudskeleton/CrudSkeletonQueryCompiler', () => {
  it('returns {} for empty input', () => {
    expect(compileCsqeQuery({})).toEqual({})
  })

  it('compiles a single filter expression to @filter', () => {
    expect(
      compileCsqeQuery({
        filter: { kind: 'and', children: [{ expression: 'entity.name = foo' }] }
      })
    ).toEqual({ '@filter': 'entity.name = foo' })
  })

  it('uses children[0].expression for multi-child and filters', () => {
    expect(
      compileCsqeQuery({
        filter: {
          kind: 'and',
          children: [{ expression: 'entity.name = foo AND entity.id > 1' }]
        }
      })
    ).toEqual({ '@filter': 'entity.name = foo AND entity.id > 1' })
  })

  it('prefers rawFilterParam over the filter object', () => {
    expect(
      compileCsqeQuery({
        rawFilterParam: 'entity.enabled = true',
        filter: { kind: 'and', children: [{ expression: 'entity.name = foo' }] }
      })
    ).toEqual({ '@filter': 'entity.enabled = true' })
  })

  it('merges the base query with the compiled filter', () => {
    expect(
      compileCsqeQuery({
        query: { expand: 'true' },
        filter: { kind: 'and', children: [{ expression: 'entity.name = foo' }] }
      })
    ).toEqual({ expand: 'true', '@filter': 'entity.name = foo' })
  })

  it('passes rawSortParam through as @order', () => {
    expect(
      compileCsqeQuery({ rawSortParam: 'entity.name|ASC' })
    ).toEqual({ '@order': 'entity.name|ASC' })
  })

  it('omits @order when rawSortParam is empty', () => {
    expect(compileCsqeQuery({ rawSortParam: '' })).toEqual({})
  })

  it('falls back to the sort array via formatSortParam', () => {
    expect(
      compileCsqeQuery({
        sort: [
          { field: 'name', dir: 'ASC' },
          { field: 'id', dir: 'DESC' }
        ]
      })
    ).toEqual({ '@order': 'entity.name|ASC, entity.id|DESC' })
  })

  it('preserves a base @sort without creating it from UI sort state', () => {
    expect(
      compileCsqeQuery({
        query: { '@sort': 'legacy-comparator' },
        rawSortParam: 'entity.name|ASC'
      })
    ).toEqual({
      '@sort': 'legacy-comparator',
      '@order': 'entity.name|ASC'
    })
    expect(compileCsqeQuery({ sort: [{ field: 'id', dir: 'DESC' }] }))
      .toEqual({ '@order': 'entity.id|DESC' })
  })

  it('merges a numeric pager', () => {
    expect(
      compileCsqeQuery({ page: { page: 2, limit: 20 } })
    ).toEqual({ page: 2, limit: 20 })
  })

  it('compiles a plain string filter to @filter', () => {
    expect(compileCsqeQuery({ filter: 'entity.name = foo' })).toEqual({ '@filter': 'entity.name = foo' })
  })

  it('omits @filter for empty string filter', () => {
    expect(compileCsqeQuery({ filter: '' })).toEqual({})
  })

  it('omits @filter for empty and-children', () => {
    expect(compileCsqeQuery({ filter: { kind: 'and', children: [] } })).toEqual({})
    expect(compileCsqeQuery({ filter: { kind: 'and', children: [{ expression: '' }] } })).toEqual({})
    expect(compileCsqeQuery({ filter: { kind: 'empty' } })).toEqual({})
  })

  it('passes through a pre-compiled sort object dropping empty values', () => {
    expect(compileCsqeQuery({ sort: { '@order': 'entity.id|DESC', '@filter': '' } })).toEqual({ '@order': 'entity.id|DESC' })
    expect(compileCsqeQuery({ sort: { '@order': '' } })).toEqual({})
  })

  it('omits non-numeric pager parts', () => {
    expect(compileCsqeQuery({ page: {} })).toEqual({})
    expect(compileCsqeQuery({ page: { page: '2', limit: '20' } })).toEqual({})
  })

  it('handles nullish input and expression-less children', () => {
    expect(compileCsqeQuery(null)).toEqual({})
    expect(compileCsqeQuery(undefined)).toEqual({})
    expect(compileCsqeQuery({ filter: { kind: 'and', children: [{}] } })).toEqual({})
    // eslint-disable-next-line no-sparse-arrays
    expect(compileCsqeQuery({ filter: { kind: 'and', children: [,] } })).toEqual({})
  })

  it('applies precedence query < filter < pager < sort like Object.assign', () => {
    expect(
      compileCsqeQuery({
        query: { '@filter': 'base', '@order': 'base', page: '1', limit: '5' },
        rawFilterParam: 'entity.name = foo',
        page: { page: 2, limit: 10 },
        rawSortParam: 'entity.id|DESC'
      })
    ).toEqual({
      '@filter': 'entity.name = foo',
      '@order': 'entity.id|DESC',
      page: 2,
      limit: 10
    })
  })
})
