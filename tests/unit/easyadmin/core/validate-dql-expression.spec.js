import { describe, expect, it } from 'vitest'
import { validateDqlExpression } from '@/easyadmin/core/query/validate-dql-expression'

describe('core/query/validate-dql-expression', () => {
  it('accepts backend-safe getter chains and operators', () => {
    expect(validateDqlExpression(
      'entity.getUser().getName() matches \'Rin\' && entity.getIsDeleted() || entity.getIsSystem()'
    )).toEqual([])
  })

  it('accepts datetime values and null shorthand', () => {
    expect(validateDqlExpression(
      '!entity.getRevokedAt() || entity.getCreatedAt() >= datetime.get("2024-01-01T00:00:00+00:00")'
    )).toEqual([])
  })

  it('flags unsafe entity getter and property paths', () => {
    expect(validateDqlExpression(
      'entity.isDeleted() || entity.hasRoles() || entity.status == \'active\''
    )).toEqual([
      'unsafe-entity-path',
      'unsafe-entity-path',
      'unsafe-entity-path'
    ])
  })

  it('flags word boolean operators', () => {
    expect(validateDqlExpression('entity.getActive() and entity.getEnabled() or entity.getVisible()'))
      .toEqual(['word-operator'])
  })

  it('flags both forms of null equality', () => {
    expect(validateDqlExpression('entity.getDeletedAt() == null || null != entity.getRevokedAt()'))
      .toEqual(['null-equality'])
  })
})
