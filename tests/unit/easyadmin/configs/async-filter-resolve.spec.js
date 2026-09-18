import { describe, it, expect } from 'vitest'
import { shorthandExpression } from '@/easyadmin/core/query/dql-ops'

// Mirrors the async branch of SearchFilter.filterProcess (no axios, no mount):
//   if (isFunction(field)) {
//     const promise = this.listFilter[key]()
//     if (promise instanceof Promise) {
//       const res = await this.listFilter[key]()
//       field = res
//       transform(res, key)
//     } else throw Error('Async filter must return promise object!')
//   }
async function resolveAsyncFilter(listFilter, key, transform) {
  const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]'
  const field = listFilter[key]
  if (isFunction(field)) {
    const promise = listFilter[key]()
    if (promise instanceof Promise) {
      const res = await listFilter[key]()
      return transform(key, res)
    }
    throw Error('Async filter must return promise object!')
  }
  return transform(key, field)
}

describe('configs async filter factory contract', () => {
  it('resolves a promise factory to a select shorthand with data options', async() => {
    const listFilter = {
      'category.id': () => Promise.resolve({ __label: 'Category', 1: 'Book', 2: 'Paper' })
    }
    const out = await resolveAsyncFilter(listFilter, 'category.id', shorthandExpression)
    expect(out.type).toBe('select')
    expect(out.label).toBe('Category')
    expect(out.data).toEqual([
      { value: '1', label: 'Book' },
      { value: '2', label: 'Paper' }
    ])
    expect(out.expression).toBe("entity.getCategory().getId() == ':value'")
  })

  it('throws when an async factory returns a non-promise', async() => {
    const listFilter = { 'category.id': () => ({ __label: 'Category' }) }
    await expect(
      resolveAsyncFilter(listFilter, 'category.id', shorthandExpression)
    ).rejects.toThrow('Async filter must return promise object!')
  })
})
