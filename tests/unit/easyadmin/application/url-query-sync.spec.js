import { describe, it, expect } from 'vitest'
import {
  buildQueryParams,
  applyQueryParams,
  buildUrlSearch
} from '@/easyadmin/application/query/url-query-sync'

describe('application/query/url-query-sync', () => {
  describe('buildQueryParams', () => {
    it('omits everything for empty filter data and default pager', () => {
      expect(buildQueryParams({}, { page: 1, limit: 20 })).toEqual({})
    })

    it('stringifies page/limit only when non-default', () => {
      expect(buildQueryParams({}, { page: 2, limit: 20 })).toEqual({ page: '2' })
      expect(buildQueryParams({}, { page: 1, limit: 10 })).toEqual({ limit: '10' })
      expect(buildQueryParams({}, { page: 3, limit: 50 })).toEqual({ page: '3', limit: '50' })
    })

    it('skips null/undefined/empty-string filter values', () => {
      expect(
        buildQueryParams({ a: null, b: undefined, c: '', d: 'x' }, { page: 1, limit: 20 })
      ).toEqual({ d: 'x' })
    })

    it('keeps 0/false (!= null && !== "" semantics) and stringifies values', () => {
      expect(buildQueryParams({ n: 0, b: false, s: 42 }, { page: 1, limit: 20 })).toEqual({
        n: '0',
        b: 'false',
        s: '42'
      })
    })
  })

  describe('applyQueryParams', () => {
    it('returns defaults and empty filterData for empty query', () => {
      expect(applyQueryParams({})).toEqual({ filterData: {}, pager: { page: 1, limit: 20 } })
    })

    it('routes non-page/limit keys to filterData', () => {
      expect(applyQueryParams({ name: 'foo', status: '1' })).toEqual({
        filterData: { name: 'foo', status: '1' },
        pager: { page: 1, limit: 20 }
      })
    })

    it('parses numeric page/limit strings', () => {
      expect(applyQueryParams({ page: '3', limit: '15' })).toEqual({
        filterData: {},
        pager: { page: 3, limit: 15 }
      })
    })

    it('falls back on invalid page/limit values', () => {
      expect(applyQueryParams({ page: 'abc', limit: '' })).toEqual({
        filterData: {},
        pager: { page: 1, limit: 20 }
      })
      expect(applyQueryParams({ page: 0, limit: 0 })).toEqual({
        filterData: {},
        pager: { page: 1, limit: 20 }
      })
    })

    it('clamps negatives to minimums', () => {
      expect(applyQueryParams({ page: '-5', limit: '-1' })).toEqual({
        filterData: {},
        pager: { page: 1, limit: 1 }
      })
    })

    it('returns new objects without mutating the input', () => {
      const query = { page: '2', name: 'foo' }
      const result = applyQueryParams(query)
      expect(result.pager).toEqual({ page: 2, limit: 20 })
      expect(result.filterData).toEqual({ name: 'foo' })
      expect(query).toEqual({ page: '2', name: 'foo' })
      expect(result.filterData).not.toBe(query)
    })
  })

  describe('buildUrlSearch', () => {
    it('returns empty string for empty params', () => {
      expect(buildUrlSearch({})).toBe('')
    })

    it('serializes params like syncToUrl', () => {
      expect(buildUrlSearch({ name: 'foo', page: '2' })).toBe('name=foo&page=2')
    })
  })
})
