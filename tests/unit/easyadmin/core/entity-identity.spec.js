import { describe, it, expect } from 'vitest'
import { resolveEntityIdentity } from '@/easyadmin/core/model/entity-identity'

const options = { defaultPrefix: '/api/v1/manage', parameterize: (name) => `${name.toLowerCase()}s` }

describe('core/model/entity-identity', () => {
  it('resolves a string conf with default prefix and parameterized plural', () => {
    expect(resolveEntityIdentity('User', options)).toEqual({
      name: 'User',
      prefix: '/api/v1/manage',
      plural: 'users'
    })
  })

  it('keeps explicit prefix and plural on object conf', () => {
    expect(
      resolveEntityIdentity({ name: 'Stock', prefix: '/api/v1/manage/inventory', plural: 'stocks' }, options)
    ).toEqual({ name: 'Stock', prefix: '/api/v1/manage/inventory', plural: 'stocks' })
  })

  it('falls back to defaults for partial object conf', () => {
    expect(resolveEntityIdentity({ name: 'User' }, options)).toEqual({
      name: 'User',
      prefix: '/api/v1/manage',
      plural: 'users'
    })
  })

  it('falls back on empty-string prefix/plural', () => {
    expect(resolveEntityIdentity({ name: 'User', prefix: '', plural: '' }, options)).toEqual({
      name: 'User',
      prefix: '/api/v1/manage',
      plural: 'users'
    })
  })
})
