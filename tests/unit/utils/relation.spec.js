import { relationLabel, resolveRelation } from '@/utils/relation-descriptor'

const entities = { User: {}, Store: {}}

describe('utils/relation', () => {
  it('keeps conventional metadata relations keyed by id', () => {
    expect(resolveRelation(
      { property: 'role' },
      { metadata: { type: 'ManyToOne', targetEntity: 'App\\Entity\\Role' }},
      { Role: {}}
    )).toMatchObject({ name: 'Role', valueKey: 'id', multiple: false })
  })

  it('infers registered singular UUID relation fields', () => {
    expect(resolveRelation({ property: 'userUuid' }, {}, entities))
      .toMatchObject({ name: 'User', valueKey: 'uuid', multiple: false })
  })

  it('infers registered multi-value UUID relation fields', () => {
    expect(resolveRelation({ property: 'userUuids' }, {}, entities))
      .toMatchObject({ name: 'User', valueKey: 'uuid', multiple: true })
  })

  it('does not infer unknown or polymorphic UUID fields', () => {
    expect(resolveRelation({ property: 'actorUuid' }, {}, entities)).toBeNull()
    expect(resolveRelation({ property: 'uuid' }, {}, entities)).toBeNull()
  })

  it('uses explicit relation settings ahead of suffix inference', () => {
    expect(resolveRelation({
      property: 'scopeUuid',
      relation: { entity: { name: 'Store', plural: 'stores', prefix: '/api/v1/manage' }, valueKey: 'uuid' }
    }, {}, entities)).toEqual({
      name: 'Store',
      plural: 'stores',
      prefix: '/api/v1/manage',
      valueKey: 'uuid',
      multiple: false
    })
  })

  it('allows explicit id values for fields with a UUID suffix', () => {
    expect(resolveRelation({
      property: 'legacyUserUuid',
      relation: { entity: 'User', valueKey: 'id' }
    }, {}, entities)).toMatchObject({ name: 'User', valueKey: 'id' })
  })

  it('uses user identifiers when an API response omits __toString', () => {
    expect(relationLabel({ id: 1, username: 'alice' })).toBe('alice')
  })
})
