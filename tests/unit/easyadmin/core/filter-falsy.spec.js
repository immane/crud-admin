import { describe, it, expect } from 'vitest'
import { emptyFilter, andFilter, cond } from '@/easyadmin/core/query/filter-node'
import { shouldIncludeValue, joinExpressions, substituteValue } from '@/easyadmin/core/query/dql-ops'

describe('core/query/filter-node', () => {
  it('creates an empty filter', () => {
    expect(emptyFilter()).toEqual({ kind: 'empty' })
  })

  it('creates a condition', () => {
    expect(cond("(entity.getName() matches 'Rin')")).toEqual({
      kind: 'cond',
      expression: "(entity.getName() matches 'Rin')"
    })
  })

  it('creates an and filter with children', () => {
    const children = [cond('(a)'), cond('(b)')]
    expect(andFilter(children)).toEqual({ kind: 'and', children })
  })

  it('maps empty children to empty (no empty AND)', () => {
    expect(andFilter([])).toEqual({ kind: 'empty' })
  })
})

describe('core/query/filter-falsy semantics (legacy `if (value)` guard)', () => {
  it('drops 0 explicitly', () => {
    expect(shouldIncludeValue(0)).toBe(false)
  })

  it('drops false explicitly', () => {
    expect(shouldIncludeValue(false)).toBe(false)
  })

  it('drops empty string / null / undefined', () => {
    expect(shouldIncludeValue('')).toBe(false)
    expect(shouldIncludeValue(null)).toBe(false)
    expect(shouldIncludeValue(undefined)).toBe(false)
    expect(shouldIncludeValue(NaN)).toBe(false)
  })

  it('keeps truthy values', () => {
    expect(shouldIncludeValue('Rin')).toBe(true)
    expect(shouldIncludeValue(42)).toBe(true)
    expect(shouldIncludeValue(true)).toBe(true)
    expect(shouldIncludeValue({})).toBe(true)
    expect(shouldIncludeValue([])).toBe(true)
  })

  it('joins substituted expressions with base/empty paren wrapping', () => {
    const expr = substituteValue("entity.getName() matches ':value'", 'Rin')
    // no base, single expression
    expect(joinExpressions(undefined, [expr])).toBe(`(${expr})`)
    // with base
    expect(joinExpressions('base-filter', [expr])).toBe(`base-filter && (${expr})`)
    // empty expressions keep base / undefined
    expect(joinExpressions('base-filter', [])).toBe('base-filter')
    expect(joinExpressions(undefined, [])).toBeUndefined()
  })
})
