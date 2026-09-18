import { describe, it, expect } from 'vitest'
import { mapElementPlusSort, formatSortParam } from '@/easyadmin/core/query/sort-node'

describe('core/query/sort-node', () => {
  describe('mapElementPlusSort', () => {
    it('maps ascending to ASC', () => {
      expect(mapElementPlusSort('name', 'ascending')).toEqual({ field: 'name', dir: 'ASC' })
    })

    it('maps descending to DESC', () => {
      expect(mapElementPlusSort('name', 'descending')).toEqual({ field: 'name', dir: 'DESC' })
    })

    it('returns null for null order', () => {
      expect(mapElementPlusSort('name', null)).toBeNull()
    })

    it('returns null for undefined order', () => {
      expect(mapElementPlusSort('name', undefined)).toBeNull()
    })

    it('returns null for falsy/unknown order', () => {
      expect(mapElementPlusSort('name', '')).toBeNull()
      expect(mapElementPlusSort('name', 'unknown')).toBeNull()
      expect(mapElementPlusSort('name', 'ASC')).toBeNull()
    })
  })

  describe('formatSortParam', () => {
    it('returns empty string for no sorts', () => {
      expect(formatSortParam([])).toBe('')
    })

    it('formats a single sort', () => {
      expect(formatSortParam([{ field: 'name', dir: 'ASC' }])).toBe('entity.name|ASC')
    })

    it('joins multiple sorts with comma-space', () => {
      expect(
        formatSortParam([
          { field: 'name', dir: 'ASC' },
          { field: 'id', dir: 'DESC' }
        ])
      ).toBe('entity.name|ASC, entity.id|DESC')
    })
  })
})
