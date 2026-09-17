import { describe, it, expect } from 'vitest'
import { cleanBlankAttributes, isUpdateOperation } from '@/easyadmin/application/usecases/save-record'
import { summarizeSettledDeletions } from '@/easyadmin/application/usecases/delete-records'
import { buildRelationListParams } from '@/easyadmin/application/usecases/relation-options'

describe('application/usecases/save-record', () => {
  it('removes null/undefined keys in place', () => {
    const form = { a: 1, b: null, c: undefined, d: '' }
    cleanBlankAttributes(form)
    expect(form).toEqual({ a: 1, d: '' })
  })

  it('recurses into nested objects and arrays of objects', () => {
    const form = { nested: { x: null, y: 2 }, list: [{ z: null, w: 1 }, null, 3] }
    cleanBlankAttributes(form)
    expect(form).toEqual({ nested: { y: 2 }, list: [{ w: 1 }, null, 3] })
  })

  it('decides update vs create by id truthiness', () => {
    expect(isUpdateOperation(5)).toBe(true)
    expect(isUpdateOperation('abc')).toBe(true)
    expect(isUpdateOperation(null)).toBe(false)
    expect(isUpdateOperation(undefined)).toBe(false)
    expect(isUpdateOperation(0)).toBe(false)
  })
})

describe('application/usecases/delete-records', () => {
  it('counts deleted vs failed from settled results', () => {
    expect(
      summarizeSettledDeletions([{ status: 'fulfilled' }, { status: 'rejected' }, { status: 'fulfilled' }])
    ).toEqual({ deleted: 2, failed: 1 })
    expect(summarizeSettledDeletions([])).toEqual({ deleted: 0, failed: 0 })
  })
})

describe('application/usecases/relation-options', () => {
  const base = { '@filter': 'entity.getUsername() matches ":value"' }

  it('merges display/limit and substitutes the remote query', () => {
    expect(buildRelationListParams(base, 'ann')).toEqual({
      '@filter': 'entity.getUsername() matches "ann"',
      '@display': 'reduce',
      limit: 1e10
    })
  })

  it('keeps the base filter untouched without a query', () => {
    expect(buildRelationListParams(base, null)).toEqual({ ...base, '@display': 'reduce', limit: 1e10 })
  })

  it('emits display/limit for empty relation filters', () => {
    expect(buildRelationListParams({}, 'ann')).toEqual({ '@display': 'reduce', limit: 1e10 })
  })

  it('does not mutate the source filter object', () => {
    const source = { ...base }
    buildRelationListParams(source, 'ann')
    expect(source).toEqual(base)
  })
})
