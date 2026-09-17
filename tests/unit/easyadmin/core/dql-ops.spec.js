import { describe, it, expect } from 'vitest'
import {
  dottedKeyToExpression,
  shorthandExpression,
  substituteValue,
  shouldIncludeValue,
  joinExpressions
} from '@/easyadmin/core/query/dql-ops'

describe('core/query/dql-ops', () => {
  describe('dottedKeyToExpression', () => {
    it('converts a single key', () => {
      expect(dottedKeyToExpression('name')).toBe('.getName()')
    })

    it('converts dotted keys', () => {
      expect(dottedKeyToExpression('user.username')).toBe('.getUser().getUsername()')
    })

    it('capitalizes only the first letter of each segment', () => {
      expect(dottedKeyToExpression('a.b.c')).toBe('.getA().getB().getC()')
    })
  })

  describe('shorthandExpression', () => {
    it('handles string shorthand as input with matches', () => {
      expect(shorthandExpression('name', 'Name Label')).toEqual({
        data: null,
        type: 'input',
        label: 'Name Label',
        default: null,
        expression: "entity.getName() matches ':value'"
      })
    })

    it('handles null shorthand as input with matches', () => {
      const res = shorthandExpression('name', null)
      expect(res.type).toBe('input')
      expect(res.data).toBeNull()
      expect(res.label).toBe('')
      expect(res.default).toBeNull()
      expect(res.expression).toBe("entity.getName() matches ':value'")
    })

    it('handles object shorthand as select with ==', () => {
      const res = shorthandExpression('status', { 0: 'Pending', 1: 'Paid' })
      expect(res.type).toBe('select')
      expect(res.label).toBe('')
      expect(res.default).toBeNull()
      expect(res.expression).toBe("entity.getStatus() == ':value'")
      expect(res.data).toEqual([
        { value: '0', label: 'Pending' },
        { value: '1', label: 'Paid' }
      ])
    })

    it('supports dotted keys with relations', () => {
      const res = shorthandExpression('user.username', 'Username')
      expect(res.expression).toBe("entity.getUser().getUsername() matches ':value'")
    })

    it('supports __label and __default', () => {
      const res = shorthandExpression('status', {
        __label: 'Status',
        __default: 0,
        0: 'Pending',
        1: 'Paid'
      })
      expect(res.label).toBe('Status')
      expect(res.default).toBe(0)
      expect(res.data).toEqual([
        { value: '0', label: 'Pending' },
        { value: '1', label: 'Paid' }
      ])
    })

    it('handles empty object shorthand', () => {
      const res = shorthandExpression('status', {})
      expect(res.type).toBe('select')
      expect(res.data).toEqual([])
      expect(res.expression).toBe("entity.getStatus() == ':value'")
    })

    it('passes full-style (has expression) through as-is', () => {
      const full = {
        expression: 'entity.getCategory().getId() == ":value"',
        label: 'Category',
        type: 'select',
        data: [{ value: 'book', label: 'Book' }],
        default: 'book'
      }
      expect(shorthandExpression('category', full)).toBe(full)
    })
  })

  describe('substituteValue', () => {
    it('replaces a single occurrence and coerces to string', () => {
      expect(substituteValue("entity.getName() matches ':value'", 'Rin')).toBe(
        "entity.getName() matches 'Rin'"
      )
      expect(substituteValue('entity.getId() == :value', 3)).toBe('entity.getId() == 3')
    })

    it('replaces all occurrences', () => {
      expect(substituteValue(':value - :value', 'x')).toBe('x - x')
    })
  })

  describe('shouldIncludeValue', () => {
    it('includes truthy values', () => {
      expect(shouldIncludeValue('Rin')).toBe(true)
      expect(shouldIncludeValue(1)).toBe(true)
      expect(shouldIncludeValue(true)).toBe(true)
    })

    it('drops falsy values', () => {
      expect(shouldIncludeValue('')).toBe(false)
      expect(shouldIncludeValue(null)).toBe(false)
      expect(shouldIncludeValue(undefined)).toBe(false)
    })
  })

  describe('joinExpressions', () => {
    it('returns base when no expressions', () => {
      expect(joinExpressions(undefined, [])).toBeUndefined()
      expect(joinExpressions('base', [])).toBe('base')
    })

    it('wraps single expression without base', () => {
      expect(joinExpressions(undefined, ['a'])).toBe('(a)')
    })

    it('joins multiple expressions without base', () => {
      expect(joinExpressions(undefined, ['a', 'b'])).toBe('(a) && (b)')
    })

    it('chains onto base', () => {
      expect(joinExpressions('base', ['a', 'b'])).toBe('base && (a) && (b)')
    })

    it('treats empty-string base as absent', () => {
      expect(joinExpressions('', ['a'])).toBe('(a)')
    })
  })
})
