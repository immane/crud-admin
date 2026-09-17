import { describe, it, expect } from 'vitest'
import { normalizePaginator, normalizePage } from '@/easyadmin/core/query/pagination'

describe('core/query/pagination', () => {
  describe('normalizePaginator', () => {
    it('defaults to totalCount 0 for empty input', () => {
      expect(normalizePaginator()).toEqual({ totalCount: 0 })
      expect(normalizePaginator({})).toEqual({ totalCount: 0 })
    })

    it('uses totalCount when present', () => {
      expect(normalizePaginator({ totalCount: 5 })).toEqual({ totalCount: 5 })
    })

    it('coerces string totalCount to number', () => {
      expect(normalizePaginator({ totalCount: '42' })).toEqual({ totalCount: 42 })
    })

    it('falls back to total when totalCount is missing', () => {
      expect(normalizePaginator({ total: 7 })).toEqual({ total: 7, totalCount: 7 })
    })

    it('prefers totalCount over total', () => {
      expect(normalizePaginator({ totalCount: 3, total: 7 })).toEqual({
        totalCount: 3,
        total: 7
      })
    })

    it('falls through nullish totalCount to total', () => {
      expect(normalizePaginator({ totalCount: undefined, total: 9 }).totalCount).toBe(9)
      expect(normalizePaginator({ totalCount: null, total: 9 }).totalCount).toBe(9)
    })

    it('keeps totalCount 0 instead of falling back (?? semantics)', () => {
      expect(normalizePaginator({ totalCount: 0, total: 7 }).totalCount).toBe(0)
    })

    it('preserves extra keys', () => {
      expect(normalizePaginator({ page: 2, total: 4 })).toEqual({
        page: 2,
        total: 4,
        totalCount: 4
      })
    })
  })

  describe('normalizePage', () => {
    it('defaults with no args', () => {
      expect(normalizePage()).toEqual({ page: 1, limit: 20 })
    })

    it('defaults with empty object', () => {
      expect(normalizePage({})).toEqual({ page: 1, limit: 20 })
    })

    it('passes through valid numbers', () => {
      expect(normalizePage({ page: 2, limit: 10 })).toEqual({ page: 2, limit: 10 })
    })

    it('coerces numeric strings', () => {
      expect(normalizePage({ page: '3', limit: '15' })).toEqual({ page: 3, limit: 15 })
    })

    it('falls back on zero / empty / NaN', () => {
      expect(normalizePage({ page: 0, limit: 0 })).toEqual({ page: 1, limit: 20 })
      expect(normalizePage({ page: 'abc', limit: '' })).toEqual({ page: 1, limit: 20 })
      expect(normalizePage({ page: undefined, limit: undefined })).toEqual({ page: 1, limit: 20 })
    })

    it('clamps negatives to minimums', () => {
      // NOTE: -5 / -1 are truthy, so `||` keeps them and Math.max clamps to 1
      expect(normalizePage({ page: -5, limit: -1 })).toEqual({ page: 1, limit: 1 })
    })
  })
})
